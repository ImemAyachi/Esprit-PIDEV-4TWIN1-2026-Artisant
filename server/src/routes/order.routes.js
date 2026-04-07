import express from 'express';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import Notification from '../models/Notification.model.js';
import OrderInvoice from '../models/OrderInvoice.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

// ── Créer une commande ──────────────────────────────────────────────────────
router.post('/', asyncHandler(async (req, res) => {
  const { items, deliveryAddress, projectId } = req.body;
  const firstProduct = await Product.findById(items[0].product);
  if (!firstProduct) throw new AppError('Produit introuvable', 404);
  const order = await Order.create({
    buyer: req.user._id, supplier: firstProduct.supplier,
    items, deliveryAddress, project: projectId,
  });
  const notification = await Notification.create({
    recipient: firstProduct.supplier, type: 'order_placed',
    title: 'Nouvelle commande',
    message: `Commande de ${order.totalAmount} TND reçue`,
    link: `/dashboard/supplier/orders`,
    data: { orderId: order._id },
  });
  req.app.get('io').to(`user_${firstProduct.supplier}`).emit('notification', notification);
  res.status(201).json({ success: true, order });
}));

// ── Lister les commandes (filtré par rôle) ──────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'Fournisseur' ? { supplier: req.user._id }
    : req.user.role === 'SuperAdmin' ? {}
    : { buyer: req.user._id };
  const orders = await Order.find(filter)
    .populate('buyer',         'firstName lastName avatar email')
    .populate('supplier',      'firstName lastName companyName')
    .populate('items.product', 'name category unit')
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
}));

// ── Mettre à jour le statut (Fournisseur) ──────────────────────────────────
router.put('/:id/status', authorize('Fournisseur', 'SuperAdmin'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate('buyer',    'firstName lastName email')
    .populate('supplier', 'firstName lastName companyName')
    .populate('items.product', 'name unit');
  if (!order) throw new AppError('Commande introuvable', 404);

  const statusLabels = { confirmed: 'Confirmée', processing: 'En traitement', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };
  const notifTypeMap = {
    confirmed:  'order_confirmed',
    processing: 'order_processing',
    shipped:    'order_shipped',
    delivered:  'order_delivered',
    cancelled:  'order_cancelled',
  };
  const notifType = notifTypeMap[status] || 'order_confirmed';

  const notification = await Notification.create({
    recipient: order.buyer._id,
    type: notifType,
    title: `Commande ${statusLabels[status] || status}`,
    message: `Votre commande est maintenant : ${statusLabels[status] || status}`,
    link: `/dashboard/my-orders`,
  });
  req.app.get('io').to(`user_${order.buyer._id}`).emit('notification', notification);
  res.json({ success: true, order });
}));

// ── Générer la facture manuellement (bouton Fournisseur) ──────────────────
router.post('/:id/generate-invoice', authorize('Fournisseur', 'SuperAdmin'), asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer',    'firstName lastName email')
    .populate('supplier', 'firstName lastName companyName')
    .populate('items.product', 'name unit');
  if (!order) throw new AppError('Commande introuvable', 404);
  if (order.supplier._id.toString() !== req.user._id.toString() && req.user.role !== 'SuperAdmin') {
    throw new AppError('Non autorisé', 403);
  }

  // Une seule facture par commande
  const existing = await OrderInvoice.findOne({ order: order._id });
  if (existing) {
    return res.json({ success: true, invoice: existing, alreadyExists: true });
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const invoice = await OrderInvoice.create({
    order:    order._id,
    buyer:    order.buyer._id,
    supplier: order.supplier._id,
    lines: order.items.map(item => ({
      productName: item.product?.name || 'Produit',
      quantity:    item.quantity,
      unit:        item.product?.unit || 'unité',
      unitPrice:   item.unitPrice,
      total:       item.quantity * item.unitPrice,
    })),
    totalAmount:     order.totalAmount,
    deliveryAddress: order.deliveryAddress?.address,
    dueDate,
  });

  // Notifier l'acheteur
  const notification = await Notification.create({
    recipient: order.buyer._id,
    type: 'invoice_generated',
    title: 'Facture disponible',
    message: `Votre facture ${invoice.invoiceNumber} est disponible`,
    link: `/dashboard/my-orders`,
  });
  req.app.get('io').to(`user_${order.buyer._id}`).emit('notification', notification);

  res.status(201).json({ success: true, invoice });
}));

// ── Récupérer la facture d'une commande ────────────────────────────────────
router.get('/:id/invoice', asyncHandler(async (req, res) => {
  const invoice = await OrderInvoice.findOne({ order: req.params.id })
    .populate('buyer',    'firstName lastName email')
    .populate('supplier', 'firstName lastName companyName');
  if (!invoice) return res.json({ success: true, invoice: null });
  res.json({ success: true, invoice });
}));

// ── Modifier une commande (acheteur, seulement si pending) ─────────────────
router.put('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Commande introuvable', 404);
  if (order.buyer.toString() !== req.user._id.toString()) throw new AppError('Non autorisé', 403);
  if (order.status !== 'pending') throw new AppError('Impossible de modifier une commande déjà traitée', 400);
  const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, order: updatedOrder });
}));

// ── Supprimer/Annuler une commande (acheteur, seulement si pending) ─────────
router.delete('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Commande introuvable', 404);
  if (order.buyer.toString() !== req.user._id.toString()) throw new AppError('Non autorisé', 403);
  if (order.status !== 'pending') throw new AppError("Impossible d'annuler une commande déjà validée", 400);
  await Order.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Commande supprimée avec succès' });
}));

export default router;
