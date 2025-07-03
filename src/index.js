// for the unread badges
let unreadKeeper = {
    'outlook':0,
    'slack':0,
    'teams':0,
}
let totalUnread = 0;

// for the dividers
const overlay = document.getElementById('drag-overlay');
let isDragging = false;
let currentDivider = null;
let startX = 0;
let leftPanel = null;
let rightPanel = null;
let leftStartWidth = 0;
let rightStartWidth = 0;


// keep panel sizing consistent
function normalizePanelFlex(reset=false) {
    const panelContainer = document.getElementById('panels');
    const visiblePanels = Array.from(panelContainer.querySelectorAll('.panel'))
        .filter(p => !p.classList.contains('hidden'));
    const widths = visiblePanels.map(p => p.getBoundingClientRect().width);

    // Calculate total available width
    const totalPanelWidth = widths.reduce((a, b) => a + b, 0);

    visiblePanels.forEach((panel, i) => {
        // Proportion relative to current visible area
        if (reset) {
            panel.style.flexGrow = 1./visiblePanels.length;
        } else {
            const grow = totalPanelWidth > 0 ? widths[i] / totalPanelWidth : 1 / visiblePanels.length;
            panel.style.flexGrow = grow;
        }
    });
    // Hidden panels should not take up space
    Array.from(panelContainer.querySelectorAll('.panel.hidden')).forEach(p => {
        p.style.flexGrow = 0;
    });
}
function mousedown(e) {
    if (!e.target.classList.contains('divider')) return;
    overlay.style.display = 'block';

    isDragging = true;
    currentDivider = e.target;

    leftPanel = currentDivider.previousElementSibling;
    while (leftPanel && leftPanel.classList.contains('hidden')) {
        leftPanel = leftPanel.previousElementSibling;
    }
    rightPanel = currentDivider.nextElementSibling;
    while (rightPanel && rightPanel.classList.contains('hidden')) {
        rightPanel = rightPanel.nextElementSibling;
    }
    startX = e.clientX;

    // Instead of storing flexGrow, get actual widths in px:
    leftStartWidth = leftPanel.getBoundingClientRect().width;
    rightStartWidth = rightPanel.getBoundingClientRect().width;

    document.body.style.cursor = 'col-resize';

    e.preventDefault();
}

function mousemove(e) {
    if (!isDragging || !leftPanel || !rightPanel) return;

    const deltaX = e.clientX - startX;

    // Compute new widths but clamp to minimum (e.g. 50px)
    let newLeftWidth = Math.max(50, leftStartWidth + deltaX);
    let newRightWidth = Math.max(50, rightStartWidth - deltaX);

    const containerWidth = document.getElementById('panels').getBoundingClientRect().width;

    // Calculate new flexGrow as proportion of total container width
    leftPanel.style.flexGrow = newLeftWidth / containerWidth;
    rightPanel.style.flexGrow = newRightWidth / containerWidth;

    // Prevent default selection during drag
    e.preventDefault();
}

function mouseup(e) {
    if (!isDragging) return;
    normalizePanelFlex();
    isDragging = false;
    document.body.style.cursor = '';
    currentDivider = null;
    leftPanel = null;
    rightPanel = null;
    overlay.style.display = 'none';

}
window.addEventListener('resize', normalizePanelFlex);
window.addEventListener('mousedown', mousedown);
window.addEventListener('mousemove', mousemove);
window.addEventListener('mouseup', mouseup);


// toggle the webview based on sidebar button
function toggleView(button, panelId) {
    const panel = document.getElementById(panelId);
    const dividerBefore = panel.previousElementSibling;
    const dividerAfter = panel.nextElementSibling;
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        button.classList.add('shown');
        if (dividerBefore && dividerBefore.classList.contains('divider')) {
            dividerBefore.classList.remove('hidden');
        } else if (dividerAfter && dividerAfter.classList.contains('divider')) {
            dividerAfter.classList.remove('hidden');
        }
    } else {
        panel.classList.add('hidden');
        button.classList.remove('shown');
        if (dividerBefore && dividerBefore.classList.contains('divider')) {
            dividerBefore.classList.add('hidden');
        } else if (dividerAfter && dividerAfter.classList.contains('divider')) {
            dividerAfter.classList.add('hidden');
        }
    }
    normalizePanelFlex(reset=true);
}

// unread badge on/off
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

// unread count for the badges
function updateTotalUnread(sourceID, hasUnread, count){
    unreadKeeper[sourceID] = count;
    const newUnread = unreadKeeper['outlook'] + unreadKeeper['slack'] + unreadKeeper['teams'];
    if (newUnread != totalUnread){
        totalUnread = newUnread;
        console.log(unreadKeeper, totalUnread);
        window.electronAPI.setOverlayBadge(totalUnread);
    }
}   

// load the webview specific scripts
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
    normalizePanelFlex(reset=true);
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



