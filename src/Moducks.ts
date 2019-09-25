import { createAction, handleActions } from 'redux-actions';
import camelCase from 'to-camel-case';
import schema from './schema';
import { isFunction, mapKeyValues } from './internal/helpers';
import processFunction from './internal/processFunction';
import {
  IterableSagaIterator,
  ModucksConfig,
  Saga,
  OnError,
  ThrottleFunction
} from './types';
import { MappedObject } from './internal/helpers/object';
import { Pattern } from 'redux-saga/effects';

export default class Moducks {
  private config: ModucksConfig;

  public enhancibleForkerThunks = {
    fork: <S extends Saga>(onError: OnError) => (
      fn: S,
      ...args: Parameters<S>[]
    ) => this.config.effects.fork(this.enhance(fn, onError), ...args),

    spawn: <S extends Saga>(onError: OnError) => (
      fn: S,
      ...args: Parameters<S>[]
    ) => this.config.effects.spawn!(this.enhance(fn, onError), ...args),

    throttle: <S extends Saga, P extends Parameters<ThrottleFunction>>(
      onError: OnError
    ) => (ms: P[0], patternOrChannel: P[1], worker: P[2], ...args: any[]) =>
      this.config.effects.throttle!(
        ms,
        patternOrChannel,
        this.enhance(worker, onError),
        ...args
      ),

    debounce: onError => (ms, pattern, worker, ...args) =>
      this.config.effects.debounce!(ms, pattern, worker, ...args),

    takeEvery: onError => (patternOrChannel, worker, ...args) =>
      this.config.effects.takeEvery!(
        patternOrChannel,
        this.enhance(worker, onError),
        ...args
      ),

    takeLeading: onError => (patternOrChannel, worker, ...args) =>
      this.config.effects.takeLeading!(
        patternOrChannel,
        this.enhance(worker, onError),
        ...args
      ),

    takeLatest: onError => (patternOrChannel, worker, ...args) =>
      this.config.effects.takeLatest!(
        patternOrChannel,
        this.enhance(worker, onError),
        ...args
      )
  };

  private enhancedForkers: MappedObject<{
    takeLeading: (onError) => (patternOrChannel, worker, ...args) => any;
    throttle: (onError) => (ms, pattern, worker, ...args) => any;
    fork: (onError) => (fn, ...args) => any;
    spawn: (onError) => (fn, ...args) => any;
    takeEvery: (onError) => (patternOrChannel, worker, ...args) => any;
    takeLatest: (onError) => (patternOrChannel, worker, ...args) => any;
  }>;

  constructor(config: ModucksConfig) {
    this.config = schema.validateSync(config) as ModucksConfig;
    this.enhancedForkers = this.createEnhancedForkers(null);
  }

  public has(effectName: string) {
    return isFunction((this.config.effects as any)[effectName]);
  }

  public createEnhancedForkers(onError: OnError) {
    return mapKeyValues(this.enhancibleForkerThunks, ([name, thunk]) =>
      this.has(name) ? { [name]: thunk(onError) } : null
    );
  }

  enhance<S extends Saga>(saga: S, onError?: OnError<S>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return function* enhancedSaga(
      ...args: Parameters<S>
    ): IterableSagaIterator {
      try {
        yield* processFunction(self.config.effects.put, saga, ...args);
      } catch (e) {
        if (!onError) throw e;
        yield* processFunction(self.config.effects.put, onError, e, ...args);
      }
    };
  }

  createModule(moduleName, definitions, initialState = {}, options = {}) {
    const reducerMap = {};
    const actions = {};
    const actionCreators = {};
    const sagas = {};

    for (const [rawType, definition] of Object.entries(definitions)) {
      const withApp = this.config.appName && !/^!?([*@])\1/.test(rawType);
      const withModule = !/^!?(?:\*|@{2})/.test(rawType);
      const useFullTypeAsKey = !withModule && /^!/.test(rawType);

      const type = rawType.replace(/^!?\*{0,2}/, '');
      const baseType = this.util.basename(type);
      const camelBaseType = camelCase(baseType);
      const fullType = `${withApp ? `@@${this.config.appName}/` : ''}${
        withModule ? `${moduleName}/` : ''
      }${type}`;

      const { creator, reducer, saga, onError } =
        typeof definition === 'function' ? { reducer: definition } : definition;

      reducer && (reducerMap[fullType] = reducer);
      if (withModule) {
        actions[baseType] = fullType;
        actionCreators[camelBaseType] = createAction(
          fullType,
          ...(Array.isArray(creator) ? creator : [creator])
        );
      }
      saga &&
        (sagas[
          useFullTypeAsKey ? fullType : camelBaseType
        ] = this.initializeMainSaga(saga, fullType, onError));
    }

    for (const [sagaName, saga] of Object.entries(options.sagas || {})) {
      sagas[sagaName] = this.initializeAdditionalSaga(saga, actions, sagaName);
    }

    return {
      [this.util.basename(moduleName)]: handleActions(reducerMap, initialState),
      sagas,
      ...actionCreators,
      ...actions
    };
  }

  thunkifyMainGeneratorFunction = saga => {
    return ({ type, [this.config.defaultEffect]: defaultEffect }) =>
      defaultEffect(type, saga);
  };

  thunkifyAdditionalGeneratorFunction = saga => {
    return ({ fork }) => fork(saga);
  };

  initializeMainSaga = (saga, type, onError) => {
    const errLabels = [`Invalid saga for ${type}`, this.config.defaultEffect];
    return this.initializeSaga(
      this.thunkifyMainGeneratorFunction,
      saga,
      errLabels,
      { type },
      onError
    );
  };

  initializeAdditionalSaga(saga, actions, sagaName) {
    const errLabels = [`Invalid additional saga ${sagaName}`, 'fork'];
    return this.initializeSaga(
      this.thunkifyAdditionalGeneratorFunction,
      saga,
      errLabels,
      actions
    );
  }

  initializeSaga(thunkify, saga, errLabels, actions, onError) {
    if (typeof saga === 'function')
      saga = (this.util.isGeneratorFunction(saga)
        ? thunkify.call(this, saga)
        : saga)({
        ...actions,
        ...this.enhancer.createEnhancedForkers(onError),
        enhance: saga => this.enhancer.enhance(saga, onError)
      });
    if (this.util.isGeneratorFunction(saga))
      return this.enhancer.enhancedForkers.fork(saga);
    if (this.util.isForkEffect(saga)) return saga;
    console.log(saga);
    throw new Error(
      `${errLabels[0]}: It must be specified as one of them: \n` +
        `  - generator function (=> automatically invoked by enhanced ${errLabels[1]}())\n` +
        '  - thunk that returns generator function (=> automatically invoked by enhanced fork())\n' +
        '  - thunk that returns redux-saga FORK effect\n' +
        '  - redux-saga FORK effect'
    );
  }
}
