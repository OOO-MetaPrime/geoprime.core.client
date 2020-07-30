import axios from 'axios'
import _cloneDeep from 'lodash/cloneDeep'
import objectSearch from './objectSearch.js'
import geocoderSearch from './geocoderSearch.js'

/**
 * Поиск объектов в адресном реестре и с помощью геокодера OpenStreetMap (результаты объединяются).
 */
async function getFeatures (searchValue, searchOptions) {
  try {
    const features = await Promise.all([
      getAddressRegistryFeatures(searchValue, searchOptions),
      geocoderSearch.getFeatures(null, searchValue, searchOptions)
    ])

    return features.reduce((prevValue, currValue) => prevValue.concat(currValue))
  } catch (e) {
    return []
  }
}

async function getAddressRegistryFeatures (searchValue, searchOptions) {
  try {
    const { data: gisIdList } = await axios.get('/api/address-registry/search/' + searchValue)
    if (!gisIdList || gisIdList.length === 0) {
      return []
    }

    const { data: layer } = await axios.get('/api/address-registry/thematicsearch/' + searchOptions.thematicSearch.id + '/layer')

    const addressSearchOptions = _cloneDeep(searchOptions)
    addressSearchOptions.attribute = layer.attribute
    addressSearchOptions.isNotCaseSensetive = false
    addressSearchOptions.isPartiallyMatch = false
    addressSearchOptions.thematicSearch.layers = [ {
      layer,
      attribute: layer.attribute
    } ]

    return objectSearch.getFeatures([layer], gisIdList, addressSearchOptions)
  } catch (e) {
    console.warn(`Ошибка получения объектов адресного реестра`)
    return []
  }
}

export default { getFeatures }
