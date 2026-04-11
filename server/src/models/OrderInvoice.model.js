import mongoose from 'mongoose';

const orderInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      default: () => 'FAC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // 1 facture par commande
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Snapshot des lignes au moment de la confirmation
    lines: [
      {
        productName: { type: String },
        quantity:    { type: Number },
        unit:        { type: String },
        unitPrice:   { type: Number },
        total:       { type: Number },
      },
    ],
    totalAmount:  { type: Number, required: true },
    issueDate:    { type: Date, default: Date.now },
    dueDate:      { type: Date }, // +30 jours par défaut
    status: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    deliveryAddress: { type: String },
  },
  { timestamps: true }
);

const OrderInvoice = mongoose.model('OrderInvoice', orderInvoiceSchema);
export default OrderInvoice;
