export default class Util {

  constructor(IO) {
    this.IO = IO
  }

  basename(fullname) {
    return fullname.replace(/^[\s\S]*\/(?=[^/]*$)/, '')
  }

  mapValues(obj, f) {
    return Object.entries(obj).reduce((prev, [key, value]) => ({ ...prev, [key]: f(value) }), {})
  }

  mapKeyValues(obj, f) {
    return Object.assign({}, ...Object.entries(obj).map(f))
  }

  isFunction(obj) {
    return typeof obj === 'function'
  }

  isObject(obj) {
    return typeof obj === 'object' && obj !== null
  }

  isGenerator(obj) {
    return this.isObject(obj) && this.isFunction(obj.next) && this.isFunction(obj.throw)
  }

  isGeneratorFunction(obj) {
    if (!this.isFunction(obj)) return false
    if (obj.constructor.name === 'GeneratorFunction' || obj.constructor.displayName === 'GeneratorFunction') return true
    return this.isGenerator(obj.constructor.prototype)
  }

  isEffect(obj) {
    return this.isObject(obj) && obj[this.IO]
  }

  isForkEffect(obj) {
    return this.isEffect(obj) && this.isObject(obj.FORK) && this.isFunction(obj.FORK.fn) && Array.isArray(obj.FORK.args)
  }

  retrieveWorker(saga) {
    if (!this.isForkEffect(saga)) {
      throw new Error('Invalid saga: The value must be a redux-saga FORK effect.')
    }
    for (const arg of [saga.FORK.fn, ...saga.FORK.args]) {
      if (this.isGeneratorFunction(arg)) return arg
    }
    throw new Error('Invalid saga: Generator function not found.')
  }

  retrieveWorkers(sagas) {
    return this.mapValues(sagas, this.retrieveWorker.bind(this))
  }

  flattenSagas(...sagas) {
    const storage = []
    while (sagas.length) {
      const saga = sagas.shift()
      if (!this.isObject(saga)) continue
      if (saga[this.IO]) storage.push(saga)
      sagas.unshift(...Object.values(saga))
    }
    return storage
  }
}