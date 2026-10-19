const express = require('express');
const {
  createShift,
  getShifts,
  getShift,
  updateShift,
  deleteShift,
  getSummary,
} = require('../controllers/ojtController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All OJT routes require a logged-in user
router.use(protect);

router.get('/summary', getSummary);      // GET  /api/ojt/summary
router.route('/')
  .get(getShifts)                        // GET  /api/ojt
  .post(createShift);                    // POST /api/ojt

router.route('/:id')
  .get(getShift)                         // GET  /api/ojt/:id
  .put(updateShift)                      // PUT  /api/ojt/:id
  .delete(deleteShift);                  // DELETE /api/ojt/:id

module.exports = router;
