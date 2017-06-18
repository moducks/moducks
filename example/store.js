import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
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
      yield Object.values(sagas).reduce((prev, sagas) => [ ...prev, ...Object.values(sagas) ], [])
    }),
  }
}

