// src/teams-monitor.js
let teamsUnread = -1;

function checkUnreadTeamsMessages() {
    let unreadCount = 0;

    // // Find the parent container
    // const slotMeasurer = document.querySelector('div[data-tid="slot-measurer"]');
    // if (!slotMeasurer) return 0;

    // Within that, find the counter badge element
    // const badge = slotMeasurer.querySelector('div.fui-CounterBadge');

    // check for unreads in the top hamburger
    const hamburgerBadge = document.querySelector('[data-testid="hamburger-button-badge"].fui-CounterBadge');
    let hamburgerCount = 0;
    if (hamburgerBadge && hamburgerBadge.textContent) {
        const parsed = parseInt(hamburgerBadge.textContent.trim());
        if (!isNaN(parsed)) {
            hamburgerCount = parsed;
        }
    }

    // count the other badges (not w/in hamburger)
    // and subtract the hamburger count (?)
    const otherBadges = document.querySelectorAll('.fui-CounterBadge:not([data-testid="hamburger-button-badge"])');
    let badgeCount = 0;
    otherBadges.forEach(badge => {
        if (badge && badge.textContent) {
            const parsed = parseInt(badge.textContent.trim());
            if (!isNaN(parsed)) {
                badgeCount += parsed;
            }
        }
    });
    badgeCount = Math.max(0,badgeCount - hamburgerCount);

    unreadCount = hamburgerCount + badgeCount;
    const hasUnread = unreadCount > 0;
    
    if (teamsUnread != unreadCount){
        teamsUnread = unreadCount;
        // Send result back to main process
        msg = [
            'teams-unread-status',
            'teams',
            Boolean(hasUnread),
            Number(unreadCount),
        ];
        window.electronAPI.sendMessageToMain(msg);
    }

    // console.log('checking teams:', hasUnread, unreadCount, hamburgerCount, badgeCount);
    return { hasUnread, count: unreadCount };
}


setInterval(checkUnreadTeamsMessages, 1000); // every second
checkUnreadTeamsMessages(); // initial run