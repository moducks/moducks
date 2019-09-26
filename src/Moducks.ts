import { createAction, handleActions } from 'redux-actions';
import camelCase from 'to-camel-case';
import schema from './schema';
import { isFunction, mapKeyValues, basename } from './internal/helpers';
import processFunction from './internal/processFunction';
import {
  EnhanceFunction,
  ModucksConfig,
  OnError,
  StrictGeneratorFunction,
  GeneratorFunctionYieldType,
} from './types';
import { ForkEffect, ActionPattern } from 'redux-saga/effects';
import { Action } from 'redux';
import {MappedObject} from './internal/helpers/object';

export default class Moducks {
  public readonly config: ModucksConfig;

  public readonly enhancibleForkerThunks = {
    fork: (onError?: OnError) => <
      F extends StrictGeneratorFunction,
      R extends ForkEffect<GeneratorFunctionYieldType<EnhanceFunction<F>>>
    >(
      fn: F,
      ...args: Parameters<F>
    ): R => this.config.effects.fork(this.enhance(fn, onError), ...args) as R,

    spawn: (onError?: OnError) => <
      F extends StrictGeneratorFunction,
      R extends ForkEffect<GeneratorFunctionYieldType<EnhanceFunction<F>>>
    >(
      fn: F,
      ...args: Parameters<F>
    ): R => {
      if (!this.config.effects.spawn) {
        throw new Error('spawn effect is not available');
      }
      return this.config.effects.spawn(this.enhance(fn, onError), ...args) as R;
    },

    throttle: (onError?: OnError) => <
      F extends StrictGeneratorFunction,
      A extends ActionPattern | Action
    >(
      ms: number,
      patternOrChannel: A,
      worker: F,
      ...args: any[]
    ) => {
      if (!this.config.effects.throttle) {
        throw new Error('throttle effect is not available');
      }
      return this.config.effects.throttle(
        ms,
        patternOrChannel as (Extract<A, ActionPattern> & Extract<A, Action>),
        this.enhance(worker, onError),
        ...args
      );
    },

    debounce: (onError?: OnError) => <
      F extends StrictGeneratorFunction,
      A extends ActionPattern | Action
    >(
      ms: number,
      patternOrChannel: A,
      worker: F,
      ...args: any[]
    ) => {
      if (!this.config.effects.debounce) {
        throw new Error('debounce effect is not available');
      }
      return this.config.effects.debounce(
        ms,
        patternOrChannel as (Extract<A, ActionPattern> & Extract<A, Action>),
        this.enhance(worker, onError),
        ...args
      );
    },

    takeEvery: (onError?: OnError) => <
      F extends StrictGeneratorFunction,
      A extends ActionPattern | Action
    >(
      patternOrChannel: A,
      worker: F,
      ...args: any[]
    ) => {
      if (!this.config.effects.takeEvery) {
        throw new Error('takeEvery effect is not available');
      }
      return this.config.effects.takeEvery(
        patternOrChannel as (Extract<A, ActionPattern> & Extract<A, Action>),
        this.enhance(worker, onError),
        ...args
      );
    },

    takeLeading: (onError?: OnError) => <
      F extends StrictGeneratorFunction,
      A extends ActionPattern | Action
    >(
      patternOrChannel: A,
      worker: F,
      ...args: any[]
    ) => {
      if (!this.config.effects.takeLeading) {
        throw new Error('takeLeading effect is not available');
      }
      return this.config.effects.takeLeading(
        patternOrChannel as (Extract<A, ActionPattern> & Extract<A, Action>),
        this.enhance(worker, onError),
        ...args
      );
    },

    takeLatest: (onError?: OnError) => <
      F extends StrictGeneratorFunction,
      A extends ActionPattern | Action
    >(
      patternOrChannel: A,
      worker: F,
      ...args: any[]
    ) => {
      if (!this.config.effects.takeLatest) {
        throw new Error('takeLatest effect is not available');
      }
      return this.config.effects.takeLatest(
        patternOrChannel as (Extract<A, ActionPattern> & Extract<A, Action>),
        this.enhance(worker, onError),
        ...args
      );
    }
  };

