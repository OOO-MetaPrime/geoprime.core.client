import axios from 'axios'
import { url } from '^/utils/url'
import downloadApi from '^/api/download'

const registryCache = {}

/**
 * Получить данные по реестру (колонки, название и т.п.).
 * @param {String} id Идентификатор реестра.
 */
async function getRegistry (id) {
  if (id in registryCache) {
    return registryCache[id]
  }
  const { data: result } = await axios.get(`/api/registries/registry/${id}`)
  return result
}

/**
 * данные по реестру по идентификатору слоя
 * @param {*} id
 */
async function getRegistryByLayerId (id) {
  const { data: result } = await axios.get(`/api/registries/registry/layer/${id}`)
  return result
}

/**
 * Получить все записи реестра.
 * @param {String} id Идентификатор реестра.
 */
async function getAllRegistryItems (id) {
  const { data: result } = await axios.get(`/api/registries/registry/allrecords/${id}`)
  return result
}

/**
 * Создать объект реестра.
 * @param {*} item Данные объект реестра.
 * @param {*} registryId Идентификатор реестра.
 */
async function createItem (item, registryId) {
  const { data: result } = await axios.post(`/api/registries/registry/item/${registryId}`, item)
  return result
}

/**
 * Изменить объект реестра.
 * @param {*} item Данные объект реестра.
 * @param {*} registryId Идентификатор реестра.
 */
async function editItem (item, registryId) {
  await axios.put(`/api/registries/registry/item/${registryId}`, item)
}

/**
 * Удалить файл записи реестра.
 * @param {*} item Данные объект реестра.
 * @param {*} registryId Идентификатор реестра.
 */
async function deleteFile (id) {
  await axios.delete(`/api/registries/registry/item/file/delete/${id}`)
}

/**
 * Получить список файлов для записи реестра.
 * @param {*} item Данные объект реестра.
 * @param {*} registryId Идентификатор реестра.
 */
async function getItemFiles (id, registryId) {
  const { data: result } = await axios.get(`/api/registries/registry/item/files/${registryId}/${id}`)
  return result
}

/**
 * Получить список поворотных точек для записи реестра.
 * @param {*} item Данные объект реестра.
 * @param {*} registryId Идентификатор реестра.
 */
async function getItemTurningPoints (id, registryId) {
  const { data: result } = await axios.get(`/api/registries/registry/item/turning-points/${registryId}/${id}`)
  return result
}

/**
 * Удалить запись реестра.
 * @param {*} id Идентификатор объекта реестра.
 * @param {*} registryId Идентификатор реестра.
 */
async function deleteItem (registryId, id) {
  await axios.delete(`/api/registries/registry/item/${registryId}/${id}`)
}

/**
 * Проврека связей запись реестра перед удалением.
 * @param {*} id Идентификатор объекта реестра.
 * @param {*} registryId Идентификатор реестра.
 */
async function checkItemBeforeDelete (registryId, id) {
  const { data: result } = await axios.get(`/api/registries/registry/item/data/${registryId}/${id}/deletecheck`)
  return result
}

/**
 * Получить слой реестра.
 * @param {*} registryId Идентификатор реестра.
 */
async function getLayer (registryId) {
  const { data: result } = await axios.get(`/api/registries/registry/${registryId}/layers`)
  return result
}

/**
 * Получить слои карточки ПД.
 * @param {*} cardId Идентификатор карточки.
 */
async function getCardLayers (cardId) {
  const { data: result } = await axios.get(`/api/registries/registry/layers/${cardId}`)
  return result
}

/**
 * Изменить гис идентификатор в записи.
 * @param {*} cardId Идентификатор карточки.
 */
async function changeGisId (registryId, recordId, gisId) {
  const { data: result } = await axios.get(`/api/registries/registry/${registryId}/${recordId}/${gisId}`)
  return result
}

/**
 * .
 * @param {*} cardId Идентификатор карточки.
 */
async function createGeometry (registryId, recordId, geometry, wkid = 3857) {
  const { data: result } = await axios.post(`/api/registries/registry/creategeometry/`, {
    registryId,
    recordId,
    geometry,
    wkid
  })
  return result
}

/**
 * Обновить геометрию.
 * @param {*} registryId Идентификатор реестра ПД.
 * @param {*} objectId Идентификаптор объекта.
 * @param {*} geometry Новая геометрия.
 */
async function editGeometry (registryId, objectId, geometry, recordId) {
  const { data: result } = await axios.post(`/api/registries/registry/editgeometry/`, {
    registryId,
    objectId,
    geometry,
    recordId
  })
  return result
}

/**
 * Удалить геометрию.
 * @param {*} registryId Идентификатор реестра ПД.
 * @param {*} objectId Идентификатор объекта.
 */
async function deleteGeometry (registryId, objectId, recordId) {
  const { data: result } = await axios.delete(`/api/registries/registry/deletegeometry/${registryId}/${objectId}/${recordId}`)
  return result
}

/**
 * Получить данные по объекту.
 * @param {*} registryId Идентификатор реестра Пд.
 * @param {*} recordId Идентификатор записи.
 */
async function getItem (registryId, recordId) {
  const { data: result } = await axios.get(`/api/registries/registry/item/data/${registryId}/${recordId}`)
  return result
}

async function getItemByCustomColumn (registryId, columnDescription) {
  const { data: result } = await axios.post(`/api/registries/registry/item/data/${registryId}`, columnDescription)
  return result
}

/**
 * Получить данные по объекту.
 * @param {*} registryId Идентификатор реестра Пд.
 * @param {*} recordId ГИС идентификатор.
 */
async function getItemByGisId (registryId, gisId) {
  const { data: result } = await axios.get(`/api/registries/registry/item/databygisid/${registryId}/${gisId}`)
  return result
}

function getFileUrl (registryId, recordId, fileId) {
  return url(`/api/registries/registry/item/files/${registryId}/${recordId}/${fileId}`)
}

function createFormData (payload, projection) {
  const formData = new FormData()
  if (payload.newFiles) {
    payload.newFiles.forEach(x => {
      formData.append('file', x)
    })
  }
  if (projection) {
    formData.append('projection', projection)
  }
  formData.append('data', JSON.stringify(payload))
  return formData
}

async function update (registryId, payload, projection) {
  const { data } = await axios.put(`/api/registries/registry/item/${registryId}`, createFormData(payload, projection))
  return data
}

async function create (registryId, payload, projection) {
  const { data } = await axios.post(`/api/registries/registry/item/${registryId}`, createFormData(payload, projection))
  return data
}

async function download (registryid, recordId, id) {
  const exportDataUrl = await getFileUrl(registryid, recordId, id)
  downloadApi.downloadFile(exportDataUrl, 'download', true, 'GET')
}

export default {
  createItem,
  getRegistry,
  editItem,
  getItemFiles,
  getItemTurningPoints,
  deleteFile,
  deleteItem,
  checkItemBeforeDelete,
  getLayer,
  getCardLayers,
  changeGisId,
  createGeometry,
  editGeometry,
  deleteGeometry,
  getItem,
  getItemByGisId,
  getAllRegistryItems,
  getFileUrl,
  create,
  update,
  download,
  getRegistryByLayerId,
  getItemByCustomColumn
}
