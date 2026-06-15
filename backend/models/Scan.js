const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    target: {
      type: String,
      required: true,
      trim: true,
    },
    scanType: {
      type: String,
      enum: [
        'quick',
        'full',
        'stealth',
        'udp',
        'vulnerability',
        'web',
        'lan-discovery',
        'msf-vulnerability',
        'msf-exploit',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    results: {
      hostDiscovery: String,
      portScan: String,
      serviceDetection: String,
      osDetection: String,
      vulnerabilities: [String],
      msfAnalysis: String,
      msfExploit: String,
      riskLevel: String,
      summary: String,
    },
    startTime: Date,
    endTime: Date,
    duration: Number, // in seconds
    ports: {
      open: [Number],
      closed: [Number],
      filtered: [Number],
    },
    threats: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
    },
    reportPath: String,
    notes: String,
    tags: [String],
    isBookmarked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scan', ScanSchema);
