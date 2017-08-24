export const IO = '@@redux-saga/IO'

export const mapValues = (obj, f) => Object.entries(obj).reduce((prev, [key, value]) => ({ ...prev, [key]: f(value) }), {})

const isGenerator = obj => obj && typeof obj.next === 'function' && typeof obj.throw === 'function'
export const isGeneratorFunction = obj => {
  if (!obj || !obj.constructor) return false
  if (obj.constructor.name === 'GeneratorFunction' || obj.constructor.displayName === 'GeneratorFunction') return true
  return isGenerator(obj.constructor.prototype)
}
export const isNormalFunction = obj => {
  if (!obj || !obj.constructor) return false
  return obj.constructor.name === 'Function' || obj.constructor.displayName === 'Function'
}
export const isForkEffect = obj => obj && obj[IO] && obj.FORK

export const retrieveWorker = saga => {
  if (!isForkEffect(saga)) {
    throw new Error('Invalid saga: The value must be a redux-saga FORK effect.')
  }
  for (const arg of [saga.FORK.fn, ...saga.FORK.args]) {
    if (isGeneratorFunction(arg)) return arg
  }
  throw new Error('Invalid saga: Generator function not found.')
}
export const retrieveWorkers = sagas => mapValues(sagas, retrieveWorker)

export const flattenSagas = (...sagas) => {
  const storage = []
  while (sagas.length) {
    const saga = sagas.shift()
    if (typeof saga !== 'object' || saga === null) continue
    if (saga[IO]) storage.push(saga)
    sagas.unshift(...Object.values(saga))
  }
  return storage
}
