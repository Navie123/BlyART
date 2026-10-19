const express = require('express');
const {
  // Laptops
  createLaptop,
  getLaptops,
  getLaptop,
  getLaptopByBarcode,
  updateLaptop,
  deleteLaptop,
  // Repair reports
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  // Daily summary
  getDailySummary,
} = require('../controllers/repairController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All repair routes require login
router.use(protect);

// ── Laptops ──────────────────────────────────────────────────────────────────
router.route('/laptops')
  .get(getLaptops)                                   // GET  /api/repairs/laptops
  .post(authorize('admin', 'technician'), createLaptop); // POST /api/repairs/laptops

router.get('/laptops/barcode/:barcode', getLaptopByBarcode); // GET /api/repairs/laptops/barcode/:barcode

router.route('/laptops/:id')
  .get(getLaptop)                                    // GET    /api/repairs/laptops/:id
  .put(authorize('admin', 'technician'), updateLaptop)  // PUT    /api/repairs/laptops/:id
  .delete(authorize('admin'), deleteLaptop);         // DELETE /api/repairs/laptops/:id (admin only)

// ── Repair reports ────────────────────────────────────────────────────────────
router.get('/daily', getDailySummary);               // GET /api/repairs/daily?date=YYYY-MM-DD

router.route('/reports')
  .get(getReports)                                   // GET  /api/repairs/reports
  .post(authorize('admin', 'technician'), createReport); // POST /api/repairs/reports

router.route('/reports/:id')
  .get(getReport)                                    // GET    /api/repairs/reports/:id
  .put(authorize('admin', 'technician'), updateReport)  // PUT    /api/repairs/reports/:id
  .delete(authorize('admin'), deleteReport);         // DELETE /api/repairs/reports/:id (admin only)

module.exports = router;
