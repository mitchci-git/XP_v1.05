/**
 * Window manager module for handling window operations
 */
import programData from '../utils/programRegistry.js';
import { EVENTS } from '../utils/eventBus.js';
import { getPreloadedIframe } from '../utils/iframePreloader.js'; // Import preloader getter

const TASKBAR_HEIGHT = 30; // Define constant taskbar height

/**
 * Window Templates class - provides templates for different window types
 */
class WindowTemplates {
    /**
     * Gets a template container for windows
     * @param {string} [templateName] - Optional template type identifier
     * @param {object} [programConfig] - Optional program configuration object
     * @returns {HTMLElement} DOM element containing the window content
     */
    static getTemplate(templateName, programConfig) {
        // Handle standard iframe apps via appPath - TRY PRELOADED FIRST
        if (templateName === 'iframe-standard' && programConfig?.appPath) {
            const programKey = programConfig.id.replace('-window', '');
            const preloadedIframe = getPreloadedIframe(programKey);
            if (preloadedIframe) {
                const container = this.createEmptyContainer();
                container.classList.add('iframe-container');
                container.appendChild(preloadedIframe);
                return container;
            } else {
                 // Fallback if not preloaded for some reason
                console.warn(`No preloaded iframe for ${programKey}, creating standard iframe container.`);
                return this.createIframeContainer(programConfig.appPath, programConfig.id);
            }
        }
        
        // Create error container for invalid templates or non-iframe types
        const content = this.createEmptyContainer();
        const errorMsg = !templateName 
            ? 'Error: Window template not specified or invalid configuration.'
            : `Error: Template '${templateName}' not found or missing appPath.`;
        
        content.innerHTML = `<p style="padding:10px;">${errorMsg}</p>`;
        return content;
    }
    
    /**
     * Creates a standard window container with no content
     * @returns {HTMLElement} Empty window content container
     */
    static createEmptyContainer() {
        const content = document.createElement('div');
        content.className = 'window-body';
        return content;
    }

    /**
     * Creates an iframe container for apps (NOW MOSTLY A FALLBACK)
     * @param {string} appPath - Path to the application's index.html
     * @param {string} windowId - The unique ID of the window element
     * @returns {HTMLElement} Container with an iframe
     */
    static createIframeContainer(appPath, windowId) {
        console.log(`Fallback: Creating new iframe for ${windowId}`); // Debug
        const container = document.createElement('div');
        container.className = 'window-body iframe-container'; 
        
        const iframe = document.createElement('iframe');
        
        // Set all iframe properties and attributes in one go
        Object.assign(iframe, { src: appPath, title: `${windowId}-content` });
        
        // Security and display attributes
        const attrs = {
            frameborder: '0',
            width: '100%',
            height: '100%',
            sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
        };
        
        for (const [attr, value] of Object.entries(attrs))
            iframe.setAttribute(attr, value);
        
        container.appendChild(iframe);
        return container;
    }
}

