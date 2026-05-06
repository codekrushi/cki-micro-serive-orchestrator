const Order = require('../models/Order');
const broker = require('../libs/MessageBroker');

const createSalesOrder = async (orderData) => {
  const newOrder = await Order.create({
    ...orderData,
    status: 'PENDING_RESERVATION',
    metadata: orderData.dynamicAttributes || {}
  });

  await broker.publish('ORDER_PLACED', {
    orderId: newOrder._id.toString(),
    articleId: newOrder.articleId,
    quantity: newOrder.quantity,
    tenantId: newOrder.tenantId,
    metadata: Object.fromEntries(newOrder.metadata)
  });

  return newOrder;
};

broker.subscribe('ORDER_COMPENSATION_REQUIRED', async (data) => {
    console.log(`[Sales] Rolling back Order: ${data.orderId}. Reason: ${data.reason}`);
    await Order.findByIdAndUpdate(data.orderId, { 
        status: 'CANCELLED_SYSTEM',
        reason: data.reason 
    });
});

module.exports = {
  createSalesOrder
};
