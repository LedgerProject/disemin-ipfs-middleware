'use strict'

const fastq = require('fastq')
const ipfs = require('./ipfs')
const logger = require('winston')

const queue = fastq.promise(worker, process.env.CONCURRENCY || 3)

function worker (hash) {
  logger.log('info', `Submitting update work to queue for hash ${hash}`)
  return ipfs.update()
    .then(data => logger.log('info', 'IPNS update success %s', JSON.stringify(data)))
    .catch(err => logger.log('error', err))
}

module.exports = { queue }
