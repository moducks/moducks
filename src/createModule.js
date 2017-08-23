import camelCase from 'redux-actions/lib/camelCase'
import { createAction, handleActions } from 'redux-actions'
import { select } from 'redux-saga/effects'
import { createSelector, defaultMemoize, createSelectorCreator, createStructuredSelector } from 'reselect'
import { isForkEffect, isGeneratorFunction, isNormalFunction, mapValues } from './utils'
import { enhance, enhancibleForkerThunks, enhancedForkers } from './enhance'

const initializeSelectors = (moduleName, factory) => {
  const selectors = { selectModule: state => state[moduleName] }
  if (factory && !isNormalFunction(factory)) {
    throw new Error('Invalid option selectorFactory: It must be a function that returns selector definitions.')
  }
  if (isNormalFunction(factory)) {
    Object.assign(selectors, factory({ selectModule: selectors.selectModule, createSelector, defaultMemoize, createSelectorCreator, createStructuredSelector }))
  }
  for (const [name, fn] of Object.entries(selectors)) {
    if (!isNormalFunction(fn)) throw new Error(`Invalid selector entry ${name}: It must be a function.`)
    fn.effect = (...args) => select(fn, ...args)
  }
  return selectors
}

const thunkifyMainGeneratorFunction = saga => ({ type, takeEvery }) => takeEvery(type, saga)
const thunkifyAdditionalGeneratorFunction = saga => ({ fork }) => fork(saga)

const initializeMainSaga = (saga, selectors, type, onError) => {
  const errLabels = [`Invalid saga for ${type}`, 'takeEvery']
  return initializeSaga(thunkifyMainGeneratorFunction, saga, selectors, errLabels, { type }, onError)
}
const initializeAdditionalSaga = (saga, selectors, types, name) => {
  const errLabels = [`Invalid additional saga ${name}`, 'fork']
  return initializeSaga(thunkifyAdditionalGeneratorFunction, saga, selectors, errLabels, types)
}

const initializeSaga = (thunkify, saga, selectors, errLabels, types, onError) => {
  if (typeof saga === 'function') {
    saga = (isGeneratorFunction(saga) ? thunkify(saga) : saga)({
      ...types,
      ...mapValues(enhancibleForkerThunks, thunk => thunk(onError)),
      enhance: saga => enhance(saga, onError),
      ...selectors,
    })
  }
  if (isGeneratorFunction(saga)) return enhancedForkers.fork(saga)
  if (isForkEffect(saga)) return saga
  throw new Error(
    `${errLabels[0]}: It must be specified as one of them: \n` +
    `  - generator function (=> automatically invoked by enhanced ${errLabels[1]}())\n` +
    '  - thunk that returns generator function (=> automatically invoked by enhanced fork())\n' +
    '  - thunk that returns redux-saga FORK effect\n' +
    '  - redux-saga FORK effect'
  )
}

const createModuleWithApp = (
  moduleName,
  definitions,
  defaultState,
  options,
  appName,
) => {

  const prefix = appName ? `@@${appName}/` : ''
  const reducerMap = {}
  const actions = {}
  const actionCreators = {}
  const sagas = {}
  const selectors = initializeSelectors(moduleName, options.selectorFactory)

  for (const [type, definition] of Object.entries(definitions)) {

    const actionType = `${prefix}${moduleName}/${type}`
    const camelType = camelCase(type)
    const {
      creator,
      reducer,
      saga,
      onError,
    } = typeof definition === 'function' ? { reducer: definition } : definition

    reducer && (reducerMap[actionType] = reducer)
    actions[type] = actionType
    actionCreators[camelType] = createAction(actionType, ...Array.isArray(creator) ? creator : [ creator ])
    saga && (sagas[camelType] = initializeMainSaga(saga, selectors, actionType, onError))
  }

  for (const [name, saga] of Object.entries(options.sagas || {})) {
    sagas[name] = initializeAdditionalSaga(saga, selectors, actions, name)
  }

  return {
    [moduleName]: handleActions(reducerMap, defaultState),
    sagas,
    ...actionCreators,
    ...actions,
    ...selectors,
  }
}

export const createModule = (moduleName, definitions, defaultState = {}, options = {}) => createModuleWithApp(moduleName, definitions, defaultState, options)
export const createApp = appName => (moduleName, definitions, defaultState = {}, options = {}) => createModuleWithApp(moduleName, definitions, defaultState, options, appName)
