import axios from 'axios'
import { delay } from 'redux-saga'

const client = axios.create({
  baseURL: 'http://npmsearch.com',
})

export const search = async (params = {}, options = {}) => {
  // simulate slow network
  await delay(500)
  return client.get('/query', {
    params: {
      ...params,
      fields: 'name,description',
      size: 15,
    },
    ...options,
  })
}
