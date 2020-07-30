import Point from 'ol/geom/point'
import Feature from 'ol/feature'
import Draw from 'ol/interaction/draw'
import Select from 'ol/interaction/select'
import condition from 'ol/events/condition'
import Style from 'ol/style/style'
import Fill from 'ol/style/fill'
import Stroke from 'ol/style/stroke'
import WKT from 'ol/format/wkt'
import StyleCircle from 'ol/style/circle'
import LineString from 'ol/geom/linestring'
import Text from 'ol/style/text'
import DrawingStyles from '../enums/drawingStyles.js'
import VectorSource from 'ol/source/vector'
import GeoJSON from 'ol/format/geojson'

const numberOksZonesStyleId = 10
const sizeStyleId = 11
const polygonStyleId = 12
const selectStyle = new Style({
  fill: new Fill({ color: 'rgba(229, 209, 209, 0.25)' }),
  stroke: new Stroke({ color: 'red', width: 2 })
})
const markStyle = new Style({
  image: new StyleCircle({
    fill: new Fill({ color: 'rgba(63, 116, 191, 0.4)' }),
    stroke: new Stroke({ color: 'rgb(63, 63, 191)', width: 2 }),
    radius: 10
  }),
  fill: new Fill({ color: 'rgba(63, 116, 191, 0.4)' }),
  stroke: new Stroke({ color: 'rgb(63, 63, 191)', width: 1 }),
  zIndex: 999
})

