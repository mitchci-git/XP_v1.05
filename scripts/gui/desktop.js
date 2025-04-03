/**
 * Desktop module for managing desktop icons and selection box
 * Handles icon selection and drag selection functionality
 */
export default class Desktop {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.desktop = document.querySelector('.desktop');
        this.icons = document.querySelectorAll('.desktop-icon');

        this.selectionBox = null;
        this.isDragging = false;
        this.hasDragged = false;
        this.startX = 0;
        this.startY = 0;
        this.lastClickTimes = {};
        this.selectedIcons = new Set();

        this.cleanupArtifacts();
        this.createSelectionOverlay();
        this.setupIconEvents();
        this.setupDesktopEvents();
        this.setupPointerSelectionEvents();

        this.eventBus.subscribe('window:created', () => this.clearSelection());
        this.eventBus.subscribe('window:focused', () => this.clearSelection());
    }

    cleanupArtifacts() {
        document.querySelectorAll('#selection-box, .selection-box').forEach(
            box => box.parentNode?.removeChild(box)
        );
    }

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

    setupIconEvents() {
        this.icons.forEach(icon => {
            const iconSpan = icon.querySelector('span');
            const iconText = iconSpan ? iconSpan.textContent.trim() : '';
            const iconId = iconText.toLowerCase().replace(/\s+/g, '-');

            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const now = Date.now();
                const lastTime = this.lastClickTimes[iconId] || 0;
                if (now - lastTime < 300) return;
                this.toggleIconSelection(icon, e.ctrlKey);
                this.lastClickTimes[iconId] = now;
            });

            icon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (!icon.classList.contains('selected')) {
                    this.selectIcon(icon, true);
                }
                let programName = iconText.toLowerCase().replace(/\s+/g, '-');
                if (programName === 'windows-messenger') programName = 'messenger';
                else if (programName === 'windows-media-player') programName = 'music-player';
                this.eventBus.publish('program:open', { programName });
            });

            icon.style.position = 'relative';
            icon.style.zIndex = '5';
        });
    }

    setupDesktopEvents() {
        this.desktop.addEventListener('click', (e) => {
            if (e.target === this.desktop || e.target === this.overlay) {
                if (!this.isDragging && !this.hasDragged) {
                    this.clearSelection();
                }
            }
        });
    }

    setupPointerSelectionEvents() {
        window.addEventListener('pointerdown', (e) => {
            // Only start selection if clicking directly on the overlay or desktop element
            // This prevents selection when clicking on windows or other elements
            if (e.target !== this.overlay && e.target !== this.desktop) return;
            
            const rect = this.desktop.getBoundingClientRect();
            this.startX = e.clientX - rect.left;
            this.startY = e.clientY - rect.top;
            this.clearTemporaryHighlights();

            // Get the computed style variables
            const styles = getComputedStyle(document.documentElement);
            const selectionColor = styles.getPropertyValue('--desktop-selection-color').trim();
            const selectionBorder = styles.getPropertyValue('--selection-border').trim();

            this.selectionBox = document.createElement('div');
            this.selectionBox.className = 'selection-box';
            
            // Apply styles using CSS variables
            this.selectionBox.style.cssText = `
                position: absolute;
                left: ${this.startX}px;
                top: ${this.startY}px; Changed from 1000 to 1 to stay behind windows
                width: 0px;
                height: 0px;
                background-color: ${selectionColor};
                border: ${selectionBorder};
                border-radius: 3px;
                pointer-events: none;
                z-index: 1;
            `;
            
            this.desktop.appendChild(this.selectionBox);
            this.isDragging = true;
            this.hasDragged = false;
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDragging || !this.selectionBox) return;
            this.hasDragged = true;
            const rect = this.desktop.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            const x = Math.min(currentX, this.startX);
            const y = Math.min(currentY, this.startY);
            const w = Math.abs(currentX - this.startX);
            const h = Math.abs(currentY - this.startY);
            Object.assign(this.selectionBox.style, {
                left: `${x}px`,
                top: `${y}px`,
                width: `${w}px`,
                height: `${h}px`
            });

            this.highlightIconsIntersecting(x, y, w, h);
        });

        window.addEventListener('pointerup', () => {
            if (!this.isDragging || !this.selectionBox) return;
            this.isDragging = false;

            this.icons.forEach(icon => {
                if (icon.classList.contains('hover-by-selection')) {
                    icon.classList.remove('hover-by-selection');
                    icon.classList.add('selected');
                    this.selectedIcons.add(icon);
                }
            });

            if (this.selectionBox && this.selectionBox.parentNode) {
                this.selectionBox.parentNode.removeChild(this.selectionBox);
                this.selectionBox = null;
            }
        });
    }

    setupSelectionEvents() {
        // Start selection on mousedown
        this.overlay.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                // Only allow selection when clicking directly on overlay or desktop
                const target = e.target;
                
                // Strict target checking - only allow .selection-overlay or .desktop
                if (target === this.overlay || target === this.desktop) {
                    this.startSelectionBox(e.clientX, e.clientY, e);
                }
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

    highlightIconsIntersecting(left, top, width, height) {
        const selectionRect = { left, top, right: left + width, bottom: top + height };
        this.icons.forEach(icon => {
            const rect = icon.getBoundingClientRect();
            const desktopRect = this.desktop.getBoundingClientRect();
            const iconRect = {
                left: rect.left - desktopRect.left,
                top: rect.top - desktopRect.top,
                right: rect.right - desktopRect.left,
                bottom: rect.bottom - desktopRect.top
            };

            const intersects = !(
                iconRect.right < selectionRect.left ||
                iconRect.left > selectionRect.right ||
                iconRect.bottom < selectionRect.top ||
                iconRect.top > selectionRect.bottom
            );

            if (intersects) {
                icon.classList.add('hover-by-selection');
            } else {
                icon.classList.remove('hover-by-selection');
            }
        });
    }

    toggleIconSelection(icon, isCtrlPressed) {
        if (isCtrlPressed) {
            if (icon.classList.contains('selected')) {
                icon.classList.remove('selected');
                this.selectedIcons.delete(icon);
            } else {
                icon.classList.add('selected');
                this.selectedIcons.add(icon);
            }
        } else {
            this.clearSelection();
            icon.classList.add('selected');
            this.selectedIcons.add(icon);
        }
    }

    selectIcon(icon, clearOthers = true) {
        if (clearOthers) this.clearSelection();
        icon.classList.add('selected');
        this.selectedIcons.add(icon);
    }

    clearSelection() {
        this.icons.forEach(icon => {
            icon.classList.remove('selected', 'hover-by-selection');
        });
        this.selectedIcons.clear();
    }

    clearTemporaryHighlights() {
        this.icons.forEach(icon => icon.classList.remove('hover-by-selection'));
    }
}