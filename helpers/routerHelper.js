'use strict'

import { findModuleAndSectionInModulesByPath } from '^/router/utils'
import * as coreMutations from '^/state/mutations'

function registerAfterEachHandlers (router, store) {
  router.afterEach(async (to, from) => {
    const { module: toModule, section: toSection } = findModuleAndSectionInModulesByPath(to.fullPath, store.state.modules)
    const { module: fromModule, section: fromSection } = findModuleAndSectionInModulesByPath(from.fullPath, store.state.modules)
    store.commit(coreMutations.SET_CURRENT_MODULE_AND_SECTION, { module: toModule, section: toSection })

    const isModuleChanged = fromModule !== toModule
    const isSectionChanged = fromSection !== toSection
    if (isModuleChanged || isSectionChanged) {
      store.commit(coreMutations.BREADCRUMB_CLEAR)
    }
  })
}

export default {
  registerAfterEachHandlers
}
