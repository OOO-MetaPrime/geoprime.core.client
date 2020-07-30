'use strict'

import { repeat, padStart } from '^/helpers/stringsHelper'

const degreesMaskRegex = new RegExp('^([d]+)\\.([d]+)$')
const degreesMinutesMaskRegex = new RegExp('^([d]+)\\:([m]+)\\.([m]+)$')
const degreesMinutesSecondsMaskRegex = new RegExp('^([d]+)\\:([m]+)\\:([s]+)$')
const degreesMinutesSecondsMillisecondsMaskRegex = new RegExp('^([d]+)\\:([m]+)\\:([s]+)\\.([s]+)$')

function parseCoordinateMask (mask) {
  if (!mask) {
    return {
      mask: '',
      type: 'n'
    }
  }
  const degreesMatch = mask.match(degreesMaskRegex)
  if (degreesMatch) {
    const firstPart = degreesMatch[1]
    const secondPart = degreesMatch[2]
    return {
      mask: `${repeat('9', firstPart.length)}\\.${repeat('9', secondPart.length)}°`,
      digits: {
        intDegrees: firstPart.length,
        fractDegrees: secondPart.length
      },
      type: 'd'
    }
  }
  const degreesMinutesMatch = mask.match(degreesMinutesMaskRegex)
  if (degreesMinutesMatch) {
    const degreesPart = degreesMinutesMatch[1]
    const minutesFirstPart = degreesMinutesMatch[2]
    const minutesSecondPart = degreesMinutesMatch[3]
    return {
      digits: {
        degrees: degreesPart.length,
        intMinutes: minutesFirstPart.length,
        fractMinutes: minutesSecondPart.length
      },
      mask: `${repeat('9', degreesPart.length)}°${repeat('9', minutesFirstPart.length)}\\.${repeat('9', minutesSecondPart.length)}'`,
      type: 'dm'
    }
  }
  const degreesMinutesSecondsMatch = mask.match(degreesMinutesSecondsMaskRegex)
  if (degreesMinutesSecondsMatch) {
    const degreesPart = degreesMinutesSecondsMatch[1]
    const minutesPart = degreesMinutesSecondsMatch[2]
    const secondsPart = degreesMinutesSecondsMatch[3]
    return {
      digits: {
        degrees: degreesPart.length,
        minutes: minutesPart.length,
        seconds: secondsPart.length
      },
      mask: `${repeat('9', degreesPart.length)}°${repeat('9', minutesPart.length)}'${repeat('9', secondsPart.length)}"`,
      type: 'dms'
    }
  }

  const degreesMinutesSecondsMillisecondsMatch = mask.match(degreesMinutesSecondsMillisecondsMaskRegex)
  if (degreesMinutesSecondsMillisecondsMatch) {
    const degreesPart = degreesMinutesSecondsMillisecondsMatch[1]
    const minutesPart = degreesMinutesSecondsMillisecondsMatch[2]
    const secondsPart = degreesMinutesSecondsMillisecondsMatch[3]
    const millisecondsPart = degreesMinutesSecondsMillisecondsMatch[4]
    return {
      digits: {
        degrees: degreesPart.length,
        minutes: minutesPart.length,
        seconds: secondsPart.length,
        milliseconds: millisecondsPart.length
      },
      mask: `${repeat('9', degreesPart.length)}°${repeat('9', minutesPart.length)}'${repeat('9', secondsPart.length)}\\.${repeat('9', millisecondsPart.length)}"`,
      type: 'dmss'
    }
  }

  return {
    mask: '',
    type: 'n'
  }
}

function getPaddedNumberString (num, digitCount) {
  return padStart(num.toString(), digitCount, '0')
}

function getFixedDigitsNumber (num, intDigitCount, fractDigitCount) {
  let roundedNumber = parseFloat(num.toFixed(fractDigitCount))
  const intNumberLength = parseInt(roundedNumber).toString().length
  const numberLength = intDigitCount > intNumberLength
    ? (roundedNumber.toString().length + (intDigitCount - intNumberLength))
    : (roundedNumber.toString().length + (intNumberLength - intDigitCount))

  return {
    roundedNumber,
    numberString: getPaddedNumberString(roundedNumber, numberLength)
  }
}

