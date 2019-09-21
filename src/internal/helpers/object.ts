export type ValueCallback<O extends Record<string, any>> = (
  value: O[keyof O]
) => any;

export type MappedObject<
  O extends Record<string, any>,
  F extends ValueCallback<O> = any
> = { [K in keyof O]: ReturnType<F> };

export const mapValues = <
  O extends Record<string, any>,
  F extends ValueCallback<O>
>(
  obj: O,
  f: F
): MappedObject<O, F> =>
  Object.entries(obj).reduce(
    (prev, [key, value]) => ({ ...prev, [key]: f(value) }),
    {} as MappedObject<O, F>
  );

export const mapKeyValues = <
  O extends Record<string, any>,
  F extends ([K, V]: [keyof O, O[keyof O]]) => Partial<MappedObject<O>>
>(
  obj: O,
  f: F
): MappedObject<O> => Object.assign({}, ...Object.entries(obj).map(f));
