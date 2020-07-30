import axios from 'axios'

export default {
  async search (params, groupId) {
    const { data } = await axios.post('/api/registries/search', {
      params,
      groupId
    })
    return data
  },
  async registry (id, params, allRecords) {
    let queryString = `/api/registries/registry/paginate/${id}`
    if (allRecords) {
      queryString += '?allRecords=true'
    }
    const { data } = await axios.post(queryString, params)
    return data
  },
  async getRegistries (params) {
    const { data } = await axios.post('/api/registries/registries', params)
    return data
  },
  async getEntityData (params) {
    const { data } = await axios.get('/api/registries/registry/item/data', { params: params })
    return data
  },
  async getEntities (id) {
    const { data } = await axios.get(`/api/registries/entities`, { params: { id } })
    return data
  },
  async getRegistryAttribues (id) {
    const { data } = await axios.get(`/api/registries/${id}`)
    return data
  },
  async getTables () {
    const { data } = await axios.get(`/api/registries/tables`)
    return data
  },
  async getSubjectGd (id) {
    const { data } = await axios.get(`/api/registries/subject-gd/${id}`)
    return data
  },
  async getPdCard (registryId) {
    const { data } = await axios.get(`/api/registries/pd-card?registryId=${registryId}`)
    return data
  },
  async getDirectorySpatialDataFields (id) {
    const { data } = await axios.get(`/api/registries/directory-spatial-data-fields/${id}`)
    return data
  },
  async getDirectoryUrbanPlanningTypes () {
    const { data } = await axios.get(`/api/registries/directory-urban-planning-types`)
    return data
  },
  async getDirectoryLayers (id, registryId) {
    let url = `/api/registries/directory-layers/${id}`
    if (registryId) {
      url += `?registryId=${registryId}`
    }
    const { data } = await axios.get(url)
    return data
  },
  async updateRegistry (id, params) {
    const { data } = await axios.put(`/api/registries/${id}`, params)
    return data
  },
  async createRegistry (params) {
    const { data } = await axios.post(`/api/registries`, params)
    return data
  },
  async deleteRegistry (id) {
    await axios.delete(`/api/registries/${id}`)
  },
  async getLinks (id, params) {
    const { data } = await axios.post(`/api/registries/links/${id}`, params)
    return data
  },
  async getRegistrySpatialDataFields (id) {
    const { data } = await axios.get(`/api/registries/${id}/fields`)
    return data
  },
  async getEntityFields (id) {
    const { data } = await axios.get(`/api/registries/entities/${id}/fields`)
    return data
  },
  async getTableFields (name) {
    const { data } = await axios.get(`/api/registries/table/${name}/fields`)
    return data
  },
  async getAutolinks (tableName) {
    const { data } = await axios.get(`/api/registries/table/${tableName}/autolinks`)
    return data
  },
  async checkRegistry (connectedId) {
    const { data } = await axios.get(`/api/registries/check-registry/${connectedId}`)
    return data
  },
  async checkMultipleLayerSpatialSettings (layerId) {
    const { data: result } = await axios.get(`/api/registries/check-multiple-layer/${layerId}`)
    return result
  }
}
