# ![Moducks](https://github.com/moducks/moducks/blob/master/logos/logo.png?raw=true)

Extreamely simple [Ducks] module provider for the stack [Redux] + [Redux-Saga].

## Motivation

Without moducks, you have to define lengthy definitions for each modules.

```JavaScript
import { put, call, takeEvery } from 'redux-saga/effects'
import { fetchDataAsync } from './api'

const LOAD = 'user/LOAD'
const LOAD_SUCCESS = 'user/LOAD_SUCCESS'
const LOAD_FAILURE = 'user/LOAD_FAILURE'

export const load = (params) => ({ type: LOAD, payload: params })
const loadSuccess = (data) => ({ type: LOAD_SUCCESS, payload: data })
const loadFailure = (error) => ({ type: LOAD_FAILURE, payload: error })

const initialState = {
  data: null,
  pending: false,
  error: null,
}

export default reducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case LOAD:
      return { ...state, pending: true, error: null }
    case LOAD_SUCCESS:
      return { data: payload, pending: false, error: null }
    case LOAD_FAILURE:
      return { ...state, pending: false, error: payload }
    default:
      return state
  }
}

export const sagas = [
  takeEvery(LOAD, function* ({ payload: params }) {
    try {
      const data = yield call(fetchDataAsync, params)
      yield put(loadSuccess(data))
    } catch (e) {
      yield put(loadFailure(e))
    }
  }),
]
```

With moducks, module definitions will be extreamly simple. The following statement is equivalent to the above.

```JavaScript
import { createModule } from 'moducks'
import { call } from 'redux-saga/effects'
import { fetchDataAsync } from './api'

const initialState = {
  data: null,
  pending: false,
  error: null,
}

const { reducer, sagas, load, loadSuccess, loadFailure } = createModule('user', {
  LOAD: {
    reducer: (state) => ({ ...state, pending: true, error: null }),
    saga: function* ({ payload: params }) {
      const data = yield call(fetchDataAsync, params)
      return loadSuccess(data)
    },
    onError: loadFailure,
  },
  LOAD_SUCCESS: (state, { payload: data }) => ({ data, pending: false, error: null }),
  LOAD_FAILURE: (state, { payload: error }) => ({ ...state, pending: false, error }),
}, initialState)

export default reducer
export { sagas, load }
```

## Installing

```Bash
npm install moducks --save
```

## Todos

- Documentation
- Tests
- Contributing guides

[Ducks]: https://github.com/erikras/ducks-modular-redux
[Redux]: https://github.com/reactjs/redux
[Redux-Saga]: https://github.com/redux-saga/redux-saga
