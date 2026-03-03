/**
 * SHARED UI UTILITIES
 */

const UIUtils = {
  /**
   * Shows a slide-in notification.
   * @param {string} message - The message to display.
   * @param {'info' | 'success' | 'error'} type - The type of notification.
   * @param {number} duration - How long to show the notification in milliseconds.
   */
  showNotification: (message, type = 'info', duration = 5000) => {
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      document.body.appendChild(notification);
    }

    const bgColor = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6366f1';
    notification.style.backgroundColor = bgColor;
    notification.textContent = message;

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
    });

    // Auto dismiss
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
    }, duration);
  }
};

if (typeof module !== 'undefined') module.exports = { UIUtils };
