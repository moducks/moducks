import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { flattenSagas } from '../../../es'
import createSagaMiddleware from 'redux-saga'

export default (reducers, sagas) => function configureStore(preloadedState) {
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  const sagaMiddleware = createSagaMiddleware()

  const store = createStore(
    combineReducers(reducers),
    preloadedState,
    composeEnhancers(applyMiddleware(sagaMiddleware)),
  )

  return {
    ...store,
    runSaga: () => sagaMiddleware.run(function* () {
      yield flattenSagas(sagas)
    }),
  }
}
