<template lang="pug">
div.coordinates-container
  div.coorinates-buttons
    button.btn.btn-icon(@click="applyCoordinates" :disabled="coordinates.length === 0" title="Применить")
      i.icon_checkmark
    button.btn.btn-icon(@click="addPoint" :disabled="!allowAddPoints || (isPoint && coordinates.length !== 0)" title="Добавить координату")
      i.icon_plus
    button.btn.btn-icon(@click="cancelPoint" :disabled="!newPoint" title="Отменить добавленную координату")
      i.icon_cancel_circle
    button.btn.btn-icon(@click="addRing" :disabled="!allowAddPoints || !isPolygon" title="Добавить кольцо")
      i.icon_bigplus
    button.btn.btn-icon(@click="addShape" :disabled="!isMultiGeometry" title="Добавить фигуру")
      i.icon_folder_plus
    button.btn.btn-icon(@click="removePoint" :disabled="!allowAddPoints || selectedRow === null" title="Удалить координату")
      i.icon_bin
  div.coordinates
    div.list-container
      select2.form-control(:data="sridList" v-model="selectedSrid" disabled)
      div.coordinates-list
        div(v-for="item in coordinates" :key="item.x" @click.capture="selectRow(item)" :class="{ selectedRow : selectedRow === item }")
          div.coordinate-item
            input(type="text" v-model="item.xc" class="form-control")
            input(type="text" v-model="item.yc" class="form-control")
</template>

<script>
import MultiPoint from 'ol/geom/multipoint'
import MultiLineString from 'ol/geom/multilinestring'
import MultiPolygon from 'ol/geom/multipolygon'
import Point from 'ol/geom/point'
import LineString from 'ol/geom/linestring'
import Polygon from 'ol/geom/polygon'
import Feature from 'ol/feature'
import * as drawShapes from './drawShapes.js'

