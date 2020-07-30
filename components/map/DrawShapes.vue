<template lang="pug">
div
  div.layout
    div.panel.panel-flat.draw-buttons-container
      div.panel-body
        template(v-if="canDrawCreate")
          icon-button(
            v-if="allowedDrawModes.includes(Modes.DrawPoint)"
            @click="toggleMode(drawModes.DrawPoint)"
            :primary="currentMode === drawModes.DrawPoint"
            title="Точка"
            :disabled="!canDrawAndEdit"
            icon="icon_point"
          )
          icon-button(
            v-if="allowedDrawModes.includes(Modes.DrawLine)"
            @click="toggleMode(drawModes.DrawLine)"
            :primary="currentMode === drawModes.DrawLine"
            title="Линия"
            :disabled="!canDrawAndEdit"
            icon="icon_line"
          )
          icon-button(
            v-if="allowedDrawModes.includes(Modes.DrawPolygon)"
            @click="toggleMode(drawModes.DrawPolygon)"
            :primary="currentMode === drawModes.DrawPolygon"
            title="Полигон"
            :disabled="!canDrawAndEdit"
            icon="icon_polygon"
          )
          icon-button(
            v-if="allowedDrawModes.includes(Modes.DrawMultiPoint)"
            @click="toggleMode(drawModes.DrawMultiPoint)"
            :primary="currentMode === drawModes.DrawMultiPoint"
            :disabled="!canDrawAndEdit"
            title="Мультиточка"
            icon="icon_multipoint"
          )
          icon-button(
            v-if="allowedDrawModes.includes(Modes.DrawMultiLine)"
            @click="toggleMode(drawModes.DrawMultiLine)"
            :primary="currentMode === drawModes.DrawMultiLine"
            icon="icon_multiline"
            :disabled="!canDrawAndEdit"
            title="Мультилиния"
          )
        icon-button(
          v-if="allowedDrawModes.includes(Modes.DrawMultiPolygon)"
          @click="toggleMode(drawModes.DrawMultiPolygon)"
          :primary="currentMode === drawModes.DrawMultiPolygon"
          title="Мультиполигон"
          icon="icon_multipolygon"
          :disabled="!canDrawAndEdit"
        )
        icon-button(
          v-if="canEdit"
          @click="toggleEditCoordinates"
          :disabled="!isEdited || !canDrawAndEdit"
          title="Редактировать координаты"
          :primary="isEditCoordinates"
          icon="icon_location_edit"
        )
        icon-button(
          @click="toggleMode(drawModes.LoadGeometry)"
          title="Загрузить"
          :class="{'btn-primary': currentMode === drawModes.LoadGeometry}"
          icon="icon_upload"
        )
        icon-button(
          @click="toggleMode(drawModes.EditShape)"
          :disabled="isEdited || !canEdit || !canDrawAndEdit"
          :primary="currentMode === drawModes.EditShape"
          title="Нажмите на кнопку и укажите на карте объект для редактирования"
          icon="icon_edit_g"

        )
        icon-button(
          @click="saveGeometry"
          :disabled="!canSave"
          v-if="showSaveButton"
          title="Сохранить геометрию"
          icon="icon_floppy_disk"
        )
        icon-button(
          @click="disableEditMode"
          :disabled="!canEdit"
          v-if="isEdited"
          title="Отменить редактирование геометрии"
          icon="icon_cancel_circle"
        )
        icon-button(
          v-if="!isLoadGeometryFile"
          @click="toggleMode(drawModes.RemoveShape)"
          :primary="currentMode === drawModes.RemoveShape"
          :disabled="isEdited || !canEdit"
          title="Нажмите на кнопку и укажите на карте объект для удаления"
          icon="icon_bin"
        )
        icon-button(
          v-if="isLoadGeometryFile"
          @click="toggleRemoveImportedFeaturesMode"
          :primary="isRemovingImportedFeaturesActive"
          title="Нажмите на кнопку и укажите на карте загруженный объект для удаления"
          icon="icon_bin"
        )
  div.edit-coordinates(v-show="isEditCoordinates")
    div.panel.panel-flat
      div.panel-body.coordinates-panel
        edit-coordinates(ref="editcoordinates")
  div.load-geometry-file(v-show="isLoadGeometryFile")
    div.panel.panel-flat
      div.panel-body.load-geometry-file-panel
        geometry-file-import(ref="loadgeometryfile" @featuresLoaded="onFeaturesLoaded" @cancel="onCancelFeaturesLoading")
</template>

