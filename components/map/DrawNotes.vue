<template>
<div class="wrapper">
    <div class="color-picker-wrapper">
      <chrome-picker v-if="currentDrawType === 'changeFillColor'" class="color-picker" v-model="backgroundColor"/>
      <chrome-picker v-if="currentDrawType === 'changeBorderColor'" class="color-picker" v-model="borderColor"/>
    </div>
  <div class="draw-notes-container">
    <div class="form-group" v-if="currentDrawType === 'text' || (editingFeature && editingFeature[0].get('featureType') === 'text')">
      <input type="text" class="form-control text-input" placeholder="Введите текст" v-model="text">
      <input type="number" class="form-control font-size-input" v-model="fontSize">
      <button type="button" class="btn btn-icon btn-default italic-btn" :class="{'btn-primary': textItalic === true}" @click="setItalicFont" title="Курсив">
        <i class="icon_italic"></i>
      </button>
      <button type="button" class="btn btn-icon btn-default bold-btn" :class="{'btn-primary': textBold === true}" @click="setBoldFont" title="Жирный">
        <i class="icon_bold"></i>
      </button>
    </div>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'changeFillColor'}"
      class="btn btn-icon btn-default"
      @click="changeFillColor('changeFillColor')"
      title="Цвет заливки"
      :disabled="isDisabled"
    >
      <i class="icon_paint_format"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'changeBorderColor'}"
      @click="changeBorderColor('changeBorderColor')"
      class="btn btn-icon btn-default"
      title="Цвет границы"
      :disabled="isDisabled"
    >
      <i class="icon_pencil"></i>
    </button>
    <button
      type="button"
      class="btn btn-icon btn-default selected-color"
      title="Выбранные цвета"
      :style="{'background-color': backgroundRgba, 'border-color': borderRgba}"
      :disabled="isDisabled"
    >
    </button>
    <input
      type="number"
      title="Толщина линии"
      class="line-strong"
      v-model="lineWidth"
      :disabled="isDisabled"
    >
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'point'}"
      @click="drawNotes('point')"
      class="btn btn-icon btn-default"
      title="Точка"
      :disabled="isDisabled"
    >
      <i class="icon_circle_small"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'line'}"
      @click="drawNotes('line')"
      class="btn btn-icon btn-default"
      title="Линия"
      :disabled="isDisabled"
    >
      <i class="icon_vector2"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'polygon'}"
      @click="drawNotes('polygon')"
      class="btn btn-icon btn-default"
      title="Полигон"
      :disabled="isDisabled"
    >
      <i class="icon_vector"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'box'}"
      @click="drawNotes('box')"
      class="btn btn-icon btn-default"
      title="Прямоугольник"
      :disabled="isDisabled"
    >
      <i class="icon_square"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'triangle'}"
      @click="drawNotes('triangle')"
      class="btn btn-icon btn-default"
      title="Треугольник"
      :disabled="isDisabled"
    >
      <i class="icon_triangle"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'circle'}"
      @click="drawNotes('circle')"
      class="btn btn-icon btn-default"
      title="Круг"
      :disabled="isDisabled"
    >
      <i class="icon_circle"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'ellipse'}"
      @click="drawNotes('ellipse')"
      class="btn btn-icon btn-default"
      title="Овал"
      :disabled="isDisabled"
    >
      <i class="icon_round_empty"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'arrow'}"
      @click="drawNotes('arrow')"
      class="btn btn-icon btn-default"
      title="Стрелка"
      :disabled="isDisabled"
    >
      <i class="icon_arrow_forward"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'text'}"
      class="btn btn-icon btn-default"
      @click="drawNotes('text')"
      title="Текст"
      :disabled="isDisabled"
    >
      <i class="icon_typography"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'edit'}"
      @click="startEdit"
      class="btn btn-icon btn-default"
      title="Редактировать"
      :disabled="isDisabled"
    >
      <i class="icon_pencil2"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'delete'}"
      @click="startSelection"
      class="btn btn-icon btn-default"
      title="Удалить"
      :disabled="isDisabled"
    >
      <i class="icon_bin"></i>
    </button>
    <button
      type="button"
      :class="{'btn-primary': currentDrawType === 'clear'}"
      @click="clear"
      class="btn btn-icon btn-default"
      title="Очистить"
      :disabled="isDisabled"
    >
      <i class="icon_eraser"></i>
    </button>
  </div>
</div>
</template>

