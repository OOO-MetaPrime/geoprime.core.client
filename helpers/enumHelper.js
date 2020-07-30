'use strict'

import _cloneDeep from 'lodash/cloneDeep'

function initializeEnums (enums) {
  const enumsCopy = _cloneDeep(enums)
  const enumNamespaces = Object.keys(enumsCopy)

  for (const enumNamespaceName of enumNamespaces) {
    const enumNamespace = enumsCopy[enumNamespaceName]
    const enums = Object.keys(enumNamespace)
    for (const enumName of enums) {
      const enumObj = enumNamespace[enumName]
      enumObj.enumKeys = Object.keys(enumObj)
      enumObj.toDisplayName = toDisplayName.bind(enumObj)
      enumObj.toArray = toArray.bind(enumObj)
    }
  }

  return enumsCopy
}

function toDisplayName (enumValue) {
  return this.displayNames[enumValue]
}

function toArray () {
  return this.enumKeys.filter(x => x !== 'displayNames').map(x => ({
    id: this[x],
    name: this.toDisplayName(x)
  }))
}

export default {
  initializeEnums
}
