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

function getRootHash () {
  return client.post(`/api/v0/files/stat?arg=${ROOT_FOLDER}`)
    .then(response => _.get(response, 'data.Hash'))
}

function getData (hash) {
  return client.post(`/api/v0/cat?arg=${hash}`)
    .then(response => response.data)
}

function cp (hash, filename = `data_${moment().format('YYYYMMDD_HHmmssSSS')}.json`) {
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
  getRootHash: getRootHash,
  getData: getData,
  cp: cp,
  publish: publish,
  publishRoot: publishRoot
}