<script>
import VectorLayer from 'ol/layer/vector'
import VectorSource from 'ol/source/vector'
import Draw from 'ol/interaction/draw'
import Polygon from 'ol/geom/polygon'
import Circle from 'ol/geom/circle'
import condition from 'ol/events/condition'
import extent from 'ol/extent'
import Fill from 'ol/style/fill'
import Style from 'ol/style/style'
import StyleText from 'ol/style/text'
import StyleCircle from 'ol/style/circle'
import StyleStroke from 'ol/style/stroke'
import Select from 'ol/interaction/select'
import Transform from 'ol-ext/interaction/Transform'
import { Chrome } from 'vue-color'

export default {
  props: {
    map: Object,
    isActive: Boolean
  },
  components: {
    'chrome-picker': Chrome
  },
  data () {
    return {
      currentDrawType: null,
      savedCurrentDrawType: null,
      vector: null,
      source: null,
      draw: null,
      modify: null,
      selection: null,
      editingFeature: null,
      lineWidth: 3,
      text: '',
      textItalic: false,
      textBold: false,
      fontSize: 15,
      isDisabled: false,
      backgroundColor: {
        hex: '#000000',
        rgba: {
          r: 0,
          g: 0,
          b: 0,
          a: 0.5
        },
        a: 0.5
      },
      borderColor: {
        hex: '#000000',
        rgba: {
          r: 0,
          g: 0,
          b: 0,
          a: 0.5
        },
        a: 0.5
      }
    }
  },
  watch: {
    isActive () {
      if (!this.isActive) {
        this.deactivate()
      }
    },
    textItalic () {
      if (this.isTextEditingFeature) {
        this.editingFeature[0].set('featureItalic', this.textItalic)
        this.refreshEditingFeatureStyle()
      }
    },
    textBold () {
      if (this.isTextEditingFeature) {
        this.editingFeature[0].set('featureBold', this.textBold)
        this.refreshEditingFeatureStyle()
      }
    },
    fontSize () {
      if (this.isTextEditingFeature) {
        this.editingFeature[0].set('featureFontSize', this.fontSize)
        this.refreshEditingFeatureStyle()
      }
    },
    text () {
      if (this.isTextEditingFeature && this.text) {
        this.editingFeature[0].set('featureText', this.text)
        this.refreshEditingFeatureStyle()
      }
    },
    backgroundColor () {
      this.refreshEditingFeatureStyle()
    },
    borderColor () {
      this.refreshEditingFeatureStyle()
    },
    lineWidth () {
      this.refreshEditingFeatureStyle()
    }
  },
  computed: {
    backgroundRgba () {
      return `rgba(${this.backgroundColor.rgba.r}, ${this.backgroundColor.rgba.g}, ${this.backgroundColor.rgba.b}, ${this.backgroundColor.rgba.a})`
    },
    borderRgba () {
      return `rgba(${this.borderColor.rgba.r}, ${this.borderColor.rgba.g}, ${this.borderColor.rgba.b}, ${this.borderColor.rgba.a})`
    },
    isTextEditingFeature () {
      return this.editingFeature && this.editingFeature[0].get('featureType') === 'text'
    }
  },
  methods: {
    disableLowerTools (disabledObj) {
      this.isDisabled = disabledObj.block
      if (disabledObj.disabled) {
        this.deactivate()
      }
    },
    setItalicFont () {
      this.textItalic = !this.textItalic
    },
    setBoldFont () {
      this.textBold = !this.textBold
    },
    refreshEditingFeatureStyle () {
      if (this.editingFeature) {
        this.editingFeature[0].setStyle(this.getStyle(this.editingFeature[0].get('featureType')))
      }
    },
    changeFillColor (type) {
      if (this.currentDrawType === type) {
        this.deactivate()
        return
      }
      this.currentDrawType = 'changeFillColor'
      this.$emit('deactivateDrawTools')
    },
    changeBorderColor (type) {
      if (this.currentDrawType === type) {
        this.deactivate()
        return
      }
      this.currentDrawType = 'changeBorderColor'
      this.$emit('deactivateDrawTools')
    },
    getColorArray (color) {
      const { r, g, b, a } = color.rgba
      return [r, g, b, a]
    },
    getStyle (type) {
      let styleParams
      const width = this.lineWidth
      const pointWidth = 3
      const backgroundColor = this.getColorArray(this.backgroundColor)
      const borderColor = this.getColorArray(this.borderColor)
      const fill = new Fill({
        color: backgroundColor
      })
      switch (type) {
        case 'text':
          styleParams = {
            text: new StyleText({
              text: this.text,
              font: `${this.textItalic ? 'italic ' : ''}${this.textBold ? 'bold ' : ''} ${this.fontSize}px Roboto,Noto Sans,Noto,sans-serif`,
              fill
            })
          }
          break
        case 'point':
          styleParams = {
            image: new StyleCircle({
              radius: pointWidth * 2,
              fill,
              stroke: new StyleStroke({
                color: borderColor,
                width: width / 2
              })
            })
          }
          break
        default:
          styleParams = {
            stroke: new StyleStroke({
              color: borderColor,
              width
            }),
            fill
          }
      }
      const style = new Style(styleParams)
      return style
    },
    drawNotes (type) {
      if (this.currentDrawType === type) {
        this.deactivate()
        return
      }
      this.deactivate()
      this.currentDrawType = type
      if (!this.source) {
        this.source = new VectorSource()
      }
      if (!this.vector) {
        this.vector = new VectorLayer({
          source: this.source,
          map: this.map
        })
        this.vector.setZIndex(1)
      }
      this.draw = new Draw({
        source: this.source,
        type: this.getDrawType(type),
        freehandCondition: condition.altKeyOnly,
        geometryFunction: this.getGeometryFunction(type)
      })
      this.draw.on('drawstart', event => {
        const style = this.getStyle(type)
        event.feature.setStyle(style)
        event.feature.set('featureType', type)
        event.feature.set('featureText', this.text)
        event.feature.set('featureItalic', this.textItalic)
        event.feature.set('featureBold', this.textBold)
        event.feature.set('featureFontSize', this.fontSize)
        event.feature.set('featureStyle', style)
      })
      this.map.addInteraction(this.draw)

      this.$emit('disableDefaultTools', true)
      this.$emit('deactivateDrawTools')
      this.$emit('deactivateToolbar', true)
    },
    deactivate () {
      this.map.removeInteraction(this.draw)
      if (this.modify) {
        this.map.removeInteraction(this.modify)
      }
      if (this.selection) {
        this.map.removeInteraction(this.selection)
      }
      this.draw = null
      this.modify = null
      this.selection = null
      this.currentDrawType = null
      this.editingFeature = null
      this.$emit('disableDefaultTools', false)
    },
    startEdit () {
      if (!this.source) {
        return
      }
      if (this.currentDrawType === 'edit') {
        this.deactivate()
        return
      }
      this.deactivate()
      this.currentDrawType = 'edit'
      this.modify = new Transform({
        features: this.source.getFeatures()
      })
      this.map.addInteraction(this.modify)
      this.modify.on('select', function (e) {
        if (e.feature && e.feature.length) {
          this.editingFeature = e.feature
          this.text = e.feature[0].get('featureText')
          this.textItalic = e.feature[0].get('featureItalic')
          this.textBold = e.feature[0].get('featureBold')
          this.fontSize = e.feature[0].get('featureFontSize')
        } else {
          this.editingFeature = null
        }
      }.bind(this))
      this.$emit('deactivateDrawTools')
    },
    getDrawType (type) {
      switch (type) {
        case 'point':
          return 'Point'
        case 'line':
          return 'LineString'
        case 'polygon':
          return 'Polygon'
        case 'text':
          return 'Point'
        case 'circle':
          return 'Circle'
        default: return 'Circle'
      }
    },
    getGeometryFunction (type) {
      switch (type) {
        case 'box':
          // return ol.interaction.Draw.createRegularPolygon(4)
          return Draw.createBox()
        case 'triangle':
          return Draw.createRegularPolygon(3)
        case 'ellipse':
          return function (coordinates, geometry) {
            if (!geometry) {
              geometry = new Polygon()
            }

            const [start, end] = coordinates
            const [startX, startY] = start
            const [endX, endY] = end

            // Вписываем окружность в прямоугольник,
            // определяемый точками start, end.
            const centerX = (startX + endX) / 2
            const centerY = (startY + endY) / 2

            const radiusX = Math.abs(centerX - startX)
            const radiusY = Math.abs(centerY - startY)
            const center = [centerX, centerY]

            const circle = new Circle(center, radiusX)
            const polygon = Polygon.fromCircle(circle, 64)

            polygon.scale(1, radiusY / radiusX)

            geometry.setCoordinates(polygon.getCoordinates())

            return geometry
          }
        case 'arrow':
          return function (coordinates, geometry) {
            if (!geometry) {
              geometry = new Polygon(null)
            }
            const centerX = coordinates[0][0]
            const lastX = coordinates[1][0]

            // Прямоугольник в который вписана стрелка
            const ext = extent.boundingExtent(coordinates)

            const extentHeight = extent.getHeight(ext)
            const extentWidth = extent.getWidth(ext)
            const extentBottomRight = extent.getBottomRight(ext)
            const extentTopRight = extent.getTopRight(ext)
            const extentMinY = extentBottomRight[1]
            const extentMaxY = extentTopRight[1]

            // При нормальных условиях вычисляем размер стрелки по высоте экстента, но
            // чтобы стрелка не выходила за границы экстента, при высоте экстента больше ширины вычисляем размер стрелки по ширине
            const triangleRadius = extentHeight < extentWidth ? extentHeight : extentWidth
            const trianglePowRadius = triangleRadius ** 2
            // Находим высоту стрелки по теореме пифагора
            const triangleHeight = Math.sqrt(trianglePowRadius - trianglePowRadius / 4)

            // Координаты по x для правых точек прямоугольникака и верхних, нижних точек треугольника
            const triangleBottomX = lastX - centerX >= 0 ? lastX - triangleHeight : lastX + triangleHeight

            // Координаты точек стрелки
            const triangleCenter = [lastX, extentMinY + extentHeight / 2]
            const triangleBottom = [triangleBottomX, extentMinY]
            const boxBottomRight = [triangleBottomX, extentMinY + extentHeight / 3]
            const boxBottomLeft = [centerX, extentMinY + extentHeight / 3]
            const boxTopLeft = [centerX, extentMaxY - extentHeight / 3]
            const boxTopRight = [triangleBottomX, extentMaxY - extentHeight / 3]
            const triangleTop = [triangleBottomX, extentMaxY]

            geometry.setCoordinates([[
              triangleCenter,
              triangleBottom,
              boxBottomRight,
              boxBottomLeft,
              boxTopLeft,
              boxTopRight,
              triangleTop,
              triangleCenter
            ]])
            return geometry
          }
      }
    },
    startSelection () {
      if (!this.source) {
        return
      }
      if (this.currentDrawType === 'delete') {
        this.deactivate()
        return
      }
      this.deactivate()
      this.currentDrawType = 'delete'
      this.selection = new Select({
        condition: condition.click,
        layers: [this.vector]
      })
      this.map.addInteraction(this.selection)
      this.selection.on('select', function (e) {
        if (e.selected && e.selected.length > 0) {
          this.source.removeFeature(e.selected[0])
          this.selection.getFeatures().remove(e.selected[0])
        }
      }.bind(this))
      this.$emit('deactivateDrawTools')
    },
    async clear () {
      this.currentDrawType = 'clear'
      if (await this._confirm('Вы действительно хотите удалить все заметки?')) {
        this.removeDrawNotes()
        this.$emit('deactivateDrawTools')
      } else {
        this.$emit('deactivateDrawTools')
        return
      }
    },
    resetDrawNotes () {
      this.deactivate()
    },
    removeDrawNotes () {
      if (this.draw) {
        this.map.removeInteraction(this.draw)
        this.draw = null
      }
      if (this.modify) {
        this.map.removeInteraction(this.modify)
        this.modify = null
      }
      if (this.source) {
        this.source.clear()
        this.source = null
      }
      if (this.vector) {
        this.vector.setMap(null)
        this.vector = null
      }
      this.currentDrawType = null
    }
  }
}
</script>

<style lang="stylus" scoped>
.wrapper
  z-index 2
.color-picker-wrapper
  z-index 1
  margin-left 5px
  margin-bottom 5px
.draw-notes-container
  background-color #ffff
  margin 5px
  margin-top 0
  padding 5px
  bottom 0
  z-index 2
.line-strong
  border 3px solid grey
  padding-left 5px
  width 48px
.line-strong:focus
  border-color #0080ff
.color-picker
  top -250px
.selected-color
  border 3px solid
  width 39px
  height 36px
.text-input
  width 77%
.font-size-input
  width 10%
.form-group
  margin-bottom 3px
.font-size-input,
.text-input,
.bold-btn,
.italic-btn
  display inline-block
</style>
