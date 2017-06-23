import test from 'tape'
import { takeEvery, takeLatest, throttle, fork, spawn } from 'redux-saga/effects'
import { flattenSagas, createApp } from '../src'

test('[Extras] it should flatten nested objects and arrays into a flat array of redux-saga effects', assert => {

  const expected = [
    takeEvery('A', function* () { }),
    takeLatest('B', function* () { }),
    throttle(100, 'C', function* () { }),
    fork(function* () { }),
    spawn(function* () { }),
  ]

  const actual = flattenSagas(
    {
      a: {
        b: expected[0],
        c: {
          d: expected[1],
          e: 'foo',
          f: [],
        },
      },
      g: expected[2],
    },
    [
      {
        h: expected[3],
      },
      'bar',
      null,
      undefined,
      0,
      Symbol('baz'),
      x => 1,
      {
        i: [
          expected[4],
        ],
      },
    ],
  )

  assert.deepEqual(actual, expected)
  assert.end()
})

test('[Extras] it pre-prefixes module names', assert => {

  const createMyAppModule = createApp('myApp')
  const { fooAction } = createMyAppModule('fooModule', { FOO_ACTION: {} })
  const { barAction } = createMyAppModule('barModule', { BAR_ACTION: {} })

  assert.deepEqual(fooAction(), { type: '@@myApp/fooModule/FOO_ACTION' })
  assert.deepEqual(barAction(), { type: '@@myApp/barModule/BAR_ACTION' })
  assert.end()
})
