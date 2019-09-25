import {
  isForkEffect,
  isObject,
  mapValues,
  isGeneratorFunction
} from './internal/helpers';
import { ForkEffect } from 'redux-saga/effects';

export const retrieveWorker = (saga: ForkEffect) => {
  if (!isForkEffect(saga)) {
    throw new Error(
      'Invalid saga: The value must be a redux-saga FORK effect.'
    );
  }
  for (const arg of [saga.payload.fn, ...saga.payload.args]) {
    if (isGeneratorFunction(arg)) return arg;
  }
  throw new Error('Invalid saga: Generator function not found.');
};

export type SagaContainer = { [key: string]: ForkEffect };

export const retrieveWorkers = (sagas: SagaContainer) =>
  mapValues(sagas, retrieveWorker);

export const flattenSagas = (...sagas: unknown[]) => {
  const storage = [];
  while (sagas.length) {
    const saga = sagas.shift();
    if (!isObject(saga)) continue;
    if (isForkEffect(saga)) storage.push(saga);
    sagas.unshift(...Object.values(saga));
  }
  return storage;
};
