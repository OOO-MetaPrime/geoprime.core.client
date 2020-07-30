import axios from 'axios'
import TileLayer from 'ol/layer/tile'
import OSM from 'ol/source/osm'
import VectorSource from 'ol/source/vector'
import VectorLayer from 'ol/layer/vector'
import BingMaps from 'ol/source/bingmaps'
import GeoJSON from 'ol/format/geojson'
import WKT from 'ol/format/wkt'
import Style from 'ol/style/style'
import Circle from 'ol/style/circle'
import Fill from 'ol/style/fill'
import Stroke from 'ol/style/stroke'
import Text from 'ol/style/text'
import Point from 'ol/geom/point'
import MultiPoint from 'ol/geom/multipoint'
import Polygon from 'ol/geom/polygon'
import MultiPolygon from 'ol/geom/multipolygon'
import LineString from 'ol/geom/linestring'
import MultiLineString from 'ol/geom/multilinestring'
import Image from 'ol/layer/image'
import ImageWMS from 'ol/source/imagewms'
import WMTSCapabilities from 'ol/format/wmtscapabilities'
import WMSCapabilities from 'ol/format/wmscapabilities'
import WMTS from 'ol/source/wmts'
import ImageArcGISRest from 'ol/source/imagearcgisrest'
import Feature from 'ol/feature'
import proj from 'ol/proj'
import extent from 'ol/extent'
import Sphere from 'ol/sphere'
import loadingstrategy from 'ol/loadingstrategy'
import camelCase from 'lodash/camelCase'
import snakeCase from 'lodash/snakeCase'
import keys from 'lodash/keys'
import groupBy from 'lodash/groupBy'
import * as legendFunctions from './legend.js'
import XYZ from 'ol/source/xyz'

const GeometryTypes = {
  /**
   * Линия
   */
  line: 10,

  /**
   * Полигон
   */
  polygon: 20,

  /**
   * Точка
   */
  point: 30,

  /**
 * Геометрия
 */
  geometry: 40
}

const LayerTypes = {
  Wms: 10,
  Wfs: 15,
  Wmts: 20,
  ArcGisDynamic: 30,
  ArcGisTiled: 31,
  Bing: 40,
  Osm: 50,
  YandexSchema: 70,
  YandexSatellite: 80,
  EventsLayer: 90,
  Otm: 100
}

const capabilitiesCache = {}
let tileMatrixCache = {}

const dpi = 96.0
const inchesPerMeter = 39.37
const pointsPerMeter = dpi / 0.0254
const wgs84Sphere = new Sphere(6378137)

function getStyleFunction (layer) {
  const settings = layer.style

  if (!settings) {
    return null
  }

  const styles = {}
  if (settings.point) {
    styles.point = new Style({
      image: new Circle({
        radius: settings.point.size / 2,
        fill: new Fill({
          color: settings.point.color
        })
      })
    })
    if (layer.isClustering) {
      makeStyleAsClustered(styles.point)
    }
  }
  if (settings.line) {
    styles.line = new Style({
      stroke: new Stroke({
        color: settings.line.color,
        width: settings.line.size
      })
    })
    if (layer.isClustering) {
      makeStyleAsClustered(styles.line)
    }
  }
  if (settings.polygon) {
    styles.polygon = new Style({
      stroke: new Stroke({
        color: settings.polygon.color,
        width: settings.polygon.size
      }),
      fill: new Stroke({
        color: settings.polygon.fill
      })
    })
    if (layer.isClustering) {
      makeStyleAsClustered(styles.polygon)
    }
  }

  return function (feature) {
    const geometry = feature.getGeometry()
    if (geometry instanceof Point || geometry instanceof MultiPoint) {
      return styles.point
    }
    if (geometry instanceof MultiLineString || geometry instanceof LineString) {
      return styles.line
    }
    if (geometry instanceof Polygon || geometry instanceof MultiPolygon) {
      return styles.polygon
    }
  }
}

function makeStyleAsClustered (style) {
  return function (feature) {
    const size = feature.get('features').length
    const text = new Text({
      text: size > 1 ? size.toString() : undefined,
      fill: new Fill({
        color: '#fff'
      })
    })

    style.setText(text)

    return style
  }
}

function getImage (options, callback) {
  var xhr = new XMLHttpRequest()

  xhr.withCredentials = !!options.authorizationString
  xhr.responseType = 'blob'
  xhr.onreadystatechange = function () {
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
      var url = window.URL || window.webkitURL
      callback(url.createObjectURL(this.response))
    }
  }

  xhr.open('GET', options.src)

  if (xhr.withCredentials) {
    xhr.setRequestHeader('Authorization', 'Basic ' + options.authorizationString)
  }

  xhr.send()
}

