const express = require('express')
const queue = require('../queue')

// Create router
const router = express.Router()

/**
 * Update root hash on IPNS
 * TODO Experimental feature. Not documented on purpose.
 */
router.post('/update', (req, res) => {
  queue.queue.push()
  return res.status(200).end()
})

module.exports = router
