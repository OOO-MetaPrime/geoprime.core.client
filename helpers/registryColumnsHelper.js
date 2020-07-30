import moment from 'moment'
import { checkCorrectEmail, checkCorrectUrl } from '^/helpers/checkCorrectLinkHelper'

const booleanLookupSource = [{
  id: true,
  name: 'Да'
}, {
  id: false,
  name: 'Нет'
}, {
  id: null,
  name: 'Нет'
}]

const invertBooleanLookupSource = [{
  id: true,
  name: 'Нет'
}, {
  id: false,
  name: 'Да'
}, {
  id: null,
  name: 'Да'
}]

const getFilterColumnOperator = column => {
  if (column.isClassifier) {
    return column.foreignTableDisplayColumnParams.isNumeric ? '=' : 'ilike'
  }
  if (column.isNumeric) {
    return '='
  }
  if (column.isDate) {
    return '='
  }
  if (column.isDateTime) {
    return '='
  }
  return 'ilike'
}

const getColumnRenderFunc = column => {
  if (column.isBoolean) {
    return value => {
      if (value === true) {
        return 'Да'
      } else if (value === false) {
        return 'Нет'
      }
      return ''
    }
  }
  if (column.isDateTime) {
    return value => {
      if (value) {
        return moment(value).format('L LT')
      }
    }
  }
  if (column.isDate) {
    return value => {
      if (value) {
        return moment(value).format('L')
      }
    }
  }
}

const getColumnDataType = column => {
  if (column.isDate) {
    return 'date'
  }
  if (column.isDateTime) {
    return 'datetime'
  }
  if (column.isNumeric) {
    return 'number'
  }
}

const openInNewWindow = (selectedItem, column) => {
  const item = selectedItem[column.field]
  const conditionCorrectUrl = checkCorrectUrl(item)

  if (!conditionCorrectUrl) {
    this.$error('Не корректный адрес')
    return
  }
  window.open(`${item}`)
}

const openEmail = (selectedItem, column) => {
  const item = selectedItem[column.field]
  const conditionCorrectEmail = checkCorrectEmail(item)
  if (!conditionCorrectEmail) {
    this.$error('Не корректный адрес')
    return
  }
  window.open(`mailto:${item}`)
}

const getLookupFilterOperator = filter => {
  if (filter.value === 'true') {
    return {
      field: filter.field,
      operator: '=',
      value: true
    }
  } else {
    return {
      field: filter.field,
      operator: '=',
      value: false
    }
  }
}

const getTextFilterOperator = (columns, filter) => {
  const column = columns.find(x => (x.filterField || x.field) === filter.field)
  return {
    field: filter.field,
    operator: column.textFilterOperator,
    value: filter.value,
    hideEmpty: filter.hideEmpty
  }
}

const getNumberFilterOperator = filter => {
  return {
    field: filter.field,
    operator: filter.operator,
    value: filter.value,
    hideEmpty: filter.hideEmpty
  }
}

const getDateFilterOperator = filter => {
  return {
    field: filter.field,
    operator: filter.operator,
    value: filter.value,
    hideEmpty: filter.hideEmpty,
    type: filter.type
  }
}

const getAsyncLookupOperator = filter => {
  return {
    field: filter.field,
    operator: filter.operator,
    value: filter.value
  }
}
const getFilterOperator = (columns, filter) => {
  switch (filter.type) {
    case 'lookup':
      return getLookupFilterOperator(filter)
    case 'number':
      return getNumberFilterOperator(filter)
    case 'date':
    case 'datetime':
      return getDateFilterOperator(filter)
    case 'asyncselect' :
      return getAsyncLookupOperator(filter)
    default:
      return getTextFilterOperator(columns, filter)
  }
}

const mapParams = (params, columns) => {
  const filters = params.filters.map(filter => getFilterOperator(columns, filter))

  return {
    filters: filters,
    page: params.page,
    size: params.size,
    sorting: params.sorting
  }
}

