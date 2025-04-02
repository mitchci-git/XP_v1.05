/**
 * Start Menu module for Windows XP simulation
 * Handles the start menu display, interaction, and submenus
 */
export default class StartMenu {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.startButton = document.getElementById('start-button');
        this.startMenu = null;
        this.allProgramsMenu = null;
        
        // Initialize components
        this.createStartMenuElement();
        this.setupEventListeners();
        
        // Subscribe to toggle event
        this.eventBus.subscribe('startmenu:toggle', () => this.toggleStartMenu());
    }
    
    /**
     * Create the start menu DOM element
     */
    createStartMenuElement() {
        // Clean up any existing menu
        const existingMenu = document.querySelector('.startmenu');
        if (existingMenu) {
            existingMenu.parentNode.removeChild(existingMenu);
        }
        
        // Create menu with proper initial hidden state
        const startMenu = document.createElement('div');
        startMenu.className = 'startmenu';
        startMenu.innerHTML = this.getMenuTemplate();
        startMenu.style.visibility = 'hidden';
        startMenu.style.opacity = '0';
        
        document.body.appendChild(startMenu);
        this.startMenu = startMenu;
        
        // Setup components
        this.setupMenuItems();
        this.createAllProgramsMenu();
    }

    /**
     * Create the All Programs submenu
     */
    createAllProgramsMenu() {
        // Remove existing menu if present
        const existingMenu = document.querySelector('.all-programs-menu');
        if (existingMenu) {
            existingMenu.parentNode.removeChild(existingMenu);
        }
        
        // Create new menu
        const allProgramsMenu = document.createElement('div');
        allProgramsMenu.className = 'all-programs-menu';
        allProgramsMenu.innerHTML = `
            <ul class="all-programs-items">
                <li class="all-programs-item">
                    <img src="./assets/icons/windows/paint.png" alt="Paint">
                    Paint
                </li>
                <li class="all-programs-item">
                    <img src="./assets/icons/windows/wordpad.png" alt="WordPad">
                    WordPad
                </li>
                <li class="all-programs-item">
                    <img src="./assets/icons/windows/calculator.png" alt="Calculator">
                    Calculator
                </li>
                <li class="all-programs-separator"></li>
                <li class="all-programs-item category">
                    <img src="./assets/icons/windows/folder.png" alt="Folder">
                    Windows Accessories
                </li>
                <li class="all-programs-item category">
                    <img src="./assets/icons/windows/folder.png" alt="Folder">
                    Games
                </li>
            </ul>
        `;
        
        // Add to DOM initially hidden
        document.body.appendChild(allProgramsMenu);
        allProgramsMenu.style.display = 'none';
        this.allProgramsMenu = allProgramsMenu;
    }
    
    /**
     * Get HTML template for the start menu
     */
    getMenuTemplate() {
        return `
            <div class="menutopbar">
                <img src="./assets/start-menu/user.png" alt="User" class="userpicture">
                <span class="username">Mitch's Portfolio</span>
            </div>
            <div class="start-menu-middle">
                <div class="middle-section middle-left">
                    <ul class="menu-items">
                        <li class="menu-item" id="menu-internet">
                            <img src="./assets/start-menu/internet.png" alt="Internet Explorer">
                            <div class="item-content">
                                <span class="item-title">Internet Explorer</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-email">
                            <img src="./assets/start-menu/email.png" alt="E-mail">
                            <div class="item-content">
                                <span class="item-title">E-mail</span>
                                <span class="item-description">Outlook Express</span>
                            </div>
                        </li>
                        <li class="menu-divider"><hr class="divider"></li>
                        <li class="menu-item" id="menu-media-player">
                            <img src="./assets/icons/desktop/music-player.png" alt="Media Player">
                            <div class="item-content">
                                <span class="item-title">Media Player</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-my-computer">
                            <img src="./assets/start-menu/computer.png" alt="My Computer">
                            <div class="item-content">
                                <span class="item-title">My Computer</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-my-documents">
                            <img src="./assets/start-menu/documents.png" alt="My Documents">
                            <div class="item-content">
                                <span class="item-title">My Documents</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-my-pictures">
                            <img src="./assets/start-menu/pictures.png" alt="My Pictures">
                            <div class="item-content">
                                <span class="item-title">My Pictures</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-paint">
                            <img src="./assets/start-menu/paint.png" alt="Paint">
                            <div class="item-content">
                                <span class="item-title">Paint</span>
                            </div>
                        </li>
                    </ul>
                    <div class="all-programs-container">
                        <hr class="divider">
                        <div class="all-programs-button" id="menu-all-programs">
                            <span>All Programs</span>
                            <img src="./assets/start-menu/arrow.ico" alt="All Programs">
                        </div>
                    </div>
                </div>
                <div class="middle-section middle-right">
                    <ul class="menu-items">
                        <li class="menu-item" id="menu-linkedin">
                            <img src="./assets/start-menu/linkedin.png" alt="LinkedIn">
                            <div class="item-content">
                                <span class="item-title">LinkedIn</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-github">
                            <img src="./assets/start-menu/github.png" alt="GitHub">
                            <div class="item-content">
                                <span class="item-title">GitHub</span>
                            </div>
                        </li>
                        <li class="menu-item" id="menu-instagram">
                            <img src="./assets/start-menu/instagram.png" alt="Instagram">
                            <div class="item-content">
                                <span class="item-title">Instagram</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="start-menu-footer">
                <div class="footer-buttons">
                    <div class="footer-button" id="btn-log-off">
                        <img src="./assets/start-menu/logoff.png" alt="Log Off">
                        <span>Log Off</span>
                    </div>
                    <div class="footer-button" id="btn-shut-down">
                        <img src="./assets/start-menu/shutdown.png" alt="Shut Down">
                        <span>Shut Down</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Set up all necessary event listeners
     */
    setupEventListeners() {
        // Close start menu when clicking outside - use capturing phase to catch all events
        document.addEventListener('mousedown', (e) => {
            if (this.startMenu && 
                this.startMenu.classList.contains('active') && 
                !this.startMenu.contains(e.target) && 
                !this.startButton.contains(e.target) &&
                (!this.allProgramsMenu || !this.allProgramsMenu.contains(e.target))) {
                this.closeStartMenu();
            }
        }, true); // Use capturing phase to catch events before they reach iframes or other handlers
        
        // ESC key closes start menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && 
                this.startMenu && 
                this.startMenu.classList.contains('active')) {
                this.closeStartMenu();
            }
        });
        
        // Handle iframe clicks specifically
        const handleIframeClick = () => {
            if (this.startMenu && this.startMenu.classList.contains('active')) {
                this.closeStartMenu();
            }
        };
        
        // Listen for iframe activation events
        window.addEventListener('iframe-activation', handleIframeClick);
        window.addEventListener('iframe:focus', handleIframeClick);
        
        // Also intercept message events which might come from iframes
        window.addEventListener('message', (e) => {
            if (e.data && (e.data.type === 'iframe-clicked' || e.data.type === 'window-focus')) {
                if (this.startMenu && this.startMenu.classList.contains('active')) {
                    this.closeStartMenu();
                }
            }
        }, true);
    }
    
    /**
     * Set up menu items and their click handlers
     */
    setupMenuItems() {
        // Program menu items
        const menuItemHandlers = {
            'internet': () => this.openProgram('internet-explorer'),
            'my-documents': () => this.openProgram('my-documents'),
            'my-computer': () => this.openProgram('my-computer'),
            'messenger': () => this.openProgram('messenger'),
            'my-pictures': () => this.openProgram('my-pictures'), // Make sure this is included
            'paint': () => this.openProgram('paint'),
            'email': () => this.openProgram('email'),
            'media-player': () => this.openProgram('music-player') // Updated to open music-player instead of media-player
        };
        
        Object.entries(menuItemHandlers).forEach(([id, handler]) => {
            const menuItem = this.startMenu.querySelector(`#menu-${id}`);
            if (menuItem) {
                menuItem.addEventListener('click', () => {
                    handler();
                    this.closeStartMenu();
                });
            }
        });
        
        // Social media links
        const socialItems = {
            'instagram': 'https://www.instagram.com',
            'github': 'https://github.com',
            'linkedin': 'https://www.linkedin.com'
        };
        
        // Set up social media links
        Object.entries(socialItems).forEach(([platform, url]) => {
            const menuItem = this.startMenu.querySelector(`#menu-${platform}`);
            if (menuItem) {
                menuItem.addEventListener('click', () => {
                    window.open(url, '_blank');
                    this.closeStartMenu();
                });
            }
        });

        // Set up Log Off and Shut Down buttons
        const logOffButton = this.startMenu.querySelector('#btn-log-off');
        const shutDownButton = this.startMenu.querySelector('#btn-shut-down');
        
        if (logOffButton) {
            logOffButton.addEventListener('click', () => this.closeStartMenu());
        }
        
        if (shutDownButton) {
            shutDownButton.addEventListener('click', () => this.closeStartMenu());
        }

        // Set up All Programs menu with slight delay to ensure DOM is ready
        setTimeout(() => this.setupAllProgramsMenu(), 100);
    }

    /**
     * Set up All Programs menu behavior
     */
    setupAllProgramsMenu() {
        const allProgramsButton = document.getElementById('menu-all-programs');
        
        if (!allProgramsButton || !this.allProgramsMenu || !this.startMenu) {
            return; // Exit early if elements don't exist
        }
        
        // Show menu on hover
        allProgramsButton.addEventListener('mouseenter', () => this.showAllProgramsMenu());
        
        // Hide menu on mouse leave
        this.allProgramsMenu.addEventListener('mouseleave', () => this.hideAllProgramsMenu());
        
        // Hide when hovering other start menu elements
        const otherElements = this.startMenu.querySelectorAll(
            '.menu-item:not(#menu-all-programs), .menutopbar, .start-menu-footer, .middle-right'
        );
        
        otherElements.forEach(element => {
            element.addEventListener('mouseenter', () => this.hideAllProgramsMenu());
        });
        
        // Set up click handlers for programs
        const programItems = this.allProgramsMenu.querySelectorAll('.all-programs-item:not(.category)');
        programItems.forEach(item => {
            item.addEventListener('click', () => {
                const programName = item.textContent.trim().toLowerCase().replace(/\s+/g, '-');
                this.openProgram(programName);
                this.closeStartMenu();
            });
        });
    }

    /**
     * Show the All Programs menu
     */
    showAllProgramsMenu() {
        if (!this.allProgramsMenu || !this.startMenu) {
            return; // Exit early if elements don't exist
        }
        
        const allProgramsButton = this.startMenu.querySelector('#menu-all-programs');
        const footerElement = this.startMenu.querySelector('.start-menu-footer');
        
        if (!allProgramsButton || !footerElement) {
            return; // Exit early if elements don't exist
        }
        
        const buttonRect = allProgramsButton.getBoundingClientRect();
        const footerRect = footerElement.getBoundingClientRect();
        
        // Position menu next to All Programs button
        Object.assign(this.allProgramsMenu.style, {
            left: buttonRect.right + 'px',
            bottom: (window.innerHeight - footerRect.top) + 'px',
            top: 'auto',
            display: 'block'
        });
        
        this.allProgramsMenu.classList.add('active');
    }

    /**
     * Hide the All Programs menu
     */
    hideAllProgramsMenu() {
        if (this.allProgramsMenu) {
            this.allProgramsMenu.classList.remove('active');
            this.allProgramsMenu.style.display = 'none';
        }
    }
    
    /**
     * Open a program using the event bus
     */
    openProgram(programName) {
        this.eventBus.publish('program:open', { programName });
    }
    
    /**
     * Toggle the start menu visibility
     */
    toggleStartMenu() {
        if (!this.startMenu) {
            return; // Exit early if menu doesn't exist
        }
        
        const isCurrentlyActive = this.startMenu.classList.contains('active');
        
        if (!isCurrentlyActive) {
            // Show menu
            this.startMenu.style.visibility = 'visible';
            this.startMenu.style.opacity = '1';
            this.startMenu.classList.add('active');
            this.eventBus.publish('startmenu:opened');
        } else {
            // Hide menu
            this.closeStartMenu();
        }
    }
    
    /**
     * Close the start menu
     */
    closeStartMenu() {
        if (!this.startMenu) return;
        
        // Hide the menu with fade-out effect
        this.startMenu.classList.remove('active');
        this.hideAllProgramsMenu(); // Ensure submenu is also hidden
        
        // Notify listeners that menu was closed
        this.eventBus.publish('startmenu:closed');
        
        // Use a timeout to remove the menu from DOM after animation completes
        setTimeout(() => {
            if (this.startMenu && this.startMenu.parentNode) {
                this.startMenu.style.visibility = 'hidden';
                this.startMenu.style.opacity = '0';
            }
        }, 200); // Match this with CSS transition duration
    }
}
