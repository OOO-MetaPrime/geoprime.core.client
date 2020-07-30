import axios from 'axios'

async function downloadFileAxios (url, data, options = {}) {
  const file = await axios.post(url, data, { responseType: 'blob', ...options })
  // Content-disposition: attachment; filename="filename.ext"; filename*=UTF-8''encodedFilename.ext
  // Content-disposition: attachment; filename="filename.ext"
  const contentDisposition = file.headers['content-disposition'].split(';')
  const encodedFilename = contentDisposition[1]
  const filename = decodeURI(encodedFilename.replace(/^filename="/, '').replace(/"$/, ''))
  const a = document.createElement('a')
  a.href = window.URL.createObjectURL(file.data)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function downloadFile (url, name, data, method = 'POST') {
  var form = getDownloadForm(method)
  var hidden = form.getElementsByTagName('input')[0]

  form.action = url

  if (name) {
    hidden.name = name
  }
  if (data) {
    hidden.value = data
  }

  form.submit()
}

function downloadFileWithMetadata (url, name, value, metadata) {
  const form = getDownloadFormWithMetadata(name, value, metadata)
  const hiddenElement = form.getElementsByTagName('input')[0]
  hiddenElement.name = name
  hiddenElement.value = value
  const hiddenMetadata = form.getElementsByTagName('input')[1]
  hiddenMetadata.name = metadata.name
  hiddenMetadata.value = metadata.value

  form.action = url
  form.submit()
}

function getDownloadFormWithMetadata (name, value, metadata) {
  var id = 'download-file-metadata'
  var form = document.getElementById(id)

  if (form) {
    return form
  }

  form = document.createElement('form')

  form.id = id
  form.method = 'POST'
  form.target = '_blank'

  var hiddenElement = document.createElement('input')

  hiddenElement.type = 'hidden'
  hiddenElement.name = name
  hiddenElement.value = value

  var hiddenMetadata = document.createElement('input')

  hiddenMetadata.type = 'hidden'
  hiddenMetadata.name = metadata.name
  hiddenMetadata.value = metadata.value

  form.appendChild(hiddenElement)
  form.appendChild(hiddenMetadata)

  document.body.appendChild(form)

  return form
}

function getDownloadForm (method) {
  var id = 'download-file'
  var form = document.getElementById(id)

  if (form) {
    return form
  }

  form = document.createElement('form')

  form.id = id
  form.method = method
  form.target = '_blank'

  var hiddenElement = document.createElement('input')

  hiddenElement.type = 'hidden'

  form.appendChild(hiddenElement)

  document.body.appendChild(form)

  return form
}

export default { downloadFile, downloadFileWithMetadata, downloadFileAxios }
