class WindowTemplates {
    static getTemplate(templateName, title) {
        switch(templateName) {
            case 'my-computer':
                return this.createMyComputerContent();
            case 'folder-view':
                return this.createFolderViewContent(title);
            case 'browser':
                return this.createBrowserContent();
            case 'messenger':
                return this.createMessengerContent();
            case 'image-viewer':
                return this.createImageViewerContent();
            case 'email':
                return this.createEmailContent();
            case 'music-player':
                return this.createMusicPlayerContent();
            default:
                return this.createEmptyContent();
        }
    }
    
    /**
     * Create iframe container for window content
     * @param {string} appName - Name of the application
     * @param {string} title - Window title
     * @param {string} className - Optional custom class name for container
     * @returns {HTMLElement} Container with iframe
     */
    static createIframeContainer(appName, title, className = 'special-iframe-container') {
        const content = document.createElement('div');
        content.className = `window-body ${className}`;
        
        // Create and configure iframe
        const iframe = document.createElement('iframe');
        
        // Remove all potential iframe loading indicators
        
        // Prevent My Pictures flashing by setting special flag for this iframe
        if (appName === 'folder-view' && title === 'My Pictures') {
            iframe.style.opacity = '1';
            iframe.style.visibility = 'visible';
            iframe.style.background = '#fff';
        }
        
        // Sanitize title parameter for security
        const sanitizedTitle = title ? encodeURIComponent(title.replace(/[^\w\s-]/g, '')) : '';
        const sanitizedAppName = appName.replace(/[^\w\s-]/g, '');
        
        // Construct safe URL with sanitized parameters
        iframe.src = `./apps/${sanitizedAppName}/index.html` + (sanitizedTitle ? `?title=${sanitizedTitle}&windowId=${encodeURIComponent(sanitizedAppName + '-window')}` : '');
        iframe.className = `${sanitizedAppName}-frame`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowtransparency', 'true');
        iframe.setAttribute('data-app', sanitizedAppName);
        
        // Set explicit styles for reliable rendering
        Object.assign(iframe.style, {
            width: '100%',
            height: '100%',
            border: 'none',
            margin: '0',
            padding: '0',
            overflow: 'hidden'
        });
        
        // Add event listeners for better focus handling
        iframe.addEventListener('mouseenter', function() {
            // Find parent window and dispatch custom event
            let currentNode = this.parentNode;
            while (currentNode && !currentNode.classList.contains('window')) {
                currentNode = currentNode.parentNode;
            }
            
            if (currentNode) {
                // Custom focus event that bubbles up to window
                const focusEvent = new CustomEvent('iframe:focus', {
                    bubbles: true,
                    detail: { source: `${appName}-iframe` }
                });
                currentNode.dispatchEvent(focusEvent);
            }
        });
        
        // Add load event listener to initialize iframe communication
        iframe.addEventListener('load', () => {
            try {
                // Use a more specific targetOrigin for additional security
                const targetOrigin = window.location.origin;
                iframe.contentWindow.postMessage({
                    type: 'init-parent-comm',
                    windowId: sanitizedAppName + '-window'
                }, targetOrigin === 'null' ? '*' : targetOrigin);
            } catch (e) {
                // Ignore cross-origin errors
            }
        });
        
        // CRITICAL FIX: Add direct click handler to the iframe itself
        iframe.addEventListener('load', function() {
            // Get the window containing this iframe
            let parentWindow = null;
            let element = this;
            while (element && !element.classList.contains('window')) {
                element = element.parentElement;
            }
            parentWindow = element;
            
            if (parentWindow) {
                const windowId = parentWindow.id;
                
                // Try to access iframe document directly
                try {
                    const iframeDoc = this.contentDocument || this.contentWindow.document;
                    
                    // Add a click event listener to the iframe's document
                    iframeDoc.addEventListener('mousedown', function() {
                        // Send message to parent window to bring this window to front
                        window.dispatchEvent(new CustomEvent('iframe-activation', {
                            detail: { windowId: windowId }
                        }));
                    }, true);
                    
                } catch (e) {
                    // If same-origin policy prevents access
                    console.log('Unable to add direct activation handler to iframe, falling back to messaging');
                }
            }
        });
        
        // For My Pictures, add special handling
        iframe.addEventListener('load', function() {
            // For My Pictures, ensure images are immediately visible
            if (appName === 'folder-view' && title === 'My Pictures') {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    const style = iframeDoc.createElement('style');
                    style.textContent = `
                        .thumbnail-container img { 
                            opacity: 1 !important; 
                            visibility: visible !important;
                        }
                    `;
                    iframeDoc.head.appendChild(style);
                } catch (e) {
                    console.warn('Could not access iframe document');
                }
            }
        });
        
