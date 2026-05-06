const Order = require('../models/Order');
const broker = require('../libs/MessageBroker');

const checkStock = async (articleId, quantity) => {
  // Placeholder: Implement actual stock checking logic
  // For example, query an inventory collection or model
  // Return true if stock is available, false otherwise
  console.log(`[Inventory] Checking stock for article ${articleId}, quantity ${quantity}`);
  if (articleId === 'FABRIC_STOCK_FAIL') {
    return false; // Hardcoded failure for demo
  }
  return true; // Assume stock is available for now
};

const handleOrderPlaced = async (data) => {
  console.log(`[Inventory] Received ORDER_PLACED for article ${data.articleId}`);
  const isStockAvailable = await checkStock(data.articleId, data.quantity);

  if (isStockAvailable) {
    console.log(`[Inventory] Stock Reserved for: ${data.orderId}`);
    await Order.findByIdAndUpdate(data.orderId, {
      status: 'RESERVED',
      reservedAt: new Date()
    });
    await broker.publish('STOCK_RESERVED', { orderId: data.orderId });
  } else {
    // Trigger Compensation
    await broker.publish('ORDER_COMPENSATION_REQUIRED', {
      orderId: data.orderId,
      reason: 'INSUFFICIENT_STOCK'
    });
  }
};

const handleQCFailed = async (data) => {
  console.log(`[Inventory] Releasing stock for Order: ${data.orderId}`);
  // Logic to move stock from 'Reserved' back to 'Free'
  // Placeholder: Implement actual stock release logic
  // For example, update inventory status
  await Order.findByIdAndUpdate(data.orderId, {
    status: 'STOCK_RELEASED',
    releasedAt: new Date()
  });
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

const failQC = async (orderId, reason) => {
  console.log(`[QC] Failed for Order: ${orderId}`);

  // Publish failure to trigger Inventory release and Sales cancellation
  await broker.publish('QC_FAILED', { orderId: orderId, reason: reason });
  await broker.publish('ORDER_COMPENSATION_REQUIRED', { orderId: orderId, reason: reason });
};

const initInventoryListeners = () => {
  broker.subscribe('ORDER_PLACED', handleOrderPlaced);
  broker.subscribe('QC_FAILED', handleQCFailed);
};

module.exports = {
  initInventoryListeners,
  approveQC,
  failQC
};
