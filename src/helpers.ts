import {
  isForkEffect,
  isObject,
  mapValues,
  isGeneratorFunction
} from './internal/helpers';
import { ForkEffect } from 'redux-saga/effects';
import { SagaContainer, StrictGeneratorFunction } from './types';

export const retrieveWorker = (saga: ForkEffect): StrictGeneratorFunction => {
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

export const retrieveWorkers = (
  sagas: SagaContainer
): Record<keyof SagaContainer, StrictGeneratorFunction> =>
  mapValues(sagas, retrieveWorker);

export const flattenSagas = (...sagas: unknown[]): ForkEffect[] => {
  const storage = [];
  while (sagas.length) {
    const saga = sagas.shift();
    if (!isObject(saga)) continue;
    if (isForkEffect(saga)) storage.push(saga);
    sagas.unshift(...Object.values(saga));
  }
  return storage;
};
