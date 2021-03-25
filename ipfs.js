const _ = require('lodash')
const axios = require('axios')
const logger = require('winston')
const moment = require('moment')
const path = require('path')
const telemetry = require('./telemetry')

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
    .then(data => telemetry.toTelemetry(data))
}

/**
 * Copy file with the given IPFS hash to MFS, using the provided filename.
 * Then update the 'latest.json' file in the last dir of the path.
 * Filename defaults to YYYYMMDD_HHmmssSSS.json, using the current timestamp.
 */
function copy (hash, filename = `${moment().format('YYYYMMDD_HHmmssSSS')}.json`) {
  // Destination absolute path
  let destination = path.join(ROOT_FOLDER, filename)
  // Destination dir path
  let dirs = path.dirname(destination)
  // Destination dir latest.json file
  let latest = path.join(dirs, LATEST_FILE)
  // Create directories in path, if missing
  return createDirs(dirs)
    // Copy hash contents to destination file
    .then(() => cp(hash, destination))
    // Delete previous latest.json file
    .then(() => rm(latest))
    // Copy hash contents to latest.json file
    .then(() => cp(hash, latest))
}

function cp (hash, path) {
  return client.post(`/api/v0/files/cp?arg=/ipfs/${hash}&arg=${path}`)
    .then(response => response.data)
    .catch(err => throwWithMessage(err, `Could not copy ${hash} to ${path}`))
}

function rm (path) {
  return client.post(`/api/v0/files/rm?arg=${path}`)
    .then(response => response.data)
    .catch(err => err.response.data)
}

/**
 * Publish hash to IPNS
 */
function publish (hash, lifetime = `${moment.duration(10, 'years').asHours()}h`) {
  return client.post(`/api/v0/name/publish?arg=${hash}&lifetime=${lifetime}&allow-offline=true`)
    .then(response => response.data)
    .catch(err => throwWithMessage(err, `Could not publish hash ${hash} to IPNS`))
}

/**
 * Update IPNS with the latest root folder hash
 */
function update () {
  return getRootHash().then(hash => publish(hash))
}

/**
 * Return MFS file contents
 */
function getLatest (geohash) {
  if (_.isNil(geohash)) throw new Error('Invalid geohash')
  let filepath = path.join(ROOT_FOLDER, geohash, LATEST_FILE)
  return getFile(filepath)
    .then(data => telemetry.toTelemetry(data))
    .then(data => telemetry.toWeather(data))
    .catch(err => throwWithMessage(err, `Could not get latest telemetry for ${geohash}`))
}

/**
 * Return MFS file contents
 */
function getFile (filepath) {
  return client.post(`/api/v0/files/read?arg=${filepath}`)
    .then(response => response.data)
    .catch(err => throwWithMessage(err, `Could not get file content for ${filepath}`))
}

module.exports = { isValid, getData, getTelemetryData, copy, update, getRootHash, getLatest }
