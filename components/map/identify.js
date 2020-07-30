import axios from 'axios'
import moment from 'moment'
import { LayerTypes } from './map'
import jsonp from 'jsonp'
import olHas from 'ol/has'
import EsriJSON from 'ol/format/esrijson'
import GeoJSON from 'ol/format/geojson'
import WFS from 'ol/format/wfs'
import filter from 'ol/format/filter'
import objectSearch from './objectSearch'

const esriJSON = new EsriJSON()

async function identifyByCoordinates (map, layer, coordinate) {
  return identify(map, [layer], coordinate, { maxFeatures: 30 })
}

async function identify (map, layers, coordinate, options) {
  const tasks = layers
    .filter(x => x.view.getVisible())
    .map(x => identifyLayer(map, x, coordinate, options))

  const result = await Promise.all(tasks)
  return result.reduce((x, y) => x.concat(y), [])
}

async function identifyRegion (map, layers, geometry) {
  const tasks = layers
    .filter(x => x.mapLayer.getVisible())
    .map(x => identifyLayerByRegion(map, x.layer, geometry))

  const results = await Promise.all(tasks)
  return results.reduce((x, y) => x.concat(y), [])
}

async function identifyLayerByRegion (map, layer, geometry) {
  try {
    switch (layer.type) {
      case LayerTypes.Wms:
      case LayerTypes.Wfs:
        return await identifyWFSLayer(map, layer, geometry)
      case LayerTypes.EventsLayer:
        return await identifyEventsLayerByGeometry(map, layer, geometry)
      default:
        return Promise.resolve([])
    }
  } catch (error) {
    console.warn(`Слой "${layer.name}" недоступен`)
    return []
  }
}
async function identifyEventsLayerByGeometry (map, layer, geometry) {
  const source = layer.view.getSource()
  const features = source.getFeatures()
  const foundFeatures = features
    .filter(x => {
      const coordinates = x.getGeometry().getCoordinates()
      return geometry.intersectsCoordinate(coordinates)
    })
    .map(x => mapEventFeatures(x, layer))
  foundFeatures.forEach(x => objectSearch.proccessEventFeature(x, 'identify'))

  return foundFeatures
}

async function identifyWFSLayer (map, layer, geometry) {
  let layerProperties = await getFeatureTypeProperties(layer)

  let geometryProperty = null
  if (layerProperties && layerProperties.properties) {
    geometryProperty = layerProperties.geometryPropertyName
    layerProperties = layerProperties.properties
  }

  if (!geometryProperty) {
    return []
  }

  const srs = map.getView().getProjection().getCode()

  const xmlFilter = new WFS().writeGetFeature({
    srsName: srs,
    featureTypes: layer.layers.split(','),
    outputFormat: 'application/json',
    filter: filter.intersects(geometryProperty, geometry),
    maxFeatures: 30
  })
  const config = {
    headers: layer.authorizationString
      ? { 'Authorization': 'Basic ' + layer.authorizationString, 'Content-Type': 'text/xml' }
      : { 'Content-Type': 'text/xml' }
  }

  const { data: featureCollection } = await axios.post(layer.url, new XMLSerializer().serializeToString(xmlFilter), config)
  const url = layer.url

  const layerInfo = {
    layerName: layer.layers,
    sourceUrl: layer.url,
    requestUrl: url.replace(encodeURIComponent(layer.layers), layer.layers),
    layerId: layer.id,
    authorizationString: layer.authorizationString
  }

  const features = getFeatures(featureCollection, layerInfo, layerProperties)
  for (const feature of features) {
    await objectSearch.processFeature(feature, 'identify')
  }

  return features
}

async function identifyLayer (map, layer, coordinate, options) {
  try {
    switch (layer.type) {
      case LayerTypes.Wms:
        return await identifyWms(map, layer, coordinate, options)
      case LayerTypes.Wfs:
        return identifyVectorLayer(map, layer, coordinate, options)
      case LayerTypes.ArcGisDynamic:
        return await identifyArcGisDynamic(map, layer, coordinate, options)
      case LayerTypes.EventsLayer:
        return identifyEventsLayerByCoordinates(map, layer, coordinate)
      default:
        return Promise.resolve([])
    }
  } catch (error) {
    console.log(error)
    console.warn(`Слой "${layer.name}" недоступен`)
    return []
  }
}

