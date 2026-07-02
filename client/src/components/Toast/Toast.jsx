import { useNotifications } from '../../contexts/NotificationContext';
import './Toast.css';

export default function Toast() {
  const { notifications, removeNotification } = useNotifications();

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
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'info' && 'ℹ️'}
            {notification.type === 'warning' && '⚠️'}
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
