const broker = require('../libs/MessageBroker');

const prepareDispatch = async (qcPassed) => {
  const barcode = `R-${qcPassed.orderId}-${Date.now()}`;
  console.log(`[Dispatch] QC passed for order ${qcPassed.orderId}`);
  console.log(`  Generating roll barcode: ${barcode}`);
  console.log(`  Dispatch ready for article ${qcPassed.articleId}`);
};

const initDispatchListeners = () => {
  broker.subscribe('QC_PASSED', prepareDispatch);
};

module.exports = {
  initDispatchListeners
};
