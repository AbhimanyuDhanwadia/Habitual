import express from 'express';
import ShopItem from '../models/ShopItem.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { purchaseItem } from '../services/rewardService.js';

const router = express.Router();
router.use(auth);

// GET /api/shop?type=avatar
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const query = {};
    if (type) query.type = type;

    const items = await ShopItem.find(query).sort({ rarity: 1, price: 1 });

    // Mark owned items
    const user = await User.findById(req.user._id);
    const ownedIds = user.ownedItems.map(id => id.toString());

    const itemsWithStatus = items.map(item => ({
      ...item.toObject(),
      owned: ownedIds.includes(item._id.toString()),
    }));

    res.json({
      items: itemsWithStatus,
      balance: user.coins,
    });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ message: 'Error fetching shop items' });
  }
});

// POST /api/shop/purchase/:itemId
router.post('/purchase/:itemId', async (req, res) => {
  try {
    const item = await ShopItem.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const result = await purchaseItem(req.user._id, item._id, item.price);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json({
      message: `Purchased "${item.name}"!`,
      coins: result.coins,
      item,
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ message: 'Error purchasing item' });
  }
});

// GET /api/shop/inventory
router.get('/inventory', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('ownedItems');
    res.json({
      items: user.ownedItems,
      balance: user.coins,
    });
  } catch (error) {
    console.error('Inventory error:', error);
    res.status(500).json({ message: 'Error fetching inventory' });
  }
});

export default router;
