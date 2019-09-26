import { IO } from './symbol';
import { Effect, ForkEffect } from 'redux-saga/effects';
import { Action } from 'redux';
import { StrictGenerator, StrictGeneratorFunction } from '../../types';

export const isFunction = (obj: unknown): obj is Function =>
  typeof obj === 'function';

export const isObject = (obj: unknown): obj is Record<string, unknown> =>
  typeof obj === 'object' && obj !== null;

export const isGenerator = (obj: unknown): obj is StrictGenerator =>
  isObject(obj) && isFunction(obj.next) && isFunction(obj.throw);

export const isGeneratorFunction = (
  obj: unknown
): obj is StrictGeneratorFunction =>
  isFunction(obj) &&
  (obj.constructor.name === 'GeneratorFunction' ||
    (obj.constructor as any).displayName === 'GeneratorFunction' ||
    isGenerator(obj.constructor.prototype));

export const isEffect = (obj: unknown): obj is Effect =>
  isObject(obj) &&
  obj[IO] === true &&
  typeof obj.type === 'string' &&
  obj.hasOwnProperty('payload');

export const isForkEffect = (obj: unknown): obj is ForkEffect =>
  isEffect(obj) &&
  obj.type === 'FORK' &&
  isObject(obj.payload) &&
  isFunction(obj.payload.fn) &&
  Array.isArray(obj.payload.args);

export const isAction = (obj: unknown): obj is Action =>
  isObject(obj) && typeof obj.type === 'string';
