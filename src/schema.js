import yup from 'yup'

const requiredFn = yup.mixed().test('required-function', '${path} is not a function', v => typeof v === 'function')
const nonRequiredFn = yup.mixed().test('non-required-function', '${path} is not a function', v => v === undefined || typeof v === 'function')

const schema = yup.object().shape({
  effects: yup.object().required().when('defaultEffect', (defaultEffect, schema) => schema.shape({
    put: requiredFn,
    fork: requiredFn,
    spawn: nonRequiredFn,
    throttle: nonRequiredFn,
    takeEvery: defaultEffect === 'takeEvery' ? requiredFn : nonRequiredFn,
    takeLeading: defaultEffect === 'takeLeading' ? requiredFn : nonRequiredFn,
    takeLatest: defaultEffect === 'takeLatest' ? requiredFn : nonRequiredFn,
  })),
  defaultEffect: yup.string().oneOf(['takeEvery', 'takeLeading', 'takeLatest']).default('takeEvery'),
})

export default schema
