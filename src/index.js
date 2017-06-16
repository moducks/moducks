import { createActions, handleActions } from 'redux-actions'
import { takeEvery } from 'redux-saga/effects'

/**
 * Create a ducks module.
 *
 *
 * @param {string} [moduleName] - Module name used for action type prefixes.
 *                                  e.g. "example" will produce an action named "example/doSomething".
 *
 * @param {Object} [definitions] - Pairs of action type and handler maps.
 *
 *   { ACTION_TYPE: { creator, reducer, worker } }
 *
 *     creator {?(Function|Function[])} - Payload creator that can receive multiple arguments.
 *                                        You can pass meta creator as second item of array.
 *                                          default: (payload) => payload
 *
 *     reducer {?Function}              - Switchless reducer that corresponds to specific action type.
 *                                        Note that state is shared among all reducers in a specific module.
 *                                          default: (state) => state
 *
 *     worker  {?(Function|Object)}     - Generator function:
 *                                          Generator function is automatically delegated to takeEvery().
 *                                          Returned action is automatically dispatched by put().
 *                                      - Saga effect object:
 *                                          You can manually wrap generator functions with any saga effects.
 *
 * @param {*} [defaultState] - Default state object.
 *
 * @return {Object} Returns a ducks module object.
 *
 *  { reducer, sagas, doSomething, doSomethingSuccess, doSomethingFailure }
 *
 *    reducer {Function}  - Composed reducer.
 *    sagas   {?Object[]} - Array of sagas or undefined.
 *
 *    doSomething        {?Function} - Action creators based on naming convention:
 *    doSomethingSuccess               SCREAMING_SNAKE_CASE to camelCase.
 *    doSomethingFailure
 *    ...
 */
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
      .reduce((prev, [key, value]) => ({ ...prev, [key.slice(`${moduleName/}`.length)]: value }), {}),
  }
}