function getImageLoadFunction (base64AuthString) {
  return function (image, src) {
    getImage({ src: src, authorizationString: base64AuthString },
      function (imageSrc) {
        image.getImage().src = imageSrc
      })
  }
}

function resetFilters (mapLayer) {
  const source = mapLayer.getSource()
  source.updateParams({
    'cql_filter': undefined
  })
}

function updateFilters (layer, mapLayer) {
  const filterString = buildCqlFilter(layer.objects, layer.mapIdField, layer.spatialDataField)
  const source = mapLayer.getSource()
  source.updateParams({
    'cql_filter': filterString || '1 = 0'
  })
}

function buildCqlFilter (objects, mapIdField, spatialDataField) {
  let filterString = ''
  for (const object of objects) {
    if (mapIdField in object) {
      if (!object[mapIdField] || !mapIdField || !spatialDataField) {
        continue
      }
      const value = typeof object[mapIdField] === 'number' ? object[mapIdField] : `'${object[mapIdField]}'`
      if (!filterString) {
        filterString += `${spatialDataField}=${value}`
      } else {
        filterString += ` OR ${spatialDataField}=${value}`
      }
    }
  }

  return filterString.trim()
}

async function getMapLayer (layer, map) {
  const opacity = layer.opacity !== null && layer.opacity !== undefined
    ? layer.opacity
    : 1

  const visible = layer.isVisible

  const params = { 'LAYERS': layer.layers || layer.serviceLayersValue }

  if (layer.isFiltered) {
    const filterString = buildCqlFilter(layer.objects, layer.mapIdField, layer.spatialDataField)
    params['cql_filter'] = filterString || '1 = 0'
    layer.isShowFilterIcon = true
  }

  switch (layer.type) {
    case LayerTypes.Wms:
      return new Image({
        source: new ImageWMS({
          url: layer.url,
          params,
          crossOrigin: 'anonymous',
          imageLoadFunction: layer.authorizationString ? getImageLoadFunction(layer.authorizationString) : undefined
        }),
        opacity,
        visible
      })

    case LayerTypes.Wfs:
      const vectorSource = new VectorSource({
        format: new GeoJSON(),
        strategy: loadingstrategy.bbox,
        url: function (extent, number, proj) {
          return layer.url +
            '?service=WFS' +
            '&version=1.1.0' +
            '&request=GetFeature' +
            '&typeName=' + layer.layers +
            '&TIME=' + new Date().toISOString() +
            '&srsname=EPSG:3857' +
            '&outputFormat=application/json'
        }
      })

      const layerOptions = {
        source: vectorSource,
        opacity,
        visible
      }
      const layerStyle = getStyleFunction(layer)
      if (layerStyle) {
        layerOptions.style = layerStyle
      }
      return new VectorLayer(layerOptions)
    case LayerTypes.Wmts:
      const url = `${layer.url}?REQUEST=GetCapabilities`
      let result
      if (capabilitiesCache[url]) {
        result = capabilitiesCache[url]
      } else {
        const { data: response } = await axios.get(url)
        const parser = new WMTSCapabilities()
        result = parser.read(response)
        capabilitiesCache[url] = result
      }

      let layerName = layer.layers
      if (!layerName || layerName === '') {
        if (result.Contents.Layer.length === 0) {
          throw new Error('В capabilities WMTS сервиса не указан ни один слой.')
        }
        layerName = result.Contents.Layer[0].Identifier
      }

      const options = WMTS.optionsFromCapabilities(result, { layer: layerName })

      options.crossOrigin = 'anonymous'

      return new TileLayer({
        source: new WMTS(options),
        tileLoadFunction: layer.authorizationString ? this.getImageLoadFunction(layer.authorizationString) : undefined,
        opacity,
        visible
      })

    case LayerTypes.ArcGisDynamic:
      return new Image({
        source: new ImageArcGISRest({
          url: layer.url,
          ratio: 1
        }),
        opacity,
        visible
      })

    case LayerTypes.ArcGisTiled:
      const urlTemplate = `${layer.url}/tile/{z}/{y}/{x}`
      return new TileLayer({
        source: new XYZ({
          maxZoom: 16,
          url: urlTemplate
        }),
        opacity,
        visible
      })

    case LayerTypes.Bing:
      return new TileLayer({
        source: new BingMaps({
          key: 'AnKQKwP_9fW8KsK2kjAmr8pSGabPqLwXCEeKZj2jNOpw_9dBWX6eKI1JXukghBok',
          imagerySet: 'Aerial'
        }),
        opacity,
        visible
      })

    case LayerTypes.Osm:
      return new TileLayer({
        source: new OSM(),
        opacity,
        visible
      })

    case LayerTypes.Otm:
      return new TileLayer({
        source: new OSM({
          url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png'
        }),
        opacity,
        visible
      })

    case LayerTypes.EventsLayer:
      return new VectorLayer({
        source: new VectorSource(),
        style: layer.style
      })

    default:
      console.warn('Неизвестный тип слоя.')
  }
}

