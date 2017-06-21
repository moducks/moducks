import test from 'tape'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import createSagaMiddleware, { delay, END } from 'redux-saga'
import { fork, call, take } from 'redux-saga/effects'
import { createModule, flattenSagas } from '../src'

function configureStore(reducer, sagas) {
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(
    reducer,
    undefined,
    applyMiddleware(sagaMiddleware),
  )
  return {
    ...store,
    runSaga: () => sagaMiddleware.run(function* () {
      yield flattenSagas(sagas)
    }).done
  }
}

async function callApiAsync(payload) {
  await delay(1)
  if (payload.includes('foo')) {
    return `Success_${payload}`
  } else {
    throw `Failure_${payload}`
  }
}

test('[Sagas and onError] it should automatically wrapped by enhanced takeEvery', assert => {
  assert.plan(1)

  const events = []
  const { myClient, sagas, request, requestSuccess, requestFailure } = createModule('myClient', {
    REQUEST: {
      saga: function* (action) {
        events.push(`run request: ${action.payload}`)
        const response = yield call(callApiAsync, action.payload)
        events.push(`receive response: ${response}`)
        return requestSuccess(response)
      },
      onError: (e, action) => {
        events.push(`trigger onError: ${e} ${action.payload}`)
        return requestFailure(e)
      }
    },
    REQUEST_SUCCESS: (state, action) => {
      events.push(`trigger request success: ${action.payload}`)
      return state
    },
    REQUEST_FAILURE: (state, action) => {
      events.push(`trigger request failure: ${action.payload}`)
      return state
    },
  }, {})

  const store = configureStore(myClient, sagas)

  store.runSaga().then(() => {
    assert.deepEqual(events, [
      'run request: foo1',
      'run request: bar2',
      'run request: foo3',
      'receive response: Success_foo1',
      'trigger request success: Success_foo1',
      'trigger onError: Failure_bar2 bar2',
      'trigger request failure: Failure_bar2',
      'receive response: Success_foo3',
      'trigger request success: Success_foo3',
    ])
    assert.end()
  })

  store.dispatch({ type: 'myClient/REQUEST', payload: 'foo1' })
  store.dispatch({ type: 'myClient/REQUEST', payload: 'bar2' })
  store.dispatch({ type: 'myClient/REQUEST', payload: 'foo3' })
  store.dispatch(END)
})

test('[Sagas and onError] it should work with enhanced takeEvery', assert => {
  assert.plan(1)

  const events = []
  const { myClient, sagas, request, requestSuccess, requestFailure } = createModule('myClient', {
    REQUEST: {
      saga: ({ type, takeEvery }) => takeEvery(type, function* (action) {
        events.push(`run request: ${action.payload}`)
        const response = yield call(callApiAsync, action.payload)
        events.push(`receive response: ${response}`)
        return requestSuccess(response)
      }),
      onError: (e, action) => {
        events.push(`trigger onError: ${e} ${action.payload}`)
        return requestFailure(e)
      }
    },
    REQUEST_SUCCESS: (state, action) => {
      events.push(`trigger request success: ${action.payload}`)
      return state
    },
    REQUEST_FAILURE: (state, action) => {
      events.push(`trigger request failure: ${action.payload}`)
      return state
    },
  }, {})

  const store = configureStore(myClient, sagas)

  store.runSaga().then(() => {
    assert.deepEqual(events, [
      'run request: foo1',
      'run request: bar2',
      'run request: foo3',
      'receive response: Success_foo1',
      'trigger request success: Success_foo1',
      'trigger onError: Failure_bar2 bar2',
      'trigger request failure: Failure_bar2',
      'receive response: Success_foo3',
      'trigger request success: Success_foo3',
    ])
    assert.end()
  })

  store.dispatch({ type: 'myClient/REQUEST', payload: 'foo1' })
  store.dispatch({ type: 'myClient/REQUEST', payload: 'bar2' })
  store.dispatch({ type: 'myClient/REQUEST', payload: 'foo3' })
  store.dispatch(END)
})

test('[Sagas and onError] it should work with enhanced fork', assert => {
  assert.plan(1)

  const events = []
  const { myClient, sagas, request, requestSuccess, requestFailure } = createModule('myClient', {
    REQUEST: {
      saga: ({ type, fork }) => function* () {
        while (true) {
          const action = yield take(type)
          yield fork(function* () {
            events.push(`run request: ${action.payload}`)
            const response = yield call(callApiAsync, action.payload)
            events.push(`receive response: ${response}`)
            return requestSuccess(response)
          }, action)
        }
      },
      onError: (e, action) => {
        events.push(`trigger onError: ${e} ${action.payload}`)
        return requestFailure(e)
      }
    },
    REQUEST_SUCCESS: (state, action) => {
      events.push(`trigger request success: ${action.payload}`)
      return state
    },
    REQUEST_FAILURE: (state, action) => {
      events.push(`trigger request failure: ${action.payload}`)
      return state
    },
  }, {})

  const store = configureStore(myClient, sagas)

  store.runSaga().then(() => {
    assert.deepEqual(events, [
      'run request: foo1',
      'run request: bar2',
      'run request: foo3',
      'receive response: Success_foo1',
      'trigger request success: Success_foo1',
      'trigger onError: Failure_bar2 bar2',
      'trigger request failure: Failure_bar2',
      'receive response: Success_foo3',
      'trigger request success: Success_foo3',
    ])
    assert.end()
  })

  store.dispatch({ type: 'myClient/REQUEST', payload: 'foo1' })
  store.dispatch({ type: 'myClient/REQUEST', payload: 'bar2' })
  store.dispatch({ type: 'myClient/REQUEST', payload: 'foo3' })
  store.dispatch(END)
})

test('[Sagas and onError] it should work with manually enhanced generator', assert => {
  assert.plan(1)

  const events = []
  const { myClient, sagas, request, requestSuccess, requestFailure } = createModule('myClient', {
    REQUEST: {
      saga: ({ type, enhance }) => function* () {
        while (true) {
          const action = yield take(type)
          yield fork(enhance(function* () {
            events.push(`run request: ${action.payload}`)
            const response = yield call(callApiAsync, action.payload)
            events.push(`receive response: ${response}`)
            return requestSuccess(response)
          }), action)
        }
      },
      onError: (e, action) => {
        events.push(`trigger onError: ${e} ${action.payload}`)
        return requestFailure(e)
      }
    },
    REQUEST_SUCCESS: (state, action) => {
      events.push(`trigger request success: ${action.payload}`)
      return state
    },
    REQUEST_FAILURE: (state, action) => {
      events.push(`trigger request failure: ${action.payload}`)
      return state
    },
  }, {})

  const store = configureStore(myClient, sagas)

  store.runSaga().then(() => {
    assert.deepEqual(events, [
      'run request: foo1',
      'run request: bar2',
      'run request: foo3',
      'receive response: Success_foo1',
      'trigger request success: Success_foo1',
      'trigger onError: Failure_bar2 bar2',
      'trigger request failure: Failure_bar2',
      'receive response: Success_foo3',
      'trigger request success: Success_foo3',
    ])
    assert.end()
  })

  store.dispatch({ type: 'myClient/REQUEST', payload: 'foo1' })
  store.dispatch({ type: 'myClient/REQUEST', payload: 'bar2' })
  store.dispatch({ type: 'myClient/REQUEST', payload: 'foo3' })
  store.dispatch(END)
})
