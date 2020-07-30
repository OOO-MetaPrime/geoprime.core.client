import axios from 'axios'

export default {
  async getResourcesAndActions () {
    const { data } = await axios.get(`/api/security/resources`)
    return data
  }
}
