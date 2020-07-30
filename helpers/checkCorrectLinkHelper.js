const checkCorrectEmail = value => (/.+@.+\..+/i.test(value) && value.length >= 8) || value.length === 0

const checkCorrectUrl = item => {
  const rules = ['http://', 'https://']
  return rules.some(x => (item.includes(x) && item.length >= 10) || item.length === 0)
}

export { checkCorrectUrl, checkCorrectEmail }
