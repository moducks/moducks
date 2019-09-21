import { createAction, handleActions } from 'redux-actions'
import camelCase from 'redux-actions/lib/utils/camelCase'
import schema from './schema'
import { isFunction, mapKeyValues } from './internal/helpers'
import processFunction from './internal/processFunction'

export default class Moducks {

  enhancibleForkerThunks = {
    takeEvery: onError => (patternOrChannel, worker, ...args) => this.effects.takeEvery(patternOrChannel, this.enhance(worker, onError), ...args),
    takeLeading: onError => (patternOrChannel, worker, ...args) => this.effects.takeLeading(patternOrChannel, this.enhance(worker, onError), ...args),
    takeLatest: onError => (patternOrChannel, worker, ...args) => this.effects.takeLatest(patternOrChannel, this.enhance(worker, onError), ...args),
    throttle: onError => (ms, pattern, worker, ...args) => this.effects.throttle(ms, pattern, this.enhance(worker, onError), ...args),
    fork: onError => (fn, ...args) => this.effects.fork(this.enhance(fn, onError), ...args),
    spawn: onError => (fn, ...args) => this.effects.spawn(this.enhance(fn, onError), ...args),
  }

  constructor(config) {
    this.config = schema.validateSync(config)
    this.enhancer = new Enhancer(this.config.effects)
  }

  constructor(effects) {
    this.effects = effects
    this.enhancedForkers = this.createEnhancedForkers(null)
  }

  has(effectName) {
    return isFunction(this.effects[effectName])
  }

  createEnhancedForkers(onError) {
    return mapKeyValues(this.enhancibleForkerThunks, ([name, thunk]) => this.has(name) ? { [name]: thunk(onError) } : null)
  }

  enhance(saga, onError) {
    return function* enhancedSaga(...args) {
      try {
        yield* processFunction(this.effects.put, saga, ...args)
      } catch (e) {
        if (!onError) throw e
        yield* processFunction(this.effects.put, onError, e, ...args)
      }
    }
  }
}

const thunkifyMainGeneratorFunction = (saga) => {
  return ({ type, [this.config.defaultEffect]: defaultEffect }) => defaultEffect(type, saga)
}

const thunkifyAdditionalGeneratorFunction = (saga) => {
  return ({ fork }) => fork(saga)
}

const initializeMainSaga = (saga, type, onError) => {
  const errLabels = [`Invalid saga for ${type}`, this.config.defaultEffect]
  return this.initializeSaga(this.thunkifyMainGeneratorFunction, saga, errLabels, { type }, onError)
}

initializeAdditionalSaga(saga, actions, sagaName) {
  const errLabels = [`Invalid additional saga ${sagaName}`, 'fork']
  return this.initializeSaga(this.thunkifyAdditionalGeneratorFunction, saga, errLabels, actions)
}

initializeSaga(thunkify, saga, errLabels, actions, onError) {
  if (typeof saga === 'function') saga = (this.util.isGeneratorFunction(saga) ? thunkify.call(this, saga) : saga)({
    ...actions,
    ...this.enhancer.createEnhancedForkers(onError),
    enhance: saga => this.enhancer.enhance(saga, onError),
  })
  if (this.util.isGeneratorFunction(saga)) return this.enhancer.enhancedForkers.fork(saga)
  if (this.util.isForkEffect(saga)) return saga
  console.log(saga)
  throw new Error(
    `${errLabels[0]}: It must be specified as one of them: \n` +
    `  - generator function (=> automatically invoked by enhanced ${errLabels[1]}())\n` +
    '  - thunk that returns generator function (=> automatically invoked by enhanced fork())\n' +
    '  - thunk that returns redux-saga FORK effect\n' +
    '  - redux-saga FORK effect'
  )
}

createModule(moduleName, definitions, initialState = {}, options = {}) {
  const reducerMap = {}
  const actions = {}
  const actionCreators = {}
  const sagas = {}

  for (const [rawType, definition] of Object.entries(definitions)) {

    const withApp = this.config.appName && !/^!?([*@])\1/.test(rawType)
    const withModule = !/^!?(?:\*|@{2})/.test(rawType)
    const useFullTypeAsKey = !withModule && /^!/.test(rawType)

    const type = rawType.replace(/^!?\*{0,2}/, '')
    const baseType = this.util.basename(type)
    const camelBaseType = camelCase(baseType)
    const fullType = `${withApp ? `@@${this.config.appName}/` : ''}${withModule ? `${moduleName}/` : ''}${type}`

    const {
      creator,
      reducer,
      saga,
      onError,
    } = typeof definition === 'function' ? { reducer: definition } : definition

    reducer && (reducerMap[fullType] = reducer)
    if (withModule) {
      actions[baseType] = fullType
      actionCreators[camelBaseType] = createAction(fullType, ...Array.isArray(creator) ? creator : [creator])
    }
    saga && (sagas[useFullTypeAsKey ? fullType : camelBaseType] = this.initializeMainSaga(saga, fullType, onError))
  }

  for (const [sagaName, saga] of Object.entries(options.sagas || {})) {
    sagas[sagaName] = this.initializeAdditionalSaga(saga, actions, sagaName)
  }

  return {
    [this.util.basename(moduleName)]: handleActions(reducerMap, initialState),
    sagas,
    ...actionCreators,
    ...actions,
  }
}