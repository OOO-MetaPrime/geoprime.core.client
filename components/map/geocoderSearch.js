import axios from 'axios'
import GeoJSON from 'ol/format/geojson'
import proj from 'ol/proj'
import Point from 'ol/geom/point'
import searchStrategyTypes from './searchStrategyTypes.js'

function processFeature (feature, geometry) {
  const attributes =
    [
      { originalName: 'display_name', name: 'Наименование', value: feature.display_name },
      { originalName: 'lat', name: 'Широта', value: feature.lat },
      { originalName: 'lon', name: 'Долгота', value: feature.lon },
      { originalName: 'osm_id', name: 'Идентификатор OSM', value: feature.osm_id },
      { originalName: 'importance', name: 'Важность', value: feature.importance },
      { originalName: 'category', name: 'Категория', value: feature.category },
      { originalName: 'type', name: 'Тип', value: feature.type }
    ]

  const shortAttributes = attributes.filter(attr => attr.name === 'lat' || attr.name === 'lon')

  return {
    name: feature.display_name,
    featureId: feature.osm_id,
    layerId: 'openstreetmap',
    layerName: 'OpenStreetMap',
    attributes: attributes,
    geometry: geometry,
    crs: 'urn:ogc:def:crs:EPSG::4326',
    imageUrl: null,
    shortAttributes: shortAttributes,
    options: { osmType: feature.osm_type },
    isShare: true,
    searchType: searchStrategyTypes.osm
  }
}

/**
 * Поиск объектов с помощью геокодера OpenStreetMap.
 */
async function getFeatures (layers, searchValue) {
  var url = `https://nominatim.openstreetmap.org/search/?q=${searchValue}&format=jsonv2&polygon_geojson=1`

  try {
    const { data: features } = await axios.get(url, { timeout: 15000 })
    var mappedFeatures = features.map(feature => {
      var geoJson = new GeoJSON()
      var geometry = geoJson.readGeometry(feature.geojson, proj.get('EPSG:3857'))

      return processFeature(feature, geometry)
    })
    return mappedFeatures
  } catch (e) {
    console.error(e)
    console.warn(`Ошибка получения объектов OpenStreetMap`)
    return []
  }
}

/**
 * Получить фичу по идентификатору.
 */
async function getFeatureById (id, options) {
  const featureOptions = options || {}
  const osmTypeSymbol = (featureOptions.osmType || 'N')[0].toUpperCase()
  const { data: features } = await axios.get(`https://nominatim.openstreetmap.org/lookup?format=json&osm_ids=${osmTypeSymbol}${id}`, { timeout: 15000 })
  if (features.length === 0) {
    return null
  }
  var feature = features[0]
  return processFeature(feature, new Point([feature.lon, feature.lat]))
}

export default { getFeatures, getFeatureById }
