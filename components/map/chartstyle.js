/* Copyright (c) 2015 Jean-Marc VIGLINO,
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*
*  Add a chart style to display charts (pies or bars) on a map
*/
/*
  Исправлен под модуль
*/
/**
 * @requires ol.style.Circle
 * @requires ol.structs.IHasChecksum
 */
import ol from 'ol'
import Color from 'ol/color'
import RegularShape from 'ol/style/regularshape'
import Fill from 'ol/style/fill'

/**
 * @classdesc
 * Set chart style for vector features.
 *
 * @constructor
 * @param {olx.style.FontSymbolOptions=} Options.
 *  - type {pie|bar}
 *  - radius {number} chart radius
 *  - rotation {number}
 *  - snapToPixel {bool}
 *  - stroke {ol.style.Stroke} stroke style
 *  - colors {String|Array<color>} predefined color set "classic","dark","pale","pastel","neon" / array of color string, default classic
 *  - offsetX {number}
 *  - offsetY {number}
 *  - animation {number} step in an animation sequence [0,1]
 * @extends {ol.style.RegularShape}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
var olStyleChart = function (optOptions) {
  var options = optOptions || {}
  var strokeWidth = 0
  if (options.stroke) {
    strokeWidth = options.stroke.getWidth()
  }
  RegularShape.call(this,
    {
      radius: options.radius + strokeWidth,
      fill: new Fill({ color: [0, 0, 0] }),
      rotation: options.rotation,
      snapToPixel: options.snapToPixel
    })
  if (options.scale) {
    this.setScale(options.scale)
  }

  this.stroke_ = options.stroke
  this.radius_ = options.radius || 20
  this.donutratio_ = options.donutRatio || 0.5
  this.type_ = options.type
  this.offset_ = [options.offsetX ? options.offsetX : 0, options.offsetY ? options.offsetY : 0]
  this.animation_ = (typeof (options.animation) === 'number') ? { animate: true, step: options.animation } : this.animation_ = { animate: false, step: 1 }

  this.data_ = options.data
  this.bars = []
  this.arcs = []
  if (options.colors instanceof Array) {
    this.colors_ = options.colors
  } else {
    this.colors_ = olStyleChart.colors[options.colors]
    if (!this.colors_) {
      this.colors_ = olStyleChart.colors.classic
    }
  }

  this.renderChart_()
}

ol.inherits(olStyleChart, RegularShape)

/** Default color thems
*/
olStyleChart.colors = {
  'classic': ['#ffa500', 'blue', 'red', 'green', 'cyan', 'magenta', 'yellow', '#0f0'],
  'dark': ['#960', '#003', '#900', '#060', '#099', '#909', '#990', '#090'],
  'pale': ['#fd0', '#369', '#f64', '#3b7', '#880', '#b5d', '#666'],
  'pastel': ['#fb4', '#79c', '#f66', '#7d7', '#acc', '#fdd', '#ff9', '#b9b'],
  'neon': ['#ff0', '#0ff', '#0f0', '#f0f', '#f00', '#00f']
}

/** Get data associatied with the chart
*/
olStyleChart.prototype.getData = function () {
  return this.data_
}
/** Set data associatied with the chart
*  @param {Array<number>}
*/
olStyleChart.prototype.setData = function (data) {
  this.data_ = data
  this.renderChart_()
}

/** Get symbol radius
*/
olStyleChart.prototype.getRadius = function () {
  return this.radius_
}
/** Set symbol radius
* @param {number} symbol radius
* @param {number} donut ratio
*/
olStyleChart.prototype.setRadius = function (radius, ratio) {
  this.radius_ = radius
  this.donuratio_ = ratio || this.donuratio_
  this.renderChart_()
}

/** Set animation step
* @param {false|number} false to stop animation or the step of the animation [0,1]
*/
olStyleChart.prototype.setAnimation = function (step) {
  if (step === false) {
    if (this.animation_.animate === false) {
      return
    }
    this.animation_.animate = false
  } else {
    if (this.animation_.step === step) {
      return
    }
    this.animation_.animate = true
    this.animation_.step = step
  }
  this.renderChart_()
}

/** Get data associatied with the chart
*/
olStyleChart.prototype.getDataValueIndexAtPoint = function (point) {
  const pointNoOffset = {
    x: point.x - this.offset_[0],
    y: point.y - this.offset_[1]
  }

  switch (this.type_) {
    case 'bar':
      return olStyleChart.prototype.getBarDataValueIndex.call(this, pointNoOffset)
    case 'donut':
    case 'pie':
      return olStyleChart.prototype.getDonutDataValueIndex.call(this, pointNoOffset)
    default: break
  }
}

olStyleChart.prototype.getDonutDataValueIndex = function (pointNoOffset) {
  if (pointNoOffset.y === 0 && pointNoOffset.x === 0) {
    return -1
  }

  const isInCircle = (Math.pow(pointNoOffset.x, 2) + Math.pow(pointNoOffset.y, 2)) <= Math.pow(this.radius_, 2)

  if (!isInCircle) {
    return -1
  }

  let angle = 0

  if (pointNoOffset.y === 0) {
    angle = pointNoOffset.x > 0 ? 0 : Math.PI
  } else {
    angle = Math.atan2(pointNoOffset.y, pointNoOffset.x)
    // для угла точки в диапазоне 1.5П до начального угла фигуры, устанавливаем углу положительное значение
    if (angle < 0 && angle < this.arcs[0].a0) {
      angle = 2 * Math.PI + angle
    }
  }

  let angleCondition
  for (const arc of this.arcs) {
    angleCondition = arc.a0 < angle && angle < arc.a

    if (angleCondition) {
      return this.arcs.indexOf(arc)
    }
  }
  return -1
}

