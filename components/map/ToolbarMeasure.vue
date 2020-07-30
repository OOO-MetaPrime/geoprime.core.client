<template>
  <div class="hidden-xs">
    <button type="button"
      class="btn btn-default btn-icon hidden-xs"
      @click="click(1)"
      :class="toggleButtonClass(currentMode === 1)"
      title="Измерение расстояния"
    >
      <i class="icon_ruler"></i>
    </button>
    <button type="button"
      class="btn btn-default btn-icon hidden-xs"
      @click="click(2)"
      :class="toggleButtonClass(currentMode === 2)"
      title="Измерение площади"
    >
      <i class="icon_area"></i>
    </button>
  </div>
</template>

<script>
import Sphere from 'ol/sphere'
import SourceVector from 'ol/source/vector'
import LayerVector from 'ol/layer/vector'
import Style from 'ol/style/style'
import Stroke from 'ol/style/stroke'
import Fill from 'ol/style/fill'
import Overlay from 'ol/overlay'
import Draw from 'ol/interaction/draw'
import Condition from 'ol/events/condition'
import Polygon from 'ol/geom/polygon'
import LineString from 'ol/geom/linestring'
import proj from 'ol/proj'
import Observable from 'ol/observable'
import componentsMixin from '^/mixins/components'

const useGeodesic = true

/**
 * Выбранный режим рисования.
*/
let selectedDrawingMode = ''

/**
  * Слой рисования.
  */
let draw

let wgs84Sphere = new Sphere(6378137)

/**
  * Нарисованная графика.
  * @type {ol.layer.Vector}
  */
let source = new SourceVector()

/**
  * Слой для отображения нарисованной графики.
  * @type {ol.layer.Vector}
  */
let vector

/**
  * Element подсказки с результатами измерения.
  * @type {Element}
  */
let measureTooltipElement

/**
  * Overlay, импользуемый для отображения результатов измерения.
  * @type {ol.Overlay}
  */
let measureTooltip

let sectionLengthTooltips = []

let length = null
let sectionLength = 0
let previousLength = null
let coords
let lastCoord = null

let component

/**
  * Форматирование результата измерения длины.
  * @param {ol.geom.LineString} line Нарисованная линия.
  * @return {string} Форматированное значение длины.
  */
var formatLength = function (line, map) {
  var length

  if (useGeodesic) {
    var coordinates = line.getCoordinates()

    length = 0

    var sourceProj = map.getView().getProjection()

    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      var c1 = proj.transform(coordinates[i], sourceProj, 'EPSG:4326')
      var c2 = proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326')
      length += wgs84Sphere.haversineDistance(c1, c2)
    }
  } else {
    length = Math.round(line.getLength() * 100) / 100
  }

  const output = length * 100 / 100

  return output
}

/**
  * Форматирование результата измерения площади.
  * @param {ol.geom.Polygon} polygon Нарисованный полигон.
  * @return {string} Форматированное значение площади.
  */
var formatArea = function (polygon, map) {
  var area

  if (useGeodesic) {
    var sourceProj = map.getView().getProjection()
    var geom = /** @type {ol.geom.Polygon} */(polygon.clone().transform(
      sourceProj, 'EPSG:4326'))
    var coordinates = geom.getLinearRing(0).getCoordinates()
    area = Math.abs(wgs84Sphere.geodesicArea(coordinates))
  } else {
    area = polygon.getArea()
  }

  const output = area * 100 / 100

  return output
}

/** @type {ol.geom.GeometryType} */
function getGeometryType () {
  var mode = selectedDrawingMode

  switch (mode) {
    case 'area':
      return 'Polygon'
    case 'length':
      return 'LineString'
    default:
      throw new Error('Неизвестный режим измерения.')
  }
}

var sectionListener

let currentScale

