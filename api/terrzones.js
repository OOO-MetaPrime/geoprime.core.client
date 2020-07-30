import axios from 'axios'

export default {
  // Получение тер зон для октмо
  async getTerrzonesbyIds (ids) {
    const params = ids.join(',')
    const { data: result } = await axios.post('/api/terrzone/oktmo/terrzones', { ids: params })
    return result
  },

  async getTerrZoneById (id) {
    const { data: result } = await axios.get(`/api/terrzone/terrzones/${id}`)
    return result
  },

  async deleteTerrZones (id) {
    await axios.delete(`/api/terrzone/terrzones/${id}`)
  },

  async getTerrZoneTypes () {
    const { data: result } = await axios.get('/api/terrzone/terrzonetypes')
    return result
  },
  // Получение ограничений
  async getRestrictions (params) {
    const { data: result } = await axios.post('/api/terrzone/restrictions', params)
    return result
  },

  // типы использования
  async getTypesOfUse () {
    const { data: result } = await axios.get('/api/terrzone/typesofuse')
    return result
  },
  // создание ограничения
  async createRestriction (attributes) {
    const { data: result } = await axios.post('/api/terrzone/urbanplanning/restrictions', attributes)
    return result
  },

  async getUrbanPlanningRegulationRestrictions (id) {
    const { data: result } = await axios.get(`/api/terrzone/urbanplanning/${id}/restrictions`)
    return result
  },

  async deleteRestriction (id) {
    await axios.delete(`/api/terrzone/restrictions/${id}`)
    return
  },

  async getUrbanPlanningRegulationParameters (id) {
    const { data: result } = await axios.get(`/api/terrzone/urbanplanning/${id}/parameters`)
    return result
  },

  async getLimitingParameter (id) {
    const { data: result } = await axios.get(`/api/terrzone/urbanplanning/parameters/${id}`)
    return result
  },

  async createLimitingParameter (attributes) {
    const { data: result } = await axios.post('/api/terrzone/urbanplanning/parameters', attributes)
    return result
  },

  async updateLimitingParameter (attributes, id) {
    const { data: result } = await axios.put('/api/terrzone/urbanplanning/parameters', attributes, {
      params: {
        id: id
      }
    })
    return result
  },

  async deleteLimitingParameter (id) {
    const { data: result } = await axios.delete(`/api/terrzone/urbanplanning/parameters/${id}`)
    return result
  },

  async getParameters (id) {
    const { data: result } = await axios.get('/api/terrzone/parameters')
    return result
  },

  async createTerrZone (attributes) {
    const { data: result } = await axios.post('/api/terrzone/terrzones', attributes)
    return result
  },

  async updateTerrZone (attributes, id) {
    const { data: result } = await axios.put(`/api/terrzone/terrzones/${id}`, attributes)
    return result
  },

  async updateRestrictions (params) {
    const { data: result } = await axios.put('/api/terrzone/restrictions', params)
    return result
  },

  // Ай ди терзоны по гис айди
  async getTerrZoneIdByGisId (id) {
    const { data: result } = await axios.get(`/api/terrzone/terrzones/gisId/${id}`)
    return result
  },

  async getTerrZoneByCustomColumn (params) {
    const { data: result } = await axios.post(`/api/terrzone/terrzones/customcolumn`, params)
    return result
  }
}
