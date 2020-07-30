import axios from 'axios'

export default {
  enter (target) {
    return axios.post('/api/system-log/enter', { target })
  },
  async getAll (params) {
    const { data } = await axios.post('/api/system-log/', params)
    return data
  }
}
