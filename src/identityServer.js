const express = require('express');
const identityService = require('./services/IdentityService');

const startIdentityServer = (port = 4001) => {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());

    app.post('/auth/login', (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required' });
      }

      const user = identityService.authenticate(username, password);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = identityService.issueToken(user);
      return res.json({
        token,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId,
        permissions: user.permissions
      });
    });

    app.get('/auth/roles', (req, res) => {
      return res.json(identityService.getRoles());
    });

    app.get('/health', (req, res) => {
      return res.json({ status: 'ok', service: 'identity' });
    });

    const server = app.listen(port, () => {
      console.log(`[Identity] Service listening on http://localhost:${port}`);
      resolve({ app, server });
    });

    server.on('error', reject);
  });
};

module.exports = {
  startIdentityServer
};
