const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    sender: { type: String, enum: ['user', 'admin'], required: true },
    read: { type: Boolean, default: false },
    // The admin (StaffUser) who wrote an admin reply. Set on replies from this version on; older
    // replies have no sender recorded, so nobody can prove ownership of them and they can't be
    // deleted as "my message".
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffUser', default: null },
    // Soft delete for admin replies: the text stays in the database for the record, but the API
    // never returns it once deletedAt is set — every reader sees "This message was deleted".
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffUser', default: null },
  },
  { timestamps: true }
);

messageSchema.index({ userId: 1, createdAt: 1 });
messageSchema.index({ sender: 1, read: 1 });
// Admin activity feed: newest donor messages.
messageSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
