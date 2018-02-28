import test from 'tape'
import { applyMiddleware, createStore } from 'redux'
import createSagaMiddleware, { delay, END } from 'redux-saga'
import * as effects from 'redux-saga/effects'
import Moducks from '../src'

const moducks = new Moducks({ effects })

const configureStore = (reducer, sagas) => {

  const sagaMiddleware = createSagaMiddleware()

  const store = createStore(
    reducer,
    applyMiddleware(sagaMiddleware),
  )

  return {
    ...store,
    runSaga: () => {
      const task = sagaMiddleware.run(function* () {
        yield effects.all(moducks.util.flattenSagas(sagas))
      })
      return task.done || task.toPromise()
    },
  }
}

const callApiAsync = async payload => {

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
  const { myClient, sagas, requestSuccess, requestFailure } = moducks.createModule('myClient', {
    REQUEST: {
      saga: function* (action) {
        events.push(`run request: ${action.payload}`)
        const response = yield effects.call(callApiAsync, action.payload)
        events.push(`receive response: ${response}`)
        return requestSuccess(response)
      },
      onError: (e, action) => {
        events.push(`trigger onError: ${e} ${action.payload}`)
        return requestFailure(e)
      },
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
  const { myClient, sagas, requestSuccess, requestFailure } = moducks.createModule('myClient', {
    REQUEST: {
      saga: ({ type, takeEvery }) => takeEvery(type, function* (action) {
        events.push(`run request: ${action.payload}`)
        const response = yield effects.call(callApiAsync, action.payload)
        events.push(`receive response: ${response}`)
        return requestSuccess(response)
      }),
      onError: (e, action) => {
        events.push(`trigger onError: ${e} ${action.payload}`)
        return requestFailure(e)
      },
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
  const { myClient, sagas, requestSuccess, requestFailure } = moducks.createModule('myClient', {
    REQUEST: {
      saga: ({ type, fork }) => function* () {
        while (true) { // eslint-disable-line no-constant-condition
          const action = yield effects.take(type)
          yield fork(function* () {
            events.push(`run request: ${action.payload}`)
            const response = yield effects.call(callApiAsync, action.payload)
            events.push(`receive response: ${response}`)
            return requestSuccess(response)
          }, action)
        }
      },
      onError: (e, action) => {
        events.push(`trigger onError: ${e} ${action.payload}`)
        return requestFailure(e)
      },
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
  const { myClient, sagas, requestSuccess, requestFailure } = moducks.createModule('myClient', {
    REQUEST: {
      saga: ({ type, enhance }) => function* () {
        while (true) { // eslint-disable-line no-constant-condition
          const action = yield effects.take(type)
          yield effects.fork(enhance(function* () {
            events.push(`run request: ${action.payload}`)
            const response = yield effects.call(callApiAsync, action.payload)
            events.push(`receive response: ${response}`)
            return requestSuccess(response)
          }), action)
        }
      },
      onError: (e, action) => {
        events.push(`trigger onError: ${e} ${action.payload}`)
        return requestFailure(e)
      },
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

test('[Sagas and onError] it should work with additional sagas', assert => {
  assert.plan(1)

  const events = []
  const {
    timer, sagas,
    start, stop, tick, finish,
    START, STOP, TICK,
  } = moducks.createModule('timer', {

    START: {},
    STOP: {},
    TICK: {},
    FINISH: () => events.push('finish loop'),

  }, {}, {

    sagas: {
      worker: function* () {
        yield effects.take(START)
        events.push('start loop')
        while ((yield effects.race({ tick: effects.take(TICK), stop: effects.take(STOP) })).tick) {
          events.push('looping')
        }
        return finish()
      },
    },

  })

  const store = configureStore(timer, sagas)

  store.runSaga().then(() => {
    assert.deepEqual(events, [
      'start loop',
      'looping',
      'looping',
      'looping',
      'finish loop',
    ])
    assert.end()
  })

  store.dispatch(start())
  store.dispatch(tick())
  store.dispatch(tick())
  store.dispatch(tick())
  store.dispatch(stop())
  store.dispatch(END)
})

test('[Sagas and onError] it should recover from errors', assert => {
  assert.plan(1)

  const events = []
  const { myClient, sagas, requestSuccess, requestFailure } = moducks.createModule('myClient', {
    REQUEST: {
      saga: function* (action) {
        let response
        try {
          events.push(`run request: ${action.payload}`)
          response = yield effects.call(callApiAsync, action.payload)
        } catch (e) {
          events.push(`retry run request: ${action.payload}`)
          response = yield effects.call(callApiAsync, action.payload)
        }
        events.push(`receive response: ${response}`)
        return requestSuccess(response)
      },
      onError: (e, action) => {
        events.push(`trigger onError: ${e} ${action.payload}`)
        return requestFailure(e)
      },
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
      'receive response: Success_foo1',
      'trigger request success: Success_foo1',
      'retry run request: bar2',
      'trigger onError: Failure_bar2 bar2',
      'trigger request failure: Failure_bar2',
    ])
    assert.end()
  })

  store.dispatch({ type: 'myClient/REQUEST', payload: 'foo1' })
  store.dispatch({ type: 'myClient/REQUEST', payload: 'bar2' })
  store.dispatch(END)
})


test('[Reducer] it handles module with namespace', assert => {

  const moducks = new Moducks({ effects })

  const { sagas } = moducks.createModule('my/awesomeModule', {
    FOO_ACTION: {
      saga: function* () {},
    },
    '*otherModule/BAR_ACTION': {
      saga: function* () {},
    },
    '**BAZ_ACTION': {
      saga: function* () {},
    },
    '@@ExternalApp/someModule/QUX_ACTION': {
      saga: function* () {},
    },
    '!QUUX_ACTION': {
      saga: function* () {},
    },
    '!*otherModule/CORGE_ACTION': {
      saga: function* () {},
    },
    '!**GRAULT_ACTION': {
      saga: function* () {},
    },
    '!@@ExternalApp/someModule/GARPLY_ACTION': {
      saga: function* () {},
    },
  })

  assert.ok(sagas.fooAction)
  assert.ok(sagas.barAction)
  assert.ok(sagas.bazAction)
  assert.ok(sagas.quxAction)
  assert.ok(sagas.quuxAction)
  assert.ok(sagas['otherModule/CORGE_ACTION'])
  assert.ok(sagas.GRAULT_ACTION)
  assert.ok(sagas['@@ExternalApp/someModule/GARPLY_ACTION'])
  assert.end()
})

test('[Creator] it handles module with application and namespace', assert => {

  const moducks = new Moducks({ effects, appName: 'myApp' })

  const { sagas } = moducks.createModule('my/awesomeModule', {
    FOO_ACTION: {
      saga: function* () {},
    },
    '*otherModule/BAR_ACTION': {
      saga: function* () {},
    },
    '**BAZ_ACTION': {
      saga: function* () {},
    },
    '@@ExternalApp/someModule/QUX_ACTION': {
      saga: function* () {},
    },
    '!QUUX_ACTION': {
      saga: function* () {},
    },
    '!*otherModule/CORGE_ACTION': {
      saga: function* () {},
    },
    '!**GRAULT_ACTION': {
      saga: function* () {},
    },
    '!@@ExternalApp/someModule/GARPLY_ACTION': {
      saga: function* () {},
    },
  })

  assert.ok(sagas.fooAction)
  assert.ok(sagas.barAction)
  assert.ok(sagas.bazAction)
  assert.ok(sagas.quxAction)
  assert.ok(sagas.quuxAction)
  assert.ok(sagas['@@myApp/otherModule/CORGE_ACTION'])
  assert.ok(sagas.GRAULT_ACTION)
  assert.ok(sagas['@@ExternalApp/someModule/GARPLY_ACTION'])
  assert.end()
})
