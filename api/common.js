import axios from 'axios'

async function getSettingsProfile () {
  const { data: result } = await axios.get('/api/me/profile')
  result.basemaps = await getBaseMaps()
  return result
}

async function getApplicationSettings () {
  const { data: result } = await axios.get('/api/settings')
  return result
}

async function getBaseMaps () {
  const { data: result } = await axios.get('/api/map/basemaps')
  return result
}

export default { getSettingsProfile, getApplicationSettings, getBaseMaps }