  private enhancedForkers: {
    throttle: (onError?: OnError) => <F extends StrictGeneratorFunction,A extends | Action>(ms: number, patternOrChannel: A, worker: F, ...args: any[]) => ForkEffect<never>;
    debounce: (onError?: OnError) => <F extends StrictGeneratorFunction, A extends | Action>(ms: number, patternOrChannel: A, worker: F, ...args: any[]) => ForkEffect<never>;
    takeLeading: (onError?: OnError) => <F extends StrictGeneratorFunction, A extends | Action>(patternOrChannel: A, worker: F, ...args: any[]) => ForkEffect<never>;
    fork: (onError?: OnError) => <F extends StrictGeneratorFunction, R extends ForkEffect<GeneratorFunctionYieldType<EnhanceFunction<F>>>>(fn: F, ...args: Parameters<F>) => R;
    spawn: (onError?: OnError) => <F extends StrictGeneratorFunction, R extends ForkEffect<GeneratorFunctionYieldType<EnhanceFunction<F>>>>(fn: F, ...args: Parameters<F>) => R;
    takeEvery: (onError?: OnError) => <F extends StrictGeneratorFunction, A extends | Action>(patternOrChannel: A, worker: F, ...args: any[]) => ForkEffect<never>;
    takeLatest: (onError?: OnError) => <F extends StrictGeneratorFunction, A extends | Action>(patternOrChannel: A, worker: F, ...args: any[]) => ForkEffect<never>
  };

  constructor(config: ModucksConfig) {
    this.config = schema.validateSync(config) as ModucksConfig;
    this.enhancedForkers = this.createEnhancedForkers();
  }

  public has(effectName: keyof ModucksConfig['effects']): boolean {
    return isFunction(this.config.effects[effectName]);
  }

  public createEnhancedForkers(onError?: OnError) {
    return mapKeyValues(this.enhancibleForkerThunks, ([name, thunk]) =>
      (this.has(name) ? { [name]: thunk(onError) } : null) as any
    );
  }

  public enhance<F extends StrictGeneratorFunction>(
    saga: F,
    onError?: OnError<F>
  ): EnhanceFunction<F> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return function* enhancedSaga(...args: Parameters<F>) {
      try {
        yield* processFunction(self.config.effects.put, saga, ...args);
      } catch (e) {
        if (!onError) throw e;
        yield* processFunction(
          self.config.effects.put,
          onError,
          ...([e, ...args] as Parameters<OnError<F>>)
        );
      }
    };
  }

  public createModule(
    moduleName: string,
    definitions,
    initialState = {},
    options = {}
  ) {
    const reducerMap = {};
    const actions = {};
    const actionCreators = {};
    const sagas = {};

    for (const [rawType, definition] of Object.entries(definitions)) {
      const withApp = this.config.appName && !/^!?([*@])\1/.test(rawType);
      const withModule = !/^!?(?:\*|@{2})/.test(rawType);
      const useFullTypeAsKey = !withModule && /^!/.test(rawType);

      const type = rawType.replace(/^!?\*{0,2}/, '');
      const baseType = basename(type);
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
      [basename(moduleName)]: handleActions(reducerMap, initialState),
      sagas,
      ...actionCreators,
      ...actions
    };
  }

  private thunkifyMainGeneratorFunction = (saga: StrictGeneratorFunction) => {
    return ({ type, [this.config.defaultEffect]: defaultEffect }: ModucksConfig['effects'] & ) => defaultEffect(type, saga);
  };

  private thunkifyAdditionalGeneratorFunction = (saga: StrictGeneratorFunction) => {
    return ({ fork }: ModucksConfig['effects']) => fork(saga);
  };

  private initializeMainSaga = (saga, type, onError) => {
    const errLabels = [`Invalid saga for ${type}`, this.config.defaultEffect];
    return this.initializeSaga(
      this.thunkifyMainGeneratorFunction,
      saga,
      errLabels,
      { type },
      onError
    );
  };

  private initializeAdditionalSaga(saga, actions, sagaName) {
    const errLabels = [`Invalid additional saga ${sagaName}`, 'fork'];
    return this.initializeSaga(
      this.thunkifyAdditionalGeneratorFunction,
      saga,
      errLabels,
      actions
    );
  }

  private initializeSaga(thunkify, saga, errLabels, actions, onError) {
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
    throw new Error(
      `${errLabels[0]}: It must be specified as one of them: \n` +
        `  - generator function (=> automatically invoked by enhanced ${errLabels[1]}())\n` +
        '  - thunk that returns generator function (=> automatically invoked by enhanced fork())\n' +
        '  - thunk that returns redux-saga FORK effect\n' +
        '  - redux-saga FORK effect'
    );
  }
}

const hoge = (new Moducks()).createEnhancedForkers().fork('aaa', function* () {
  yield *ffdd;
});