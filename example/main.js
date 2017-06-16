import React from 'react'
import { render } from 'react-dom'
import { Provider, connect } from 'react-redux'
import getConfigureStore from './store'
import * as reducers from './ducks'
import * as sagas from './ducks/sagas'
import { load, reset } from './ducks/user'

const preloadedState = undefined
const configureStore = getConfigureStore(reducers, sagas)
const store = configureStore(preloadedState)

store.runSaga()

const App = connect(
  ({ user }) => ({ user }),
  { load, reset }
)(({ user, load, reset }) => {
  return (
    <div>
      <button onClick={e => load()}>LOAD</button>
      <button onClick={e => reset()}>RESET</button>
      <span>{JSON.stringify(user)}</span>
    </div>
  )
})

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