export default {
  components: {
  },
  data () {
    return {
      coordinates: [],
      geometry: null,
      selectedRow: null,
      allowAddPoints: false,
      isPolygon: false,
      isPoint: false,
      newPoint: null,
      isNeedOpenCard: false,
      newRing: null,
      isMultiGeometry: false,
      sridList: [],
      selectedSrid: null
    }
  },
  methods: {
    addRing () {
      if (this.isMultiGeometry) {
        if (!this.selectedRow) {
          alert('Для мультигеометрии для добавления кольца в полигоне необходимо выбрать координату полигона к которому будет добавлено новое кольцо.')
          return
        }
        // в случае мультиполигона необходимо найти последний индекс для выбранного полигона
        const coordinates = this.coordinates.filter(a => a.geometry === this.selectedRow.geometry)
        this.newRing = coordinates[coordinates.length - 1].ring + 1
      } else {
        this.newRing = this.coordinates[this.coordinates.length - 1].ring + 1
      }

      this.selectedRow = null

      this.addPoint()
    },
    addPoint () {
      let index
      if (this.isMultiGeometry) {
        if (!this.selectedRow) {
          alert('Для мультигеометрии для добавления точки необходимо выбрать координату к геометрии которой будет привязана новая точка.')
          return
        }
        index = this.coordinates.findIndex(a => a === this.selectedRow) + 1
        const coordinates = this.coordinates
        this.newPoint = { xc: '', yc: '', geometry: this.selectedRow.geometry }
        if ('ring' in this.selectedRow) {
          this.newPoint.ring = this.newRing ? this.newRing : this.selectedRow.ring
          this.newRing = null
        }
        coordinates.splice(index, 0, this.newPoint)
        this.coordinates = coordinates
        this.allowAddPoints = false
        return
      }
      index = this.coordinates.length
      if (!this.isPolygon) {
        if (this.selectedRow) {
          index = this.coordinates.findIndex(a => a === this.selectedRow) + 1
        }
        let res = this.coordinates
        this.newPoint = { xc: '', yc: '' }
        res.splice(index, 0, this.newPoint)
        this.coordinates = res
      } else {
        var ring = this.coordinates[this.coordinates.length - 1].ring
        if (this.selectedRow) {
          index = this.coordinates.findIndex(a => a === this.selectedRow) + 1
          ring = this.coordinates.find(a => a === this.selectedRow).ring
        }
        if (this.newRing) {
          ring = this.newRing
          this.newRing = null
        }
        let res = this.coordinates
        this.newPoint = { xc: '', yc: '', ring: ring }
        res.splice(index, 0, this.newPoint)
        this.coordinates = res
      }
      this.allowAddPoints = false
    },
    addShape () {
      this.coordinates.push({
        xc: 0,
        yc: 0,
        ring: 0,
        geometry: this.geometry
      })
      this.selectedRow = null
    },
    getAllowAddPoints () {
      if (this.isPoint) {
        return this.coordinates.length === 0
      }

      return !this.isPoint
    },
    cancelPoint () {
      var index = this.coordinates.findIndex(a => a === this.newPoint)
      var res = this.coordinates
      res.splice(index, 1)
      this.coordinates = res
      this.allowAddPoints = this.getAllowAddPoints()
      this.newPoint = null
    },
    removePoint () {
      var index = this.coordinates.findIndex(a => a === this.selectedRow)
      var res = this.coordinates
      res.splice(index, 1)
      this.coordinates = res
    },
    selectRow (item) {
      if (this.selectedRow === item) {
        this.selectedRow = null
      } else {
        this.selectedRow = item
      }
    },
    applyCoordinates () {
      if (this.newPoint && (this.newPoint.xc === '' || this.newPoint.yc === '')) {
        return
      }
      if (this.newPoint) {
        this.newPoint = null
        this.allowAddPoints = this.getAllowAddPoints()
      }

      const newCoordinates = this.coordinates.map(a => [parseFloat(a.xc), parseFloat(a.yc)])

      if (this.isMultiGeometry) {
        if (this.geometry instanceof MultiPolygon) {
          const poligons = []
          let currentGeometry // т.е. все координаты для фигур уложены последовательно то заложимся на это
          this.coordinates.forEach(a => {
            if (currentGeometry !== a.geometry) {
              currentGeometry = a.geometry
              poligons.push([])
            }
            const currentPolygon = poligons.length - 1
            if (!poligons[currentPolygon][a.ring]) {
              poligons[currentPolygon][a.ring] = []
            }
            poligons[currentPolygon][a.ring].push([parseFloat(a.xc), parseFloat(a.yc)])
          })
          this.geometry.setCoordinates(poligons)
        }
        if (this.geometry instanceof MultiLineString || this.geometry instanceof MultiPoint) {
          const points = []
          let currentGeometry // т.е. все координаты для фигур уложены последовательно то заложимся на это
          this.coordinates.forEach(a => {
            if (currentGeometry !== a.geometry) {
              currentGeometry = a.geometry
              points.push([])
            }
            const currentShape = points.length - 1
            points[currentShape].push([parseFloat(a.xc), parseFloat(a.yc)])
          })
          this.geometry.setCoordinates(points)
        }

        if (this.isNeedOpenCard) {
          this.isNeedOpenCard = false
          this.$emit('creategeometry', this.geometry)
        }
        return
      }

      if (this.geometry instanceof Point) {
        var firstPoint = newCoordinates[0]
        this.geometry.setCoordinates(firstPoint)
      } else if (this.geometry instanceof Polygon) {
        const result = []
        this.coordinates.forEach(a => {
          if (!result[a.ring]) {
            result[a.ring] = []
          }
          result[a.ring].push([a.xc, a.yc])
        })
        this.geometry.setCoordinates(result)
      } else {
        this.geometry.setCoordinates(newCoordinates)
      }

      if (this.isNeedOpenCard) {
        this.isNeedOpenCard = false
        this.$emit('creategeometry', this.geometry)
      }
    },
    setNewFeature (mode, drawSource) {
      if (!drawSource) {
        return
      }
      this.isMultiGeometry = false
      var feature
      this.isPoint = false
      this.isPolygon = false
      this.allowAddPoints = false
      this.isNeedOpenCard = true
      switch (mode) {
        case drawShapes.ShapeTypes.Point:
          this.isPoint = true
          this.geometry = new Point([0, 0])
          feature = new Feature({ geometry: this.geometry })
          drawSource.addFeature(feature)
          break
        case drawShapes.ShapeTypes.Line:
          this.geometry = new LineString([[0, 0]])
          feature = new Feature({ geometry: this.geometry })
          drawSource.addFeature(feature)
          this.allowAddPoints = true
          break
        case drawShapes.ShapeTypes.Polygon:
          this.isPolygon = true
          this.geometry = new Polygon([[[0, 0]]])
          feature = new Feature({ geometry: this.geometry })
          drawSource.addFeature(feature)
          this.allowAddPoints = true
          break
        case 'MultiPoint':
          this.isMultiGeometry = true
          this.isPoint = true
          this.geometry = new MultiPoint()
          this.geometry.appendPoint(new Point([0, 0]))
          feature = new Feature({ geometry: this.geometry })
          drawSource.addFeature(feature)
          this.allowAddPoints = true
          break
        case 'MultiLine':
          this.isMultiGeometry = true
          this.geometry = new MultiLineString()
          this.geometry.appendLineString(new LineString([[0, 0]]))
          feature = new Feature({ geometry: this.geometry })
          drawSource.addFeature(feature)
          this.allowAddPoints = true
          break
        case 'MultiPolygon':
          this.isMultiGeometry = true
          this.isPolygon = true
          this.geometry = new MultiPolygon()
          this.geometry.appendPolygon(new Polygon([[[0, 0]]]))
          feature = new Feature({ geometry: this.geometry })
          drawSource.addFeature(feature)
          this.allowAddPoints = true
          break
      }
      this.setFeature(feature, this.isMultiGeometry)
    },
    setFeatureForMultiGeometry () {
      if (this.geometry instanceof MultiPoint) {
        this.isMultiGeometry = true
        const coordinates = []
        this.geometry.getPoints().forEach(a => {
          const sourceCoordinate = a.getCoordinates()
          sourceCoordinate.forEach(pointCoordinate => {
            coordinates.push([{ xc: pointCoordinate[0], yc: pointCoordinate[1], geometry: a }])
          })
        })
        this.coordinates = coordinates
        this.isPoint = true
        return
      }
      if (this.geometry instanceof MultiLineString) {
        this.isMultiGeometry = true
        let coordinates = []
        this.geometry.getLineStrings().forEach(a => {
          const sourceCoordinate = a.getCoordinates()
          sourceCoordinate.forEach(lineCoordinate => {
            coordinates.push([{ xc: lineCoordinate[0], yc: lineCoordinate[1], geometry: a }])
          })
        })
        this.coordinates = coordinates
        return
      }
      if (this.geometry instanceof MultiPolygon) {
        this.isMultiGeometry = true
        this.isPolygon = true
        let coordinates = []
        this.geometry.getCoordinates().forEach((polygonCoordinates, index) => {
          const polygon = this.geometry.getPolygon(index)
          polygonCoordinates.forEach((ring, ringIndex) => {
            coordinates = coordinates.concat(ring.map(ringItem => {
              return {
                xc: ringItem[0],
                yc: ringItem[1],
                ring: ringIndex,
                geometry: polygon
              }
            }))
          })
        })
        this.coordinates = coordinates
      }
    },
    setFeature (feature, isMultiGeometry) {
      this.isMultiGeometry = isMultiGeometry
      this.isPolygon = false
      this.isPoint = false
      if (!feature) {
        this.geometry = null
        this.coordinates = []
        this.allowAddPoints = false
        return
      }
      this.showSrid(feature)

      this.geometry = feature.getGeometry()
      // вначале проверяем не мульти геометрия ли это
      this.setFeatureForMultiGeometry()

      // если не мульти геометрия то просто получаем точки из геометрии
      if (!this.isMultiGeometry) {
        if (this.geometry instanceof Point) {
          var coordinate = this.geometry.getCoordinates()
          this.coordinates = coordinate.length === 0 ? [] : [{ xc: coordinate[0], yc: coordinate[1] }]
          this.isPoint = true
        } else if (this.geometry instanceof Polygon) {
          var result = []
          this.geometry.getCoordinates().forEach((a, index) => {
            result = result.concat(a.map(geometry => {
              return {
                xc: geometry[0],
                yc: geometry[1],
                ring: index
              }
            }
            ))
          })
          this.isPolygon = true
          this.coordinates = result
        } else {
          var coordinates = this.geometry.getCoordinates()
          this.coordinates = coordinates.map(a => {
            return {
              xc: a[0],
              yc: a[1]
            }
          })
        }
      }
      this.allowAddPoints = this.getAllowAddPoints()
    },
    showSrid (feature) {
      const crs = feature.get ? feature.get('crs') : feature.crs
      const srid = crs ? crs.match(/\d*$/) : null
      if (srid && srid.length) {
        const sridFromList = this.sridList.find(el => parseInt(el.wkid, 10) === parseInt(srid[0], 10))
        this.selectedSrid = sridFromList['id'] || null
      }
    }
  },

  mounted () {
    this.coreApi.classifier.getCoordinateProjectionList().then(list => {
      this.sridList = list
    })
  }
}
</script>

<style lang="stylus" scoped>
.list-container
  height 100%
  display flex
  flex-direction column
.coordinate-item input
  margin 3px
  min-width 110px
.coorinates-buttons
  justify-content flex-end
.coordinate-item
  display flex
  flex-direction row
  width 100%
  max-width 306px
.coordinate-item .md-input-container:nth-child(1)
  margin-right 10px
.coordinates-list
  overflow auto
.coordinates-container
  background #fff
.coordinates
  height 200px
.selectedRow
  background-color rgba(0, 0, 0, 0.1)
</style>