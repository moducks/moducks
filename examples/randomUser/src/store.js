import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { all } from 'redux-saga/effects'
import moducks from './moducks/moducks'

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
      yield all(moducks.util.flattenSagas(sagas))
    }),
  }
}
