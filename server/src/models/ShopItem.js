import mongoose from 'mongoose';

const shopItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['avatar', 'theme', 'border', 'palette'],
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  imageUrl: {
    type: String,
  },
  previewData: {
    type: mongoose.Schema.Types.Mixed, // JSON for theme configs
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

shopItemSchema.index({ type: 1 });
shopItemSchema.index({ rarity: 1 });

const ShopItem = mongoose.model('ShopItem', shopItemSchema);
export default ShopItem;