function getDegreesMinutes (degrees, digits) {
  let intDegrees = parseInt(degrees)
  const minutes = ((degrees - parseInt(degrees)) * 60.0)
  let roundedMinutes = parseFloat(minutes.toFixed(digits.fractMinutes))
  if (roundedMinutes === 60) {
    roundedMinutes = 0
    intDegrees += 1
  }
  const intMinutesLength = parseInt(roundedMinutes).toString().length
  const minutesLength = digits.intMinutes > intMinutesLength
    ? (roundedMinutes.toString().length + (digits.intMinutes - intMinutesLength))
    : (roundedMinutes.toString().length + (intMinutesLength - digits.intMinutes))

  return {
    degrees: intDegrees,
    degreesString: getPaddedNumberString(intDegrees, digits.degrees),
    minutes: roundedMinutes,
    minutesString: getPaddedNumberString(roundedMinutes, minutesLength)
  }
}

function getDegreesMinutesSecondsMilliseconds (degrees, digits) {
  let intDegrees = parseInt(degrees)
  const minutesFraction = degrees - intDegrees
  let intMinutes = parseInt(minutesFraction * 60.0)
  const secondsFixedNumber = getFixedDigitsNumber(((minutesFraction * 60.0) - intMinutes) * 60.0, digits.seconds, digits.milliseconds)
  if (secondsFixedNumber.roundedNumber === 60) {
    secondsFixedNumber.roundedNumber = 0
    secondsFixedNumber.numberString = getPaddedNumberString(0, digits.seconds)
    intMinutes += 1
  }
  if (intMinutes === 60) {
    intMinutes = 0
    intDegrees += 1
  }

  return {
    degrees: intDegrees,
    degreesString: getPaddedNumberString(intDegrees, digits.degrees),
    minutes: intMinutes,
    minutesString: getPaddedNumberString(intMinutes, digits.minutes),
    seconds: secondsFixedNumber.roundedNumber,
    secondsString: secondsFixedNumber.numberString
  }
}

function getDegreesMinutesSeconds (degrees, digits) {
  let intDegrees = parseInt(degrees)
  const minutesFraction = degrees - intDegrees
  let intMinutes = parseInt(minutesFraction * 60.0)
  let seconds = Math.round(((minutesFraction * 60.0) - intMinutes) * 60.0)
  if (seconds === 60) {
    seconds = 0
    intMinutes += 1
  }
  if (intMinutes === 60) {
    intMinutes = 0
    intDegrees += 1
  }

  return {
    degrees: intDegrees,
    degreesString: getPaddedNumberString(intDegrees, digits.degrees),
    minutes: intMinutes,
    minutesString: getPaddedNumberString(intMinutes, digits.minutes),
    seconds: seconds,
    secondsString: getPaddedNumberString(seconds, digits.seconds)
  }
}

function toCoordinatesString (value, maskInfo) {
  if (!maskInfo) {
    return value.toString()
  }

  const maskType = maskInfo.type
  const digits = maskInfo.digits
  switch (maskType) {
    case 'n':
      return value.toString()
    case 'd':
      const degrees = getFixedDigitsNumber(value, digits.intDegrees, digits.fractDegrees)
      return `${degrees.numberString}°`
    case 'dm':
      const degreesMinutes = getDegreesMinutes(value, digits)
      return `${degreesMinutes.degreesString}°${degreesMinutes.minutesString}'`
    case 'dms':
      const degreesMinutesSeconds = getDegreesMinutesSeconds(value, digits)
      return `${degreesMinutesSeconds.degreesString}°${degreesMinutesSeconds.minutesString}'${degreesMinutesSeconds.secondsString}"`
    case 'dmss':
      const degreesMinutesSecondMilliseconds = getDegreesMinutesSecondsMilliseconds(value, digits)
      return `${degreesMinutesSecondMilliseconds.degreesString}°${degreesMinutesSecondMilliseconds.minutesString}'${degreesMinutesSecondMilliseconds.secondsString}"`
    default:
      return value.toString()
  }
}

export {
  parseCoordinateMask,
  toCoordinatesString
}