let featureOverlay
let devDocumentfeatureOverlay

/**
 * Получение информации о слоях
 */

async function getLayersInfo (layer, url) {
  let reqUrl
  let result

  const requestConfig = {}
  if (layer.authorizationString) {
    requestConfig.headers = { Authorization: 'Basic ' + layer.authorizationString }
  }

  switch (layer.layerType) {
    case LayerTypes.Wmts:
      reqUrl = `${url}/service/wmts?request=GetCapabilities`

      if (capabilitiesCache[reqUrl]) {
        result = capabilitiesCache[reqUrl]
      } else {
        const { data: response } = await axios.get(reqUrl, requestConfig)
        const parser = new WMTSCapabilities()
        result = parser.read(response)
        capabilitiesCache[reqUrl] = result
      }

      return result.Contents.Layer.map(x => ({
        id: x.Identifier,
        name: x.Title || x.Identifier
      }))

    case LayerTypes.Wms:
      reqUrl = `${url}?service=wms&request=GetCapabilities`

      if (capabilitiesCache[reqUrl]) {
        result = capabilitiesCache[reqUrl]
      } else {
        const { data: response } = await axios.get(reqUrl, requestConfig)
        const parser = new WMSCapabilities()
        result = parser.read(response)
        capabilitiesCache[reqUrl] = result
      }

      return result.Capability.Layer.Layer.map(x => ({
        id: x.Name,
        name: x.Title || x.Name
      }))

    case LayerTypes.Wfs:
      const resultWfs = await axios.get(`${url}?service=wfs&request=GetCapabilities`, requestConfig)
      const xml = new DOMParser().parseFromString(resultWfs.data, 'text/xml')

      const layerNodes = xml.querySelectorAll('FeatureType')

      // NodeList не является массивом
      const layers = [...layerNodes].filter(value => {
        if (!value.querySelector('Name')) {
          return false
        }
        return true
      })

      return layers.map(x => ({
        id: x.querySelector('Name').textContent,
        name: x.querySelector('Title').textContent || x.querySelector('Name').textContent
      }))
  }
}

/**
 * Получить тип геометрии
 */

const getGeometryType = async (url, layerName) => {
  const result = await axios.get(`${url}?service=wfs&version=1.1.0&request=DescribeFeatureType&typeName=${layerName}`)
  const xml = new DOMParser().parseFromString(result.data, 'text/xml')
  const layerNode = xml.querySelector('element[type^="gml"]')
  switch (layerNode.attributes.type.value) {
    case 'gml:MultiPointPropertyType':
    case 'gml:PointPropertyType': return GeometryTypes.point
    case 'gml:MultiLineStringPropertyType':
    case 'gml:LineStringPropertyType':
    case 'gml:MultiCurvePropertyType': return GeometryTypes.line
    case 'gml:SurfacePropertyType':
    case 'gml:MultiSurfacePropertyType': return GeometryTypes.polygon
    case 'gml:GeometryPropertyType': return GeometryTypes.geometry
    default: throw new Error('неизвестный тип геометрии')
  }
}

/**
 * Подсветить геометрию на карте.
 */
