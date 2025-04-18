/**
 * Desktop Component
 * Manages the Windows XP desktop icons and basic interactions
 */
import { EVENTS } from '../utils/eventBus.js';

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
        this.setWallpaperBasedOnAspectRatio();

        this.eventBus.subscribe(EVENTS.WINDOW_CREATED, () => this.clearSelection());
        this.eventBus.subscribe(EVENTS.WINDOW_FOCUSED, () => this.clearSelection());
        
        // Recheck wallpaper on window resize
        window.addEventListener('resize', () => this.setWallpaperBasedOnAspectRatio());
    }

    // Set the appropriate wallpaper based on screen aspect ratio
    setWallpaperBasedOnAspectRatio() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        
        // Aspect ratio threshold for ultrawide monitors (typically 21:9 or wider)
        const ultrawideThreshold = 2.1; // 21:9 = 2.33, 16:9 = 1.78
        
        // Default and ultrawide wallpaper paths (Use root-relative paths for deployment)
        const defaultWallpaper = './assets/gui/desktop/bliss.jpg';
        const ultrawideWallpaper = './assets/gui/desktop/bliss-ultrawide.jpg';
        
        // Set the appropriate wallpaper
        if (aspectRatio >= ultrawideThreshold) {
            this.desktop.style.backgroundImage = `url('${ultrawideWallpaper}')`;
        } else {
            this.desktop.style.backgroundImage = `url('${defaultWallpaper}')`;
        }
    }

    // Simplified repetitive DOM manipulation logic in createSelectionOverlay and cleanupArtifacts
    cleanupArtifacts() {
        document.querySelectorAll('#selection-box, .selection-box').forEach(box => box.remove());
    }

    createSelectionOverlay() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'selection-overlay';
            this.desktop.prepend(this.overlay);
        }
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
                
                // Use the data-program-name attribute directly
                let programName = icon.getAttribute('data-program-name');
                
                // Only keep necessary special cases
                if (programName === 'windows-messenger') programName = 'messenger';
                if (programName === 'command-prompt') programName = 'cmd-prompt';
                
                this.eventBus.publish(EVENTS.PROGRAM_OPEN, { programName });
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
            if (e.target !== this.overlay && e.target !== this.desktop) return;
            
            const rect = this.desktop.getBoundingClientRect();
            this.startX = e.clientX - rect.left;
            this.startY = e.clientY - rect.top;
            this.clearTemporaryHighlights();

            const styles = getComputedStyle(document.documentElement);
            const selectionColor = styles.getPropertyValue('--desktop-selection-color').trim();
            const selectionBorder = styles.getPropertyValue('--selection-border').trim();

            this.selectionBox = document.createElement('div');
            this.selectionBox.className = 'selection-box';
            
            // Apply only dynamic styles directly
            Object.assign(this.selectionBox.style, {
                left: `${this.startX}px`,
                top: `${this.startY}px`,
                width: '0px',
                height: '0px'
            });
            
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

            if (this.selectionBox?.parentNode) {
                this.selectionBox.parentNode.removeChild(this.selectionBox);
                this.selectionBox = null;
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