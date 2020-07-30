export default ({ layers, layer, map }) => {
  const index = layers.indexOf(layer)
  map.removeLayer(layer.mapLayer)
  layers.splice(index, 1)
}
