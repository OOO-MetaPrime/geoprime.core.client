import get from 'lodash/get'
import moment from 'moment'

function filter (items, filters) {
  filters.forEach(filter => {
    if (filter.hideEmpty) {
      items = hideEmptyFilter(items, filter)
    }
    if (filter.value == null || filter.value === '') {
      return
    }
    switch (filter.operator) {
      case 'ilike':
        items = ilikeFilter(items, filter)
        break
      case '=':
        items = equalFilter(items, filter)
        break
      case '>':
        items = greaterFilter(items, filter)
        break
      case '>=':
        items = greaterOrEqualFilter(items, filter)
        break
      case '<':
        items = lessFilter(items, filter)
        break
      case '<=':
        items = lessOrEqualFilter(items, filter)
        break
      case '!=':
        items = notEqualFilter(items, filter)
        break
    }
  })
  return items
}

function hideEmptyFilter (items, filter) {
  return items.filter(x => get(x, filter.field) != null)
}

function ilikeFilter (items, filter) {
  const filterField = getFilterField(filter.field)
  const filterValue = String(filter.value).toLowerCase()
  return items.filter(x => String(get(x, filterField)).toLowerCase().includes(filterValue))
}

function getValue (value) {
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }

  return value
}

function getParsedDate (rawValue) {
  return moment(rawValue, ['DD.MM.YYYY', 'DD.MM.YY', 'DD.MM'], true)
}

function getEqualCondition (filter) {
  const filterField = getFilterField(filter.field)
  switch (filter.type) {
    case 'date':
      const parsedValue = getParsedDate(filter.value)
      return x => moment(get(x, filterField), 'YYYY-MM-DD').isSame(parsedValue, 'day')
    default:
      return x => get(x, filterField) === getValue(filter.value)
  }
}

function getGreaterCondition (filter) {
  const filterField = getFilterField(filter.field)
  switch (filter.type) {
    case 'date':
      const parsedValue = getParsedDate(filter.value)
      return x => moment(get(x, filterField), 'YYYY-MM-DD').isAfter(parsedValue, 'day')
    default:
      return x => get(x, filterField) > filter.value
  }
}

function getGreaterOrEqualCondition (filter) {
  const filterField = getFilterField(filter.field)
  switch (filter.type) {
    case 'date':
      const parsedValue = getParsedDate(filter.value)
      return x => moment(get(x, filterField), 'YYYY-MM-DD').isSameOrAfter(parsedValue, 'day')
    default:
      return x => get(x, filterField) >= filter.value
  }
}

function getLessCondition (filter) {
  const filterField = getFilterField(filter.field)
  switch (filter.type) {
    case 'date':
      const parsedValue = getParsedDate(filter.value)
      return x => moment(get(x, filterField), 'YYYY-MM-DD').isBefore(parsedValue, 'day')
    default:
      return x => get(x, filterField) < filter.value
  }
}

function getLessOrEqualCondition (filter) {
  const filterField = getFilterField(filter.field)
  switch (filter.type) {
    case 'date':
      const parsedValue = getParsedDate(filter.value)
      return x => moment(get(x, filterField), 'YYYY-MM-DD').isSameOrBefore(parsedValue, 'day')
    default:
      return x => get(x, filterField) <= filter.value
  }
}

function equalFilter (items, filter) {
  return items.filter(getEqualCondition(filter))
}

function greaterFilter (items, filter) {
  return items.filter(getGreaterCondition(filter))
}

function greaterOrEqualFilter (items, filter) {
  return items.filter(getGreaterOrEqualCondition(filter))
}

function lessFilter (items, filter) {
  return items.filter(getLessCondition(filter))
}

function lessOrEqualFilter (items, filter) {
  return items.filter(getLessOrEqualCondition(filter))
}

function notEqualFilter (items, filter) {
  const filterField = getFilterField(filter.field)
  return items.filter(x => get(x, filterField) !== filter.value)
}

function getFilterField (field) {
  const fieldLastCharIndex = field.length - 1
  const firstChar = field.charAt(0)
  const lastChar = field.charAt(fieldLastCharIndex)
  if (firstChar === '$' && lastChar === '$') {
    return field.substring(1, fieldLastCharIndex)
  }
  return field
}

export default filter
