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

    worker && sagas.push(
      typeof worker === 'function'

      // Worker must be a generator function.
      // We wrap it into an auto-puttable generator.
      ? takeEvery(ACTION_TYPE, function* (incoming) {
        const outgoing = yield* worker(incoming)
        outgoing !== undefined && (yield put(outgoing))
      })

      // Worker must be an already wrapped saga effects.
      : worker
    )

  }

  return {
    reducer: handleActions(reducerMap, defaultState),
    ...sagas.length && { sagas },
    ...Object
      .entries(createActions(actionMap, ...identityActions))
      .reduce((prev, [key, value]) => ({ ...prev, [key.split('/', 2)[1]]: value }), {}),
  }
}
