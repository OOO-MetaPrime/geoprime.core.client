import orderBy from 'lodash/orderBy'
import filter from './filter'

function sort (items, sorting, columns) {
  const fieldGetter = x => x.field
  const findColumn = x => columns.find(col => col.field === x.field)
  const fields = sorting.map(x => (findColumn(x) && findColumn(x).sortingField) || fieldGetter(x))
  const direction = sorting.map(x => x.direction)
  return orderBy(items, fields, direction)
}

function offset (items, { page, size }) {
  const begin = (page - 1) * size
  const end = page * size - 1
  return items.slice(begin, end + 1)
}

export { filter, sort, offset }
