import objectSearch from './objectSearch.js'
/**
 * Поиск объектов по тематическому поиску.
 */
async function getFeatures (searchValue, searchOptions) {
  return objectSearch.getFeatures(searchOptions.thematicSearch.layers.map(layer => layer.layer), searchValue, searchOptions)
}

export default { getFeatures }
