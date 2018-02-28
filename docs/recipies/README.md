# Recipies

* [Export moducks](#export-moducks)
* [Define `configureStore()`](#define-configurestore)
* [Testing with `<instance>.util.retrieveWorkers()`](#testing-with-instanceutilretrieveworkers)

## Export moducks

You can export it in your favorite style.

```js
// true ducks style
const {
  myClient, sagas,
  request, requestSuccess, requestFailure,
} = moducks.createModule('myClient', { /* ... */ }, {})

export default myClient
export { sagas, request }
```

```js
// export reducer without using default (Not compatible with true ducks style)
const {
  myClient, sagas,
  request, requestSuccess, requestFailure,
} = moducks.createModule('myClient', { /* ... */ }, {})

export { myClient, sagas, request }
```

```js
// Short hand for exporting all consts (Not compatible with true ducks style)
export const {
  myClient, sagas,
  request, requestSuccess, requestFailure,
} = moducks.createModule('myClient', { /* ... */ }, {})
```

```js
// Short hand for exporting all consts including action types and module selector (Not compatible with true ducks style)
export const {
  myClient, sagas, selectModule,
  request, requestSuccess, requestFailure,
  REQUEST, REQUEST_SUCCESS, REQUEST_FAILURE,
} = moducks.createModule('myClient', { /* ... */ }, {})
```

*cf. [API Reference - `<instance>.createModule(moduleName, definitions, initialState = {}, options = {})` - ReturnValue](../api#return-value)*

The FORK effect from additional generator function `worker()` is also accessible as `sagas.worker`.

## Define `configureStore()`

```js
import * as effects from 'redux-saga/effects'
import Moducks from 'moducks'

export default new Moducks({ effects, appName: 'myApp' })
```

```js
import { applyMiddleware, combineReducers, createStore } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { all } from 'redux-saga/effects'
import moducks from './path/to/moducks'

const configureStore = (reducers, sagas) => {

  const sagaMiddleware = createSagaMiddleware()

  const store = createStore(
    combineReducers(reducers),
    applyMiddleware(sagaMiddleware),
  )

  return {
    ...store,
    runSaga: () => sagaMiddleware.run(function* () {
      // run all sagas!
      yield all(moducks.util.flattenSagas(sagas))
    }),
  }
}

export default configureStore
```

*cf. [API Reference - `<instance>.util.flattenSagas(...sagas)`](../api#instanceutilflattensagassagas)*

## Testing with `<instance>.util.retrieveWorkers()`

The exported object `sagas` values are FORK effects rather than raw generator functions.  
You can use [`<instance>.util.retrieveWorkers() or <instance>.util.retrieveWorker()`](../api#instanceutilretrieveworkerssagasinstanceutilretrieveworkersaga) to retrieve the latter.

```js
import test from 'tape'
import { call, put } from 'redux-saga/effects'
import { sagas, load, loadSuccess } from './myModule'
import callApiAsync from '../api'
import moducks from './path/to/moducks'

test('Test sagas', assert => {

  const workers = moducks.util.retrieveWorkers(sagas)

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
