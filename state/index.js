import * as actions from '^/state/actions'
import * as coreMutations from '^/state/mutations'
import coreModules from '^/state/modules'
import enumHelper from '^/helpers/enumHelper'

let counter = 0

export default {
  state: {
    breadcrumb: [],
    currentView: {
      view: null,
      rootView: null,
      context: null
    },
    enums: {},
    resources: {},
    actions: {},
    user: {
      username: '',
      oktmoId: '',
      id: '',
      allowedOktmoTree: [],
      libraryOktmoTree: []
    },
    settingsProfile: {},
    systemParameters: {},
    appSettings: {
      title: '',
      adminMail: ''
    },
    isMapSidebarVisible: false,
    territories: [],
    urbanPlanningObjects: [],
    searchResults: [],
    currentModule: null,
    currentSection: null,
    modules: [],
    key: counter,
    rootView: null,
    filters: [],
    beforeLeaveFunc: null
  },
  getters: {
    defaultExtent: ({ settingsProfile }) => {
      const extent = [
        settingsProfile.extentXMin, settingsProfile.extentYMin,
        settingsProfile.extentXMax, settingsProfile.extentYMax
      ]

      // Указаны все координаты экстента.
      if (extent.every(x => x !== null && x !== undefined)) {
        return extent
      }
    }
  },
  actions,
  mutations: {
    [coreMutations.USER_DATA] (state, user) {
      state.user = user
    },
    [coreMutations.SET_TERRITORIES_TREE] (state, territories) {
      state.territoriesTree = territories
    },
    [coreMutations.SET_TERRITORIES] (state, territories) {
      state.territories = territories
    },
    [coreMutations.URBAN_PLANNING_OBJECTS] (state, urbanPlanningObjects) {
      state.urbanPlanningObjects = urbanPlanningObjects
    },
    [coreMutations.SYSTEM_PARAMETERS] (state, systemParameters) {
      state.systemParameters = systemParameters
    },
    [coreMutations.PROFILE_DATA] (state, settingsProfile) {
      state.settingsProfile = settingsProfile
    },
    [coreMutations.ENUMS] (state, enums) {
      state.enums = enumHelper.initializeEnums(enums)
    },
    [coreMutations.RESOURCES_AND_ACTIONS] (state, resourcesAndActions) {
      state.resources = resourcesAndActions.resources
      state.actions = resourcesAndActions.actions
    },
    [coreMutations.EVENT_PROFILE_DATA] (state, eventProfile) {
      state.settingsProfile.eventsProfileSetting = eventProfile
    },
    [coreMutations.APP_SETTINGS] (state, appSettings) {
      state.appSettings = appSettings
    },
    [coreMutations.BREADCRUMB_CLEAR] (state) {
      state.breadcrumb = []
    },
    [coreMutations.BREADCRUMB_PUSH] (state, item) {
      const index = state.breadcrumb.indexOf(item)
      if (index === -1) {
        if (item.root) {
          state.breadcrumb = [item]
        } else {
          state.breadcrumb.push(item)
        }
      }

      if (!item.key) {
        item.key = counter++
      }

      state.key = item.key
      state.views[item.rootView] = item.view
      state.rootView = item.rootView
      state.currentView = {
        key: item.key,
        view: item.view,
        rootView: item.rootView,
        context: item.context
      }
    },
    [coreMutations.BREADCRUMB_REPLACE] (state, item) {
      item.key = counter++
      const lastElemIndex = state.breadcrumb.length - 1
      state.breadcrumb.splice(lastElemIndex, 1, item)
      state.currentView = {
        key: item.key,
        view: item.view,
        rootView: item.rootView,
        context: item.context
      }
    },
    [coreMutations.BREADCRUMB_GO] (state, item) {
      const index = state.breadcrumb.indexOf(item)
      if (index !== -1) {
        // Перейти к существующему
        state.breadcrumb = state.breadcrumb.slice(0, index + 1)
      }

      state.key = item.key
      state.rootView = item.rootView
      state.views[item.rootView] = item.view
      state.currentView = {
        key: item.key,
        view: item.view,
        rootView: item.rootView,
        context: item.context
      }
    },
    [coreMutations.BREADCRUMB_RENAME_LAST_ELEMENT] (state, item) {
      state.breadcrumb[state.breadcrumb.length - 1].name = item
    },
    [coreMutations.MAP_TOGGLE_SIDEBAR] (state) {
      state.isMapSidebarVisible = !state.isMapSidebarVisible
    },
    [coreMutations.MAP_OPEN_SIDEBAR] (state) {
      state.isMapSidebarVisible = true
    },
    [coreMutations.MAP_CLOSE_SIDEBAR] (state) {
      state.isMapSidebarVisible = false
    },
    [coreMutations.MAP_INITIALIZE] (state) {
      state.searchResults = []
      state.isMapSidebarVisible = false
    },
    [coreMutations.MAP_SET_SEARCH_RESULTS] (state, searchResults) {
      // Отключаем реактивность для массива.
      // Результаты поиска содержат свойство geometry (ol.geom.Geometry),
      // при включении реактивности будет возникать исключение "Maximum call stack size exceeded".
      state.searchResults = Object.freeze(searchResults)
      state.isMapSidebarVisible = true
    },
    [coreMutations.MAP_CLEAR_SEARCH_RESULTS] (state) {
      state.searchResults = []
    },
    [coreMutations.SET_MODULES] (state, modules) {
      state.modules = modules
    },
    [coreMutations.SET_CURRENT_MODULE_AND_SECTION] (state, { module, section }) {
      if (!module) {
        state.currentModule = null
        state.currentSection = null
      } else {
        state.currentModule = module
        state.currentSection = section
      }
    },
    [coreMutations.SET_ROOT_VIEW] (state, { name, view, rootView, filters }) {
      state.name = name
      state.views[rootView] = view
      state.rootView = rootView
      state.filters = filters
    },
    [coreMutations.CLEAR_VIEW] (state) {
      state.key = 0
      state.name = null
      state.views[state.rootView] = null
      state.rootView = null
      state.currentView = {
        view: null,
        rootView: null,
        context: null
      }
    },

    [coreMutations.SUB_BREADCRUMB_CLEAR] (state, item) {
      state.breadcrumbs[item.menuItem].breadcrumb = []
    },

    [coreMutations.SUB_BREADCRUMB_PUSH] (state, item) {
      const index = state.breadcrumbs[item.menuItem].breadcrumb.indexOf(item)
      if (index === -1) {
        if (item.root) {
          state.breadcrumbs[item.menuItem].breadcrumb = [item]
        } else {
          state.breadcrumbs[item.menuItem].breadcrumb.push(item)
        }
      }

      if (!item.key) {
        item.key = state.breadcrumbs[item.menuItem].counter++
      }

      state.breadcrumbs[item.menuItem].key = item.key

      state.breadcrumbs[item.menuItem].viewParams = item.viewParams
      state.breadcrumbs[item.menuItem].rootView = item.rootView
    },

    [coreMutations.SUB_BREADCRUMB_REPLACE] (state, item) {
      item.key = state.breadcrumbs[item.menuItem].key++
      const lastElemIndex = state.breadcrumbs[item.menuItem].breadcrumb.length - 1
      state.breadcrumbs[item.menuItem].breadcrumb.splice(lastElemIndex, 1, item)
    },

    [coreMutations.SUB_BREADCRUMB_GO] (state, item) {
      const index = state.breadcrumbs[item.menuItem].breadcrumb.indexOf(item)
      if (index !== -1) {
        // Перейти к существующему
        state.breadcrumbs[item.menuItem].breadcrumb = state.breadcrumbs[item.menuItem].breadcrumb.slice(0, index + 1)
      }

      state.breadcrumbs[item.menuItem].key = item.key
      state.breadcrumbs[item.menuItem].rootView = item.rootView
      state.breadcrumbs[item.menuItem].viewParams = item.viewParams
    },

    [coreMutations.SUB_BREADCRUMB_RENAME_LAST_ELEMENT] (state, item) {
      const breadcrumb = state.breadcrumbs[item.menuItem].breadcrumb
      breadcrumb[breadcrumb.length - 1].name = item.name
    },

    [coreMutations.CLEAR_ALL_SUB_BREADCRUMBS] (state, item) {
      for (const key in state.breadcrumbs) {
        state.breadcrumbs[key] = {
          breadcrumb: [],
          key: 0,
          rootView: null,
          view: null,
          menuItem: null,
          counter: 0,
          viewParams: {},
          canShowMap: state.breadcrumbs[key].canShowMap
        }
      }
    },

    [coreMutations.SET_BEFORE_LEAVE_FUNC] (state, func) {
      state.beforeLeaveFunc = func
    }
  },
  modules: coreModules
}
