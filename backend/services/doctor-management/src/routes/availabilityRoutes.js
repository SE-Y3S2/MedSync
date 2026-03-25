const express = require('express');
const router = express.Router({ mergeParams: true });
const availabilityController = require('../controllers/availabilityController');

router.post('/', availabilityController.addSlot);
router.get('/', availabilityController.getSlots);
router.delete('/:slotId', availabilityController.deleteSlot);

module.exports = router;
