import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { shopAPI } from '../../services/api';
import './Shop.css';

const typeFilters = [
  { id: '', label: 'All' },
  { id: 'avatar', label: '👤 Avatars' },
  { id: 'theme', label: '🎨 Themes' },
  { id: 'border', label: '✨ Borders' },
];

const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };

export default function Shop() {
  const { user, updateUser } = useAuth();
  const { addNotification, triggerCoinAnimation } = useGame();
  const [items, setItems] = useState([]);
  const [balance, setBalance] = useState(0);
  const [activeType, setActiveType] = useState('');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  const fetchItems = async (type) => {
    try {
      setLoading(true);
      const res = await shopAPI.getItems(type || undefined);
      setItems(res.data.items || []);
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error('Error fetching shop:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(activeType); }, [activeType]);

  const handlePurchase = async (item) => {
    if (item.owned || balance < item.price) return;
    setPurchasing(item._id);
    try {
      const res = await shopAPI.purchase(item._id);
      addNotification({ type: 'success', message: res.data.message, subMessage: `Balance: ${res.data.coins} coins` });
      setBalance(res.data.coins);
      updateUser({ coins: res.data.coins });
      setItems(items.map(i => i._id === item._id ? { ...i, owned: true } : i));
    } catch (err) {
      const msg = err.response?.data?.message || 'Purchase failed';
      addNotification({ type: 'error', message: msg });
    } finally {
      setPurchasing(null);
    }
  };

  const sortedItems = [...items].sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  return (
    <div className="shop-page">
      <div className="shop-header animate-fade-in-up">
        <div>
          <h1>Shop</h1>
          <p className="shop-subtitle">Spend your hard-earned coins on premium customizations</p>
        </div>
        <div className="shop-balance glass-card">
          <span className="shop-balance-icon">🪙</span>
          <span className="shop-balance-amount">{balance}</span>
          <span className="shop-balance-label">coins</span>
        </div>
      </div>

      {/* Type Filter */}
      <div className="shop-filters animate-fade-in-up">
        {typeFilters.map(f => (
          <button
            key={f.id}
            className={`shop-filter-btn ${activeType === f.id ? 'active' : ''}`}
            onClick={() => setActiveType(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Items */}
      {loading ? (
        <div className="shop-loading"><div className="loading-spinner" /></div>
      ) : (
        <div className="shop-grid stagger-children">
          {sortedItems.map(item => (
            <div
              key={item._id}
              className={`shop-item glass-card rarity-${item.rarity} ${item.owned ? 'shop-item-owned' : ''}`}
            >
              <div className="shop-item-image">
                <span className="shop-item-emoji">
                  {item.type === 'avatar' ? '👤' : item.type === 'theme' ? '🎨' : item.type === 'border' ? '✨' : '🎁'}
                </span>
                {item.previewData && (
                  <div className="theme-preview" style={{
                    background: `linear-gradient(135deg, ${item.previewData.primary}, ${item.previewData.secondary})`,
                  }} />
                )}
              </div>
              <div className="shop-item-info">
                <div className="shop-item-top">
                  <span className={`rarity-tag rarity-tag-${item.rarity}`}>
                    {item.rarity}
                  </span>
                  <span className="shop-item-type">{item.type}</span>
                </div>
                <h3 className="shop-item-name">{item.name}</h3>
                {item.description && <p className="shop-item-desc">{item.description}</p>}
              </div>
              <div className="shop-item-footer">
                {item.owned ? (
                  <span className="shop-owned-badge">✓ Owned</span>
                ) : (
                  <button
                    className={`shop-buy-btn ${balance < item.price ? 'shop-buy-disabled' : ''}`}
                    onClick={() => handlePurchase(item)}
                    disabled={purchasing === item._id || balance < item.price}
                  >
                    <span className="shop-buy-coin">🪙</span>
                    <span>{item.price}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
