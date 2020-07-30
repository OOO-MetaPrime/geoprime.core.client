import axios from 'axios'
import _get from 'lodash/get'
import _omit from 'lodash/omit'
import _cloneDeep from 'lodash/cloneDeep'
import _differenceBy from 'lodash/differenceBy'
import moment from 'moment'
import wms from './wms.js'
import * as mapFunctions from './map.js'
import layers from '^/api/layers'
import * as identifyFunctions from './identify.js'
import filter from 'ol/format/filter'
import WFS from 'ol/format/wfs'

/**
 * Получить значение атрибута по имени.
 */
function getAttributeValueByName (attributes, name) {
  const foundItem = attributes.find(attr => attr.name === name)
  return _get(foundItem, 'value')
}

function formatDate (date) {
  if (date) {
    return moment(date).format('L LT')
  }
}

const eventColumnNames = {
  name: {
    title: 'Наименование'
  },
  typeName: {
    title: 'Тип события'
  },
  startDate: {
    title: 'Дата/время начала',
    render: data => formatDate(data)
  },
  endDate: {
    title: 'Дата/время окончания',
    render: data => formatDate(data)
  },
  accessLevelName: {
    title: 'Уровень доступа'
  },
  address: {
    title: 'Адрес места проведения'
  },
  description: {
    title: 'Описание события'
  },
  organizersContacts: {
    title: 'Контактная информация'
  }
}

function proccessEventFeature (feature, searchType) {
  const values = _get(feature, 'feature.values_') || feature.values_
  feature.name = values.name
  feature.searchType = searchType
  const searchValues = _omit(values, [
    'accessLevelId',
    'createdBy',
    'updatedBy',
    'geometry',
    'ownerId',
    'shape',
    'typeId'
  ])
  feature.attributes = Object.entries(eventColumnNames).map(([key, value]) => ({
    name: value.title,
    value: value.render ? value.render(searchValues[key]) : searchValues[key]
  }))
  feature.files = values.files.map(el => ({
    createdAt: el.createdAt,
    fileType: el.fileType,
    downloadUrl: el.downloadUrl,
    id: el.id,
    name: el.name
  }))
  feature.searchType = searchType
}

/**
 * Обработка метаданных слоя (укороченный список атрибутов, url изображения).
 */
async function processFeature (feature, searchType) {
  if (feature.layerId === 'events-map-layer') {
    proccessEventFeature(feature, searchType)
    return
  }
  let settings = await layers.getLayerSettings(feature.layerId)
  if (!settings) {
    settings = {}
  }
  const objectId = settings.mapIdField ? getAttributeValueByName(feature.attributes, settings.mapIdField) : null

  // сохраняем исходный список атрибутов
  feature.originalAttributes = _cloneDeep(feature.attributes)

  // удаляем лишние атрибуты
  if (settings.attributesForShowing) {
    feature.attributes = _cloneDeep(feature.attributes.filter(a => settings.attributesForShowing.includes(a.name)))
  }

  // заполняем поля для списка поиска
  if (!settings.allowedAttributes || settings.allowedAttributes.length === 0) {
    feature.shortAttributes = []
  } else {
    feature.shortAttributes = _differenceBy(feature.attributes, settings.allowedAttributes, x => x.name)
  }

  if (settings.hideEmpty) {
    // Удаляем атрибуты с пустыми значениями (undefined, null, '').
    const nonEmptyValues = x => x.value != null && x.value !== ''
    feature.shortAttributes = feature.shortAttributes.filter(nonEmptyValues)
    feature.attributes = _cloneDeep(feature.attributes.filter(nonEmptyValues))
  }

  // заполняем псевдонимы
  if (settings.aliases) {
    for (const alias of Object.keys(settings.aliases)) {
      const attribute = feature.attributes.find(a => a.name === alias)
      if (attribute) {
        attribute.name = settings.aliases[alias]
        attribute.originalName = alias
      }
    }
  }

  // заполняем имя объекта
  feature.name = feature.featureId || (feature.attributes[0] ? feature.attributes[0].value : '<отсутствует>')
  if (settings.displayName) {
    feature.name = getAttributeValueByName(feature.originalAttributes, settings.displayName)
  }
  feature.searchType = searchType
  feature.filePlace = `${settings.filePlace}`
  feature.layerField = settings.layerField // название поля в слое для поиска сущности
  feature.entityField = settings.mapIdField // название поля в сущности для поиска сущности
  feature.objectIdValue = objectId
  feature.hideEmpty = settings.hideEmpty
}

