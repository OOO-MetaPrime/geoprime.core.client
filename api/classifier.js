import axios from 'axios'

/**
 * Получить данные классификатора.
 * @param {Object} relatinship Отношение.
 */
async function getClassifier (options) {
  // tableName, keyColumn, displayColumn, isLicences, isTimeRestricted, filterClassifiersField, selectingOrganizationId
  // TODO: мемоизация
  const nonEmptyOptions = Object.keys(options)
  const optionsString = nonEmptyOptions.filter(x => options[x] != null).map(x => `${x}=${options[x]}`).join('&')
  const { data: result } = await axios.get(`/api/classifiers/classifier?${optionsString}`)
  return result
}

/**
 * Получить данные для классификатора таблицы.
 */
async function getClassifierColumns (tableName, keyColumn, displayColumn) {
  const { data: result } = await axios.get(`/api/classifiers/columns/${tableName}/${keyColumn}/${displayColumn}`)
  return result
}

async function getRealPropertyTypes () {
  const { data: result } = await axios.get(`/api/classifiers/real-property-types`)
  return result
}

async function getEventTypes () {
  const { data: result } = await axios.get(`/api/classifiers/event-types`)
  return result
}

async function getEventAccessLevels () {
  const { data: result } = await axios.get(`/api/classifiers/event-access-levels`)
  return result
}
// Список систем координат
async function getCoordinateProjectionList () {
  const { data: result } = await axios.get('/api/classifiers/coordinatesprojectionlist')
  return result
}

export default { getClassifier, getClassifierColumns, getRealPropertyTypes, getEventTypes, getEventAccessLevels, getCoordinateProjectionList }
