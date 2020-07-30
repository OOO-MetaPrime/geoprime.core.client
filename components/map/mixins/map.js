
import { zoomOnPoint, searchByManyCoords } from '^/components/map/map'
import * as drawShapes from '^/components/map/drawShapes.js'

export default {
  data () {
    return {
      registryLayer: null,
      actualRegistry: null,
      actualRecord: null,
      isMultipleLayer: false,
      actualRecordFeatures: []
    }
  },
  computed: {
    geometryType () {
      if (!this.actualRegistry) {
        return null
      }

      return this.actualRegistry.geometryType
    },
    canEditImportedGeometry () {
      return this.actualRegistry && this.actualRegistry.allowImportedGeometryEdit
    },
    canEditGeometry () {
      const canUpdateRegistryGeometry =
        this.actualRegistry &&
        this.actualRegistry.claims.update &&
        this.actualRegistry.geometryType &&
        this.actualRegistry.mapIdField &&
        !this.isMultipleLayer

      const canUpdateSelectedRecordGeometry = this.actualRecord && this.actualRecord.oktmo_id === this.user.oktmoId

      return !!(canUpdateRegistryGeometry && canUpdateSelectedRecordGeometry)
    },
    allowedDrawModes () {
      if (!this.actualRegistry || !this.actualRegistry.geometryType) {
        return []
      }
      const geometryTypeDrawModes = drawShapes.getAllowedDrawModes()
      return geometryTypeDrawModes[this.actualRegistry.geometryType]
    },
    isFromRegistry () {
      if (this.actualRegistry) {
        return true
      }

      return false
    },
    actualDrawOptions () {
      if (!this.isFromRegistry) {
        return this.drawOptions
      }

      return {
        canDraw: this.canEditGeometry,
        canDrawCreate: this.canEditGeometry,
        canEdit: this.canEditGeometry,
        allowedDrawModes: this.allowedDrawModes,
        geometryType: this.geometryType,
        canEditImportedGeometry: this.canEditImportedGeometry
      }
    },
    actualCanBind () {
      if (this.isFromRegistry) {
        return this.canEditGeometry
      }

      return this.canBind
    },
    actualLayer () {
      if (!this.isFromRegistry) {
        return this.layer
      }

      return this.registryLayer
    }
  },
  methods: {
    async zoomOnPoint (item, registry) {
      const minimumMapAutoScale = this.settingsProfile.minimumMapAutoScale
      let coordinateProjection = registry.coordinateProjectionWkid
      const latitudeColumn = registry.columns.find(x => x.isLatitude)
      const longitudeColumn = registry.columns.find(x => x.isLongitude)
      const sh = latitudeColumn ? item[latitudeColumn.key] : null
      const dl = longitudeColumn ? item[longitudeColumn.key] : null
      if (coordinateProjection && dl && sh) {
        await zoomOnPoint(coordinateProjection, sh, dl, this.map, minimumMapAutoScale)
        return
      }

      return
    },
    async pickObjectsOnMap (items, registry) {
      const itemsCoordinateInfo = []
      const minimumMapAutoScale = this.settingsProfile.minimumMapAutoScale
      for (const item of items) {
        const coordinateProjection = registry.coordinateProjectionWkid
        const latitudeColumn = registry.columns.find(x => x.isLatitude)
        const longitudeColumn = registry.columns.find(x => x.isLongitude)
        const sh = latitudeColumn ? item[latitudeColumn.key] : null
        const dl = longitudeColumn ? item[longitudeColumn.key] : null
        if (coordinateProjection && dl && sh) {
          itemsCoordinateInfo.push({
            coordinateProjection,
            sh,
            dl
          })
        }
      }

      await searchByManyCoords(itemsCoordinateInfo, this.map, minimumMapAutoScale)
    },
    onDevDocRegistryGetCoordinates (component) {
      this.$refs.toolbar.deactivate()
      this.onGetCoordinatesClickKey = this.map.on('singleclick', event => {
        this.clearGetCoordinatesMode()
        this.$emit('devDocSetCoordinates', {
          coordinate: event.coordinate,
          component
        })
        event.stopPropagation()
      })
    },
    getMapField (feature) {
      const layerField = this.actualRegistry.spatialDataField
      return feature.attributes.find(x => x.name === layerField || x.originalName === layerField)
    }
  }
}
