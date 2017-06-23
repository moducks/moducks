# Recipies

* [Define pre-prefixed `createModule()`](#define-pre-prefixed-createmodule)
* [Export moducks](#export-moducks)
* [Define complicated sagas](#define-complicated-sagas)
* [Define `configureStore()`](#define-configurestore)

## Define pre-prefixed `createModule()`

First, define prefix using [`createApp()`](../api#createappappnamemodulename-definitions-defaultstate) to export it.

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

*cf. [API Reference - `createApp(appName)(moduleName, definitions, defaultState)`](../api#createappappnamemodulename-definitions-defaultstate)*

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

If you need to define complicated sagas corresponding to multiple actions, use [`Object.assign()`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) to mix them.

```js
export const {
  timer, sagas,
  start, stop, tick,
  START, STOP, TICK,
} = createModule('timer', {

  START: state => ({ ...state, running: true }),
  STOP: state => ({ ...state, running: false }),
  TICK: state => ({ ...state, elapsed: elapsed + 1 }),

}, {
  running: false,
  elapsed: 0,
})

Object.assign(sagas, {

  tick: fork(function* () {
    while (true) {
      const action = yield take(START)
      while ((yield race({
        tick: delay(1000),
        stop: take(STOP),
      })).tick) {
        yield put(tick())
      }
    }
  }),

})
```

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
