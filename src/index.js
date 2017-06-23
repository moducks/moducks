import { createAction, handleActions } from 'redux-actions'
import camelCase from 'redux-actions/lib/camelCase'
import { takeEvery, takeLatest, throttle, fork, spawn, put } from 'redux-saga/effects'

const IO = '@@redux-saga/IO'

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

const enhancibleForkerThunks = {
  takeEvery: enhance => (patternOrChannel, worker, ...args) => takeEvery(patternOrChannel, enhance(worker), ...args),
  takeLatest: enhance => (patternOrChannel, worker, ...args) => takeLatest(patternOrChannel, enhance(worker), ...args),
  throttle: enhance => (ms, pattern, worker, ...args) => throttle(ms, pattern, enhance(worker), ...args),
  fork: enhance => (fn, ...args) => fork(enhance(fn), ...args),
  spawn: enhance => (fn, ...args) => spawn(enhance(fn), ...args),
}

const enhanceThunk = onError => saga => function* (...args) {
  if (!isGeneratorFunction(saga)) {
    throw new Error('Enhanced target must be generator function.')
  }
  try {
    const result = yield* saga(...args)
    if (result !== undefined) {
      yield put(result)
    }
  } catch (e) {
    if (!onError) {
      throw e
    }
    const result = isGeneratorFunction(onError) ? (yield* onError(e, ...args)) : onError(e, ...args)
    if (result !== undefined) {
      yield put(result)
    }
  }
}

const createModuleWithApp = (
  moduleName,
  definitions,
  defaultState,
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
    actionCreators[camelType] = createAction(actionType, ...(Array.isArray(creator) ? creator : [ creator ]))

    if (isGeneratorFunction(saga)) {

      sagas[camelType] = takeEvery(actionType, enhanceThunk(onError)(saga))

    } else if (isNormalFunction(saga)) {

      const enhance = enhanceThunk(onError)
      const returnValue = saga({
        type: actionType,
        ...Object
          .entries(enhancibleForkerThunks)
          .reduce((prev, [key, value]) => ({ ...prev, [key]: value(enhance) }), {}),
        enhance,
      })
      if (isGeneratorFunction(returnValue)) {
        sagas[camelType] = fork(returnValue)
      } else if (isForkEffect(returnValue)) {
        sagas[camelType] = returnValue
      } else {
        throw new Error('Invalid saga: Non-generator function must return generator function or redux-saga FORK effect.')
      }

    } else if (saga) {

      throw new Error('Invalid saga: Saga must be specified as generator function or thunk that returns either redux-saga FORK effect or generator function.')

    }

  }

  return {
    [moduleName]: handleActions(reducerMap, defaultState),
    sagas,
    ...actionCreators,
    ...actions,
  }
}

export const createModule = (moduleName, definitions, defaultState) => createModuleWithApp(moduleName, definitions, defaultState)
export const createApp = appName => (moduleName, definitions, defaultState) => createModuleWithApp(moduleName, definitions, defaultState, appName)

export const flattenSagas = (...sagas) => {

  const storage = []
  const stack = sagas

  while (stack.length) {
    const item = stack.shift()
    if (typeof item !== 'object' || item === null) continue
    if (item[IO]) storage.push(item)
    stack.unshift(...Object.values(item))
  }

  return storage
}
