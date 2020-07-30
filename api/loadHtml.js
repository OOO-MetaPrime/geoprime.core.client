import axios from 'axios'

export default {
  async loadIndexInfo () {
    const { data: result } = await axios.get('api/load-html')
    return result
  }
}
