import { createModule } from '../../es/index'
import { select } from 'redux-saga/effects'

const initialState = {
  data: null,
  throwError: false,
  pending: false,
  failed: false
}

const { reducer, sagas, load, loadSuccess, loadFailure, toggleThrowError, reset } = createModule('user', {
  LOAD: {
    reducer: (state) => ({ ...state, pending: true }),
    saga: function* () {
      const throwError = yield select(({ user: { throwError } }) => throwError)
      if (throwError) {
        // simulate error
        throw new Error('Boring Error')
      }
      const data = { name: 'john' } // api request
      return loadSuccess(data)
    },
    onError: (e) => {
      console.error(e)
      return loadFailure()
    }
  },
  TOGGLE_THROW_ERROR: (state) => ({ ...state, throwError: !state.throwError }),
  LOAD_SUCCESS: (state, { payload: data }) => ({ ...state, pending: false, data }),
  LOAD_FAILURE: (state) => ({ ...state, pending: false, failed: true }),
  RESET: () => initialState,
}, initialState)

export default reducer
export { sagas }
export { load, reset, toggleThrowError }
