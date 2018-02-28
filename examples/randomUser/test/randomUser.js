import test from 'tape'
import sagaHelper from 'redux-saga-testing'
import {
  randomUser, sagas,
  load, loadSuccess, loadFailure, clear,
  fetchRandomUser,
} from '../src/moducks/randomUser'
import { ActionTypes } from 'redux/lib/createStore'
import { call, put } from 'redux-saga/effects'
import moducks from '../src/moducks/moducks'

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

test('randomUser: sagas: load->loadSuccess', assert => {

  const iterator = moducks.util.retrieveWorkers(sagas).load(load())
  let current

  current = iterator.next()
  assert.deepEqual(current, {
    done: false,
    value: call(fetchRandomUser),
  })

  current = iterator.next({ name: 'Mary' })
  assert.deepEqual(current, {
    done: false,
    value: put(loadSuccess({ name: 'Mary' })),
  })

  current = iterator.next()
  assert.deepEqual(current, {
    done: true,
    value: undefined,
  })

  assert.end()
})

test('randomUser: sagas: load->loadFailure', assert => {

  const iterator = moducks.util.retrieveWorkers(sagas).load(load())
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

let it

it = sagaHelper(moducks.util.retrieveWorkers(sagas).load(load()), test)
it('randomUser (with redux-saga-testing): sagas: load->loadSuccess (STEP 1: it should call api)', (result, assert) => {
  assert.deepEqual(result, call(fetchRandomUser))
  assert.end()
  return { name: 'Mary' }
})
it('randomUser (with redux-saga-testing): sagas: load->loadSuccess (STEP 2: it should succeed)', (result, assert) => {
  assert.deepEqual(result, put(loadSuccess({ name: 'Mary' })))
  assert.end()
})
it('randomUser (with redux-saga-testing): sagas: load->loadSuccess (STEP 3: it should be terminated)', (result, assert) => {
  assert.equal(result, undefined)
  assert.end()
})

it = sagaHelper(moducks.util.retrieveWorkers(sagas).load(load()), test)
it('randomUser (with redux-saga-testing): sagas: load->loadFailure (STEP 1: it should call api)', (result, assert) => {
  assert.deepEqual(result, call(fetchRandomUser))
  assert.end()
  return new Error('503 Service Unavailable :(')
})
it('randomUser (with redux-saga-testing): sagas: load->loadFailure (STEP 2: it should fail)', (result, assert) => {
  assert.deepEqual(result, put(loadFailure(new Error('503 Service Unavailable :('))))
  assert.end()
})
it('randomUser (with redux-saga-testing): sagas: load->loadFailure (STEP 3: it should be terminated)', (result, assert) => {
  assert.equal(result, undefined)
  assert.end()
})