olStyleChart.prototype.getBarDataValueIndex = function (pointNoOffset) {
  for (let bar of this.bars) {
    if (pointNoOffset.x >= bar.x1 && pointNoOffset.y >= bar.y1 &&
      pointNoOffset.x <= bar.x2 && pointNoOffset.y <= bar.y2) {
      return this.bars.indexOf(bar)
    }
  }
  return -1
}

/** @private
*/
olStyleChart.prototype.renderChart_ = function (atlasManager) {
  let strokeStyle
  let strokeWidth = 0

  if (this.stroke_) {
    strokeStyle = Color.asString(this.stroke_.getColor())
    strokeWidth = this.stroke_.getWidth()
  }

  // no atlas manager is used, create a new canvas
  const canvas = this.getImage()

  // draw the circle on the canvas
  const context = (canvas.getContext('2d'))
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.lineJoin = 'round'

  // reset transform
  context.setTransform(1, 0, 0, 1, 0, 0)

  // then move to (x, y)
  context.translate(0, 0)

  let step = this.animation_.animate ? this.animation_.step : 1
  // console.log(this.animation_.step)

  const c = canvas.width / 2
  // Draw pie
  switch (this.type_) {
    case 'donut':
    case 'pie3D':
    case 'pie': {
      let sum = 0
      for (let i = 0; i < this.data_.length; i++) {
        sum += this.data_[i]
      }

      let a = Math.PI * (step - 1.5)
      let a0 = Math.PI * (step - 1.5)
      context.strokeStyle = strokeStyle
      context.lineWidth = strokeWidth
      context.save()
      if (this.type_ === 'pie3D') {
        context.translate(0, c * 0.3)
        context.scale(1, 0.7)
        context.beginPath()
        context.fillStyle = '#369'
        context.arc(c, c * 1.4, this.radius_ * step, 0, 2 * Math.PI)
        context.fill()
        context.stroke()
      }
      if (this.type_ === 'donut') {
        context.save()
        context.beginPath()
        context.rect(0, 0, 2 * c, 2 * c)
        context.arc(c, c, this.radius_ * step * this.donutratio_, 0, 2 * Math.PI)
        context.clip('evenodd')
      }

      this.arcs = []

      for (let i = 0; i < this.data_.length; i++) {
        context.beginPath()
        context.moveTo(c, c)
        context.fillStyle = this.colors_[i % this.colors_.length]
        a = a0 + 2 * Math.PI * this.data_[i] / sum * step

        this.arcs.push({ 'a0': a0, 'a': a })

        context.arc(c, c, this.radius_ * step, a0, a)
        context.closePath()
        context.fill()
        context.stroke()
        a0 = a
      }

      if (this.type_ === 'donut') {
        context.restore()
        context.beginPath()
        context.strokeStyle = strokeStyle
        context.lineWidth = strokeWidth
        context.arc(c, c, this.radius_ * step * this.donutratio_, Math.PI * (step - 1.5), a0)
        context.stroke()
      }
      context.restore()
      break
    }
    case 'bar':
    default: {
      let max = 0
      for (let i = 0; i < this.data_.length; i++) {
        if (max < this.data_[i]) {
          max = this.data_[i]
        }
      }
      let s = Math.min(5, 2 * this.radius_ / this.data_.length)
      let b = canvas.width - strokeWidth
      let x = c - this.data_.length * s / 2
      let x0 = c - this.data_.length * s / 2
      context.strokeStyle = strokeStyle
      context.lineWidth = strokeWidth
      this.bars = []
      for (let i = 0; i < this.data_.length; i++) {
        context.beginPath()
        context.fillStyle = this.colors_[i % this.colors_.length]
        x = x0 + s
        var h = this.data_[i] / max * 2 * this.radius_ * step
        context.rect(x0, b - h, s, h)
        this.bars.push({
          x1: x0 - c,
          y1: b - h - c,
          x2: x0 + s - c,
          y2: b - c
        })
        // console.log ( x0+", "+(b-this.data_[i]/max*2*this.radius_)+", "+x+", "+b)
        context.closePath()
        context.fill()
        context.stroke()
        x0 = x
      }
    }
  }

  // Set Anchor
  let a = this.getAnchor()
  a[0] = c - this.offset_[0]
  a[1] = c - this.offset_[1]
}

/**
 * @inheritDoc
 */
olStyleChart.prototype.getChecksum = function () {
  var strokeChecksum = (this.stroke_ !== null) ? this.stroke_.getChecksum() : '-'
  var fillChecksum = null
  var recalculate = (this.checksums_ === null) ||
    (strokeChecksum !== this.checksums_[1] ||
      fillChecksum !== this.checksums_[2] ||
      this.radius_ !== this.checksums_[3] ||
      this.data_.join('|') !== this.checksums_[4])

  if (recalculate) {
    var checksum = 'c' + strokeChecksum + fillChecksum +
      ((this.radius_ !== void 0) ? this.radius_.toString() : '-') +
      this.data_.join('|')
    this.checksums_ = [checksum, strokeChecksum, fillChecksum, this.radius_, this.data_.join('|')]
  }

  return this.checksums_[0]
}

export default olStyleChart
