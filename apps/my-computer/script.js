document.addEventListener('DOMContentLoaded', () => {
    // Get folder items
    const folderItems = document.querySelectorAll('.folder-item');
    
    // Add click events to folder items
    folderItems.forEach(item => {
        item.addEventListener('click', () => {
            // Simulate selection
            folderItems.forEach(fi => fi.classList.remove('selected'));
            item.classList.add('selected');
        });
        
        item.addEventListener('dblclick', () => {
            // Get item name
            const name = item.querySelector('span').textContent;
            
            // Send message to parent window for handling
            window.parent.postMessage({
                type: 'folder-item-clicked',
                name: name
            }, '*');
        });
    });
    
    // Handle title parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get('title');
    
    if (title) {
        // Update window title if specified
        document.querySelector('.address-text').textContent = title;
    }
    
    // Prevent layout shifts by intercepting all link clicks
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Instead of following the link, just send a message to parent
            window.parent.postMessage({
                type: 'sidebar-link-clicked',
                text: link.textContent,
                href: link.getAttribute('href') || '#'
            }, '*');
            
            return false;
        });
    });
    
    // Prevent scrolling from affecting parent
    document.addEventListener('scroll', (e) => {
        e.stopPropagation();
    });
    
    // Set fixed heights to prevent content reflow
    const sidebarElement = document.querySelector('.sidebar');
    if (sidebarElement) {
        sidebarElement.style.height = '100%';
        sidebarElement.style.overflowY = 'auto';
    }
    
    // Reset scroll position when window gains focus
    window.addEventListener('focus', () => {
        if (window.parent && window.parent !== window) {
            window.parent.scrollTo(0, 0);
        }
    });
});
