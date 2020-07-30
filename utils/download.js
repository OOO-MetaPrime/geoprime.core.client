import axios from 'axios'

export async function downloadFileGet (url) {
  const response = await axios.get(url, { responseType: 'blob' })
  downloadFile(response)
}

export async function downloadFilePost (url, data) {
  const response = await axios.post(url, data, { responseType: 'blob' })
  downloadFile(response)
}

function downloadFile (response) {
  // Content-disposition: attachment; filename="filename.ext"; filename*=UTF-8''encodedFilename.ext
  // Content-disposition: attachment; filename="filename.ext"
  const contentDisposition = response.headers['content-disposition'].split('; ')
  const encodedFilename = contentDisposition[2]
  const filename = encodedFilename
    ? decodeURI(encodedFilename.substring(17))
    : contentDisposition[1].replace(/^filename="/, '').replace(/"$/, '')
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(response.data, filename)
    return
  }
  const a = document.createElement('a')
  a.href = window.URL.createObjectURL(response.data)
  a.download = decodeURI(filename)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
