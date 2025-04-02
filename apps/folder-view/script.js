document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const folderTitle = urlParams.get('title') || 'Folder';
    const titleElement = document.getElementById('folder-title');
    const sidebarContainer = document.getElementById('sidebar-container');
    const folderContent = document.getElementById('folder-content');
    
    // Ensure these elements exist before proceeding
    if (!titleElement || !sidebarContainer || !folderContent) {
        console.error('Required elements not found in DOM');
        return;
    }
    
    // Selection state
    let selectedItems = new Set();
    
    // Set folder title
    titleElement.textContent = folderTitle;
    
    // Generate sidebar and content HTML based on folder type
    const { sidebarHTML, contentHTML } = generateFolderContent(folderTitle);
    
    // Apply generated HTML
    sidebarContainer.innerHTML = sidebarHTML;
    folderContent.innerHTML = contentHTML;
    
    // Add click events to sidebar links
    document.querySelectorAll('.sidebar-list a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Send message to parent window
            window.parent.postMessage({
                type: 'sidebar-link-clicked',
                text: link.textContent,
                folder: folderTitle
            }, '*');
        });
    });
    
    // Add selection functionality to thumbnail items
    if (folderTitle === "My Pictures") {
        setupThumbnailSelection();
    }
    
    // Listen for window focus changes
    window.addEventListener('message', (event) => {
        if (event.data.type === 'window:focus-changed' || 
            event.data.type === 'window:blur' || 
            event.data.type === 'clear-my-pictures-selection') {
            clearSelection();
        }
    });
    
    // Improve event delegation for better performance
    document.addEventListener('mousedown', (e) => {
        const thumbnail = e.target.closest('.thumbnail-item');
        if (!thumbnail) {
            clearSelection();
        }
    });
});

function generateFolderContent(folderType) {
    let sidebarHTML = '';
    let contentHTML = '';
    
    if (folderType === "Outlook Express") {
        sidebarHTML = `
            <div class="sidebar-title">Mail</div>
            <ul class="sidebar-list">
                <li><a href="#">Inbox</a></li>
                <li><a href="#">Outbox</a></li>
                <li><a href="#">Sent Items</a></li>
                <li><a href="#">Deleted Items</a></li>
                <li><a href="#">Drafts</a></li>
            </ul>
            
            <div class="sidebar-title">Other</div>
            <ul class="sidebar-list">
                <li><a href="#">Contacts</a></li>
                <li><a href="#">Calendar</a></li>
            </ul>
        `;
        
        contentHTML = `<p class="empty-folder">No new messages.</p>`;
    } else if (folderType === "My Pictures") {
        sidebarHTML = `
            <div class="sidebar-title">Picture Tasks</div>
            <ul class="sidebar-list">
                <li><a href="#">View as a slide show</a></li>
                <li><a href="#">Order prints online</a></li>
                <li><a href="#">Print pictures</a></li>
            </ul>
            
            <div class="sidebar-title">File and Folder Tasks</div>
            <ul class="sidebar-list">
                <li><a href="#">Make a new folder</a></li>
                <li><a href="#">Share this folder</a></li>
            </ul>
            
            <div class="sidebar-title">Other Places</div>
            <ul class="sidebar-list">
                <li><a href="#">My Computer</a></li>
                <li><a href="#">My Documents</a></li>
                <li><a href="#">Shared Pictures</a></li>
            </ul>
        `;
        
        contentHTML = `
            <div class="thumbnails-view">
                <div class="thumbnail-item" data-image="image1.jpg">
                    <div class="thumbnail-container">
                        <img src="../../assets/images/full/image1.jpg" alt="Image 1">
                    </div>
                    <span class="filename">image1.jpg</span>
                </div>
                <div class="thumbnail-item" data-image="image2.jpg">
                    <div class="thumbnail-container">
                        <img src="../../assets/images/full/image2.jpg" alt="Image 2">
                    </div>
                    <span class="filename">image2.jpg</span>
                </div>
                <div class="thumbnail-item" data-image="image3.jpg">
                    <div class="thumbnail-container">
                        <img src="../../assets/images/full/image3.jpg" alt="Image 3">
                    </div>
                    <span class="filename">image3.jpg</span>
                </div>
                <div class="thumbnail-item" data-image="image4.jpg">
                    <div class="thumbnail-container">
                        <img src="../../assets/images/full/image4.jpg" alt="Image 4">
                    </div>
                    <span class="filename">image4.jpg</span>
                </div>
            </div>
        `;
    } else {
        sidebarHTML = `
            <div class="sidebar-title">File and Folder Tasks</div>
            <ul class="sidebar-list">
                <li><a href="#">Make a new folder</a></li>
                <li><a href="#">Share this folder</a></li>
            </ul>
            
            <div class="sidebar-title">Other Places</div>
            <ul class="sidebar-list">
                <li><a href="#">My Computer</a></li>
                <li><a href="#">My Documents</a></li>
                <li><a href="#">Shared Documents</a></li>
            </ul>
        `;
        
        contentHTML = `<p class="empty-folder">This folder is empty.</p>`;
    }
    
    return { sidebarHTML, contentHTML };
}

function setupThumbnailSelection() {
    // Set up click and dblclick handlers for thumbnails
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', (e) => {
            // If Ctrl key is pressed, toggle selection without clearing others
            if (e.ctrlKey) {
                toggleItemSelection(thumbnail);
            } else {
                // Clear other selections and select only this item
                clearSelection();
                selectItem(thumbnail);
            }
            e.stopPropagation();
        });
        
        // Double-click to open the image in viewer
        thumbnail.addEventListener('dblclick', () => {
            openImageInViewer(thumbnail);
        });
    });
    
    // Clear selection when clicking on empty space
    document.getElementById('folder-content').addEventListener('click', (e) => {
        if (e.target === document.getElementById('folder-content')) {
            clearSelection();
        }
    });
}

function selectItem(item) {
    item.classList.add('selected');
    selectedItems.add(item);
}

function toggleItemSelection(item) {
    if (item.classList.contains('selected')) {
        item.classList.remove('selected');
        selectedItems.delete(item);
    } else {
        item.classList.add('selected');
        selectedItems.add(item);
    }
}

function clearSelection() {
    document.querySelectorAll('.thumbnail-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
    selectedItems.clear();
}

function openImageInViewer(thumbnail) {
    if (!thumbnail) {
        console.error('Thumbnail element is null or undefined');
        return;
    }
    
    const imageName = thumbnail.getAttribute('data-image');
    if (!imageName) {
        console.error('Image name attribute is missing');
        return;
    }
    
    const thumbnailImg = thumbnail.querySelector('img');
    if (!thumbnailImg) {
        console.error('Thumbnail image element is missing');
        return;
    }
    
    window.parent.postMessage({
        type: 'open-image-viewer',
        imageName: imageName,
        imagePath: thumbnailImg.src,
    }, '*');
    
    clearSelection();
}
