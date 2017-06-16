import { createActions, handleActions } from 'redux-actions'
import { takeEvery } from 'redux-saga/effects'

export const createModule = (moduleName, definitions, defaultState) => {

  const identityActions = []
  const actionMap = {}
  const reducerMap = {}
  const sagas = []

  for (const [type, definition] of Object.entries(definitions)) {
    
    const ACTION_TYPE = `${moduleName}/${type}`
    const { creator, reducer, worker } = typeof definition === 'function' ? { reducer: definition } : definition

    creator ? actionMap[ACTION_TYPE] = creator : identityActions.push(ACTION_TYPE)
    reducer && reducerMap[ACTION_TYPE] = reducer
    worker && sagas.push(takeEvery(ACTION_TYPE, worker))

  }

  return {
    reducer: handleActions(reducerMap, defaultState),
    ...sagas.length && { sagas },
    ...Object
      .entries(createActions(actionMap, ...identityActions))
      .reduce((prev, [key, value]) => ({ ...prev, [key.split('/', 2)[1]]: value }), {}),
  }
}