function highlightDevDocumentGeometriesOnMap (geometries, map, isFillHighlight) {
  if (!devDocumentfeatureOverlay) {
    devDocumentfeatureOverlay = new VectorLayer({
      source: new VectorSource(),
      map: map,
      style: new Style({
        stroke: new Stroke({
          color: '#ff1a1a',
          width: 2
        }),
        fill: isFillHighlight
          ? new Fill({
            color: 'rgba(255,170,170,0.5)'
          })
          : undefined,
        image: new Circle({
          radius: 8,
          fill: new Fill({
            color: 'rgba(255,26,26,.5)'
          })
        })
      })
    })
  } else {
    devDocumentfeatureOverlay.setMap(map)
  }

  geometries.forEach(geometry => {
    var feature = new Feature({
      geometry: geometry
    })
    devDocumentfeatureOverlay.getSource().addFeature(feature)
  })
  devDocumentfeatureOverlay.getSource().refresh()
}
function highlightGeometriesOnMap (geometries, map, isFillHighlight) {
  if (!featureOverlay) {
    featureOverlay = new VectorLayer({
      source: new VectorSource(),
      map: map,
      style: new Style({
        stroke: new Stroke({
          color: '#ff1a1a',
          width: 2
        }),
        fill: isFillHighlight
          ? new Fill({
            color: 'rgba(255,170,170,0.5)'
          })
          : undefined,
        image: new Circle({
          radius: 8,
          fill: new Fill({
            color: 'rgba(255,26,26,.5)'
          })
        })
      })
    })
  } else {
    featureOverlay.setMap(map)
  }

  geometries.forEach(geometry => {
    var feature = new Feature({
      geometry: geometry
    })
    featureOverlay.getSource().addFeature(feature)
  })
  featureOverlay.getSource().refresh()
}

/**
 * Подогнать область просмотра карты под геометрию объектов карты
 * и подсветить их на карте
 */
async function zoomAndHighlightObjectsOnMap (items, map, isFillHighlight, scale = null) {
  if (!items || items.length === 0) {
    return
  }

  var geometries = []
  for (let item of items) {
    try {
      const convertedGeometry = await getItemGeometry(item)
      if (convertedGeometry) {
        geometries.push(convertedGeometry)
      }
    } catch (error) {
      console.error(error)
      console.warn('не удалось преобразовать геометрию объекта')
    }
  }

  if (!geometries || geometries.length === 0) {
    return
  }

  var extent = getGeometriesExtent(geometries)

  await zoomMapToGeometryOrExtent(map, extent, scale)

  highlightGeometriesOnMap(geometries, map, isFillHighlight)

  return extent
}

function getGeometriesExtent (geometries) {
  var geometryExtent = extent.createEmpty()
  geometries.forEach(function (geometry) {
    extent.extend(geometryExtent, geometry.getExtent())
  })

  return geometryExtent
}

async function getItemGeometry (item) {
  let geometry
  if (!('geometry' in item)) {
    geometry = item.getGeometry()
  } else {
    geometry = item.geometry
  }
  if (geometry) {
    if (item.crs === 'urn:ogc:def:crs:EPSG::3857' || item.crs === 'EPSG:3857') {
      return geometry
    } else if (item.crs === 'urn:ogc:def:crs:EPSG::4326' || item.crs === 'EPSG:4326') {
      return geometry.transform('EPSG:4326', 'EPSG:3857')
    } else if (item.crs) {
      var originalProjection = item.crs.match(/\d+$/)
      if (originalProjection && originalProjection.length > 0) {
        var result = await axios.post('/api/map/projection',
          {
            geometry: new WKT().writeGeometry(geometry),
            projection: 3857,
            originalProjection: originalProjection[0]
          }
        )
        if (!result) {
          return null
        }
        return new WKT().readGeometry(result.data)
      } else {
        return null
      }
    }
  }
}

async function getResolutionFromScale (scale, units) {
  const mpu = proj.METERS_PER_UNIT[units]

  return parseFloat(scale) / (mpu * inchesPerMeter * dpi)
}

function getScale (map, round = true) {
  const view = map.getView()
  const sourceProj = view.getProjection()
  const center = view.getCenter()
  const px = map.getPixelFromCoordinate(center)
  if (!px) {
    return null
  }
  px[1] += 1
  const coord = map.getCoordinateFromPixel(px)
  const startPoint = proj.transform(center, sourceProj, 'EPSG:4326')
  const finishPoint = proj.transform(coord, sourceProj, 'EPSG:4326')
  const distanceInMeters = wgs84Sphere.haversineDistance(startPoint, finishPoint)
  let scale = distanceInMeters * pointsPerMeter
  if (round) {
    if (scale > 100) {
      scale = Math.round(scale / 100) * 100
    } else {
      scale = Math.round(scale)
    }
  } else {
    scale = Math.round(scale)
  }

  return scale
}

function setScale (map, scale) {
  const roundedScale = parseInt(scale)
  const currentScale = getScale(map, false)
  const view = map.getView()

  return view.setResolution(view.getResolution() * roundedScale / currentScale)
}

