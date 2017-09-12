# API Reference

* [`createModule(moduleName, definitions, defaultState = {}, options = {})`](#createmodulemodulename-definitions-defaultstate---options--)
  * [Arguments](#arguments)
    * [`definitions.<NON_PREFIXED_ACTION_TYPE>.creator`](#definitionsnon_prefixed_action_typecreator)
    * [`definitions.<NON_PREFIXED_ACTION_TYPE>.reducer`](#definitionsnon_prefixed_action_typereducer)
    * [`definitions.<NON_PREFIXED_ACTION_TYPE>.saga`<br>`definitions.<NON_PREFIXED_ACTION_TYPE>.onError`](#definitionsnon_prefixed_action_typesagadefinitionsnon_prefixed_action_typeonerror)
    * [`options.sagas`](#optionssagas)
    * [`options.selectorFactory`](#optionsselectorfactory)
  * [Return Value](#return-value)
* [`createApp(appName)(moduleName, definitions, defaultState = {}, options = {})`](#createappappnamemodulename-definitions-defaultstate---options--)
* [`flattenSagas(...sagas)`](#flattensagassagas)
* [`enhance(saga, onError)`](#enhancesaga-onerror)
* [`enhancibleForkerThunks.*(onError)(...args)`<br>`enhancedForkers.*(...args)`](#enhancibleforkerthunksonerrorargsenhancedforkersargs)

## `createModule(moduleName, definitions, defaultState = {}, options = {})`

Creates a ducks module.

### Arguments

| # | Name | Type | Required | Description |
|:--|:--|:--|:--:|:--|
| 1 | **`moduleName`** | string | * | A name of its ducks. It is used for **reducer function name** and prefixing actions. |
| 2 | **`definitions`** | Object/Function | * | A map of each definition. **Non-prefixed action type** as key, either of the following as value.  <table><tr><th>Type</th><th>Description</th></tr><tr><td>Object</td><td>An object that can contain `creator`, `reducer`, `saga` and `onError` as key.</ld></tr><tr><td>Function</td><td>A single reducer function.</td></tr></table> |
| 3 | `defaultState` | Object | | Any objects for initializing state. |
| 4 | `options` | Object | | A map of extra options. <table><tr><th>Key</th><th>Description</th></tr><tr><td>sagas</td><td>Additional complicated sagas those are not associated with a single action.</td></tr><tr><td>selectorFactory</td><td>A factory function for building additonal memoized selectors.</td></tr></table> |

#### `definitions.<NON_PREFIXED_ACTION_TYPE>.creator`

An second argument (Function) or second to third arguments (Array of Function) of [`redux-actions.createAction()`](https://github.com/acdlite/redux-actions#createactiontype-payloadcreator--identity-metacreator).  
It can take a single function or a pair of functions. The following two snippets have the same behaviors.

```js
const { myModule, actionOne, actionTwo, actionThree } = createModule('myModule', {

  // function form; payload creator defined inline
  ACTION_ONE: {
    creator: (key, value) => ({ [key]: value }),
  },

  // array form
  ACTION_TWO: {
    creator: [
      first => [first],                // payload
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

#### `definitions.<NON_PREFIXED_ACTION_TYPE>.reducer`

An entry of the first argument `reducerMap` of [`redux-actions.handleActions()`](https://github.com/acdlite/redux-actions/blob/master/README.md#createactionsactionmap-identityactions).  
It can take a single stateless function. The following two snippets have the same behaviors.

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

#### `definitions.<NON_PREFIXED_ACTION_TYPE>.saga`<br>`definitions.<NON_PREFIXED_ACTION_TYPE>.onError`

Moducks supports some shorthands for composing sagas with an error handler: `onError` (normal function or generator function).

- _X_: **`yield <Action>`** :arrow_right: **`yield put(<Action>)`**
- _Y_: **`return <SuccessAction>`** :arrow_right: **`yield put(<SuccessAction>)`**
- _Z_: **`throw <Error>`** :arrow_right: **`onError(<Error>, <Action>)`** :arrow_right: **`return <FailureAction>`** :arrow_right: **`yield put(<FailureAction>)`**  

Mainly they are three strategies.

- If you specify `saga` as **a generator function**, it will be automatically invoked by **enhanced  [`redux-saga/effects.takeEvery()`](https://github.com/redux-saga/redux-saga/tree/master/docs/api#takeeverypattern-saga-args)**. It supports shorthands _X_, _Y_ and _Z_.

- As an another choice, use **a thunk that returns either generator function or effect.** You can use another enhanced effect creator by receiving  
  **`({ type, takeEvery, takeLatest, throttle, fork, spawn })`**  
  as the first argument. They support shorthands _X_, _Y_ and _Z_.
  - If you use enhanced `fork` or `spawn`, **pass `<Action>` as the second argument** to receive it in `onError`.
  - Returned generator function is automatically invoked by enhanced `fork()`. It supports shorthands _X_ and _Y_.

- As the last choice, manually enhance your generator function by receiving `({ enhance })`.

Also there is a wrapper function of `select()`.

- `selectModule` is provided as an alias of `state => state[moduleName]`.
- `selectModule.effect` is provided as an alias of `() => select(state => state[moduleName])`.

The following five snippets have the same behaviors.

```js
const { myClient, sagas, selectModule, requestSuccess, requestFailure, requestCancel } = createModule('myClient', {

  // use enhanced takeEvery automatically
  REQUEST: {
    saga: function* (action) {
      const { cancelTokenSource } = yield selectModule.effect()
      if (cancelTokenSource) {
        yield requestCancel(cancelTokenSource)
      }
      return requestSuccess(yield call(callApiAsync, action.payload))
    },
    onError: (e, action) => requestFailure(e),
  },

  REQUEST_SUCCESS: {},
  REQUEST_FAILURE: {},
  REQUEST_CANCEL: {},

}, {})
```

```js
const { myClient, sagas, selectModule, requestSuccess, requestFailure, requestCancel } = createModule('myClient', {

  // use enhanced takeEvery manually
  REQUEST: {
    saga: ({ type, takeEvery }) => takeEvery(type, function* (action) {
      const { cancelTokenSource } = yield selectModule.effect()
      if (cancelTokenSource) {
        yield requestCancel(cancelTokenSource)
      }
      return requestSuccess(yield call(callApiAsync, action.payload))
    }),
    onError: (e, action) => requestFailure(e),
  },

  REQUEST_SUCCESS: {},
  REQUEST_FAILURE: {},
  REQUEST_CANCEL: {},

}, {})
```

```js
const { myClient, sagas, selectModule, requestSuccess, requestFailure } = createModule('myClient', {

  // use enhanced fork
  // (you should pass action as the second argument of fork() to receive it in onError)
  REQUEST: {
    saga: ({ type, fork }) => function* () {
      while (true) {
        const action = yield take(type)
        yield fork(function* () {
          const { cancelTokenSource } = yield selectModule.effect()
          if (cancelTokenSource) {
            yield requestCancel(cancelTokenSource)
          }
          return requestSuccess(yield call(callApiAsync, action.payload))
        }, action)
      }
    },
    onError: (e, action) => requestFailure(e),
  },

  REQUEST_SUCCESS: {},
  REQUEST_FAILURE: {},
  REQUEST_CANCEL: {},

}, {})
```

```js
const { myClient, sagas, selectModule, requestSuccess, requestFailure } = createModule('myClient', {

  // enhance your generator manually
  // (you should pass action as the second argument of fork() to receive it in onError)
  REQUEST: {
    saga: ({ type, enhance }) => function* () {
      while (true) {
        const action = yield take(type)
        yield fork(enhance(function* () {
          const { cancelTokenSource } = yield selectModule.effect()
          if (cancelTokenSource) {
            yield requestCancel(cancelTokenSource)
          }
          return requestSuccess(yield call(callApiAsync, action.payload))
        }), action)
      }
    },
    onError: (e, action) => requestFailure(e),
  },

  REQUEST_SUCCESS: {},
  REQUEST_FAILURE: {},
  REQUEST_CANCEL: {},

}, {})
```

```js
const myClient = (state = {}) => state

const sagas = {

  // without moducks
  load: takeEvery('myClient/REQUEST', function* (action) {
    try {
      const { cancelTokenSource } = yield select(state => state.myClient)
      if (cancelTokenSource) {
        yield put(requestCancel(cancelTokenSource))
      }
      yield put(requestSuccess(yield call(callApiAsync, action.payload)))
    } catch (e) {
      yield put(requestFailure(e))
    }
  }),

}

const requestSuccess = payload => ({ type: 'myClient/REQUEST_SUCCESS', payload })
const requestFailure = payload => ({ type: 'myClient/REQUEST_FAILURE', payload })
const requestCancel = payload => ({ type: 'myClient/REQUEST_CANCEL', payload })
```

#### `options.sagas`

Use this parameter for additional complicated sagas those are not associated with a single action. Also they are three strategies.

- If you specify `saga` as **a generator function**, it will be automatically invoked by **enhanced [`redux-saga/effects.fork()`](https://github.com/redux-saga/redux-saga/tree/master/docs/api#forkfn-args)**. It supports shorthands _X_ and _Y_.

- As an another choice, use **a thunk that returns either generator function or effect.** You can use another enhanced effect creator by receiving  
  **`({ NON_PREFIXED_ACTION_TYPE_0, NON_PREFIXED_ACTION_TYPE_1, ..., takeEvery, takeLatest, throttle, fork, spawn })`**  
  as the first argument. They support shorthands _X_ and _Y_.
  - Returned generator function is automatically invoked by enhanced `fork()`. It supports shorthands _X_ and _Y_.

- As the last choice, manually enhance your generator function by receiving `({ enhance })`.

**IMPORTANT:**
- **Each effect creator cannot have error handlers.** Write `try { } catch (e) { }` blocks if you need.

```js
export const {
  timer, sagas,
  start, stop, tick,
  START, STOP,
} = createModule('timer', {
  /* ... */
}, /* ... */, {
  sagas: {
    worker: function* () {
      while (true) {
        const action = yield take(START)
        while ((yield race({ tick: delay(1000), stop: take(STOP) })).tick) {
          yield tick()
        }
      }
    },
  },
})
```

```js
export const {
  timer, sagas,
  start, stop, tick,
} = createModule('timer', {
  /* ... */
}, /* ... */, {
  sagas: {
    worker: ({ START, STOP }) => function* () {
      while (true) {
        const action = yield take(START)
        while ((yield race({ tick: delay(1000), stop: take(STOP) })).tick) {
          yield tick()
        }
      }
    },
  },
})
```

#### `options.selectorFactory`

A factory function for building additonal memoized selectors. An object that contains following entries is passed as the first argument.

| Key | Type | Description |
|:--|:--|:--|
| `selectModule` | Function | Shorthand of `state => state[moduleName]` |
| `createSelector` | Function | [`reselect/createSelector()`](https://github.com/reactjs/reselect#createselectorinputselectors--inputselectors-resultfunc) |
| `defaultMemoize` | Function | [`reselect/defaultMemoize()`](https://github.com/reactjs/reselect#defaultmemoizefunc-equalitycheck--defaultequalitycheck) |
| `createSelectorCreator` | Function | [`reselect/createSelectorCreator()`](https://github.com/reactjs/reselect#createselectorcreatormemoize-memoizeoptions) |
| `createStructuredSelector` | Function | [`reselect/createStructuredSelector()`](https://github.com/reactjs/reselect#createstructuredselectorinputselectors-selectorcreator--createselector) |

The factory function MUST return an object that contains the following structure.

```js
{
  selector_function_name_0: <SELECTOR_FUNCTION_0>,
  selector_function_name_1: <SELECTOR_FUNCTION_1>,
  ...,
}
```

Then, moducks attaches `.effect()` on each function as a shorthand for going along with sagas.

```js
export const { selectModule, selectFoo, /* ... */ } = createModule('myModule', {
  ACTION_FOO: {
    saga: function* () {
      const myModuleState = yield selectModule.effect()
      const foo = yield selectFoo.effect()
      /* ... */
    },
  },
}, {
  foo: {
    1,
  },
}, {
  selectorFactory: ({ selectModule, createSelector }) => ({
    selectFoo: createSelector(selectModule, state => state.foo),
  }),
})
```

### Return Value

If you make a module named `myModule` and define actions `ACTION_FOO` `ACTION_BAR`, the object will be:

```js
const selectModule = () => state => state.myModule
const selectModule.effect = () => select(selectModule)

return {
  myModule: (state, action) => { /* ... */ },
  sagas: {
    actionFoo: takeEvery('FOO', function* (action) {
      /* ... */
    }),
    actionBar: takeEvery('BAR', function* (action) {
      /* ... */
    }),
  },
  selectModule,
  actionFoo: (payload) => { /* ... */ },
  actionBar: (payload) => { /* ... */ },
  ACTION_FOO: 'myModule/ACTION_FOO',
  ACTION_BAR: 'myModule/ACTION_BAR',
}
```

*cf. [Recipies - Export moducks](../recipies#export-moducks)*

## `createApp(appName)(moduleName, definitions, defaultState = {}, options = {})`

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
    x => x + 1,
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

## `retrieveWorkers(sagas)`<br>`retrieveWorker(saga)`

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

## `enhance(saga, onError)`

Manually enhance your generator function. Note that `onError` is optional.

```js
enhance(function* (action) {
  return actionBar(yield actionFoo(action.payload))
}, (e, action) => actionOnError(e, action))
```

It is converted into:

```js
function* (action) {
  try {
    yield put(actionBar(yield put(actionFoo(action.payload))))
  } catch (e) {
    yield put(actionOnError(e, action))
  }
}
```

## `enhancibleForkerThunks.*(onError)(...args)`<br>`enhancedForkers.*(...args)`

Collections of redux-saga effect creators those contain `takeEvery`, `takeLatest`, `throttle`, `fork` and `spawn`.

- `enhancibleForkerThunks.*(onError)` is a thunk that returns an enhanced forker with a specific error handler.
- `enhancedForkers.*` is already enhanced with an empty error handler.

```js
const { takeEvery } = enhancedForkers

return takeEvery(type, function* (action) {
  return actionBar(yield actionFoo(action.payload))
})
```

It is converted into:

```js
return takeEvery(type, function* (action) {
  yield put(actionBar(yield put(actionFoo(action.payload))))
})
```

Also,

```js
const takeEvery = enhancibleForkerThunks.takeEvery((e, action) => actionOnError(e, action))

return takeEvery(type, function* (action) {
  return actionBar(yield actionFoo(action.payload))
})
```

It is converted into:

```js
return takeEvery(type, function* (action) {
  try {
    yield put(actionBar(yield put(actionFoo(action.payload))))
  } catch (e) {
    yield put(actionOnError(e, action))
  }
})
```
