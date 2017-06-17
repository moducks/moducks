import { createActions, handleActions } from 'redux-actions'
import { takeEvery, takeLatest, put } from 'redux-saga/effects'

const helpers = {
  takeEvery,
  takeLatest
}

const defaultOptions = {
  useHelper: true,
  helper: 'takeEvery'
}

export const createModule = (
  moduleName,
  definitions,
  defaultState
) => {
  const identityActions = []
  const actionMap = {}
  const reducerMap = {}
  const sagas = []

  for (const [type, definition] of Object.entries(definitions)) {
    const actionType = `${moduleName}/${type}`
    const {
      creator,
      reducer,
      saga,
      onError,
      options: {
        helper = defaultOptions.helper,
        useHelper = defaultOptions.useHelper,
      } = defaultOptions
    } = typeof definition === 'function' ? { reducer: definition } : definition

    creator ? actionMap[actionType] = creator : identityActions.push(actionType)
    reducer && (reducerMap[actionType] = reducer)

    saga && sagas.push(
      useHelper
        // We wrap it into an auto-puttable generator.
        ? helpers[helper](actionType, function* (action) {
          try {
            const result = yield* saga(action)
            if (result !== undefined) {
              yield put(result)
            }
          } catch (e) {
            if (!onError) {
              throw e
            }

            const result = isGeneratorFunction(obj) ? (yield* onError(e)) : onError(e)
            if (result !== undefined) {
              yield put(result)
            }
          }
        })
        : saga
    )
  }

  return {
    reducer: handleActions(reducerMap, defaultState),
    ...sagas.length && { sagas },
    ...Object
      .entries(createActions(actionMap, ...identityActions))
      .reduce((prev, [key, value]) => ({ ...prev, [key.slice(`${moduleName}/`.length)]: value }), {}),
  }
}

const isGenerator = obj => {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw
}

const isGeneratorFunction = obj => {
  if (!obj.constructor) return false
  if ('GeneratorFunction' === obj.constructor.name || 'GeneratorFunction' === obj.constructor.displayName) return true
  return isGenerator(obj.constructor.prototype)
}
