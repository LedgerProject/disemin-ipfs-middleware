const _ = require('lodash')
const logger = require('winston')
const moment = require('moment')

/**
 * Return true if the data object contains valid telemetry data.
 */
function isTelemetry (data) {
  return _.has(data, 'ts') && _.has(data, 'values') && _.has(data, 'geohash')
}

/**
 * Try to parse data as telemetry
 */
function toTelemetry (data) {
  // Sometimes the hashes are strings...
  if (_.isString(data)) {
    // Try to parse as JSON
    logger.log('debug', `Trying to parse as JSON`)
    try {
      data = JSON.parse(data)
    } catch (error) {
      throw new Error(`Invalid data: ${data}`)
    }
  }

  // Sometimes they don't even contain an object
  if (!_.isObjectLike(data)) {
    logger.log('debug', `Data not object-like`)
    throw new Error(`Invalid data: ${data}`)
  }

  // Sometimes the hashes contain [] instead of {}...
  if (_.isArrayLikeObject(data)) {
    logger.log('debug', `Data is array-like`)
    data = data[0]
  }

  // Or sometimes the object does not contain valid telemetry
  if (!isTelemetry(data)) {
    logger.log('debug', `Data not telemetry`)
    throw new Error(`Data is not telemetry: ${JSON.stringify(data)}`)
  }

  // Sometimes it's correct!
  return data
}

/**
 * Parse telemetry and return a predefined weather data schema
 */
function toWeather (telemetry) {
  return Promise.resolve({
    date: moment(telemetry.ts).toISOString(),
    geohash: telemetry.geohash,
    temperature: _.round(telemetry.values.fo_temp, 1),
    wind_gust: _.round(telemetry.values.fo_w_gust, 1)
  })
}

module.exports = { toTelemetry, toWeather }
