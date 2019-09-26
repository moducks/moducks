import { isAction, isEffect, isGeneratorFunction } from './helpers';
import {
  PutFunction,
  EnhanceYields,
  GeneratorYieldType,
  GeneratorReturnType,
  EnhanceFunction,
  StrictGenerator
} from '../types';

function* putReturn<V extends unknown, Y extends EnhanceYields<V>>(
  put: PutFunction,
  value: V
): StrictGenerator<Y, void> {
  if (isEffect(value)) {
    yield value as Y;
  } else if (isAction(value)) {
    yield put(value) as Y;
  }
}

function* putYields<
  G extends StrictGenerator,
  Y extends EnhanceYields<GeneratorYieldType<G>>,
  R extends EnhanceYields<GeneratorReturnType<G>>
>(put: PutFunction, g: G): StrictGenerator<Y, R> {
  let value, done;
  try {
    ({ value, done } = g.next());
  } catch (e) {
    ({ value, done } = g.throw(e));
  }
  while (!done) {
    try {
      if (isEffect(value)) {
        ({ value, done } = g.next(yield value as Y));
      } else if (isAction(value)) {
        ({ value, done } = g.next(yield put(value) as Y));
      } else {
        ({ value, done } = g.next(value));
      }
    } catch (e) {
      ({ value, done } = g.throw(e));
    }
  }
  return value as R;
}

export default function* processFunction<F extends (...args: any[]) => any>(
  put: PutFunction,
  fn: F,
  ...args: Parameters<F>
): ReturnType<EnhanceFunction<F>> {
  yield* putReturn(
    put,
    isGeneratorFunction(fn)
      ? yield* putYields(put, fn(...args) as Generator)
      : fn(...args)
  );
}
