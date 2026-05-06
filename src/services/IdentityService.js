const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'cki-demo-secret';

const rolePermissions = {
  Admin: ['CREATE_ORDER', 'APPROVE_QC', 'VIEW_ORDERS'],
  Sales: ['CREATE_ORDER'],
  QC: ['APPROVE_QC']
};

const users = [
  {
    username: 'admin@tenant101.local',
    password: 'Admin123!',
    role: 'Admin',
    tenantId: 'tenant_101',
    name: 'Admin User'
  },
  {
    username: 'sales@tenant101.local',
    password: 'Sales123!',
    role: 'Sales',
    tenantId: 'tenant_101',
    name: 'Sales User'
  },
  {
    username: 'qc@tenant101.local',
    password: 'QC123!',
    role: 'QC',
    tenantId: 'tenant_101',
    name: 'QC Inspector'
  },
  {
    username: 'sales@tenant202.local',
    password: 'Sales202!',
    role: 'Sales',
    tenantId: 'tenant_202',
    name: 'Sales User Tenant 202'
  }
];

const findUser = (username) => users.find((user) => user.username === username);

const authenticate = (username, password) => {
  const user = findUser(username);
  if (!user || user.password !== password) {
    return null;
  }

  return {
    username: user.username,
    role: user.role,
    tenantId: user.tenantId,
    name: user.name,
    permissions: rolePermissions[user.role] || []
  };
};

const issueToken = (user) => {
  const payload = {
    sub: user.username,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    permissions: user.permissions
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const hasPermission = (user, permission) => {
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
};

const getRoles = () => {
  return Object.keys(rolePermissions).map((role) => ({
    role,
    permissions: rolePermissions[role]
  }));
};

module.exports = {
  authenticate,
  issueToken,
  verifyToken,
  hasPermission,
  getRoles
};
