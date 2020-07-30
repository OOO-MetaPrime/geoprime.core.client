import axios from 'axios'

export default {
  async getModules () {
    const { data } = await axios.get(`/api/modules`)
    return data
  },
  async getModulesSettings (params) {
    const { data } = await axios.post(`/api/modules/filter`, params)
    return data
  },
  async getModuleSections (id, params) {
    const { data } = await axios.post(`/api/modules/${id}/sections`, params)
    return data
  },
  async createModule (module) {
    const { data } = await axios.post(`/api/modules/`, module)
    return data
  },
  async getModule (id) {
    const { data } = await axios.get(`/api/modules/${id}`)
    return data
  },
  async removeModule (id) {
    await axios.delete(`/api/modules/${id}`)
  },
  async updateModule (id, params) {
    await axios.put(`/api/modules/${id}`, params)
  },
  async getSections ({ moduleId, params }) {
    const { data } = await axios.post(`/api/modules/${moduleId}/module-section/search`, params)
    return data
  },
  async getModuleSection (id) {
    const { data } = await axios.get(`/api/modules/module-section/${id}`)
    return data
  },
  async createModuleSection ({ moduleId, section }) {
    const { data } = await axios.post(`/api/modules/${moduleId}/module-section`, section)
    return data
  },
  async destroyModuleSection (id) {
    await axios.delete(`/api/modules/module-section/${id}`)
  },
  async checkSection (id) {
    const { data } = await axios.get(`/api/modules/module-section/check-section/${id}`)
    return data
  },
  async searchRequestTypes () {
    const { data } = await axios.get('/api/modules/module-section/request-types')
    return data
  },
  async searchDocumentTypes () {
    const { data } = await axios.get('/api/modules/module-section/document-types')
    return data
  }
}
