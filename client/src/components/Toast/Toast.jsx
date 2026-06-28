import { useGame } from '../../contexts/GameContext';
import './Toast.css';

export default function Toast() {
  const { notifications, removeNotification } = useGame();

  if (notifications.length === 0) return null;

  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast toast-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="toast-icon">
            {notification.type === 'coin' && '🪙'}
            {notification.type === 'bonus' && '🎉'}
            {notification.type === 'milestone' && '🏆'}
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'info' && 'ℹ️'}
          </div>
          <div className="toast-content">
            <span className="toast-message">{notification.message}</span>
            {notification.subMessage && (
              <span className="toast-sub">{notification.subMessage}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
