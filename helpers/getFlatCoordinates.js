import GeometryType from 'ol/geom/geometrytype'
import downloadApi from '^/api/download'

export default card => {
  let coordinates

  switch (card.geometry.getType()) {
    case GeometryType.MULTI_POLYGON:
      coordinates = getCoordsPoligons(card.geometry)
      downloadApi.downloadFileAxios(`/api/csv/coords/export`, { name: card.name, coordinates })
      break
    case GeometryType.POLYGON:
      coordinates = getCoordsRings(card.geometry, [])
      downloadApi.downloadFileAxios(`/api/csv/coords/export`, { name: card.name, coordinates })
      break
    case GeometryType.POINT:
      coordinates = card.geometry.getCoordinates()
      downloadApi.downloadFileAxios(`/api/csv/coords/export`, { name: card.name, coordinates: [coordinates] })
      break
    default:
      break
  }
}

const getCoordsPoligons = poligons => {
  let coords = []
  poligons.getPolygons().forEach(el => {
    coords = getCoordsRings(el, coords)
  })
  return coords
}

const getCoordsRings = (poligon, result) => {
  for (let index = 0; index < poligon.getLinearRingCount(); index++) {
    result = result.concat(poligon.getLinearRing(index).getCoordinates())
    if (index === (poligon.getLinearRingCount() - 1)) {
      result.push([])
    }
  }
  return result
}