async function zoomMapToGeometryOrExtent (map, geometryOrExtent, scale = null) {
  const padding = [0, 0, 0, 0]

  if (scale) {
    const units = map.getView().getProjection().getUnits()
    const minResolution = await getResolutionFromScale(scale, units)

    map.getView().fit(geometryOrExtent, { minResolution: minResolution, padding: padding })
  } else {
    map.getView().fit(geometryOrExtent, { maxZoom: 17, padding: padding })
  }
}

/**
 * Очистить векторный слой для подсвечивания объектов.
 */
function clearHighlightedObjectsOnMap () {
  if (!featureOverlay) {
    return
  }
  featureOverlay.getSource().clear()
}

function clearHighlightedDevDocumentObjectsOnMap () {
  if (!devDocumentfeatureOverlay) {
    return
  }
  devDocumentfeatureOverlay.getSource().clear()
}

/**
 * Обновить слой на карте.
 * @param {*} map Карта.
 * @param {*} layer Слой.
 */
function refreshLayer (map, layer) {
  const source = layer.getSource()
  if ('getParams' in source) {
    var params = source.getParams()
    params.t = new Date().getTime()
    source.updateParams(params)
  }

  if (layer instanceof VectorLayer) {
    source.clear()
  }
}

const boundingBoxCache = {}

async function getWMSBoundingBox (layer) {
  const result = await axios.get(`${layer.url}?service=wms&version=1.3.0&request=GetCapabilities`)
  const xml = new DOMParser().parseFromString(result.data, 'text/xml')

  const layerNodes = xml.querySelectorAll('Layer')

  // NodeList не является массивом
  const layers = [...layerNodes].filter(value => {
    if (!value.querySelector('Name')) {
      return false
    }
    return true
  })

  const boundingBoxes = {}

  for (let layerNode of layers) {
    let name = layerNode.querySelector('Name').textContent
    let boundingBoxNode = layerNode.querySelector('EX_GeographicBoundingBox')

    let minx = parseFloat(boundingBoxNode.querySelector('southBoundLatitude').textContent)
    let miny = parseFloat(boundingBoxNode.querySelector('westBoundLongitude').textContent)
    let maxx = parseFloat(boundingBoxNode.querySelector('northBoundLatitude').textContent)
    let maxy = parseFloat(boundingBoxNode.querySelector('eastBoundLongitude').textContent)
    let bounds = [miny, minx, maxy, maxx]

    boundingBoxes[name] = {
      IsEPSG4326: true,
      extent: bounds
    }
  }

  return boundingBoxes
}

function getTileCoordExtent (tileCoord, projection, mapLayer) {
  const zoom = tileCoord[0]
  const matrixOptions = tileMatrixCache[projection].find(x => x.zoom === zoom)
  const origin = matrixOptions.topLeftCorner
  const resolution = mapLayer.getSource().tileGrid.getResolution(zoom)
  const tileWidth = matrixOptions.tileWidth * resolution
  const tileHeight = matrixOptions.tileHeight * resolution
  const minX = origin[0] + tileCoord[1] * tileWidth
  const maxY = origin[1] - tileCoord[2] * tileHeight
  const maxX = minX + tileWidth
  const minY = maxY - tileHeight
  return [minX, minY, maxX, maxY]
}

function calcualteExtent (layers, mapLayer) {
  const result = []
  for (const layerNode of layers) {
    const name = layerNode.querySelector('Identifier').textContent
    const tileMatrixNodesList = layerNode.querySelectorAll('TileMatrixSetLink TileMatrixLimits')
    const lastTileMatrix = [...tileMatrixNodesList][tileMatrixNodesList.length - 1]
    const [projection, zoom] = lastTileMatrix.querySelector('TileMatrix').textContent.split(':')
    const minTileRow = lastTileMatrix.querySelector('MinTileRow').textContent
    const maxTileRow = lastTileMatrix.querySelector('MaxTileRow').textContent
    const minTileCol = lastTileMatrix.querySelector('MinTileCol').textContent
    const maxTileCol = lastTileMatrix.querySelector('MaxTileCol').textContent

    const minExtent = getTileCoordExtent([zoom, minTileCol, minTileRow], projection, mapLayer)
    const maxExtent = getTileCoordExtent([zoom, maxTileCol, maxTileRow], projection, mapLayer)
    const minX = minExtent[0]
    const minY = maxExtent[1]
    const maxX = maxExtent[2]
    const maxY = minExtent[3]
    result.push({
      name,
      extent: [minX, minY, maxX, maxY]
    })
  }
  return result
}

