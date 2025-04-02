// ...existing code...

function createMediaPlayerWindow() {
    const mediaPlayerWindow = document.createElement('div');
    mediaPlayerWindow.className = 'window media-player-window';
    mediaPlayerWindow.innerHTML = `
        <div class="window-header">
            <img src="./assets/icons/desktop/music-player.png" alt="Windows Media Player" class="window-icon">
            <span class="window-title">Windows Media Player</span>
            <button class="close-button" title="Close">X</button>
        </div>
        <div class="window-content">
            <!-- Media player content here -->
        </div>
    `;
    
    // Add event listener for the close button
    const closeButton = mediaPlayerWindow.querySelector('.close-button');
    closeButton.addEventListener('click', function() {
        // Close the media player window
        mediaPlayerWindow.remove();
        
        // Additional cleanup if needed
        // ...
    });
    
    return mediaPlayerWindow;
}

// ...existing code...