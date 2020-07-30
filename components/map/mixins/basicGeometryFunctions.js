import Modify from 'ol/interaction/modify'
import GeoJSON from 'ol/format/geojson'
import Transform from 'ol-ext/interaction/Transform'
import uuidv4 from 'uuid/v4'
import Select from 'ol/interaction/select'
import Feature from 'ol/feature'
import condition from 'ol/events/condition'

export default {
  methods: {
    async saveGeometry (feature) {
      this.setFeatureStyle(feature)

      feature.setId(this.getNewFeatureId())
      this.vectorLayer.getSource().addFeature(feature)

      await this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
    },
    updateGraphicsObjList () {
      const features = this.vectorLayer.getSource().getFeatures()
      const geoJson = new GeoJSON()
      const graphicsObjList = []
      for (const grFeature of features) {
        if (grFeature.get('isContour')) {
          const contourObject = {
            id: grFeature.getId(),
            isContour: true
          }
          graphicsObjList.push(contourObject)
        } else {
          const geometry = JSON.parse(geoJson.writeGeometry(grFeature.getGeometry()))
          const styleId = grFeature.get('style')
          const number = grFeature.get('number')
          const title = grFeature.get('title')
          const movable = grFeature.get('movable')
          const graphicsObject = {
            id: grFeature.getId(),
            graphics: geometry,
            params: {
              number,
              title,
              movable
            },
            style: {
              type: styleId
            }
          }
          graphicsObjList.push(graphicsObject)
        }
      }

      return graphicsObjList
    },
    editGeometry (edit) {
      if (!edit) {
        this.modifyNonPoint.un('select', this.onModifyNonPoint)
        this.selectedFeatures.un('add', this.onSelectPoint)
        if (this.selectedPointFeature) {
          this.selectedPointFeature.un('change', this.onChangePoint)
        }
        this.map.removeInteraction(this.modifyNonPoint)
        this.map.removeInteraction(this.selectPoint)
        this.map.removeInteraction(this.modifyPoint)
        this.currentDrawType = null
        return
      }
      if (!this.vectorLayer.getSource()) {
        return
      }

      // ol-ext's Transform interaction
      this.modifyNonPoint = new Transform({
        features: this.vectorLayer.getSource().getFeatures().filter(x => x.get('graphics') && x.get('movable') && !this.isPoint(x))
      })
      this.modifyNonPoint.on('select', this.onModifyNonPoint)
      this.map.addInteraction(this.modifyNonPoint)

      // OpenLayers' Select interaction
      this.selectPoint = new Select({
        filter: feature => {
          return feature.getGeometry().getType() === 'Point'
        }
      })
      this.selectedFeatures = this.selectPoint.getFeatures()
      this.selectedFeatures.on('add', this.onSelectPoint)
      this.map.addInteraction(this.selectPoint)

      // OpenLayers' Modify interaction
      this.modifyPoint = new Modify({
        features: this.selectedFeatures
      })
      this.map.addInteraction(this.modifyPoint)
    },
    getGeometry (graphics, turningPoints) {
      const geoJson = new GeoJSON()
      let ind = 0

      if (!graphics.some(x => x.isContour)) {
        const contourFeature = this.getTurningPointsFeature(turningPoints)
        if (contourFeature) {
          this.vectorLayer.getSource().addFeature(contourFeature)
        }
      }

      for (const graph of graphics) {
        if (graph.isContour) {
          const contourFeature = this.getTurningPointsFeature(turningPoints, graph.id)
          if (contourFeature) {
            this.vectorLayer.getSource().addFeature(contourFeature)
          }
        } else {
          const geometry = geoJson.readGeometry(graph.graphics)
          const styleId = graph.style.type
          const number = graph.params ? graph.params.number : null
          const title = graph.params ? graph.params.title : null
          const movable = graph.params ? graph.params.movable : null

          const feature = new Feature({
            geometry,
            name: ind.toString()
          })
          feature.setId(graph.id || this.getNewFeatureId())
          feature.set('graphics', true)
          feature.set('movable', movable)
          feature.set('style', styleId)
          feature.set('number', number)
          feature.set('title', title)
          this.setFeatureStyle(feature, undefined)
          this.vectorLayer.getSource().addFeature(feature)
        }
        ind++
      }
      this.updateSize()
    },
    removeGeometry (remove) {
      if (!remove) {
        this.map.removeInteraction(this.selection)
        this.currentDrawType = null
        return
      }

      if (!this.selection) {
        this.selection = new Select({
          condition: condition.click,
          layers: [this.vectorLayer]
        })
        this.selection.on('select', function (e) {
          if (e.selected && e.selected[0].get('graphics') && e.selected.length > 0) {
            const selectedFeature = e.selected[0]
            this.vectorLayer.getSource().removeFeature(selectedFeature)
            this.selection.getFeatures().remove(selectedFeature)
            this.map.removeInteraction(this.select)
            this.customApi.developedDocuments.saveDrawingGraphics(this.currentDocument.id, this.updateGraphicsObjList())
          }
        }.bind(this))
      }
      this.map.addInteraction(this.selection)
    },
    getNewFeatureId () {
      return uuidv4()
    }
  }
}