function getTileMatrixCache (xml) {
  const tileMatrixNodeList = xml.querySelectorAll('Contents > TileMatrixSet > TileMatrix')
  const tileMatrixes = [...tileMatrixNodeList].map(x => {
    const identifiers = x.querySelector('Identifier').textContent.split(':')
    const identifiersLastEl = identifiers.length - 1
    const zoom = identifiers[identifiersLastEl]
    const projection = identifiers.slice(0, identifiersLastEl)
    const scaleDenominator = x.querySelector('ScaleDenominator').textContent
    const topLeftCorner = x.querySelector('TopLeftCorner').textContent
      .split(' ')
      .map(Number)
    const tileWidth = x.querySelector('TileWidth').textContent
    const tileHeight = x.querySelector('TileHeight').textContent
    const matrixWidth = x.querySelector('MatrixWidth').textContent
    const matrixHeight = x.querySelector('MatrixHeight').textContent
    return {
      projection,
      zoom,
      scaleDenominator,
      topLeftCorner,
      tileWidth,
      tileHeight,
      matrixWidth,
      matrixHeight
    }
  })
  return groupBy(tileMatrixes, 'projection')
}

async function getWMTSBoundingBox ({ layer, mapLayer }) {
  const result = await axios.get(`${layer.url}?request=GetCapabilities`)
  const xml = new DOMParser().parseFromString(result.data, 'text/xml')
  const layerNodes = xml.querySelectorAll('Layer')
  tileMatrixCache = getTileMatrixCache(xml)
  const boundingBoxes = {}

  // NodeList не является массивом
  const layersWithBoxes = [...layerNodes].filter(value => value.querySelector('WGS84BoundingBox'))
  const layersNoBoxes = [...layerNodes].filter(value => !value.querySelector('WGS84BoundingBox') && value.querySelector('TileMatrixSetLink'))

  const calculatedLayersExtents = calcualteExtent(layersNoBoxes, mapLayer)
  for (const { name, extent } of calculatedLayersExtents) {
    boundingBoxes[name] = {
      IsEPSG4326: false,
      extent
    }
  }
  for (let layerNode of layersWithBoxes) {
    const name = layerNode.querySelector('Identifier').textContent
    const leftTopCornerElement = layerNode.querySelector('WGS84BoundingBox LowerCorner')
    if (!leftTopCornerElement) {
      continue
    }
    const leftTopCorner = leftTopCornerElement.textContent

    const rightBottomCornerElement = layerNode.querySelector('WGS84BoundingBox UpperCorner')
    if (!rightBottomCornerElement) {
      continue
    }
    const rightBottomCorner = rightBottomCornerElement.textContent

    const lowerCorner = leftTopCorner.split(' ')
    const minX = parseFloat(lowerCorner[0])
    const minY = parseFloat(lowerCorner[1])

    const upperCorner = rightBottomCorner.split(' ')
    const maxX = parseFloat(upperCorner[0])
    const maxY = parseFloat(upperCorner[1])

    let bounds = [minX, minY, maxX, maxY]
    boundingBoxes[name] = {
      IsEPSG4326: true,
      extent: bounds
    }
  }

  return boundingBoxes
}

async function getWFSBoundingBox (layer) {
  const result = await axios.get(`${layer.url}?service=wfs&request=GetCapabilities`)
  const xml = new DOMParser().parseFromString(result.data, 'text/xml')

  const layerNodes = xml.querySelectorAll('FeatureType')

  // NodeList не является массивом
  const layers = [...layerNodes].filter(value => {
    if (!value.querySelector('Name')) {
      return false
    }
    return true
  })

  const boundingBoxes = {}

  for (let layerNode of layers) {
    let name = layerNode.querySelector('Name').textContent
    const leftTopCornerElement = layerNode.querySelector('WGS84BoundingBox LowerCorner')
    if (!leftTopCornerElement) {
      continue
    }
    const leftTopCorner = leftTopCornerElement.textContent

    const rightBottomCornerElement = layerNode.querySelector('WGS84BoundingBox UpperCorner')
    if (!rightBottomCornerElement) {
      continue
    }
    const rightBottomCorner = rightBottomCornerElement.textContent

    const lowerCorner = leftTopCorner.split(' ')
    const minX = parseFloat(lowerCorner[0])
    const minY = parseFloat(lowerCorner[1])

    const upperCorner = rightBottomCorner.split(' ')
    const maxX = parseFloat(upperCorner[0])
    const maxY = parseFloat(upperCorner[1])

    let bounds = [minX, minY, maxX, maxY]
    boundingBoxes[name] = {
      IsEPSG4326: true,
      extent: bounds
    }
  }

  return boundingBoxes
}

