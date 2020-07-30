import axios from 'axios'

export default {
  async search (params) {
    const { data } = await axios.post('/api/settings-profiles/search', params)
    return data
  },
  async getModuleLayers (profileId, moduleId) {
    const result = await axios.get(`/api/settings-profiles/${profileId}/modules/${moduleId}/layers`)
    return result.data
  },
  async getModuleLayerSettings (profileId, moduleId) {
    const result = await axios.get(`/api/settings-profiles/${profileId}/modules/${moduleId}/layersettings`)
    console.log(result)
    return result.data
  }
}
