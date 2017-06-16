import { createModule } from 'moducks'

const initialState = {
  data: null,
  pending: false
}

const { reducer, sagas, load, loadSuccess, reset } = createModule('user', {
  LOAD: {
    reducer: (state) => ({ ...state, pending: true }),
    worker: function* () {
      const data = { name: 'john' } // api request
      return loadSuccess(data)
    }
  },
  LOAD_SUCCESS: (state, { payload: data }) => ({ ...state, pending: false, data }),
  RESET: () => initialState,
}, initialState)

export default reducer
export { sagas }

export { load, reset }
