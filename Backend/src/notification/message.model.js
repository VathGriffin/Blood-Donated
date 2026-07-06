const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    sender: { type: String, enum: ['user', 'admin'], required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ userId: 1, createdAt: 1 });
messageSchema.index({ sender: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);
