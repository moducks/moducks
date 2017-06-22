import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { flattenSagas } from '../../../es'
import createSagaMiddleware from 'redux-saga'

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
      yield flattenSagas(sagas)
    }),
  }
}
