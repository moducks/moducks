import test from 'tape'
import * as effects from 'redux-saga/effects'
import Moducks from '../src'

const moducks = new Moducks({ effects })

test('[Extras] it should flatten nested objects and arrays into a flat array of redux-saga effects', assert => {

  const expected = [
    effects.takeEvery('A', function* () { }),
    effects.takeLatest('B', function* () { }),
    effects.throttle(100, 'C', function* () { }),
    effects.fork(function* () { }),
    effects.spawn(function* () { }),
  ]

  const actual = moducks.util.flattenSagas(
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
      x => x + 1,
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

test('[Extras] it retrieves original generator function', assert => {

  const expected = {
    *s1() { },
    *s2() { },
    *s3() { },
    *s4() { },
    *s5() { },
  }
  const actual = moducks.util.retrieveWorkers({
    s1: effects.takeEvery('A', expected.s1),
    s2: effects.takeLatest('B', expected.s2),
    s3: effects.throttle(100, 'C', expected.s3),
    s4: effects.fork(expected.s4),
    s5: effects.spawn(expected.s5),
  })

  assert.deepEqual(actual, expected)
  assert.end()
})
