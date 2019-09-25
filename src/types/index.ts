import { Action } from 'redux';
import { SagaIterator, TakeableChannel } from 'redux-saga';
import {
  PutEffect,
  ForkEffect,
  HelperWorkerParameters,
  ActionPattern
} from 'redux-saga/effects';
import { ActionMatchingPattern } from '@redux-saga/types';

export type Saga = GeneratorFunction;

export type OnError<F extends Saga = Saga> = (
  e: Error,
  ...args: Parameters<F>[]
) => any;

export type IterableSagaIterator = SagaIterator & {
  [Symbol.iterator](): SagaIterator;
};

export type PutFunction = <A extends Action>(action: A) => PutEffect<A>;

export type ForkFunction = (<Fn extends (...args: any[]) => any>(
  fn: Fn,
  ...args: Parameters<Fn>
) => ForkEffect) &
  (<
    Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => any },
    Name extends string
  >(
    ctxAndFnName: [Ctx, Name],
    ...args: Parameters<Ctx[Name]>
  ) => ForkEffect) &
  (<
    Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => any },
    Name extends string
  >(
    ctxAndFnName: { context: Ctx; fn: Name },
    ...args: Parameters<Ctx[Name]>
  ) => ForkEffect) &
  (<Ctx, Fn extends (this: Ctx, ...args: any[]) => any>(
    ctxAndFn: [Ctx, Fn],
    ...args: Parameters<Fn>
  ) => ForkEffect) &
  (<Ctx, Fn extends (this: Ctx, ...args: any[]) => any>(
    ctxAndFn: { context: Ctx; fn: Fn },
    ...args: Parameters<Fn>
  ) => ForkEffect);

export type SpawnFunction = ForkFunction;

export type TakeEveryFunction = (<T>(
  channel: TakeableChannel<T>,
  worker: (item: T) => any
) => ForkEffect) &
  (<T, Fn extends (...args: any[]) => any>(
    channel: TakeableChannel<T>,
    worker: Fn,
    ...args: HelperWorkerParameters<T, Fn>
  ) => ForkEffect);

export type TakeLeadingFunction = (<P extends ActionPattern>(
  pattern: P,
  worker: (action: ActionMatchingPattern<P>) => any
) => ForkEffect) &
  (<P extends ActionPattern, Fn extends (...args: any[]) => any>(
    pattern: P,
    worker: Fn,
    ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
  ) => ForkEffect) &
  (<A extends Action>(
    pattern: ActionPattern<A>,
    worker: (action: A) => any
  ) => ForkEffect) &
  (<A extends Action, Fn extends (...args: any[]) => any>(
    pattern: ActionPattern<A>,
    worker: Fn,
    ...args: HelperWorkerParameters<A, Fn>
  ) => ForkEffect) &
  (<T>(channel: TakeableChannel<T>, worker: (item: T) => any) => ForkEffect) &
  (<T, Fn extends (...args: any[]) => any>(
    channel: TakeableChannel<T>,
    worker: Fn,
    ...args: HelperWorkerParameters<T, Fn>
  ) => ForkEffect);

export type TakeLatestFunction = (<P extends ActionPattern>(
  pattern: P,
  worker: (action: ActionMatchingPattern<P>) => any
) => ForkEffect) &
  (<P extends ActionPattern, Fn extends (...args: any[]) => any>(
    pattern: P,
    worker: Fn,
    ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
  ) => ForkEffect) &
  (<A extends Action>(
    pattern: ActionPattern<A>,
    worker: (action: A) => any
  ) => ForkEffect) &
  (<A extends Action, Fn extends (...args: any[]) => any>(
    pattern: ActionPattern<A>,
    worker: Fn,
    ...args: HelperWorkerParameters<A, Fn>
  ) => ForkEffect) &
  (<T>(channel: TakeableChannel<T>, worker: (item: T) => any) => ForkEffect) &
  (<T, Fn extends (...args: any[]) => any>(
    channel: TakeableChannel<T>,
    worker: Fn,
    ...args: HelperWorkerParameters<T, Fn>
  ) => ForkEffect);

export type ThrottleFunction = (<P extends ActionPattern>(
  ms: number,
  pattern: P,
  worker: (action: ActionMatchingPattern<P>) => any
) => ForkEffect) &
  (<P extends ActionPattern, Fn extends (...args: any[]) => any>(
    ms: number,
    pattern: P,
    worker: Fn,
    ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
  ) => ForkEffect) &
  (<A extends Action>(
    ms: number,
    pattern: ActionPattern<A>,
    worker: (action: A) => any
  ) => ForkEffect) &
  (<A extends Action, Fn extends (...args: any[]) => any>(
    ms: number,
    pattern: ActionPattern<A>,
    worker: Fn,
    ...args: HelperWorkerParameters<A, Fn>
  ) => ForkEffect) &
  (<T>(
    ms: number,
    channel: TakeableChannel<T>,
    worker: (item: T) => any
  ) => ForkEffect) &
  (<T, Fn extends (...args: any[]) => any>(
    ms: number,
    channel: TakeableChannel<T>,
    worker: Fn,
    ...args: HelperWorkerParameters<T, Fn>
  ) => ForkEffect);

export type DebounceFunction = (<P extends ActionPattern>(
  ms: number,
  pattern: P,
  worker: (action: ActionMatchingPattern<P>) => any
) => ForkEffect) &
  (<P extends ActionPattern, Fn extends (...args: any[]) => any>(
    ms: number,
    pattern: P,
    worker: Fn,
    ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
  ) => ForkEffect) &
  (<A extends Action>(
    ms: number,
    pattern: ActionPattern<A>,
    worker: (action: A) => any
  ) => ForkEffect) &
  (<A extends Action, Fn extends (...args: any[]) => any>(
    ms: number,
    pattern: ActionPattern<A>,
    worker: Fn,
    ...args: HelperWorkerParameters<A, Fn>
  ) => ForkEffect) &
  (<T>(
    ms: number,
    channel: TakeableChannel<T>,
    worker: (item: T) => any
  ) => ForkEffect) &
  (<T, Fn extends (...args: any[]) => any>(
    ms: number,
    channel: TakeableChannel<T>,
    worker: Fn,
    ...args: HelperWorkerParameters<T, Fn>
  ) => ForkEffect);

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
