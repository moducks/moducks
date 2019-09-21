import { IO, isForkEffect, isObject, mapValues } from './internal/helpers'

export const retrieveWorker = (saga) => {
  if (!isForkEffect(saga)) {
    throw new Error('Invalid saga: The value must be a redux-saga FORK effect.')
  }
  for (const arg of [saga.payload.fn, ...saga.payload.args]) {
    if (this.isGeneratorFunction(arg)) return arg
  }
  throw new Error('Invalid saga: Generator function not found.')
}

export const retrieveWorkers = (sagas) => mapValues(sagas, retrieveWorker)

export const flattenSagas = (...sagas) => {
  const storage = []
  while (sagas.length) {
    const saga = sagas.shift()
    if (!isObject(saga)) continue
    if (saga[IO]) storage.push(saga)
    sagas.unshift(...Object.values(saga))
  }
  return storage
}
