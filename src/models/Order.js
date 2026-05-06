const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  articleId: { type: String, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, required: true, default: 'PENDING_RESERVATION' },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  reservedAt: { type: Date },
  qcApprovedAt: { type: Date },
  finalLength: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
