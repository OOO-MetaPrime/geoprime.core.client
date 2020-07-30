import axios from 'axios'

async function getEnums () {
  const { data: result } = await axios.get(`/api/classifiers/enums`)
  return result
}

export default { getEnums }
