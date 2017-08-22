import { createModule } from '../../../../es'
import { call } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import axios, { CancelToken } from 'axios'
import * as api from '../api'

const defaultState = {
  q: null,
  pending: false,
  error: null,
  cancelTokenSource: null,
  packages: [],
  total: 0,
  hasMore: false,
}

export const {
  npmSearch, sagas, selectModule,
  inputChange, load, loadSuccess, loadFailure, loadCancel, clear,
} = createModule('npmSearch', {

  INPUT_CHANGE: {
    // observe latest text input changes
    saga: ({ type, takeLatest }) => takeLatest(type, function* ({ payload }) {
      const state = yield selectModule.effect()
      if (state.pending) {
        // if previous request is remaining, cancel it
        yield loadCancel(state.cancelTokenSource)
      }
      yield call(delay, 500)
      // dispatch LOAD after 0.5 seconds passed with no text input changes
      return load(payload)
    }),
  },

  LOAD: {
    // create cancelable request
    creator: q => ({ q, cancelTokenSource: CancelToken.source() }),
    reducer: (state, { payload: { cancelTokenSource } }) => ({
      ...state,
      pending: true,
      cancelTokenSource,
    }),
    saga: function* ({ payload: { q, cancelTokenSource } }) {
      const state = yield selectModule.effect()
      // if keyword is empty string, we don't have to dispatch actual request
      if (q !== undefined && q.trim() === '') {
        return clear()
      }
      // if keyword is undefined, keep previous keyword
      if (q === undefined) {
        q = state.q
      }
      // dispatch cancelable request
      //   the same keyword:  keep offset
      //   different keyword: refresh offset
      const refresh = state.q !== q
      const { data } = yield call(api.search,
        { q, from: refresh ? undefined : state.packages.length },
        { cancelToken: cancelTokenSource.token },
      )
      // dispatch LOAD_SUCCESS
      return loadSuccess(data, q, refresh)
    },
    // dispatch LOAD_FAILURE if it is not triggered by request cancelation
    onError: e => !axios.isCancel(e) && loadFailure(e),
  },

  LOAD_SUCCESS: {
    creator: [
      payload => payload,
      (payload, q, refresh) => ({ q, refresh }),
    ],
    reducer: (state, { payload: { total, results }, meta: { q, refresh } }) => ({
      ...state,
      q,
      pending: false,
      error: null,
      cancelTokenSource: null,
      packages: [ ...refresh ? [] : state.packages, ...results ],
      total,
      hasMore: (refresh ? [] : state.packages).length + results.length < total,
    }),
  },

  LOAD_FAILURE: (state, { payload: e }) => ({
    ...state,
    pending: false,
    error: e.message,
    cancelTokenSource: null,
  }),

  LOAD_CANCEL: {
    reducer: state => ({
      ...state,
      pending: false,
      cancelTokenSource: null,
    }),
    saga: function* ({ payload: cancelTokenSource }) { // eslint-disable-line require-yield
      cancelTokenSource.cancel()
    },
  },

  CLEAR: state => ({
    ...state,
    q: null,
    pending: false,
    error: null,
    cancelTokenSource: null,
    packages: [],
    total: 0,
    hasMore: false,
  }),

}, defaultState)