function setSectionLength (evt, map, vector) {
  if (!lastCoord && !coords) {
    lastCoord = arguments[2].coordinate
  }
  if (length && sectionLength !== 0 && coords && lastCoord) {
    const slope = ((lastCoord[1] - coords[1]) / (lastCoord[0] - coords[0]))
    const angle = Math.atan(slope)
    const deg = angle * 180 / Math.PI
    sectionLength = (parseFloat(length) - parseFloat(previousLength)).toFixed(2)
    previousLength = length
    createSectionLengthTooltip(map, sectionLength, [lastCoord[0] + (coords[0] - lastCoord[0]) / 2, lastCoord[1] + (coords[1] - lastCoord[1]) / 2], deg)
  } else if (length && sectionLength === 0 && coords && lastCoord) {
    sectionLength = length
    previousLength = sectionLength
    const slope = ((lastCoord[1] - coords[1]) / (lastCoord[0] - coords[0]))
    const angle = Math.atan(slope)
    const deg = angle * 180 / Math.PI
    createSectionLengthTooltip(map, sectionLength, [lastCoord[0] + (coords[0] - lastCoord[0]) / 2, lastCoord[1] + (coords[1] - lastCoord[1]) / 2], deg)
  }
  if (coords) {
    lastCoord = coords
  }
}

function clearSectionLength (map) {
  map.un('click', sectionListener)
  sectionLengthTooltips.forEach(x => map.removeOverlay(x))
  sectionLengthTooltips = []
  length = null
  sectionLength = 0
  previousLength = null
  lastCoord = null
  coords = null
}

const stroke = {
  color: '#767676',
  width: 2
}

function addInteraction (map) {
  if (!vector) {
    vector = new LayerVector({
      source: source,
      style: new Style({
        stroke: new Stroke(stroke),

        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        })
      })
    })
  }

  map.addLayer(vector)

  draw = new Draw({
    source: source,
    type: getGeometryType(),
    style: new Style({
      stroke: new Stroke(stroke),

      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      })
    }),
    freehandCondition: Condition.altKeyOnly
  })

  map.addInteraction(draw)

  createMeasureTooltip(map)

  var listener

  draw.on('drawstart',
    function (evt) {
      // Разрешается только одно измерение.
      clearSectionLength(map)
      source.clear()
      /** @type {ol.Coordinate|undefined} */
      var tooltipCoord = evt.coordinate
      sectionListener = setSectionLength.bind(this, evt, map)
      map.on('click', sectionListener)
      listener = evt.feature.getGeometry().on('change', function (evt) {
        var geom = evt.target
        var output
        if (geom instanceof Polygon) {
          map.un('click', sectionListener)
          output = formatArea(geom, map)
          tooltipCoord = geom.getInteriorPoint().getCoordinates()
          const element = document.getElementById('measure-value-input')

          if (!element) {
            return
          }

          element.setAttribute('originalMeasureValue', output)
          component.$emit('changeMeasureValueArea')
        } else if (geom instanceof LineString) {
          output = formatLength(geom, map)
          length = output
          tooltipCoord = geom.getLastCoordinate()
          coords = tooltipCoord

          const element = document.getElementById('measure-value-input')

          if (!element) {
            return
          }

          element.setAttribute('originalMeasureValue', output)
          component.$emit('changeMeasureValue')
        }
      })
    }, this)

  draw.on('drawend',
    function () {
      coords = null
      lastCoord = null
      Observable.unByKey(listener)
      map.un('click', sectionListener)
    }, this)
}

function createSectionLengthTooltip (map, length, coords, deg) {
  const newDeg = deg < 0 ? Math.abs(deg) : -deg
  const sectionLengthTooltipElement = document.createElement('div')
  const sectionLengthTooltip = new Overlay({
    element: sectionLengthTooltipElement,
    positioning: 'bottom-center'
  })

  length = parseFloat(length)

  sectionLengthTooltipElement.setAttribute('originalMeasureValue', length)

  if (currentScale <= 25000) {
    sectionLengthTooltipElement.setAttribute('measure-unit', 'm')
    length = length.toFixed(2)
  }

  if (currentScale > 25000 && currentScale <= 1000000) {
    sectionLengthTooltipElement.setAttribute('measure-unit', 'km')
    length = (length / 1000).toFixed(2)
  }

  if (currentScale > 1000000) {
    sectionLengthTooltipElement.setAttribute('measure-unit', 'kkm')
    length = (length / 1000000).toFixed(2)
  }

  sectionLengthTooltipElement.innerHTML = length

  sectionLengthTooltip.setPosition(coords)
  sectionLengthTooltips.push(sectionLengthTooltip)
  sectionLengthTooltipElement.classList.add('custom-measure-overlay')
  sectionLengthTooltipElement.style.cssText = 'color: black; background: white'
  sectionLengthTooltipElement.style.transform = `rotate(${newDeg}deg)`
  map.addOverlay(sectionLengthTooltip)
}

