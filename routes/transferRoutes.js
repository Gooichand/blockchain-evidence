const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const {
  initiateTransfer,
  acceptTransfer,
  declineTransfer,
  myTransfers,
  recipients,
  caseCustodians,
} = require('../controllers/transferController');

router.post('/evidence/:id/transfer', requireAuth, initiateTransfer);
router.get('/transfers/mine', requireAuth, myTransfers);
router.get('/transfers/recipients', requireAuth, recipients);
router.post('/transfers/:id/accept', requireAuth, acceptTransfer);
router.post('/transfers/:id/decline', requireAuth, declineTransfer);
router.get('/cases/:id/custodians', requireAuth, caseCustodians);

module.exports = router;
