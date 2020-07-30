import axios from 'axios'
import downloadApi from '^/api/download'
import { url } from '^/utils/url'

export default {
  async getCards (params) {
    const { data } = await axios.post(`/api/pd-cards/filter`, params)
    return data
  },

  async getThematicSections () {
    const { data } = await axios.get('/api/pd-cards/thematic-sections')
    return data
  },

  async getCoordinateSystems () {
    const { data } = await axios.get('/api/pd-cards/coordinate-systems')
    return data
  },

  async getScales () {
    const { data } = await axios.get('/api/pd-cards/scales')
    return data
  },

  async getById (id) {
    const { data } = await axios.get(`/api/pd-cards/${id}`)
    return data
  },

  async getFile (id, fileId) {
    const exportDataUrl = url(`/api/pd-cards/${id}/files/${fileId}`)
    downloadApi.downloadFile(exportDataUrl, 'download', true, 'GET')
  },

  getFileUrl (id, fileId) {
    return url(`/api/pd-cards/${id}/files/${fileId}`)
  },

  async update (id, pdCard) {
    const formData = new FormData()
    if (pdCard.newFiles) {
      pdCard.newFiles.forEach(x => {
        formData.append('file', x)
      })
    }
    formData.append('data', JSON.stringify(pdCard))
    const { data } = await axios.put(`/api/pd-cards/${id}`, formData)
    return data
  },

  async destroy (id) {
    await axios.delete(`/api/pd-cards/${id}`)
  },

  async checkLayers (payload) {
    const { data } = await axios.post('/api/pd-cards/check-layers', payload)
    return data
  },

  async create (pdCard) {
    const formData = new FormData()
    if (pdCard.newFiles) {
      pdCard.newFiles.forEach(x => {
        formData.append('file', x)
      })
    }
    formData.append('data', JSON.stringify(pdCard))
    const { data } = await axios.post('/api/pd-cards', formData)
    return data
  },
  async getPdCardLayer (id) {
    const { data } = await axios.get(`/api/isogd/layers-pd-card/${id}`)
    return data
  },

  async checkPdCardLayers (layersIds) {
    const { data } = await axios.post('/api/pd-cards/check-pd-card-layers', layersIds)
    return data
  },
  async sendDocumentToArchive (id) {
    await axios.put(`/api/pd-cards/send-to-archive/${id}`)
  },

  async getTransformGeometry (geometry, oldSrid, srid) {
    const { data: result } = await axios.post('/api/pd-cards/gettransforedgeometry', { geometry, oldSrid, srid })
    return result
  }
}
