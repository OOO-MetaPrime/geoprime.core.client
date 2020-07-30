import axios from 'axios'

function getDescribeLayerUrl (layer) {
  return layer.sourceUrl +
    '?service=WMS&version=1.1.1' +
    '&request=DescribeLayer' +
    '&layers=' + layer.layerName +
    '&output_format=application/json'
}

async function getLayerDescriptions (layer) {
  const url = getDescribeLayerUrl(layer)
  const config = {}
  if (layer.authorizationString) {
    config.headers = { 'Authorization': 'Basic ' + layer.authorizationString }
  }
  const { data: descriptions } = await axios.get(url, config)
  return descriptions.layerDescriptions
}

export default { getDescribeLayerUrl, getLayerDescriptions }
