import React from 'react'
import { render } from 'react-dom'
import { Provider, connect } from 'react-redux'
import configureStore from './store'
import * as reducers from './moducks'
import * as sagas from './moducks/sagas'
import { load, clear } from './moducks/randomUser'
import JSONPretty from 'react-json-pretty'

const store = configureStore(reducers, sagas)
store.runSaga()

const App = connect(
  ({ randomUser }) => ({ randomUser }),
  { load, clear },
)(({ randomUser, load, clear }) => {
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
