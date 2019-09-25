import { IO } from './symbol';
import { StrictEffect, ForkEffect } from 'redux-saga/effects';
import { Action } from 'redux';

export const isFunction = (obj: unknown): obj is Function =>
  typeof obj === 'function';

export const isObject = (obj: unknown): obj is Record<string, any> =>
  typeof obj === 'object' && obj !== null;

export const isGenerator = (
  obj: unknown
): obj is Generator<unknown, unknown, unknown> =>
  isObject(obj) && isFunction(obj.next) && isFunction(obj.throw);

export const isGeneratorFunction = (
  obj: unknown
): obj is (...any: any) => Generator<unknown, unknown, unknown> =>
  isFunction(obj) &&
  (obj.constructor.name === 'GeneratorFunction' ||
    (obj.constructor as any).displayName === 'GeneratorFunction' ||
    isGenerator(obj.constructor.prototype));

export const isEffect = (obj: unknown): obj is StrictEffect =>
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
