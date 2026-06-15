import { useApp } from '../context/AppContext';

export default function Notifications() {
  const { notifications } = useApp();

  if (notifications.length === 0) return null;

  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const colorMap = {
    success: 'var(--color-success-500)',
    error: 'var(--color-danger-500)',
    warning: 'var(--color-warning-500)',
    info: 'var(--color-info-500)',
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '400px',
    }}>
      {notifications.map(notif => (
        <div
          key={notif.id}
          className="toast"
          style={{
            position: 'relative',
            borderLeft: `4px solid ${colorMap[notif.type] || colorMap.info}`,
          }}
        >
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
            {iconMap[notif.type] || iconMap.info}
          </span>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
            {notif.message}
          </p>
        </div>
      ))}
    </div>
  );
}
