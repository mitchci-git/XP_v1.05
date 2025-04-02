/**
 * Windows XP Simulation Main Script
 * Entry point for the application that initializes all components
 */
import Desktop from './gui/desktop.js';
import Taskbar from './gui/taskbar.js';
import WindowManager from './gui/windows.js';
import StartMenu from './gui/startMenu.js';
import Clock from './gui/clock.js';
import CrtEffectManager from './effects/crtEffectManager.js';
import eventBus from './eventBus.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize components in dependency order
    new Clock('.time', eventBus);
    new Desktop(eventBus);
    const windowManager = new WindowManager(eventBus);
    new StartMenu(eventBus);
    new Taskbar(eventBus);
    new CrtEffectManager(eventBus);
    
    // Store image data temporarily when opening image viewer
    let pendingImageData = null;
    
    // Listen for iframe messages
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'iframe-clicked') {
            // Handle window focus requests from iframes
            const windowId = event.data.windowId;
            if (windowId) {
                const targetWindow = document.getElementById(windowId.split('?')[0]); // Remove query params if any
                if (targetWindow) {
                    eventBus.publish('window:focus', { windowId: targetWindow.id });
                }
            }
        } else if (event.data && event.data.type === 'open-image-viewer') {
            // Handle requests to open image viewer with specific image
            pendingImageData = {
                imageName: event.data.imageName,
                imagePath: event.data.imagePath,
                absolutePath: event.data.absolutePath,
                basePath: event.data.basePath
            };
            
            // Open the image viewer program
            eventBus.publish('program:open', { programName: 'image-viewer' });
        }
    });
    
    // Listen for window creation events to pass image data to new image viewer windows
    eventBus.subscribe('window:created', data => {
        if (data.programName === 'image-viewer' && pendingImageData) {
            // Wait a moment for the iframe to load
            setTimeout(() => {
                const imageViewerWindow = document.getElementById(data.windowId);
                if (imageViewerWindow) {
                    const iframe = imageViewerWindow.querySelector('iframe');
                    if (iframe) {
                        // Forward the image data to the image viewer
                        iframe.contentWindow.postMessage({
                            type: 'load-image',
                            ...pendingImageData,
                            isMaximized: imageViewerWindow.classList.contains('maximized')
                        }, '*');
                        
                        // Clear pending data
                        pendingImageData = null;
                    }
                }
            }, 500); // Give iframe enough time to initialize
        }
    });
    
    // Open Messenger window automatically on load
    setTimeout(() => {
        eventBus.publish('program:open', { programName: 'messenger' });
    }, 100);
});