        content.appendChild(iframe);
        return content;
    }
    
    /**
     * Create content for My Computer window
     * @returns {HTMLElement} The window content
     */
    static createMyComputerContent() {
        return this.createIframeContainer('my-computer', 'My Computer');
    }
    
    /**
     * Create content for a folder view window
     * @param {string} title - The folder title to display
     * @returns {HTMLElement} The window content
     */
    static createFolderViewContent(title) {
        // Skip iframe for My Pictures - use direct DOM content instead
        if (title === 'My Pictures') {
            const content = document.createElement('div');
            content.className = 'window-body';
            content.innerHTML = `
                <div class="window-content with-sidebar">
                    <div class="sidebar">
                        <div class="sidebar-title">Picture Tasks</div>
                        <ul class="sidebar-list">
                            <li><a href="#" class="sidebar-link" data-action="slideshow">View as a slide show</a></li>
                            <li><a href="#" class="sidebar-link" data-action="prints">Order prints online</a></li>
                            <li><a href="#" class="sidebar-link" data-action="print">Print pictures</a></li>
                        </ul>
                        
                        <div class="sidebar-title">File and Folder Tasks</div>
                        <ul class="sidebar-list">
                            <li><a href="#" class="sidebar-link" data-action="new-folder">Make a new folder</a></li>
                            <li><a href="#" class="sidebar-link" data-action="share">Share this folder</a></li>
                        </ul>
                        
                        <div class="sidebar-title">Other Places</div>
                        <ul class="sidebar-list">
                            <li><a href="#" class="sidebar-link" data-action="my-computer">My Computer</a></li>
                            <li><a href="#" class="sidebar-link" data-action="my-documents">My Documents</a></li>
                            <li><a href="#" class="sidebar-link" data-action="shared">Shared Pictures</a></li>
                        </ul>
                    </div>
                    <div class="content">
                        <div class="address-bar">
                            <div class="address-icon">📁</div>
                            <div class="address-text">My Pictures</div>
                        </div>
                        <div class="folder-view" id="folder-view">
                            <div class="thumbnails-view" id="thumbnails-view">
                                <div class="thumbnail-item" data-image="image1.jpg">
                                    <div class="thumbnail-container">
                                        <img src="./assets/images/full/image1.jpg" alt="Image 1">
                                    </div>
                                    <span class="filename">image1.jpg</span>
                                </div>
                                <div class="thumbnail-item" data-image="image2.jpg">
                                    <div class="thumbnail-container">
                                        <img src="./assets/images/full/image2.jpg" alt="Image 2">
                                    </div>
                                    <span class="filename">image2.jpg</span>
                                </div>
                                <div class="thumbnail-item" data-image="image3.jpg">
                                    <div class="thumbnail-container">
                                        <img src="./assets/images/full/image3.jpg" alt="Image 3">
                                    </div>
                                    <span class="filename">image3.jpg</span>
                                </div>
                                <div class="thumbnail-item" data-image="image4.jpg">
                                    <div class="thumbnail-container">
                                        <img src="./assets/images/full/image4.jpg" alt="Image 4">
                                    </div>
                                    <span class="filename">image4.jpg</span>
                                </div>
                                <div class="thumbnail-item" data-image="image5.png">
                                    <div class="thumbnail-container">
                                        <img src="./assets/images/full/image5.png" alt="Image 5">
                                    </div>
                                    <span class="filename">image5.png</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Immediately set up event handlers on the DOM nodes
            const thumbnails = content.querySelectorAll('.thumbnail-item');
            const folderView = content.querySelector('#folder-view');
            
            thumbnails.forEach(thumbnail => {
                // Direct mousedown handler for selection
                thumbnail.onmousedown = function(e) {
                    e.stopPropagation();
                    
                    // Clear all selections first
                    thumbnails.forEach(item => {
                        item.classList.remove('selected');
                    });
                    
                    // Add selected class to this item
                    this.classList.add('selected');
                };
                
                // Double-click handler for opening image
                thumbnail.ondblclick = function(e) {
                    e.stopPropagation();
                    
                    const imageName = this.getAttribute('data-image');
                    
                    window.dispatchEvent(new CustomEvent('my-pictures:open-image', {
                        detail: {
                            imageName: imageName,
                            imagePath: `./assets/images/full/${imageName}`
                        }
                    }));
                    
                    // Clear all selections
                    thumbnails.forEach(item => {
                        item.classList.remove('selected');
                    });
                };
                
                // Prevent dragging
                thumbnail.ondragstart = function(e) {
                    e.preventDefault();
                    return false;
                };
            });
            
            // Click on empty space clears selection
            folderView.onclick = function(e) {
                if (e.target === folderView || e.target.id === 'thumbnails-view') {
                    thumbnails.forEach(item => {
                        item.classList.remove('selected');
                    });
                }
            };
            
            // Handle sidebar links
            const sidebarLinks = content.querySelectorAll('.sidebar-link');
            sidebarLinks.forEach(link => {
                link.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    window.dispatchEvent(new CustomEvent('my-pictures:action', {
                        detail: {
                            action: link.getAttribute('data-action'),
                            text: link.textContent,
                            folder: 'My Pictures'
                        }
                    }));
                    
                    return false;
                };
            });
            
            return content;
        }
        
        // Use iframe for all other folders
        return this.createIframeContainer('folder-view', title);
    }
    
    /**
     * Create content for Internet Explorer
     * @returns {HTMLElement} The window content
     */
    static createBrowserContent() {
        return this.createIframeContainer('browser', 'Internet Explorer');
    }
    
    /**
     * Create content for Windows Messenger
     * @returns {HTMLElement} The window content
     */
    static createMessengerContent() {
        return this.createIframeContainer('windows-messenger', null, 'special-messenger-container');
    }

    /**
     * Create content for Image Viewer window
     * @returns {HTMLElement} The window content
     */
    static createImageViewerContent() {
        return this.createIframeContainer('image-viewer', 'Image Viewer');
    }

    /**
     * Create content for Email application
     * @returns {HTMLElement} The window content
     */
    static createEmailContent() {
        return this.createIframeContainer('email', 'New Message - Outlook Express');
    }

    /**
     * Create content for Music Player window
     * @returns {HTMLElement} The window content
     */
    static createMusicPlayerContent() {
        const content = document.createElement('div');
        content.className = 'window-body special-iframe-container';
        
        // Create and configure iframe
        const iframe = document.createElement('iframe');
        
        // Sanitize parameters for security
        const sanitizedAppName = 'music-player';
        
        // Set source for the iframe
        iframe.src = `./apps/${sanitizedAppName}/index.html`;
        iframe.className = `${sanitizedAppName}-frame`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowtransparency', 'true');
        iframe.setAttribute('data-app', sanitizedAppName);
        iframe.setAttribute('scrolling', 'no'); // Explicitly disable scrolling
        
        // Add custom script to disable scrolling in the iframe content
        iframe.addEventListener('load', function() {
            try {
                const iframeDoc = this.contentDocument || this.contentWindow.document;
                const style = document.createElement('style');
                style.textContent = `
                    html, body { 
                        width: 100% !important;
                        height: 100% !important;
                        overflow: hidden !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .content {
                        width: 100% !important;
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                    }
                    .music-player {
                        width: 697px !important;
                        height: 372px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                `;
                iframeDoc.head.appendChild(style);
                
                // Disable scrolling on body and html elements
                iframeDoc.body.style.overflow = 'hidden';
                iframeDoc.documentElement.style.overflow = 'hidden';
            } catch(e) {
                console.log('Could not inject styles into iframe:', e);
            }
        });
        
        // Add scale transformation to make content 50% of original size
        Object.assign(iframe.style, {
            width: '100%',
            height: '100%',
            border: 'none',
            margin: '0',
            padding: '0',
            overflow: 'hidden',
            borderRadius: '21px', // 50% of original 43px
            backgroundColor: 'transparent',
            background: 'transparent',
            scrollbarWidth: 'none',
            borderWidth: '0',
            borderStyle: 'none',
            outline: 'none',
            boxSizing: 'border-box',
            // Apply scale transform to the iframe to make content 50% size
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
            // Double width and height to maintain aspect ratio after scaling
            position: 'absolute',
            width: '200%',
            height: '200%'
        });
        
        // Add event listeners for focus handling
        iframe.addEventListener('mouseenter', function() {
            // Find parent window
            let currentNode = this.parentNode;
            while (currentNode && !currentNode.classList.contains('window')) {
                currentNode = currentNode.parentNode;
            }
            
            if (currentNode) {
                // Custom focus event that bubbles up to window
                const focusEvent = new CustomEvent('iframe:focus', {
                    bubbles: true,
                    detail: { source: `music-player-iframe` }
                });
                currentNode.dispatchEvent(focusEvent);
            }
        });
        
        // Add load event listener for iframe communication
        iframe.addEventListener('load', () => {
            try {
                const targetOrigin = window.location.origin;
                iframe.contentWindow.postMessage({
                    type: 'init-parent-comm',
                    windowId: 'music-player-window'
                }, targetOrigin === 'null' ? '*' : targetOrigin);
            } catch (e) {
                // Ignore cross-origin errors
            }
        });
        
        // Add click handler to ensure window activation
        iframe.addEventListener('load', function() {
            // Get the window containing this iframe
            let parentWindow = null;
            let element = this;
            while (element && !element.classList.contains('window')) {
                element = element.parentElement;
            }
            parentWindow = element;
            
            if (parentWindow) {
                const windowId = parentWindow.id;
                
                // Try to access iframe document directly
                try {
                    const iframeDoc = this.contentDocument || this.contentWindow.document;
                    
                    // Add a click event listener to the iframe's document
                    iframeDoc.addEventListener('mousedown', function() {
                        // Send message to parent window to bring this window to front
                        window.dispatchEvent(new CustomEvent('iframe-activation', {
                            detail: { windowId: windowId }
                        }));
                    }, true);
                    
                } catch (e) {
                    // If same-origin policy prevents access
                    console.log('Unable to add direct activation handler to iframe, falling back to messaging');
                }
            }
        });
        
        content.appendChild(iframe);
        
        // Apply additional styles to the container to ensure transparency
        Object.assign(content.style, {
            backgroundColor: 'transparent',
            background: 'transparent',
            border: 'none',
            borderRadius: '21px', // 50% of original 43px
            overflow: 'hidden',
            padding: '0',
            margin: '0',
            position: 'relative'
        });
        
        return content;
    }

    /**
     * Create empty content for unknown window types
     * @returns {HTMLElement} The window content
     */
    static createEmptyContent() {
        const content = document.createElement('div');
        content.className = 'window-body';
        content.innerHTML = '<div class="empty-content"><p>No content available for this window type.</p></div>';
        return content;
    }
}

export default WindowTemplates;
