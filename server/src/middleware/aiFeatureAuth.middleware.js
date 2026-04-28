import mongoose from 'mongoose';
import { protect } from './auth.middleware.js';

function isMongoReady() {
  return mongoose.connection?.readyState === 1;
}

export async function aiFeatureProtect(req, res, next) {
  const isDev = String(process.env.NODE_ENV || '').toLowerCase() !== 'production';
  const hasAuth = Boolean(req.headers?.authorization);
  if (isMongoReady() && (!isDev || hasAuth)) return protect(req, res, next);

  req.user = { _id: '000000000000000000000001', role: 'Dev' };
  next();
}
