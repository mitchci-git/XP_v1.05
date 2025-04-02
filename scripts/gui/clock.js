/**
 * Clock module for Windows XP taskbar
 * Manages the system clock display and time updates
 */
export default class Clock {
    constructor(selector, eventBus) {
        this.eventBus = eventBus;
        this.clockElement = document.querySelector(selector);
        this.intervalId = null;
        this.initialTimeoutId = null;
        
        // Validate required elements and dependencies
        if (!this.clockElement) {
            console.error(`Clock element not found with selector: ${selector}`);
            return;
        }
        
        if (!this.eventBus) {
            console.error('EventBus not provided to Clock');
            return;
        }
        
        this.updateClock();
        this.setupClockUpdates();
        
        // Subscribe to time update requests
        this.eventBusSubscription = this.eventBus.subscribe('clock:update', () => this.updateClock());
    }
    
    setupClockUpdates() {
        // Use RAF for first update to ensure synchronization with frame
        requestAnimationFrame(() => {
            this.updateClock();
            
            // Calculate delay to align with start of next minute
            const now = new Date();
            const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
            
            // Initial timeout to align with the start of a minute
            this.initialTimeoutId = setTimeout(() => {
                this.updateClock();
                // Then update every minute
                this.intervalId = setInterval(() => this.updateClock(), 60000);
            }, delay);
        });
    }
    
    updateClock() {
        if (!this.clockElement) return;
        
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
        
        const formattedTime = `${displayHours}:${displayMinutes} ${ampm}`;
        this.clockElement.textContent = formattedTime;
        
        if (this.eventBus) {
            this.eventBus.publish('clock:time-changed', {
                hours,
                minutes,
                displayHours, 
                displayMinutes,
                ampm,
                formattedTime
            });
        }
    }
    
    destroy() {
        if (this.initialTimeoutId) {
            clearTimeout(this.initialTimeoutId);
            this.initialTimeoutId = null;
        }
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.eventBus && this.eventBusSubscription) {
            this.eventBus.unsubscribe(this.eventBusSubscription);
            this.eventBusSubscription = null;
        }
    }
}