var removeInteraction = function (map) {
  map.removeLayer(vector)
  map.removeInteraction(draw)
  map.removeOverlay(measureTooltip)
  clearSectionLength(map)
  source.clear()
}

var createMeasureTooltip = function (map) {
  measureTooltipElement = document.createElement('div')
  measureTooltip = new Overlay({
    element: measureTooltipElement,
    positioning: 'bottom-center'
  })

  map.addOverlay(measureTooltip)
}

function activateDrawing (mode, map) {
  selectedDrawingMode = mode
  addInteraction(map)
}

export default {
  props: ['map', 'mapCurrentScale'],
  data () {
    return {
      currentMode: 0
    }
  },
  mixins: [componentsMixin],
  watch: {
    mapCurrentScale (newValue) {
      if (newValue) {
        currentScale = newValue
        if (this.currentMode === 1) {
          this.changeSectionLengthTooltipElementValue(newValue)
        }

        if (this.currentMode === 2) {
          this.$emit('changeMeasureValueArea')
        }
      }
    }
  },
  mounted () {
    component = this
  },
  methods: {
    changeSectionLengthTooltipElementValue () {
      let newMeasureUnit

      if (currentScale <= 25000) {
        newMeasureUnit = 'm'
      }

      if (currentScale > 25000 && currentScale <= 1000000) {
        newMeasureUnit = 'km'
      }

      if (currentScale > 1000000) {
        newMeasureUnit = 'kkm'
      }

      const elements = document.getElementsByClassName('custom-measure-overlay')

      if (!elements.length) {
        return
      }

      const oldMeasureUnit = elements[0].getAttribute('measure-unit')

      if (oldMeasureUnit === newMeasureUnit) {
        return
      }

      this.$emit('changeMeasureValue')

      for (const x of elements) {
        const originalMeasureValue = parseFloat(x.getAttribute('originalMeasureValue'))

        if (newMeasureUnit === 'm') {
          x.setAttribute('measure-unit', 'm')
          x.innerHTML = originalMeasureValue.toFixed(2)
        }

        if (newMeasureUnit === 'km') {
          x.setAttribute('measure-unit', 'km')
          x.innerHTML = (originalMeasureValue / 1000).toFixed(2)
        }

        if (newMeasureUnit === 'kkm') {
          x.setAttribute('measure-unit', 'kkm')
          x.innerHTML = (originalMeasureValue / 1000000).toFixed(2)
        }
      }
    },
    changeMode (newMode) {
      if (this.currentMode === newMode) {
        this.currentMode = 0
      } else {
        this.currentMode = newMode
      }

      removeInteraction(this.map)

      switch (this.currentMode) {
        case 1:
          activateDrawing('length', this.map)
          this.$emit('measureStart', 'length')
          break
        case 2:
          activateDrawing('area', this.map)
          this.$emit('measureStart', 'area')
          break
      }
    },
    click (mode) {
      const previousMode = this.currentMode

      this.changeMode(mode)

      if (this.currentMode) {
        if (previousMode === 0) {
          this.$emit('click', true)
        }
      } else {
        this.$emit('click', false)
      }
    },
    deactivate () {
      this.changeMode(0)
    }
  }
}
</script>

<style lang="stylus" scoped>
.buttons {
  display: flex;
  flex-direction: column;
}

.map-button {
  text-transform: none;
  margin-bottom: 4px;
}
.measure-button {
  width: 36px;
  height: 36px;
  font-size: 16px;
  padding: 4px 11px;
}
.measure-button + .measure-button {
  margin-left: -3px;
}
</style>