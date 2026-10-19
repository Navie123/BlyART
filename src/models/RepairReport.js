const mongoose = require('mongoose');

const repairReportSchema = new mongoose.Schema(
  {
    laptop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Laptop',
      required: [true, 'Laptop reference is required'],
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Technician is required'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    problemDescription: {
      type: String,
      required: [true, 'Problem description is required'],
      trim: true,
    },
    actionsTaken: {
      type: String,
      trim: true,
      default: '',
    },
    partsUsed: [
      {
        partName: { type: String, trim: true },
        quantity: { type: Number, default: 1 },
        cost: { type: Number, default: 0 },
      },
    ],
    laborCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'released'],
      default: 'open',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Auto-compute totalCost from parts + labor before saving
repairReportSchema.pre('save', function (next) {
  const partsCost = this.partsUsed.reduce(
    (sum, p) => sum + p.cost * p.quantity,
    0
  );
  this.totalCost = +(partsCost + this.laborCost).toFixed(2);
  next();
});

module.exports = mongoose.model('RepairReport', repairReportSchema);
