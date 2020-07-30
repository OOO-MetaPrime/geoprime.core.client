import * as coreMutations from '^/state/mutations'
import auth from '^/api/auth'
import modulesApi from '^/api/modules'

export const logout = () => {
  auth.logout()
}

export const setSearchResults = ({ commit }, searchResults) => {
  commit(coreMutations.MAP_SET_SEARCH_RESULTS, searchResults)
}

export const clearSearchResults = ({ commit }) => {
  commit(coreMutations.MAP_CLEAR_SEARCH_RESULTS)
}

export const breadcrumbBack = ({ commit, state }) => {
  const length = state.breadcrumb.length
  const item = state.breadcrumb[length - 2]
  commit(coreMutations.BREADCRUMB_GO, item)
}

export const breadcrumbNavigate = ({ commit, state }, item) => {
  commit(coreMutations.BREADCRUMB_PUSH, item)
}

export const breadcrumbReplace = ({ commit, state }, item) => {
  commit(coreMutations.BREADCRUMB_REPLACE, item)
}

export const breadcrumbGo = ({ commit, state }, item) => {
  commit(coreMutations.BREADCRUMB_GO, item)
}

export const getPreviousBreadcrumbItem = ({ commit, state }) => {
  const length = state.breadcrumb.length
  const item = state.breadcrumb[length - 2]
  return item
}
export const setRouteview = ({ commit }, item) => {
  commit(coreMutations.SET_ROOT_VIEW, item)
}

export const setUser = ({ commit }, user) => {
  commit(coreMutations.USER_DATA, user)
}

export const clearView = ({ commit }) => {
  commit(coreMutations.CLEAR_VIEW)
}

export const renameLastBreadcrumbItem = ({ commit }, newName) => {
  commit(coreMutations.BREADCRUMB_RENAME_LAST_ELEMENT, newName)
}

export const loadModules = async ({ commit }) => {
  const modules = await modulesApi.getModules()
  commit(coreMutations.SET_MODULES, modules)
}

export const setBeforeLeaveFunc = ({ commit }, params) => {
  commit(coreMutations.SET_BEFORE_LEAVE_FUNC, params)
}
