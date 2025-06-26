let unreadKeeper = {
    'outlook':0,
    'slack':0,
    'teams':0,
}
let totalUnread = 0;

function toggleView(button, panelId) {
    const panel = document.getElementById(panelId);
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        button.classList.add('shown');
    } else {
        panel.classList.add('hidden');
        button.classList.remove('shown');
    }
}

function updateBadgeVisibility(sourceID, hasUnread, count){
    const badgeElement = document.querySelector(`#${sourceID}Badge`);
    if (badgeElement) {
        if (hasUnread) {
            badgeElement.classList.remove('hidden');
            badgeElement.textContent = count > 99 ? '99+' : count.toString();
        } else {
            badgeElement.classList.add('hidden');
        }
    }    
}

function updateTotalUnread(sourceID, hasUnread, count){
    unreadKeeper[sourceID] = count;
    const newUnread = unreadKeeper['outlook'] + unreadKeeper['slack'] + unreadKeeper['teams'];
    if (newUnread != totalUnread){
        totalUnread = newUnread;
        console.log(unreadKeeper, totalUnread);
        window.electronAPI.setOverlayBadge(totalUnread);
    }
}   

async function loadScript(wv, scriptName, devTools=false){
    // Open the webview's developer tools for debugging
    if (devTools) wv.openDevTools();
    
    try {
        // Load and execute the external script
        const scriptContent = await window.electronAPI.loadScript(scriptName);
        wv.executeJavaScript(scriptContent);
    } catch (error) {
        console.error('Failed to load monitor script:', scriptName, error);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const webviews = document.querySelectorAll('webview');
    webviews.forEach(wv => {
        if (wv.shadowRoot) {
            const iframe = wv.shadowRoot.querySelector('iframe');
            if (iframe) {
                iframe.style.height = '100%';
                iframe.style.width = '100%';
            } 
        }

        // Listen for messages from the injected script
        wv.addEventListener('ipc-message', (event) => {
            if (event.channel === 'debug-log' || event.channel === 'debug-error') {
                console.log(`[WEBVIEW DEBUG]`, event.args);
            }
            if (event.channel === 'outlook-unread-status' || event.channel === 'teams-unread-status' || event.channel === 'slack-unread-status') {
                // console.log('have message from webview', event.args)
                updateBadgeVisibility(...event.args);
                updateTotalUnread(...event.args);
            }
        });

    });

    const outlookView = document.getElementById('outlook');
    outlookView.addEventListener('dom-ready', async () => {
        await loadScript(outlookView, 'outlook-monitor.js');
    });

    const teamsView = document.getElementById('teams');
    teamsView.addEventListener('dom-ready', async () => {
        await loadScript(teamsView, 'teams-monitor.js');
    });

    const slackView = document.getElementById('slack');
    slackView.addEventListener('dom-ready', async () => {
        await loadScript(slackView, 'slack-monitor.js');
    });
});


