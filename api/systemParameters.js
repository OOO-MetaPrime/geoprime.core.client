import axios from 'axios'

export default {
  async getOptions () {
    const { data } = await axios.get(`/api/system-parameters/`)
    return data
  },
  async updateOptions (options) {
    const { data } = await axios.put('/api/system-parameters/', options)
    return data
  }
}
