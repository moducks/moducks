import { createActions, handleActions } from 'redux-actions'
import { takeEvery } from 'redux-saga/effects'

export const createModule = (moduleName, definitions, defaultState) => {

  const identityActions = []
  const actionMap = {}
  const reducerMap = {}
  const sagas = []

  for (const [type, definition] of Object.entries(definitions)) {
    
    const ACTION_TYPE = `${moduleName}/${type}`
    const { creator, reducer, saga } = typeof definition === 'function' ? { reducer: definition } : definition

    creator ? actionMap[ACTION_TYPE] = creator : identityActions.push(ACTION_TYPE)
    reducerMap[ACTION_TYPE] = reducer
    saga && sagas.push(takeEvery(ACTION_TYPE, saga))

  }

  return {
    reducer: handleActions(reducerMap, defaultState),
    ...sagas.length && { sagas },
    ...Object
      .entries(createActions(actionMap, ...identityActions))
      .reduce((prev, [key, value]) => ({ ...prev, [key.split('/', 2)[1]]: value }), {}),
  }
}
