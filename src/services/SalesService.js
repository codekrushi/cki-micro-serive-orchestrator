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

module.exports = {
  createSalesOrder
};
