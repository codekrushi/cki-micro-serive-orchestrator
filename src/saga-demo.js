const connectDb = require('./db');
const http = require('http');
const inventoryService = require('./services/InventoryService');
const billingService = require('./services/BillingService');
const dispatchService = require('./services/DispatchService');
const { startIdentityServer } = require('./identityServer');
const { startApiGateway } = require('./apiGateway');

const sendJsonRequest = (options, body) => {
  return new Promise((resolve, reject) => {
    const requestBody = body ? JSON.stringify(body) : undefined;
    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk.toString();
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) {
            return reject(new Error(`${res.statusCode}: ${parsed.message || data}`));
          }
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    if (requestBody) {
      req.write(requestBody);
    }
    req.end();
  });
};

const login = async (username, password) => {
  return sendJsonRequest(
    {
      hostname: 'localhost',
      port: 4001,
      path: '/auth/login',
      method: 'POST'
    },
    { username, password }
  );
};

const createOrder = async (token, orderPayload) => {
  return sendJsonRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/sales/orders',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    orderPayload
  );
};

const runSagaDemo = async () => {
  await connectDb();
  await startIdentityServer();
  await startApiGateway();

  inventoryService.initInventoryListeners();
  billingService.initBillingListeners();
  dispatchService.initDispatchListeners();

  console.log('[Saga Demo] Logging in Sales user');
  const salesAuth = await login('sales@tenant101.local', 'Sales123!');

  // Demo case 1: Stock failure - Saga rollback from Inventory
  const stockFailOrderPayload = {
    articleId: 'FABRIC_STOCK_FAIL',
    quantity: 100,
    dynamicAttributes: {
      domain: 'textile',
      GSM: 180,
      Composition: 'Cotton',
      ShadePreference: 'Red'
    }
  };

  console.log('\n[Saga Demo] Creating order that will fail at stock check (Saga rollback)');
  const stockFailOrder = await createOrder(salesAuth.token, stockFailOrderPayload);
  console.log(`[Saga Demo] Created failing stock order ${stockFailOrder.order._id} - expect compensation`);

  // Wait for compensation to complete
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Demo case 2: Billing failure - Saga rollback from Billing
  const billFailOrderPayload = {
    articleId: 'FABRIC_BILL_FAIL',
    quantity: 100,
    dynamicAttributes: {
      domain: 'textile',
      GSM: 180,
      Composition: 'Cotton',
      ShadePreference: 'Blue'
    }
  };

  console.log('\n[Saga Demo] Creating order that will fail at billing (Saga rollback)');
  const billFailOrder = await createOrder(salesAuth.token, billFailOrderPayload);
  console.log(`[Saga Demo] Created failing billing order ${billFailOrder.order._id} - expect compensation`);

  // Wait for compensation to complete
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('[Saga Demo] Saga failure demonstration complete');
};

runSagaDemo().catch((error) => {
  console.error('[Saga Demo] Error:', error);
  process.exit(1);
});