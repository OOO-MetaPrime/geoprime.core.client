import auth from '^/api/auth'
import classifier from '^/api/classifier'
import common from '^/api/common'
import download from '^/api/download'
import enums from '^/api/enums'
import layers from '^/api/layers'
import map from '^/api/map'
import loadHtml from '^/api/loadHtml'
import modules from '^/api/modules'
import pdCards from '^/api/pdCards'
import registries from '^/api/registries'
import registry from '^/api/registry'
import reportTemplates from '^/api/reportTemplates'
import security from '^/api/security'
import settingsProfiles from '^/api/settingsProfiles'
import systemLog from '^/api/systemLog'
import systemParameters from '^/api/systemParameters'
import territories from '^/api/territories'
import terrZones from '^/api/terrzones'
import urbanPlanningObjects from '^/api/urbanPlanningObjects'
import xlsx from '^/api/xlsx'

export default {
  data () {
    return {
      coreApi: {
        auth,
        classifier,
        common,
        download,
        enums,
        layers,
        map,
        loadHtml,
        modules,
        pdCards,
        registries,
        registry,
        reportTemplates,
        security,
        settingsProfiles,
        systemLog,
        systemParameters,
        territories,
        terrZones,
        urbanPlanningObjects,
        xlsx
      }
    }
  }
}
