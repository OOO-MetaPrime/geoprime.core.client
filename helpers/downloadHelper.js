function downloadDataUrl (dataUrl, fileName) {
  if (navigator.msSaveBlob) {
    const blob = dataURItoBlob(dataUrl)
    navigator.msSaveBlob(blob, fileName)
    return
  }
  const url = dataUrl
  var link = document.createElement('a')
  link.download = fileName
  link.href = url

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return
}

function dataURItoBlob (dataURI) {
  // convert base64 to raw binary data held in a string
  var byteString = atob(dataURI.split(',')[1])

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length)
  var ia = new Uint8Array(ab)
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }

  return new Blob([ab], { type: mimeString })
}

function downloadUrl (url, name, data) {
  var form = getDownloadForm()
  var hidden = form.getElementsByTagName('input')[0]

  form.action = url

  hidden.name = name
  hidden.value = data

  form.submit()
}

function getDownloadForm () {
  var id = 'download-file'
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

  form.appendChild(hiddenElement)

  document.body.appendChild(form)

  return form
}

export { downloadUrl, downloadDataUrl }
