import axios from 'axios'

/**
 * Получить данные классификатора Субъекты ГД.
 */
async function getUrbanPlanningObjects () {
  const { data: result } = await axios.get(`/api/urbanplanningobjects`)
  return result
}
export default {
  getUrbanPlanningObjects
}