async function getFeaturesFilterXml (typeNames, searchValue, searchOptions, layer) {
  let currentLayerSettings
  if (searchOptions.thematicSearch && searchOptions.thematicSearch.layers) {
    const thematicSearchSettings = searchOptions.thematicSearch.layers.find(a => a.layer.id === layer.layerId)
    currentLayerSettings = {
      fields: [thematicSearchSettings.attribute],
      matchCase: !thematicSearchSettings.isNotCaseSensetive,
      isPartiallyMatch: thematicSearchSettings.isPartiallyMatch
    }
  }

  if (!currentLayerSettings) {
    const layerSettings = await layers.getLayerSettings(layer.layerId)
    currentLayerSettings = {
      fields: searchOptions.fields || (layerSettings ? layerSettings.attributesForShowing : null),
      matchCase: searchOptions.matchCase == null ? false : searchOptions.matchCase,
      isPartiallyMatch: searchOptions.isPartiallyMatch == null ? true : searchOptions.isPartiallyMatch
    }
  }
  const options = currentLayerSettings
  const searchFields = options.fields
  const matchCase = options.matchCase
  const isPartiallyMatch = options.isPartiallyMatch

  const searchValues = (searchValue instanceof Array) ? searchValue : [searchValue]
  let filters
  typeNames.forEach(function (typeName) {
    const allFields = typeName.fields.featureTypes[0].properties
    const fields = allFields
      // Если указаны поля для поиска то ищем по ним, если нет - то по всем стринговым полям
      .filter(x => x.type === 'xsd:string' && (searchFields ? searchFields.includes(x.name) : true))
    let fieldsFilter = ''
    fields.forEach(field => {
      searchValues.forEach(searchVal => {
        const operatorTag = `${field.type === 'xsd:string' ? 'PropertyIsLike' : 'PropertyIsEqualTo'}`
        fieldsFilter += `
          <ogc:${operatorTag} escapeChar="/" singleChar="?" wildCard="*" matchCase="${matchCase}">
            <ogc:PropertyName> ${field.name} </ogc:PropertyName>
            <ogc:Literal> ${getFilterValue(searchVal, isPartiallyMatch)} </ogc:Literal>
          </ogc:${operatorTag}>
        `
      })
    })

    filters = `
      <wfs:Query typeName="${typeName.description.layerId}"
       srsName="EPSG:3857"
      >
        <ogc:Filter>
          <ogc:Or> ${fieldsFilter} </ogc:Or>
        </ogc:Filter>
      </wfs:Query>`
  })
  return `<?xml version="1.0"?>
            <wfs:GetFeature xmlns:gml="http://www.opengis.net/gml"
              xmlns:ogc="http://www.opengis.net/ogc"
              xmlns:wfs="http://www.opengis.net/wfs"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://www.opengis.net/wfs ../wfs/1.1.0/WFS.xsd"
              service="WFS"
              maxFeatures="50"
              outputFormat="application/json"
              version="1.1.0"
            >
              ${filters}
            </wfs:GetFeature>
          `
}

function getFilterValue (searchValue, isPartiallyMatch) {
  return isPartiallyMatch ? ('*' + searchValue + '*') : searchValue
}

async function getFeatureTypes (layerDescriptions, layer) {
  const featureTypeRequests = []
  layerDescriptions.forEach(function (layerDescription) {
    const url = layerDescription.owsURL + 'service=wfs&version=2.0.0&request=DescribeFeatureType&outputFormat=application/json&typeName=' + layerDescription.typeName

    featureTypeRequests.push({
      layerName: layerDescription.layerName,
      sourceUrl: layerDescription.owsURL,
      requestUrl: url,
      layerId: layerDescription.layerName,
      isShare: true
    })
  })

  const config = {
    headers: { 'Content-Type': 'text/json' }
  }
  if (layer.authorizationString) {
    config.headers.Authorization = 'Basic ' + layer.authorizationString
  }

  const featureTypes = await axios.all(featureTypeRequests.map(item => axios.get(item.requestUrl, config)))

  let result = []
  featureTypes.forEach((value, index) => result.push({ description: featureTypeRequests[index], fields: value.data }))

  return result
}

function getLayers (layer) {
  const layers = []
  const layerNames = layer.layers.split(',')

  for (const layerNameIndex in layerNames) {
    const currentLayerName = layerNames[layerNameIndex]
    layers.push({
      layerName: currentLayerName,
      sourceUrl: layer.url.trim(),
      layerId: layer.id,
      authorizationString: layer.authorizationString
    })
  }

  return layers
}

/**
 * Поиск объектов в слоях.
 */
