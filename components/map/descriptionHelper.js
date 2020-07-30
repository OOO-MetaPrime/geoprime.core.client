import terrZoneApi from '^/api/terrzones'
import registryApi from '^/api/registry'
import { mapState } from 'vuex'

export default {
  data () {
    return {
      entityDeterm: {
        itemDeterm: null,
        params: {}
      },
      entityComponent: {
        component: null
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.user,
      resources: state => state.resources,
      actions: state => state.actions
    })
  },
  methods: {
    async getEntityItemByCode (params) {
      const {
        entityTypeCode = null,
        bindColumn = null
      } = params
      if (!entityTypeCode || !bindColumn) {
        return
      }
      switch (entityTypeCode) {
        case 210 :
          const item = await this.customApi.isogdDocuments.getDocumentByCustomColumn(bindColumn)
          if (!item) {
            return null
          }
          return {
            component: 'IsogdDocumentCard',
            stateModule: 'isogdDocuments',
            viewParams: {
              id: item.id,
              modal: true,
              hideUnregisteredItems: true
            }
          }
        case 70:
          const canUpdate = this.user.can(this.resources.terrZone, this.actions.update)
          const canDelete = this.user.can(this.resources.terrZone, this.actions.delete)
          const canCreate = this.user.can(this.resources.terrZone, this.actions.create)
          // const terrZone = await terrZoneApi.getTerrZoneIdByGisId(bindColumn.value)
          const terrZone = await terrZoneApi.getTerrZoneByCustomColumn(bindColumn)
          if (!terrZone) {
            return null
          }
          terrZone['isTerrZone'] = true
          return {
            component: 'UrbanPlanningCard',
            'selectedTerrZone': terrZone,
            'canUpdate': canUpdate,
            'canCreate': canDelete,
            'canDelete': canCreate,
            modal: true
          }
        default: return null
      }
    },
    async getRecordByRegistryId (params) {
      const { registryId = null, bindColumn = null } = params
      if (!registryId || !bindColumn) {
        return null
      }
      const registry = await registryApi.getRegistry(registryId)
      const record = await registryApi.getItemByCustomColumn(registryId, bindColumn)
      if (!registry || !record) {
        return null
      }
      registry['primaryKeyColumn'] = registry.columns.find(el => el.isPrimaryKey)
      if (!registry['primaryKeyColumn']) {
        return null
      }
      return {
        component: 'RegistriesRecord',
        record,
        registry
      }
    },
    recognizeEntity () {
      const fpIsUuid = this.selectedResult.filePlace.search(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)

      const entitySpatialSetting = this.settingsProfile.entitySpatialSettings && this.selectedResult
        ? this.settingsProfile.entitySpatialSettings.find(el => el.layer.id === this.selectedResult.layerId)
          ? this.settingsProfile.entitySpatialSettings.find(el => el.layer.id === this.selectedResult.layerId)
          : null
        : null
      if (entitySpatialSetting) {
        const { entityTypeCode = null, layerField = null, entityField } = entitySpatialSetting
        if (!layerField || !layerField.trim().length || !entityField.trim().length) {
          return null
        }
        const bindColumn = this.getEntityBindingData(layerField)
        if (!bindColumn) {
          return null
        }
        bindColumn['name'] = entityField
        if (entityTypeCode) {
          return {
            itemDeterm: 'entity',
            params: {
              entityTypeCode: entityTypeCode,
              bindColumn: bindColumn
            }
          }
        }
        return null
      }
      if (fpIsUuid !== -1) {
        return {
          itemDeterm: 'registry',
          params: {
            bindColumn: {
              name: this.selectedResult.entityField,
              value: this.selectedResult.objectIdValue
            },
            registryId: this.selectedResult.filePlace
          }
        }
      }
      return null
    },
    getEntityBindingData (layerField) {
      const attributeDesc = this.selectedResult.originalAttributes.find(el => el.name === layerField)
      if (!attributeDesc) {
        return null
      }
      return {
        ...attributeDesc
      }
    },
    /**
     * objectDeterm объект
     */
    async getDescription (objectDeterm) {
      const { itemDeterm = null, params = {} } = objectDeterm
      if (!itemDeterm) {
        return null
      }
      switch (itemDeterm) {
        case 'entity' :
          try {
            return await this.getEntityItemByCode(params)
          } catch (err) {
            return null
          }
        case 'registry' :
          try {
            return await this.getRecordByRegistryId(params)
          } catch (err) {
            return null
          }
        default: return null
      }
    }
  }
}
