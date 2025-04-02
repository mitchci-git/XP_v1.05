/**
 * EventBus - Communication system for Windows XP simulation components
 * Implements a publish-subscribe pattern for decoupled communication
 */
class EventBus {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Function to call when event is triggered
     * @returns {function} Unsubscribe function
     */
    subscribe(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        
        // Return unsubscribe function for easier cleanup
        return () => this.unsubscribe(event, callback);
    }

    /**
     * Subscribe to an event only once
     * @param {string} event - Event name  
     * @param {function} callback - Function to call when event is triggered
     */
    once(event, callback) {
        const onceCallback = (...args) => {
            this.unsubscribe(event, onceCallback);
            callback(...args);
        };
        
        this.subscribe(event, onceCallback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {function} callback - Function to unsubscribe
     */
    unsubscribe(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Publish an event
     * @param {string} event - Event name
     * @param {any} data - Data to pass to subscribers
     */
    publish(event, data) {
        if (this.events[event]) {
            // Create a copy of the subscribers array to avoid issues if callbacks modify subscriptions
            const subscribers = [...this.events[event]];
            subscribers.forEach(callback => callback(data));
        }
    }
}

// Create and export a singleton instance
const eventBus = new EventBus();
export default eventBus;
