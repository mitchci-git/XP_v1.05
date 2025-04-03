document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const folderTitle = urlParams.get('title') || 'Folder';
    const titleElement = document.getElementById('folder-title');
    const sidebarContainer = document.getElementById('sidebar-container');
    const folderContent = document.getElementById('folder-content');
    const folderType = document.getElementById('folder-type');
    
    // Ensure these elements exist before proceeding
    if (!titleElement || !sidebarContainer || !folderContent) {
        console.error('Required elements not found in DOM');
        return;
    }
    
    // Selection state
    let selectedItems = new Set();
    
    // Set folder title
    titleElement.textContent = folderTitle;
    if (folderType) folderType.textContent = folderTitle;
    
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
                text: link.textContent.trim(),
                folder: folderTitle,
                action: link.getAttribute('data-action') || 'navigate'
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
        if (!thumbnail && e.target.closest('#folder-content')) {
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
                <li><a href="#" data-action="inbox">
                    <img src="../../assets/icons/windows/mail.png" alt="Inbox"> Inbox
                </a></li>
                <li><a href="#" data-action="outbox">
                    <img src="../../assets/icons/windows/outbox.png" alt="Outbox"> Outbox
                </a></li>
                <li><a href="#" data-action="sent">
                    <img src="../../assets/icons/windows/sent.png" alt="Sent"> Sent Items
                </a></li>
            </ul>
            
            <div class="sidebar-title">Other</div>
            <ul class="sidebar-list">
                <li><a href="#" data-action="contacts">
                    <img src="../../assets/icons/windows/contacts.png" alt="Contacts"> Contacts
                </a></li>
            </ul>
        `;
        
        contentHTML = `<p class="empty-folder">No new messages.</p>`;
    } else if (folderType === "My Pictures") {
        sidebarHTML = `
            <div class="sidebar-title">Picture Tasks</div>
            <ul class="sidebar-list">
                <li><a href="#">
                    <img src="../../assets/icons/windows/slideshow.png" alt="Slideshow"> View as a slide show
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/print.png" alt="Prints"> Order prints online
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/printer.png" alt="Print"> Print pictures
                </a></li>
            </ul>
            
            <div class="sidebar-title">File and Folder Tasks</div>
            <ul class="sidebar-list">
                <li><a href="#">
                    <img src="../../assets/icons/windows/folder-new.png" alt="New Folder"> Make a new folder
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/share.png" alt="Share"> Share this folder
                </a></li>
            </ul>
            
            <div class="sidebar-title">Other Places</div>
            <ul class="sidebar-list">
                <li><a href="#">
                    <img src="../../assets/icons/windows/my-computer-16.png" alt="Computer"> My Computer
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/my-documents-16.png" alt="Documents"> My Documents
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/folder-16.png" alt="Shared"> Shared Pictures
                </a></li>
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
    } else if (folderType === "My Documents") {
        sidebarHTML = `
            <div class="sidebar-title">Document Tasks</div>
            <ul class="sidebar-list">
                <li><a href="#">
                    <img src="../../assets/icons/windows/document.png" alt="Document"> Create new document
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/folder-16.png" alt="Settings"> Document settings
                </a></li>
            </ul>
            
            <div class="sidebar-title">File and Folder Tasks</div>
            <ul class="sidebar-list">
                <li><a href="#">
                    <img src="../../assets/icons/windows/folder-new.png" alt="New Folder"> Make a new folder
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/share.png" alt="Share"> Share this folder
                </a></li>
            </ul>
            
            <div class="sidebar-title">Other Places</div>
            <ul class="sidebar-list">
                <li><a href="#">
                    <img src="../../assets/icons/windows/my-computer-16.png" alt="Computer"> My Computer
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/my-pictures-16.png" alt="Pictures"> My Pictures
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/folder-16.png" alt="Shared"> Shared Documents
                </a></li>
            </ul>
        `;
        
        contentHTML = `<p class="empty-folder">This folder is empty.</p>`;
    } else {
        sidebarHTML = `
            <div class="sidebar-title">File and Folder Tasks</div>
            <ul class="sidebar-list">
                <li><a href="#">
                    <img src="../../assets/icons/windows/folder-new.png" alt="New Folder"> Make a new folder
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/share.png" alt="Share"> Share this folder
                </a></li>
            </ul>
            
            <div class="sidebar-title">Other Places</div>
            <ul class="sidebar-list">
                <li><a href="#">
                    <img src="../../assets/icons/windows/my-computer-16.png" alt="Computer"> My Computer
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/my-documents-16.png" alt="Documents"> My Documents
                </a></li>
                <li><a href="#">
                    <img src="../../assets/icons/windows/folder-16.png" alt="Shared"> Shared Documents
                </a></li>
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
    
    // The redundant click event listener has been removed as it's already handled by
    // the document mousedown event listener for better performance
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
