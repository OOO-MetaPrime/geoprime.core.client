import axios from 'axios'
import _get from 'lodash/get'

export default {
  async getLayerSettings (layerId) {
    const { data: result } = await axios.get(`/api/layer/${layerId}`)
    return _get(result, 'layerSetting.settings')
  },

  async getLayer (layerId) {
    const { data } = await axios.get(`/api/layer/${layerId}`)
    return data
  },

  async getLayersTree () {
    const { data } = await axios.get(`/api/layer/tree`)
    return data
  },

  async getLayersDescribeInfos (layer) {
    const url = `${layer.url}?service=WMS&version=1.1.1&request=describelayer&layers=${layer.layers}`
    const requestConfig = {}
    if (layer.authorizationString) {
      requestConfig.headers = { Authorization: 'Basic ' + layer.authorizationString }
    }
    const { data: result } = await axios.get(url, requestConfig)
    const xml = new DOMParser().parseFromString(result, 'text/xml')
    const layerDescriptions = [...xml.querySelectorAll('LayerDescription')]
    return layerDescriptions.filter(value => {
      if (value.getAttribute('owsType') !== 'WFS') {
        return false
      }
      return true
    }).map(value => {
      return {
        name: value.getAttribute('name'),
        url: value.getAttribute('wfs')
      }
    })
  },

  async getLayerAttributeSettings (layer) {
    const layerDescriptions = await this.getLayersDescribeInfos(layer)
    for (const layerDescription of layerDescriptions) {
      const requestConfig = {}
      if (layer.authorizationString) {
        requestConfig.headers = { Authorization: 'Basic ' + layer.authorizationString }
      }
      const { data: response } = await axios.get(`${layerDescription.url}?service=wfs&version=2.0.0&request=DescribeFeatureType&typeName=${layerDescription.name}&outputFormat=application/json`, requestConfig)
      if (typeof response !== 'object') {
        continue
      }
      layerDescription.attributes = response.featureTypes[0].properties
        .filter(value => !value.type.match(/^gml/))
        .map(value => ({ name: value.name, type: value.localType }))
    }
    return layerDescriptions
  }
}
