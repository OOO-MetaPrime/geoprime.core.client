export default ({ item, nameField, columns }) => {
  if (!nameField) {
    return 'Без названия'
  }

  if (!nameField.isClassifier) {
    return item[nameField.key]
  }

  const nameColumn = columns.find(x => x.field === nameField.key)

  if (nameColumn) {
    return item[nameColumn.displayField][nameColumn.displayValue]
  }
  return 'Без названия'
}