function getProperties (feature, layerProperties) {
  return feature.getKeys()
    .filter(x => x !== feature.getGeometryName())
    .map(x => {
      let value = feature.get(x)
      if (layerProperties) {
        const isDateField = layerProperties.find(a => a.type === 'xsd:date' && a.name === x)
        const isDateTimeField = layerProperties.find(a => a.type === 'xsd:date-time' && a.name === x)
        if (isDateField && value) {
          try {
            // Geoserver в Json формате присылает дату формате YYYY-MM-DDZ, данный формат не парсится в некоторых браузерах (IE, Firefox)
            value = moment(value.replace('Z', '')).format('DD.MM.YYYY')
          } catch (error) {
            // WORKAROUND: если не удалось преобразовать дату в формат для России то оставляем все как есть
          }
        } else if (isDateTimeField && value) {
          try {
            value = moment(value.replace('Z', '')).format('L LT')
          } catch (error) { }
        }
      }
      return {
        name: x,
        value: value
      }
    })
}

function identifyEventsLayerByCoordinates (map, layer, coordinate) {
  const { point1, point2 } = getSearchExtent(map, coordinate)
  const extent = [point1[0], point2[1], point2[0], point1[1]]
  const source = layer.view.getSource()
  const features = source.getFeaturesInExtent(extent)
    .map(x => mapEventFeatures(x, layer))
  return features
}

function isGeometryIntersectsWithCoordinates (map, geometry, coordinate) {
  const { point1, point2 } = getSearchExtent(map, coordinate)
  const extent = [point1[0], point2[1], point2[0], point1[1]]
  return geometry.intersectsExtent(extent)
}

function mapEventFeatures (x, layer) {
  return {
    attributes: getProperties(x),
    geometry: x.getGeometry(),
    crs: 'EPSG:3857',
    layerId: layer.id,
    layerName: layer.name,
    feature: x.clone()
  }
}

async function identifyArcGisDynamic (map, layer, coordinate) {
  // http://resources.arcgis.com/en/help/rest/apiref/identify.html
  const tolerance = 5
  const size = map.getSize()
  const extent = map.getView().calculateExtent(size)
  const mapExtent = extent.join()
  const dpi = Math.round(90 * olHas.DEVICE_PIXEL_RATIO)
  const imageDisplay = `${size[0]},${size[1]},${dpi}`
  const srid = 3857
  const url = `${layer.url}/identify?geometryType=esriGeometryPoint&geometry=${coordinate[0]},${coordinate[1]}&tolerance=${tolerance}&sr=${srid}&mapExtent=${mapExtent}&imageDisplay=${imageDisplay}&f=json`

  const response = await new Promise((resolve, reject) => {
    jsonp(url, function (error, data) {
      if (!error) {
        resolve(data)
      } else {
        reject(error)
      }
    })
  })

  const featureCollection = {
    features: response.results
  }

  const features = esriJSON.readFeatures(featureCollection)
  return features.map((x, i) => {
    return {
      featureId: x.getId(),
      name: response.results[i].value,
      attributes: getProperties(x),
      geometry: x.getGeometry(),
      crs: 'EPSG:3857',
      layerId: layer.id,
      layerName: layer.name,
      feature: x
    }
  })
}

function getFeatures (featureServiceCollection, layer, layerProperties) {
  const geoJson = new GeoJSON()
  const features = geoJson.readFeatures(featureServiceCollection)
  const layerName = layer.layerName

  return features.map(feature => ({
    featureId: feature.getId(),
    attributes: getProperties(feature, layerProperties),
    geometry: feature.getGeometry(),
    crs: featureServiceCollection.crs && featureServiceCollection.crs.properties && featureServiceCollection.crs.properties.name,
    layerId: layer.layerId,
    layerName: layerName,
    isShare: true,
    feature: feature.clone()
  }))
}

