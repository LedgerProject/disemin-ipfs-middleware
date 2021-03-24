const _ = require('lodash')
const axios = require('axios')
const logger = require('winston')
const moment = require('moment')
const path = require('path')

// Root folder
const ROOT_FOLDER = '/weather'

// Configure http client
const client = axios.create({
  baseURL: process.env.IPFS_URL,
  headers: {
    'Accept': 'application/json'
  }
})

/**
 * Return true if it's a valid IPFS hash.
 */
function isValid (hash) {
  return _.size(hash) === 46
}

/**
 * Return true if the data object contains valid telemetry data.
 */
function isTelemetry (data) {
  return _.has(data, 'ts') && _.has(data, 'values') && _.has(data, 'geohash')
}

/**
 * Get the IPFS hash of the root folder.
 */
function getRootHash () {
  return client.post(`/api/v0/files/stat?arg=${ROOT_FOLDER}`)
    .then(response => _.get(response, 'data.Hash'))
}

/**
 * Get IPFS hash contents (cat).
 */
function getData (hash) {
  return client.post(`/api/v0/cat?arg=${hash}`)
    .then(response => response.data)
}

/**
 * Get IPFS hash contents (cat) and fail if not valid telemetry data.
 */
function getTelemetryData (hash) {
  return getData(hash)
    .then(data => {
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
    })
}

/**
 * Copy file with the given IPFS hash to MFS, using the provided filename.
 * Filename defaults to YYYYMMDD_HHmmssSSS.json, using the current timestamp.
 */
function copy (hash, filename = `${moment().format('YYYYMMDD_HHmmssSSS')}.json`) {
  let source = `/ipfs/${hash}`
  let destination = path.join(ROOT_FOLDER, filename)
  return client.post(`/api/v0/files/cp?arg=${source}&arg=${destination}`)
    .then(response => response.data)
}

/**
 * Publish hash to IPNS
 */
function publish (hash) {
  return client.post(`/api/v0/name/publish?arg=${hash}`)
    .then(response => response.data)
}

/**
 * Update IPNS with the latest root folder hash
 */
function update () {
  return getRootHash().then(hash => publish(hash))
}

module.exports = { isValid, getData, getTelemetryData, copy, update, getRootHash }
