import axios from 'axios'
import { url } from '^/utils/url'
import has from 'lodash/has'

class User {
  constructor ({
    username,
    oktmoId,
    oktmo,
    libraryOktmo,
    libraryOktmoTree,
    urbanPlanningObjectId,
    UrbanPlanningObject,
    id,
    allowedOktmoTree,
    allowedOktmoList,
    permissions,
    roles,
    territories
  }) {
    this.username = username
    this.oktmoId = oktmoId
    this.oktmo = oktmo
    this.libraryOktmo = libraryOktmo
    this.libraryOktmoTree = libraryOktmoTree
    this.urbanPlanningObjectId = urbanPlanningObjectId
    this.UrbanPlanningObject = UrbanPlanningObject
    this.id = id
    this.allowedOktmoTree = allowedOktmoTree
    this.allowedOktmoList = allowedOktmoList
    this.permissions = permissions
    this.roles = roles
    this.territories = territories
  }

  can (resource, action) {
    return has(this.permissions, [resource, action])
  }
}

export default {
  async getUserData () {
    const { data: result } = await axios.get('/api/me')
    return new User(result)
  },

  logout () {
    window.location = url('/api/auth/logout')
  }
}
