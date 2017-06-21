# API Reference

* [`createModule(moduleName, definitions, defaultState)`](#createmodulemodulename-definitions-defaultstate)
* [`createApp(appName)(moduleName, definitions, defaultState)`](#createappappnamemodulename-definitions-defaultstate)
* [`flattenSagas(...sagas)`](#flattensagassagas)

## `createModule(moduleName, definitions, defaultState)`

Creates a ducks module.

### Arguments

- `moduleName: string` - A name of its ducks. It is used for **reducer function name** and prefixing actions.
- `definitions: Object` - A map of each definition. **Non-prefixed action type** as key, either of the following as value.
  - `definition: Object` - An object that can contain `creator`, `reducer`, `saga` and `onError` as key.
  - `definition: Function` - A single reducer function.
- `defaultState: Any` - Any for initializing state.

#### `creator`

An entry of the first argument `?actionMap` of [`redux-actions.createActions()`](https://github.com/acdlite/redux-actions/blob/master/README.md#createactionsactionmap-identityactions).  
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
  ACTION_THREE: {}
})
```

```js
const myModule = state => state

const actionOne = (key, value) => ({ type: 'myModule/ACTION_ONE', payload: { [key]: value } })
const actionTwo = (first, second) => ({ type: 'myModule/ACTION_TWO', payload: [first], meta: { second } })
const actionThree = payload => ({ type: 'myModule/ACTION_THREE', payload })
```

#### `reducer`

An entry of the first argument `reducerMap` of [`redux-actions.handleActions()`](https://github.com/acdlite/redux-actions/blob/master/README.md#createactionsactionmap-identityactions).  
It can take a single stateless function.  
The following two snippets have the same behaviors.

```js
const { myCounter, increment, decrement } = createModule('myCounter', {

  // function form
  INCREMENT: (state, action) => ({ counter: state.counter + action.payload }),

  // object form
  DECREMENT: {
    reducer: (state, action) => ({
      counter: state.counter - action.payload,
    }),
  },

})
```

```js
const myCounter = (state, action) => {
  switch (action) {

    case 'myCounter/INCREMENT':
      return state.counter + action.payload

    case 'myCounter/DECREMENT':
      return state.counter - action.payload

    default:
      return state
  }
}

const increment = payload => ({ type: 'myCounter/INCREMENT', payload })
const decrement = payload => ({ type: 'myCounter/DECREMENT', payload })
```

#### `saga` `onError`

- If you specify `saga` as **a generator function**, it will be a short circuit for [`redux-saga/effects.takeEvery()`](https://github.com/redux-saga/redux-saga/tree/master/docs/api#takeeverypattern-saga-args).  
It also converts...
  - **`return <SuccessAction>`** :arrow_right: **`yield put(<SuccessAction>)`**
  - **`throw <Error>`** :arrow_right: **`onError(<Error>, <Action>)`** :arrow_right: **`yield put(<SuccessAction>)`**  

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
})
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
})
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
})
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
})
```

```js
const myClient = state => state

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

## `createApp(appName)(moduleName, definitions, defaultState)`

Pre-prefix your future modules.  
The following two snippets have the same behaviors.

```js
const createMyAppModule = createApp('@@myApp')
const { fooAction } = createMyAppModule('fooModule', { FOO_ACTION: {} })
const { barAction } = createMyAppModule('barModule', { BAR_ACTION: {} })
```

```js
const fooAction = payload => ({ type: '@@myApp/fooModule/FOO_ACTION', payload })
const barAction = payload => ({ type: '@@myApp/barModule/BAR_ACTION', payload })
```

## `flattenSagas(...sagas)`

Flatten nested sagas to help your store configuration.

```js
function configureStore(preloadedState) {
  const sagaMiddleware = createSagaMiddleware()

  const store = createStore(
    combineReducers(reducers),
    preloadedState,
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
