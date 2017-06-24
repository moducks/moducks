# API Reference

* [`createModule(moduleName, definitions, defaultState, additionalSagas = {})`](#createmodulemodulename-definitions-defaultstate-additionalsagas--)
  * [Arguments](#arguments)
    * [`creator`](#creator)
    * [`reducer`](#reducer)
    * [`saga` `onError`](#saga-onerror)
  * [Return Value](#return-value)
* [`createApp(appName)(moduleName, definitions, defaultState, additionalSagas = {})`](#createappappnamemodulename-definitions-defaultstate-additionalsagas--)
* [`flattenSagas(...sagas)`](#flattensagassagas)
* [`retrieveWorkers(sagas)` `retrieveWorker(saga)`](#retrieveworkerssagas-retrieveworkersaga)

## `createModule(moduleName, definitions, defaultState, additionalSagas = {})`

Creates a ducks module.

### Arguments

| # | Name | Type | Required | Description |
|:--|:--|:--|:--:|:--|
| 1 | **`moduleName`** | string | * | A name of its ducks. It is used for **reducer function name** and prefixing actions. |
| 2 | **`definitions`** | Object | * | A map of each definition. **Non-prefixed action type** as key, either of the following as value.  <table><tr><th>Type</th><th>Description</th></tr><tr><td>Object</td><td>An object that can contain `creator`, `reducer`, `saga` and `onError` as key.</ld></tr><tr><td>Function</td><td>A single reducer function.</td></tr></table> |
| 3 | **`defaultState`** | Object | * | Any objects for initializing state. |
| 4 | `additionalSagas` | Object | | Additional generators for creating complicated sagas.<br>*cf. [Define complicated sagas](../recipies#define-complicated-sagas)* |

#### `creator`

An second argument (Function) or second to third arguments (Array of Function) of [`redux-actions.createAction()`](https://github.com/acdlite/redux-actions#createactiontype-payloadcreator--identity-metacreator).  
It can take a single function or a pair of functions.  
The following two snippets have the same behaviors.

```js
const { myModule, actionOne, actionTwo, actionThree } = createModule('myModule', {

  // function form; payload creator defined inline
  ACTION_ONE: {
    creator: (key, value) => ({ [key]: value }),
  },

  // array form
  ACTION_TWO: {
    creator: [
      (first) => [first],              // payload
      (first, second) => ({ second }), // meta
    ],
  },

  // string form: **Just omit this parameter!**
  ACTION_THREE: {},

}, {})
```

```js
const myModule = (state = {}) => state

const actionOne = (key, value) => ({ type: 'myModule/ACTION_ONE', payload: { [key]: value } })
const actionTwo = (first, second) => ({ type: 'myModule/ACTION_TWO', payload: [first], meta: { second } })
const actionThree = payload => ({ type: 'myModule/ACTION_THREE', payload })
```

#### `reducer`

An entry of the first argument `reducerMap` of [`redux-actions.handleActions()`](https://github.com/acdlite/redux-actions/blob/master/README.md#createactionsactionmap-identityactions).  
It can take a single stateless function.  
The following two snippets have the same behaviors.

```js
const { myCounter, add, subtract } = createModule('myCounter', {

  // function form
  ADD: (state, action) => ({ counter: state.counter + action.payload }),

  // object form
  SUBTRACT: {
    reducer: (state, action) => ({
      counter: state.counter - action.payload,
    }),
  },

}, { counter: 0 })
```

```js
const myCounter = (state = { counter: 0 }, action) => {
  switch (action) {

    case 'myCounter/ADD':
      return state.counter + action.payload

    case 'myCounter/SUBTRACT':
      return state.counter - action.payload

    default:
      return state
  }
}

const add = payload => ({ type: 'myCounter/ADD', payload })
const subtract = payload => ({ type: 'myCounter/SUBTRACT', payload })
```

#### `saga` `onError`

- If you specify `saga` as **a generator function**, it will be a short circuit for [`redux-saga/effects.takeEvery()`](https://github.com/redux-saga/redux-saga/tree/master/docs/api#takeeverypattern-saga-args).  
It also converts...
  - **`return <SuccessAction>`** :arrow_right: **`yield put(<SuccessAction>)`**
  - **`throw <Error>`** :arrow_right: **`onError(<Error>, <Action>)`** :arrow_right: **`return <FailureAction>`** :arrow_right: **`yield put(<FailureAction>)`**  

    Note that `onError` can be both of a generator function and a normal function.  

- As an another choice, use **a thunk that returns either generator function or effect.**  
You can use another enhanced effect creator by receiving  
  **`({ type, takeEvery, takeLatest, throttle, fork, spawn })` as the first argument**.  
  - Returned generator function is automatically invoked by **non-enhanced `fork()`**.  
  - When you use enhanced `fork` or `spawn`, **pass `<Action>` as a second argument** to receive it in `onError`.

- As the last choice, create your original enhanced effect by receiving `({ type, enhance })`.

The following five snippets have the same behaviors.

```js
const { myClient, sagas, requestSuccess, requestFailure } = createModule('myClient', {

  // use enhanced takeEvery automatically
  REQUEST: {
    saga: function* (action) {
      return requestSuccess(yield call(callApiAsync, action.payload))
    },
    onError: (e, action) => requestFailure(e),
  },

  REQUEST_SUCCESS: {},
  REQUEST_FAILURE: {},

}, {})
```

```js
const { myClient, sagas, requestSuccess, requestFailure } = createModule('myClient', {

  // use enhanced takeEvery manually
  REQUEST: {
    saga: ({ type, takeEvery }) => takeEvery(type, function* (action) {
      return requestSuccess(yield call(callApiAsync, action.payload))
    }),
    onError: (e, action) => requestFailure(e),
  },

  REQUEST_SUCCESS: {},
  REQUEST_FAILURE: {},

}, {})
```

```js
const { myClient, sagas, requestSuccess, requestFailure } = createModule('myClient', {

  // use enhanced fork
  // (you should pass action as a second argument of fork() to receive it in onError)
  REQUEST: {
    saga: ({ type, fork }) => function* () {
      while (true) {
        const action = yield take(type)
        yield fork(function* () {
          return requestSuccess(yield call(callApiAsync, action.payload))
        }, action)
      }
    },
    onError: (e, action) => requestFailure(e),
  },

  REQUEST_SUCCESS: {},
  REQUEST_FAILURE: {},

}, {})
```

```js
const { myClient, sagas, requestSuccess, requestFailure } = createModule('myClient', {

  // enhance your generator manually
  // (you should pass action as a second argument of fork() to receive it in onError)
  REQUEST: {
    saga: ({ type, enhance }) => function* () {
      while (true) {
        const action = yield take(type)
        yield fork(enhance(function* () {
          return requestSuccess(yield call(callApiAsync, action.payload))
        }), action)
      }
    },
    onError: (e, action) => requestFailure(e),
  },

  REQUEST_SUCCESS: {},
  REQUEST_FAILURE: {},

}, {})
```

```js
const myClient = (state = {}) => state

const sagas = {

  // without moducks
  load: takeEvery('myClient/REQUEST', function* (action) {
    try {
      yield put(requestSuccess(yield call(callApiAsync, action.payload)))
    } catch (e) {
      yield put(requestFailure(e))
    }
  }),

}

const requestSuccess = payload => ({ type: 'myClient/REQUEST_SUCCESS', payload })
const requestFailure = payload => ({ type: 'myClient/REQUEST_FAILURE', payload })
```

### Return Value

If you make a module named `myModule` and define actions `ACTION_FOO` `ACTION_BAR`, the object will be:

```js
{
  myClient: (state, action) => { /* ... */ },
  sagas: {
    actionFoo: takeEvery(function* () {
      /* ... */
    }),
    actionBar: takeEvery(function* () {
      /* ... */
    }),
  }
  actionFoo: (payload) => { /* ... */ },
  actionBar: (payload) => { /* ... */ },
  ACTION_FOO: 'myModule/ACTION_FOO',
  ACTION_BAR: 'myModule/ACTION_BAR',
}
```

*cf. [Recipies - Export moducks](../recipies#export-moducks)*

## `createApp(appName)(moduleName, definitions, defaultState, additionalSagas = {})`

Pre-prefix your future modules with `@@${appName}`.  
The following two snippets have the same behaviors.

```js
const createMyAppModule = createApp('myApp')
const { fooAction } = createMyAppModule('fooModule', { FOO_ACTION: {} })
const { barAction } = createMyAppModule('barModule', { BAR_ACTION: {} })
```

```js
const fooAction = payload => ({ type: '@@myApp/fooModule/FOO_ACTION', payload })
const barAction = payload => ({ type: '@@myApp/barModule/BAR_ACTION', payload })
```

*cf. [Recipies - Define pre-prefixed `createModule()`](../recipies#define-pre-prefixed-createmodule)*

## `flattenSagas(...sagas)`

Flatten nested sagas to help your store configuration.

```js
flattenSagas(
  {
    a: {
      b: takeEvery('A', function* () { }),
      c: {
        d: takeLatest('B', function* () { }),
        e: 'foo',
        f: [],
      },
    },
    g: throttle(100, 'C', function* () { }),
  },
  [
    {
      h: fork(function* () { }),
    },
    'bar',
    null,
    undefined,
    0,
    Symbol('baz'),
    x => 1,
    {
      i: [
        spawn(function* () { }),
      ],
    },
  ],
)
```

It returns:

```js
[
  takeEvery('A', function* () { }),
  takeLatest('B', function* () { }),
  throttle(100, 'C', function* () { }),
  fork(function* () { }),
  spawn(function* () { }),
]
```

*cf. [Recipies - Define `configureStore()`](../recipies#define-configurestore)*

## `retrieveWorkers(sagas)` `retrieveWorker(saga)`

Unwrap your `sagas` to retrieve worker generator functions.  

```js
const sagas = {
  foo: takeEvery('FOO', function* () {}),
  bar: throttle(100, 'BAR', function* () {}),
  baz: fork(function* () {}),
}
```

It's helpful for unit testing.

```js
const { foo, bar, baz } = retrieveWorkers(sagas) // retrieved values are generator functions
```

*cf. [Recipies - Testing with `retrieveWorkers()`](../recipies#testing-with-retrieveworkers)*
