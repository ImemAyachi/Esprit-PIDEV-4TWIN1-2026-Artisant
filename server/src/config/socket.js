/**
 * Configuration Socket.io
 * Gère les salles par utilisateur et les événements temps réel
 */

// Map userId → socketId pour cibler les notifications individuelles
const userSocketMap = new Map();

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connecté : ${socket.id}`);

    // L'utilisateur s'identifie avec son userId
    socket.on('join', (userId) => {
      userSocketMap.set(userId, socket.id);
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} rejoint la salle user_${userId}`);
    });

    // Rejoindre une salle de projet (pour les chantiers)
    socket.on('joinProject', (projectId) => {
      socket.join(`project_${projectId}`);
    });

    socket.on('disconnect', () => {
      // Supprimer le mapping à la déconnexion
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          break;
        }
      }
      console.log(`❌ Socket déconnecté : ${socket.id}`);
    });
  });
};

/**
 * Émet une notification à un utilisateur spécifique
 * Utilisé depuis les controllers : req.io.to(`user_${userId}`).emit(...)
 */
export const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

export { userSocketMap };
