/**
 * Taskbar module for managing the start menu and system tray
 */
import StartMenu from './startMenu.js';

export default class Taskbar {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.startButton = document.getElementById('start-button');
        
        // Initialize components
        this.startMenuComponent = new StartMenu(this.eventBus);
        this.setupStartButtonEffects();
        this.setupTooltips();
        
        // Subscribe to events
        this.subscribeToEvents();
    }
    
    /**
     * Subscribe to event bus events
     */
    subscribeToEvents() {
        // Start menu state changes
        this.eventBus.subscribe('startmenu:opened', () => {
            this.startButton.classList.add('active');
        });
        
        this.eventBus.subscribe('startmenu:closed', () => {
            this.startButton.classList.remove('active');
        });
    }
    
    /**
     * Set up hover and click effects for start button
     */
    setupStartButtonEffects() {
        this.startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.eventBus.publish('startmenu:toggle');
        });
        
        this.startButton.addEventListener('mouseleave', () => {
            // Only remove active class if menu is not open
            const startMenuElement = document.querySelector('.startmenu');
            if (!startMenuElement) {
                this.startButton.classList.remove('active');
            }
        });
    }
    
    /**
     * Set up tooltips for system tray icons
     */
    setupTooltips() {
        // Remove any existing tooltips - only do this operation once
        const existingTooltips = document.querySelectorAll('.taskbar-tooltip');
        existingTooltips.forEach(tooltip => {
            tooltip.parentNode.removeChild(tooltip);
        });
        
        // Setup event listeners for tray icons
        const trayIcons = document.querySelectorAll('.tray-status-icon, .tray-network-icon, .tray-volume-icon');
        
        // Track active tooltip for efficient cleanup
        let activeTooltip = null;
        
        trayIcons.forEach(icon => {
            // Add mouseenter event listener to show tooltip
            icon.addEventListener('mouseenter', () => {
                // Get tooltip text from data attribute
                const tooltipText = icon.getAttribute('data-tooltip');
                
                if (!tooltipText) return;
                
                // Remove any existing tooltip
                if (activeTooltip && activeTooltip.parentNode) {
                    activeTooltip.parentNode.removeChild(activeTooltip);
                }
                
                // Create tooltip element
                const tooltip = document.createElement('div');
                tooltip.className = 'taskbar-tooltip';
                tooltip.textContent = tooltipText;
                
                // Position tooltip above the icon
                const iconRect = icon.getBoundingClientRect();
                tooltip.style.bottom = (window.innerHeight - iconRect.top + 5) + 'px';
                
                // Add tooltip to DOM first to calculate its actual width
                document.body.appendChild(tooltip);
                tooltip.style.left = (iconRect.left + (iconRect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
                
                // Track the tooltip
                activeTooltip = tooltip;
            });
            
            // Add mouseleave event listener to hide tooltip
            icon.addEventListener('mouseleave', () => {
                // Remove active tooltip if it exists
                if (activeTooltip && activeTooltip.parentNode) {
                    activeTooltip.parentNode.removeChild(activeTooltip);
                    activeTooltip = null;
                }
            });
        });
    }
}
