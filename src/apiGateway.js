const express = require('express');
const identityService = require('./services/IdentityService');
const salesService = require('./services/SalesService');
const inventoryService = require('./services/InventoryService');

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const rateLimitStore = new Map();

const rateLimiter = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const entry = rateLimitStore.get(key) || { count: 0, windowStart: now };

  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);

  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ message: 'Rate limit exceeded. Try again in a moment.' });
  }

  next();
};

const authenticateJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header required' });
  }

  const token = authorization.split(' ')[1];
  try {
    req.user = identityService.verifyToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requirePermission = (permission) => (req, res, next) => {
  if (!identityService.hasPermission(req.user, permission)) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions', requiredPermission: permission });
  }
  next();
};

const startApiGateway = (port = 3000) => {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());
    app.use(rateLimiter);

    app.get('/health', (req, res) => {
      return res.json({ status: 'ok', service: 'api-gateway' });
    });

    app.post('/api/sales/orders', authenticateJwt, requirePermission('CREATE_ORDER'), async (req, res) => {
      try {
        const payload = req.body;
        if (!payload.articleId || !payload.quantity) {
          return res.status(400).json({ message: 'articleId and quantity are required' });
        }

        const orderRequest = {
          tenantId: req.user.tenantId,
          articleId: payload.articleId,
          quantity: payload.quantity,
          dynamicAttributes: payload.dynamicAttributes || {}
        };

        const order = await salesService.createSalesOrder(orderRequest);
        return res.status(201).json({ message: 'Order created', order });
      } catch (error) {
        return res.status(500).json({ message: 'Failed to create order', error: error.message });
      }
    });

    app.post('/api/qc/approve', authenticateJwt, requirePermission('APPROVE_QC'), async (req, res) => {
      try {
        const { orderId, qcResults } = req.body;
        if (!orderId || !qcResults) {
          return res.status(400).json({ message: 'orderId and qcResults are required' });
        }

        await inventoryService.approveQC(orderId, qcResults);
        return res.json({ message: 'QC approval processed', orderId });
      } catch (error) {
        return res.status(500).json({ message: 'QC approval failed', error: error.message });
      }
    });

    const server = app.listen(port, () => {
      console.log(`[API Gateway] Listening on http://localhost:${port}`);
      resolve({ app, server });
    });

    server.on('error', reject);
  });
};

module.exports = {
  startApiGateway
};
