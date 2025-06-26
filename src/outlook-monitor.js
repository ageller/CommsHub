// src/outlook-monitor.js
let outlookUnread = -1;

function checkUnreadEmails() {
    const unreadElements = document.querySelectorAll('[aria-label^="Unread"]');
    const unreadCount = unreadElements.length;
    const hasUnread = unreadCount > 0;
    
    if (outlookUnread != unreadCount){
        outlookUnread = unreadCount;
        // Send result back to main process
        msg = [
            'outlook-unread-status',
            'outlook',
            Boolean(hasUnread),
            Number(unreadCount),
        ];
        window.electronAPI.sendMessageToMain(msg);

        // console.log('checking outlook:', hasUnread, unreadCount);
    }
    
    return { hasUnread, count: unreadCount };
}


setInterval(checkUnreadEmails, 1000); // every second
checkUnreadEmails(); // initial run