
/**
 * Получить настроенные колонки для грида записй реестра.
 */
function getRegistryColumns (columns) {
  var gridColumns = columns.filter(a => a.isVisibleInGrid)
  gridColumns.forEach(column => {
    column.width = 250
    if (column.isBoolean) {
      column.valueFormat = (value, item) => {
        if (value) {
          return 'Да'
        } else {
          return value === false ? 'Нет' : 'Не указано'
        }
      }
    }
    if (column.isHtml) {
      column.valueFormat = (value, item) => 'Текст HTML'
    }
    if (column.isClassifier) {
      const tableName = column.id
      column.valueFormat = function (value, item) {
        var belongTable = tableName in item ? item[tableName] : null
        if (!belongTable) {
          return ''
        }
        if (belongTable && column.foreignTableDisplayColumn in belongTable) {
          return belongTable[column.foreignTableDisplayColumn]
        }
        return ''
      }
    }
  })
  return gridColumns
}

export { getRegistryColumns }
