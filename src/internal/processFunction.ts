import { isAction, isEffect, isGeneratorFunction } from './helpers';
import { PutFunction, IterableSagaIterator, Saga } from '../types';

function* putReturn(put: PutFunction, value: unknown): IterableSagaIterator {
  if (isEffect(value)) {
    yield value;
  } else if (isAction(value)) {
    yield put(value);
  }
}

function* putYields(put: PutFunction, g: Generator): IterableSagaIterator {
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

export default function* processFunction<
  F extends Saga | ((...args: any[]) => any)
>(put: PutFunction, fn: F, ...args: Parameters<F>[]): IterableSagaIterator {
  yield* putReturn(
    put,
    isGeneratorFunction(fn) ? yield* putYields(put, fn(...args)) : fn(...args)
  );
}
