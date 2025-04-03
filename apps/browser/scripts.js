window.onload = function() {
    // Address bar behavior
    const addressBar = document.querySelector('.address-bar');
    const goButton = document.querySelector('.go-button');
    const backButton = document.querySelector('.browser-back'); // TODO: Implement back/forward navigation properly
    const refreshButton = document.querySelector('.browser-refresh');
    const stopButton = document.querySelector('.browser-stop');
    const homeButton = document.querySelector('.browser-home');
    
    addressBar.addEventListener('focus', function() {
        this.select();
    });
    
    addressBar.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            simulateNavigation(this.value);
        }
    });
    
    goButton.addEventListener('click', function() {
        simulateNavigation(addressBar.value);
    });
    
    // Refresh button behavior
    refreshButton.addEventListener('click', function() {
        updateStatusBar('Refreshing page...');
        simulatePageActivity(800);
    });
    
    // Stop button behavior
    stopButton.addEventListener('click', function() {
        updateStatusBar('Stopped');
    });
    
    // Home button behavior
    homeButton.addEventListener('click', function() {
        addressBar.value = 'http://portfolio.example/home';
        updateStatusBar('Navigating to homepage...');
        simulatePageActivity(1000);
    });
    
    // Read more toggle
    const expandToggle = document.getElementById('expand-toggle');
    const hiddenContent = document.getElementById('hidden-content');
    const expandArrow = document.getElementById('expand-arrow');
    
    if (expandToggle && hiddenContent && expandArrow) {
        expandToggle.addEventListener('click', function() {
            hiddenContent.classList.toggle('expanded');
            expandArrow.classList.toggle('expanded');
            
            const expandText = expandToggle.querySelector('.retro-expand-text');
            if (expandText) {
                expandText.textContent = hiddenContent.classList.contains('expanded') 
                    ? 'Read Less' 
                    : 'Read More';
            }
            
            updateStatusBar('Content ' + (hiddenContent.classList.contains('expanded') ? 'expanded' : 'collapsed'));
        });
    }
    
    // Helper functions
    function updateStatusBar(message) {
        document.querySelector('.status-text').textContent = message;
    }
    
    function simulatePageActivity(delay) {
        // Show loading indicator
        document.body.style.cursor = 'wait';
        
        setTimeout(() => {
            // Reset to normal
            document.body.style.cursor = 'default';
            updateStatusBar('Done');
            
            // Enable back button after navigation
            backButton.disabled = false;
        }, delay);
    }
    
    function simulateNavigation(url) {
        updateStatusBar('Connecting to ' + url + '...');
        simulatePageActivity(1500);
    }
};
