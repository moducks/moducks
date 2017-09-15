import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import { flattenSagas } from '../../../es'
import createSagaMiddleware from 'redux-saga'
import { all } from 'redux-saga/effects'

export default function configureStore(reducers, sagas) {

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  const sagaMiddleware = createSagaMiddleware()

  const store = createStore(
    combineReducers(reducers),
    composeEnhancers(applyMiddleware(sagaMiddleware)),
  )

  return {
    ...store,
    runSaga: () => sagaMiddleware.run(function* () {
      yield all(flattenSagas(sagas))
    }),
  }
}
