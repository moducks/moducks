<img src="https://github.com/moducks/moducks/blob/master/logo/logo.png?raw=true" alt="Moducks">

# moducks

[![npm version](https://badge.fury.io/js/moducks.svg)](https://badge.fury.io/js/moducks)
[![Build Status](https://travis-ci.org/moducks/moducks.svg?branch=master)](https://travis-ci.org/moducks/moducks)

[Ducks](https://github.com/erikras/ducks-modular-redux) ([Redux] Reducer Bundles) + [Redux-Saga] = **Moducks**

## Getting Started

### Installing

```Bash
npm install moducks@1.0.0-beta.5 --save
```

### Contents

- [Examples](./examples)
- [Documentation](./docs)
- [Source](./src)
- [Test](./test)

## Motivation

Please consider the following fake API:

```javascript
import { delay } from 'redux-saga'

export const fetchRandomUser = async () => {

  await delay((0.3 + Math.random()) * 1000)

  if (Math.random() < 0.2) {
    // Sometimes it fails
    const faces = ['xD', ':D', ':(']
    throw new Error(`503 Service Unavailable ${faces[Math.floor(Math.random() * faces.length)]}`)
  }

  const users = [
    { name: 'John' },
    { name: 'Mary' },
    { name: 'Bob' },
    { name: 'Cathy' },
    { name: 'Mike' },
  ]

  return users[Math.floor(Math.random() * users.length)]
}
```

Without moducks, you have to define lengthy definitions for each module.

```javascript
import { call, put, takeEvery } from 'redux-saga/effects'
import { fetchRandomUser } from '../api'

const LOAD = '@@myApp/randomUser/LOAD'
const LOAD_SUCCESS = '@@myApp/randomUser/LOAD_SUCCESS'
const LOAD_FAILURE = '@@myApp/randomUser/LOAD_FAILURE'
const CLEAR = '@@myApp/randomUser/CLEAR'

export const load = () => ({ type: LOAD })
const loadSuccess = data => ({ type: LOAD_SUCCESS, payload: data })
const loadFailure = error => ({ type: LOAD_FAILURE, payload: error, error: true })
export const clear = () => ({ type: CLEAR })

const initialState = {
  users: [],
  errors: [],
  pendingCounts: 0,
}

export default (state = initialState, { type, payload }) => {
  switch (type) {

    case LOAD:
      return {
        ...state,
        pendingCounts: state.pendingCounts + 1,
      }

    case LOAD_SUCCESS:
      return {
        ...state,
        users: [ ...state.users, payload.name ],
        pendingCounts: state.pendingCounts - 1,
      }

    case LOAD_FAILURE:
      return {
        ...state,
        errors: [ ...state.errors, payload.message ],
        pendingCounts: state.pendingCounts - 1,
      }

    case CLEAR:
      return {
        ...state,
        users: [],
        errors: [],
      }

    default:
      return state
  }
}

export const sagas = {

  load: takeEvery(LOAD, function* (action) {
    try {
      yield put(loadSuccess(yield call(fetchRandomUser)))
    } catch (e) {
      yield put(loadFailure(e))
    }
  }),

}
```

With moducks, module definition will be extremely simple. The following snippet is equivalent to the above.

```javascript
import Moducks from 'moducks'
import * as effects from 'redux-saga/effects'
import { fetchRandomUser } from '../api'

const moducks = new Moducks({ effects, appName: 'myApp' })

const initialState = {
  users: [],
  errors: [],
  pendingCounts: 0,
}

const {
  randomUser, sagas,
  load, loadSuccess, loadFailure, clear,
} = moducks.createModule('randomUser', {

  LOAD: {
    reducer: state => ({
      ...state,
      pendingCounts: state.pendingCounts + 1,
    }),
    saga: function* (action) {
      return loadSuccess(yield effects.call(fetchRandomUser))
    },
    onError: (e, action) => loadFailure(e),
  },

  LOAD_SUCCESS: (state, { payload: user }) => ({
    ...state,
    users: [ ...state.users, user.name ],
    pendingCounts: state.pendingCounts - 1,
  }),

  LOAD_FAILURE: (state, { payload: e }) => ({
    ...state,
    errors: [ ...state.errors, e.message ],
    pendingCounts: state.pendingCounts - 1,
  }),

  CLEAR: state => ({
    ...state,
    users: [],
    errors: [],
  }),

}, initialState)

export default randomUser
export { sagas, load, clear }
```

[Redux]: https://github.com/reactjs/redux
[Redux-Saga]: https://github.com/redux-saga/redux-saga
