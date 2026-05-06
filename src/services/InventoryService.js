const Order = require('../models/Order');
const broker = require('../libs/MessageBroker');

const reserveStock = async (orderPlaced) => {
  console.log(`[Inventory] Received ORDER_PLACED for article ${orderPlaced.articleId}`);
  await Order.findByIdAndUpdate(orderPlaced.orderId, {
    status: 'RESERVED',
    reservedAt: new Date()
  });

  console.log(`[Inventory] Reserved ${orderPlaced.quantity} units for order ${orderPlaced.orderId}`);
};

const approveQC = async (orderId, qcResults) => {
  await Order.findByIdAndUpdate(orderId, {
    status: 'QC_PASSED',
    qcApprovedAt: new Date(),
    finalLength: qcResults.actualLength
  });

  const order = await Order.findById(orderId);
  await broker.publish('QC_PASSED', {
    orderId: order._id.toString(),
    articleId: order.articleId,
    tenantId: order.tenantId,
    finalLength: qcResults.actualLength,
    qcStatus: 'APPROVED',
    metadata: Object.fromEntries(order.metadata)
  });

  console.log(`[Inventory/QC] QC approved for order ${orderId}`);
};

const initInventoryListeners = () => {
  broker.subscribe('ORDER_PLACED', reserveStock);
};

module.exports = {
  initInventoryListeners,
  approveQC
};
