import axios from 'axios'
import downloadApi from '^/api/download'

/**
 * Импорт данных реестра из файл.
 * @param {*} registryId Идентификатор реестра.
 * @param {*} file Файл.
 */
async function importRegistryItems (registryId, file) {
  const formData = new FormData()
  formData.append('file_data', file)
  const { data: result } = await axios.post(`/api/xlsx/registry/import/${registryId}`, formData)
  return result
}

async function generateXlsxFile (data, columns, fileName) {
  downloadApi.downloadFileAxios(`/api/xlsx/generate`, { data, columns, fileName })
}

export default { importRegistryItems, generateXlsxFile }
