/**
 * Modèle Notification — Notifications en temps réel
 *
 * Utilisé avec Socket.io pour pousser les alertes en temps réel
 *
 * MongoDB Compass :
 *   Non lues d'un user  : { recipient: ObjectId("..."), isRead: false }
 *   Type devis          : { type: "quote_received" }
 */
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'quote_received',    // Un artisan a reçu une demande de devis
        'quote_submitted',   // Un artisan a soumis un devis
        'quote_accepted',    // Le devis a été accepté
        'quote_refused',     // Le devis a été refusé
        'order_placed',      // Nouvelle commande
        'order_confirmed',   // Commande confirmée par le fournisseur
        'order_shipped',     // Commande expédiée
        'order_delivered',   // Commande livrée
        'review_received',   // Nouvel avis reçu
        'account_verified',  // Compte validé par le SuperAdmin
        'new_message',       // Message reçu
        'project_update',    // Mise à jour d'un chantier
      ],
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false, index: true },

    // Liens vers les documents concernés (pour navigation au clic)
    link: { type: String }, // URL frontend ex: /quotes/123
    data: { type: mongoose.Schema.Types.Mixed }, // Données complémentaires
  },
  { timestamps: true }
);

// Index TTL : suppression auto des notifications lues après 30 jours
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { isRead: true } }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
