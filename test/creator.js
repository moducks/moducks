import test from 'tape'
import * as effects from 'redux-saga/effects'
import Moducks from '../src'

const moducks = new Moducks({ effects })

const { actionOne, actionTwo, actionThree } = moducks.createModule('myModule', {

  ACTION_ONE: {
    creator: (key, value) => ({ [key]: value }),
  },

  ACTION_TWO: {
    creator: [
      first => [first],                // payload
      (first, second) => ({ second }), // meta
    ],
  },

  ACTION_THREE: {},

}, {})

test('[Creator] it should create an action creator from function form', assert => {

  const actual = actionOne('foo', 'bar')
  const expected = { type: 'myModule/ACTION_ONE', payload: { foo: 'bar' } }

  assert.deepEqual(actual, expected)
  assert.end()
})

test('[Creator] it should create an action creator from array form', assert => {

  const actual = actionTwo('foo', 'bar')
  const expected = { type: 'myModule/ACTION_TWO', payload: ['foo'], meta: { second: 'bar' } }

  assert.deepEqual(actual, expected)
  assert.end()
})

test('[Creator] it should create an action creator from string form', assert => {

  const actual = actionThree('foo')
  const expected = { type: 'myModule/ACTION_THREE', payload: 'foo' }

  assert.deepEqual(actual, expected)
  assert.end()
})

test('[Creator] it handles module with namespace', assert => {

  const moducks = new Moducks({ effects })
  const { fooAction, FOO_ACTION } = moducks.createModule('my/awesomeModule', {
    FOO_ACTION: {},
  })

  assert.deepEqual(fooAction().type, FOO_ACTION)
  assert.deepEqual(fooAction().type, 'my/awesomeModule/FOO_ACTION')
  assert.end()
})

test('[Creator] it handles module with application and namespace', assert => {

  const moducks = new Moducks({ effects, appName: 'myApp' })
  const { fooAction, FOO_ACTION } = moducks.createModule('my/awesomeModule', {
    FOO_ACTION: {},
  })

  assert.deepEqual(fooAction().type, FOO_ACTION)
  assert.deepEqual(fooAction().type, '@@myApp/my/awesomeModule/FOO_ACTION')
  assert.end()
})