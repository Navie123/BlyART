const Laptop = require('../models/Laptop');
const RepairReport = require('../models/RepairReport');

// ═══════════════════════════════════════════════════════════════
//  LAPTOP CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/** POST /api/repairs/laptops */
async function createLaptop(req, res, next) {
  try {
    const { barcode, brand, model, serialNumber, ownerName, ownerContact, notes } = req.body;

    const existing = await Laptop.findOne({ barcode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Barcode already registered' });
    }

    const laptop = await Laptop.create({
      barcode, brand, model, serialNumber,
      ownerName, ownerContact, notes,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: laptop });
  } catch (err) {
    next(err);
  }
}

/** GET /api/repairs/laptops  — optional ?status=pending|in-progress|done|released */
async function getLaptops(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const laptops = await Laptop.find(filter)
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: laptops.length, data: laptops });
  } catch (err) {
    next(err);
  }
}

/** GET /api/repairs/laptops/:id */
async function getLaptop(req, res, next) {
  try {
    const laptop = await Laptop.findById(req.params.id).populate('createdBy', 'fullName username');
    if (!laptop) return res.status(404).json({ success: false, message: 'Laptop not found' });
    res.json({ success: true, data: laptop });
  } catch (err) {
    next(err);
  }
}

/** GET /api/repairs/laptops/barcode/:barcode */
async function getLaptopByBarcode(req, res, next) {
  try {
    const laptop = await Laptop.findOne({ barcode: req.params.barcode })
      .populate('createdBy', 'fullName username');
    if (!laptop) return res.status(404).json({ success: false, message: 'Laptop not found' });
    res.json({ success: true, data: laptop });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/repairs/laptops/:id */
async function updateLaptop(req, res, next) {
  try {
    const allowed = ['brand', 'model', 'serialNumber', 'ownerName', 'ownerContact', 'status', 'notes'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const laptop = await Laptop.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!laptop) return res.status(404).json({ success: false, message: 'Laptop not found' });
    res.json({ success: true, data: laptop });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/repairs/laptops/:id */
async function deleteLaptop(req, res, next) {
  try {
    const laptop = await Laptop.findByIdAndDelete(req.params.id);
    if (!laptop) return res.status(404).json({ success: false, message: 'Laptop not found' });
    // Also remove all linked repair reports
    await RepairReport.deleteMany({ laptop: req.params.id });
    res.json({ success: true, message: 'Laptop and its repair reports deleted' });
  } catch (err) {
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════
//  REPAIR REPORT CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/** POST /api/repairs/reports */
async function createReport(req, res, next) {
  try {
    const { laptop, problemDescription, actionsTaken, partsUsed, laborCost, status, remarks } = req.body;

    // Validate laptop exists
    const unit = await Laptop.findById(laptop);
    if (!unit) return res.status(404).json({ success: false, message: 'Laptop not found' });

    const report = await RepairReport.create({
      laptop,
      technician: req.user._id,
      problemDescription,
      actionsTaken,
      partsUsed: partsUsed || [],
      laborCost: laborCost || 0,
      status: status || 'open',
      remarks,
    });

    // Sync laptop status with report status
    const statusMap = { open: 'pending', 'in-progress': 'in-progress', resolved: 'done', released: 'released' };
    if (statusMap[report.status]) {
      await Laptop.findByIdAndUpdate(laptop, { status: statusMap[report.status] });
    }

    const populated = await report.populate([
      { path: 'laptop', select: 'barcode brand model ownerName' },
      { path: 'technician', select: 'fullName username' },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

/** GET /api/repairs/reports  — optional ?laptopId=&status=&technicianId= */
async function getReports(req, res, next) {
  try {
    const filter = {};
    if (req.query.laptopId)     filter.laptop     = req.query.laptopId;
    if (req.query.status)       filter.status     = req.query.status;
    if (req.query.technicianId) filter.technician = req.query.technicianId;

    const reports = await RepairReport.find(filter)
      .populate('laptop', 'barcode brand model ownerName status')
      .populate('technician', 'fullName username')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    next(err);
  }
}

/** GET /api/repairs/reports/:id */
async function getReport(req, res, next) {
  try {
    const report = await RepairReport.findById(req.params.id)
      .populate('laptop', 'barcode brand model serialNumber ownerName ownerContact status')
      .populate('technician', 'fullName username');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/repairs/reports/:id */
async function updateReport(req, res, next) {
  try {
    const report = await RepairReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const allowed = ['problemDescription', 'actionsTaken', 'partsUsed', 'laborCost', 'status', 'remarks'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) report[f] = req.body[f]; });

    await report.save(); // triggers totalCost pre-save hook

    // Keep laptop status in sync
    const statusMap = { open: 'pending', 'in-progress': 'in-progress', resolved: 'done', released: 'released' };
    if (statusMap[report.status]) {
      await Laptop.findByIdAndUpdate(report.laptop, { status: statusMap[report.status] });
    }

    const populated = await report.populate([
      { path: 'laptop', select: 'barcode brand model ownerName status' },
      { path: 'technician', select: 'fullName username' },
    ]);

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/repairs/reports/:id */
async function deleteReport(req, res, next) {
  try {
    const report = await RepairReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    next(err);
  }
}

// ═══════════════════════════════════════════════════════════════
//  DAILY SUMMARY
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/repairs/daily?date=YYYY-MM-DD
 * Returns all repair reports created on a given date (defaults to today).
 */
async function getDailySummary(req, res, next) {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const reports = await RepairReport.find({ createdAt: { $gte: start, $lte: end } })
      .populate('laptop', 'barcode brand model ownerName status')
      .populate('technician', 'fullName username')
      .sort({ createdAt: 1 });

    const totalRevenue = reports.reduce((sum, r) => sum + r.totalCost, 0);

    res.json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      count: reports.length,
      totalRevenue: +totalRevenue.toFixed(2),
      data: reports,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createLaptop, getLaptops, getLaptop, getLaptopByBarcode, updateLaptop, deleteLaptop,
  createReport, getReports, getReport, updateReport, deleteReport,
  getDailySummary,
};
