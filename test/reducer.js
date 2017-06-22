import test from 'tape'
import { createModule } from '../src'

const { myCounter, add, subtract } = createModule('myCounter', {

  // function form
  ADD: (state, action) => ({ counter: state.counter + action.payload }),

  // object form
  SUBTRACT: {
    reducer: (state, action) => ({
      counter: state.counter - action.payload,
    }),
  },

}, { counter: 2 })

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
