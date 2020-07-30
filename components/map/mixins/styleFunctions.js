import Style from 'ol/style/style'
import StyleCircle from 'ol/style/circle'
import Fill from 'ol/style/fill'
import Stroke from 'ol/style/stroke'
import RegularShape from 'ol/style/regularshape'
import LineString from 'ol/geom/linestring'
import Point from 'ol/geom/point'
import Icon from 'ol/style/icon'
import has from 'ol/has'
import Text from 'ol/style/text'
import DrawingStyles from '../enums/drawingStyles.js'

const shortLine = `data:image/svg+xml,%3Csvg height='16' id='svg3758' version='1.1'
  width='16' xmlns='http://www.w3.org/2000/svg' xmlns:cc='http://creativecommons.org/ns%23'
  xmlns:dc='http://purl.org/dc/elements/1.1/' xmlns:inkscape='http://www.inkscape.org/namespaces/inkscape'
  xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns%23' xmlns:sodipodi='http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd'
  xmlns:svg='http://www.w3.org/2000/svg'%3E%3Cdefs id='defs3760'/%3E%3Cg id='layer1'
  transform='translate(0,-1036.3622)'%3E%3Crect height='16' id='rect3770' style='fill:none;fill-opacity:1;stroke:none'
  width='16' x='0' y='1036.3622'/%3E%3Cpath d='M 1,8 15,8' id='path3768'
  style='fill:none;stroke:%23000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1'
  transform='translate(0,1036.3622)'/%3E%3C/g%3E%3C/svg%3E`