<script>
/* eslint no-new: "off" */
import * as drawShapes from './drawShapes.js'
import * as mapFunctions from './map'
import { identifyByCoordinates, isGeometryIntersectsWithCoordinates } from './identify'
import EditCoordinates from './EditCoordinates.vue'
import GeometryFileImport from './GeometryFileImport.vue'
import VectorLayer from 'ol/layer/vector'
import VectorSource from 'ol/source/vector'
import Collection from 'ol/collection'
import Modify from 'ol/interaction/modify'
import Draw from 'ol/interaction/draw'
import Feature from 'ol/feature'
import MultiPoint from 'ol/geom/multipoint'
import MultiLineString from 'ol/geom/multilinestring'
import MultiPolygon from 'ol/geom/multipolygon'
import observable from 'ol/observable'
import condition from 'ol/events/condition'
import GeoJSON from 'ol/format/geojson'
import Style from 'ol/style/style'
import Fill from 'ol/style/fill'
import Stroke from 'ol/style/stroke'
import StyleCircle from 'ol/style/circle'
import Select from 'ol/interaction/select'
import Transform from 'ol-ext/interaction/Transform'
import { mapState } from 'vuex'
import mapEventActions from '^/components/map/mapActions'
import mapEventsMixin from '^/mixins/mapEvents'
// import Select from 'ol/interaction/select'

