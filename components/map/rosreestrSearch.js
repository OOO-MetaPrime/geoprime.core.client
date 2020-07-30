import axios from 'axios'
import Point from 'ol/geom/point'
import rosreestrClassifiers from './rosreestrClassifiers.js'

const searchTypes = {
  Stead: 'Stead',
  Quartal: 'Quartal'
}

const steadAliases = {
  'cn': 'Кадастровый номер',
  'address': 'Адрес',
  'kvartal_cn': 'Кадастровый номер квартала',
  'date_create': 'Дата постановки на учет',
  'cad_record_date': 'Дата изменения сведений в ГКН',
  'adate': 'Дата выгрузки сведений из ГКН',
  'util_by_doc': 'Разрешенное использование (по документу)',
  'displayCadastralCost': 'Кадастровая стоимость',
  'area': 'Площадь',
  'displayCategoryType': 'Категория земель',
  'displayOwnership': 'Форма собственности',
  'utilDescription': 'Разрешенное использование (описание)',
  'state': 'Статус'
}

const quartalAliases = {
  'cn': 'Кадастровый номер',
  'rayon_cn': 'Район',
  'okrug_cn': 'Округ',
  'pubdate': 'Дата опубликования на ПКК'
}

const pkkUrls = {
  Stead: 'https://pkk.rosreestr.ru/api/features/1/',
  Quartal: 'https://pkk.rosreestr.ru/api/features/2/'
}

function trimLeft (str, charlist) {
  if (charlist === undefined) {
    /* eslint-disable */
    charlist = '\s'
    /* eslint-enable */
  }
  return str.replace(new RegExp('^[' + charlist + ']+'), '')
}

function getNormalizedSearchString (searchString) {
  var parts = searchString.split(':')

  return parts.map(part => trimLeft(part, '0')).join(':')
}

function getSearchType (searchValue) {
  var blocks = searchValue.split(':')

  switch (blocks.length) {
    case 3:
      return searchTypes.Quartal
    case 4:
      return searchTypes.Stead
  }
}

function addCalculatedAttributes (featureAttributes) {
  var cadUnit = featureAttributes['cad_unit']
  var cadCost = featureAttributes['cad_cost']
  if (cadCost) {
    if (cadUnit) {
      let unitName = rosreestrClassifiers.measurementUnits[cadUnit]
      featureAttributes['displayCadastralCost'] = `${cadCost} ${unitName}`
    } else {
      featureAttributes['displayCadastralCost'] = `${cadCost}`
    }
  }

  var areaUnit = featureAttributes['area_unit']
  var area = featureAttributes['area_value']

  if (area) {
    if (areaUnit) {
      let unitName = rosreestrClassifiers.measurementUnits[areaUnit]
      featureAttributes['area'] = `${area} ${unitName}`
    } else {
      featureAttributes['area'] = `${area}`
    }
  }

  addCalculatedDictAttribute(featureAttributes, 'category_type', 'displayCategoryType', rosreestrClassifiers.category_types)
  addCalculatedDictAttribute(featureAttributes, 'fp', 'displayOwnership', rosreestrClassifiers.parcelOwnership)
  addCalculatedDictAttribute(featureAttributes, 'util_code', 'utilDescription', rosreestrClassifiers.utilDescription)
  addCalculatedDictAttribute(featureAttributes, 'statecd', 'state', rosreestrClassifiers.parcel_states)
}

function addCalculatedDictAttribute (featureAttributes, attrId, attrName, attrDictionary) {
  var attrValue = featureAttributes[attrId]
  var attrDisplayValue = attrDictionary[attrValue]

  if (attrDisplayValue) {
    featureAttributes[attrName] = `${attrDisplayValue}`
  }
}

function mapSteadAttributes (feature) {
  var attributes = []
  var featureAttributes = Object.assign({}, feature.attrs)

  addCalculatedAttributes(featureAttributes)

  for (var attr in featureAttributes) {
    if (attr in steadAliases) {
      var attribute = {
        originalName: attr,
        value: featureAttributes[attr],
        name: steadAliases[attr]
      }
      attributes.push(attribute)
    }
  }

  return attributes
}

function mapQuartalAttributes (feature) {
  var attributes = []
  for (var attr in feature.attrs) {
    if (attr in quartalAliases) {
      var attribute = {
        originalName: attr,
        value: feature.attrs[attr],
        name: quartalAliases[attr]
      }
      attributes.push(attribute)
    }
  }

  return attributes
}

function mapAttributes (feature, searchType) {
  switch (searchType) {
    case searchTypes.Quartal:
      return mapQuartalAttributes(feature)
    case searchTypes.Stead:
      return mapSteadAttributes(feature)
  }
}

function mapFeature (feature, searchType) {
  var center = feature.center
  var mapPoint = center ? new Point([center.x, center.y]) : null

  var featureName = feature.attrs['cn'] || ''
  var attributes = mapAttributes(feature, searchType)

  return {
    name: featureName,
    featureId: featureName,
    layerId: 'rosreestr',
    layerName: 'ПКК',
    attributes: attributes,
    geometry: mapPoint,
    crs: 'EPSG:3857',
    isShare: featureName !== '',
    description: feature.attrs['address']
  }
}

/**
 * Поиск объектов в Росреестре (по номеру участка или квартала).
 */
async function getFeatures (searchValue) {
  var searchType = getSearchType(searchValue)

  if (!searchType) {
    return []
  }

  var url = pkkUrls[searchType]
  var finalUrl = url + getNormalizedSearchString(searchValue)
  var response = {}
  // сначала пробуем запросить напрямую
  try {
    response = await axios.get(finalUrl)
  } catch (e) {
  }

  if (!response.data) {
    try {
      response = await axios.post('api/search-pkk', {
        url: finalUrl
      })

      if (!response.data) {
        return []
      }
    } catch (e) {
      return []
    }
  }
  if (!response.data.feature) {
    return []
  }

  return [mapFeature(response.data.feature, searchType)]
}

export default { getFeatures }
