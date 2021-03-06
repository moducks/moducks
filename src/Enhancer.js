export default class Enhancer {

  enhancibleForkerThunks = {
    takeEvery: onError => (patternOrChannel, worker, ...args) => this.effects.takeEvery(patternOrChannel, this.enhance(worker, onError), ...args),
    takeLeading: onError => (patternOrChannel, worker, ...args) => this.effects.takeLeading(patternOrChannel, this.enhance(worker, onError), ...args),
    takeLatest: onError => (patternOrChannel, worker, ...args) => this.effects.takeLatest(patternOrChannel, this.enhance(worker, onError), ...args),
    throttle: onError => (ms, pattern, worker, ...args) => this.effects.throttle(ms, pattern, this.enhance(worker, onError), ...args),
    fork: onError => (fn, ...args) => this.effects.fork(this.enhance(fn, onError), ...args),
    spawn: onError => (fn, ...args) => this.effects.spawn(this.enhance(fn, onError), ...args),
  }

  constructor(Util, effects) {
    this.util = Util
    this.effects = effects
    this.enhancedForkers = this.createEnhancedForkers(null)
  }

  has(effectName) {
    return this.util.isFunction(this.effects[effectName])
  }

  createEnhancedForkers(onError) {
    return this.util.mapKeyValues(this.enhancibleForkerThunks, ([name, thunk]) => this.has(name) ? { [name]: thunk(onError) } : null)
  }

  enhance(saga, onError) {
    const self = this
    return function* enhancedSaga(...args) {
      try {
        yield* self.processFunction(saga, ...args)
      } catch (e) {
        if (!onError) throw e
        yield* self.processFunction(onError, e, ...args)
      }
    }
  }

  *putYields(g) {
    let value, done
    try {
      ({ value, done } = g.next())
    } catch (e) {
      ({ value, done } = g.throw(e))
    }
    while (!done) {
      try {
        ({ value, done } = g.next(
          this.util.isObject(value)
            ? yield this.util.isEffect(value) ? value : this.effects.put(value)
            : value
        ))
      } catch (e) {
        ({ value, done } = g.throw(e))
      }
    }
    return value
  }

  *putReturn(value) {
    if (this.util.isObject(value)) {
      yield this.util.isEffect(value) ? value : this.effects.put(value)
    }
  }

  *processFunction(fn, ...args) {
    yield* this.putReturn(
      this.util.isGeneratorFunction(fn)
        ? yield* this.putYields(fn(...args))
        : fn(...args)
    )
  }
}
