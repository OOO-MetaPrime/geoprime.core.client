import ol from 'ol'
import proj4 from 'proj4'

proj4.defs('EPSG:3395', '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs')

ol.proj.setProj4(proj4)

const urls = {
  'schema': 'http://vec0{1-4}.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&lang=ru_RU',
  'satellite': 'http://sat0{1-4}.maps.yandex.net/tiles?l=sat&x={x}&y={y}&z={z}&lang=ru_RU'
}

class YandexLayer extends ol.layer.Tile {
  constructor (options) {
    super({
      opacity: options.opacity,
      visible: options.visible,
      source: new ol.source.XYZ({
        url: urls[options.style],
        projection: 'EPSG:3395',
        // https://gis.stackexchange.com/questions/187082/openlayers-3-projection-for-yandex-maps
        tileGrid: ol.tilegrid.createXYZ({
          extent: [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244]
        })
      })
    })
  }
}

export default YandexLayer
