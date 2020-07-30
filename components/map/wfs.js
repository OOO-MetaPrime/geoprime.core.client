import axios from 'axios'
import _get from 'lodash/get'
import { parseString } from 'xml2js'
import GeoJSON from 'ol/format/geojson'
import WFS from 'ol/format/wfs'
import filter from 'ol/format/filter'

async function parseXml (xmlString) {
  return new Promise((resolve, reject) => {
    parseString(xmlString, (err, result) => {
      if (err) {
        reject(err)
      }
      resolve(result)
    })
  })
}

/**
 * Получить даные объекта.
 * @param {Array} layers Список слоев.
 * @param {*} field Поле для поиска.
 * @param {*} value Значение для поиска.
 */
async function getFeatures (url, layer, field, value, limit) {
  const layers = layer.layers.split(',')
  const featureRequest = new WFS().writeGetFeature({
    featureTypes: layers,
    outputFormat: 'application/json',
    filter: filter.equalTo(field, value)
  })
  if (limit && limit > 0) {
    featureRequest.maxFeatures = limit
  }
  const headers = {
    'Content-Type': 'text/plain;charset=UTF-8'
  }
  if (layer.authorizationString) {
    headers.Authorization = 'Basic ' + layer.authorizationString
  }
  const response = await axios.post(url, new XMLSerializer().serializeToString(featureRequest), {
    headers
  })
  const featuresResult = {
    response: response.data
  }
  if (response.headers['content-type'] === 'application/xml') {
    const xmlResponse = await parseXml(response.data)
    featuresResult.features = []
    if (xmlResponse['ows:ExceptionReport']) {
      featuresResult.error = _get(xmlResponse, ['ows:ExceptionReport', 'ows:Exception', '0', 'ows:ExceptionText', '0'])
      console.error(`Ошибка получения объектов слоя ${layer.name}`, featuresResult.error)
    } else {
      featuresResult.error = 'неизвестный формат ответа'
      console.error(`Ошибка получения объектов слоя ${layer.name}`, response.data)
    }
  } else {
    const result = response.data
    var crs = result.crs && result.crs.properties && result.crs.properties.name
    const features = new GeoJSON().readFeatures(result)
    features.forEach(a => {
      a.crs = crs
    })
    featuresResult.features = features
  }
  return featuresResult
}

export { getFeatures }
