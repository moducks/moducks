import { createModule } from '../../es'
import { call } from 'redux-saga/effects'
import { delay } from 'redux-saga'

const initialState = {
  users: [],
  errors: [],
  pendingCounts: 0,
}

const fetchRandomUser = async () => {
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

const { reducer, sagas, load, loadSuccess, loadFailure, clear } = createModule('randomUser', {

  LOAD: {
    reducer: (state) => ({
      ...state,
      pendingCounts: state.pendingCounts + 1,
    }),
    saga: function* (action) {
      return loadSuccess(yield call(fetchRandomUser))
    },
    onError: (e) => loadFailure(e),
  },

  LOAD_SUCCESS: (state, { payload: user }) => ({
    ...state,
    users: state.users.concat([user.name]),
    pendingCounts: state.pendingCounts - 1,
  }),

  LOAD_FAILURE: (state, { payload: e }) => ({
    ...state,
    errors: state.errors.concat([e.message]),
    pendingCounts: state.pendingCounts - 1,
  }),

  CLEAR: (state) => ({
    ...state,
    users: [],
    errors: [],
  }),

}, initialState)

export default reducer
export { sagas }
export { load, clear }