export default {
  data () {
    return {
      markStyle,
      points: [],
      lines: []
    }
  },
  methods: {
    getNumberOfDigits (number) {
      return Math.log(number) * Math.LOG10E + 1 | 0
    },
    numberingOksZones (numbering) {
      if (!numbering) {
        this.map.un('singleclick', this.setNumberOksZones)
        this.currentDrawType = null
        return
      }

      this.map.on('singleclick', this.setNumberOksZones)
    },
    setNumberOksZones (event) {
      this.coordinate = event.coordinate
      this.$refs.setNumberOksZonesDialog.open()
      event.stopPropagation()
    },
    async onNumberSet (number) {
      const numberingPoint = new Point(this.coordinate)
      const numberingPointFeature = new Feature(numberingPoint)
      numberingPointFeature.set('graphics', true)
      numberingPointFeature.set('movable', true)
      numberingPointFeature.set('style', numberOksZonesStyleId)
      numberingPointFeature.set('number', number)
      this.setFeatureStyle(numberingPointFeature)
      this.vectorLayer.getSource().addFeature(numberingPointFeature)
      event.stopPropagation()
      await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
    },
    drawSize (size) {
      if (!size) {
        this.sizeDraw.un('drawend', this.onDrawEnd)
        this.map.removeInteraction(this.sizeDraw)
        this.currentDrawType = null
        return
      }

      const draw = new Draw({
        source: this.vectorLayer.getSource(),
        type: 'LineString',
        maxPoints: 3
      })
      this.sizeDraw = draw
      this.map.addInteraction(this.sizeDraw)

      draw.on('drawend', this.onDrawEnd)
    },
    onDrawEnd (event) {
      this.sizeFeature = event.feature
      this.$refs.setSizeDialog.open()
    },
    async onSizeSet (title) {
      if (!title) {
        this.vectorLayer.getSource().removeFeature(this.sizeFeature)
        return
      }

      this.sizeFeature.set('graphics', true)
      this.sizeFeature.set('movable', false)
      this.sizeFeature.set('style', sizeStyleId)
      this.sizeFeature.set('title', title)
      this.setFeatureStyle(this.sizeFeature)
      await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
    },
    onSizeCancel () {
      this.vectorLayer.getSource().removeFeature(this.sizeFeature)
    },
    polygonsUnion (union) {
      if (!union) {
        this.map.un('select', this.onSelectUnionFeature)
        if (this.unionSelection) {
          this.map.removeInteraction(this.unionSelection)
        }
        this.polygonUnionFeatures.splice(0, this.polygonUnionFeatures.length)
        this.currentDrawType = null
        return
      }

      if (!this.unionSelection) {
        this.unionSelection = new Select({
          condition: condition.click,
          layers: [this.vectorLayer]
        })
        this.unionSelection.on('select', this.onSelectUnionFeature)
      }

      this.map.addInteraction(this.unionSelection)
    },
    async onSelectUnionFeature (event) {
      if (event.selected.length === 0) {
        if (this.lastSelectedFeature) {
          const style = this.polygonUnionFeatures[0].get('originalStyle')
          this.polygonUnionFeatures[0].setStyle(style)
          this.polygonUnionFeatures.splice(0, this.polygonUnionFeatures.length)
          return
        } else {
          this.polygonUnionFeatures[0].setStyle(selectStyle)
        }
      }

      if (!event.selected[0]) {
        this.unionSelection.getFeatures().remove(this.polygonUnionFeatures[0])
        this.unionSelection.getFeatures().remove(this.polygonUnionFeatures[1])
        this.lastSelectedFeature = null
        return
      }

      if (event.selected && event.selected[0].get('graphics') && event.selected.length > 0) {
        const selectedFeature = event.selected[0]
        this.lastSelectedFeature = selectedFeature
        // Highlight currently selected polygon
        selectedFeature.setStyle(selectStyle)
        this.polygonUnionFeatures.push(selectedFeature)

        if (this.polygonUnionFeatures.length === 2) {
          const formatWkt = new WKT()
          const polygonGeometry1 = this.polygonUnionFeatures[0].getGeometry()
          const wktPolygon1 = formatWkt.writeGeometry(polygonGeometry1)
          const polygonGeometry2 = this.polygonUnionFeatures[1].getGeometry()
          const wktPolygon2 = formatWkt.writeGeometry(polygonGeometry2)

          const isIntersection = await this.customApi.developedDocuments.polygonsIntersection(wktPolygon1, wktPolygon2)
          if (isIntersection.intersects) {
            const wktResultPolygon = await this.customApi.developedDocuments.polygonsUnion(wktPolygon1, wktPolygon2)
            const resultPolygon = formatWkt.readGeometry(wktResultPolygon)
            const firstFeature = this.polygonUnionFeatures[0]
            const resultFeature = new Feature()
            resultFeature.set('graphics', true)
            resultFeature.set('movable', true)
            resultFeature.set('style', firstFeature.get('style'))
            resultFeature.setGeometry(resultPolygon)
            this.setFeatureStyle(resultFeature)
            this.vectorLayer.getSource().addFeature(resultFeature)
            this.unionSelection.getFeatures().remove(this.polygonUnionFeatures[0])
            this.unionSelection.getFeatures().remove(this.polygonUnionFeatures[1])
            this.vectorLayer.getSource().removeFeature(this.polygonUnionFeatures[0])
            this.vectorLayer.getSource().removeFeature(this.polygonUnionFeatures[1])
            this.polygonUnionFeatures.splice(0, this.polygonUnionFeatures.length)
            await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
          } else {
            // Unhighlight selected polygons
            this.polygonUnionFeatures[0].setStyle(this.polygonUnionFeatures[0].get('originalStyle'))
            this.polygonUnionFeatures[1].setStyle(this.polygonUnionFeatures[1].get('originalStyle'))
            this.unionSelection.getFeatures().remove(this.polygonUnionFeatures[0])
            this.unionSelection.getFeatures().remove(this.polygonUnionFeatures[1])
            this.polygonUnionFeatures.splice(0, this.polygonUnionFeatures.length)
          }
        }
      }
    },
    polygonsSubtract (subtract) {
      if (!subtract) {
        this.map.un('select', this.onSelectSubtractFeature)
        if (this.subtractSelection) {
          this.map.removeInteraction(this.subtractSelection)
        }
        this.polygonSubtractFeatures.splice(0, this.polygonSubtractFeatures.length)
        this.currentDrawType = null
        return
      }

      if (!this.subtractSelection) {
        this.subtractSelection = new Select({
          condition: condition.click,
          layers: [this.vectorLayer]
        })
        this.subtractSelection.on('select', this.onSelectSubtractFeature)
      }

      this.map.addInteraction(this.subtractSelection)
    },
    async onSelectSubtractFeature (event) {
      if (event.selected.length === 0) {
        if (this.lastSelectedFeature) {
          const style = this.polygonSubtractFeatures[0].get('originalStyle')
          this.polygonSubtractFeatures[0].setStyle(style)
          this.polygonSubtractFeatures.splice(0, this.polygonSubtractFeatures.length)
          return
        } else {
          this.polygonSubtractFeatures[0].setStyle(selectStyle)
        }
      }
      if (!event.selected[0]) {
        this.subtractSelection.getFeatures().remove(this.polygonSubtractFeatures[0])
        this.subtractSelection.getFeatures().remove(this.polygonSubtractFeatures[1])
        this.firstSelectedFeature = null
        return
      }

      if (event.selected && event.selected[0].get('graphics') && event.selected.length > 0) {
        const selectedFeature = event.selected[0]
        this.firstSelectedFeature = selectedFeature
        // Highlight currently selected polygon
        selectedFeature.setStyle(selectStyle)
        this.polygonSubtractFeatures.push(selectedFeature)

        if (this.polygonSubtractFeatures.length === 2) {
          const formatWkt = new WKT()
          const polygonGeometry1 = this.polygonSubtractFeatures[0].getGeometry()
          const wktPolygon1 = formatWkt.writeGeometry(polygonGeometry1)
          const polygonGeometry2 = this.polygonSubtractFeatures[1].getGeometry()
          const wktPolygon2 = formatWkt.writeGeometry(polygonGeometry2)

          const isIntersection = await this.customApi.developedDocuments.polygonsIntersection(wktPolygon1, wktPolygon2)
          if (isIntersection.intersects) {
            const wktResultPolygon = await this.customApi.developedDocuments.polygonsSubtract(wktPolygon1, wktPolygon2)
            for (const wktPolygon of wktResultPolygon) {
              const firstFeature = this.polygonSubtractFeatures[0]
              const resultPolygon = formatWkt.readGeometry(wktPolygon)
              const resultFeature = new Feature()
              resultFeature.set('graphics', true)
              resultFeature.set('movable', true)
              resultFeature.set('style', firstFeature.get('style'))
              resultFeature.setGeometry(resultPolygon)
              this.setFeatureStyle(resultFeature)
              this.vectorLayer.getSource().addFeature(resultFeature)
            }
            this.subtractSelection.getFeatures().remove(this.polygonSubtractFeatures[0])
            this.subtractSelection.getFeatures().remove(this.polygonSubtractFeatures[1])
            this.vectorLayer.getSource().removeFeature(this.polygonSubtractFeatures[0])
            this.vectorLayer.getSource().removeFeature(this.polygonSubtractFeatures[1])
            this.polygonSubtractFeatures.splice(0, this.polygonSubtractFeatures.length)
            await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
          } else {
            // Unhighlight selected polygons
            this.polygonSubtractFeatures[0].setStyle(this.polygonSubtractFeatures[0].get('originalStyle'))
            this.polygonSubtractFeatures[1].setStyle(this.polygonSubtractFeatures[1].get('originalStyle'))
            this.subtractSelection.getFeatures().remove(this.polygonSubtractFeatures[0])
            this.subtractSelection.getFeatures().remove(this.polygonSubtractFeatures[1])
            this.polygonSubtractFeatures.splice(0, this.polygonSubtractFeatures.length)
          }
        }
      }
    },
    pointStyle (i, coordinate) {
      return new Style({
        image: new StyleCircle({
          radius: 4,
          fill: new Fill({
            color: 'black'
          }),
          stroke: new Stroke({
            color: 'black',
            width: 2
          })
        }),
        text: new Text({
          text: i.toString(),
          font: '12px sans-serif',
          offsetY: -20,
          stroke: new Stroke({
            color: 'black'
          }),
          fill: new Fill({
            color: 'black'
          })
        }),
        geometry: function (feature) {
          return new Point(coordinate)
        }
      })
    },
    contourStyle (feature) {
      const coordinates = feature.getGeometry().getCoordinates()[0]
      const styles = [
        new Style({
          stroke: new Stroke({
            color: 'black',
            width: 2
          })
        })
      ]

      for (let i = 1; i < coordinates.length; i++) {
        styles.push(this.pointStyle(i, coordinates[i]))
      }
      return styles
    },
    pointMarkStyle (i, coordinate) {
      return new Style({
        image: new StyleCircle({
          radius: 4,
          fill: new Fill({
            color: 'rgba(63, 116, 191, 0.4)'
          }),
          stroke: new Stroke({
            color: 'rgba(63, 116, 191, 0.4)',
            width: 2
          })
        }),
        text: new Text({
          text: i.toString(),
          font: '12px sans-serif',
          offsetY: -20,
          stroke: new Stroke({
            color: 'rgba(63, 116, 191, 0.4)'
          }),
          fill: new Fill({
            color: 'rgba(63, 116, 191, 0.4)'
          })
        }),
        geometry: function (feature) {
          return new Point(coordinate)
        }
      })
    },
    contourMarkStyle (feature) {
      const coordinates = feature.getGeometry().getCoordinates()[0]
      const styles = [
        new Style({
          stroke: new Stroke({
            color: 'rgba(63, 116, 191, 0.4)',
            width: 2
          })
        })
      ]

      for (let i = 1; i < coordinates.length; i++) {
        styles.push(this.pointMarkStyle(i, coordinates[i]))
      }
      return styles
    },
    async markObject (mark) {
      if (!mark) {
        if (this.lastSelectedFeature) {
          const graphicsExists = this.lastSelectedFeature.getKeys().includes('graphics')
          if (graphicsExists) {
            const style = this.lastSelectedFeature.get('originalStyle')
            this.lastSelectedFeature.setStyle(style)
          } else {
            this.lastSelectedFeature.setStyle(this.contourStyle(this.lastSelectedFeature))
          }
          this.lastSelectedFeature = null
        }
        this.intersectedFeatures = []
        this.map.un('click', this.onMarkObject)
        this.currentDrawType = null
        return
      }

      this.map.on('click', this.onMarkObject)
    },
    onMarkObject (event) {
      const allFeatures = this.vectorLayer.getSource().getFeatures()
      const drawnFeatures = allFeatures.filter(x => x.get('isContour') || x.get('graphics'))

      this.intersectedFeatures = []
      const unorderedFeatures = []
      this.map.forEachFeatureAtPixel(event.pixel, feature => {
        if (drawnFeatures.includes(feature)) {
          unorderedFeatures.push(feature)
        }
      }, {
        hitTolerance: 5
      })
      this.intersectedFeatures = drawnFeatures.filter(x => unorderedFeatures.includes(x))

      if (!this.lastSelectedFeature && this.intersectedFeatures.length) {
        if (this.intersectedFeatures[this.intersectedFeatures.length - 1].get('isContour') === true) {
          this.intersectedFeatures[this.intersectedFeatures.length - 1].setStyle(this.contourMarkStyle(this.intersectedFeatures[this.intersectedFeatures.length - 1]))
        } else {
          this.intersectedFeatures[this.intersectedFeatures.length - 1].setStyle(markStyle)
        }
        this.lastSelectedFeature = this.intersectedFeatures[this.intersectedFeatures.length - 1]
        this.setArrowsActivity()
        return
      }

      const insideIndex = this.intersectedFeatures.indexOf(this.lastSelectedFeature)
      if (insideIndex !== -1) {
        const graphicsExists = this.lastSelectedFeature.getKeys().includes('graphics')

        if (graphicsExists) {
          const style = this.lastSelectedFeature.get('originalStyle')
          this.lastSelectedFeature.setStyle(style)
        } else {
          this.lastSelectedFeature.setStyle(this.contourStyle(this.lastSelectedFeature))
        }
        this.lastSelectedFeature = null
        this.setArrowsDisabled()

        if (this.intersectedFeatures.length > 1) {
          if (insideIndex === 0) {
            this.intersectedFeatures[this.intersectedFeatures.length - 1].setStyle(markStyle)
            this.lastSelectedFeature = this.intersectedFeatures[this.intersectedFeatures.length - 1]
            this.setArrowsActivity()
          } else {
            if (this.intersectedFeatures[insideIndex - 1].get('isContour') === true) {
              this.intersectedFeatures[insideIndex - 1].setStyle(this.contourMarkStyle(this.intersectedFeatures[insideIndex - 1]))
            } else {
              this.intersectedFeatures[insideIndex - 1].setStyle(markStyle)
            }
            this.lastSelectedFeature = this.intersectedFeatures[insideIndex - 1]
            this.setArrowsActivity()
          }
        }
      } else {
        if (this.lastSelectedFeature) {
          const graphicsExists = this.lastSelectedFeature.getKeys().includes('graphics')

          if (graphicsExists) {
            const style = this.lastSelectedFeature.get('originalStyle')
            this.lastSelectedFeature.setStyle(style)
          } else {
            this.lastSelectedFeature.setStyle(this.contourStyle(this.lastSelectedFeature))
            this.lastSelectedFeature = null
          }

          if (this.intersectedFeatures.length > 0) {
            if (this.intersectedFeatures[this.intersectedFeatures.length - 1].get('isContour') === true) {
              this.intersectedFeatures[this.intersectedFeatures.length - 1].setStyle(this.contourMarkStyle(this.intersectedFeatures[this.intersectedFeatures.length - 1]))
            } else {
              this.intersectedFeatures[this.intersectedFeatures.length - 1].setStyle(markStyle)
            }
            this.lastSelectedFeature = this.intersectedFeatures[this.intersectedFeatures.length - 1]
            this.setArrowsActivity()
          } else {
            this.lastSelectedFeature = null
            this.setArrowsDisabled()
          }
        }
      }

      return
    },
    setArrowsActivity () {
      const features = this.vectorLayer.getSource().getFeaturesCollection()
      this.selectedIndex = this.getFeatureIndex(this.lastSelectedFeature)
      if (this.selectedIndex === 0) {
        this.isMoveUpAllowed = true
        this.isMoveDownAllowed = false
        this.isMoveToTopAllowed = true
        this.isMoveToBottomAllowed = false
      }
      if (this.selectedIndex === features.getLength() - 1) {
        this.isMoveUpAllowed = false
        this.isMoveDownAllowed = true
        this.isMoveToTopAllowed = false
        this.isMoveToBottomAllowed = true
      }
      if (this.selectedIndex > 0 && this.selectedIndex < features.getLength() - 1) {
        this.isMoveUpAllowed = true
        this.isMoveDownAllowed = true
        this.isMoveToTopAllowed = true
        this.isMoveToBottomAllowed = true
      }
    },
    setArrowsDisabled () {
      this.isMoveUpAllowed = false
      this.isMoveDownAllowed = false
      this.isMoveToTopAllowed = false
      this.isMoveToBottomAllowed = false
    },
    async moveObjectUp () {
      const features = this.vectorLayer.getSource().getFeaturesCollection()
      this.selectedIndex = this.getFeatureIndex(this.lastSelectedFeature) + 1

      features.remove(this.lastSelectedFeature)
      features.insertAt(this.selectedIndex, this.lastSelectedFeature)

      await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())

      this.refresh()
    },
    async moveObjectDown () {
      const features = this.vectorLayer.getSource().getFeaturesCollection()
      this.selectedIndex = this.getFeatureIndex(this.lastSelectedFeature) - 1

      features.remove(this.lastSelectedFeature)
      features.insertAt(this.selectedIndex, this.lastSelectedFeature)

      await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())

      this.refresh()
    },
    async moveObjectToTop () {
      const features = this.vectorLayer.getSource().getFeaturesCollection()
      this.selectedIndex = features.getLength() - 1

      features.remove(this.lastSelectedFeature)
      features.insertAt(features.getLength(), this.lastSelectedFeature)

      await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())

      this.refresh()
    },
    async moveObjectToBottom () {
      const features = this.vectorLayer.getSource().getFeaturesCollection()

      features.remove(this.lastSelectedFeature)
      features.insertAt(0, this.lastSelectedFeature)

      await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())

      this.refresh()
    },
    async bufferByObject (active) {
      if (!active) {
        this.map.un('select', this.onBufferByObject)
        if (this.bufferByObjectSelection) {
          this.map.removeInteraction(this.bufferByObjectSelection)
        }
        this.currentDrawType = 'mark'
        return
      }

      if (!this.bufferByObjectSelection) {
        this.bufferByObjectSelection = new Select({
          condition: condition.click,
          layers: [this.vectorLayer]
        })
        this.bufferByObjectSelection.on('select', this.onBufferByObject)
      }

      this.map.addInteraction(this.bufferByObjectSelection)

      let numberOfSides = 0
      const feature = this.lastSelectedFeature
      this.indexLast = this.getFeatureIndex(this.lastSelectedFeature)
      const featureGeo = feature.getGeometry()
      const coords = featureGeo.getCoordinates()
      if (featureGeo.getType() === 'LineString') {
        numberOfSides = coords.length - 1
      } else {
        numberOfSides = coords[0].length - 1
      }

      const formatWkt = new WKT()
      this.bufferPolygonGeo = formatWkt.writeGeometry(featureGeo)

      if (featureGeo.getType() === 'LineString') {
        for (let i = 0; i < coords.length - 1; i++) {
          this.points.push(coords[i])
          this.points.push(coords[i + 1])
          this.createHelperLines(i)
        }
      } else {
        for (let i = 0; i < coords[0].length - 1; i++) {
          this.points.push(coords[0][i])
          this.points.push(coords[0][i + 1])
          this.createHelperLines(i)
        }
      }
      this.bufferByObjectSelection.getFeatures().clear()
      this.isCreateBufferButtonInactive = false
      this.$refs.setBufferDialog.open(numberOfSides, featureGeo.getType())
    },
    createHelperLines (index) {
      const line = new Feature({
        geometry: new LineString(this.points)
      })
      line.setStyle(
        new Style({
          fill: new Fill({ color: 'black' }),
          stroke: new Stroke({ color: 'black', width: 1 }),
          text: new Text({
            text: (index + 1).toString(),
            font: '18px "Roboto", Helvetica Neue, Helvetica, Arial, sans-serif',
            textBaseline: 'bottom',
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({ color: 'black', width: 1 })
          })
        })
      )
      line.set('graphics', true)
      this.lines.push(line)
      this.vectorLayer.getSource().addFeature(line)
      this.points.length = 0
    },
    onSetBuffer (bufferSettings) {
      const geometryType = this.lastSelectedFeature.getGeometry().getType()
      let finalBufferSettings = Object.assign({}, bufferSettings)

      if (geometryType === 'Polygon' && bufferSettings.pickedType === 'object') {
        if (bufferSettings.bufferZoneType === 2 && bufferSettings.drawingStyle === 8) {
          this.createZoneOfAcceptableObjectPlacement(finalBufferSettings)
        } else {
          this.createBuffer(finalBufferSettings)
        }
      } else if (geometryType === 'Point' && bufferSettings.pickedType === 'buffer') {
        this.createBuffer(finalBufferSettings)
      } else if (geometryType === 'LineString' && bufferSettings.pickedType === 'buffer') {
        finalBufferSettings.bufferZoneType = 0
        this.createBuffer(finalBufferSettings)
      } else if (geometryType === 'Polygon' && bufferSettings.pickedType === 'buffer') {
        if (bufferSettings.bufferZoneType === 0) {
          this.createOuterBuffer(finalBufferSettings)
        } else if (bufferSettings.bufferZoneType === 1) {
          this.createInnerBuffer(finalBufferSettings)
        } else {
          this.createInnerOuterBuffer(finalBufferSettings)
        }
      }
      this.isCreateBufferButtonInactive = true
    },
    async createBuffer (finalBufferSettings) {
      let resultPolygonGeo = null

      if (finalBufferSettings.sideOffsets.length === 0) {
        resultPolygonGeo = await this.createStandardBuffer(finalBufferSettings)
      } else {
        resultPolygonGeo = await this.createCustomBuffer(finalBufferSettings)
      }

      const formatWkt = new WKT()
      const resultPolygon = formatWkt.readGeometry(resultPolygonGeo)

      this.displayBufferedObject(finalBufferSettings, [resultPolygon])
    },
    async createStandardBuffer (finalBufferSettings) {
      finalBufferSettings.geometry = this.bufferPolygonGeo
      return await this.customApi.developedDocuments.bufferByObject(finalBufferSettings)
    },
    async createCustomBuffer (finalBufferSettings) {
      finalBufferSettings.geometry = this.bufferPolygonGeo
      const sides = []
      for (let i = 0; i < this.lines.length; i++) {
        const lineGeo = this.lines[i].getGeometry()
        const formatWkt = new WKT()
        const lineGeoWkt = formatWkt.writeGeometry(lineGeo)
        const lineOffset = finalBufferSettings.sideOffsets[i].offset
        sides.push({ geometry: lineGeoWkt, offset: lineOffset })
      }
      finalBufferSettings.edges = sides
      return await this.customApi.developedDocuments.customBufferByObject(finalBufferSettings)
    },
    async createOuterBuffer (finalBufferSettings) {
      if (finalBufferSettings.sideOffsets.length === 0) {
        finalBufferSettings.geometry = this.bufferPolygonGeo
        const outerPolygonGeo = await this.customApi.developedDocuments.bufferByObject(finalBufferSettings)

        const formatWkt = new WKT()
        const lastSelectedFeatureGeo = this.lastSelectedFeature.getGeometry()
        const wktLastSelectedFeatureGeo = formatWkt.writeGeometry(lastSelectedFeatureGeo)

        const isIntersection = await this.customApi.developedDocuments.polygonsIntersection(outerPolygonGeo, wktLastSelectedFeatureGeo)
        if (isIntersection.intersects) {
          const wktResultPolygon = await this.customApi.developedDocuments.polygonsSubtract(outerPolygonGeo, wktLastSelectedFeatureGeo)
          for (const wktPolygon of wktResultPolygon) {
            const resultPolygon = formatWkt.readGeometry(wktPolygon)
            const resultFeature = new Feature()
            resultFeature.set('graphics', true)
            resultFeature.set('movable', true)
            switch (finalBufferSettings.drawingStyle) {
              case DrawingStyles.RedLinesPolygon: {
                resultFeature.set('style', DrawingStyles.RedLinesPolygon)
                break
              }
              case DrawingStyles.HelperObjectPattern: {
                resultFeature.set('style', DrawingStyles.HelperObjectPattern)
                break
              }
              case DrawingStyles.ServitutePattern: {
                resultFeature.set('style', DrawingStyles.ServitutePattern)
                break
              }
              case DrawingStyles.AllowedPlacementPattern: {
                resultFeature.set('style', DrawingStyles.AllowedPlacementPattern)
                break
              }
              case DrawingStyles.OksPattern: {
                resultFeature.set('style', DrawingStyles.OksPattern)
                break
              }
            }
            resultFeature.setGeometry(resultPolygon)
            this.setFeatureStyle(resultFeature)
            this.vectorLayer.getSource().addFeature(resultFeature)
          }

          this.isBufferExists = true
          if (this.isBufferExists) {
            this.clearRibLines()
            await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
            this.refresh()
          }
          this.isBufferExists = false
        }
      } else {
        const outerPolygonGeo = await this.createCustomBuffer(finalBufferSettings)

        finalBufferSettings.geometry = this.bufferPolygonGeo
        const innerBufferSettings = {
          ...finalBufferSettings,
          bufferZoneType: 1
        }

        const innerPolygonGeo = await this.customApi.developedDocuments.bufferByObject(innerBufferSettings)
        const formatWkt = new WKT()
        const wktResultPolygon = await this.customApi.developedDocuments.polygonsSubtract(outerPolygonGeo, innerPolygonGeo)
        const resultPolygon = formatWkt.readGeometry(wktResultPolygon[0])
        const resultFeature = new Feature()
        resultFeature.set('graphics', true)
        resultFeature.set('movable', true)
        switch (finalBufferSettings.drawingStyle) {
          case DrawingStyles.RedLinesPolygon: {
            resultFeature.set('style', DrawingStyles.RedLinesPolygon)
            break
          }
          case DrawingStyles.HelperObjectPattern: {
            resultFeature.set('style', DrawingStyles.HelperObjectPattern)
            break
          }
          case DrawingStyles.ServitutePattern: {
            resultFeature.set('style', DrawingStyles.ServitutePattern)
            break
          }
          case DrawingStyles.AllowedPlacementPattern: {
            resultFeature.set('style', DrawingStyles.AllowedPlacementPattern)
            break
          }
          case DrawingStyles.OksPattern: {
            resultFeature.set('style', DrawingStyles.OksPattern)
            break
          }
        }
        resultFeature.setGeometry(resultPolygon)
        this.setFeatureStyle(resultFeature)
        this.vectorLayer.getSource().addFeature(resultFeature)

        this.isBufferExists = true
        if (this.isBufferExists) {
          this.clearRibLines()
          await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
          this.refresh()
        }
        this.isBufferExists = false
      }
    },
    async createInnerBuffer (finalBufferSettings) {
      if (finalBufferSettings.sideOffsets.length === 0) {
        finalBufferSettings.geometry = this.bufferPolygonGeo
        const resultPolygonGeo = await this.customApi.developedDocuments.bufferByObject(finalBufferSettings)

        const formatWkt = new WKT()
        const polygonGeometry2 = this.lastSelectedFeature.getGeometry()
        const wktPolygon2 = formatWkt.writeGeometry(polygonGeometry2)

        const isIntersection = await this.customApi.developedDocuments.polygonsIntersection(resultPolygonGeo, wktPolygon2)
        if (isIntersection.intersects) {
          const wktResultPolygon = await this.customApi.developedDocuments.polygonsSubtract(wktPolygon2, resultPolygonGeo)
          for (const wktPolygon of wktResultPolygon) {
            const resultPolygon = formatWkt.readGeometry(wktPolygon)
            const resultFeature = new Feature()
            resultFeature.set('graphics', true)
            resultFeature.set('movable', true)
            switch (finalBufferSettings.drawingStyle) {
              case DrawingStyles.RedLinesPolygon: {
                resultFeature.set('style', DrawingStyles.RedLinesPolygon)
                break
              }
              case DrawingStyles.HelperObjectPattern: {
                resultFeature.set('style', DrawingStyles.HelperObjectPattern)
                break
              }
              case DrawingStyles.ServitutePattern: {
                resultFeature.set('style', DrawingStyles.ServitutePattern)
                break
              }
              case DrawingStyles.AllowedPlacementPattern: {
                resultFeature.set('style', DrawingStyles.AllowedPlacementPattern)
                break
              }
              case DrawingStyles.OksPattern: {
                resultFeature.set('style', DrawingStyles.OksPattern)
                break
              }
            }
            resultFeature.setGeometry(resultPolygon)
            this.setFeatureStyle(resultFeature)
            this.vectorLayer.getSource().addFeature(resultFeature)
          }

          this.isBufferExists = true
          if (this.isBufferExists) {
            this.clearRibLines()
            await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
            this.refresh()
          }
          this.isBufferExists = false
        }
      } else {
        const resultPolygonGeo = await this.createCustomBuffer(finalBufferSettings)

        finalBufferSettings.geometry = this.bufferPolygonGeo
        const resultBufferPolygonGeo = await this.customApi.developedDocuments.bufferByObject(finalBufferSettings)

        const formatWkt = new WKT()
        const wktResultPolygon = await this.customApi.developedDocuments.polygonsSubtract(resultBufferPolygonGeo, resultPolygonGeo)
        const resultPolygon = formatWkt.readGeometry(wktResultPolygon[0])
        const resultFeature = new Feature()
        resultFeature.set('graphics', true)
        resultFeature.set('movable', true)
        switch (finalBufferSettings.drawingStyle) {
          case DrawingStyles.RedLinesPolygon: {
            resultFeature.set('style', DrawingStyles.RedLinesPolygon)
            break
          }
          case DrawingStyles.HelperObjectPattern: {
            resultFeature.set('style', DrawingStyles.HelperObjectPattern)
            break
          }
          case DrawingStyles.ServitutePattern: {
            resultFeature.set('style', DrawingStyles.ServitutePattern)
            break
          }
          case DrawingStyles.AllowedPlacementPattern: {
            resultFeature.set('style', DrawingStyles.AllowedPlacementPattern)
            break
          }
          case DrawingStyles.OksPattern: {
            resultFeature.set('style', DrawingStyles.OksPattern)
            break
          }
        }
        resultFeature.setGeometry(resultPolygon)
        this.setFeatureStyle(resultFeature)
        this.vectorLayer.getSource().addFeature(resultFeature)

        this.isBufferExists = true
        if (this.isBufferExists) {
          this.clearRibLines()
          await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
          this.refresh()
        }
        this.isBufferExists = false
      }
    },
    async createInnerOuterBuffer (finalBufferSettings) {
      finalBufferSettings.geometry = this.bufferPolygonGeo
      const outerBufferSettings = {
        ...finalBufferSettings,
        bufferZoneType: 0
      }
      const innerBufferSettings = {
        ...finalBufferSettings,
        bufferZoneType: 1
      }

      let resultOuterPolygonGeo = null
      let resultInnerPolygonGeo = null
      if (finalBufferSettings.sideOffsets.length === 0) {
        resultOuterPolygonGeo = await this.customApi.developedDocuments.bufferByObject(outerBufferSettings)
        resultInnerPolygonGeo = await this.customApi.developedDocuments.bufferByObject(innerBufferSettings)
      } else {
        resultOuterPolygonGeo = await this.createCustomBuffer(outerBufferSettings)
        resultInnerPolygonGeo = await this.createCustomBuffer(innerBufferSettings)
      }
      const wktResultPolygon = await this.customApi.developedDocuments.polygonsSubtract(resultOuterPolygonGeo, resultInnerPolygonGeo)
      this.createFeatureFromBufferGeo(finalBufferSettings, wktResultPolygon)
    },
    async createFeatureFromBufferGeo (finalBufferSettings, wktResultPolygon) {
      const formatWkt = new WKT()
      const resultPolygon = formatWkt.readGeometry(wktResultPolygon[0])
      const resultFeature = new Feature()
      resultFeature.set('graphics', true)
      resultFeature.set('movable', true)
      switch (finalBufferSettings.drawingStyle) {
        case DrawingStyles.RedLinesPolygon: {
          resultFeature.set('style', DrawingStyles.RedLinesPolygon)
          break
        }
        case DrawingStyles.HelperObjectPattern: {
          resultFeature.set('style', DrawingStyles.HelperObjectPattern)
          break
        }
        case DrawingStyles.ServitutePattern: {
          resultFeature.set('style', DrawingStyles.ServitutePattern)
          break
        }
        case DrawingStyles.AllowedPlacementPattern: {
          resultFeature.set('style', DrawingStyles.AllowedPlacementPattern)
          break
        }
        case DrawingStyles.OksPattern: {
          resultFeature.set('style', DrawingStyles.OksPattern)
          break
        }
      }
      resultFeature.setGeometry(resultPolygon)
      this.setFeatureStyle(resultFeature)
      this.vectorLayer.getSource().addFeature(resultFeature)

      this.isBufferExists = true
      if (this.isBufferExists) {
        this.clearRibLines()
        await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
        this.refresh()
      }
      this.isBufferExists = false
    },
    async createZoneOfAcceptableObjectPlacement (finalBufferSettings) {
      let res = null
      if (finalBufferSettings.sideOffsets.length === 0) {
        finalBufferSettings.geometry = this.bufferPolygonGeo
        res = await this.customApi.developedDocuments.bufferByObject(finalBufferSettings)
      } else {
        res = await this.createCustomBuffer(finalBufferSettings)
      }
      this.formatToJsonAndCreateBuffer(finalBufferSettings, res)
    },
    async formatToJsonAndCreateBuffer (finalBufferSettings, res) {
      const formatWkt = new WKT()
      const resPolygon = formatWkt.readGeometry(res)
      const jsonFormat = new GeoJSON()
      const jsonPolygon = jsonFormat.writeGeometry(resPolygon)

      const jsonGeometry = {
        'geometry': JSON.parse(jsonPolygon)
      }

      const result = await this.customApi.developedDocuments.getSubstructedGeometry(jsonGeometry)
      const geometries = []
      for (const resItem of result) {
        const geometry = jsonFormat.readGeometry(resItem)
        geometries.push(geometry)
      }

      this.displayBufferedObject(finalBufferSettings, geometries)
    },
    async displayBufferedObject (finalBufferSettings, geometries) {
      const featureCollection = this.vectorLayer.getSource().getFeaturesCollection()

      for (const geometry of geometries) {
        const feature = this.createBufferFeature(finalBufferSettings, geometry)
        if (this.currentDrawType === 'bufferByObject') {
          featureCollection.insertAt(this.indexLast + 1, feature)
        } else {
          featureCollection.push(feature)
        }
      }

      this.isBufferExists = true

      if (this.isBufferExists) {
        this.clearRibLines()
        await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
        this.refresh()
      }

      this.isBufferExists = false
    },
    createBufferFeature (finalBufferSettings, geometry) {
      const bufferFeature = new Feature()
      bufferFeature.set('graphics', true)
      bufferFeature.set('movable', true)
      switch (finalBufferSettings.drawingStyle) {
        case DrawingStyles.RedLinesPolygon: {
          bufferFeature.set('style', DrawingStyles.RedLinesPolygon)
          break
        }
        case DrawingStyles.HelperObjectPattern: {
          bufferFeature.set('style', DrawingStyles.HelperObjectPattern)
          break
        }
        case DrawingStyles.ServitutePattern: {
          bufferFeature.set('style', DrawingStyles.ServitutePattern)
          break
        }
        case DrawingStyles.AllowedPlacementPattern: {
          bufferFeature.set('style', DrawingStyles.AllowedPlacementPattern)
          break
        }
        case DrawingStyles.OksPattern: {
          bufferFeature.set('style', DrawingStyles.OksPattern)
          break
        }
      }
      bufferFeature.setGeometry(geometry)
      this.setFeatureStyle(bufferFeature)

      return bufferFeature
    },
    onCancelBuffer () {
      this.isCreateBufferButtonInactive = true
      this.currentDrawType = 'mark'

      this.clearRibLines()
    },
    async bufferByDraw (active) {
      if (!active) {
        this.polygonDraw.un('drawend', this.onBufferByDraw)
        this.map.removeInteraction(this.polygonDraw)
        this.clearRibLines()
        await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
        this.currentDrawType = null
        return
      }

      // New temporary source where we add new polygon feature
      // because of the error that raises if we try to add it to
      // this.vectorLayer.getSource(). The error says that feature
      // was already added to that source.
      const source = new VectorSource()
      const draw = new Draw({
        source: source,
        type: 'Polygon',
        style: new Style({
          fill: new Fill({ color: 'rgba(255, 255, 0, 0)' }),
          stroke: new Stroke({ color: 'red', width: 2 })
        })
      })
      this.polygonDraw = draw
      this.map.addInteraction(this.polygonDraw)

      draw.on('drawend', this.onBufferByDraw)
    },
    async onBufferByDraw (event) {
      this.polygonFeature = event.feature

      const style = new Style({
        fill: new Fill({ color: 'rgba(255, 255, 0, 0)' }),
        stroke: new Stroke({ color: 'red', width: 2 })
      })

      this.polygonFeature.set('graphics', true)
      this.polygonFeature.set('style', polygonStyleId)
      this.polygonFeature.setStyle(style)

      this.vectorLayer.getSource().addFeature(this.polygonFeature)

      const featureGeo = this.polygonFeature.getGeometry()
      const coords = featureGeo.getCoordinates()
      const numberOfSides = coords[0].length - 1

      const formatWkt = new WKT()
      this.bufferPolygonGeo = formatWkt.writeGeometry(featureGeo)

      for (let i = 0; i < coords[0].length - 1; i++) {
        this.points.push(coords[0][i])
        this.points.push(coords[0][i + 1])
        const line = new Feature({
          geometry: new LineString(this.points)
        })
        line.setStyle(
          new Style({
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({ color: 'black', width: 1 }),
            text: new Text({
              text: (i + 1).toString(),
              font: '18px "Roboto", Helvetica Neue, Helvetica, Arial, sans-serif',
              textBaseline: 'bottom',
              fill: new Fill({ color: 'black' }),
              stroke: new Stroke({ color: 'black', width: 1 })
            })
          })
        )
        line.set('graphics', true)
        this.lines.push(line)
        this.vectorLayer.getSource().addFeature(line)
        this.points.length = 0
      }
      this.$refs.setBufferDialog.open(numberOfSides)
    },
    clearRibLines () {
      if (this.lines) {
        for (let line of this.lines) {
          this.vectorLayer.getSource().removeFeature(line)
        }
        this.lines.length = 0
      }
      this.bufferPolygonGeo = null

      if (this.polygonFeature) {
        const features = this.vectorLayer.getSource().getFeaturesCollection()
        const isExists = features.getArray().includes(this.polygonFeature)
        if (isExists) {
          this.vectorLayer.getSource().removeFeature(this.polygonFeature)
        }
      }
    }
  }
}
