import { call } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import moducks from './moducks'

const initialState = {
  users: [],
  errors: [],
  pendingCounts: 0,
}

export const fetchRandomUser = async () => {

  await delay((0.3 + Math.random()) * 1000)

  if (Math.random() < 0.2) {
    // Sometimes it fails
    const faces = ['xD', ':D', ':(']
    throw new Error(`503 Service Unavailable ${faces[Math.floor(Math.random() * faces.length)]}`)
  }

  const users = [
    { name: 'John' },
    { name: 'Mary' },
    { name: 'Bob' },
    { name: 'Cathy' },
    { name: 'Mike' },
  ]

  return users[Math.floor(Math.random() * users.length)]
}

export const {
  randomUser, sagas,
  load, loadSuccess, loadFailure, clear,
} = moducks.createModule('randomUser', {

  LOAD: {
    reducer: state => ({
      ...state,
      pendingCounts: state.pendingCounts + 1,
    }),
    saga: function* (action) { // eslint-disable-line no-unused-vars
      return loadSuccess(yield call(fetchRandomUser))
    },
    onError: (e, action) => loadFailure(e), // eslint-disable-line no-unused-vars
  },

  LOAD_SUCCESS: (state, { payload: user }) => ({
    ...state,
    users: [ ...state.users, user.name ],
    pendingCounts: state.pendingCounts - 1,
  }),

  LOAD_FAILURE: (state, { payload: e }) => ({
    ...state,
    errors: [ ...state.errors, e.message ],
    pendingCounts: state.pendingCounts - 1,
  }),

  CLEAR: state => ({
    ...state,
    users: [],
    errors: [],
  }),

}, initialState)