async function getFeatures (layers, searchValue, searchOptions) {
  if (!layers || layers.length === 0) {
    return []
  }

  const layerTypes = mapFunctions.LayerTypes
  let features = []

  for (let layerTypeId in layerTypes) {
    const layerType = layerTypes[layerTypeId]
    const layersByType = getLayersByType(layers, layerType)

    switch (layerType) {
      case layerTypes.Wms:
      case layerTypes.Wfs:
        features = features.concat(await getWmsFeatures(layersByType, searchValue, searchOptions))
        break
      case layerTypes.EventsLayer:
        features = features.concat(getEventLayerFeatures(layersByType[0], searchValue, searchOptions))
        break
    }
  }

  return features
}

function getLayersByType (layers, layerType) {
  return layers.filter(layer => layer && layer.type === layerType)
}

async function getWmsFeatures (layers, searchValue, searchOptions) {
  if (!layers || layers.length === 0) {
    return []
  }

  try {
    const layerList = layers
      .map(layer => getLayers(layer))
      .reduce((prevValue, currValue) => prevValue.concat(currValue), [])
    const features = await Promise.all(layerList.map(layer => getLayerFeatures(layer, searchValue, searchOptions)))
    const res = features.reduce((prevValue, currValue) => prevValue.concat(currValue), [])

    for (let feature of res) {
      await processFeature(feature, searchOptions.thematicSearch.searchType)
    }

    return res
  } catch (e) {
    return []
  }
}

function filterEventFeature (feature, searchValue) {
  const attributes = feature.getProperties()
  const textAttributeNames = ['name', 'typeName', 'address', 'description', 'accessLevelName']
  for (const attrName of textAttributeNames) {
    if (attributes[attrName] && attributes[attrName].toLowerCase().indexOf(searchValue.toLowerCase()) !== -1) {
      return true
    }
  }

  return false
}

function getEventLayerFeatures (layer, searchValue, searchOptions) {
  if (!layer) {
    return []
  }

  try {
    const source = layer.view.getSource()
    const features = source.getFeatures()
    const filteredFeatures = features.filter(x => filterEventFeature(x, searchValue))
      .map(x => identifyFunctions.mapEventFeatures(x, layer))
    for (let feature of filteredFeatures) {
      proccessEventFeature(feature, searchOptions.thematicSearch.searchType)
    }

    return filteredFeatures
  } catch (e) {
    return []
  }
}

async function getLayerFeatures (layer, searchValue, searchOptions) {
  try {
    const typeNames = await wms.getLayerDescriptions(layer)
    const featureTypes = await getFeatureTypes(typeNames, layer)

    const xmlFilter = await getFeaturesFilterXml(featureTypes, searchValue, searchOptions, layer)

    const config = {
      headers: { 'Content-Type': 'text/xml' }
    }

    if (layer.authorizationString) {
      config.headers['Authorization'] = 'Basic ' + layer.authorizationString
    }
    const { data: features } = await axios.post(typeNames[0].owsURL, xmlFilter, config)
    if (!(features instanceof Object)) {
      return []
    }

    return identifyFunctions.getFeatures(features, layer)
  } catch (error) {
    console.error(error)
    // console.warn(`Ошибка получения объектов слоя "${layer.name}"`)
    return []
  }
}

async function getFeaturesByValues (layer) {
  const filterList = []

  if (!layer.spatialDataField || !layer.mapIdField) {
    return []
  }

  for (const object of layer.objects) {
    if (object[layer.mapIdField] != null) {
      const equalToFilter = filter.equalTo(layer.spatialDataField, object[layer.mapIdField], false)
      filterList.push(equalToFilter)
    }
  }

  if (!filterList.length) {
    return []
  }

  let globalFilter

  if (filterList.length === 1) {
    globalFilter = filterList[0]
  } else {
    globalFilter = filter.or(...filterList)
  }

  const config = {
    headers: { 'Content-Type': 'text/xml' }
  }

  if (layer.authorizationString) {
    config.headers['Authorization'] = 'Basic ' + layer.authorizationString
  }

  layer.sourceUrl = layer.url.trim()
  layer.layerId = layer.id
  layer.layerName = layer.layers

  const featureRequest = new WFS().writeGetFeature({
    featureTypes: [layer.layerName],
    outputFormat: 'application/json',
    filter: globalFilter
  })

  const { data: features } = await axios.post(`${layer.url}?service=wfs&version=1.1.0&request=GetFeature&typeName=${layer.layerName}`, new XMLSerializer().serializeToString(featureRequest), config)
  if (!(features instanceof Object)) {
    return []
  }

  return identifyFunctions.getFeatures(features, layer)
}

export default { getFeatures, processFeature, proccessEventFeature, getFeaturesByValues }
