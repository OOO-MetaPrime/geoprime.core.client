import * as coreTypes from '^/state/mutations'

const state = {
  selectedPdCardLayers: []
}

const actions = {
  navigate ({ commit }, params) {
    commit(coreTypes.BREADCRUMB_PUSH, params, { root: true })
  },
  navigateReplace ({ commit }, params) {
    commit(coreTypes.BREADCRUMB_REPLACE, params, { root: true })
  }
}

const mutations = {
  setSelectedPdCardLayers (state, layers) {
    state.selectedPdCardLayers = layers
  }
}

export default {
  state,
  actions,
  mutations,
  namespaced: true
}