/**
 * Масштабировать карту по контуру слоя.
 */
async function setLayerExtent (map, { layer, mapLayer }) {
  if (layer.type === LayerTypes.EventsLayer) {
    const source = layer.view.getSource()
    const extent = source.getExtent()
    // Проверяем что все точки экстента конечное число, с бесконечностью openlayers кидает эксепшн
    if (!extent.every(isFinite)) {
      return
    }
    map.getView().fit(extent, { maxZoom: 13, size: map.getSize() })
    return
  }

  await refreshLayerBoundingBox({ layer, mapLayer })

  return fitLayerExtentWithInCache(map, layer)
}

async function refreshLayerBoundingBox ({ layer, mapLayer }) {
  if (!(layer.url in boundingBoxCache)) {
    switch (layer.type) {
      case LayerTypes.Wms:
        boundingBoxCache[layer.url] = await getWMSBoundingBox(layer)
        break
      case LayerTypes.Wmts:
        boundingBoxCache[layer.url] = await getWMTSBoundingBox({ layer, mapLayer })
        break
      case LayerTypes.Wfs:
        boundingBoxCache[layer.url] = await getWFSBoundingBox(layer)
        break
      case LayerTypes.ArcGisDynamic:
      case LayerTypes.ArcGisTiled:
      case LayerTypes.Osm:
      case LayerTypes.Bing:
      default:
        boundingBoxCache[layer.url] = {}
    }
  }
}

function getLayerExtent (layer) {
  if (!layer.layers) {
    return null
  }

  const layers = layer.layers.split(',')

  if (!layers.filter(value => value in boundingBoxCache[layer.url]).length) {
    return null
  }
  var finalExtent = extent.createEmpty()
  layers.forEach(x => {
    const { extent: layerExtent, IsEPSG4326 } = boundingBoxCache[layer.url][x]
    extent.extend(finalExtent, IsEPSG4326 ? transformExtent(layerExtent) : layerExtent)
  })

  return finalExtent
}

function fitLayerExtentWithInCache (map, layer) {
  const extent = getLayerExtent(layer)
  if (!extent) {
    return false
  }
  map.getView().fit(extent)
  return true
}

function transformExtent (extent) {
  return proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857')
}

async function bindObjectToFeature ({ customApi, EntityTypes, entityType, entityObject, entityBindField, featureBindValue }) {
  // В настройках поле указано в Pascal Case ("FieldName").
  // Сейчас в моделях используется 2 формата: camelCase и snakeCase.
  const fieldCamelCase = camelCase(entityBindField)
  const fieldSnakeCase = snakeCase(entityBindField)
  switch (entityType) {
    case EntityTypes.address:
      await customApi.addressRegistry.bindAddressObject(entityObject.id, entityBindField, featureBindValue)
      // В настройках поле указано в Pascal Case ("FieldName").
      // Сейчас в моделях используется 2 формата: camelCase и snakeCase.
      if (keys(entityObject).find(x => x === fieldCamelCase)) {
        return fieldCamelCase
      }
      if (keys(entityObject).find(x => x === fieldSnakeCase)) {
        return fieldSnakeCase
      }
      break
    case EntityTypes.isogdDocument:
      await customApi.isogd.bindGeometry(entityObject.id, featureBindValue)
      if (keys(entityObject).find(x => x === fieldCamelCase)) {
        return fieldCamelCase
      }
      if (keys(entityObject).find(x => x === fieldSnakeCase)) {
        return fieldSnakeCase
      }
      break
  }
}

async function getLayersExtent (addedSpatialPartLayers) {
  const resultExtent = extent.createEmpty()
  for (const { layer, mapLayer } of addedSpatialPartLayers) {
    await refreshLayerBoundingBox({ layer, mapLayer })
    const layerExtent = getLayerExtent(layer)
    if (!layerExtent) {
      continue
    }
    extent.extend(resultExtent, layerExtent)
  }
  if (!resultExtent.every(isFinite)) {
    return
  }
  return resultExtent
}

