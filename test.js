const console = require('mocha-logger')
const moment = require('moment')

// Load env variables from file
require('dotenv').config()

describe('IPFS Tests', function () {
  const ipfs = require('./ipfs')

  it('Get local MFS root folder hash', function (done) {
    ipfs.getRootHash()
      .then(hash => {
        console.log(`Root folder hash: ${hash}`)
        done()
      })
      .catch(err => done(err))
  })

  it('Get data from IPFS hash', function (done) {
    ipfs.getData('QmeQrHi9zbEQgGAHyfCSXREeHDuF8ctdUGYGVAZARqgcRA')
      .then(data => {
        console.log(`Data: ${JSON.stringify(data)}`)
        done()
      })
      .catch(err => done(err))
  })

  it('Copy file to MFS', function (done) {
    ipfs.copy('QmeQrHi9zbEQgGAHyfCSXREeHDuF8ctdUGYGVAZARqgcRA')
      .then(() => done())
      .catch(err => done(err))
  })

  it('Test all flow', function (done) {
    ipfs.getRootHash()
      .then(hash => {
        console.log(`Root folder hash: ${hash}`)
        return hash
      })
      .then(() => ipfs.copy('QmeQrHi9zbEQgGAHyfCSXREeHDuF8ctdUGYGVAZARqgcRA'))
      .then(() => ipfs.getRootHash())
      .then(hash => {
        console.log(`Root folder new hash: ${hash}`)
        return hash
      })
      .then(() => ipfs.update())
      .then(() => done())
      .catch(err => done(err))
  }).timeout(moment.duration(10, 'minutes').asMilliseconds())
})
