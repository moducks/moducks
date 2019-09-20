import test from 'tape'
import { __DO_NOT_USE__ActionTypes as ActionTypes } from 'redux'
import * as effects from 'redux-saga/effects'
import Moducks from '../src'

const moducks = new Moducks({ effects })
const initialState = { counter: 2 }

const { myCounter } = moducks.createModule('myCounter', {

  // function form
  ADD: (state, action) => ({ counter: state.counter + action.payload }),

  // object form
  SUBTRACT: {
    reducer: (state, action) => ({
      counter: state.counter - action.payload,
    }),
  },

}, initialState)

test('[Reducer] it should return initialState', assert => {

  const actual = myCounter(undefined, { type: ActionTypes.INIT })
  const expected = initialState

  assert.equal(actual, expected)
  assert.end()
})

test('[Reducer] it should add 1', assert => {

  const actual = myCounter(initialState, { type: 'myCounter/ADD', payload: 1 })
  const expected = { counter: 3 }

  assert.deepEqual(actual, expected)
  assert.end()
})

test('[Reducer] it should subtract 1', assert => {

  const actual = myCounter(initialState, { type: 'myCounter/SUBTRACT', payload: 1 })
  const expected = { counter: 1 }

  assert.deepEqual(actual, expected)
  assert.end()
})

test('[Reducer] it handles module with namespace', assert => {

  const moducks = new Moducks({ effects })

  let event
  const { awesomeModule, fooAction } = moducks.createModule('my/awesomeModule', {
    FOO_ACTION: () => event = 'run reducer: FOO_ACTION',
    '*otherModule/BAR_ACTION': () => event = 'run reducer: *otherModule/BAR_ACTION',
    '**BAZ_ACTION': () => event = 'run reducer: **BAZ_ACTION',
    '@@ExternalApp/someModule/QUX_ACTION': () => event = 'run reducer: @@ExternalApp/someModule/QUX_ACTION',
    '**@@ExternalApp/someModule/QUUX_ACTION': () => event = 'run reducer: **@@ExternalApp/someModule/QUUX_ACTION',
  })

  awesomeModule({}, fooAction())
  assert.equal(event, 'run reducer: FOO_ACTION')

  awesomeModule({}, { type: 'otherModule/BAR_ACTION' })
  assert.equal(event, 'run reducer: *otherModule/BAR_ACTION')

  awesomeModule({}, { type: 'BAZ_ACTION' })
  assert.equal(event, 'run reducer: **BAZ_ACTION')

  awesomeModule({}, { type: '@@ExternalApp/someModule/QUX_ACTION' })
  assert.equal(event, 'run reducer: @@ExternalApp/someModule/QUX_ACTION')

  awesomeModule({}, { type: '@@ExternalApp/someModule/QUUX_ACTION' })
  assert.equal(event, 'run reducer: **@@ExternalApp/someModule/QUUX_ACTION')

  assert.end()
})

test('[Creator] it handles module with application and namespace', assert => {

  const moducks = new Moducks({ effects, appName: 'myApp' })

  let event
  const { awesomeModule, fooAction } = moducks.createModule('my/awesomeModule', {
    FOO_ACTION: () => event = 'run reducer: FOO_ACTION',
    '*otherModule/BAR_ACTION': () => event = 'run reducer: *otherModule/BAR_ACTION',
    '**BAZ_ACTION': () => event = 'run reducer: **BAZ_ACTION',
    '@@ExternalApp/someModule/QUX_ACTION': () => event = 'run reducer: @@ExternalApp/someModule/QUX_ACTION',
    '**@@ExternalApp/someModule/QUUX_ACTION': () => event = 'run reducer: **@@ExternalApp/someModule/QUUX_ACTION',
  })

  awesomeModule({}, fooAction())
  assert.equal(event, 'run reducer: FOO_ACTION')

  awesomeModule({}, { type: '@@myApp/otherModule/BAR_ACTION' })
  assert.equal(event, 'run reducer: *otherModule/BAR_ACTION')

  awesomeModule({}, { type: 'BAZ_ACTION' })
  assert.equal(event, 'run reducer: **BAZ_ACTION')

  awesomeModule({}, { type: '@@ExternalApp/someModule/QUX_ACTION' })
  assert.equal(event, 'run reducer: @@ExternalApp/someModule/QUX_ACTION')

  awesomeModule({}, { type: '@@ExternalApp/someModule/QUUX_ACTION' })
  assert.equal(event, 'run reducer: **@@ExternalApp/someModule/QUUX_ACTION')

  assert.end()
})
