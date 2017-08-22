import { createAction, handleActions } from 'redux-actions'
import { fork, put, select, spawn, takeEvery, takeLatest, throttle } from 'redux-saga/effects'
import { createSelector, defaultMemoize, createSelectorCreator, createStructuredSelector } from 'reselect'
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
    throw new Error('Enhanced target must be a generator function.')
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
const enhancedForkWithoutOnError = enhancibleForkerThunks['fork'](enhanceThunk(null))
const toForkEffect = (value, msg) => {
  if (isGeneratorFunction(value)) return enhancedForkWithoutOnError(value)
  if (isForkEffect(value)) return value
  throw new Error(msg)
}

const createModuleWithApp = (
  moduleName,
  definitions,
  defaultState,
  options,
  appName,
) => {

  const prefix = appName ? `@@${appName}/` : ''
  const reducerMap = {}
  const actions = {}
  const actionCreators = {}
  const sagas = {}
  const selectors = { selectModule: state => state[moduleName] }

  if (isNormalFunction(options.selectorFactory)) {
    Object.assign(selectors, options.selectorFactory({ selectModule: selectors.selectModule, createSelector, defaultMemoize, createSelectorCreator, createStructuredSelector }))
    for (const [key, value] of Object.entries(selectors)) {
      if (!isNormalFunction(value)) throw new Error(`Invalid selector entry ${key}: It must be a function.`)
      value.effect = (...args) => select(value, ...args)
    }
  } else if (options.selectorFactory) {
    throw new Error('Invalid option selectorFactory: It must be a function that returns selector definitions.')
  } else {
    selectors.selectModule.effect = (...args) => select(selectors.selectModule, ...args)
  }

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
        ...selectors,
      })
      sagas[camelType] = toForkEffect(returnValue,
        `Invalid saga for action ${actionType}: Non-generator function must return one of them: \n` +
        '  - generator function (=> automatically invoked by enhanced fork())\n' +
        '  - redux-saga FORK effect',
      )
    } else if (isForkEffect(saga)) {
      sagas[camelType] = saga
    } else if (saga) {
      throw new Error(
        `Invalid saga for action ${actionType}: It must be specified as one of them: \n` +
        '  - generator function (=> automatically invoked by enhanced takeEvery())\n' +
        '  - thunk that returns generator function (=> automatically invoked by enhanced fork())\n' +
        '  - thunk that returns redux-saga FORK effect\n' +
        '  - redux-saga FORK effect'
      )
    }
  }

  for (const [type, saga] of Object.entries(options.sagas || {})) {
    if (isGeneratorFunction(saga)) {
      sagas[type] = fork(enhanceThunk(null)(saga))
    } else if (isNormalFunction(saga)) {
      const enhance = enhanceThunk(null)
      const returnValue = saga({
        ...actions,
        ...mapValues(enhancibleForkerThunks, value => value(enhance)),
        enhance,
        ...selectors,
      })
      sagas[type] = toForkEffect(returnValue,
        `Invalid additional saga ${type}: Non-generator function must return one of them: \n` +
        '  - generator function (=> automatically invoked by enhanced fork())\n' +
        '  - redux-saga FORK effect'
      )
    } else if (isForkEffect(saga)) {
      sagas[type] = saga
    } else if (saga) {
      throw new Error(
        `Invalid additional saga ${type}: It must be specified as one of them: \n` +
        '  - generator function (=> automatically invoked by enhanced fork())\n' +
        '  - thunk that returns generator function (=> automatically invoked by enhanced fork())\n' +
        '  - thunk that returns redux-saga FORK effect\n' +
        '  - redux-saga FORK effect'
      )
    }
  }

  return {
    [moduleName]: handleActions(reducerMap, defaultState),
    sagas,
    ...actionCreators,
    ...actions,
    ...selectors,
  }
}

export const createModule = (moduleName, definitions, defaultState = {}, options = {}) => createModuleWithApp(moduleName, definitions, defaultState, options)
export const createApp = appName => (moduleName, definitions, defaultState = {}, options = {}) => createModuleWithApp(moduleName, definitions, defaultState, options, appName)

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
    throw new Error('Invalid saga: The value must be a redux-saga FORK effect.')
  }
  for (const arg of [saga.FORK.fn, ...saga.FORK.args]) {
    if (isGeneratorFunction(arg)) return arg
  }
  throw new Error('Invalid saga: Generator function not found.')
}
export const retrieveWorkers = sagas => mapValues(sagas, retrieveWorker)
