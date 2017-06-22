import test from 'tape'
import { createModule } from '../src'

const { myModule, actionOne, actionTwo, actionThree } = createModule('myModule', {

  ACTION_ONE: {
    creator: (key, value) => ({ [key]: value }),
  },

  ACTION_TWO: {
    creator: [
      (first) => [first],              // payload
      (first, second) => ({ second }), // meta
    ],
  },

  ACTION_THREE: {},

}, {})

test('[Reducer] it should create a noop reducer', assert => {

  const state = {}

  const actual = myModule(state, { type: 'myModule/ACTION_ONE' })
  const expected = state

  assert.equal(expected, actual)
  assert.end()
})

test('[Reducer] it should create an action creator from function form', assert => {

  const action = actionOne('foo', 'bar')

  const actual = action
  const expected = { type: 'myModule/ACTION_ONE', payload: { foo: 'bar' } }

  assert.deepEqual(expected, actual)
  assert.end()
})

test('[Reducer] it should create an action creator from array form', assert => {

  const action = actionTwo('foo', 'bar')

  const actual = action
  const expected = { type: 'myModule/ACTION_TWO', payload: ['foo'], meta: { second: 'bar' } }

  assert.deepEqual(expected, actual)
  assert.end()
})


test('[Reducer] it should create an action creator from string form', assert => {

  const action = actionThree('foo')

  const actual = action
  const expected = { type: 'myModule/ACTION_THREE', payload: 'foo' }

  assert.deepEqual(expected, actual)
  assert.end()
})
