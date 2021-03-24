const _ = require('lodash')
const axios = require('axios')
const logger = require('winston')
const moment = require('moment')

// Root folder
const ROOT_FOLDER = '/weather'

// Configure http client
const client = axios.create({
  baseURL: process.env.IPFS_URL,
  headers: {
    'Accept': 'application/json'
  }
})

function isValid (hash) {
  return _.size(hash) === 46
}

function isTelemetry (data) {
  return _.has(data, 'ts') && _.has(data, 'values') && _.has(data, 'geohash')
}

function getRootHash () {
  return client.post(`/api/v0/files/stat?arg=${ROOT_FOLDER}`)
    .then(response => _.get(response, 'data.Hash'))
}

function getData (hash) {
  return client.post(`/api/v0/cat?arg=${hash}`)
    .then(response => response.data)
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

function cp (hash, filename = `${moment().format('YYYYMMDD_HHmmssSSS')}.json`) {
  let source = `/ipfs/${hash}`
  let destination = `${ROOT_FOLDER}/${filename}`
  return client.post(`/api/v0/files/cp?arg=${source}&arg=${destination}`)
    .then(response => response.data)
}

function publishRoot () {
  return getRootHash().then(hash => publish(hash))
}

function publish (hash) {
  return client.post(`/api/v0/name/publish?arg=${hash}`)
    .then(response => response.data)
}

module.exports = {
  isValid: isValid,
  getRootHash: getRootHash,
  getData: getData,
  cp: cp,
  publish: publish,
  publishRoot: publishRoot
}
