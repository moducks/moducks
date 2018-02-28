import { createAction, handleActions } from 'redux-actions'
import camelCase from 'redux-actions/lib/camelCase'
import schema from './schema'
import Enhancer from './Enhancer'
import Util from './Util'

export default class Moducks {

  constructor(config) {
    this.config = schema.validateSync(config)
    this.util = new Util(this.extractIOSymbol())
    this.enhancer = new Enhancer(this.util, this.config.effects)
  }

  extractIOSymbol = () => {
    const task = this.config.effects.fork(function* () {})
    if (typeof task === 'object' && task !== null) {
      const string = '@@redux-saga/IO'
      if (task[string]) return string
      const symbol = Object.getOwnPropertySymbols(task).find(symbol => symbol.toString() === 'Symbol(@@redux-saga/IO)')
      if (task[symbol]) return symbol
    }
    throw new Error('Cannot find symbol: @@redux-saga/IO')
  }

  thunkifyMainGeneratorFunction = saga => ({ type, [this.config.defaultEffect]: defaultEffect }) => defaultEffect(type, saga)
  thunkifyAdditionalGeneratorFunction = saga => ({ fork }) => fork(saga)

  initializeMainSaga = (saga, type, onError) => {
    const errLabels = [`Invalid saga for ${type}`, this.config.defaultEffect]
    return this.initializeSaga(this.thunkifyMainGeneratorFunction, saga, errLabels, { type }, onError)
  }
  initializeAdditionalSaga = (saga, actions, sagaName) => {
    const errLabels = [`Invalid additional saga ${sagaName}`, 'fork']
    return this.initializeSaga(this.thunkifyAdditionalGeneratorFunction, saga, errLabels, actions)
  }

  initializeSaga = (thunkify, saga, errLabels, actions, onError) => {
    if (typeof saga === 'function') {
      saga = (this.util.isGeneratorFunction(saga) ? thunkify(saga) : saga)({
        ...actions,
        ...this.util.mapKeyValues(this.enhancer.enhancibleForkerThunks, ([name, thunk]) => this.enhancer.has(name) ? { [name]: thunk(onError) } : null),
        enhance: saga => this.enhancer.enhance(saga, onError),
      })
    }
    if (this.util.isGeneratorFunction(saga)) return this.enhancer.enhancedForkers.fork(saga)
    if (this.util.isForkEffect(saga)) return saga
    throw new Error(
      `${errLabels[0]}: It must be specified as one of them: \n` +
      `  - generator function (=> automatically invoked by enhanced ${errLabels[1]}())\n` +
      '  - thunk that returns generator function (=> automatically invoked by enhanced fork())\n' +
      '  - thunk that returns redux-saga FORK effect\n' +
      '  - redux-saga FORK effect'
    )
  }

  createModule = (moduleName, definitions, initialState = {}, options = {}) => {
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
}
