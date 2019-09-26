import { Action } from 'redux';
import { TakeableChannel } from 'redux-saga';
import {
  PutEffect,
  ForkEffect,
  HelperWorkerParameters,
  ActionPattern,
  SagaReturnType
} from 'redux-saga/effects';
import { ActionMatchingPattern, Effect } from '@redux-saga/types';

// Strict Generator
export type StrictGenerator<Y = unknown, R = unknown, N = unknown> = Generator<
  Y,
  R,
  N
>;

// Strict Generator Function
export type StrictGeneratorFunction<Y = unknown, R = unknown, N = unknown> = (
  ...args: any[]
) => StrictGenerator<Y, R, N>;

// Saga Container
export type SagaContainer = { [key: string]: ForkEffect };

// Yield and Return utils
export type GeneratorYieldType<
  G extends Generator<any, any, any>
> = G extends Generator<infer Y, any, any> ? Y : never;
export type GeneratorReturnType<
  G extends Generator<any, any, any>
> = G extends Generator<any, infer R, any> ? R : never;
export type GeneratorFunctionYieldType<
  F extends (...args: any[]) => any
> = F extends (...args: any[]) => Generator<infer Y, any, any> ? Y : never;
export type GeneratorFunctionReturnType<
  F extends (...any: any[]) => any
> = F extends (...args: any[]) => Generator<any, infer R, any> ? R : never;
export type NormalFunctionReturnType<
  F extends (...any: any[]) => any
> = F extends ((...args: any[]) => Generator<any, any, any>)
  ? never
  : ReturnType<F>;

// Moducks-specific Yield value wrapper
export type EnhanceYields<T> = T extends Effect
  ? T
  : T extends Action
  ? PutEffect<T>
  : never;
export type EnhanceFunction<
  F extends (...args: any[]) => any,
  GY extends EnhanceYields<GeneratorFunctionYieldType<F>> = EnhanceYields<
    GeneratorFunctionYieldType<F>
  >,
  GR extends EnhanceYields<GeneratorFunctionReturnType<F>> = EnhanceYields<
    GeneratorFunctionReturnType<F>
  >,
  NR extends EnhanceYields<NormalFunctionReturnType<F>> = EnhanceYields<
    NormalFunctionReturnType<F>
  >
> = (...args: Parameters<F>) => Generator<GY | GR | NR, void, any>;

// Moducks-specific onError handler
export type OnError<F extends (...args: any[]) => any = any> = (
  e: Error,
  ...args: Parameters<F>
) => any;

// Redux-Saga put() function
export type PutFunction = <A extends Action>(action: A) => PutEffect<A>;

// Redux-Saga fork() function
export type ForkFunctionUsage = [];
export type ForkFunction = (<Fn extends (...args: any[]) => any>(
  fn: Fn,
  ...args: Parameters<Fn>
) => ForkEffect<SagaReturnType<Fn>>) &
  (<
    Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => any },
    Name extends string
  >(
    ctxAndFnName: [Ctx, Name],
    ...args: Parameters<Ctx[Name]>
  ) => ForkEffect<SagaReturnType<Ctx[Name]>>) &
  (<
    Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => any },
    Name extends string
  >(
    ctxAndFnName: { context: Ctx; fn: Name },
    ...args: Parameters<Ctx[Name]>
  ) => ForkEffect<SagaReturnType<Ctx[Name]>>) &
  (<Ctx, Fn extends (this: Ctx, ...args: any[]) => any>(
    ctxAndFn: [Ctx, Fn],
    ...args: Parameters<Fn>
  ) => ForkEffect<SagaReturnType<Fn>>) &
  (<Ctx, Fn extends (this: Ctx, ...args: any[]) => any>(
    ctxAndFn: { context: Ctx; fn: Fn },
    ...args: Parameters<Fn>
  ) => ForkEffect<SagaReturnType<Fn>>);

// Redux-Saga spawn() function
export type SpawnFunction = ForkFunction;

