// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import '^/theme'
import Vue from 'vue'
import App from '^/App'
import Index from '^/pages/Index'
import { getModulesRoutes } from '^/router/utils'
import VueImg from 'v-img'
import moment from 'moment'
import axios from 'axios'
import * as uiv from 'uiv'
import locale from 'uiv/src/locale/lang/ru-RU'
import router from '^/router'
import { base, url } from '^/utils/url'
import Panel from '^/components/Panel'
import PanelGroup from '^/components/PanelGroup'
import TabsPanel from '^/components/TabsPanel'
import DataTable from '^/components/DataTable'
import MemoryDataTable from '^/components/DataTable/MemoryDataTable'
import FormGroupInput from '^/components/form/FormGroupInput'
import CustomFormGroup from '^/components/form/CustomFormGroup'
import FormGroup from '^/components/form/FormGroup'
import FormGroupHorizontal from '^/components/form/FormGroupHorizontal'
import FormRow from '^/components/form/FormRow'
import FormSet from '^/components/form/FormSet'
import IconButton from '^/components/form/IconButton'
import TextButton from '^/components/form/TextButton'
import TextInput from '^/components/form/TextInput'
import TextArea from '^/components/form/TextArea'
import Checkbox from '^/components/form/Checkbox'
import NumberInput from '^/components/form/NumberInput'
import Select2 from '^/components/form/Select2'
import SelectVue from '^/components/form/SelectVue'
import MultiSelect2 from '^/components/form/MultiSelect2'
import VueSwitch from '^/components/form/Switch'
import DateTimePicker from '^/components/form/DateTimePicker'
import InputGroupTextButton from '^/components/form/InputGroupTextButton'
import FormLabel from '^/components/form/FormLabel'
import SvgIcon from '^/components/SvgIcon'
import FileSelector from '^/components/form/FileSelector'
import MaskInput from '^/components/form/MaskInput'
import Slider from '^/components/form/Slider'
import Breadcrumb from '^/components/Breadcrumb'
import TerritorySelectInput from '^/components/TerritorySelectInput'
import HtmlEditor from '^/components/HtmlEditor/HtmlEditor'
import LazyTree from '^/components/lazyTree/LazyTree'
import TreeSearch from '^/components/lazyTree/TreeSearch'
import SearchableLazyTree from '^/components/lazyTree/SearchableLazyTree'
import ModalDialog from '^/components/ModalDialog'

import IsogdDocumentCard from '^/components/stubs/IsogdDocumentCard'
import UrbanPlanningCard from '^/components/stubs/UrbanPlanningCard'
import FnsSteadsRoot from '^/components/stubs/FnsSteadsRoot'
import AddressRegistryRoot from '^/components/stubs/AddressRegistryRoot'
import RosreestrRoot from '^/components/stubs/RosreestrRoot'
import RosreestrOksRoot from '^/components/stubs/RosreestrOksRoot'
import FkkoSelectInput from '^/components/stubs/FkkoSelectInput'
import SetNumberOksZonesDialog from '^/components/stubs/SetNumberOksZonesDialog'
import SetSizeDialog from '^/components/stubs/SetSizeDialog'
import BufferSettingsDialog from '^/components/stubs/BufferSettingsDialog'

import blockUiMixin from '^/mixins/block-ui'
import '^/mixins/url'
import '^/mixins/pnotify'
import coreApi from '^/mixins/coreApi'

moment.locale('ru')
Vue.config.productionTip = false

const isIE11 = !!window.MSInputMethodContext && !!document.documentMode

axios.defaults.baseURL = base

axios.interceptors.request.use(config => {
  // все get ajax запросы кешируются в IE11 и ETag не учитывается
  // http://stackoverflow.com/questions/367786/prevent-browser-caching-of-jquery-ajax-call-result
  if (isIE11 && config.method === 'get') {
    // для запросов у которых нет параметров свойство params не указано
    config.params = config.params || {}
    config.params['t'] = new Date().getTime()
  }
  return config
}, error => {
  return Promise.reject(error)
})

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          location.href = url(`/api/auth/login?${encodeURIComponent(location.href)}`)
          break
        case 403:
          router.push({ name: `page403`, params: { errorMessage: error.response ? error.response.data : null } })
          break
      }
    }
    return Promise.reject(error)
  }
)

Vue.use(uiv, { locale })
Vue.use(VueImg)
Vue.component('Panel', Panel)
Vue.component('PanelGroup', PanelGroup)
Vue.component('TabsPanel', TabsPanel)
Vue.component('DataTable', DataTable)
Vue.component('MemoryDataTable', MemoryDataTable)
Vue.component('FormGroupInput', FormGroupInput)
Vue.component('FormGroup', FormGroup)
Vue.component('FormGroupHorizontal', FormGroupHorizontal)
Vue.component('CustomFormGroup', CustomFormGroup)
Vue.component('IconButton', IconButton)
Vue.component('TextButton', TextButton)
Vue.component('TextInput', TextInput)
Vue.component('TextArea', TextArea)
Vue.component('Checkbox', Checkbox)
Vue.component('NumberInput', NumberInput)
Vue.component('Select2', Select2)
Vue.component('SelectVue', SelectVue)
Vue.component('MultiSelect2', MultiSelect2)
Vue.component('VueSwitch', VueSwitch)
Vue.component('DateTimePicker', DateTimePicker)
Vue.component('InputGroupTextButton', InputGroupTextButton)
Vue.component('FormRow', FormRow)
Vue.component('FormSet', FormSet)
Vue.component('FormLabel', FormLabel)
Vue.component('ModalDialog', ModalDialog)
Vue.component('SvgIcon', SvgIcon)
Vue.component('FileSelector', FileSelector)
Vue.component('MaskInput', MaskInput)
Vue.component('Slider', Slider)
Vue.component('Breadcrumb', Breadcrumb)
Vue.component('TerritorySelectInput', TerritorySelectInput)
Vue.component('HtmlEditor', HtmlEditor)
Vue.component('LazyTree', LazyTree)
Vue.component('TreeSearch', TreeSearch)
Vue.component('SearchableLazyTree', SearchableLazyTree)

// stubs
Vue.component('IsogdDocumentCard', IsogdDocumentCard)
Vue.component('UrbanPlanningCard', UrbanPlanningCard)
Vue.component('FnsSteadsRoot', FnsSteadsRoot)
Vue.component('AddressRegistryRoot', AddressRegistryRoot)
Vue.component('RosreestrRoot', RosreestrRoot)
Vue.component('RosreestrOksRoot', RosreestrOksRoot)
Vue.component('FkkoSelectInput', FkkoSelectInput)
Vue.component('SetNumberOksZonesDialog', SetNumberOksZonesDialog)
Vue.component('SetSizeDialog', SetSizeDialog)
Vue.component('BufferSettingsDialog', BufferSettingsDialog)

Vue.mixin(blockUiMixin)
Vue.mixin(coreApi)
/* eslint-disable no-new */

/* eslint-disable no-new */
async function initialize (store, sectionRoutes) {
  await store.dispatch('loadModules')
  const routes = getModulesRoutes(store.state.modules, sectionRoutes)
  router.addRoutes(routes)
  router.addRoutes([{ name: 'map', path: '*', component: Index }])
  new Vue({
    store,
    el: '#app',
    router,
    template: '<App/>',
    components: { App }
  })
}

export {
  initialize
}