async function identifyWms (map, layer, point, options) {
  const source = layer.view.getSource()
  const resolution = map.getView().getResolution()
  let featureCount = 30
  if (options && options.maxFeatures) {
    featureCount = options.maxFeatures
  }

  // WMS
  const requests = []
  const layerNames = source.getParams().LAYERS.split(',')
  const url = source.getGetFeatureInfoUrl(point, resolution, 'EPSG:3857', { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': featureCount })
  let layerProperties = await getFeatureTypeProperties(layer)
  if (layerProperties && layerProperties.properties) {
    layerProperties = layerProperties.properties
  }

  for (let currentLayerName of layerNames) {
    requests.push({
      layerName: currentLayerName,
      sourceUrl: source.getUrl().trim(),
      requestUrl: url.replace(encodeURIComponent(source.getParams().LAYERS), currentLayerName),
      layerId: layer.id,
      authorizationString: layer.authorizationString
    })
  }
  const responses = await axios.all(requests.map(item => axios.get(item.requestUrl, {
    headers: item.authorizationString ? { 'Authorization': 'Basic ' + item.authorizationString } : undefined
  })))

  let list = []

  responses.forEach((value, index) => {
    list = list.concat(getFeatures(value.data, requests[index], layerProperties))
  })
  return list
}

function getGeometryPropertyName (featureType) {
  const geomProperty = featureType.properties.find(prop => prop.type.indexOf('gml') !== -1)

  return geomProperty ? geomProperty.name : null
}

async function identifyVectorLayer (map, layer, point, options) {
  let layerProperties = await getFeatureTypeProperties(layer)

  let geometryProperty = null
  if (layerProperties && layerProperties.properties) {
    geometryProperty = layerProperties.geometryPropertyName
    layerProperties = layerProperties.properties
  }

  if (!geometryProperty) {
    return []
  }

  const xmlFilter = await getWfsIdentifyXml(map, layer, point, geometryProperty, options)

  const config = {
    headers: layer.authorizationString
      ? { 'Authorization': 'Basic ' + layer.authorizationString, 'Content-Type': 'text/xml' }
      : { 'Content-Type': 'text/xml' }
  }

  const { data: featureCollection } = await axios.post(layer.url, xmlFilter, config)
  const url = layer.url

  const layerInfo = {
    layerName: layer.layers,
    sourceUrl: layer.url,
    requestUrl: url.replace(encodeURIComponent(layer.layers), layer.layers),
    layerId: layer.id,
    authorizationString: layer.authorizationString
  }

  const features = getFeatures(featureCollection, layerInfo, layerProperties)

  return features
}

async function getFeatureType (layer) {
  const url = layer.url + '?service=wfs&version=2.0.0&request=DescribeFeatureType&outputFormat=application/json&typeName=' + layer.layers

  const headers = { 'Content-Type': 'text/json' }

  if (layer.authorizationString) {
    headers.Authorization = 'Basic ' + layer.authorizationString
  }

  const result = await axios.get(url, { headers })

  if (!result.data.featureTypes) {
    throw new Error(`'Ошибка получения информации о слое\r\n${result.data}`)
  }
  return result.data.featureTypes[0]
}

async function getFeatureTypeProperties (layer) {
  var featureType = await getFeatureType(layer)

  return { properties: featureType.properties, geometryPropertyName: getGeometryPropertyName(featureType) }
}

async function getWfsIdentifyXml (map, layer, point, geometryProperty, options) {
  var crsName = map.getView().getProjection().getCode()
  var extent = getSearchExtent(map, point)
  var geom = getExtentXml(extent, crsName)
  const maxFeaturesFilter = options && options.maxFeatures ? `maxFeatures="${options.maxFeatures}"` : ''

  return `
<wfs:GetFeature xmlns:gml="http://www.opengis.net/gml"
                xmlns:ogc="http://www.opengis.net/ogc"
                xmlns:wfs="http://www.opengis.net/wfs"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.opengis.net/wfs ../wfs/1.1.0/WFS.xsd"
                service="WFS"
                ${maxFeaturesFilter}
                outputFormat="application/json"
                version="1.1.0">
    <wfs:Query typeName="${layer.layers}" srsName="${crsName}">
      <ogc:Filter>
        <ogc:Intersects>
          <ogc:PropertyName>${geometryProperty}</ogc:PropertyName>
        ${geom}
      </ogc:Intersects>
    </ogc:Filter>
  </wfs:Query>
</wfs:GetFeature>`
}

function getExtentXml (extent, crsName) {
  return `<gml:Envelope srsName="${crsName}">` +
    `<gml:lowerCorner>${extent.point1[0]} ${extent.point1[1]}</gml:lowerCorner>` +
    `<gml:upperCorner>${extent.point2[0]} ${extent.point2[1]}</gml:upperCorner>` +
    '</gml:Envelope>'
}

function getSearchExtent (map, point) {
  var pixels = map.getPixelFromCoordinate(point)
  // Расстояние от точки в пикселях, для которого будет производиться поиск.
  const tolerance = 10

  var leftTopPixels = [pixels[0] - tolerance, pixels[1] - tolerance]
  var rightBottomPixels = [pixels[0] + tolerance, pixels[1] + tolerance]
  var point1 = map.getCoordinateFromPixel(leftTopPixels)
  var point2 = map.getCoordinateFromPixel(rightBottomPixels)

  return { point1: point1, point2: point2 }
}

export {
  getFeatureType,
  getFeatures,
  identifyByCoordinates,
  identify,
  identifyRegion,
  mapEventFeatures,
  isGeometryIntersectsWithCoordinates,
  getSearchExtent
}
