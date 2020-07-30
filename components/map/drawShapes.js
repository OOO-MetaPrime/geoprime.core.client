import axios from 'axios'
import MultiPoint from 'ol/geom/multipoint'
import MultiLineString from 'ol/geom/multilinestring'
import MultiPolygon from 'ol/geom/multipolygon'
import Feature from 'ol/feature'
import WKT from 'ol/format/wkt'

/**
 * Получить количество записей в истории.
 * @param {*} registryId Идентификатор реестра.
 * @param {*} recordId Идентификатор записи.
 */
async function getShapeCountHistory (registryId, recordId) {
  const { data: result } = await axios.get(`/api/registries/registry/geometry/getgeometrycount/${registryId}/${recordId}`)

  return result
}

const Modes = {
  DrawPoint: 'DrawPoint',
  DrawLine: 'DrawLine',
  DrawPolygon: 'DrawPolygon',
  DrawMultiPoint: 'DrawMultiPoint',
  DrawMultiLine: 'DrawMultiLine',
  DrawMultiPolygon: 'DrawMultiPolygon',
  EditShape: 'EditShape',
  RemoveShape: 'RemoveShape',
  LoadGeometry: 'LoadGeometry'
}

const ShapeTypes = {
  Point: 'Point',
  Line: 'LineString',
  Polygon: 'Polygon',
  MultiPoint: 'Point',
  MultiLine: 'LineString',
  MultiPolygon: 'Polygon'
}

const ShapeGeometryTypes = {
  Geometry: 'GEOMETRY',
  MultiPolygon: 'MULTIPOLYGON',
  Polygon: 'POLYGON',
  MultiPoint: 'MULTIPOINT',
  Point: 'POINT',
  Line: 'LINESTRING',
  MultiLine: 'MULTILINESTRING'
}

function getAllowedDrawModes () {
  var allowedDrawModes = { }
  allowedDrawModes[ShapeGeometryTypes.Geometry] = [ Modes.DrawPoint, Modes.DrawLine, Modes.DrawPolygon, Modes.DrawMultiPoint, Modes.DrawMultiLine, Modes.DrawMultiPolygon, Modes.EditShape, Modes.RemoveShape ]
  allowedDrawModes[ShapeGeometryTypes.Point] = [ Modes.DrawPoint, Modes.EditShape, Modes.RemoveShape ]
  allowedDrawModes[ShapeGeometryTypes.Line] = [ Modes.DrawLine, Modes.EditShape, Modes.RemoveShape ]
  allowedDrawModes[ShapeGeometryTypes.Polygon] = [ Modes.DrawPolygon, Modes.EditShape, Modes.RemoveShape ]
  allowedDrawModes[ShapeGeometryTypes.MultiPoint] = [ Modes.DrawMultiPoint, Modes.EditShape, Modes.RemoveShape ]
  allowedDrawModes[ShapeGeometryTypes.MultiLine] = [ Modes.DrawMultiLine, Modes.EditShape, Modes.RemoveShape ]
  allowedDrawModes[ShapeGeometryTypes.MultiPolygon] = [ Modes.DrawMultiPolygon, Modes.EditShape, Modes.RemoveShape ]

  return allowedDrawModes
}

class DrawMultiGeometry {
  constructor () {
    this.geometry = null
  }

  appendGeometry (geometry) {
  }

  appendGeometries (geometries) {
  }

  toWKTString () {
    return new WKT().writeGeometry(this.geometry)
  }

  getFeatures () {
    return []
  }

  getGeometry () {
    return this.geometry
  }

  static createMultiGeometry (geometry) {
    if (geometry instanceof MultiPolygon) {
      return new DrawMultiPolygonGeometry(geometry)
    } else if (geometry instanceof MultiPoint) {
      return new DrawMultiPointGeometry(geometry)
    } else if (geometry instanceof MultiLineString) {
      return new DrawMultiLineGeometry(geometry)
    }
    throw new Error('Unsupported multi geometry type')
  }
}

class DrawMultiLineGeometry extends DrawMultiGeometry {
  constructor (currentGeometry) {
    super()

    this.geometry = currentGeometry || new MultiLineString()
  }

  appendGeometry (geometry) {
    this.geometry.appendLineString(geometry)
  }

  appendGeometries (geometries) {
    for (let geometry of geometries) {
      this.geometry.appendLineString(geometry)
    }
  }

  getFeatures () {
    return this.geometry.getLineStrings().map(a => {
      return new Feature({
        name: new Date().getTime().toString(),
        geometry: a
      })
    })
  }
}

class DrawMultiPolygonGeometry extends DrawMultiGeometry {
  constructor (currentGeometry) {
    super()

    this.geometry = currentGeometry || new MultiPolygon()
  }

  appendGeometry (geometry) {
    this.geometry.appendPolygon(geometry)
  }

  appendGeometries (geometries) {
    for (let geometry of geometries) {
      this.geometry.appendPolygon(geometry)
    }
  }

  getGeometry () {
    return this.geometry
  }

  getFeatures () {
    return this.geometry.getPolygons().map(a => {
      return new Feature({
        name: new Date().getTime().toString(),
        geometry: a
      })
    })
  }
}

class DrawMultiPointGeometry extends DrawMultiGeometry {
  constructor (currentGeometry) {
    super()

    this.geometry = currentGeometry || new MultiPoint()
  }

  appendGeometry (geometry) {
    this.geometry.appendPoint(geometry)
  }

  appendGeometries (geometries) {
    for (let geometry of geometries) {
      this.geometry.appendPoint(geometry)
    }
  }

  getFeatures () {
    return this.geometry.getPoints().map(a => {
      return new Feature({
        name: new Date().getTime().toString(),
        geometry: a
      })
    })
  }
}

export {
  Modes,
  ShapeTypes,
  ShapeGeometryTypes,
  getAllowedDrawModes,
  DrawMultiGeometry,
  DrawMultiLineGeometry,
  DrawMultiPolygonGeometry,
  DrawMultiPointGeometry,
  getShapeCountHistory
}
