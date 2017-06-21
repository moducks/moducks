import React from 'react'
import { render } from 'react-dom'
import { Provider, connect } from 'react-redux'
import getConfigureStore from './store'
import * as reducers from './moducks'
import * as sagas from './moducks/sagas'
import { load, clear } from './ducks/randomUser'
import JSONPretty from 'react-json-pretty'

const preloadedState = undefined
const configureStore = getConfigureStore(reducers, sagas)
const store = configureStore(preloadedState)

store.runSaga()

const App = connect(
  ({ randomUser }) => ({ randomUser }),
  { load, clear },
)(({ randomUser, errors, load, clear }) => {
  return (
    <div>
      <button onClick={() => load()}>LOAD</button>
      <button onClick={() => clear()}>CLEAR</button>
      <JSONPretty json={randomUser} />
    </div>
  )
})

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'),
)
