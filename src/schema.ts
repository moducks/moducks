import { mixed, object, ObjectSchema, string } from 'yup';

const requiredFn = mixed().test(
  'required-function',
  '${path} is not a function',
  v => typeof v === 'function'
);
const nonRequiredFn = mixed().test(
  'non-required-function',
  '${path} is not a function',
  v => v === undefined || typeof v === 'function'
);

const effects = object()
  .transform((currentValue, originalValue) =>
    // in webpack v4, wildcard import type is not "Object" but "Module"
    originalValue && originalValue[Symbol.toStringTag] === 'Module'
      ? { ...originalValue }
      : currentValue
  )
  .required()
  .when(
    'defaultEffect',
    (
      defaultEffect: 'takeEvery' | 'takeLeading' | 'takeLatest',
      schema: ObjectSchema
    ) =>
      schema.shape({
        put: requiredFn,
        fork: requiredFn,
        spawn: nonRequiredFn,
        throttle: nonRequiredFn,
        takeEvery: defaultEffect === 'takeEvery' ? requiredFn : nonRequiredFn,
        takeLeading:
          defaultEffect === 'takeLeading' ? requiredFn : nonRequiredFn,
        takeLatest: defaultEffect === 'takeLatest' ? requiredFn : nonRequiredFn
      })
  );

const defaultEffect = string()
  .oneOf(['takeEvery', 'takeLeading', 'takeLatest'])
  .default('takeEvery');

const schema = object().shape({ effects, defaultEffect });

export default schema;
