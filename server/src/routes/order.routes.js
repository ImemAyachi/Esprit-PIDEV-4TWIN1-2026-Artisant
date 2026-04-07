import express from 'express'; import Order from '../models/Order.model.js'; import Product from '../models/Product.model.js'; import Notification from '../models/Notification.model.js'; import { asyncHandler, AppError } from '../middleware/error.middleware.js'; import { protect, authorize } from '../middleware/auth.middleware.js';
const router = express.Router();
router.use(protect);
router.post('/', asyncHandler(async (req, res) => {
  const { items, deliveryAddress, projectId } = req.body;
  // Récupérer le fournisseur depuis le premier produit
  const firstProduct = await Product.findById(items[0].product);
  if (!firstProduct) throw new AppError('Produit introuvable', 404);
  const order = await Order.create({ buyer: req.user._id, supplier: firstProduct.supplier, items, deliveryAddress, project: projectId });
  const notification = await Notification.create({ recipient: firstProduct.supplier, type: 'order_placed', title: 'Nouvelle commande', message: `Commande de ${order.totalAmount} TND reçue`, link: `/orders/${order._id}`, data: { orderId: order._id } });
  req.app.get('io').to(`user_${firstProduct.supplier}`).emit('notification', notification);
  res.status(201).json({ success: true, order });
}));
router.get('/', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'Fournisseur' ? { supplier: req.user._id } : req.user.role === 'SuperAdmin' ? {} : { buyer: req.user._id };
  const orders = await Order.find(filter).populate('buyer', 'firstName lastName avatar').populate('supplier', 'firstName lastName companyName').populate('items.product', 'name category').sort({ createdAt: -1 });
  res.json({ success: true, orders });
}));
router.put('/:id/status', authorize('Fournisseur', 'SuperAdmin'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) throw new AppError('Commande introuvable', 404);
  const notification = await Notification.create({ recipient: order.buyer, type: `order_${status}`, title: `Commande ${status}`, message: `Votre commande est maintenant : ${status}`, link: `/orders/${order._id}` });
  req.app.get('io').to(`user_${order.buyer}`).emit('notification', notification);
  res.json({ success: true, order });
}));
export default router;
