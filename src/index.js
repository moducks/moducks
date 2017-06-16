import { createActions, handleActions } from 'redux-actions'
import { takeEvery } from 'redux-saga/effects'

export const createModule = (moduleName, definitions, defaultState) => {
  const { actionMap, reducerMap, sagas } = Object.entries(definitions).reduce((prev, [type, definition]) => {
    const ACTION_TYPE = `${moduleName}/${type}`
    const { creator, reducer, saga } = typeof definition === 'function' ? { reducer: definition } : definition
    return {
      actionMap: creator ? [{
          ...typeof prev.actionMap[0] === 'object' ? prev.actionMap[0] : undefined,
          [ACTION_TYPE]: creator,
        },
        ...typeof prev.actionMap[0] === 'object' ? prev.actionMap.slice(1) : prev.actionMap
      ] : (prev.actionMap || []).concat(ACTION_TYPE),
      reducerMap: reducer ? {
        ...prev.reducerMap,
        [ACTION_TYPE]: reducer
      } : prev.reducerMap,
      sagas: saga ? [...prev.sagas, takeEvery(ACTION_TYPE, saga)] : prev.sagas
    }
  }, { actionMap: [], sagas: [] })

  return {
    reducer: handleActions(reducerMap, defaultState),
    ...sagas.length && { sagas } || undefined,
    ...Object
      .entries(createActions(...actionMap))
      .reduce((prev, [key, value]) => ({ ...prev, [key.split('/')[1]]: value }), {}),
  }
}

