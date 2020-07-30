import axios from 'axios'
import _groupBy from 'lodash/groupBy'

function convertToTree (oktmos) {
  const parentOktmoList = oktmos.filter(x => !x.parent_id)
  const groupedByParent = _groupBy(oktmos, 'parent_id')
  for (const parentOktmo of parentOktmoList) {
    addChildren(parentOktmo, groupedByParent)
  }
  return parentOktmoList
}

function addChildren (parentOktmo, groupedByParent) {
  const children = groupedByParent[parentOktmo.id] || []
  for (const child of children) {
    addChildren(child, groupedByParent)
  }
  parentOktmo.children = children
}

export default {

  getTerritoriesTree (territories) {
    return convertToTree(territories)
  },

  async getTerritories () {
    const { data } = await axios.get('/api/territories/')
    return data
  }
}
