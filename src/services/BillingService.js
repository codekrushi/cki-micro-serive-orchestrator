const broker = require('../libs/MessageBroker');

const calculateInvoice = async ({ orderId, articleId, finalLength, metadata }) => {
  const purchaseCost = 5000;
  const jobWorkCost = 1200;
  const shrinkage = 20; // example loss
  const usableLength = finalLength;
  const marginLeakage = purchaseCost * (shrinkage / 100);
  const invoiceAmount = purchaseCost + jobWorkCost - marginLeakage;

  console.log(`[Billing] Invoice for order ${orderId}`);
  console.log(`  Article: ${articleId}`);
  console.log(`  Final length: ${usableLength}`);
  console.log(`  Purchase cost: ${purchaseCost}`);
  console.log(`  Job work cost: ${jobWorkCost}`);
  console.log(`  Margin leakage: ${marginLeakage}`);
  console.log(`  Total invoice amount: ${invoiceAmount}`);
  console.log(`  Dynamic metadata: ${JSON.stringify(metadata)}`);
};

const initBillingListeners = () => {
  broker.subscribe('QC_PASSED', calculateInvoice);
};

module.exports = {
  initBillingListeners
};
