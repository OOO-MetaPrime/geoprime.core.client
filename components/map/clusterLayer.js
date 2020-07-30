/* eslint-disable */
import ol from 'ol'
import VectorLayer from 'ol/layer/vector'
import VectorSource from 'ol/source/vector'
import ClusterSource from 'ol/source/cluster'
import Style from 'ol/style/style'
import Fill from 'ol/style/fill'
import Stroke from 'ol/style/stroke'
import convexHull from './convexHull.js'
import Circle from 'ol/style/circle'
import Text from 'ol/style/text'
import Select from 'ol/interaction/select'
import Point from 'ol/geom/point'
import MultiPoint from 'ol/geom/multipoint'
import Feature from 'ol/feature'
import Polygon from 'ol/geom/polygon'

const coverage = new VectorLayer({
  source: new VectorSource(),
  style: new Style({
    fill: new Fill({
      color: 'rgba(51, 136, 255, .2)'
    }),
    stroke: new Stroke({
      color: 'rgba(51, 136, 255, 1)',
      width: 3
    })
  })
})

function onSelect (e) {
  var feature = e.selected[0]

  if (feature) {
    if (!feature.get('features')) {
      // Не кластер.
      return
    }
    var h = feature.get('convexHull')

    if (!h) {
      var cluster = feature.get('features')
      if (cluster && cluster.length) {
        var c = []
        for (var i = 0, f; f = cluster[i]; i++) {
          const geometry = f.getGeometry()

          if (geometry instanceof Point) {
            c.push(geometry.getCoordinates())
          } else if (geometry instanceof MultiPoint) {
            c.push(geometry.getPoint(0).getCoordinates())
          }
        }
        h = convexHull(c)
        feature.get('convexHull', h)
      }
    }
    coverage.getSource().clear()
    if (h.length > 2) coverage.getSource().addFeature(new Feature(new Polygon([h])))
  } else {
    coverage.getSource().clear()
  }
}

// https://gis.stackexchange.com/questions/158435/how-to-get-current-scale-in-openlayers-3
function getResolutionForScale (scale, units) {
  var dpi = 25.4 / 0.28
  var mpu = ol.proj.METERS_PER_UNIT[units]
  var inchesPerMeter = 39.37
  return parseFloat(scale) / (mpu * inchesPerMeter * dpi)
}

class ClusterLayer extends VectorLayer {
  constructor (options) {
    const resolution = options.resolution ? getResolutionForScale(options.resolution, 'm') : undefined

    const clusterSource = new ClusterSource({
      distance: options.distance || 20,
      source: options.source,
      geometryFunction: feature => {
        const geometry = feature.getGeometry()

        if (geometry instanceof Point) {
          return geometry
        } else if (geometry instanceof MultiPoint) {
          return geometry.getPoint(0)
        }

        return null
      }
    })

    const styleCache = {}

    const defaultPointStyle = new Style({
      image: new Circle({
        fill: new Fill({
          color: 'rgba(51, 136, 255, 1)'
        }),
        radius: 5
      })
    })

    const pointStyle = options.style || defaultPointStyle

    const getStyle = (feature, viewResolution) => {
      if (resolution && viewResolution <= resolution) {
        return pointStyle instanceof Style ? pointStyle : (pointStyle(feature.get('features')[0], viewResolution) || defaultPointStyle)
      }

      var size = feature.get('features').length
      var style = styleCache[size]

      if (!style) {
        if (size > 1) {
          style = [
            new Style(
              {
                image: new Circle(
                  {
                    radius: 15,
                    fill: new Fill(
                      {
                        color: size < 10 ? 'rgba(110, 204, 57, 0.6)' : size < 100 ? 'rgba(240, 194, 12, 0.6)' : 'rgba(241, 128, 23, 0.6)'
                      })
                  }),
                text: new Text(
                  {
                    text: size.toString(),
                    fill: new Fill(
                      {
                        color: '#000'
                      }),
                    font: '12px "Helvetica Neue", Arial, Helvetica, sans-serif'
                  })
              }),
            new Style(
              {
                image: new Circle(
                  {
                    radius: 20,
                    fill: new Fill(
                      {
                        color: size < 10 ? 'rgba(181, 226, 140, 0.6)' : size < 100 ? 'rgba(241, 211, 87, 0.6)' : 'rgba(253, 156, 115, 0.6)'
                      })
                  })
              })
          ]
          styleCache[size] = style
        } else {
          style = pointStyle instanceof Style ? pointStyle : (pointStyle(feature.get('features')[0], viewResolution) || defaultPointStyle)
        }
      }
      return style
    }

    super({
      source: clusterSource,
      style: getStyle
    })

    const map = options.map
    const layers = map.getLayers()

    const onChangeResolution = event => {
      if (map.getView().getResolution() <= resolution) {
        this.setSource(options.source)
      } else {
        this.setSource(clusterSource)
      }
    }

    const select = new Select({
      condition: ol.events.condition.pointerMove,
      layers: [this],
      style: getStyle
    })

    const onAdd = event => {
      if (event.element !== this) {
        return
      }

      layers.un('add', onAdd)

      if (resolution) {
        map.getView().on('change:resolution', onChangeResolution)
      }

      if (options.coverage) {
        const isFirstLayer = layers.getArray().filter(x => x instanceof ClusterLayer).length === 1
        if (isFirstLayer) {
          coverage.setMap(map)
        }
        select.on('select', onSelect)
        map.addInteraction(select)
      }
    }

    layers.on('add', onAdd)

    const onRemove = event => {
      if (event.element !== this) {
        return
      }

      layers.un('remove', onRemove)

      if (options.resolution) {
        map.getView().un('change:resolution', onChangeResolution)
      }

      if (options.coverage) {
        const isLastLayer = layers.getArray().filter(x => x instanceof ClusterLayer).length === 0
        if (isLastLayer) {
          coverage.setMap(undefined)
        }
        select.un('select', onSelect)
        map.removeInteraction(select)
      }
    }

    layers.on('remove', onRemove)
  }
}

export default ClusterLayer