// Redux-Saga takeEvery() function
export type TakeEveryFunction = (<P extends ActionPattern>(
  pattern: P,
  worker: (action: ActionMatchingPattern<P>) => any
) => ForkEffect<never>) &
  (<P extends ActionPattern, Fn extends (...args: any[]) => any>(
    pattern: P,
    worker: Fn,
    ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
  ) => ForkEffect<never>) &
  (<A extends Action>(
    pattern: ActionPattern<A>,
    worker: (action: A) => any
  ) => ForkEffect<never>) &
  (<A extends Action, Fn extends (...args: any[]) => any>(
    pattern: ActionPattern<A>,
    worker: Fn,
    ...args: HelperWorkerParameters<A, Fn>
  ) => ForkEffect) &
  (<T>(
    channel: TakeableChannel<T>,
    worker: (item: T) => any
  ) => ForkEffect<never>) &
  (<T, Fn extends (...args: any[]) => any>(
    channel: TakeableChannel<T>,
    worker: Fn,
    ...args: HelperWorkerParameters<T, Fn>
  ) => ForkEffect<never>);

// Redux-Saga takeLeading() function
export type TakeLeadingFunction = TakeEveryFunction;

// Redux-Saga takeLatest() function
export type TakeLatestFunction = TakeEveryFunction;

// Redux-Saga throttle() function
export type ThrottleFunction = (<P extends ActionPattern>(
  ms: number,
  pattern: P,
  worker: (action: ActionMatchingPattern<P>) => any
) => ForkEffect<never>) &
  (<P extends ActionPattern, Fn extends (...args: any[]) => any>(
    ms: number,
    pattern: P,
    worker: Fn,
    ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
  ) => ForkEffect<never>) &
  (<A extends Action>(
    ms: number,
    pattern: ActionPattern<A>,
    worker: (action: A) => any
  ) => ForkEffect<never>) &
  (<A extends Action, Fn extends (...args: any[]) => any>(
    ms: number,
    pattern: ActionPattern<A>,
    worker: Fn,
    ...args: HelperWorkerParameters<A, Fn>
  ) => ForkEffect<never>) &
  (<T>(
    ms: number,
    channel: TakeableChannel<T>,
    worker: (item: T) => any
  ) => ForkEffect<never>) &
  (<T, Fn extends (...args: any[]) => any>(
    ms: number,
    channel: TakeableChannel<T>,
    worker: Fn,
    ...args: HelperWorkerParameters<T, Fn>
  ) => ForkEffect<never>);

// Redux-Saga debounce() function
export type DebounceFunction = ThrottleFunction;

// Moducks configuration
export type DefaultEffect = 'takeEvery' | 'takeLeading' | 'takeLatest';
export interface BaseReduxSagaImports {
  put: PutFunction;
  fork: ForkFunction;
  spawn?: SpawnFunction;
  throttle?: ThrottleFunction;
  debounce?: DebounceFunction;
}
export interface ConditionalReduxSagaImports {
  takeEvery?: TakeEveryFunction;
  takeLeading?: TakeLeadingFunction;
  takeLatest?: TakeLatestFunction;
}
export type ReduxSagaImportsDefaultTo<
  D extends DefaultEffect
> = BaseReduxSagaImports &
  Omit<ConditionalReduxSagaImports, D> &
  Required<Pick<ConditionalReduxSagaImports, D>>;
export type ModucksConfigDefaultTo<D extends DefaultEffect> = {
  effects: ReduxSagaImportsDefaultTo<D>;
  defaultEffect: D;
  appName?: string;
};
export type ModucksConfig =
  | ModucksConfigDefaultTo<'takeLatest'>
  | ModucksConfigDefaultTo<'takeLeading'>
  | ModucksConfigDefaultTo<'takeEvery'>
  | Omit<ModucksConfigDefaultTo<'takeEvery'>, 'defaultEffect'>;

// createModule options
export type ModuleDefinitions = {

};
export type ModuleOptions = {

};
export type CreateModuleArguments = {
  moduleName: string,
  definitions: ModuleDefinitions,
  initialState: object,
  options: ModuleOptions,
}