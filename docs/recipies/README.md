# Recipies

* [Define pre-prefixed `createModule()`](#define-pre-prefixed-createmodule)
* [Export moducks](#export-moducks)
* [Define complicated sagas](#define-complicated-sagas)
* [Define `configureStore()`](#define-configurestore)
* [Testing with `retrieveWorkers()`](#testing-with-retrieveworkers)

## Define pre-prefixed `createModule()`

First, define prefix using [`createApp()`](../api#createappappnamemodulename-definitions-defaultstate-additionalsagas--) to export it.

```js
// app/index.js
import { createApp } from 'moducks'

export const createModule = createApp('myApp')
```

Then import it to define each moducks.

```js
// app/moducks/fooModule.js
import { createModule } from '../app'

export const { fooModule, /* ... */ } = createModule('fooModule', { /* ... */ }, {})
```

```js
// app/moducks/barModule.js
import { createModule } from '../app'

export const { barModule, /* ... */ } = createModule('barModule', { /* ... */ }, {})
```

*cf. [API Reference - `createApp(appName)(moduleName, definitions, defaultState, additionalSagas = {})`](../api#createappappnamemodulename-definitions-defaultstate-additionalsagas--)*

## Export moducks

You can export it in your favorite style.

```js
// true ducks style
const {
  myClient, sagas,
  request, requestSuccess, requestFailure,
} = createModule('myClient', { /* ... */ }, {})

export default myClient
export { sagas, request }
```

```js
// export reducer without using default (Not compatible with true ducks style)
const {
  myClient, sagas,
  request, requestSuccess, requestFailure,
} = createModule('myClient', { /* ... */ }, {})

export { myClient, sagas, request }
```

```js
// Short hand for exporting all consts (Not compatible with true ducks style)
export const {
  myClient, sagas,
  request, requestSuccess, requestFailure,
} = createModule('myClient', { /* ... */ }, {})
```

```js
// Short hand for exporting all consts including action types (Not compatible with true ducks style)
export const {
  myClient, sagas,
  request, requestSuccess, requestFailure,
  REQUEST, REQUEST_SUCCESS, REQUEST_FAILURE,
} = createModule('myClient', { /* ... */ }, {})
```

*cf. [API Reference - `createModule(moduleName, definitions, defaultState)` - ReturnValue](../api#return-value)*

## Define complicated sagas

If you need to define complicated sagas corresponding to multiple actions, pass them as the fourth argument of [`createModule()`](../api#createmodulemodulename-definitions-defaultstate-additionalsagas). They are automatically invoked by `fork()`.

```js
const defaultState =  {
  running: false,
  elapsed: 0,
}

export const {
  timer, sagas,
  start, stop, tick,
  START, STOP, TICK,
} = createModule('timer', {

  START: state => ({ ...state, running: true }),
  STOP: state => ({ ...state, running: false }),
  TICK: state => ({ ...state, elapsed: state.elapsed + 1 }),

}, defaultState, {

  worker: function* () {
    while (true) {
      const action = yield take(START)
      while ((yield race({ tick: delay(1000), stop: take(STOP) })).tick) {
        yield put(tick())
      }
    }
  },

})
```

The FORK effect from additional generator function `worker()` is also accessible as `sagas.worker`.

## Define `configureStore()`

```js
function configureStore(reducers, sagas) {

  const sagaMiddleware = createSagaMiddleware()

  const store = createStore(
    combineReducers(reducers),
    applyMiddleware(sagaMiddleware),
  )

  return {
    ...store,
    runSaga: () => sagaMiddleware.run(function* () {
      // run all sagas!
      yield flattenSagas(sagas)
    }),
  }
}
```

*cf. [API Reference - `flattenSagas(...sagas)`](../api#flattensagassagas)*

## Testing with `retrieveWorkers()`

The exported object `sagas` values are FORK effects rather than raw generator functions.  
You can use [`retrieveWorkers() or retrieveWorker()`](../api#retrieveworkerssagas-retrieveworkersaga) to retrieve the latter.

```js
import test from 'tape'
import { call, put } from 'redux-saga/effects'
import { sagas, load, loadSuccess } from './myModule'
import callApiAsync from '../api'

test('Test sagas', assert => {

  const workers = retrieveWorkers(sagas)

  const iterator = workers.load(load(/* API params */))
  let current

  current = iterator.next()
  assert.deepEqual(current, {
    done: false,
    value: put(call(callApiAsync, /* API params */)),
  })

  current = iterator.next(/* Fake API response */)
  assert.deepEqual(current, {
    done: false,
    value: put(loadSuccess(/* Fake API response */)),
  })

  current = iterator.next()
  assert.deepEqual(current, {
    done: true,
    value: undefined,
  })

  assert.end()
})
```
