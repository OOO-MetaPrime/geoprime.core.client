<template>
  <div class="draw-tools-container">
    <icon-button
      :primary="currentDrawType === 'bufferByObject'"
      @click="bufferByObject"
      title="Создать объект по выбранному контуру"
      :disabled="isBufferToolDisabled"
      icon="icon_checkbox_partial"
    />
    <icon-button
      :primary="currentDrawType === 'bufferByDraw'"
      @click="bufferByDraw"
      title="Нарисовать объект по контуру"
      :disabled="isDisabled"
      icon="icon_borderline"
    />
    <icon-button
      :primary="currentDrawType === 'union'"
      @click="polygonsUnion"
      title="Объединение полигонов"
      :disabled="isDisabled"
      icon="icon_stack"
    />
    <icon-button
      :primary="currentDrawType === 'subtract'"
      @click="polygonsSubtract"
      title="Вычитание полигонов"
      :disabled="isDisabled"
      icon="icon_stack_minus"
    />
    <icon-button
      :primary="currentDrawType === 'size'"
      @click="drawSize"
      title="Размеры"
      :disabled="isDisabled"
      icon="icon_sizes"
    />
    <icon-button
      :primary="currentDrawType === 'polygon'"
      @click="drawTools('polygon')"
      title="Полигон"
      :disabled="isDisabled"
      icon="icon_polygon"
    />
    <icon-button
      :primary="currentDrawType === 'point'"
      @click="drawTools('point')"
      title="Точка"
      :disabled="isDisabled"
      icon="icon_point"
    />
    <icon-button
      :primary="currentDrawType === 'line'"
      @click="drawTools('line')"
      title="Линия"
      :disabled="isDisabled"
      icon="icon_line"
    />
    <icon-button
      :primary="currentDrawType === 'edit'"
      @click="editGeometry"
      title="Выбрать объект для редактирования"
      :disabled="isDisabled"
      icon="icon_edit"
    />
    <icon-button
      :primary="currentDrawType === 'numberingOksZones'"
      @click="numberingOksZones"
      title="Нумерация ОКС/зон"
      :disabled="isDisabled"
      icon="icon_numberoneinacircle"
    />
    <icon-button
      :primary="currentDrawType === 'delete'"
      title="Удалить"
      @click="removeGeometry"
      :disabled="isDisabled"
      icon="icon_bin"
    />
    <icon-button
      :primary="toggleMark()"
      title="Маркировка объектов"
      @click="mark"
      :disabled="isDisabled"
      icon="icon_checkmark"
    />
    <icon-button
      :primary="currentDrawType === 'up'"
      title="На уровень выше (активна, если выбран объект)"
      @click="up($event)"
      :disabled="!isMoveUpAllowed"
      icon="icon_large_arrow_up"
    />
    <icon-button
      :primary="currentDrawType === 'down'"
      title="На уровень ниже (активна, если выбран объект)"
      @click="down($event)"
      :disabled="!isMoveDownAllowed"
      icon="icon_large_arrow_down"
    />
    <icon-button
      :primary="currentDrawType === 'top'"
      title="Поверх всех (активна, если выбран объект)"
      @click="top($event)"
      :disabled="!isMoveToTopAllowed"
      icon="icon_large_double_arrow_up"
    />
    <icon-button
      :primary="currentDrawType === 'bottom'"
      title="Ниже всех (активна, если выбран объект)"
      @click="bottom($event)"
      :disabled="!isMoveToBottomAllowed"
      icon="icon_large_double_arrow_down"
    />
    <div class="dropdown-style">
      <select2
        :data="styleItems"
        v-model="selectedItemId"
        :disabled="!styleItems.length"
        placeholder="Выберите стиль"
        :hideFilter="true"
        :title="selectedItem ? selectedItem.name : null"
      />
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

