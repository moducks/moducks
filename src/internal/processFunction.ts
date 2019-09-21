import { isAction, isEffect, isGeneratorFunction } from './helpers';
import { Action } from 'redux';
import { PutEffect } from 'redux-saga/effects';
import { SagaIterator as BaseSagaIterator } from 'redux-saga';

export type PutEffectCreator = <A extends Action>(action: A) => PutEffect<A>;
export type SagaIterator = BaseSagaIterator & Generator

export default function* processFunction<F extends (...args: any) => unknown>(
  put: PutEffectCreator,
  fn: F,
  ...args: Parameters<F>[]
): SagaIterator {
  yield* putReturn(
    put,
    isGeneratorFunction(fn) ? yield* putYields(put, fn(...args)) : fn(...args)
  );
}

function* putReturn(put: PutEffectCreator, value: unknown): SagaIterator {
  if (isEffect(value)) {
    yield value;
  } else if (isAction(value)) {
    yield put(value);
  }
}

function* putYields(put: PutEffectCreator, g: Generator): SagaIterator {
  let value, done;
  try {
    ({ value, done } = g.next());
  } catch (e) {
    ({ value, done } = g.throw(e));
  }
  while (!done) {
    try {
      if (isEffect(value)) {
        ({ value, done } = g.next(yield value));
      } else if (isAction(value)) {
        ({ value, done } = g.next(yield put(value)));
      } else {
        ({ value, done } = g.next(value));
      }
    } catch (e) {
      ({ value, done } = g.throw(e));
    }
  }
  return value;
}
