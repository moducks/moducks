import { createActions, handleActions } from 'redux-actions'
import { takeEvery, takeLatest, throttle, fork, spawn, put } from 'redux-saga/effects'

const isGenerator = obj => {
  return obj && 'function' == typeof obj.next && 'function' == typeof obj.throw
}

const isGeneratorFunction = obj => {
  if (!obj || !obj.constructor) return false
  if ('GeneratorFunction' === obj.constructor.name || 'GeneratorFunction' === obj.constructor.displayName) return true
  return isGenerator(obj.constructor.prototype)
}

const isNormalFunction = obj => {
  if (!obj || !obj.constructor) return false
  return 'Function' === obj.constructor.name || 'Function' === obj.constructor.displayName
}

const isForkEffect = obj => {
  return obj && obj['@@redux-saga/IO'] && obj['FORK']
}

const enhancibleForkEffectThunks = {
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
    const result = isGeneratorFunction(onError) ? (yield* onError(e)) : onError(e)
    if (result !== undefined) {
      yield put(result)
    }
  }
}

export const createModule = (
  moduleName,
  definitions,
  defaultState,
) => {

  const identityActions = []
  const actionMap = {}
  const reducerMap = {}
  const sagas = {}

  for (const [type, definition] of Object.entries(definitions)) {

    const actionType = `${moduleName}/${type}`
    const {
      creator,
      reducer,
      saga,
      onError,
    } = typeof definition === 'function' ? { reducer: definition } : definition

    creator ? (actionMap[actionType] = creator) : identityActions.push(actionType)
    reducer && (reducerMap[actionType] = reducer)

    if (isGeneratorFunction(saga)) {

      sagas[type] = takeEvery(actionType, enhanceThunk(onError)(saga))

    } else if (isNormalFunction(saga)) {

      const enhance = enhanceThunk(onError)
      const returnValue = saga({
        type: actionType,
        ...Object
          .entries(enhancibleForkEffectThunks)
          .reduce((prev, [key, value]) => ({ ...prev, [key]: value(enhance) }), {}),
        enhance,
      })
      if (isGeneratorFunction(returnValue)) {
        sagas[type] = fork(returnValue)
      } else if (isForkEffect(returnValue)) {
        sagas[type] = returnValue
      } else {
        throw new Error('Invalid saga: Non-generator function must return generator function or redux-saga FORK effect.')
      }

    } else if (saga) {

      throw new Error('Invalid saga: Saga must be specified as generator function or thunk that returns either redux-saga FORK effect or generator function.')

    }

  }

  return {
    [moduleName]: handleActions(reducerMap, defaultState),
    ...Object.keys(sagas).length && { sagas },
    ...Object
      .entries(createActions(actionMap, ...identityActions))
      .reduce((prev, [key, value]) => ({ ...prev, [key.slice(`${moduleName}/`.length)]: value }), {}),
    ...Object
      .keys(definitions)
      .reduce((prev, key) => ({ ...prev, [key]: `${moduleName}/${key}` }), {})
  }
}

