import mongoose from 'mongoose';

const AdSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'slider', 'right-top', 'right-bottom', 'post-ad'
  content: { type: mongoose.Schema.Types.Mixed, required: true }, // JSON or structured
  order: { type: Number, default: 0 }, // for sorting (e.g., slider order)
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const AdModel = mongoose.model('Ad', AdSchema);
export default AdModel; 