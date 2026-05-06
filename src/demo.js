const connectDb = require('./db');
const salesService = require('./services/SalesService');
const inventoryService = require('./services/InventoryService');
const billingService = require('./services/BillingService');
const dispatchService = require('./services/DispatchService');

const runDemo = async () => {
  await connectDb();

  inventoryService.initInventoryListeners();
  billingService.initBillingListeners();
  dispatchService.initDispatchListeners();

  const textileOrder = {
    tenantId: 'tenant_101',
    articleId: 'ARTICLE-RED-1000',
    quantity: 1000,
    dynamicAttributes: {
      domain: 'textile',
      GSM: 180,
      Composition: 'Cotton',
      ShadePreference: 'Maroon'
    }
  };

  const newOrder = await salesService.createSalesOrder(textileOrder);
  console.log(`\n[Demo] Created textile sales order ${newOrder._id} for article ${newOrder.articleId}\n`);

  const solarOrder = await salesService.createSalesOrder({
    tenantId: 'tenant_202',
    articleId: 'ARTICLE-SOLAR-400W',
    quantity: 50,
    dynamicAttributes: {
      domain: 'solar',
      Wattage: '400W',
      CellType: 'Monocrystalline',
      MountType: 'Rooftop'
    }
  });
  console.log(`\n[Demo] Created solar sales order ${solarOrder._id} for article ${solarOrder.articleId}\n`);

  setTimeout(async () => {
    await inventoryService.approveQC(newOrder._id, {
      actualLength: 980,
      variance: { GSM: 2, width: 0.5 }
    });
  }, 1000);

  setTimeout(async () => {
    await inventoryService.approveQC(solarOrder._id, {
      actualLength: 50,
      variance: { Wattage: '400W', Efficiency: '21%' }
    });
  }, 1800);
};

runDemo().catch((error) => {
  console.error('[Demo] Error:', error);
  process.exit(1);
});
