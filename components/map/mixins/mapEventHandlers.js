import registryApi from '^/api/registry'
import { setLayerExtent, searchByCoords, zoomAndHighlightObjectsOnMap, clearHighlightedObjectsOnMap, zoomMapToGeometryOrExtent, getGeometriesExtent } from '^/components/map/map'
import registriesApi from '^/api/registries'
import observable from 'ol/observable'
import mapEventActions from '^/components/map/mapActions'
import objectSearch from '../../map/objectSearch'
import camelCase from 'lodash/camelCase'
import snakeCase from 'lodash/snakeCase'
import keys from 'lodash/keys'

export default {
  data () {
    return {
      //
    }
  },
  methods: {
    async addRegistryLayer (payload) {
      if (!payload.context.registry) {
        this.actualRegistry = null
        this.actualRecord = null
        this.registryLayer = null
        return
      }

      if (!payload || !payload.context) {
        this.actualRecord = null
        return
      }

      const registry = payload.context.registry

      if (this.actualRegistry && registry.id === this.actualRegistry.id) {
        return
      }

      this.actualRegistry = registry
      if (payload.context.isSkipLayerAdding) {
        const layerInfo = this.layers.find(x => x.layer.registryId === registry.id)
        if (layerInfo) {
          this.registryLayer = { ...layerInfo.layer, view: layerInfo.mapLayer }
        } else {
          this.registryLayer = null
        }
        return
      }
      this.clearHighlightObjects()
      if (this.lastSelectedLayer) {
        this.removeLayer(this.lastSelectedLayer)
      }
      this.removeLayer(this.registryLayer)

      this.registryLayer = null
      const layer = await registryApi.getLayer(this.actualRegistry.id)
      this.lastSelectedLayer = layer

      if (layer) {
        // Флаг запрещающий удаление слоя в менеджере слоев.
        layer.disableRemove = true
        await this.addLayer(layer, true)
        this.updateSize()
        this.registryLayer = await this.getLayer(layer)
        const { view: mapLayer } = this.registryLayer
        await setLayerExtent(this.map, { layer, mapLayer })
        const { result } = await registriesApi.checkMultipleLayerSpatialSettings(layer.id)
        this.isMultipleLayer = result
      } else {
        this.isMultipleLayer = true
      }
    },
    async showRegistrtyObject (payload) {
      if (!payload || !payload.context || !payload.context.record) {
        this.actualRecord = null
        this.clearHighlightObjects()
        return
      }

      this.actualRecord = payload.context.record

      this.pickObjectOnMap(this.actualRecord)
    },
    async showRequestObject (payload) {
      const request = payload
      const { informationalThingSetting, entityTypeCode } = request

      if (!informationalThingSetting || !entityTypeCode) {
        return
      }

      const requestObjects = await this.customApi.isogd.getRequestObjectItems({
        requestId: request.id,
        objectCode: entityTypeCode
      })

      if (!requestObjects.length) {
        this.clearHighlightObjects()
        return
      }

      let { entityField, layerField } = informationalThingSetting

      const fieldCamelCase = camelCase(entityField)
      const fieldSnakeCase = snakeCase(entityField)

      if (keys(requestObjects[0]).find(x => x === fieldCamelCase)) {
        entityField = fieldCamelCase
      }
      if (keys(requestObjects[0]).find(x => x === fieldSnakeCase)) {
        entityField = fieldSnakeCase
      }

      const { layer } = this.getEntitySpatialSetting(entityTypeCode)

      if (!layer) {
        this.clearHighlightObjects()
        return
      }

      layer.objects = requestObjects
      layer.spatialDataField = layerField
      layer.mapIdField = entityField

      await this.addLayer(layer, true)

      const features = await objectSearch.getFeaturesByValues(layer)

      if (!features || !features.length) {
        this.clearHighlightObjects()
        return
      }

      this.pickObject(features)
    },
    async addRegistryLayerAndShowObject (payload) {
      if (!payload || !payload.context || !payload.context.registry || !payload.context.record) {
        return
      }

      const { registry, record } = payload.context

      this.actualRegistry = registry
      this.actualRecord = record

      const layerInfo = this.layers.find(x => x.layer.registryId === registry.id)

      if (!layerInfo) {
        const layer = await registryApi.getLayer(this.actualRegistry.id)
        if (layer) {
          layer.disableRemove = true
          await this.addLayer(layer, true)
          this.updateSize()
          this.registryLayer = await this.getLayer(layer)
          const { view: mapLayer } = this.registryLayer
          await setLayerExtent(this.map, { layer, mapLayer })
        }
      } else {
        this.registryLayer = { ...layerInfo.layer, view: layerInfo.mapLayer }
      }

      this.pickObjectOnMap(this.actualRecord)
    },
    setGetCoordinatesMode (payload) {
      this.$refs.toolbar.deactivate()
      this.onGetCoordinatesClickKey = this.map.on('singleclick', event => this.onGetCoordinates(event, payload))
    },
    onGetCoordinates (event, payload) {
      this.clearGetCoordinatesMode()
      this.$emit('onSetCoordinates', event.coordinate)
      if (payload) {
        this.emitEventFromMap(mapEventActions.COORDINATES_RESULT, payload.senderId, { coordinate: event.coordinate })
      }
      event.stopPropagation()
    },
    clearGetCoordinatesMode () {
      if (this.onGetCoordinatesClickKey) {
        observable.unByKey(this.onGetCoordinatesClickKey)
        this.activateDefaultTool()
      }
    },
    async pickObjectOnMap (item, registry = null) {
      if (!registry) {
        registry = this.actualRegistry
      }

      const minimumMapAutoScale = this.settingsProfile.minimumMapAutoScale
      let coordinateProjection = registry.coordinateProjectionWkid
      const latitudeColumn = registry.columns.find(x => x.isLatitude)
      const longitudeColumn = registry.columns.find(x => x.isLongitude)
      const sh = latitudeColumn ? item[latitudeColumn.key] : null
      const dl = longitudeColumn ? item[longitudeColumn.key] : null
      if (coordinateProjection && dl && sh) {
        await searchByCoords(coordinateProjection, sh, dl, this.map, minimumMapAutoScale)
        return
      }

      if (!this.actualLayer) {
        return
      }

      const features = await this.getLayerFeatures(item, registry, this.actualLayer)
      if (!features) {
        this.actualRecordFeatures = []
        return
      }
      this.actualRecordFeatures = features
      this.pickObject(features)
    },
    async pickObject (items, isFillHighlight = true) {
      console.log('pickObject')
      const minimumMapAutoScale = this.settingsProfile.minimumMapAutoScale
      this.clearHighlightObjects()
      const itemsExtent = await zoomAndHighlightObjectsOnMap(items, this.map, isFillHighlight, minimumMapAutoScale)
      if (!this.isMapExtentInitialized) {
        this.itemsExtent = itemsExtent
      }
    },
    clearHighlightObjects () {
      clearHighlightedObjectsOnMap()
    },
    zoomToGeometries ({ context }) {
      const extent = getGeometriesExtent(context.geometries)
      zoomMapToGeometryOrExtent(this.map, extent)
    }
  }
}
