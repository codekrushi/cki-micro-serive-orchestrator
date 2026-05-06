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

const approveQc = async (token, approvalPayload) => {
  return sendJsonRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/qc/approve',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    approvalPayload
  );
};

const runDemo = async () => {
  await connectDb();
  await startIdentityServer();
  await startApiGateway();

  inventoryService.initInventoryListeners();
  billingService.initBillingListeners();
  dispatchService.initDispatchListeners();

  console.log('[Demo] Logging in Sales user');
  const salesAuth = await login('sales@tenant101.local', 'Sales123!');

  const textileOrderPayload = {
    articleId: 'ARTICLE-RED-1000',
    quantity: 1000,
    dynamicAttributes: {
      domain: 'textile',
      GSM: 180,
      Composition: 'Cotton',
      ShadePreference: 'Maroon'
    }
  };

  const createdTextileOrder = await createOrder(salesAuth.token, textileOrderPayload);
  console.log(`\n[Demo] Created textile sales order ${createdTextileOrder.order._id} via API Gateway`);

  const solarOrderPayload = {
    articleId: 'ARTICLE-SOLAR-400W',
    quantity: 50,
    dynamicAttributes: {
      domain: 'solar',
      Wattage: '400W',
      CellType: 'Monocrystalline',
      MountType: 'Rooftop'
    }
  };

  const createdSolarOrder = await createOrder(salesAuth.token, solarOrderPayload);
  console.log(`\n[Demo] Created solar sales order ${createdSolarOrder.order._id} via API Gateway`);

  setTimeout(async () => {
    console.log('[Demo] Logging in QC user');
    const qcAuth = await login('qc@tenant101.local', 'QC123!');
    await approveQc(qcAuth.token, {
      orderId: createdTextileOrder.order._id,
      qcResults: {
        actualLength: 980,
        variance: { GSM: 2, width: 0.5 }
      }
    });
  }, 1200);

  setTimeout(async () => {
    const qcAuth = await login('qc@tenant101.local', 'QC123!');
    await approveQc(qcAuth.token, {
      orderId: createdSolarOrder.order._id,
      qcResults: {
        actualLength: 50,
        variance: { Wattage: '400W', Efficiency: '21%' }
      }
    });
  }, 2400);
};

runDemo().catch((error) => {
  console.error('[Demo] Error:', error);
  process.exit(1);
});