export default {
  methods: {
    setFeatureStyle (feature, zIndex) {
      const styleId = feature.get('style')
      let style = null
      switch (styleId) {
        case DrawingStyles.RedPoint: {
          style = this.getRedPoint(zIndex)
          break
        }
        case DrawingStyles.ConnectionPoint: {
          style = this.getConnectionPoint(zIndex)
          break
        }
        case DrawingStyles.RedLines: {
          style = this.getRedLines(zIndex)
          break
        }
        case DrawingStyles.ThinBlueLine: {
          style = this.getThinBlueLine(zIndex)
          break
        }
        case DrawingStyles.ThickGreenLine: {
          style = this.getThickGreenLine(zIndex)
          break
        }
        case DrawingStyles.RedLinesPolygon: {
          style = this.getRedLinesPolygon(zIndex)
          break
        }
        case DrawingStyles.HelperObjectPattern: {
          style = this.getHelperObjectPattern(zIndex)
          break
        }
        case DrawingStyles.ServitutePattern: {
          style = this.getPolygonStyle(this.getServitutePattern(), '#696969', null, zIndex)
          break
        }
        case DrawingStyles.AllowedPlacementPattern: {
          style = this.getPolygonStyle(this.getAllowedPlacementPattern(), '#000000', 2, zIndex)
          break
        }
        case DrawingStyles.OksPattern: {
          style = this.getPolygonStyle(this.getOksPattern(), '#696969', null, zIndex)
          break
        }
        case DrawingStyles.NumberingOksZonesStyle: {
          const number = feature.get('number')
          style = this.getNumberingOksZonesStyle(number, zIndex)
          break
        }
        case DrawingStyles.SizeStyle: {
          const title = feature.get('title')
          style = this.getSizeStyle(feature, title, zIndex)
          break
        }
        case DrawingStyles.PolygonStyle: {
          style = this.getPolyStyle(zIndex)
          break
        }
      }
      feature.setStyle(style)
      feature.set('originalStyle', style)
    },
    getRedPoint (zIndex) {
      // Красная точка
      return new Style({
        image: new StyleCircle({
          radius: 4,
          fill: new Fill({ color: 'red' }),
          stroke: new Stroke({ color: 'red', width: 2 })
        }),
        zIndex
      })
    },
    getConnectionPoint (zIndex) {
      // Точка подключения
      return new Style({
        image: new RegularShape({
          fill: new Fill({ color: 'black' }),
          stroke: new Stroke({ color: 'black', width: 1 }),
          points: 4,
          radius: 7,
          radius2: 0,
          angle: Math.PI / 4
        }),
        zIndex
      })
    },
    getRedLines (zIndex) {
      // Действующие красные линии
      return new Style({
        fill: new Fill({ color: 'red' }),
        stroke: new Stroke({ color: 'red', width: 2 }),
        zIndex
      })
    },
    getThinBlueLine (zIndex) {
      // Синяя тонкая
      return new Style({
        fill: new Fill({ color: 'blue' }),
        stroke: new Stroke({ color: 'blue', width: 1 }),
        zIndex
      })
    },
    getThickGreenLine (zIndex) {
      // Зеленая толстая
      return new Style({
        fill: new Fill({ color: 'green' }),
        stroke: new Stroke({ color: 'green', width: 3 }),
        zIndex
      })
    },
    getRedLinesPolygon (zIndex) {
      // Действующие красные линии
      return new Style({
        stroke: new Stroke({ color: 'red', width: 2 }),
        zIndex
      })
    },
    getHelperObjectPattern (zIndex) {
      // Вспомогательный объект
      return new Style({
        fill: new Fill({ color: 'green' }),
        zIndex
      })
    },
    getServitutePattern () {
      // Зона действия публичных сервитутов
      const { canvas, context } = this.getCanvas()

      context.beginPath()       // Начинает новый путь
      context.fillStyle = 'rgb(105, 105, 105)'
      context.moveTo(0, canvas.width)    // Передвигает перо
      context.lineTo(canvas.width, 0)  // Рисует линию до точки
      context.lineWidth = 1
      context.stroke()
      return context.createPattern(canvas, 'repeat')
    },
    getAllowedPlacementPattern () {
      // Зоны допустимого размещения зданий, строений, сооружений
      const { canvas, context } = this.getCanvas()

      context.beginPath()       // Начинает новый путь
      context.fillStyle = 'rgb(0, 0, 0)'
      context.moveTo(0, canvas.width)    // Передвигает перо
      context.lineTo(canvas.width, 0)  // Рисует линию до точки
      context.moveTo(0, 0)    // Передвигает перо
      context.lineTo(canvas.width, canvas.width)  // Рисует линию до точки
      context.lineWidth = 1
      context.stroke()
      return context.createPattern(canvas, 'repeat')
    },
    getOksPattern () {
      // Зона ОКС для гос. и муниципальных нужд
      const { canvas, context } = this.getCanvas(60)

      // пунктирные линии
      context.beginPath()       // Начинает новый путь
      context.strokeStyle = 'rgb(207, 207, 207)'
      context.fillStyle = 'rgb(207, 207, 207)'
      context.setLineDash([15, 13])
      context.moveTo(0, 60)    // Передвигает перо
      context.lineTo(60, 0)  // Рисует линию до точки
      context.lineWidth = 1
      context.stroke()

      context.beginPath()       // Начинает новый путь
      context.strokeStyle = 'rgb(207, 207, 207)'
      context.fillStyle = 'rgb(207, 207, 207)'
      context.setLineDash([])
      context.moveTo(0, 30)    // Передвигает перо
      context.lineTo(30, 0)  // Рисует линию до точки
      context.moveTo(30, 60)    // Передвигает перо
      context.lineTo(60, 30)  // Рисует линию до точки

      context.lineWidth = 1

      context.stroke()
      return context.createPattern(canvas, 'repeat')
    },
    getNumberingOksZonesStyle (number, zIndex) {
      return new Style({
        image: new StyleCircle({
          radius: 12,
          fill: new Fill({ color: 'white' }),
          stroke: new Stroke({ color: 'black', width: 1 })
        }),
        text: new Text({
          text: number.toString(),
          font: '18px "Roboto", Helvetica Neue, Helvetica, Arial, sans-serif',
          offsetY: 2,
          stroke: new Stroke({
            color: 'black'
          })
        }),
        zIndex
      })
    },
    getSizeStyle (feature, title, zIndex) {
      if (title) {
        const styles = []
        const geometry = feature.getGeometry()

        geometry.forEachSegment(function (start, end) {
          styles.push(new Style({
            geometry: new LineString([start, end]),
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({ color: 'black', width: 1 }),
            text: new Text({
              text: title.toString(),
              font: '17px "Roboto", Helvetica Neue, Helvetica, Arial, sans-serif',
              overflow: true,
              placement: 'line',
              textBaseline: 'bottom',
              fill: new Fill({ color: 'black' }),
              stroke: new Stroke({ color: 'black', width: 1 })
            }),
            zIndex
          }))
          const dx = end[0] - start[0]
          const dy = end[1] - start[1]
          const rotation = (-Math.atan2(dy, dx)) - Math.PI / 4
          styles.push(new Style({
            geometry: new Point(start),
            image: new Icon({
              src: shortLine,
              anchor: [0.4, 0.5],
              // imgSize: 16, IE ?
              rotation
            }),
            zIndex
          }))
          styles.push(new Style({
            geometry: new Point(end),
            image: new Icon({
              src: shortLine,
              anchor: [0.6, 0.5],
              // imgSize: 16, IE ?
              rotation
            }),
            zIndex
          }))
        })

        if (styles.length >= 5) {
          styles[0].text_.setText('')
          styles.splice(styles.length - 2)
        }

        return styles
      }
    },
    getPolygonStyle (pattern, strokeColor, strokeWidth = 1, zIndex) {
      const fill = new Fill()
      fill.setColor(pattern)
      const polyStyle = new Style({
        fill: fill,
        stroke: new Stroke({
          color: strokeColor,
          width: strokeWidth
        }),
        zIndex
      })

      return polyStyle
    },
    getPolyStyle (zIndex) {
      return new Style({
        fill: new Fill({ color: 'rgba(255, 255, 0, 0)' }),
        stroke: new Stroke({ color: 'red', width: 2 }),
        zIndex
      })
    },
    getCanvas (size = 20) {
      var canvas = document.createElement('canvas')
      var context = canvas.getContext('2d')

      // Gradient and pattern are in canvas pixel space, so we adjust for the
      // renderer's pixel ratio
      var pixelRatio = has.DEVICE_PIXEL_RATIO

      canvas.width = size * pixelRatio
      canvas.height = size * pixelRatio

      return { canvas, context }
    }
  }
}