const getFilter = (column, value = null) => {
  if (column.key === 'year') {
    for (const item of value) {
      if (item.field === 'year') {
        return { type: 'number', operator: '=', value: item.value }
      }
    }
  }
  if (column.isBoolean) {
    return { type: 'lookup', source: booleanLookupSource }
  }
  if (column.isNumeric) {
    return { type: 'number', operator: '=' }
  }
  if (column.isDate) {
    return { type: 'date', operator: '=' }
  }
  if (column.isDateTime) {
    return { type: 'datetime', operator: '=' }
  }
  return undefined
}

function validateRequiredField (column, value) {
  return value != null && value !== ''
}

function validateTextField (column, value) {
  return new RegExp(column.validationRegexp).test(value)
}

function validateIntegerField (column, value) {
  if (value === '' || value == null) {
    return true
  }
  if (typeof (value) === 'string') {
    if (value.length > 15) {
      return false
    }
    if (value.indexOf('.') !== -1) {
      return false
    }
  }

  if (value != null) {
    const parsedValue = Number(value)
    if (isNaN(parsedValue) || !Number.isInteger(parsedValue)) {
      return false
    }
  }

  return true
}

function validateNumericField (column, value) {
  if (value === '' || value == null) {
    return true
  }

  if (typeof (value) === 'string') {
    if (value.indexOf('.') !== -1 && value.length > 17) {
      return false
    }

    if (value.indexOf('.') === -1 && value.length > 16) {
      return false
    }
  }
  const parsedValue = Number(value)
  if (isNaN(parsedValue)) {
    return false
  }

  return true
}

function validateNumericRangeField (column, value) {
  if (value === '' || value == null) {
    return true
  }
  const parsedValue = Number(value)
  if (isNaN(parsedValue)) {
    return false
  }
  if (column.minValue != null) {
    const minValue = Number(column.minValue)
    if (parsedValue < minValue) {
      return false
    }
  }
  if (column.maxValue != null) {
    const maxValue = Number(column.maxValue)
    if (parsedValue > maxValue) {
      return false
    }
  }

  return true
}

function countDecimals (value) {
  if (value == null || value === '') {
    return 0
  }
  if (Math.floor(value) === value) {
    return 0
  }
  const decimalPart = value.toString().split('.')[1]
  if (!decimalPart) {
    return 0
  }

  return decimalPart.length || 0
}

function getColumnValidators (column, customValidator) {
  const validators = []
  if (column.isNotNull && column.key !== 'id') {
    validators.push(value => validateRequiredField(column, value))
  }
  if (column.isNumeric && !column.isInteger) {
    validators.push(value => validateNumericField(column, value))
  }

  if (column.isInteger) {
    validators.push(value => validateIntegerField(column, value))
  }

  if (column.isNumeric && (column.minValue != null || column.maxValue != null)) {
    validators.push(value => validateNumericRangeField(column, value))
  }

  if (column.validationRegexp) {
    validators.push(value => validateTextField(column, value))
  }

  if (customValidator) {
    validators.push(value => customValidator(column, value))
  }

  return validators
}

function getColumnsValidators (columns, customValidator) {
  const validators = {}

  for (const column of columns) {
    validators[column.key] = getColumnValidators(column, customValidator)
  }

  return validators
}

function isValidValue (columnValidators, column, value) {
  if (!columnValidators || !columnValidators.length) {
    return true
  }
  return columnValidators.every(x => x(value))
}

function isValidItem (validators, columns, item) {
  if (!columns.length) {
    return true
  }
  return columns.every(x => isValidValue(validators[x.key], x, item[x.key]))
}

export {
  getFilterColumnOperator,
  getColumnRenderFunc,
  getColumnDataType,
  invertBooleanLookupSource,
  booleanLookupSource,
  openInNewWindow,
  openEmail,
  mapParams,
  getFilter,
  getColumnValidators,
  getColumnsValidators,
  isValidValue,
  isValidItem,
  countDecimals
}
