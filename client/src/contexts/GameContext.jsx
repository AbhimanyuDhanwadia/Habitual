import { createContext, useContext, useReducer, useCallback } from 'react';

const GameContext = createContext(null);

const initialState = {
  // Notifications for coin rewards and milestones
  notifications: [],
  // Animation trigger for coin fly effect
  coinAnimation: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, { ...action.payload, id: Date.now() }],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case 'TRIGGER_COIN_ANIMATION':
      return { ...state, coinAnimation: action.payload };
    case 'CLEAR_COIN_ANIMATION':
      return { ...state, coinAnimation: null };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const addNotification = useCallback((notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    // Auto-remove after 4 seconds
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id || Date.now() });
    }, 4000);
  }, []);

  const removeNotification = useCallback((id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const triggerCoinAnimation = useCallback((amount) => {
    dispatch({ type: 'TRIGGER_COIN_ANIMATION', payload: amount });
    setTimeout(() => {
      dispatch({ type: 'CLEAR_COIN_ANIMATION' });
    }, 1500);
  }, []);

  // Process a reward response from the API
  const processReward = useCallback((rewardData, streakData) => {
    if (rewardData?.earned) {
      triggerCoinAnimation(rewardData.earned);
      addNotification({
        type: 'coin',
        message: `+${rewardData.earned} coins`,
        subMessage: 'Task completed!',
      });
    }

    if (rewardData?.dailyBonus) {
      setTimeout(() => {
        addNotification({
          type: 'bonus',
          message: `+${rewardData.dailyBonus} bonus coins`,
          subMessage: '🎉 All daily tasks completed!',
        });
      }, 800);
    }

    if (streakData?.milestoneReward) {
      setTimeout(() => {
        addNotification({
          type: 'milestone',
          message: streakData.milestoneReward.label,
          subMessage: `+${streakData.milestoneReward.coins} coins!`,
        });
      }, 1600);
    }
  }, [triggerCoinAnimation, addNotification]);

  return (
    <GameContext.Provider value={{
      ...state,
      addNotification,
      removeNotification,
      triggerCoinAnimation,
      processReward,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export default GameContext;
