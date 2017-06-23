import test from 'tape'
import { createModule } from '../src'
import { ActionTypes } from 'redux/lib/createStore'

const defaultState = { counter: 2 }

const { myCounter, add, subtract } = createModule('myCounter', {

  // function form
  ADD: (state, action) => ({ counter: state.counter + action.payload }),

  // object form
  SUBTRACT: {
    reducer: (state, action) => ({
      counter: state.counter - action.payload,
    }),
  },

}, defaultState)

test('[Reducer] it should return defaultState', assert => {

  const actual = myCounter(undefined, { type: ActionTypes.INIT })
  const expected = defaultState

  assert.equal(expected, actual)
  assert.end()
})

test('[Reducer] it should add 1', assert => {

  const actual = myCounter(defaultState, { type: 'myCounter/ADD', payload: 1 })
  const expected = { counter: 3 }

  assert.deepEqual(actual, expected)
  assert.end()
})

test('[Reducer] it should subtract 1', assert => {

  const actual = myCounter(defaultState, { type: 'myCounter/SUBTRACT', payload: 1 })
  const expected = { counter: 1 }

  assert.deepEqual(actual, expected)
  assert.end()
})
