const mongoose = require('mongoose');

const ojtShiftSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Shift date is required'],
    },
    timeIn: {
      type: String, // stored as "HH:MM" (24-hour)
      required: [true, 'Time-in is required'],
      match: [/^\d{2}:\d{2}$/, 'timeIn must be in HH:MM format'],
    },
    timeOut: {
      type: String, // stored as "HH:MM" (24-hour)
      default: null,
      match: [/^\d{2}:\d{2}$/, 'timeOut must be in HH:MM format'],
    },
    hoursRendered: {
      type: Number, // auto-computed when timeOut is set
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    reportSlipNo: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Auto-compute hoursRendered whenever timeOut is set
ojtShiftSchema.pre('save', function (next) {
  if (this.timeIn && this.timeOut) {
    const [inH, inM] = this.timeIn.split(':').map(Number);
    const [outH, outM] = this.timeOut.split(':').map(Number);
    const totalMinutes = outH * 60 + outM - (inH * 60 + inM);
    this.hoursRendered = totalMinutes > 0 ? +(totalMinutes / 60).toFixed(2) : 0;
  }
  next();
});

module.exports = mongoose.model('OjtShift', ojtShiftSchema);
