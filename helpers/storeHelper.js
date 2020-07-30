'use strict'

import modulesApi from '^/api/modules'
import * as coreMutations from '^/state/mutations'

async function loadModules (store) {
  const modules = await modulesApi.getModules()
  store.commit(coreMutations.SET_MODULES, modules)
}

export default {
  loadModules
}