export default {
  name: 'draw-shapes',
  components: {
    EditCoordinates,
    GeometryFileImport
  },
  mixins: [mapEventsMixin],
  props: {
    map: {},
    layer: {},
    registry: {},
    editGeometry: null,
    actualRecordFeatures: {
      type: Array,
      default () {
        return []
      }
    },
    allowedDrawModes: {
      type: Array,
      default () {
        return []
      }
    },
    canDrawCreate: {
      type: Boolean,
      default: false
    },
    allowedGeometryType: {
      type: String,
      default: null
    },
    canEdit: {
      type: Boolean,
      default: false
    },
    canEditImportedGeometry: {
      type: Boolean,
      default: false
    },
    showSaveButton: {
      type: Boolean,
      default: true
    },
    manualLayerUpdate: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      isActive: false,
      isPointActive: false,
      drawSource: null,
      draw: null,
      modifyInteraction: null,
      modifyingFeatureItem: null,
      features: null,
      currentMode: null,
      Modes: drawShapes.Modes,
      isEditCoordinates: false,
      isLoadGeometryFile: false,
      drawModes: drawShapes.Modes,
      isEdited: false,
      isDrawMultiGeometry: false,
      multiGeometry: null,
      createdGeometry: null,
      vectorLayer: null,
      importedFeatures: new Collection(),
      importedFeaturesSource: null,
      importedFeaturesLayer: null,
      importedFeaturesTransform: null,
      importedFeaturesPointModify: null,
      importedFeaturesSimpleSelect: null,
      removeImportedFeaturesSelection: null,
      selectedImportedFeature: null,
      onSelectImportedFeatureBinded: null,
      onSelectPointImportedFeatureBinded: null,
      isRemovingImportedFeaturesActive: false,
      isPointSource: false,
      importedFeaturesWkid: null
    }
  },
  computed: {
    ...mapState({
      selectedRecord: state => state.registries.selectedRecord
    }),
    editFeature () {
      if (!this.editGeometry) {
        return null
      }
      const geoJson = new GeoJSON()
      return {
        geometry: geoJson.readGeometry(this.editGeometry),
        crs: this.editGeometry.crs.properties.name
      }
    },
    canDrawAndEdit () {
      return this.currentMode !== this.drawModes.LoadGeometry
    },
    canSave () {
      return this.canEdit && (this.isEdited || this.selectedImportedFeature)
    },
    isSelectedImportedFeatureCompatible () {
      if (!this.selectedImportedFeature) {
        return false
      }
      const geometry = this.selectedImportedFeature.getGeometry()
      const geometryType = geometry.getType()
      // проверка совместимости типа импортированной геометрии с ограничением по типу геометрии в случае сохранения геометрии
      // для связанного объекта (в реестре ПД или для системного объекта)
      // Импортированная геометрия совместима если ее тип:
      // Точка, линия или полигон, то они совместимы с мультиточкой, мультилинией и мультиполигоном соответственно, т.к. могут быть в них преобразованы
      // Мультиточка, мультилиния или мультиполигон, сорежащие только одну соответствующую геометрию,
      // то они совместимы с точкой, линией и полигоном соответственно, т.к. могут быть в них преобразованы
      switch (geometryType) {
        case drawShapes.ShapeTypes.Point:
          return this.allowedDrawModes.includes(this.Modes.DrawPoint) ||
            this.allowedDrawModes.includes(this.Modes.DrawMultiPoint)
        case drawShapes.ShapeTypes.MultiPoint:
          const isSinglePointGeometry = geometry.getPoints().length === 1
          return this.allowedDrawModes.includes(this.Modes.DrawMultiPoint) ||
            (isSinglePointGeometry && this.allowedDrawModes.includes(this.Modes.DrawPoint))
        case drawShapes.ShapeTypes.Line:
          return this.allowedDrawModes.includes(this.Modes.DrawLine) ||
            this.allowedDrawModes.includes(this.Modes.DrawMultiLine)
        case drawShapes.ShapeTypes.MultiLine:
          const isSingleLineGeometry = geometry.getLineStrings().length === 1
          return this.allowedDrawModes.includes(this.Modes.DrawMultiLine) ||
            (isSingleLineGeometry && this.allowedDrawModes.includes(this.Modes.DrawLine))
        case drawShapes.ShapeTypes.Polygon:
          return this.allowedDrawModes.includes(this.Modes.DrawPolygon) ||
            this.allowedDrawModes.includes(this.Modes.DrawMultiPolygon)
        case drawShapes.ShapeTypes.MultiPolygon:
          const isSinglePolygonGeometry = geometry.getPolygons().length === 1
          return this.allowedDrawModes.includes(this.Modes.DrawMultiPolygon) ||
            (isSinglePolygonGeometry && this.allowedDrawModes.includes(this.Modes.DrawPolygon))
      }
    }
  },
  watch: {
    canEdit () {
      if (!this.canEdit) {
        this.disableEditMode()
      }
    }
  },
  async created () {
    this.features = new Collection()
  },
  beforeDestroy () {
    this.clearInteractions()
    this.stopModifyShape()
    this.turnOffLoadGeometryMode()
  },
  methods: {
    disableLowerTools (disabled) {
      if (disabled) {
        this.deactivate()
      }
    },
    toggleMode (mode) {
      if (this.currentMode === mode) {
        this.disableEditMode()
        return
      }
      this.getDrawSource()
      this.isEdited = false
      this.currentMode = mode
      this.clearInteractions()
      this.stopModifyShape()
      this.isDrawMultiGeometry = false
      switch (mode) {
        case drawShapes.Modes.DrawPoint:
          this.drawShape(drawShapes.ShapeTypes.Point)
          break
        case drawShapes.Modes.DrawLine:
          this.drawShape(drawShapes.ShapeTypes.Line)
          break
        case drawShapes.Modes.DrawPolygon:
          this.drawShape(drawShapes.ShapeTypes.Polygon)
          break
        case drawShapes.Modes.DrawMultiPoint:
          this.isDrawMultiGeometry = true
          this.drawShape(drawShapes.ShapeTypes.MultiPoint)
          break
        case drawShapes.Modes.DrawMultiLine:
          this.isDrawMultiGeometry = true
          this.drawShape(drawShapes.ShapeTypes.MultiLine)
          break
        case drawShapes.Modes.DrawMultiPolygon:
          this.isDrawMultiGeometry = true
          this.drawShape(drawShapes.ShapeTypes.MultiPolygon)
          break
        case drawShapes.Modes.EditShape:
        case drawShapes.Modes.RemoveShape:
          this.startModifyShape()
          break
        case drawShapes.Modes.LoadGeometry:
          this.toggleLoadGeometryFile()
          break
      }
    },
    drawShape (shapeType) {
      if (this.draw) {
        this.clearInteractions()
      }

      this.isPointActive = true

      this.draw = new Draw({
        type: shapeType,
        freehandCondition: condition.altKeyOnly
      })
      this.draw.on('drawend', this.onDrawEnd)
      this.map.addInteraction(this.draw)
      let geometryType = shapeType
      if (this.isDrawMultiGeometry) {
        switch (shapeType) {
          case drawShapes.ShapeTypes.Point:
            geometryType = 'MultiPoint'
            break
          case drawShapes.ShapeTypes.Line:
            geometryType = 'MultiLine'
            break
          case drawShapes.ShapeTypes.Polygon:
            geometryType = 'MultiPolygon'
            break
        }
      }
      this.$refs.editcoordinates.setNewFeature(geometryType, this.drawSource)
    },
    disableEditMode () {
      this.$emit('highlightGeometry', this.modifyingFeatureItem)

      this.clearDrawnShapes()
      this.clearInteractions()
      this.stopModifyShape()
      this.currentMode = null
      this.modifyingFeatureItem = null
      this.turnOffLoadGeometryMode()

      if (this.layer && this.layer.view && this.layer.view instanceof VectorLayer) {
        mapFunctions.refreshLayer(this.map, this.layer.view)
      }
      this.$emit('disableEditGeometry')
    },
    deactivate () {
      this.$emit('highlightGeometry', this.modifyingFeatureItem)

      this.clearDrawnShapes()
      this.clearInteractions()
      this.stopModifyShape()
      this.currentMode = null
      this.modifyingFeatureItem = null
      this.turnOffLoadGeometryMode()

      if (this.layer && this.layer.view && this.layer.view instanceof VectorLayer) {
        mapFunctions.refreshLayer(this.map, this.layer.view)
      }
    },
    stopModifyShape () {
      this.isEdited = false
      if (this.onClickKey) {
        observable.unByKey(this.onClickKey)
      }
      this.clearDrawnShapes()
    },
    clearDrawnShapes () {
      this.features.clear()
    },
    toggleEditCoordinates () {
      this.isEditCoordinates = !this.isEditCoordinates
    },
    toggleLoadGeometryFile () {
      this.isLoadGeometryFile = !this.isLoadGeometryFile
    },
    // Вызывается после создания/редактирования/удаления геометрии
    async afterDraw (drawMode) {
      this.disableEditMode()
      const layerView = this.layer.view
      const source = layerView.getSource()
      if (layerView instanceof VectorLayer) {
        if (drawMode === 'create') {
          source.addFeatures(this.features)
          source.refresh()
        } else {
          // WORKAROUND: после редактирования получаем все объекты заново
          source.clear()
        }
      } else {
        if ('refresh' in layerView) {
          layerView.refresh()
        }
      }
      if (source.updateParams) {
        source.updateParams({ 'time': Date.now() })
      }
      // Для очистки выделения объектов на карте
      this.$emit('geometryChanged')
    },
    async saveGeometry () {
      if (this.selectedImportedFeature && !this.isSelectedImportedFeatureCompatible) {
        this.$error('Выбранная геометрия несовместима по типу с разрешенной для сохранения')
        return
      }
      if (this.isSelectedImportedFeatureCompatible) {
        if (this.actualRecordFeatures.length) {
          const confirmed = await this._confirm(
            'Для записи уже определены пространственные данные. При сохранении будет выполнена привязка записи к загруженным пространственным данным.<BR>После сохранения убедитесь, что ранее введенные ПД будут удалены или удалите их вручную. Продолжить сохранение?',
            'Сохранение пространственных данных',
            'Да',
            'Нет'
          )
          if (!confirmed) {
            return
          }
        }
        this.isEditCoordinates = false
        const compatibleGeometry = this.canEditImportedGeometry ? this.selectedImportedFeature.getGeometry() : this.selectedImportedFeature.get('originalGeometry')
        this.$emit('createGeometry', this.getCompatibleLoadedGeometry(compatibleGeometry), this.canEditImportedGeometry ? undefined : this.importedFeaturesWkid)
        await this.afterDraw('create')
        this.selectedImportedFeature = null
        return
      }
      this.isEditCoordinates = false
      const isEditMode = this.currentMode === drawShapes.Modes.EditShape
      if (isEditMode) {
        this.$emit('editGeometry', this.modifyingFeatureItem)
      } else {
        this.$emit('createGeometry', this.createdGeometry)
      }
      await this.afterDraw(isEditMode ? 'edit' : 'create')
    },
    clearInteractions () {
      this.multiGeometry = null
      if (this.draw) {
        this.createdGeometry = null
        const drawSource = this.getDrawSource()
        this.map.removeInteraction(this.draw)
        drawSource.clear()
        this.draw.un('drawend', this.onDrawEnd)
        this.draw = null
      }
      if (this.modifyInteraction) {
        this.map.removeInteraction(this.modifyInteraction)
        this.modifyInteraction = null
      }
    },
    // Обработчик клика по карте в режимах Редактирования и Удаления
    async modifyMapClick (event) {
      this.$emit('removeHighlight')

      let editingFeature = null
      if (this.editFeature) {
        const editGeometry = await mapFunctions.getItemGeometry(this.editFeature)

        if (isGeometryIntersectsWithCoordinates(this.map, editGeometry, event.coordinate)) {
          editingFeature = {
            crs: this.editFeature.crs,
            geometry: editGeometry,
            feature: new Feature({
              geometry: editGeometry,
              crs: this.editFeature.crs
            })
          }
        } else {
          this.$error('По данным координатам нет объекта для редактирования или удаления.', { title: 'Выбор объекта' })
          return
        }
      } else {
        const result = await identifyByCoordinates(this.map, this.layer, event.coordinate)

        if (!result || result.length === 0) {
          this.$error('По данным координатам нет объекта для редактирования или удаления.', { title: 'Выбор объекта' })
          return
        }

        const feature = result[0]
        feature.feature.crs = feature.crs
        const geometry = await mapFunctions.getItemGeometry(feature.feature)
        feature.feature.setGeometry(geometry)
        feature.geometry = geometry
        editingFeature = feature
      }

      // если начали редактировать геометрию то клик по карте отключаем
      observable.unByKey(this.onClickKey)
      this.features.clear()
      this.features.push(editingFeature.feature)
      this.modifyingFeatureItem = editingFeature

      switch (this.currentMode) {
        case drawShapes.Modes.EditShape:
          this.modifyShape()
          break
        case drawShapes.Modes.RemoveShape:
          this.removeShapeDialog()
          break
      }
    },
    multiGeometryDraw (shape) {
      const isFeature = shape instanceof Feature
      if (!this.multiGeometry) {
        let geometryType = this.allowedGeometryType
        if (this.allowedGeometryType === drawShapes.ShapeGeometryTypes.Geometry) {
          switch (this.currentMode) {
            case drawShapes.Modes.DrawMultiPoint:
              geometryType = drawShapes.ShapeGeometryTypes.MultiPoint
              break
            case drawShapes.Modes.DrawMultiLine:
              geometryType = drawShapes.ShapeGeometryTypes.MultiLine
              break
            case drawShapes.Modes.DrawMultiPolygon:
              geometryType = drawShapes.ShapeGeometryTypes.MultiPolygon
              break
            case drawShapes.Modes.EditShape:
              geometryType = this.getMultiGeometryType(shape)
              break
          }
        }
        switch (geometryType) {
          case drawShapes.ShapeGeometryTypes.MultiPolygon:
            this.multiGeometry = new drawShapes.DrawMultiPolygonGeometry(!isFeature ? shape : null)
            break
          case drawShapes.ShapeGeometryTypes.MultiLine:
            this.multiGeometry = new drawShapes.DrawMultiLineGeometry(!isFeature ? shape : null)
            break
          case drawShapes.ShapeGeometryTypes.MultiPoint:
            this.multiGeometry = new drawShapes.DrawMultiPointGeometry(!isFeature ? shape : null)
            break
        }
      }
      if (isFeature) {
        this.multiGeometry.appendGeometry(shape.getGeometry())
        shape.setGeometry(this.multiGeometry.getGeometry())
      }
      return this.multiGeometry.getGeometry()
    },
    async showDeleteConfirm (title, text) {
      const confirmed = await this._confirm(text, title, 'Удалить', 'Отмена', 'danger')

      return !!confirmed
    },
    async removeShapeDialog () {
      if (this.registry && this.registry.storeHistory) {
        const mapField = this.getMapField()
        if (!mapField) {
          return
        }
        const countHistory = await drawShapes.getShapeCountHistory(this.registry.id, mapField.value)
        if (countHistory.count < 1) {
          return
        }
        const removeConfirmText = countHistory.count > 1
          ? 'Внимание вы удаляете объект. Предыдущая версия станет актуальной?'
          : 'Внимание вы удаляете последнюю версию объекта?'
        const confirmed = await this.showDeleteConfirm(
          'Удаление геометрии из истории',
          removeConfirmText
        )
        if (confirmed) {
          await this.removeShape()
        }
      } else {
        const confirmed = await this.showDeleteConfirm('Удаление геометрии', 'Вы уверены что хотите удалить выбранную геометрию?')
        if (confirmed) {
          await this.removeShape()
        }
      }
    },
    async onDrawEnd (drawEvent) {
      const feature = drawEvent.feature
      let geometry = feature.getGeometry()
      if (this.currentMode.indexOf('Multi') !== -1) {
        geometry = this.multiGeometryDraw(feature)
        this.$refs.editcoordinates.setFeature(feature, true)
      } else {
        this.features.clear()
        this.$refs.editcoordinates.setFeature(feature)
      }
      this.features.push(feature)
      this.$emit('drawEnd', feature)
      this.createdGeometry = geometry
      this.isEdited = true
    },
    startModifyShape () {
      this.onClickKey = this.map.on('singleclick', this.modifyMapClick)
    },
    isMultiGeometry (geometry) {
      return geometry instanceof MultiPolygon ||
        geometry instanceof MultiPoint ||
        geometry instanceof MultiLineString
    },
    getMultiShapeType (geometry) {
      if (geometry instanceof MultiPolygon) {
        return drawShapes.ShapeTypes.MultiPolygon
      } else if (geometry instanceof MultiPoint) {
        return drawShapes.ShapeTypes.MultiPoint
      } else if (geometry instanceof MultiLineString) {
        return drawShapes.ShapeTypes.MultiLine
      }
      throw new Error('Not supported type geometry')
    },
    getMultiGeometryType (geometry) {
      if (geometry instanceof MultiPolygon) {
        return drawShapes.ShapeGeometryTypes.MultiPolygon
      } else if (geometry instanceof MultiPoint) {
        return drawShapes.ShapeGeometryTypes.MultiPoint
      } else if (geometry instanceof MultiLineString) {
        return drawShapes.ShapeGeometryTypes.MultiLine
      }
      throw new Error('Not supported type geometry')
    },
    modifyShape () {
      this.clearInteractions()
      const isMultiGeometry = this.isMultiGeometry(this.modifyingFeatureItem.geometry)
      const modify = new Modify({
        features: this.features,
        // the SHIFT key must be pressed to delete vertices, so
        // that new vertices can be drawn at the same position
        // of existing vertices
        deleteCondition: function (event) {
          return condition.shiftKeyOnly(event) && condition.singleClick(event)
        }
      })
      modify.on('modifyend', event => {
        this.$emit('geometryModified', event.features.getArray())
      })
      this.map.addInteraction(modify)
      this.modifyInteraction = modify
      const mapField = this.getMapField()
      if (!mapField) {
        alert('Объект не содержит ключевого поля.')
        return
      }
      if (isMultiGeometry) {
        this.multiGeometryDraw(this.modifyingFeatureItem.geometry)
        this.draw = new Draw({ type: this.getMultiShapeType(this.modifyingFeatureItem.geometry) })
        this.draw.on('drawend', e => {
          this.multiGeometryDraw(e.feature)
          this.$refs.editcoordinates.setFeature(this.features.item(0), true)
        })
        this.map.addInteraction(this.draw)
        this.$refs.editcoordinates.setFeature(this.features.item(0), true)
      } else {
        this.$refs.editcoordinates.setFeature(this.features.item(0))
      }

      this.isEdited = true
    },
    getMapField () {
      if (!this.registry) {
        return true
      }
      return this.modifyingFeatureItem.attributes.find(x => x.name === this.registry.spatialDataField || x.originalName === this.registry.spatialDataField)
    },
    async removeShape () {
      this.clearDrawnShapes()
      this.clearInteractions()

      try {
        this.$emit('deleteGeometry', this.modifyingFeatureItem)
        if (!this.manualLayerUpdate) {
          await this.afterDraw('remove')
        } else {
          this.disableEditMode()
        }
      } catch (error) {
        this.$error('Ошибка, не удалось удалить геометрию.')
      }
    },
    onCancelFeaturesLoading () {
      this.turnOffLoadGeometryMode()
      this.disableEditMode()
    },
    toggleRemoveImportedFeaturesMode () {
      this.isRemovingImportedFeaturesActive = !this.isRemovingImportedFeaturesActive
      if (this.isRemovingImportedFeaturesActive) {
        this.startRemovingLoadedShapes()
      } else {
        this.stopRemovingLoadedShapes()
      }
    },
    stopRemovingLoadedShapes () {
      this.activateImportedFeaturesSelectAndModify(true)
      this.removeImportedFeaturesSelection.setActive(false)
    },
    startRemovingLoadedShapes () {
      if (this.selectedImportedFeature) {
        this.selectedImportedFeature = null
      }
      this.activateImportedFeaturesSelectAndModify(false)
      this.removeImportedFeaturesSelection.setActive(true)
    },
    turnOffLoadGeometryMode () {
      this.isLoadGeometryFile = false
      const source = this.getGeometryImportSource()
      source.clear()
      this.deinitializeImportedFeaturesSelectAndModify()
      if (this.removeImportedFeaturesSelection) {
        this.removeImportedFeaturesSelection.setActive(false)
        this.isRemovingImportedFeaturesActive = false
      }
    },
    activateImportedFeaturesSelectAndModify (activate) {
      const isPointSource = this.isPointSource
      if (isPointSource || !this.canEditImportedGeometry) {
        if (this.canEditImportedGeometry) {
          this.importedFeaturesPointModify.setActive(activate)
        }
        this.importedFeaturesSimpleSelect.setActive(activate)
        if (!activate) {
          this.importedFeaturesSimpleSelect.getFeatures().clear()
        }
      } else {
        this.importedFeaturesTransform.setActive(activate)
      }
    },
    deinitializeImportedFeaturesSelectAndModify () {
      if (this.importedFeaturesTransform) {
        this.map.removeInteraction(this.importedFeaturesTransform)
        this.importedFeaturesTransform.un('select', this.onSelectImportedFeatureBinded)
      }
      if (this.importedFeaturesPointModify) {
        this.map.removeInteraction(this.importedFeaturesPointModify)
      }
      if (this.importedFeaturesSimpleSelect) {
        this.map.removeInteraction(this.importedFeaturesSimpleSelect)
        this.importedFeaturesSimpleSelect.un('select', this.onSelectPointImportedFeatureBinded)
      }
    },
    initializeImportedFeaturesSelectAndModify (source) {
      if (this.removeImportedFeaturesSelection) {
        this.removeImportedFeaturesSelection.setActive(false)
        this.isRemovingImportedFeaturesActive = false
      }
      if (this.importedFeaturesSimpleSelect) {
        this.map.removeInteraction(this.importedFeaturesSimpleSelect)
        this.importedFeaturesSimpleSelect.un('select', this.onSelectPointImportedFeatureBinded)
      }
      if (this.importedFeaturesPointModify) {
        this.map.removeInteraction(this.importedFeaturesPointModify)
      }
      if (this.importedFeaturesTransform) {
        this.map.removeInteraction(this.importedFeaturesTransform)
        this.importedFeaturesTransform.un('select', this.onSelectImportedFeatureBinded)
      }
      const isPointSource = this.isPointSource
      if (isPointSource) {
        if (this.canEditImportedGeometry) {
          this.importedFeaturesPointModify = new Modify({
            source: source
          })
          this.map.addInteraction(this.importedFeaturesPointModify)
        }
        this.importedFeaturesSimpleSelect = new Select({
          condition: condition.click,
          layers: [this.importedFeaturesLayer]
        })
        this.map.addInteraction(this.importedFeaturesSimpleSelect)
        this.importedFeaturesSimpleSelect.on('select', this.onSelectPointImportedFeatureBinded)
      } else {
        if (this.canEditImportedGeometry) {
          this.importedFeaturesTransform = new Transform({
            features: source.getFeatures()
          })
          this.importedFeaturesTransform.on('select', this.onSelectImportedFeatureBinded)

          this.map.addInteraction(this.importedFeaturesTransform)
        } else {
          this.importedFeaturesSimpleSelect = new Select({
            condition: condition.click,
            layers: [this.importedFeaturesLayer]
          })
          this.map.addInteraction(this.importedFeaturesSimpleSelect)
          this.importedFeaturesSimpleSelect.on('select', this.onSelectPointImportedFeatureBinded)
        }
      }
    },
    async onFeaturesLoaded ({ features: geojsonFeatures, wkid }) {
      try {
        this.importedFeaturesWkid = wkid
        const transformedFeatures = await mapFunctions.transformGeoJSONFeaturesTo3857(geojsonFeatures, wkid)
        const originalFeatures = new GeoJSON().readFeatures(geojsonFeatures)
        const features = new GeoJSON().readFeatures(transformedFeatures)
        for (let i = 0; i < features.length; i++) {
          features[i].set('originalGeometry', originalFeatures[i].getGeometry())
        }

        const source = this.getGeometryImportSource()

        source.clear()
        source.addFeatures(features)

        this.deinitializeImportedFeaturesSelectAndModify()

        this.isPointSource = source.getFeatures().some(x => x.getGeometry().getType() === 'Point' || x.getGeometry().getType() === 'MultiPoint')
        this.initializeImportedFeaturesSelectAndModify(source)

        this.emitEventToMap(mapEventActions.ZOOM_TO_GEOMETRIES, { geometries: features.map(x => x.getGeometry()) })
      } catch (err) {
        console.error(err)
        this.$error('Ошибка преобразования геометрий')
      }
    },
    onSelectImportedFeature (e) {
      if (e.feature) {
        this.selectedImportedFeature = e.feature
      } else {
        this.selectedImportedFeature = null
      }
    },
    onSelectPointImportedFeature (e) {
      if (e.selected && e.selected.length > 0) {
        this.selectedImportedFeature = e.selected[0]
      } else {
        this.selectedImportedFeature = null
      }
    },
    getCompatibleLoadedGeometry (geometry) {
      const geometryType = geometry.getType()
      // проверка совместимости типа импортированной геометрии с ограничением по типу геометрии в случае сохранения геометрии
      // для связанного объекта (в реестре ПД или для системного объекта)
      // Импортированная геометрия совместима если ее тип:
      // Точка, линия или полигон, то они совместимы с мультиточкой, мультилинией и мультиполигоном соответственно, т.к. могут быть в них преобразованы
      // Мультиточка, мультилиния или мультиполигон, сорежащие только одну соответствующую геометрию,
      // то они совместимы с точкой, линией и полигоном соответственно, т.к. могут быть в них преобразованы
      switch (geometryType) {
        case drawShapes.ShapeTypes.Point:
          if (this.allowedDrawModes.includes(this.Modes.DrawPoint)) {
            return geometry
          }
          return new MultiPoint([geometry.getCoordinates()])
        case drawShapes.ShapeTypes.MultiPoint:
          if (this.allowedDrawModes.includes(this.Modes.DrawMultiPoint)) {
            return geometry
          }
          return geometry.getPoint(0)
        case drawShapes.ShapeTypes.Line:
          if (this.allowedDrawModes.includes(this.Modes.DrawLine)) {
            return geometry
          }
          const multiLineString = new MultiLineString()
          multiLineString.appendLineString(geometry)
          return multiLineString
        case drawShapes.ShapeTypes.MultiLine:
          if (this.allowedDrawModes.includes(this.Modes.DrawMultiLine)) {
            return geometry
          }
          return geometry.getLineString(0)
        case drawShapes.ShapeTypes.Polygon:
          if (this.allowedDrawModes.includes(this.Modes.DrawPolygon)) {
            return geometry
          }
          const multiPolygon = new MultiPolygon()
          multiPolygon.appendPolygon(geometry)
          return multiPolygon
        case drawShapes.ShapeTypes.MultiPolygon:
          if (this.allowedDrawModes.includes(this.Modes.DrawMultiPolygon)) {
            return geometry
          }
          return geometry.getPolygon(0)
      }
    },
    getGeometryImportSource () {
      if (!this.importedFeaturesSource) {
        const source = new VectorSource()

        this.importedFeaturesLayer = new VectorLayer({
          source: source,
          map: this.map,
          style: new Style({
            image: new StyleCircle({
              radius: 3,
              fill: new Fill({ color: 'rgba(121, 36, 166, 0.4)' }),
              stroke: new Stroke({ color: 'rgb(121, 36, 166)', width: 1 })
            }),
            fill: new Fill({ color: 'rgba(121, 36, 166, 0.4)' }),
            stroke: new Stroke({ color: 'rgb(121, 36, 166)', width: 1 })
          })
        })

        this.removeImportedFeaturesSelection = new Select({
          condition: condition.click,
          layers: [this.importedFeaturesLayer]
        })
        this.map.addInteraction(this.removeImportedFeaturesSelection)

        this.removeImportedFeaturesSelection.on('select', function (e) {
          if (e.selected && e.selected.length > 0) {
            this.importedFeaturesSource.removeFeature(e.selected[0])
            this.removeImportedFeaturesSelection.getFeatures().remove(e.selected[0])
          }
        }.bind(this))
        this.removeImportedFeaturesSelection.setActive(false)

        this.importedFeaturesSource = source
        this.onSelectImportedFeatureBinded = this.onSelectImportedFeature.bind(this)
        this.onSelectPointImportedFeatureBinded = this.onSelectPointImportedFeature.bind(this)
      }

      return this.importedFeaturesSource
    },
    getDrawSource () {
      if (!this.drawSource) {
        const source = new VectorSource({ features: this.features })

        this.vectorLayer = new VectorLayer({
          source: source,
          map: this.map
        })

        this.drawSource = source
      }

      return this.drawSource
    }
  }
}
</script>

<style lang="stylus" scoped>
.draw-buttons-container .panel-body
  height 46px
.edit-coordinates
  z-index: 1
  .panel
    margin-bottom 0px
  .panel-body
    padding 5px
.load-geometry-file
  width 30%
  min-width 300px
  max-width 500px
  .panel
    margin-bottom 0px
  .panel-body
    padding 5px
.layout
  display flex
  justify-content flex-end
  right 9px
  z-index: 1
  margin-right 5px
  margin-top 0
  bottom 0
  .panel
    margin-bottom 5px
    margin-right 0px
  .panel-body
    padding 5px
  button
    margin-right 2px
.coordinates-panel
  height 243px
.material-icon
  font-family 'Material Icons'
  font-size 11px
  font-weight normal
  font-style normal
</style>