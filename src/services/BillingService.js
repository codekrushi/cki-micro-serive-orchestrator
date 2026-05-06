const broker = require('../libs/MessageBroker');
const Order = require('../models/Order');

const calculateInvoice = async (data) => {
  const { orderId } = data;
  const order = await Order.findById(orderId);
  if (!order) {
    console.log(`[Billing] Order ${orderId} not found`);
    await failBilling(orderId, 'ORDER_NOT_FOUND');
    return;
  }

  const purchaseCost = 5000;
  const jobWorkCost = 1200;
  const shrinkage = 20; // example loss
  const usableLength = order.quantity; // assuming quantity is length
  const marginLeakage = purchaseCost * (shrinkage / 100);
  const invoiceAmount = purchaseCost + jobWorkCost - marginLeakage;

  // Simulate billing failure if amount is negative (though it won't be)
  if (invoiceAmount < 0) {
    await failBilling(orderId, 'BILLING_FAILED_NEGATIVE_AMOUNT');
    return;
  }

  // Hardcoded failure for demo
  if (order.articleId === 'FABRIC_BILL_FAIL') {
    await failBilling(orderId, 'BILLING_FAILED_FOR_DEMO');
    return;
  }

  await Order.findByIdAndUpdate(orderId, {
    status: 'BILLED',
    billedAt: new Date(),
    invoiceAmount
  });

  console.log(`[Billing] Invoice for order ${orderId}`);
  console.log(`  Article: ${order.articleId}`);
  console.log(`  Quantity: ${usableLength}`);
  console.log(`  Purchase cost: ${purchaseCost}`);
  console.log(`  Job work cost: ${jobWorkCost}`);
  console.log(`  Margin leakage: ${marginLeakage}`);
  console.log(`  Total invoice amount: ${invoiceAmount}`);
  console.log(`  Dynamic metadata: ${JSON.stringify(Object.fromEntries(order.metadata))}`);

  // Publish success
  await broker.publish('BILLING_COMPLETED', { orderId });
};

const failBilling = async (orderId, reason) => {
  console.log(`[Billing] Failed for Order: ${orderId}, reason: ${reason}`);
  await broker.publish('ORDER_COMPENSATION_REQUIRED', { orderId, reason });
};

const initBillingListeners = () => {
  broker.subscribe('STOCK_RESERVED', calculateInvoice);
};

module.exports = {
  initBillingListeners,
  failBilling
};