export default class WindowManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.windows = {};
        this.activeWindow = null;
        this.taskbarItems = {};
        this.windowCount = 0;
        this.cascadeOffset = 35;
        this.programData = programData;
        this.baseZIndex = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--z-window')) || 100;
        this.windowsContainer = document.getElementById('windows-container');
        this.zIndexStack = []; // Array to track window stacking order (IDs)
        
        this._setupGlobalHandlers();
        this._subscribeToEvents();
    }
    
    _setupGlobalHandlers() {
        document.addEventListener('mousedown', (e) => {
            const clickedOnDesktopSpace = e.target.classList.contains('desktop') || e.target.classList.contains('selection-overlay');
            if (clickedOnDesktopSpace && !e.target.closest('.window')) {
                    if (this.activeWindow) {
                        this.deactivateAllWindows();
                    }
                }
        }, true);

        window.addEventListener('message', (event) => {
            if (event.origin !== window.origin) return;

            const windowElement = this._getWindowFromIframeSource(event.source);
            if (!windowElement) return;

            if (event.data?.type === 'minimize-window') {
                this.minimizeWindow(windowElement);
            } else if (event.data?.type === 'close-window') {
                this.closeWindow(windowElement);
            }
        }, true);
    }
    
    _subscribeToEvents() {
        this.eventBus.subscribe(EVENTS.PROGRAM_OPEN, data => this.openProgram(data.programName));
        this.eventBus.subscribe(EVENTS.WINDOW_FOCUSED, data => this._handleWindowFocus(data.windowId));
        this.eventBus.subscribe(EVENTS.WINDOW_MINIMIZED, data => this._handleWindowMinimize(data.windowId));
        this.eventBus.subscribe(EVENTS.WINDOW_MAXIMIZED, data => this._setWindowState(data.windowId, 'maximized'));
        this.eventBus.subscribe(EVENTS.WINDOW_UNMAXIMIZED, data => this._setWindowState(data.windowId, 'unmaximized'));
        this.eventBus.subscribe(EVENTS.WINDOW_CLOSED, data => this._handleWindowCloseCleanup(data.windowId));
        this.eventBus.subscribe(EVENTS.WINDOW_RESTORED, data => this._handleWindowRestore(data.windowId));
        this.eventBus.subscribe(EVENTS.TASKBAR_ITEM_CLICKED, data => this._handleTaskbarClick(data.windowId));
    }
    
    openProgram(programName) {
        const program = this.programData[programName];
        if (!program || !program.id) {
            console.error(`Invalid program data for: ${programName}`);
            return;
        }
        
        const existingWindow = document.getElementById(program.id);
        if (existingWindow) {
            this.bringToFront(existingWindow);
            return;
        }

        if (program.isOpen) {
            program.isOpen = false;
        }

        const windowElement = this._createWindowElement(program);
        if (!windowElement) return;

        this.windowsContainer.appendChild(windowElement);
        this._registerWindow(windowElement, program);
        this.positionWindow(windowElement);

        program.isOpen = true;
        this.eventBus.publish(EVENTS.WINDOW_CREATED, {
            windowId: windowElement.id,
            programName,
            title: program.title,
            icon: program.icon
        });

        if (program.startMinimized) {
            this.minimizeWindow(windowElement);
        } else {
            this.bringToFront(windowElement);
        }
    }
    
    _createWindowElement(program) {
        const windowElement = document.createElement('div');
        windowElement.id = program.id;
        windowElement.className = 'window';
        windowElement.setAttribute('data-program', program.id.replace('-window', ''));

        windowElement.innerHTML = this._getWindowBaseHTML(program);

        const content = WindowTemplates.getTemplate(program.template, program);
        if (!content) {
             console.error(`Failed to get template "${program.template}" for ${program.id}`);
             return null;
        }
        windowElement.appendChild(content);

        this._addStartMenuOverlay(windowElement, content);

        const statusBar = document.createElement('div');
        statusBar.className = 'status-bar';
        statusBar.innerHTML = '<p class="status-bar-field">Ready</p>';
        windowElement.appendChild(statusBar);

        const defaultWidth = 600;
        const defaultHeight = 400;
        windowElement.style.width = `${program.dimensions?.width || defaultWidth}px`;
        windowElement.style.height = `${program.dimensions?.height || defaultHeight}px`;
        windowElement.style.position = 'absolute';

        return windowElement;
    }
    
    _getWindowBaseHTML(program) {
        return `
            <div class="title-bar">
                <div class="title-bar-left">
                    <div class="title-bar-icon">
                        <img src="${program.icon}" alt="${program.title}">
                    </div>
                    <div class="title-bar-text">${program.title}</div>
                </div>
                <div class="title-bar-controls">
                    <button aria-label="Minimize" data-action="minimize"></button>
                    <button aria-label="Maximize" data-action="maximize"></button>
                    <button aria-label="Close" data-action="close"></button>
                </div>
            </div>
            <div class="window-inactive-mask"></div>
        `;
    }
        
    _addStartMenuOverlay(windowElement, contentContainer) {
        const startMenuOverlay = document.createElement('div');
        startMenuOverlay.className = 'start-menu-content-click-overlay';
        const targetContainer = contentContainer.classList.contains('window-body') ? contentContainer : windowElement;
        if (targetContainer !== windowElement) {
            targetContainer.style.position = 'relative';
        }
        targetContainer.appendChild(startMenuOverlay);
    }
    
    _registerWindow(windowElement, program) {
        const windowId = windowElement.id;
        this.windows[windowId] = windowElement;
        this.taskbarItems[windowId] = this._createTaskbarItem(windowElement, program);

        windowElement.windowState = {
            isMaximized: false,
            isMinimized: false,
            originalStyles: {
                width: windowElement.style.width,
                height: windowElement.style.height,
                top: windowElement.style.top,
                left: windowElement.style.left,
                transform: windowElement.style.transform
            }
        };

        this._setupWindowEvents(windowElement);
        this._setupResponsiveHandling(windowElement);

        // Add to stack and update Z-indices
        this._updateStackOrder(windowId, 'add');
        this._updateZIndices();
    }
    
    _createTaskbarItem(windowElement, program) {
        const taskbarPrograms = document.querySelector('.taskbar-programs');
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-item';
        taskbarItem.id = `taskbar-${windowElement.id}`;
        taskbarItem.setAttribute('data-window-id', windowElement.id);
        taskbarItem.innerHTML = `
            <img src="${program.icon}" alt="${program.title}" />
            <span>${program.title}</span>
        `;

        this._bindControl(taskbarItem, 'mousedown', () => {
            this.eventBus.publish(EVENTS.TASKBAR_ITEM_CLICKED, { windowId: windowElement.id });
        });

        taskbarPrograms.appendChild(taskbarItem);
        return taskbarItem;
    }
    
    _setupWindowEvents(windowElement) {
        const titleBar = windowElement.querySelector('.title-bar');
        const startMenuOverlay = windowElement.querySelector('.start-menu-content-click-overlay');

        this._bindControl(windowElement.querySelector('[data-action="close"]'), 'click', () => this.closeWindow(windowElement));
        this._bindControl(windowElement.querySelector('[data-action="minimize"]'), 'click', () => this.minimizeWindow(windowElement));
        this._bindControl(windowElement.querySelector('[data-action="maximize"]'), 'click', () => this.toggleMaximize(windowElement));

        if (titleBar) {
            this._bindControl(titleBar, 'dblclick', () => this.toggleMaximize(windowElement));
            this.makeDraggable(windowElement, titleBar);
        }

        this._bindControl(windowElement, 'mousedown', () => {
            if (windowElement !== this.activeWindow) {
                this.bringToFront(windowElement);
            }
        }, true);
        
        if (startMenuOverlay) {
            this._bindControl(startMenuOverlay, 'mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.eventBus.publish(EVENTS.STARTMENU_CLOSE_REQUEST);
            });
        }

        this._setupIframeActivationOverlay(windowElement);
    }
    
    _setupIframeActivationOverlay(windowElement) {
        const iframes = windowElement.querySelectorAll('iframe');
        if (!windowElement.iframeOverlays) windowElement.iframeOverlays = [];
        
        iframes.forEach(iframe => {
            const overlay = document.createElement('div');
            overlay.className = 'iframe-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.zIndex = '10';
            overlay.style.display = 'none';
            
            const iframeParent = iframe.parentElement;
            if (iframeParent) {
            iframeParent.style.position = 'relative';
            iframeParent.appendChild(overlay);
            
                this._bindControl(overlay, 'mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                    if (windowElement !== this.activeWindow) {
                        this.bringToFront(windowElement);
                    }
                });
                windowElement.iframeOverlays.push(overlay);
            }
        });
    }
    
    _handleTaskbarClick(windowId) {
        const windowElement = this.windows[windowId];
        if (windowElement) {
            if (windowElement.windowState.isMinimized) {
                this.restoreWindow(windowElement);
            } else if (this.activeWindow === windowElement) {
                this.minimizeWindow(windowElement);
            } else {
                this.bringToFront(windowElement);
            }
        } else {
            // Check if the program already exists but with a different ID
            const programName = windowId.replace('-window', '');
            
            // Check if any window for this program is already open
            const existingWindows = Object.values(this.windows);
            const existingWindow = existingWindows.find(window => 
                window.getAttribute('data-program') === programName
            );
            
            if (existingWindow) {
                // Existing window found, bring it to front or restore it
                if (existingWindow.windowState.isMinimized) {
                    this.restoreWindow(existingWindow);
                } else {
                    this.bringToFront(existingWindow);
                }
            } else if (programName && this.programData[programName]) {
                // No existing window - open a new one
                this.openProgram(programName);
            }
        }
    }
    
    _handleWindowFocus(windowId) {
        const windowElement = this.windows[windowId];
        if (windowElement && !windowElement.windowState.isMinimized) {
            this.bringToFront(windowElement);
        }
    }
    
    _handleWindowRestore(windowId) {
         const windowElement = this.windows[windowId];
         if (windowElement) {
             this.restoreWindow(windowElement);
         }
    }
    
    _handleWindowMinimize(windowId) {
        this._setWindowState(windowId, 'minimized');
        this._refreshActiveWindow();
    }
    
    _handleWindowCloseCleanup(windowId) {
        const windowElement = this.windows[windowId];
        if (!windowElement) return;
        
        // Remove taskbar item from DOM first
        const taskbarItem = this.taskbarItems[windowId];
        if (taskbarItem && taskbarItem.parentNode) {
            taskbarItem.parentNode.removeChild(taskbarItem);
        }
        
        // Clean up references
        delete this.windows[windowId];
        delete this.taskbarItems[windowId];
        
        // If this was the active window, activate next window in stack
        if (this.activeWindow === windowElement) {
            this.activeWindow = null;
            // Find and focus next window
            this._refreshActiveWindow();
        }
        
        this.windowCount = Math.max(0, this.windowCount - 1);

        // Remove from stack and update Z-indices
        this._updateStackOrder(windowId, 'remove');
        this._updateZIndices();
    }
    
    _refreshActiveWindow() {
        // Find the topmost non-minimized window to activate
        const topWindow = this._findTopWindow();
        if (topWindow) {
            this.bringToFront(topWindow);
        } else {
            // No windows active - make sure all taskbar items are inactive
            this._clearAllTaskbarItemStates();
        }
    }
    
    _clearAllTaskbarItemStates() {
        Object.values(this.taskbarItems).forEach(taskbarItem => {
            if (taskbarItem) {
                taskbarItem.classList.remove('active');
            }
        });
    }
    
    _updateTaskbarItemState(windowId, isActive) {
        // Always clear all active states first for consistency
        this._clearAllTaskbarItemStates();
        
        // If we're setting a window active, update just that one
        if (isActive) {
            const taskbarItem = this.taskbarItems[windowId];
            if (taskbarItem) {
                taskbarItem.classList.add('active');
            }
        }
    }
    
    _setWindowState(windowId, state) {
        // Helper to handle state changes triggered by events (future use?)
        // Currently handled directly by minimize/maximize/restore etc.
    }
    
    closeWindow(windowElement) {
        if (!windowElement) return;
        const windowId = windowElement.id;
        
        // First clean up internal state and taskbar
        this._handleWindowCloseCleanup(windowId);

        // Then clean up window-specific resources
        if (windowElement.responsiveObserver) {
            windowElement.responsiveObserver.disconnect();
            windowElement.responsiveObserver = null;
        }
        if (windowElement.iframeResizeObserver) {
            windowElement.iframeResizeObserver.disconnect();
            windowElement.iframeResizeObserver = null;
        }

        // Remove window element from DOM
        if (windowElement.parentNode) {
            windowElement.parentNode.removeChild(windowElement);
        }

        // Update program data state
        const programName = windowElement.getAttribute('data-program');
        if (programName && this.programData[programName]) {
            this.programData[programName].isOpen = false;
        }

        // Notify that the window was closed
        this.eventBus.publish(EVENTS.WINDOW_CLOSED, { windowId });
    }
    
    minimizeWindow(windowElement) {
         if (!windowElement || windowElement.windowState.isMinimized) return;

        windowElement.classList.add('minimized');
        windowElement.windowState.isMinimized = true;
        windowElement.style.display = 'none';
        this._setWindowZIndex(windowElement, ''); // Clear z-index when minimized

        this._updateTaskbarItemState(windowElement.id, false);

        // Remove from active stack and update others
        this._updateStackOrder(windowElement.id, 'remove');
        this._updateZIndices();

        if (this.activeWindow === windowElement) {
            this.activeWindow = null;
            const topWindow = this._findTopWindow();
            if (topWindow) {
                this.bringToFront(topWindow);
            }
        }
        
        this.eventBus.publish(EVENTS.WINDOW_MINIMIZED, { windowId: windowElement.id });
    }
    
    restoreWindow(windowElement) {
        if (!windowElement || !windowElement.windowState.isMinimized) return;

        windowElement.classList.remove('minimized');
        windowElement.windowState.isMinimized = false;
        windowElement.style.display = 'flex';

        // Add back to stack BEFORE bringing to front
        this._updateStackOrder(windowElement.id, 'add');
        // Note: _updateZIndices() will be called by bringToFront

        this.bringToFront(windowElement);
    }
    
    toggleMaximize(windowElement) {
        if (!windowElement) return;
        const state = windowElement.windowState;
        const maximizeBtn = windowElement.querySelector('[aria-label="Maximize"]');
        
        if (!state.isMaximized) {
            // Maximize
            const rect = windowElement.getBoundingClientRect();
            // Store current styles *before* maximizing
            state.originalStyles = {
                width: windowElement.style.width || rect.width + 'px',
                height: windowElement.style.height || rect.height + 'px',
                top: windowElement.style.top || rect.top + 'px',
                left: windowElement.style.left || rect.left + 'px',
                transform: windowElement.style.transform || ''
            };

            // Apply essential maximized styles via JS
            const vw = document.documentElement.clientWidth;
            const vh = document.documentElement.clientHeight;
            windowElement.style.top = '0px';
            windowElement.style.left = '0px';
            windowElement.style.width = vw + 'px';
            windowElement.style.height = (vh - TASKBAR_HEIGHT) + 'px';
            windowElement.style.transform = 'none';
            
            state.isMaximized = true;
            windowElement.classList.add('maximized'); // Add class to trigger CSS styles
            if (maximizeBtn) maximizeBtn.classList.add('restore');
            this.eventBus.publish(EVENTS.WINDOW_MAXIMIZED, { windowId: windowElement.id });

        } else {
            // Restore
            // Explicitly set saved styles back
            windowElement.style.width = state.originalStyles.width;
            windowElement.style.height = state.originalStyles.height;
            windowElement.style.top = state.originalStyles.top;
            windowElement.style.left = state.originalStyles.left;
            windowElement.style.transform = state.originalStyles.transform;

            // Clear potentially conflicting maximized styles explicitly
             windowElement.style.margin = '';
             windowElement.style.border = '';
             windowElement.style.borderRadius = ''; 
             windowElement.style.boxSizing = ''; 
            
            state.isMaximized = false;
            windowElement.classList.remove('maximized'); // Remove class
            if (maximizeBtn) maximizeBtn.classList.remove('restore');
            this.eventBus.publish(EVENTS.WINDOW_UNMAXIMIZED, { windowId: windowElement.id });
        }
    }
    
    bringToFront(windowElement) {
        if (!windowElement || this.activeWindow === windowElement || windowElement.windowState.isMinimized) {
            return;
        }

        if (windowElement.windowState.isMinimized) {
             this.restoreWindow(windowElement);
            return;
        }
        
        const previouslyActive = this.activeWindow;
        this.deactivateAllWindows(windowElement);

        windowElement.classList.add('active');
        this.activeWindow = windowElement;

        // Update stack order and apply new Z-indices
        this._updateStackOrder(windowElement.id, 'add');
        this._updateZIndices();

        this._toggleInactiveMask(windowElement, false); // Hide mask
        this._toggleIframeOverlays(windowElement, false); // Hide overlays
        this._updateTaskbarItemState(windowElement.id, true);

        if (previouslyActive !== this.activeWindow) {
             this.eventBus.publish(EVENTS.WINDOW_FOCUSED, { windowId: windowElement.id });
        }
    }
    
    deactivateAllWindows(excludeWindow = null) {
        Object.values(this.windows).forEach(win => {
            if (win !== excludeWindow) {
                win.classList.remove('active');
                this._toggleInactiveMask(win, true); // Show mask
                this._toggleIframeOverlays(win, true); // Show overlays
                this._updateTaskbarItemState(win.id, false); // Deactivate taskbar
            }
        });

        if (!excludeWindow) {
            this.activeWindow = null;
        }
    }
    
    _setWindowZIndex(windowElement, zIndex) {
        if (windowElement) {
            windowElement.style.zIndex = zIndex;
        }
    }
    
    _toggleInactiveMask(windowElement, show) {
        const inactiveMask = windowElement.querySelector('.window-inactive-mask');
        if (inactiveMask) {
            inactiveMask.style.display = show ? 'block' : 'none';
        }
    }
    
    _toggleIframeOverlays(windowElement, show) {
        if (windowElement.iframeOverlays) {
            windowElement.iframeOverlays.forEach(overlay => overlay.style.display = show ? 'block' : 'none');
        }
    }
    
    positionWindow(windowElement) {
        const programName = windowElement.getAttribute('data-program');
        const program = this.programData[programName];

        if (program && program.position && program.position.type === "custom") {
            this.positionWindowCustom(windowElement, program.position);
        } else {
            this.positionWindowCascade(windowElement);
        }
        if (windowElement.windowState) {
            windowElement.windowState.originalStyles.left = windowElement.style.left;
            windowElement.windowState.originalStyles.top = windowElement.style.top;
            windowElement.windowState.originalStyles.transform = windowElement.style.transform;
        }
    }
    
    positionWindowCascade(windowElement) {
        const position = this._calculateCascadePosition(this.windowCount);
        const windowHeight = parseInt(windowElement.style.height) || 400; // Get window height
        const viewportHeight = document.documentElement.clientHeight;
        
        // ** Corrected Logic Start **
        const maxTop = viewportHeight - windowHeight - TASKBAR_HEIGHT;
        let adjustedTop = position.y;

        if (adjustedTop > maxTop) {
            adjustedTop = Math.max(0, maxTop);
        }
        adjustedTop = Math.max(0, adjustedTop); // Ensure top is not negative
        // ** Corrected Logic End **

        windowElement.style.position = 'absolute';
        windowElement.style.left = position.x + 'px';
        windowElement.style.top = adjustedTop + 'px'; // Apply the adjusted top
        windowElement.style.transform = 'none';

        // Existing logic for resetting cascade and constraining
        this.windowCount++;
        const maxOffsetX = Math.min(document.documentElement.clientWidth * 0.6, document.documentElement.clientWidth - 300);
        const maxOffsetY = Math.min(document.documentElement.clientHeight * 0.6, document.documentElement.clientHeight - 200);
        const initialOffsetX = 120;
        const initialOffsetY = 100;
        if ((initialOffsetX + (this.windowCount * this.cascadeOffset)) > maxOffsetX ||
            (initialOffsetY + (this.windowCount * this.cascadeOffset)) > maxOffsetY) {
            this.windowCount = 1;
        }
    }
    
    positionWindowCustom(windowElement, posConfig) {
        const programName = windowElement.getAttribute('data-program');
        const program = this.programData[programName];
        const windowWidth = program?.dimensions?.width || parseInt(windowElement.style.width) || 600;
        const windowHeight = program?.dimensions?.height || parseInt(windowElement.style.height) || 400;
        const position = this._calculateCustomPosition(windowElement, posConfig, windowWidth, windowHeight);
        if (position) {
            windowElement.style.position = 'absolute';
            windowElement.style.left = `${position.x}px`;
            windowElement.style.top = `${position.y}px`;
            windowElement.style.transform = 'none';
        } else {
            this.positionWindowCascade(windowElement);
        }
    }
    
    _calculateCascadePosition(windowCount) {
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const initialOffsetX = 120;
        const initialOffsetY = 100;
        const offsetX = initialOffsetX + (windowCount * this.cascadeOffset);
        const offsetY = initialOffsetY + (windowCount * this.cascadeOffset);
        const maxOffsetX = Math.min(viewportWidth * 0.6, viewportWidth - 300);
        const maxOffsetY = Math.min(viewportHeight * 0.6, viewportHeight - 200);
        const finalX = offsetX > maxOffsetX ? initialOffsetX : offsetX;
        const finalY = offsetY > maxOffsetY ? initialOffsetY : offsetY;
        return { x: finalX, y: finalY };
    }
    
    _calculateCustomPosition(windowElement, posConfig, windowWidth, windowHeight) {
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const taskbarHeight = document.querySelector('.taskbar')?.offsetHeight || TASKBAR_HEIGHT;
        const adjustedViewportHeight = viewportHeight - taskbarHeight;
        const safeMarginX = 20;
        const safeMarginY = 20;
        const maxLeftPos = viewportWidth - windowWidth - safeMarginX;
        const maxTopPos = adjustedViewportHeight - windowHeight - safeMarginY;
        let leftPos = 0;
        let topPos = 0;
        switch (posConfig.align) {
            case "bottom-right":
                leftPos = viewportWidth - windowWidth - (posConfig.offsetX || 0);
                topPos = adjustedViewportHeight - windowHeight - (posConfig.offsetY || 0);
                break;
            case "center-right":
                leftPos = viewportWidth - windowWidth - (posConfig.offsetX || 0);
                topPos = Math.max(0, (adjustedViewportHeight - windowHeight) / 2);
                break;
            case "left-of-browser":
                const browserWidth = 1000;
                const browserHeight = 850;
                const browserShiftOffset = 175;
                const browserLeft = (viewportWidth / 2) - browserShiftOffset;
                const browserTop = Math.max(0, (adjustedViewportHeight - browserHeight) / 2);
                const browserBottom = browserTop + browserHeight;
                leftPos = browserLeft - windowWidth - (posConfig.offsetX || 0);
                topPos = browserBottom - windowHeight;
                break;
            case "left-of-browser-top":
                const browserWidthTop = 1000;
                const browserHeightTop = 850;
                const browserShiftOffsetTop = 175;
                const browserLeftTop = (viewportWidth / 2) - browserShiftOffsetTop;
                const browserTopTop = Math.max(0, (adjustedViewportHeight - browserHeightTop) / 2);
                leftPos = browserLeftTop - windowWidth - (posConfig.offsetX || 0);
                topPos = browserTopTop + (posConfig.offsetY || 0);
                break;
            case "bottom-left":
                leftPos = posConfig.offsetX || 0;
                topPos = adjustedViewportHeight - windowHeight - (posConfig.offsetY || 0);
                break;
            case "top-right":
                leftPos = viewportWidth - windowWidth - (posConfig.offsetX || 0);
                topPos = posConfig.offsetY || 0;
                break;
            case "top-left":
                leftPos = posConfig.offsetX || 0;
                topPos = posConfig.offsetY || 0;
                break;
            case "center":
                const centerShiftOffset = 175;
                leftPos = (viewportWidth / 2) - centerShiftOffset;
                topPos = (adjustedViewportHeight - windowHeight) / 2;
                break;
            default:
                return null;
        }
        leftPos = Math.max(safeMarginX, Math.min(leftPos, maxLeftPos));
        topPos = Math.max(safeMarginY, Math.min(topPos, maxTopPos));
        return { x: leftPos, y: topPos };
    }
    
    _constrainWindowToViewport(windowElement) {
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const taskbarHeight = TASKBAR_HEIGHT;
        const windowWidth = parseInt(windowElement.style.width) || 600;
        const windowHeight = parseInt(windowElement.style.height) || 400;
        let windowLeft = parseInt(windowElement.style.left) || 0;
        let windowTop = parseInt(windowElement.style.top) || 0;

        const minVisibleWidth = 50;
        const minVisibleHeight = 20;

        windowLeft = Math.max(-windowWidth + minVisibleWidth, Math.min(windowLeft, viewportWidth - minVisibleWidth));
        windowTop = Math.max(0, Math.min(windowTop, viewportHeight - taskbarHeight - minVisibleHeight));

        windowElement.style.left = `${windowLeft}px`;
        windowElement.style.top = `${windowTop}px`;

        if (windowElement.windowState) {
            windowElement.windowState.originalStyles.left = windowElement.style.left;
            windowElement.windowState.originalStyles.top = windowElement.style.top;
        }
    }
    
    makeDraggable(windowElement, handleElement) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let dragOffsetX = 0, dragOffsetY = 0;

        const endDrag = (e) => {
            if (!isDragging) return;

            const finalClientX = e.clientX ?? (e.changedTouches?.[0]?.clientX ?? startX);
            const finalClientY = e.clientY ?? (e.changedTouches?.[0]?.clientY ?? startY);
            const deltaX = finalClientX - startX;
            const deltaY = finalClientY - startY;
            const viewportWidth = document.documentElement.clientWidth;
            const viewportHeight = document.documentElement.clientHeight;
            const taskbarHeight = TASKBAR_HEIGHT;
            const windowWidth = windowElement.offsetWidth;
            const windowHeight = windowElement.offsetHeight;
            const finalLeft = initialX + deltaX;
            const finalTop = initialY + deltaY;
            
            const constrainedLeft = Math.max(-windowWidth + 100, Math.min(finalLeft, viewportWidth - 100));
            const constrainedTop = Math.max(0, Math.min(finalTop, viewportHeight - taskbarHeight - 20));

            windowElement.style.left = `${constrainedLeft}px`;
            windowElement.style.top = `${constrainedTop}px`;

            if (windowElement.windowState) {
                windowElement.windowState.originalStyles.left = windowElement.style.left;
                windowElement.windowState.originalStyles.top = windowElement.style.top;
                windowElement.windowState.originalStyles.transform = 'none';
            }
            
            cleanupAfterDrag();
            isDragging = false;
        };

        function prepareWindowForDrag() {
            windowElement.classList.add('dragging-window');
            const rect = windowElement.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            const parentRect = windowElement.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
            const currentStyle = windowElement.currentStyle || window.getComputedStyle(windowElement);
            const currentLeft = parseFloat(currentStyle.left) || 0;
            const currentTop = parseFloat(currentStyle.top) || 0;
            dragOffsetX = rect.left - parentRect.left - currentLeft;
            dragOffsetY = rect.top - parentRect.top - currentTop;            
            windowElement.style.transform = `translate3d(0px, 0px, 0px)`;
        }
        
        function cleanupAfterDrag() {
            windowElement.classList.remove('dragging-window');
            windowElement.style.transform = 'none';
        }
        
        handleElement.addEventListener('mousedown', (e) => {
             if (e.button !== 0 || e.target.tagName === 'BUTTON' || (windowElement.windowState && windowElement.windowState.isMaximized)) return;
            startX = e.clientX;
            startY = e.clientY;
            isDragging = true;
            prepareWindowForDrag();
            e.preventDefault();
        });
        handleElement.addEventListener('touchstart', (e) => {
             if (e.target.tagName === 'BUTTON' || (windowElement.windowState && windowElement.windowState.isMaximized)) return;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            isDragging = true;
            prepareWindowForDrag();
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('mousemove', (e) => {
             if (isDragging) {
                 const deltaX = e.clientX - startX;
                 const deltaY = e.clientY - startY;
                 e.preventDefault(); 
                windowElement.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
             }
         }, { passive: false });
        document.addEventListener('touchmove', (e) => {
             if (isDragging) {
                 const touch = e.touches[0];
                 const deltaX = touch.clientX - startX;
                 const deltaY = touch.clientY - startY;
                 e.preventDefault();
                windowElement.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
             }
         }, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        document.addEventListener('touchcancel', endDrag);
    }
    
    _setupResponsiveHandling(windowElement) {
        const resizeObserver = new ResizeObserver(() => {
            if (windowElement && windowElement.windowState && !windowElement.windowState.isMaximized && !windowElement.windowState.isMinimized) {
                this._constrainWindowToViewport(windowElement);
            }
        });
        resizeObserver.observe(document.body);
        windowElement.responsiveObserver = resizeObserver;
    }
    
    _getWindowFromIframeSource(eventSource) {
        const iframe = Array.from(document.querySelectorAll('iframe')).find(
            iframe => iframe.contentWindow === eventSource
        );
        return iframe ? iframe.closest('.window') : null;
    }
    
    _findTopWindow() {
        let topWindow = null;
        let maxZ = this.baseZIndex -1 ;
        Object.values(this.windows).forEach(win => {
            if (!win.windowState.isMinimized) {
                const z = parseInt(win.style.zIndex) || this.baseZIndex;
                if (z > maxZ) {
                    maxZ = z;
                    topWindow = win;
                }
            }
        });
        return topWindow;
    }
    
    _bindControl(element, eventType, handler, useCapture = false) {
        if (element) {
            element.addEventListener(eventType, handler, useCapture);
        }
    }

    // New method to manage the zIndexStack array
    _updateStackOrder(windowId, action = 'add') {
        // Remove existing entry if present
        const index = this.zIndexStack.indexOf(windowId);
        if (index > -1) {
            this.zIndexStack.splice(index, 1);
        }
        // Add to the front (top) if action is 'add'
        if (action === 'add') {
            this.zIndexStack.unshift(windowId);
        }
    }

    // New method to apply z-index based on stack order
    _updateZIndices() {
        const stackLength = this.zIndexStack.length;
        this.zIndexStack.forEach((id, index) => {
            const windowElement = this.windows[id];
            if (windowElement && !windowElement.windowState.isMinimized) { // Only apply to non-minimized
                // Higher index in array means lower stack position visually
                const zIndexValue = this.baseZIndex + (stackLength - 1 - index);
                this._setWindowZIndex(windowElement, zIndexValue);
            } else if (windowElement) {
                 // Clear z-index for minimized windows
                 this._setWindowZIndex(windowElement, '');
            }
        });
    }
}