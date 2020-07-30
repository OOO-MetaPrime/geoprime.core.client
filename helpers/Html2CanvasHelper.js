import html2canvas from 'html2canvas'

export default async el => {
  const canvas = await html2canvas(el)
  return canvas.toDataURL()
}
