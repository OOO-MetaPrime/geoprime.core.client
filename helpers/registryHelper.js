'use strict'

import _groupBy from 'lodash/groupBy'
import _chunk from 'lodash/chunk'
import classifierApi from '^/api/classifier'

async function getClassifierColumnValues (column, columnKey, filterField, organizationId, isTerritoryFilterField) {
  const result = await classifierApi.getClassifier({
    tableName: column.foreignTable,
    keyColumn: column.foreignTableKeyColumn,
    displayColumn: column.foreignTableDisplayColumn,
    isTimeRestricted: column.isTimeRestricted,
    isLicences: column.isLicences,
    filterClassifiersField: filterField,
    selectingOrganizationId: organizationId,
    isTerritoryFilterField: isTerritoryFilterField || false
  })
  return {
    columnKey,
    values: result
  }
}

function getCacheKey (column) {
  return `${column.foreignTable}-${column.foreignTableKeyColumn}-${column.foreignTableDisplayColumn}`
}

async function getRegistryClassifiers (columns, filterField, organizationId, isTerritoryFilterField) {
  const classifierCache = {}
  const columnClassifiers = {}
  const keysAndColumns = columns.map(x => ({ column: x, cacheKey: getCacheKey(x) }))
  const columnKeyDict = _groupBy(keysAndColumns, x => x.cacheKey)
  const cacheKeys = Object.keys(columnKeyDict).map(x => ({ key: x, column: columnKeyDict[x][0].column }))
  const chunkedKeys = _chunk(cacheKeys, 5)

  for (const chunkKey of chunkedKeys) {
    const entries = await Promise.all(chunkKey.map(x => getClassifierColumnValues(x.column, x.key, filterField, organizationId, isTerritoryFilterField)))
    for (const entry of entries) {
      classifierCache[entry.columnKey] = entry.values
    }
  }

  for (const columnAndKey of keysAndColumns) {
    columnClassifiers[columnAndKey.column.id] = classifierCache[columnAndKey.cacheKey]
  }

  return columnClassifiers
}

export {
  getClassifierColumnValues,
  getRegistryClassifiers
}
