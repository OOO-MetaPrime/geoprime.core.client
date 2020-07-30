import axios from 'axios'

async function getGeometryParams (entityType) {
  const { data: result } = await axios.get(`/api/map/entitytypes/${entityType}/geometry/params`)
  return result
}

// в случае успеха возвращается GeoJSON Feature collection
// в случае ошибки объект со свойством error, содержащем описание ошибки
async function importGeometryFromFile (payload) {
  const formData = new FormData()
  const { file, isChangeCoords } = payload
  formData.append('file', file)
  formData.append('data', JSON.stringify({ isChangeCoords }))

  const { data: result } = await axios.post(`/api/map/import-geometry-file`, formData)
  return result
}

export default { getGeometryParams, importGeometryFromFile }
