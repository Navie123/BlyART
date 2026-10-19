const OjtShift = require('../models/OjtShift');

/**
 * POST /api/ojt
 * Create a new shift (time-in). Only logs for the logged-in user.
 */
async function createShift(req, res, next) {
  try {
    const { date, timeIn, remarks, reportSlipNo } = req.body;
    const shift = await OjtShift.create({
      user: req.user._id,
      date,
      timeIn,
      remarks,
      reportSlipNo,
    });
    res.status(201).json({ success: true, data: shift });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ojt
 * List all shifts for the logged-in user, newest first.
 * Optional query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
async function getShifts(req, res, next) {
  try {
    const filter = { user: req.user._id };

    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to)   filter.date.$lte = new Date(req.query.to);
    }

    const shifts = await OjtShift.find(filter).sort({ date: -1 });
    res.json({ success: true, count: shifts.length, data: shifts });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ojt/:id
 * Get a single shift (must belong to the logged-in user).
 */
async function getShift(req, res, next) {
  try {
    const shift = await OjtShift.findOne({ _id: req.params.id, user: req.user._id });
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });
    res.json({ success: true, data: shift });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/ojt/:id
 * Update a shift — used to set timeOut (which triggers auto-compute of hoursRendered).
 */
async function updateShift(req, res, next) {
  try {
    const shift = await OjtShift.findOne({ _id: req.params.id, user: req.user._id });
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });

    const { timeOut, remarks, reportSlipNo } = req.body;
    if (timeOut    !== undefined) shift.timeOut      = timeOut;
    if (remarks    !== undefined) shift.remarks      = remarks;
    if (reportSlipNo !== undefined) shift.reportSlipNo = reportSlipNo;

    await shift.save(); // triggers pre-save hoursRendered computation
    res.json({ success: true, data: shift });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/ojt/:id
 */
async function deleteShift(req, res, next) {
  try {
    const shift = await OjtShift.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });
    res.json({ success: true, message: 'Shift deleted' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ojt/summary
 * Total hours rendered across all shifts for the logged-in user.
 */
async function getSummary(req, res, next) {
  try {
    const result = await OjtShift.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalHours:  { $sum: '$hoursRendered' },
          totalShifts: { $sum: 1 },
        },
      },
    ]);

    const summary = result[0] || { totalHours: 0, totalShifts: 0 };
    res.json({
      success: true,
      data: {
        totalShifts: summary.totalShifts,
        totalHours:  +summary.totalHours.toFixed(2),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createShift, getShifts, getShift, updateShift, deleteShift, getSummary };
