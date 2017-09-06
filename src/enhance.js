import { fork, put, spawn, takeEvery, takeLatest, throttle } from 'redux-saga/effects'
import { IO, isGeneratorFunction, mapValues } from './utils'

const putYields = function* (g) {
  let { value, done } = g.next()
  while (!done) {
    if (!value || !value[IO]) {
      value = put(value)
    }
    ({ value, done } = g.next(yield value))
  }
  return value
}
const putReturn = function* (value) {
  if (value !== undefined) {
    yield put(value)
  }
}
const processFunction = function* (fn, ...args) {
  yield* putReturn(
    isGeneratorFunction(fn)
    ? yield* putYields(fn(...args))
    : fn(...args)
  )
}

export const enhance = (saga, onError) => function* enhancedSaga(...args) {
  try {
    yield* processFunction(saga, ...args)
  } catch (e) {
    if (!onError) throw e
    yield* processFunction(onError, e, ...args)
  }
}
export const enhancibleForkerThunks = {
  takeEvery: onError => (patternOrChannel, worker, ...args) => takeEvery(patternOrChannel, enhance(worker, onError), ...args),
  takeLatest: onError => (patternOrChannel, worker, ...args) => takeLatest(patternOrChannel, enhance(worker, onError), ...args),
  throttle: onError => (ms, pattern, worker, ...args) => throttle(ms, pattern, enhance(worker, onError), ...args),
  fork: onError => (fn, ...args) => fork(enhance(fn, onError), ...args),
  spawn: onError => (fn, ...args) => spawn(enhance(fn, onError), ...args),
}
export const enhancedForkers = mapValues(enhancibleForkerThunks, thunk => thunk(enhance))