async function searchByManyCoords (itemsCoordinateInfo, map, scale, isDevDocument = false) {
  if (!itemsCoordinateInfo || !itemsCoordinateInfo.length) {
    return
  }

  const results = []
  for (const item of itemsCoordinateInfo) {
    let { coordinateProjection, sh, dl } = item
    const point = new Point([dl, sh])

    if (coordinateProjection === 102100) {
      coordinateProjection = 3857
    }
    if (coordinateProjection === 84) {
      coordinateProjection = 4326
    }

    try {
      const { data } = await axios.post('/api/map/projection', {
        geometry: new WKT().writeGeometry(point),
        projection: 3857,
        originalProjection: coordinateProjection
      })

      const result = new WKT().readGeometry(data)
      results.push(result)
    } catch (err) {
      console.error(`Ошибка переобразования геометрии объекта ${err}`)
      continue
    }
  }

  clearHighlightedObjectsOnMap()
  const extent = getGeometriesExtent(results)
  if (!isDevDocument) {
    await zoomMapToGeometryOrExtent(map, extent, scale)
  }
  if (isDevDocument) {
    highlightDevDocumentGeometriesOnMap(results, map, true)
    return
  }
  highlightGeometriesOnMap(results, map, true)
}

async function searchByCoords (coordinateProjection, sh, dl, map, scale) {
  const point = new Point([dl, sh])
  if (coordinateProjection === 102100) {
    coordinateProjection = 3857
  }
  if (coordinateProjection === 84) {
    coordinateProjection = 4326
  }

  const { data } = await axios.post('/api/map/projection', {
    geometry: new WKT().writeGeometry(point),
    projection: 3857,
    originalProjection: coordinateProjection
  })

  const result = new WKT().readGeometry(data)

  clearHighlightedObjectsOnMap()
  await zoomMapToGeometryOrExtent(map, result, scale)
  highlightGeometriesOnMap([result], map, true)
}

async function zoomOnPoint (coordinateProjection, sh, dl, map, scale) {
  const point = new Point([dl, sh])
  if (coordinateProjection === 102100) {
    coordinateProjection = 3857
  }
  if (coordinateProjection === 84) {
    coordinateProjection = 4326
  }

  const { data } = await axios.post('/api/map/projection', {
    geometry: new WKT().writeGeometry(point),
    projection: 3857,
    originalProjection: coordinateProjection
  })

  const result = new WKT().readGeometry(data)
  await zoomMapToGeometryOrExtent(map, result, scale)
}

async function getLayersWithLegends (layers) {
  // Используем все добавленные на карту слои, кроме подложек
  const publishedLayers = layers.filter(x => !x.layer.isBasemap)
  const layersWithLegends = await legendFunctions.getLayersLegend(publishedLayers.map(x => x.layer))

  return layersWithLegends.filter(x => x.legends && x.legends.length)
}

async function transformGeometryTo3857 (geometryOrGeometries, originalProjection) {
  if (originalProjection === 3857) {
    return geometryOrGeometries
  }
  let geometryParam = null
  if (Array.isArray(geometryOrGeometries)) {
    geometryParam = geometryOrGeometries.map(x => new WKT().writeGeometry(x))
  } else {
    geometryParam = new WKT().writeGeometry(geometryOrGeometries)
  }
  const { data } = await axios.post('/api/map/projection', {
    geometry: geometryParam,
    projection: 3857,
    originalProjection: originalProjection
  })
  if (Array.isArray(data)) {
    return data.map(x => new WKT().readGeometry(x))
  } else {
    return new WKT().readGeometry(data)
  }
}

async function transformGeoJSONFeaturesTo3857 (geojsonFeatures, originalProjection) {
  if (originalProjection === 3857) {
    return geojsonFeatures
  }

  const { data } = await axios.post('/api/map/projection/geojson', {
    features: geojsonFeatures,
    projection: 3857,
    originalProjection: originalProjection
  })

  return data
}

export {
  getMapLayer,
  zoomMapToGeometryOrExtent,
  zoomAndHighlightObjectsOnMap,
  getGeometriesExtent,
  refreshLayerBoundingBox,
  clearHighlightedObjectsOnMap,
  clearHighlightedDevDocumentObjectsOnMap,
  refreshLayer,
  transformExtent,
  LayerTypes,
  getItemGeometry,
  setLayerExtent,
  bindObjectToFeature,
  getLayerExtent,
  getLayersExtent,
  getLayersInfo,
  getGeometryType,
  highlightGeometriesOnMap,
  searchByCoords,
  searchByManyCoords,
  zoomOnPoint,
  getScale,
  setScale,
  getResolutionFromScale,
  getLayersWithLegends,
  resetFilters,
  updateFilters,
  transformGeometryTo3857,
  transformGeoJSONFeaturesTo3857
}
