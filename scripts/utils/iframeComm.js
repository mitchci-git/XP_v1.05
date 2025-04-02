/**
 * Communication utilities for iframe applications
 * Handles message passing between iframes and parent window
 */

/**
 * Sets up click events to activate parent window when iframe content is clicked
 * @returns {boolean} True if successfully set up
 */
export function setupIframeActivation() {
    if (!window.parent || window.parent === window) {
        // Not in an iframe
        return false;
    }
    
    // Get parent window ID from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    let windowId = urlParams.get('windowId');
    
    // Listen for initialization message from parent
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'init-parent-comm') {
            windowId = event.data.windowId || windowId;
        }
    });
    
    // Add click handler to activate parent window
    document.addEventListener('mousedown', () => {
        window.parent.postMessage({
            type: 'iframe-clicked',
            windowId: windowId || document.referrer,
            timestamp: Date.now()
        }, '*');
    }, true); // Use capture phase for earliest handling
    
    return true;
}
