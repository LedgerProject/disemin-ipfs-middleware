const _ = require('lodash')
const axios = require('axios')
const logger = require('winston')
const moment = require('moment')
const path = require('path')

// Root folder
const ROOT_FOLDER = '/weather'

// Latest file name
const LATEST_FILE = 'latest.json'

// Configure http client
const client = axios.create({
  baseURL: process.env.IPFS_URL,
  headers: {
    'Accept': 'application/json'
  }
})

function throwWithMessage (error, message) {
  throw new Error(`${message}. ${error.message}`)
}

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
 * Crate all dirs in path, if necessary
 */
function createDirs (path) {
  return client.post(`/api/v0/files/mkdir?arg=${path}&parents=true`)
    .then(response => response.data)
    .catch(err => throwWithMessage(err, `Could not create path [${path}]`))
}

/**
 * Get the IPFS hash of the root folder.
 */
function getRootHash () {
  return client.post(`/api/v0/files/stat?arg=${ROOT_FOLDER}`)
    .then(response => _.get(response, 'data.Hash'))
    .catch(err => throwWithMessage(err, `Could not get root folder [${ROOT_FOLDER}] hash`))
}

/**
 * Get IPFS hash contents (cat).
 */
function getData (hash) {
  return client.post(`/api/v0/cat?arg=${hash}`)
    .then(response => response.data)
    .catch(err => throwWithMessage(err, `Could not get hash data [${hash}]`))
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
  let dirs = path.dirname(destination)
  return createDirs(dirs)
    // Copy with proper filename
    .then(() => {
      return client.post(`/api/v0/files/cp?arg=${source}&arg=${destination}`)
        .then(response => response.data)
        .catch(err => throwWithMessage(err, `Could not copy ${source} to ${destination}`))
    })
    // Copy as latest.json for faster retrieval
    .then(() => {
      let latest = path.join(dirs, LATEST_FILE)
      return client.post(`/api/v0/files/cp?arg=${source}&arg=${latest}`)
        .then(response => response.data)
        .catch(err => throwWithMessage(err, `Could not copy ${source} to ${latest}`))
    })
}

/**
 * Publish hash to IPNS
 */
function publish (hash) {
  return client.post(`/api/v0/name/publish?arg=${hash}`)
    .then(response => response.data)
    .catch(err => throwWithMessage(err, `Could not publish hash ${hash} to IPNS`))
}

/**
 * Update IPNS with the latest root folder hash
 */
function update () {
  return getRootHash().then(hash => publish(hash))
}

module.exports = { isValid, getData, getTelemetryData, copy, update, getRootHash }
