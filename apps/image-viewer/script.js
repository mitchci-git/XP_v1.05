document.addEventListener('DOMContentLoaded', function() {
    const imageDisplay = document.getElementById('image-display');
    const imageContainer = document.getElementById('image-container');
    const imageInfo = document.getElementById('image-info');
    const zoomLevel = document.getElementById('zoom-level');
    
    // Cache button elements
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const zoomInButton = document.getElementById('zoom-in-button');
    const zoomOutButton = document.getElementById('zoom-out-button');
    const rotateButton = document.getElementById('rotate-button');
    
    // Prevent selection and highlighting throughout the app
    document.addEventListener('mousedown', function(e) {
        if (!e.target.classList.contains('toolbar-button')) {
            e.preventDefault();
        }
    });
    
    // Prevent drag start for all elements
    document.addEventListener('dragstart', e => e.preventDefault());
    
    // Add tooltip functionality
    setupTooltips();
    
    // State variables
    let currentZoom = 0.825; // 82.5%
    let currentRotation = 0;
    let imageName = '';
    let imagesArray = [];
    let currentImageIndex = 0;
    let isWindowMaximized = false;
    let initialImageLoaded = false;
    let displayScaleFactor = 100 / 82.5;
    
    // Setup tooltips for toolbar buttons with single tooltip instance
    let activeTooltip = null;
    
    function setupTooltips() {
        const buttons = document.querySelectorAll('.toolbar-button');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => showTooltip(button));
            button.addEventListener('mouseleave', () => hideTooltip());
        });
    }
    
    function showTooltip(element) {
        hideTooltip();
        
        const tooltipText = element.getAttribute('data-tooltip');
        if (!tooltipText) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'viewer-tooltip';
        tooltip.textContent = tooltipText;
        document.body.appendChild(tooltip);
        activeTooltip = tooltip;
        
        const rect = element.getBoundingClientRect();
        
        let left = rect.left + rect.width/2 - tooltip.offsetWidth/2;
        let top = rect.top - tooltip.offsetHeight - 5;
        
        if (left < 5) left = 5;
        if (left + tooltip.offsetWidth > window.innerWidth - 5) {
            left = window.innerWidth - tooltip.offsetWidth - 5;
        }
        if (top < 5) {
            top = rect.bottom + 5;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }
    
    function hideTooltip() {
        if (activeTooltip) {
            activeTooltip.parentNode.removeChild(activeTooltip);
            activeTooltip = null;
        }
    }

    // Listen for messages from parent window
    window.addEventListener('message', function(event) {
        try {
            if (event.data.type === 'load-image') {
                handleLoadImage(event.data);
            } else if (event.data.type === 'window-state-update') {
                isWindowMaximized = event.data.isMaximized;
            }
        } catch (err) {
            console.error("Error handling window message:", err);
            imageInfo.textContent = "Error loading image";
        }
    });
    
    function handleLoadImage(data) {
        imageName = data.imageName || '';
        
        if (data.isMaximized !== undefined) {
            isWindowMaximized = data.isMaximized;
        }
        
        // Update info immediately
        imageInfo.textContent = imageName;
        
        // Keep image hidden until loaded
        imageDisplay.style.visibility = 'hidden';
        imageDisplay.style.opacity = '0';
        
        // Clear any previous error messages
        Array.from(imageContainer.querySelectorAll('.error-message')).forEach(errorEl => errorEl.remove());
        
        const fileName = data.imageName;
        const imagePath = `../../assets/images/full/${fileName}`;
        
        // Reset view settings
        currentZoom = 0.825;
        currentRotation = 0;
        
        // Clear previous image
        imageDisplay.src = '';
        
        // Short timeout to ensure browser clears the previous image
        setTimeout(function() {
            imageDisplay.onload = handleImageLoaded;
            imageDisplay.onerror = () => handleImageError(imageName);
            imageDisplay.src = imagePath;
        }, 50);
    }
    
    function handleImageLoaded() {
        // Update style and display image
        imageDisplay.style.transform = `scale(${currentZoom}) rotate(${currentRotation}deg)`;
        imageDisplay.style.visibility = 'visible';
        
        // Fade in the image
        setTimeout(() => {
            imageDisplay.style.opacity = '1';
        }, 10);
        
        // Update info
        imageInfo.textContent = imageName;
        zoomLevel.textContent = '100%';
        
        // Setup image array for navigation
        imagesArray = [
            { name: 'image1.jpg', path: '../../assets/images/full/image1.jpg' },
            { name: 'image2.jpg', path: '../../assets/images/full/image2.jpg' },
            { name: 'image3.jpg', path: '../../assets/images/full/image3.jpg' },
            { name: 'image4.jpg', path: '../../assets/images/full/image4.jpg' },
            { name: 'image5.png', path: '../../assets/images/full/image5.png' }
        ];
        
        currentImageIndex = imagesArray.findIndex(img => img.name === imageName);
        if (currentImageIndex === -1) currentImageIndex = 0;
        
        updateNavigationButtons();
        
        // Handle window sizing/notification
        if (!initialImageLoaded) {
            if (!isWindowMaximized) {
                optimizeWindowSize();
            } else {
                notifyParentAboutImage();
            }
            initialImageLoaded = true;
        } else {
            notifyParentAboutImage(false);
        }
    }
    
    function handleImageError(imageName) {
        // Ensure image is completely hidden
        imageDisplay.style.visibility = 'hidden';
        imageDisplay.style.opacity = '0';
        imageDisplay.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        
        // Update info
        imageInfo.textContent = `Error: Could not load ${imageName}`;
        
        // Create error message with improved styling
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h3>Image Failed to Load</h3>
            <p>Could not display: ${imageName}</p>
            <p>Please check that the file exists in:</p>
            <p class="path">assets/images/full/</p>
        `;
        
        // Clear any previous errors
        Array.from(imageContainer.querySelectorAll('.error-message')).forEach(el => el.remove());
        
        // Add new error
        imageContainer.appendChild(errorDiv);
    }
    
    // For looping navigation, buttons are always enabled
    function updateNavigationButtons() {
        prevButton.disabled = false;
        nextButton.disabled = false;
    }
    
    // Zoom in
    zoomInButton.addEventListener('click', function() {
        if (currentZoom < 3) {
            currentZoom += 0.25;
            updateImageTransform();
            zoomLevel.textContent = `${Math.round(currentZoom * displayScaleFactor * 100)}%`;
        }
    });
    
    // Zoom out
    zoomOutButton.addEventListener('click', function() {
        if (currentZoom > 0.25) {
            currentZoom -= 0.25;
            updateImageTransform();
            zoomLevel.textContent = `${Math.round(currentZoom * displayScaleFactor * 100)}%`;
        }
    });
    
    // Rotate image
    rotateButton.addEventListener('click', function() {
        currentRotation += 90;
        imageDisplay.style.transform = `scale(${currentZoom}) rotate(${currentRotation}deg)`;
        zoomLevel.textContent = `${Math.round(currentZoom * displayScaleFactor * 100)}%`;
    });
    
    // Navigate to previous image
    prevButton.addEventListener('click', function() {
        if (currentImageIndex > 0) {
            currentImageIndex--;
        } else {
            currentImageIndex = imagesArray.length - 1;
        }
        loadImageAtIndex();
    });
    
    // Navigate to next image
    nextButton.addEventListener('click', function() {
        if (currentImageIndex < imagesArray.length - 1) {
            currentImageIndex++;
        } else {
            currentImageIndex = 0;
        }
        loadImageAtIndex();
    });
    
    // Update image transform
    function updateImageTransform() {
        imageDisplay.style.transform = `scale(${currentZoom}) rotate(${currentRotation}deg)`;
    }
    
    // Load image at current index
    function loadImageAtIndex() {
        if (imagesArray[currentImageIndex]) {
            const image = imagesArray[currentImageIndex];
            
            // Clear any previous errors
            Array.from(imageContainer.querySelectorAll('.error-message')).forEach(el => el.remove());
            
            // Store current transform transition
            const originalTransition = imageDisplay.style.transition;
            
            // Remove transition to prevent animation during image switch
            imageDisplay.style.transition = 'none';
            
            // Hide image completely while loading
            imageDisplay.style.opacity = "0";
            
            // Load the new image
            imageDisplay.src = image.path;
            
            // Process after image loads
            imageDisplay.onload = function() {
                // Reset view settings immediately without animation
                currentZoom = 0.825;
                currentRotation = 0;
                
                // Apply transform instantly while image is still hidden
                imageDisplay.style.transform = `scale(${currentZoom}) rotate(0deg)`;
                
                // Use a small delay to ensure browser has processed the transform
                setTimeout(() => {
                    // Restore transition for future transforms
                    imageDisplay.style.transition = originalTransition;
                    
                    // Now fade the image in
                    imageDisplay.style.opacity = "1";
                    
                    // Update info
                    imageName = image.name;
                    imageInfo.textContent = imageName;
                    zoomLevel.textContent = '100%';
                    
                    // Never resize when navigating between images
                    notifyParentAboutImage(false);
                }, 50);
            };
            
            // Update navigation buttons
            updateNavigationButtons();
        }
    }
    
    /**
     * Notify parent about new image without requesting resize
     * @param {boolean} allowResize - Whether to allow resize (false for navigation)
     */
    function notifyParentAboutImage(allowResize = true) {
        const imgWidth = imageDisplay.naturalWidth;
        const imgHeight = imageDisplay.naturalHeight;
        
        window.parent.postMessage({
            type: 'image-changed',
            imageName: imageName,
            imgWidth: imgWidth,
            imgHeight: imgHeight,
            preserveMaximized: true,
            allowResize: allowResize
        }, '*');
    }
    
    // Window size optimization - placeholder function referenced in handleImageLoaded
    function optimizeWindowSize() {
        // Notify parent about image without specific sizing instructions
        notifyParentAboutImage(true);
    }
});
