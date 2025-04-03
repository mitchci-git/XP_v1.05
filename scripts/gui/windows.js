/**
 * Window manager module for handling window operations
 */
import WindowTemplates from './windowTemplates.js';

export default class WindowManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.windows = {};
        this.activeWindow = null;
        this.taskbarItems = {};
        this.windowCount = 0;
        this.cascadeOffset = 35;
        
        this.programData = {
            "my-computer": {
                id: "my-computer-window",
                title: "My Computer",
                icon: "./assets/icons/desktop/my-computer.png",
                template: "my-computer",
                isOpen: false
            },
            "my-documents": {
                id: "my-documents-window",
                title: "My Documents",
                icon: "./assets/icons/desktop/my-documents.png",
                template: "folder-view",
                isOpen: false
            },
            "recycle-bin": {
                id: "recycle-bin-window",
                title: "Recycle Bin",
                icon: "./assets/icons/desktop/recycle-bin.png",
                template: "folder-view",
                isOpen: false
            },
            "internet-explorer": {
                id: "internet-explorer-window",
                title: "Internet Explorer",
                icon: "./assets/icons/desktop/internet-explorer.png",
                template: "browser",
                isOpen: false
            },
            "email": {
                id: "email-window",
                title: "Outlook Express",
                icon: "./assets/icons/desktop/email.png",
                template: "folder-view",
                isOpen: false
            },
            "messenger": {
                id: "messenger-window",
                title: "Windows Messenger",
                icon: "./assets/icons/desktop/messenger.png",
                template: "messenger",
                isOpen: false
            },
            "paint": {
                id: "paint-window",
                title: "Paint",
                icon: "./assets/start-menu/paint.png",
                template: "folder-view",
                isOpen: false
            },
            // Add missing My Pictures program data
            "my-pictures": {
                id: "my-pictures-window",
                title: "My Pictures",
                icon: "./assets/icons/desktop/my-pictures.png",
                template: "folder-view", 
                isOpen: false
            },
            // Add the missing image-viewer entry
            "image-viewer": {
                id: "image-viewer-window",
                title: "Windows Photo Viewer",
                icon: "./assets/icons/windows/image-viewer.png",
                template: "image-viewer",
                isOpen: false
            },
            // Add music player entry
            "music-player": {
                id: "music-player-window",
                title: "Windows Media Player",
                icon: "./assets/icons/desktop/music-player.png",
                template: "music-player",
                isOpen: false
            }
        };
        
        this.init();
        this.subscribeToEvents();

        // Add global click handler to deactivate windows when clicking desktop
        document.addEventListener('mousedown', (e) => {
            // Check if we clicked inside a window by traversing up the DOM tree
            let targetElement = e.target;
            let isWindowClick = false;
            let isTaskbarClick = false;
            
            while (targetElement) {
                // Check if we clicked inside a window
                if (targetElement.classList && targetElement.classList.contains('window')) {
                    isWindowClick = true;
                    break;
                }
                
                // Check if we clicked on the taskbar or desktop icons
                if (targetElement.classList) {
                    if (targetElement.classList.contains('taskbar') || 
                        targetElement.classList.contains('desktop-icon') ||
                        targetElement.classList.contains('start-button') ||
                        targetElement.classList.contains('startmenu')) {
                        isTaskbarClick = true;
                        break;
                    }
                }
                
                targetElement = targetElement.parentElement;
            }
            
            // If we didn't click on a window or taskbar, and the desktop was clicked,
            // consider it a click on empty space
            if (!isWindowClick && !isTaskbarClick && this.activeWindow) {
                // Only consider it a desktop click if we clicked on:
                // - The desktop element itself
                // - The selection overlay
                // - Any other element that is inside the desktop but not taskbar/desktop-icon
                const clickedOnDesktopSpace = 
                    e.target.classList.contains('desktop') ||
                    e.target.classList.contains('selection-overlay') ||
                    (document.querySelector('.desktop') && document.querySelector('.desktop').contains(e.target));
                
                if (clickedOnDesktopSpace) {
                    this.deactivateAllWindows();
                    e.stopPropagation(); // Prevent other handlers from interfering
                }
            }
        }, true); // Use capture phase for earliest possible handling

        // Ensure we properly handle iframe messages for window activation
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'iframe-clicked') {
                const windowId = event.data.windowId;
                if (windowId) {
                    // Extract the base window ID without query parameters
                    const baseWindowId = windowId.split('?')[0];
                    const targetWindow = document.getElementById(baseWindowId);
                    
                    if (targetWindow) {
                        this.bringToFront(targetWindow);
                        // Stop event propagation to prevent desktop click handler from interfering
                        event.stopPropagation();
                    }
                }
            } else if (event.data && event.data.action === 'closeMediaPlayer') {
                // Handle the close message from the music player iframe
                const musicPlayerWindow = document.getElementById('music-player-window');
                if (musicPlayerWindow) {
                    musicPlayerWindow.remove();
                    
                    // Update any program state tracking
                    if (this.programData["music-player"]) {
                        this.programData["music-player"].isOpen = false;
                    }
                    
                    // Remove from taskbar if needed
                    const taskbarItem = document.querySelector(`.taskbar-item[data-window="music-player-window"]`);
                    if (taskbarItem) {
                        taskbarItem.remove();
                    }
                }
            }
        }, true); // Use capture phase for earliest handling
    }
    
    subscribeToEvents() {
        // Subscribe to program open requests
        this.eventBus.subscribe('program:open', data => {
            this.openProgram(data.programName);
        });
        
        // Subscribe to window action requests
        this.eventBus.subscribe('window:minimize', data => {
            const window = document.getElementById(data.windowId);
            if (window) this.minimizeWindow(window);
        });
        
        this.eventBus.subscribe('window:maximize', data => {
            const window = document.getElementById(data.windowId);
            if (window) this.toggleMaximize(window);
        });
        
        this.eventBus.subscribe('window:close', data => {
            const window = document.getElementById(data.windowId);
            if (window) this.closeWindow(window);
        });
        
        this.eventBus.subscribe('window:focus', data => {
            const window = document.getElementById(data.windowId);
            if (window) this.bringToFront(window);
        });
        
        this.eventBus.subscribe('window:restore', data => {
            const window = document.getElementById(data.windowId);
            if (window) this.restoreWindow(window);
        });
        
        // Fix taskbar item handling - remove specific messenger handling
        this.eventBus.subscribe('taskbar:item:clicked', data => {
            const window = document.getElementById(data.windowId);
            
            if (window) {
                if (window.classList.contains('minimized')) {
                    this.restoreWindow(window);
                } else if (this.activeWindow === window) {
                    this.minimizeWindow(window);
                } else {
                    this.bringToFront(window);
                }
            } else if (data.windowId && !this.programData[data.windowId.replace('-window', '')].isOpen) {
                // If window doesn't exist but should be open, reopen it
                const programName = data.windowId.replace('-window', '');
                this.openProgram(programName);
            }
        });
    }
    
    init() {
        document.querySelectorAll('.window').forEach(window => {
            this.registerWindow(window);
        });
        
        // We don't need to set up desktop icons here anymore as
        // Desktop module now handles icon events via eventBus

        // Listen for custom events from My Pictures direct DOM content
        window.addEventListener('my-pictures:action', (e) => {
            const { action, text, folder } = e.detail;
            
            // Handle like we would a postMessage event
            this.eventBus.publish('sidebar-link-clicked', {
                text: text,
                folder: folder,
                action: action
            });
        });
        
        window.addEventListener('my-pictures:open-image', (e) => {
            const { imageName, imagePath } = e.detail;
            
            // Open image viewer
            this.openProgram('image-viewer');
            
            // Short delay to ensure window is created
            setTimeout(() => {
                const imageViewerWindow = document.getElementById('image-viewer-window');
                if (imageViewerWindow) {
                    const iframe = imageViewerWindow.querySelector('iframe');
                    if (iframe && iframe.contentWindow) {
                        // Send message to image viewer
                        iframe.contentWindow.postMessage({
                            type: 'load-image',
                            imageName: imageName,
                            imagePath: imagePath
                        }, '*');
                    }
                }
            }, 200);
        });
    }
    
    openProgram(programName) {
        const program = this.programData[programName];
        if (!program) return;
        
        if (program.isOpen) {
            const window = document.getElementById(program.id);
            if (window) {
                if (window.classList.contains('minimized')) {
                    this.restoreWindow(window);
                }
                this.bringToFront(window);
                return;
            }
        }
        
        const window = this.createWindowFromTemplate(program);
        if (!window) return;
        
        document.getElementById('windows-container').appendChild(window);
        
        // Position window based on program name or position property
        if (programName === 'messenger') {
            // Always position Messenger at bottom-right
            this.positionWindowBottomRight(window);
        } else if (programName === 'music-player') {
            // Always position Music Player at top-right
            this.positionWindowTopRight(window);
        } else {
            // Use position property if available, otherwise cascade
            switch (program.position) {
                case 'bottom-right':
                    this.positionWindowBottomRight(window);
                    break;
                case 'top-right':
                    this.positionWindowTopRight(window);
                    break;
                case 'top-left':
                    this.positionWindowTopLeft(window);
                    break;
                case 'bottom-left':
                    this.positionWindowBottomLeft(window);
                    break;
                case 'center':
                    this.positionWindowCenter(window);
                    break;
                case 'cascade':
                default:
                    this.positionWindowCascade(window);
                    break;
            }
        }
        
        this.registerWindow(window);
        
        program.isOpen = true;
        
        // Skip creating taskbar item for music player
        if (programName !== 'music-player') {
            this.createTaskbarItem(window, program);
        }
        
        // Publish window created event
        this.eventBus.publish('window:created', {
            windowId: window.id,
            programName,
            title: program.title,
            icon: program.icon
        });
        
        this.bringToFront(window);
    }
    
    createWindowFromTemplate(program) {
        const window = document.createElement('div');
        window.id = program.id;
        window.className = 'window';
        window.setAttribute('data-program', program.id.replace('-window', ''));
        
        // Special case for music player - create without any window chrome
        if (program.template === 'music-player') {
            // Only add the bare minimum structure
            window.innerHTML = ``;  // Remove even the window-inactive-mask
            
            // Get content from template
            const content = WindowTemplates.getTemplate(program.template, program.title);
            window.appendChild(content);
            
            // Set exact dimensions for the player at 50% scale
            window.style.width = '348px'; // 50% of 697px
            window.style.height = '186px'; // 50% of 372px
            window.style.position = 'absolute';
            window.style.left = '50%';
            window.style.top = '50%';
            window.style.transform = 'translate(-50%, -50%)';
            
            // Add special classes for frameless window
            window.classList.add('frameless-window');
            
            // Apply additional styles to completely remove window chrome
            Object.assign(window.style, {
                border: 'none',
                background: 'transparent',
                backgroundColor: 'transparent',
                borderRadius: '21px', // 50% of original 43px
                overflow: 'hidden',
                boxShadow: 'none',
                outline: 'none',
                padding: '0',
                margin: '0'
            });
            
            return window;
        }
        
        // Basic structure with title bar for all other windows
        window.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-left">
                    <div class="title-bar-icon">
                        <img src="${program.icon}" alt="${program.title}">
                    </div>
                    <div class="title-bar-text">${program.title}</div>
                </div>
                <div class="title-bar-controls">
                    <button aria-label="Minimize"></button>
                    <button aria-label="Maximize"></button>
                    <button aria-label="Close"></button>
                </div>
            </div>
            <div class="window-inactive-mask"></div>
        `;
        
        // Get content from template
        const content = WindowTemplates.getTemplate(program.template, program.title);
        window.appendChild(content);
        
        // CRITICAL: Only add status bar for windows OTHER than My Pictures
        if (program.title !== 'My Pictures') {
            const statusBar = document.createElement('div');
            statusBar.className = 'status-bar';
            statusBar.innerHTML = '<p class="status-bar-field">Ready</p>';
            window.appendChild(statusBar);
        }
        
        // Set initial dimensions based on program type
        if (program.template === "messenger") {
            // Reduced height by 27px (the height of the tabs section we removed)
            window.style.width = '550px';
            window.style.height = '453px'; // Reduced from 480px to 453px
        } else if (program.template === "browser") {
            window.style.width = '800px';
            window.style.height = '600px';
        } else if (program.template === "my-computer") {
            // Double the default size for My Computer (100% increase)
            window.style.width = '1200px'; // Increased from 600px
            window.style.height = '800px';  // Increased from 400px
        } else {
            window.style.width = '600px';
            window.style.height = '400px';
        }
        
        window.style.position = 'absolute';
        window.style.left = '50%';
        window.style.top = '50%';
        window.style.transform = 'translate(-50%, -50%)';
        
        // Add special handling for iframe-based applications
        if (program.template === 'messenger' || program.template === 'browser' || 
            program.template === 'email' || program.template === 'my-computer' || 
            program.template === 'folder-view' || program.template === 'image-viewer') {
            
            // Use a slight delay to ensure the iframe is loaded
            setTimeout(() => {
                const iframe = window.querySelector('iframe');
                if (iframe) {
                    this.adjustWindowToIframeContent(window, iframe);
                }
            }, 300);
        }
        
        return window;
    }

    /**
     * Adjust window dimensions based on iframe content
     * @param {HTMLElement} window - The window element
     * @param {HTMLIFrameElement} iframe - The iframe element
     */
    adjustWindowToIframeContent(window, iframe) {
        try {
            // Get iframe content dimensions
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const iframeBody = iframeDoc.body;
            
            if (!iframeBody) return;
            
            // Get the program name to apply specific adjustments
            const programName = Object.keys(this.programData).find(
                name => this.programData[name].id === window.id
            );
            
            // Skip auto-resizing for Messenger since it has fixed dimensions
            if (programName === 'messenger') {
                // For Messenger, set overflow to hidden to prevent scrollbars
                try {
                    iframe.style.overflow = 'hidden';
                    iframeBody.style.overflow = 'hidden';
                    
                    // NO size adjustments to prevent window resizing after load
                    // Just keep the initial dimensions that were set when creating the window
                } catch (e) {
                    console.warn('Unable to set styles for Messenger iframe:', e);
                }
                return;
            }
            
        } catch (e) {
            // Cross-origin restrictions might prevent accessing iframe content
            console.warn('Unable to adjust window to iframe content:', e);
        }
    }
    
    positionWindowCascade(window) {
        // Get viewport dimensions
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        
        const offsetX = 120 + (this.windowCount * this.cascadeOffset);
        const offsetY = 100 + (this.windowCount * this.cascadeOffset);
        
        // Constrain maximum offsets to viewport size
        const maxOffsetX = Math.min(viewportWidth * 0.6, viewportWidth - 300); 
        const maxOffsetY = Math.min(viewportHeight * 0.6, viewportHeight - 200);
        
        const finalX = offsetX > maxOffsetX ? 120 : offsetX;
        const finalY = offsetY > maxOffsetY ? 100 : offsetY;
        
        window.style.position = 'absolute';
        window.style.left = finalX + 'px';
        window.style.top = finalY + 'px';
        window.style.transform = 'none';
        
        this.windowCount++;
        
        if (offsetX > maxOffsetX || offsetY > maxOffsetY) {
            this.windowCount = 1;
        }
        
        // Ensure window is within viewport bounds
        this.constrainWindowToViewport(window);
    }
    
    /**
     * Position a window in the bottom right corner of the screen
     * @param {HTMLElement} window - The window to position
     */
    positionWindowBottomRight(window) {
        const screenWidth = document.documentElement.clientWidth;
        const screenHeight = document.documentElement.clientHeight;
        const taskbarHeight = 30;
        
        const windowWidth = parseInt(window.style.width) || 600;
        const windowHeight = parseInt(window.style.height) || 400;
        
        // Get program name to access margin settings
        const programName = window.getAttribute('data-program');
        const program = programName ? this.programData[programName] : null;
        
        // Default margins
        const rightMargin = program && program.margin && program.margin.right ? program.margin.right : 20;
        const bottomMargin = program && program.margin && program.margin.bottom ? program.margin.bottom : 20;
        
        window.style.position = 'absolute';
        window.style.left = (screenWidth - windowWidth - rightMargin) + 'px';
        window.style.top = (screenHeight - windowHeight - taskbarHeight - bottomMargin) + 'px';
        window.style.transform = 'none';
    }
    
    /**
     * Position a window in the top right corner of the screen
     * @param {HTMLElement} window - The window to position
     */
    positionWindowTopRight(window) {
        const screenWidth = document.documentElement.clientWidth;
        
        const windowWidth = parseInt(window.style.width) || 600;
        
        // Get program name to access margin settings
        const programName = window.getAttribute('data-program');
        const program = programName ? this.programData[programName] : null;
        
        // Default margins
        const rightMargin = program && program.margin && program.margin.right ? program.margin.right : 20;
        const topMargin = program && program.margin && program.margin.top ? program.margin.top : 20;
        
        window.style.position = 'absolute';
        window.style.left = (screenWidth - windowWidth - rightMargin) + 'px';
        window.style.top = topMargin + 'px';
        window.style.transform = 'none';
    }
    
    /**
     * Position a window in the center of the screen
     * @param {HTMLElement} window - The window to position
     */
    positionWindowCenter(window) {
        // Get screen dimensions
        const screenWidth = document.documentElement.clientWidth;
        const screenHeight = document.documentElement.clientHeight;
        
        // Get window dimensions
        const windowWidth = parseInt(window.style.width) || 600;
        const windowHeight = parseInt(window.style.height) || 400;
        
        // Calculate center position (accounting for taskbar)
        const posX = (screenWidth - windowWidth) / 2;
        const posY = (screenHeight - windowHeight - 30) / 2; // 30px taskbar height
        
        // Position window
        window.style.position = 'absolute';
        window.style.left = posX + 'px';
        window.style.top = posY + 'px';
        window.style.transform = 'none';
    }
    
    registerWindow(window) {
        const windowId = window.id;
        
        const controls = {
            minimizeBtn: window.querySelector('[aria-label="Minimize"]'),
            maximizeBtn: window.querySelector('[aria-label="Maximize"]'),
            closeBtn: window.querySelector('[aria-label="Close"]'),
            titleBar: window.querySelector('.title-bar')
        };
        
        this.windows[windowId] = window;
        
        window.windowState = {
            isMaximized: false,
            isMinimized: false,
            originalStyles: {
                width: window.style.width || '600px',
                height: window.style.height || '400px',
                top: window.style.top || '50%',
                left: window.style.left || '50%',
                transform: window.style.transform || 'translate(-50%, -50%)'
            }
        };
        
        this.setupWindowEvents(window, controls);
        this.bringToFront(window);
        
        // New: Ensure window fits within viewport after creation
        this.constrainWindowToViewport(window);
        
        // New: Add resize observer to adjust window on viewport changes
        this.setupResponsiveHandling(window);
    }
    
    setupWindowEvents(window, controls) {
        const { minimizeBtn, maximizeBtn, closeBtn, titleBar } = controls;
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeWindow(window));
        }
        
        const okButton = window.querySelector('#ok-button');
        if (okButton) {
            okButton.addEventListener('click', () => this.closeWindow(window));
        }
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.minimizeWindow(window));
        }
        
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => this.toggleMaximize(window));
        }
        
        if (titleBar) {
            this.makeDraggable(window, titleBar);
            // Add double-click event to titlebar for maximize/restore
            titleBar.addEventListener('dblclick', () => this.toggleMaximize(window));
        }
        
        // Enhanced window activation - capture in capture phase to ensure it fires first
        window.addEventListener('mousedown', (e) => {
            if (window !== this.activeWindow) {
                this.bringToFront(window);
                
                // Don't stop propagation - we want other handlers to still work,
                // but we do want to ensure this runs before other handlers
            }
        }, true); // Using capture phase is important here
        
        // Handle clicks in iframe content by adding an overlay when window is inactive
        this.setupIframeOverlayForActivation(window);
    }

    // Add new helper method to handle iframe activation
    setupIframeOverlayForActivation(window) {
        // Find all iframes in the window
        const iframes = window.querySelectorAll('iframe');
        
        iframes.forEach(iframe => {
            // Create an overlay div for each iframe that will capture clicks
            // when the window is inactive
            const overlay = document.createElement('div');
            overlay.className = 'iframe-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.zIndex = '10';
            overlay.style.display = 'none';
            
            // Position the overlay correctly relative to the iframe
            const iframeParent = iframe.parentElement;
            iframeParent.style.position = 'relative';
            iframeParent.appendChild(overlay);
            
            // When the overlay is clicked, activate the window
            overlay.addEventListener('mousedown', (e) => {
                if (window !== this.activeWindow) {
                    this.bringToFront(window);
                }
                e.preventDefault();
                e.stopPropagation();
            });
            
            // Store reference to the overlay on the window
            if (!window.iframeOverlays) window.iframeOverlays = [];
            window.iframeOverlays.push(overlay);
        });
        
        // Update deactivateAllWindows to handle these overlays
        const originalDeactivate = this.deactivateAllWindows;
        this.deactivateAllWindows = (excludeWindow) => {
            originalDeactivate.call(this, excludeWindow);
            
            // Show overlays for inactive windows
            Object.values(this.windows).forEach(win => {
                if (win.iframeOverlays && win !== excludeWindow) {
                    win.iframeOverlays.forEach(overlay => {
                        overlay.style.display = 'block';
                    });
                }
                
                // Hide overlays for active window
                if (win === excludeWindow && win.iframeOverlays) {
                    win.iframeOverlays.forEach(overlay => {
                        overlay.style.display = 'none';
                    });
                }
            });
        };
    }
    
    createTaskbarItem(window, program) {
        const taskbarPrograms = document.querySelector('.taskbar-programs');
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-item';
        taskbarItem.id = `taskbar-${window.id}`;
        
        taskbarItem.innerHTML = `
            <img src="${program.icon}" alt="${program.title}" />
            <span>${program.title}</span>
        `;
        
        taskbarItem.addEventListener('mousedown', () => {
            this.eventBus.publish('taskbar:item:clicked', { windowId: window.id });
        });
        
        taskbarPrograms.appendChild(taskbarItem);
        this.taskbarItems[window.id] = taskbarItem;
        return taskbarItem;
    }
    
    closeWindow(window) {
        // Clean up observers
        if (window.responsiveObserver) {
            window.responsiveObserver.disconnect();
            window.responsiveObserver = null;
        }
        
        // Clean up resize observer if it exists
        if (window.iframeResizeObserver) {
            window.iframeResizeObserver.disconnect();
            window.iframeResizeObserver = null;
        }
        
        // For messenger window, completely remove it so we can recreate it later
        if (window.parentNode) {
            window.parentNode.removeChild(window);
        }

        const programName = Object.keys(this.programData).find(
            name => this.programData[name].id === window.id
        );
        
        if (programName) {
            this.programData[programName].isOpen = false;
        }
        
        // Only remove from taskbar if it's not the music player (which doesn't have a taskbar item)
        if (this.taskbarItems[window.id] && programName !== 'music-player') {
            this.taskbarItems[window.id].remove();
            delete this.taskbarItems[window.id];
        }
        
        delete this.windows[window.id];
        
        if (this.activeWindow === window) {
            this.activeWindow = null;
            
            const topWindow = Object.values(this.windows).filter(
                w => !w.classList.contains('minimized')
            ).pop();
            
            if (topWindow) {
                this.bringToFront(topWindow);
            }
        }
        
        // Publish window closed event
        this.eventBus.publish('window:closed', { windowId: window.id });
        
        this.windowCount = Math.max(0, this.windowCount - 1);
    }
    
    minimizeWindow(window) {
        window.classList.add('minimized');
        window.windowState.isMinimized = true;
        window.style.display = 'none';
        
        const taskbarItem = this.taskbarItems[window.id];
        if (taskbarItem) {
            taskbarItem.classList.remove('active');
        }
        
        if (this.activeWindow === window) {
            this.activeWindow = null;
            
            const topWindow = Object.values(this.windows).filter(
                w => !w.classList.contains('minimized')
            ).pop();
            
            if (topWindow) {
                this.bringToFront(topWindow);
            }
        }
        
        // Publish window minimized event
        this.eventBus.publish('window:minimized', { windowId: window.id });
    }
    
    restoreWindow(window) {
        window.classList.remove('minimized');
        window.windowState.isMinimized = false;
        window.style.display = 'flex';
        this.bringToFront(window);
        
        // Publish window restored event
        this.eventBus.publish('window:restored', { windowId: window.id });
    }
    
    toggleMaximize(window) {
        const state = window.windowState;
        
        if (!state.isMaximized) {
            // Store original dimensions before maximizing
            const rect = window.getBoundingClientRect();
            state.originalStyles = {
                width: window.style.width || rect.width + 'px',
                height: window.style.height || rect.height + 'px',
                top: window.style.top || rect.top + 'px',
                left: window.style.left || rect.left + 'px',
                transform: window.style.transform || ''
            };
            
            // Get EXACT viewport dimensions
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            const taskbarHeight = 30;
            
            // Apply EXACT position and dimensions
            window.style.position = 'absolute';
            window.style.top = '0';
            window.style.left = '0';
            window.style.width = vw + 'px';
            window.style.height = (vh - taskbarHeight) + 'px';
            window.style.margin = '0';
            window.style.padding = '0';
            window.style.border = '0';
            window.style.borderRadius = '0';
            window.style.transform = 'none';
            window.style.boxSizing = 'border-box';
            window.style.maxWidth = 'none';
            window.style.maxHeight = 'none';
            window.style.minWidth = '0';
            window.style.minHeight = '0';
            
            state.isMaximized = true;
            window.classList.add('maximized');
            
            // Update maximize button if it exists
            const maximizeBtn = window.querySelector('[aria-label="Maximize"]');
            if (maximizeBtn) {
                maximizeBtn.classList.add('restore');
            }
            
            // Publish window maximized event
            this.eventBus.publish('window:maximized', { windowId: window.id });
        } else {
            // Restore to original dimensions
            window.style.width = state.originalStyles.width;
            window.style.height = state.originalStyles.height;
            window.style.top = state.originalStyles.top;
            window.style.left = state.originalStyles.left;
            window.style.transform = state.originalStyles.transform;
            
            // Remove maximized styling
            window.style.margin = '';
            window.style.padding = '';
            window.style.border = '';
            window.style.borderRadius = '';
            window.style.maxWidth = '';
            window.style.maxHeight = '';
            window.style.minWidth = '';
            window.style.minHeight = '';
            window.style.boxSizing = '';
            
            state.isMaximized = false;
            window.classList.remove('maximized');
            
            // Update maximize button if it exists
            const maximizeBtn = window.querySelector('[aria-label="Maximize"]');
            if (maximizeBtn) {
                maximizeBtn.classList.remove('restore');
            }
            
            // Publish window unmaximized event
            this.eventBus.publish('window:unmaximized', { windowId: window.id });
        }
    }
    
    bringToFront(window) {
        if (!window) return;
        
        if (window.classList.contains('minimized')) {
            this.restoreWindow(window);
            return;
        }
        
        // Pass the window we're activating to the deactivateAllWindows method
        this.deactivateAllWindows(window);
        
        // Then activate the target window
        window.classList.add('active');
        this.activeWindow = window;
        
        // Hide the inactive mask for the newly active window
        const inactiveMask = window.querySelector('.window-inactive-mask');
        if (inactiveMask) {
            inactiveMask.style.display = 'none';
        }
        
        // Set the highest z-index for the active window
        window.style.zIndex = '101';
        
        const taskbarItem = this.taskbarItems[window.id];
        if (taskbarItem) {
            taskbarItem.classList.add('active');
        }
        
        // Handle any iframe overlay if present
        if (window.iframeOverlay) {
            window.iframeOverlay.style.display = 'none';
        }
        
        // Publish window focused event
        this.eventBus.publish('window:focused', { 
            windowId: window.id, 
            programName: window.getAttribute('data-program'),
            title: window.querySelector('.title-bar-text')?.textContent || ''
        });
    }
    
    deactivateAllWindows(excludeWindow = null) {
        // Loop through all windows and deactivate them
        Object.values(this.windows).forEach(win => {
            // Don't change z-index of the window being activated
            if (win !== excludeWindow) {
                win.style.zIndex = '100';
                win.classList.remove('active');
                
                // Show inactive mask for all windows except the one being activated
                const inactiveMask = win.querySelector('.window-inactive-mask');
                if (inactiveMask) {
                    inactiveMask.style.display = win !== excludeWindow ? 'block' : 'none';
                }
                
                // Show iframe overlay to catch clicks if present
                if (win.iframeOverlay) {
                    win.iframeOverlay.style.display = win !== excludeWindow ? 'block' : 'none';
                }
                
                const taskbarItem = this.taskbarItems[win.id];
                if (taskbarItem) {
                    taskbarItem.classList.remove('active');
                }
            }
        });
        
        // Only clear active window reference if we're not activating another window
        if (!excludeWindow) {
            this.activeWindow = null;
        }
    }
    
    makeDraggable(window, titleBar) {
        // For music player, make the entire window draggable since there's no title bar
        if (window.classList.contains('frameless-window') && window.getAttribute('data-program') === 'music-player') {
            this.makeEntireWindowDraggable(window);
            return;
        }
        
        // Performance optimized dragging implementation for regular windows
        let isDragging = false;
        let startX, startY;
        let initialLeft, initialTop;
        let lastX, lastY;
        let animationFrameId = null;
        
        // Store iframe references for performance optimization
        const iframes = window.querySelectorAll('iframe');
        
        // Prepare window for hardware acceleration
        function prepareWindowForDrag() {
            // Add dragging class to enable CSS optimizations
            window.classList.add('dragging-window');
            
            // Disable pointer events in iframes during drag for massive performance boost
            iframes.forEach(iframe => {
                if (iframe.style.pointerEvents !== 'none') {
                    iframe.style.pointerEvents = 'none';
                }
            });
            
            // Set will-change to hint browser to optimize for animation
            window.style.willChange = 'transform';
            
            // Get dimensions once to avoid layout thrashing during drag
            const rect = window.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            // Set initial transform for performance
            window.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        
        // Clean up after drag ends
        function cleanupAfterDrag() {
            // Re-enable iframe interaction
            iframes.forEach(iframe => {
                iframe.style.pointerEvents = '';
            });
            
            // Remove performance optimizations
            window.classList.remove('dragging-window');
            window.style.willChange = 'auto';
        }
        
        // Optimized move handler using requestAnimationFrame
        function updatePosition() {
            if (!isDragging) return;
            
            // Calculate delta from start position
            const deltaX = lastX - startX;
            const deltaY = lastY - startY;
            
            // Apply transformation directly with 3D transform for GPU acceleration
            window.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
            
            // Continue animation loop
            animationFrameId = requestAnimationFrame(updatePosition);
        }
        
        // Start dragging (mouse)
        titleBar.addEventListener('mousedown', (e) => {
            // Don't drag on buttons or double-clicks
            if (e.detail > 1 || e.target.tagName === 'BUTTON' || window.windowState.isMaximized) return;
            
            // Capture starting point
            startX = e.clientX;
            startY = e.clientY;
            lastX = e.clientX;
            lastY = e.clientY;
            
            // Activate window first if needed
            if (window !== this.activeWindow) {
                this.bringToFront(window);
            }
            
            // Begin drag operation
            isDragging = true;
            prepareWindowForDrag();
            
            // Start animation loop
            animationFrameId = requestAnimationFrame(updatePosition);
            
            e.preventDefault();
        });
        
        // Update position on mouse move (capturing latest position only)
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                lastX = e.clientX;
                lastY = e.clientY;
                e.preventDefault();
            }
        }, { passive: false });
        
        // Touch support (mobile)
        titleBar.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'BUTTON' || window.windowState.isMaximized) return;
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            lastX = touch.clientX;
            lastY = touch.clientY;
            
            if (window !== this.activeWindow) {
                this.bringToFront(window);
            }
            
            isDragging = true;
            prepareWindowForDrag();
            
            animationFrameId = requestAnimationFrame(updatePosition);
            
            e.preventDefault();
        }, { passive: false });
        
        // Update position on touch move
        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = e.touches[0];
                lastX = touch.clientX;
                lastY = touch.clientY;
                e.preventDefault();
            }
        }, { passive: false });
        
        // End drag operation
        const endDrag = () => {
            if (!isDragging) return;
            
            // Cancel animation loop
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Calculate final position by combining initial position with transform
            const deltaX = lastX - startX;
            const deltaY = lastY - startY;
            const finalLeft = initialLeft + deltaX;
            const finalTop = initialTop + deltaY;
            
            // Apply constraints to keep window visible
            const viewportWidth = document.documentElement.clientWidth;
            const viewportHeight = document.documentElement.clientHeight;
            const taskbarHeight = 30;
            const windowWidth = window.offsetWidth;
            const windowHeight = window.offsetHeight;
            
            // Calculate constrained position
            const constrainedLeft = Math.max(
                -windowWidth + 100, 
                Math.min(finalLeft, viewportWidth - 100)
            );
            const constrainedTop = Math.max(
                0,
                Math.min(finalTop, viewportHeight - taskbarHeight - 20)
            );
            
            // Switch back to normal positioning without visible jump
            window.style.transform = 'none';
            window.style.left = `${constrainedLeft}px`;
            window.style.top = `${constrainedTop}px`;
            
            // Update window state
            if (window.windowState) {
                window.windowState.originalStyles.left = window.style.left;
                window.windowState.originalStyles.top = window.style.top;
            }
            
            // Clean up performance optimizations
            cleanupAfterDrag();
            
            isDragging = false;
        };
        
        // End events for both mouse and touch
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        document.addEventListener('touchcancel', endDrag);
        
        // Safety cleanup if pointer leaves document
        document.addEventListener('mouseleave', () => {
            if (isDragging) endDrag();
        });
    }
    
    /**
     * Constrain window to viewport dimensions
     * @param {HTMLElement} window - The window element
     */
    constrainWindowToViewport(window) {
        // Get viewport dimensions
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const taskbarHeight = 30; // Standard taskbar height
        
        // Get window dimensions
        const windowWidth = parseInt(window.style.width) || 600;
        const windowHeight = parseInt(window.style.height) || 400;
        
        // Get current window position
        let windowLeft = parseInt(window.style.left) || 0;
        let windowTop = parseInt(window.style.top) || 0;
        
        // If window is using transform for centering, calculate actual position
        if (window.style.transform && window.style.transform.includes('translate')) {
            if (window.style.left === '50%') {
                windowLeft = (viewportWidth - windowWidth) / 2;
            }
            if (window.style.top === '50%') {
                windowTop = (viewportHeight - windowHeight) / 2;
            }
            window.style.transform = 'none';
        }
        
        // Calculate maximum dimensions
        const maxWidth = viewportWidth - 20;
        const maxHeight = viewportHeight - taskbarHeight - 10;
        
        // Calculate scale factor if window is too large
        // This helps preserve aspect ratio
        let scale = 1;
        if (windowWidth > maxWidth || windowHeight > maxHeight) {
            const scaleX = maxWidth / windowWidth;
            const scaleY = maxHeight / windowHeight;
            scale = Math.min(scaleX, scaleY, 1); // Never scale up, only down
        }
        
        let newWidth = windowWidth;
        let newHeight = windowHeight;
        if (scale < 1) {
            newWidth = Math.floor(windowWidth * scale);
            newHeight = Math.floor(windowHeight * scale);
        }
        
        // Center window if it would be otherwise positioned offscreen
        if (windowLeft + newWidth > viewportWidth) {
            windowLeft = Math.max(0, (viewportWidth - newWidth) / 2);
        }
        if (windowTop + newHeight > viewportHeight - taskbarHeight) {
            windowTop = Math.max(0, (viewportHeight - newHeight - taskbarHeight) / 2);
        }
        
        // Apply constrained values
        if (scale < 1) {
            window.style.width = newWidth + 'px';
            window.style.height = newHeight + 'px';
        }
        window.style.left = `${windowLeft}px`;
        window.style.top = `${windowTop}px`;
        
        // Update original styles for proper restore after maximize
        if (window.windowState) {
            if (scale < 1) {
                window.windowState.originalStyles.width = window.style.width;
                window.windowState.originalStyles.height = window.style.height;
            }
            window.windowState.originalStyles.left = window.style.left;
            window.windowState.originalStyles.top = window.style.top;
            window.windowState.originalStyles.transform = 'none';
        }
    }
    
    // Add new method for responsive handling
    setupResponsiveHandling(window) {
        // Create and store resize observer to adjust window on viewport changes
        const resizeObserver = new ResizeObserver(entries => {
            // Only proceed if the window is not maximized
            if (window && !window.windowState.isMaximized && !window.windowState.isMinimized) {
                this.constrainWindowToViewport(window);
            }
        });
        
        // Observe the document body for size changes
        resizeObserver.observe(document.body);
        
        // Store the observer reference for cleanup
        window.responsiveObserver = resizeObserver;
    }
    
    // Add new method to make entire window draggable for frameless windows
    makeEntireWindowDraggable(window) {
        let isDragging = false;
        let startX, startY;
        let initialLeft, initialTop;
        let lastX, lastY;
        let animationFrameId = null;
        
        // Store iframe references for performance optimization
        const iframes = window.querySelectorAll('iframe');
        
        // Prepare window for hardware acceleration
        function prepareWindowForDrag() {
            // Add dragging class to enable CSS optimizations
            window.classList.add('dragging-window');
            
            // Disable pointer events in iframes during drag for massive performance boost
            iframes.forEach(iframe => {
                iframe.style.pointerEvents = 'none';
            });
            
            // Set will-change to hint browser to optimize for animation
            window.style.willChange = 'transform';
            
            // Get dimensions once to avoid layout thrashing during drag
            const rect = window.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            // Set initial transform for performance
            window.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        
        // Clean up after drag ends
        function cleanupAfterDrag() {
            // Re-enable iframe interaction
            iframes.forEach(iframe => {
                iframe.style.pointerEvents = 'auto';
            });
            
            // Remove performance optimizations
            window.classList.remove('dragging-window');
            window.style.willChange = 'auto';
        }
        
        // Optimized move handler using requestAnimationFrame
        function updatePosition() {
            if (!isDragging) return;
            
            // Calculate delta from start position
            const deltaX = lastX - startX;
            const deltaY = lastY - startY;
            
            // Apply transformation directly with 3D transform for GPU acceleration
            window.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
            
            // Continue animation loop
            animationFrameId = requestAnimationFrame(updatePosition);
        }
        
        // Start dragging on mousedown
        window.addEventListener('mousedown', (e) => {
            // Don't start drag on buttons or player controls
            if (e.target.tagName === 'BUTTON' || 
                e.target.closest('.play-btn') || 
                e.target.closest('.skip-left') || 
                e.target.closest('.skip-right') || 
                e.target.closest('.vol-up') || 
                e.target.closest('.vol-down')) {
                return;
            }
            
            // Capture starting point
            startX = e.clientX;
            startY = e.clientY;
            lastX = e.clientX;
            lastY = e.clientY;
            
            // Activate window first if needed
            if (window !== this.activeWindow) {
                this.bringToFront(window);
            }
            
            // Begin drag operation
            isDragging = true;
            prepareWindowForDrag();
            
            // Start animation loop
            animationFrameId = requestAnimationFrame(updatePosition);
            
            e.preventDefault();
        });
        
        // Update position on mouse move
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                lastX = e.clientX;
                lastY = e.clientY;
                e.preventDefault();
            }
        }, { passive: false });
        
        // Touch support
        window.addEventListener('touchstart', (e) => {
            // Don't start drag on buttons or player controls
            if (e.target.tagName === 'BUTTON' || 
                e.target.closest('.play-btn') || 
                e.target.closest('.skip-left') || 
                e.target.closest('.skip-right') || 
                e.target.closest('.vol-up') || 
                e.target.closest('.vol-down')) {
                return;
            }
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            lastX = touch.clientX;
            lastY = touch.clientY;
            
            if (window !== this.activeWindow) {
                this.bringToFront(window);
            }
            
            isDragging = true;
            prepareWindowForDrag();
            
            animationFrameId = requestAnimationFrame(updatePosition);
            
            e.preventDefault();
        }, { passive: false });
        
        // Update position on touch move
        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = e.touches[0];
                lastX = touch.clientX;
                lastY = touch.clientY;
                e.preventDefault();
            }
        }, { passive: false });
        
        // End drag operation
        const endDrag = () => {
            if (!isDragging) return;
            
            // Cancel animation loop
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Calculate final position by combining initial position with transform
            const deltaX = lastX - startX;
            const deltaY = lastY - startY;
            const finalLeft = initialLeft + deltaX;
            const finalTop = initialTop + deltaY;
            
            // Apply constraints to keep window visible
            const viewportWidth = document.documentElement.clientWidth;
            const viewportHeight = document.documentElement.clientHeight;
            const taskbarHeight = 30;
            const windowWidth = window.offsetWidth;
            const windowHeight = window.offsetHeight;
            
            // Calculate constrained position
            const constrainedLeft = Math.max(
                -windowWidth + 100, 
                Math.min(finalLeft, viewportWidth - 100)
            );
            const constrainedTop = Math.max(
                0,
                Math.min(finalTop, viewportHeight - taskbarHeight - 20)
            );
            
            // Apply final position
            window.style.transform = 'none';
            window.style.left = constrainedLeft + 'px';
            window.style.top = constrainedTop + 'px';
            
            // Clean up performance optimizations
            cleanupAfterDrag();
            
            isDragging = false;
        };
        
        // End events for both mouse and touch
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        document.addEventListener('touchcancel', endDrag);
        
        // Safety cleanup if pointer leaves document
        document.addEventListener('mouseleave', endDrag);
    }
}