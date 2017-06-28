import { createAction, handleActions } from 'redux-actions'
import { fork, put, select, spawn, takeEvery, takeLatest, throttle } from 'redux-saga/effects'
import camelCase from 'redux-actions/lib/camelCase'

const IO = '@@redux-saga/IO'

const mapValues = (obj, f) => Object.entries(obj).reduce((prev, [key, value]) => ({ ...prev, [key]: f(value) }), {})

const isGenerator = obj => obj && typeof obj.next === 'function' && typeof obj.throw === 'function'
const isGeneratorFunction = obj => {
  if (!obj || !obj.constructor) return false
  if (obj.constructor.name === 'GeneratorFunction' || obj.constructor.displayName === 'GeneratorFunction') return true
  return isGenerator(obj.constructor.prototype)
}
const isNormalFunction = obj => {
  if (!obj || !obj.constructor) return false
  return obj.constructor.name === 'Function' || obj.constructor.displayName === 'Function'
}

const isForkEffect = obj => obj && obj[IO] && obj.FORK
const toForkEffect = (value, msg) => {
  if (isGeneratorFunction(value)) return fork(value)
  if (isForkEffect(value)) return value
  throw new Error(msg)
}

const enhancibleForkerThunks = {
  takeEvery: enhance => (patternOrChannel, worker, ...args) => takeEvery(patternOrChannel, enhance(worker), ...args),
  takeLatest: enhance => (patternOrChannel, worker, ...args) => takeLatest(patternOrChannel, enhance(worker), ...args),
  throttle: enhance => (ms, pattern, worker, ...args) => throttle(ms, pattern, enhance(worker), ...args),
  fork: enhance => (fn, ...args) => fork(enhance(fn), ...args),
  spawn: enhance => (fn, ...args) => spawn(enhance(fn), ...args),
}
const putYields = function* (g) {
  let { value, done } = g.next()
  while (!done) {
    if (!value || !value[IO]) {
      value = put(value)
    }
    ({ value, done } = g.next(yield value))
  }
  return value
}
const putReturn = function* (value) {
  if (value !== undefined) {
    yield put(value)
  }
}
const enhanceThunk = onError => saga => function* (...args) {
  if (!isGeneratorFunction(saga)) {
    throw new Error('Enhanced target must be generator function.')
  }
  try {
    yield* putReturn(yield* putYields(saga(...args)))
  } catch (e) {
    if (!onError) throw e
    yield* putReturn(
      isGeneratorFunction(onError)
      ? yield* putYields(onError(e, ...args))
      : onError(e, ...args)
    )
  }
}

const createModuleWithApp = (
  moduleName,
  definitions,
  defaultState,
  additionalSagas,
  appName,
) => {

  const prefix = appName ? `@@${appName}/` : ''
  const reducerMap = {}
  const actions = {}
  const actionCreators = {}
  const sagas = {}

  for (const [type, definition] of Object.entries(definitions)) {

    const actionType = `${prefix}${moduleName}/${type}`
    const camelType = camelCase(type)
    const {
      creator,
      reducer,
      saga,
      onError,
    } = typeof definition === 'function' ? { reducer: definition } : definition

    reducer && (reducerMap[actionType] = reducer)
    actions[type] = actionType
    actionCreators[camelType] = createAction(actionType, ...Array.isArray(creator) ? creator : [ creator ])

    if (isGeneratorFunction(saga)) {
      sagas[camelType] = takeEvery(actionType, enhanceThunk(onError)(saga))
    } else if (isNormalFunction(saga)) {
      const enhance = enhanceThunk(onError)
      const returnValue = saga({
        type: actionType,
        ...mapValues(enhancibleForkerThunks, value => value(enhance)),
        enhance,
      })
      sagas[camelType] = toForkEffect(returnValue, 'Invalid saga: Non-generator function must return generator function or redux-saga FORK effect.')
    } else if (saga) {
      throw new Error('Invalid saga: Saga must be specified as generator function or thunk that returns either redux-saga FORK effect or generator function.')
    }
  }

  for (const [camelType, saga] of Object.entries(additionalSagas)) {
    sagas[camelType] = toForkEffect(saga, 'Invalid saga: Each of additional sagas must be generator function or redux-saga FORK effect.')
  }

  return {
    [moduleName]: handleActions(reducerMap, defaultState),
    sagas,
    selectModule: () => select(state => state[moduleName]),
    ...actionCreators,
    ...actions,
  }
}

export const createModule = (moduleName, definitions, defaultState, additionalSagas = {}) => createModuleWithApp(moduleName, definitions, defaultState, additionalSagas)
export const createApp = appName => (moduleName, definitions, defaultState, additionalSagas = {}) => createModuleWithApp(moduleName, definitions, defaultState, additionalSagas, appName)

export const flattenSagas = (...sagas) => {
  const storage = []
  while (sagas.length) {
    const saga = sagas.shift()
    if (typeof saga !== 'object' || saga === null) continue
    if (saga[IO]) storage.push(saga)
    sagas.unshift(...Object.values(saga))
  }
  return storage
}

export const retrieveWorker = saga => {
  if (!isForkEffect(saga)) {
    throw new Error('Invalid saga: The value must be redux-saga FORK effect.')
  }
  for (const arg of [saga.FORK.fn, ...saga.FORK.args]) {
    if (isGeneratorFunction(arg)) return arg
  }
  throw new Error('Invalid saga: GeneratorFunction not found.')
}
export const retrieveWorkers = sagas => mapValues(sagas, retrieveWorker)
