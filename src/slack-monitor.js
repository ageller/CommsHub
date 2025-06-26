// src/teams-monitor.js

let slackUnread = -1;

function checkUnreadSlackMessages() {
    let unreadCount = 0;

    // 1. Count unreads by the bold items in the Channels and DMs sidebar
    const unreadChannels = document.querySelectorAll('.p-channel_sidebar__channel--unread');
    const channelCount = unreadChannels.length;
    
    //2. Count unreads in threads
    const unreadThreads = document.querySelectorAll('.p-channel_sidebar__link--unread');
    const threadCount = unreadThreads.length;

    // 3. Also count the total unread DMs from mention badges
    // but I will subtract 1 from each because the first one is already accounted for in bold check above
    // There might be a better way to separate DMs and Channels, but this seems to work fine for my purposes here
    let dmCount = 0;
    const dmContainer = document.querySelector('[aria-label="Channels and direct messages"]');

    if (dmContainer) {
        const mentionBadges = dmContainer.querySelectorAll('[data-qa="mention_badge"]');

        mentionBadges.forEach(badge => {
            const text = badge.textContent.trim();
            const count = parseInt(text);
            if (!isNaN(count)) {
                dmCount += (count-1);
            }
        });
    }

    unreadCount = channelCount + threadCount + dmCount;

    const hasUnread = unreadCount > 0;
    
    if (slackUnread != unreadCount){
        slackUnread = unreadCount;
        // Send result back to main process
        msg = [
            'slack-unread-status',
            'slack',
            Boolean(hasUnread),
            Number(unreadCount),
        ];
        window.electronAPI.sendMessageToMain(msg);
    }

    console.log('checking slack:', hasUnread, unreadCount, channelCount, threadCount, dmCount);
    return { hasUnread, count: unreadCount };
}


setInterval(checkUnreadSlackMessages, 1000); // every second
checkUnreadSlackMessages(); // initial run