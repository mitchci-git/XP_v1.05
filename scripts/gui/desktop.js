/**
 * Desktop module for managing desktop icons and selection box
 * Handles icon selection and drag selection functionality
 */
export default class Desktop {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.desktop = document.querySelector('.desktop');
        this.icons = document.querySelectorAll('.desktop-icon');
        
        // Selection state
        this.selectionBox = null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.lastClickTimes = {};
        this.selectedIcons = new Set();
        
        // Remove leftover artifacts
        this.cleanupArtifacts();
        
        // Create selection overlay
        this.createSelectionOverlay();
        
        // Initialize events
        this.setupIconEvents();
        this.setupDesktopEvents();
        this.setupSelectionEvents();
        
        // Subscribe to window events to clear selection
        this.eventBus.subscribe('window:created', () => this.clearSelection());
        this.eventBus.subscribe('window:focused', () => this.clearSelection());
    }
    
    /**
     * Remove any existing selection boxes from the DOM
     */
    cleanupArtifacts() {
        document.querySelectorAll('#selection-box, .selection-box').forEach(
            box => box.parentNode?.removeChild(box)
        );
    }
    
    /**
     * Create a transparent overlay for handling mouse events
     */
    createSelectionOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'selection-overlay';
        
        if (this.desktop.firstChild) {
            this.desktop.insertBefore(overlay, this.desktop.firstChild);
        } else {
            this.desktop.appendChild(overlay);
        }
        
        this.overlay = overlay;
    }
    
    /**
     * Set up click and double-click events for desktop icons
     */
    setupIconEvents() {
        this.icons.forEach(icon => {
            const iconSpan = icon.querySelector('span');
            const iconText = iconSpan ? iconSpan.textContent.trim() : '';
            const iconId = iconText.toLowerCase().replace(/\s+/g, '-');
            
            // Single click for selection
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const now = Date.now();
                const lastTime = this.lastClickTimes[iconId] || 0;
                
                // Skip if part of double-click
                if (now - lastTime < 300) return;
                
                this.toggleIconSelection(icon, e.ctrlKey);
                this.lastClickTimes[iconId] = now;
            });
            
            // Double click to open programs
            icon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                
                // Ensure icon is selected
                if (!icon.classList.contains('selected')) {
                    this.selectIcon(icon, true);
                }
                
                let programName = iconText.toLowerCase().replace(/\s+/g, '-');
                
                // Map display names to program names
                if (programName === 'windows-messenger') {
                    programName = 'messenger';
                } else if (programName === 'my-pictures') {
                    programName = 'my-pictures';
                } else if (programName === 'windows-media-player') {
                    programName = 'music-player';
                }
                
                this.eventBus.publish('program:open', { programName });
            });
            
            // Set proper z-index
            icon.style.position = 'relative';
            icon.style.zIndex = '5';
        });
    }
    
    /**
     * Set up click event on desktop to clear selection
     */
    setupDesktopEvents() {
        this.desktop.addEventListener('click', (e) => {
            if (e.target === this.desktop || e.target === this.overlay) {
                if (!this.isDragging) {
                    this.clearSelection();
                }
            }
        });
    }
    
    /**
     * Set up events for drag selection box
     */
    setupSelectionEvents() {
        // Start selection on mousedown
        this.overlay.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.startSelectionBox(e.clientX, e.clientY);
            }
        });
        
        // Update selection box on mouse move
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.updateSelectionBox(e.clientX, e.clientY);
            }
        });
        
        // Finalize selection on mouseup
        document.addEventListener('mouseup', (e) => {
            if (this.isDragging && e.button === 0) {
                this.finalizeSelection();
            }
        });
    }
    
    /**
     * Begin creating a selection box
     */
    startSelectionBox(x, y) {
        this.isDragging = true;
        this.startX = x;
        this.startY = y;
        
        this.desktop.classList.add('selecting');
        
        // Remove existing selection box
        if (this.selectionBox && this.selectionBox.parentNode) {
            this.selectionBox.parentNode.removeChild(this.selectionBox);
        }
        
        // Create new selection box
        this.selectionBox = document.createElement('div');
        this.selectionBox.id = 'selection-box';
        
        // Set initial styles
        Object.assign(this.selectionBox.style, {
            position: 'absolute',
            top: y + 'px',
            left: x + 'px',
            width: '1px',
            height: '1px',
            border: '1px dotted #FFFFFF',
            backgroundColor: 'rgba(49, 106, 197, 0.2)',
            borderRadius: '3px',
            zIndex: '10',
            pointerEvents: 'none'
        });
        
        this.desktop.appendChild(this.selectionBox);
        
        // Clear existing selection unless Ctrl key is pressed
        if (!(window.event && window.event.ctrlKey)) {
            this.clearSelection();
        }
    }
    
    /**
     * Update the selection box size and position during drag
     */
    updateSelectionBox(x, y) {
        if (!this.selectionBox || !this.isDragging) return;
        
        const width = Math.abs(x - this.startX);
        const height = Math.abs(y - this.startY);
        const left = Math.min(x, this.startX);
        const top = Math.min(y, this.startY);
        
        // Update box position and size
        this.selectionBox.style.left = left + 'px';
        this.selectionBox.style.top = top + 'px';
        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
        
        // Update icon highlighting
        this.highlightIntersectingIcons(left, top, width, height);
    }
    
    /**
     * Add hover-by-selection class to icons that intersect with the selection box
     */
    highlightIntersectingIcons(left, top, width, height) {
        const selectionRect = { left, top, right: left + width, bottom: top + height };
        
        this.icons.forEach(icon => {
            icon.classList.remove('hover-by-selection');
            
            const rect = icon.getBoundingClientRect();
            const iconRect = {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom
            };
            
            if (this.doRectsIntersect(selectionRect, iconRect)) {
                icon.classList.add('hover-by-selection');
            }
        });
    }
    
    /**
     * Check if two rectangles intersect
     */
    doRectsIntersect(r1, r2) {
        return !(
            r1.right < r2.left || 
            r1.left > r2.right || 
            r1.bottom < r2.top || 
            r1.top > r2.bottom
        );
    }
    
    /**
     * Complete the selection process when mouse is released
     */
    finalizeSelection() {
        // Convert hover-by-selection to selected
        this.icons.forEach(icon => {
            if (icon.classList.contains('hover-by-selection')) {
                icon.classList.remove('hover-by-selection');
                icon.classList.add('selected');
                this.selectedIcons.add(icon);
            }
        });
        
        this.desktop.classList.remove('selecting');
        
        // Clean up selection box
        if (this.selectionBox && this.selectionBox.parentNode) {
            this.selectionBox.parentNode.removeChild(this.selectionBox);
            this.selectionBox = null;
        }
        
        this.isDragging = false;
    }
    
    /**
     * Toggle selection state of an icon
     */
    toggleIconSelection(icon, isCtrlPressed) {
        if (isCtrlPressed) {
            // Toggle this icon's state
            if (icon.classList.contains('selected')) {
                icon.classList.remove('selected');
                this.selectedIcons.delete(icon);
            } else {
                icon.classList.add('selected');
                this.selectedIcons.add(icon);
            }
        } else {
            // Clear selection and select only this icon
            this.clearSelection();
            icon.classList.add('selected');
            this.selectedIcons.add(icon);
        }
    }
    
    /**
     * Select an icon and optionally clear other selections
     */
    selectIcon(icon, clearOthers = true) {
        if (clearOthers) {
            this.clearSelection();
        }
        
        icon.classList.add('selected');
        this.selectedIcons.add(icon);
    }
    
    /**
     * Clear all icon selections
     */
    clearSelection() {
        this.icons.forEach(icon => {
            icon.classList.remove('selected', 'hover-by-selection');
        });
        this.selectedIcons.clear();
    }
}