export default {
  props: {
    map: Object,
    isActive: Boolean,
    isDrawingsAllowed: Boolean,
    isMoveUpAllowed: Boolean,
    isMoveDownAllowed: Boolean,
    isMoveToTopAllowed: Boolean,
    isMoveToBottomAllowed: Boolean,
    isCreateBufferButtonInactive: Boolean,
    isDrawToolsTurnedOff: Boolean,
    lastSelectedFeature: Object
  },
  components: {
  },
  data () {
    return {
      currentDrawType: null,
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
      selectedItemId: null,
      markEnabled: false,
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
      },
      pointStyles:
      [
        { id: 0, name: 'Красная точка' },
        { id: 1, name: 'Точка подключения' }
      ],
      lineStyles:
      [
        { id: 2, name: 'Действующие красные линии' },
        { id: 3, name: 'Синяя тонкая' },
        { id: 4, name: 'Зеленая толстая' }
      ],
      polygonStyles:
      [
        { id: 5, name: 'Действующие красные линии' },
        { id: 6, name: 'Вспомогательный объект' },
        { id: 7, name: 'Зона действия публичных сервитутов' },
        { id: 8, name: 'Зоны допустимого размещения зданий, строений, сооружений' },
        { id: 9, name: 'Зона ОКС для гос. и муниципальных нужд' }
      ],
      numberingOksZonesStyles:
      [
        { id: 10, name: 'Номера существующих объектов капитального строительства и зон допустимого размещения зданий, строений, сооружений согласно экспликации' }
      ]
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
    },
    'styleItems': function () {
      this.selectedItemId = this.styleItems[0] ? this.styleItems[0].id : null
    },
    'isCreateBufferButtonInactive': function (newValue) {
      if (newValue === true) {
        this.setCurrentDrawType('mark')
      } else {
        this.setCurrentDrawType('bufferByObject')
      }
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
    },
    styleItems () {
      if (this.currentDrawType === 'point') {
        return this.pointStyles
      } else if (this.currentDrawType === 'line') {
        return this.lineStyles
      } else if (this.currentDrawType === 'polygon') {
        return this.polygonStyles
      } else if (this.currentDrawType === 'numberingOksZones') {
        return this.numberingOksZonesStyles
      }

      return []
    },
    selectedItem () {
      if (this.selectedItemId == null) {
        return null
      }

      return this.styleItems.find(x => x.id === this.selectedItemId)
    },
    isBufferToolDisabled () {
      return !this.isDrawingsAllowed || !this.lastSelectedFeature || !this.markEnabled || this.isDrawToolsTurnedOff
    }
  },
  methods: {
    disableLowerTools (disabled) {
      disabled ? this.isDisabled = true : this.isDisabled = false
      this.markEnabled = false
      this.deactivate()
    },
    toggleMark () {
      if (this.markEnabled) {
        return true
      } else {
        return false
      }
    },
    refreshEditingFeatureStyle () {
      if (this.editingFeature) {
        this.editingFeature[0].setStyle(this.getStyle(this.editingFeature[0].get('featureType')))
      }
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
    setCurrentDrawType (type) {
      this.deactivate()
      this.currentDrawType = type
      this.$emit('currentDrawType', this.currentDrawType)
    },
    bufferByObject () {
      if (this.currentDrawType === 'bufferByObject') {
        if (this.markEnabled) {
          this.currentDrawType = 'mark'
          this.setCurrentDrawType('mark')
          this.$emit('bufferByObject', false)
        } else {
          this.deactivate()
          return
        }
      } else {
        this.setCurrentDrawType('bufferByObject')
        this.$emit('bufferByObject', true)
      }
    },
    bufferByDraw () {
      if (this.currentDrawType === 'bufferByDraw') {
        this.deactivate()
        return
      } else {
        this.markEnabled = false
        this.setCurrentDrawType('bufferByDraw')
        this.$emit('bufferByDraw', true)
        this.$emit('deactivateDrawNotes')
      }
    },
    mark () {
      if (this.currentDrawType === 'bufferByObject' && this.markEnabled === true) {
        this.currentDrawType = null
        this.markEnabled = false
        this.$emit('setLastSelectedFeatureToNull')
        this.$emit('bufferByObject', false)
        this.$emit('markObject', false)
        return
      }

      if (this.currentDrawType === 'mark') {
        this.markEnabled = false
        this.deactivate()
        return
      } else {
        this.setCurrentDrawType('mark')
        this.$emit('markObject', true)
        this.markEnabled = true
        this.$emit('deactivateDrawNotes')
      }
    },
    blink (event) {
      const el = event.currentTarget
      el.style.background = 'rgba(63, 136, 191, 0.3)'
      setTimeout(() => {
        el.style.background = '#fcfcfc'
      }, 100)
    },
    up (event) {
      this.blink(event)
      this.$emit('moveObjectUp')
    },
    down () {
      this.blink(event)
      this.$emit('moveObjectDown')
    },
    top () {
      this.blink(event)
      this.$emit('moveObjectToTop')
    },
    bottom () {
      this.blink(event)
      this.$emit('moveObjectToBottom')
    },
    polygonsUnion () {
      if (this.currentDrawType === 'union') {
        this.deactivate()
        return
      } else {
        this.markEnabled = false
        this.setCurrentDrawType('union')
        this.$emit('polygonsUnion', true)
        this.$emit('deactivateDrawNotes')
      }
    },
    polygonsSubtract () {
      if (this.currentDrawType === 'subtract') {
        this.deactivate()
        return
      } else {
        this.markEnabled = false
        this.setCurrentDrawType('subtract')
        this.$emit('polygonsSubtract', true)
        this.$emit('deactivateDrawNotes')
      }
    },
    drawSize () {
      if (this.currentDrawType === 'size') {
        this.deactivate()
        return
      } else {
        this.markEnabled = false
        this.setCurrentDrawType('size')
        this.$emit('drawSize', true)
        this.$emit('deactivateDrawNotes')
      }
    },
    numberingOksZones () {
      if (this.currentDrawType === 'numberingOksZones') {
        this.deactivate()
        return
      } else {
        this.markEnabled = false
        this.setCurrentDrawType('numberingOksZones')
        this.$emit('numberingOksZones', true)
        this.$emit('deactivateDrawNotes')
      }
    },
    editGeometry () {
      if (this.currentDrawType === 'edit') {
        this.deactivate()
        return
      } else {
        this.markEnabled = false
        this.setCurrentDrawType('edit')
        this.$emit('editGeometry', true)
        this.$emit('deactivateDrawNotes')
      }
    },
    removeGeometry () {
      if (this.currentDrawType === 'delete') {
        this.deactivate()
        return
      } else {
        this.markEnabled = false
        this.setCurrentDrawType('delete')
        this.$emit('removeGeometry', true)
        this.$emit('deactivateDrawNotes')
      }
    },
    drawTools (type) {
      if (this.currentDrawType === type) {
        this.deactivate()
        return
      }
      this.markEnabled = false
      this.setCurrentDrawType(type)

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
      this.draw.on('drawend', this.onDrawEnd)
      this.map.addInteraction(this.draw)

      this.$emit('deactivateDrawNotes')
    },
    async onDrawEnd (drawEvent) {
      const feature = drawEvent.feature
      feature.set('graphics', true)
      feature.set('movable', true)
      feature.set('style', this.selectedItemId)

      this.$emit('saveGeometry', feature)
    },
    deactivate () {
      switch (this.currentDrawType) {
        case 'point':
        case 'line':
        case 'polygon': {
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
          this.editingFeature = null
          if (this.vector) {
            this.vector.setMap(null)
          }
          if (this.source) {
            this.source.clear()
          }
          this.editingFeature = null
          this.$emit('currentDrawType', null)
          break
        }
        case 'size': {
          this.$emit('drawSize', false)
          break
        }
        case 'edit': {
          this.$emit('editGeometry', false)
          break
        }
        case 'delete': {
          this.$emit('removeGeometry', false)
          break
        }
        case 'numberingOksZones': {
          this.$emit('numberingOksZones', false)
          break
        }
        case 'union': {
          this.$emit('polygonsUnion', false)
          break
        }
        case 'subtract': {
          this.$emit('polygonsSubtract', false)
          break
        }
        case 'mark': {
          if (!this.markEnabled) {
            this.$emit('markObject', false)
            this.$emit('setArrowsDisabled')
          }
          break
        }
        case 'bufferByObject': {
          this.$emit('bufferByObject', false)
          break
        }
        case 'bufferByDraw': {
          this.$emit('bufferByDraw', false)
          break
        }
      }
      this.currentDrawType = null
    },
    resetDrawTools () {
      this.markEnabled = false
      this.deactivate()
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
    },
    getDrawType (type) {
      switch (type) {
        case 'point':
          return 'Point'
        case 'line':
          return 'LineString'
        case 'polyline':
          return 'Polyline'
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
    }
  }
}
</script>

<style lang="stylus" scoped>
.draw-tools-container
  display flex
  flex-flow row wrap
  background-color #ffff
  margin 5px
  margin-top 0
  padding 5px
  bottom 0
  right 0
  z-index 2
  .custom-icon-button
    padding-left 8px
    padding-right 8px
  .custom-icon-button >>> span[class^="icon_"]
    font-size 18px
.dropdown-style
  width 150px
</style>
