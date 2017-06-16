import { createModule } from 'moducks'
import { put } from 'redux-saga/effects'

const initialState = {
  data: null,
  pending: false
}

const { reducer, sagas, load, loadSuccess, reset } = createModule('user', {
  LOAD: {
    reducer: (state) => ({ ...state, pending: true }),
    worker: function* () {
      const data = { name: 'john' } // api request
      yield put(loadSuccess(data))
    }
  },
  LOAD_SUCCESS: (state, { payload: data }) => ({ ...state, pending: false, data }),
  RESET: () => initialState,
}, initialState)

export default reducer
export { sagas }

export { load, reset }
