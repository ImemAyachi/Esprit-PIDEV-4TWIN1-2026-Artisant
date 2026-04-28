import express from 'express';
import Notification from '../models/Notification.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ success: true, notifications, unreadCount });
}));

router.put('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
}));

router.put('/:id/read', asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true }
  );
  res.json({ success: true });
}));

export default router;
