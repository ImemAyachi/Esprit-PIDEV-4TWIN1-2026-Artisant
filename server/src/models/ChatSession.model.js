import mongoose from 'mongoose';

const chatTurnSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    summary: { type: String, default: '' },
    turns: { type: [chatTurnSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

chatSessionSchema.pre('save', function () {
  this.updatedAt = new Date();
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;

