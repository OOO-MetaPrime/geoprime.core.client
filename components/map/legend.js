import axios from 'axios'
import jsonp from 'jsonp'
import { LayerTypes } from './map'

const legendCache = []
const layerLegendCache = {}

/**
 * Получить ссылки на легенды.
 */
async function getLegendUrls (layer) {
  if (!(layer.url in legendCache)) {
    const response = await axios.get(layer.url + '?service=wms&version=1.3.0&request=GetCapabilities')
    const capabilites = capabilitiesConvert(capabilitiesParse(response.data))
    legendCache[layer.url] = capabilites
  }
  return getLegend(layer, legendCache[layer.url])
}

async function getLegend (layer, capabilites) {
  // в некоторых WMTS слоях не указано поля со слоями
  if (!layer.layers) {
    return null
  }

  const layerLayers = layer.layers.split(',')
  let arr = []

  for (const iterator of layerLayers) {
    if (iterator in layerLegendCache) {
      arr.push(layerLegendCache[iterator])
      continue
    }

    let layerDesc = capabilites[iterator]
    if (!layerDesc) {
      continue
    }

    const newLayerDesc = await getImgLayer(layer, layerDesc)
    layerLegendCache[iterator] = newLayerDesc
    arr.push(newLayerDesc)
  }

  return arr
}

async function getImgLayer (layer, layerDesc) {
  if (layer.authorizationString) {
    const config = {
      responseType: 'blob',
      headers: { 'Authorization': 'Basic ' + layer.authorizationString, 'Content-Type': 'text/xml' }
    }

    const img = await axios.get(layerDesc.legendUrl, config)

    const newLayerDesc = Object.assign({}, layerDesc)
    newLayerDesc.legendUrl = await loadLegendDataUrl(img.data)
    return newLayerDesc
  }

  return layerDesc
}

async function loadLegendDataUrl (legendImage) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.readAsDataURL(legendImage)
    reader.onloadend = function () {
      resolve(reader.result)
    }
  })
}

async function getLegendItems (layer) {
  switch (layer.type) {
    case LayerTypes.Wms:
      return getLegendUrls(layer)
    case LayerTypes.Wfs:
      return [layer]
    case LayerTypes.ArcGisDynamic:
      return getArcGisDynamicLegendItems(layer)
    case LayerTypes.EventsLayer:
      return getEventsLayerLegend(layer)
    default:
      return []
  }
}

function getEventsLayerLegend (layer) {
  const eventTypes = layer.legend
  if (!eventTypes) {
    return
  }
  return eventTypes
    .filter(x => x.icon)
    .map(x => ({
      label: x.title,
      legendUrl: x.icon
    }))
}

async function getArcGisDynamicLegendItems (layer) {
  const url = `${layer.url}/legend?f=json`
  const response = await new Promise((resolve, reject) => {
    jsonp(url, function (error, data) {
      if (!error) {
        resolve(data)
      } else {
        reject(error)
      }
    })
  })

  return response.layers
    .map(x => x.legend)
    .reduce((a, b) => a.concat(b), [])
    .map(x => ({
      label: x.label,
      legendUrl: 'data:image/png;base64,' + x.imageData
    }))
}

/**
 * Получить легенды для текущих активных слоев.
 */
async function getLayersLegend (layers) {
  const legends = []

  for (const layer of layers) {
    const item = {
      id: layer.id,
      name: layer.name
    }
    if (Object.keys(layer.style).length && layer.type === LayerTypes.Wfs) {
      item.style = layer.style
    }
    try {
      item.legends = await getLegendItems(layer)
    } catch (error) {
      // Если ничего нет, оставляем legends ни с чем
      item.legends = null
    }
    legends.push(item)
  }

  return legends
}

function parseLayer (layer) {
  var legendTag = layer.querySelector('LegendURL OnlineResource')

  return {
    name: layer.querySelector('Name').textContent,
    title: layer.querySelector('Title').textContent,
    legendUrl: legendTag ? legendTag.getAttribute('xlink:href') : ''
  }
}

function parseLayers (capabilites) {
  var result = []
  for (var capability of capabilites) {
    var layers = capability.querySelectorAll('Layer')
    for (var layer of layers) {
      result.push(parseLayer(layer))
    }
  }

  return result
}

/**
 * Распарсить capabilites с геосервера.
 */
function capabilitiesParse (xml) {
  xml = new DOMParser().parseFromString(xml, 'text/xml')
  var layerNodes = xml.querySelectorAll('Capability')

  var layers = []
  for (var layerNode of layerNodes) {
    layers.push(layerNode)
  }

  layerNodes = layers.filter(value => {
    if (!value.querySelector('Layer')) {
      return false
    }
    return true
  })

  return parseLayers(layerNodes)
}

/**
 * Сконверить capabilites в объект.
 */
function capabilitiesConvert (capabilities) {
  var result = {}
  capabilities.forEach(value => {
    result[value.name] = value
  })
  return result
}

export { getLayersLegend }
