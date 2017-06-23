import test from 'tape'
import {
  randomUser, sagas,
  load, loadSuccess, loadFailure, clear,
  fetchRandomUser,
} from '../src/moducks/randomUser'
import { ActionTypes } from 'redux/lib/createStore'
import { call, put } from 'redux-saga/effects'
import { retrieveWorkers } from '../../../es'

test('randomUser: creators', assert => {

  assert.deepEqual(load(), {
    type: 'randomUser/LOAD',
  })
  assert.deepEqual(loadSuccess({ name: 'John' }), {
    type: 'randomUser/LOAD_SUCCESS',
    payload: { name: 'John' },
  })
  assert.deepEqual(loadFailure(new Error('503 Service Unavailable xD')), {
    type: 'randomUser/LOAD_FAILURE',
    payload: new Error('503 Service Unavailable xD'),
    error: true,
  })
  assert.end()
})

test('randomUser: reducer', assert => {

  let state

  state = randomUser(state, ActionTypes.INIT)
  assert.deepEqual(state, {
    users: [],
    errors: [],
    pendingCounts: 0,
  })

  state = randomUser(state, load())
  assert.deepEqual(state, {
    users: [],
    errors: [],
    pendingCounts: 1,
  })

  state = randomUser(state, load())
  assert.deepEqual(state, {
    users: [],
    errors: [],
    pendingCounts: 2,
  })

  state = randomUser(state, loadSuccess({ name: 'John' }))
  assert.deepEqual(state, {
    users: ['John'],
    errors: [],
    pendingCounts: 1,
  })

  state = randomUser(state, clear())
  assert.deepEqual(state, {
    users: [],
    errors: [],
    pendingCounts: 1,
  })

  state = randomUser(state, loadFailure(new Error('503 Service Unavailable xD')))
  assert.deepEqual(state, {
    users: [],
    errors: ['503 Service Unavailable xD'],
    pendingCounts: 0,
  })

  assert.end()
})

test('randomUser: sagas: loadSaga (Success)', assert => {

  const iterator = retrieveWorkers(sagas).load(load())
  let current

  current = iterator.next()
  assert.deepEqual(current, {
    done: false,
    value: call(fetchRandomUser),
  })

  current = iterator.next({ name: 'Mary' })
  assert.deepEqual(current, {
    done: false,
    value: put(loadSuccess({ name: 'Mary' }))
  })

  current = iterator.next()
  assert.deepEqual(current, {
    done: true,
    value: undefined,
  })

  assert.end()
})

test('randomUser: sagas: loadSaga (Failure)', assert => {

  const iterator = retrieveWorkers(sagas).load(load())
  let current

  current = iterator.next()
  assert.deepEqual(current, {
    done: false,
    value: call(fetchRandomUser),
  })

  current = iterator.throw(new Error('503 Service Unavailable :('))
  assert.deepEqual(current, {
    done: false,
    value: put(loadFailure(new Error('503 Service Unavailable :('))),
  })

  current = iterator.next()
  assert.deepEqual(current, {
    done: true,
    value: undefined,
  })

  assert.end()
})
