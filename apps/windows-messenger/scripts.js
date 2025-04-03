document.addEventListener('DOMContentLoaded', function() {
    // Complete the chat window HTML structure 
    const infoDiv = document.getElementById('info');
    const textDiv = document.createElement('div');
    textDiv.id = 'text';
    
    const nameSpan = document.createElement('span');
    nameSpan.id = 'name';
    nameSpan.textContent = 'MitchBot';
    
    const messageSpan = document.createElement('span');
    messageSpan.id = 'message';
    messageSpan.textContent = 'Personal Assistant <mitch@gmail.com>';
    
    textDiv.appendChild(nameSpan);
    textDiv.appendChild(messageSpan);
    infoDiv.appendChild(textDiv);
    
    // Add the navigation buttons
    const leftNav = document.querySelector('.chatnav#left');
    const rightNav = document.querySelector('.chatnav#right');
    
    // Left nav buttons
    const leftButtons = [
        'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/1441.png',
        'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/1444.png',
        'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/1447.png',
        'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/1442.png',
        'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/1443.png',
        'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/326.png'
    ];
    
    leftButtons.forEach(url => {
        const button = document.createElement('button');
        button.className = 'aerobutton chataction';
        button.style.background = `url(${url}) no-repeat center`;
        leftNav.appendChild(button);
    });
    
    // Right nav buttons
    // Note: Removed expandBtn and closeBtn as they have no event listeners or functionality
    
    // Add receive div without alert
    const messagesDiv = document.getElementById('messages');
    const displayTextarea = document.getElementById('display');
    
    // Create a rich text display area to replace the textarea
    const richDisplay = document.createElement('div');
    richDisplay.id = 'rich-display';
    richDisplay.style.width = '100%';
    richDisplay.style.height = '100%';
    richDisplay.style.overflow = 'auto';
    richDisplay.style.padding = '8px';
    richDisplay.style.boxSizing = 'border-box';
    richDisplay.style.fontFamily = 'Segoe UI, Tahoma, sans-serif';
    richDisplay.style.fontSize = '15px';
    richDisplay.style.lineHeight = '1.4';
    richDisplay.style.backgroundColor = 'white';
    richDisplay.style.border = 'thin solid #BED6E0';
    richDisplay.style.position = 'relative';
    
    // Create a positioned messages container that sits at the bottom
    const messagesContainer = document.createElement('div');
    messagesContainer.id = 'messages-container';
    messagesContainer.style.position = 'absolute';
    messagesContainer.style.bottom = '0';
    messagesContainer.style.left = '0';
    messagesContainer.style.width = '100%';
    messagesContainer.style.padding = '0 8px 8px 8px';
    
    richDisplay.appendChild(messagesContainer);
    
    // Replace the textarea with our rich display
    if (displayTextarea.parentNode) {
        displayTextarea.parentNode.replaceChild(richDisplay, displayTextarea);
    }
    
    const receiveDiv = document.createElement('div');
    receiveDiv.id = 'recieve';
    
    // Adjust to use our new rich display
    messagesDiv.insertBefore(receiveDiv, richDisplay);
    receiveDiv.appendChild(richDisplay);
    
    // Add handle div
    const handleDiv = document.createElement('div');
    handleDiv.id = 'handle';
    messagesDiv.insertBefore(handleDiv, document.getElementById('send'));
    
    // Add toolbar options
    const optionsUl = document.getElementById('options');
    
    // First button
    const fontButton = document.createElement('button');
    fontButton.className = 'aerobutton textoption smallarrowbtn';
    
    const fontImg = document.createElement('img');
    fontImg.src = 'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/412.png';
    
    const fontArrow = document.createElement('img');
    fontArrow.className = 'arrowdown';
    fontArrow.src = 'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/general/small_arrow.svg';
    
    fontButton.appendChild(fontImg);
    fontButton.appendChild(fontArrow);
    optionsUl.appendChild(fontButton);
    
    // Second button
    const colorButton = document.createElement('button');
    colorButton.className = 'aerobutton textoption smallarrowbtn';
    
    const colorImg = document.createElement('img');
    colorImg.src = 'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/1487.png';
    
    const colorArrow = document.createElement('img');
    colorArrow.className = 'arrowdown';
    colorArrow.src = 'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/general/small_arrow.svg';
    
    colorButton.appendChild(colorImg);
    colorButton.appendChild(colorArrow);
    optionsUl.appendChild(colorButton);
    
    // Other buttons
    const otherButtons = [
        {url: 'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/414.png', className: 'aerobutton textoption noarrow'},
        {url: 'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/992.png', className: 'aerobutton textoption noarrow'},
        {url: 'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/20204.png', className: 'textoption', noBorder: true}
    ];
    
    otherButtons.forEach(btn => {
        const button = document.createElement('button');
        button.className = btn.className;
        button.style.background = `url(${btn.url}) no-repeat center`;
        if (btn.noBorder) {
            button.style.border = 'none';
        }
        optionsUl.appendChild(button);
    });
    
    // Add editor tabs
    const bottomTabs = document.getElementById('bottomtabs');
    const firstDiv = document.createElement('div');
    
    const selectedTab = document.createElement('button');
    selectedTab.className = 'editortab selected';
    
    const selectedImg = document.createElement('img');
    selectedImg.src = 'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/963.png';
    selectedTab.appendChild(selectedImg);
    
    const unselectedTab = document.createElement('button');
    unselectedTab.className = 'editortab unselected';
    
    const unselectedImg = document.createElement('img');
    unselectedImg.src = 'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/961.png';
    unselectedTab.appendChild(unselectedImg);
    
    firstDiv.appendChild(selectedTab);
    firstDiv.appendChild(unselectedTab);
    
    // Insert before the existing div with send button
    bottomTabs.insertBefore(firstDiv, bottomTabs.firstChild);
    
    // Add avatars
    const avatarsDiv = document.getElementById('avatars');
    
    // Top avatar
    const topAvatarDiv = document.createElement('div');
    topAvatarDiv.id = 'topavatar';
    
    const topAvatarImg = document.createElement('img');
    topAvatarImg.className = 'avatar';
    topAvatarImg.src = '../../assets/apps/windows-messenger/avatar1.png';
    
    const topFrameImg = document.createElement('img');
    topFrameImg.className = 'frame';
    topFrameImg.src = 'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/background/frame_96.png';
    
    const topNavDiv = document.createElement('div');
    topNavDiv.className = 'avatarnav';
    
    const topNavButton1 = document.createElement('button');
    topNavButton1.className = 'aerobutton avataraction';
    topNavButton1.style.background = 'url(https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/268.png) no-repeat center';
    
    const topNavButton2 = document.createElement('button');
    topNavButton2.className = 'aerobutton avataraction';
    topNavButton2.style.background = 'url(https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/1457.png) no-repeat center';
    topNavButton2.style.float = 'right';
    
    topNavDiv.appendChild(topNavButton1);
    topNavDiv.appendChild(topNavButton2);
    
    topAvatarDiv.appendChild(topAvatarImg);
    topAvatarDiv.appendChild(topFrameImg);
    topAvatarDiv.appendChild(topNavDiv);
    
    // Bottom avatar
    const bottomAvatarDiv = document.createElement('div');
    bottomAvatarDiv.id = 'bottomavatar';
    
    const bottomAvatarImg = document.createElement('img');
    bottomAvatarImg.className = 'avatar';
    bottomAvatarImg.src = '../../assets/apps/windows-messenger/avatar2.png';
    
    const bottomFrameImg = document.createElement('img');
    bottomFrameImg.className = 'frame';
    bottomFrameImg.src = 'https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/background/frame_96.png';
    
    const bottomNavDiv = document.createElement('div');
    bottomNavDiv.className = 'avatarnav';
    
    const bottomNavButton = document.createElement('button');
    bottomNavButton.className = 'aerobutton avataraction';
    bottomNavButton.style.background = 'url(https://raw.githubusercontent.com/AndroidWG/WLMOnline/master/assets/chat-window/1457.png) no-repeat center';
    bottomNavButton.style.float = 'right';
    
    bottomNavDiv.appendChild(bottomNavButton);
    
    bottomAvatarDiv.appendChild(bottomAvatarImg);
    bottomAvatarDiv.appendChild(bottomFrameImg);
    bottomAvatarDiv.appendChild(bottomNavDiv);
    
    avatarsDiv.appendChild(topAvatarDiv);
    avatarsDiv.appendChild(bottomAvatarDiv);
    
    // Add expand button
    const expandDiv = document.getElementById('expand');
    const expandButton = document.createElement('button');
    expandButton.className = 'expandbutton';
    expandDiv.appendChild(expandButton);
    
    // Enable/disable send button based on textarea content
    const writeArea = document.getElementById('write');
    const sendButton = document.getElementById('sendbutton');
    const searchButton = document.getElementById('search');
    
    // Function to display a bot message with better formatting
    function displayBotMessage(message, hasHtml = false) {
        const messagesContainer = document.getElementById('messages-container');
        
        const timestamp = new Date().toLocaleTimeString();
        
        // Create message elements with different styling
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-container';
        messageDiv.style.marginBottom = '4px';
        
        // Create a single line for metadata that includes timestamp and name
        const metadataDiv = document.createElement('div');
        metadataDiv.className = 'message-metadata';
        metadataDiv.style.fontSize = '12px';
        metadataDiv.style.color = '#777777';
        metadataDiv.style.marginBottom = '1px';
        
        // Create safe timestamp and name text
        const metaText = document.createTextNode(`[${timestamp}] MitchBot:`);
        metadataDiv.appendChild(metaText);
        
        // Create content element with normal size and color
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.style.fontSize = '15px';
        contentDiv.style.color = '#333333';
        contentDiv.style.fontWeight = '600';
        contentDiv.style.paddingLeft = '0';
        
        // Allow HTML content if specified - but only for known safe content
        if (hasHtml && message.includes('<span style="color: #00cc00;">available</span>')) {
            const parts = message.split(/<span style="color: #00cc00;">|<\/span>/);
            
            const beforeText = document.createTextNode(parts[0]);
            contentDiv.appendChild(beforeText);
            
            // Create the green "available" span
            const availableSpan = document.createElement('span');
            availableSpan.style.color = '#00cc00';
            availableSpan.textContent = 'available';
            contentDiv.appendChild(availableSpan);
            
            if (parts[2]) {
                const afterText = document.createTextNode(parts[2]);
                contentDiv.appendChild(afterText);
            }
        } else {
            contentDiv.textContent = message;
        }
        
        // Add elements to message container
        messageDiv.appendChild(metadataDiv);
        messageDiv.appendChild(contentDiv);
        
        // Add message to display
        messagesContainer.appendChild(messageDiv);
        
        // Auto-scroll to the latest message
        const richDisplay = document.getElementById('rich-display');
        if (richDisplay) {
            richDisplay.scrollTop = richDisplay.scrollHeight;
        }
    }
    
    // Schedule automatic messages after page load with standardized timing
    setTimeout(() => {
        // First message
        displayBotMessage("Hey!");
        
        // Second message after 2 seconds (standardized)
        setTimeout(() => {
            displayBotMessage("I'm Mitch, I'm a graphic designer with an interest in sports");
            
            // Third message after 2 seconds (standardized) - kept unchanged
            setTimeout(() => {
                // Use HTML to make "available" green without changing weight
                displayBotMessage('I am currently <span style="color: #00cc00;">available</span> for work', true);
            }, 2000);
        }, 2000);
    }, 2000);
    
    writeArea.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            sendButton.disabled = false;
            searchButton.disabled = false;
        } else {
            sendButton.disabled = true;
            searchButton.disabled = true;
        }
    });
    
    // Handle send button click
    sendButton.addEventListener('click', function() {
        const message = writeArea.value.trim();
        if (message) {
            const messagesContainer = document.getElementById('messages-container');
            
            const timestamp = new Date().toLocaleTimeString();
            
            // Create message elements with different styling
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-container';
            messageDiv.style.marginBottom = '4px';
            
            // Create metadata element with smaller size and lighter color
            const metadataDiv = document.createElement('div');
            metadataDiv.className = 'message-metadata';
            metadataDiv.style.fontSize = '12px';
            metadataDiv.style.color = '#777777';
            metadataDiv.style.marginBottom = '1px';
            metadataDiv.innerHTML = `[${timestamp}] Guest:`;
            
            // Create content element with normal size and color
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.style.fontSize = '15px';
            contentDiv.style.color = '#333333';
            contentDiv.style.fontWeight = '600'; // Increased font weight
            contentDiv.style.paddingLeft = '0'; // Remove left padding
            contentDiv.textContent = message;
            
            // Add elements to message container
            messageDiv.appendChild(metadataDiv);
            messageDiv.appendChild(contentDiv);
            
            // Add message to display
            messagesContainer.appendChild(messageDiv);
            
            writeArea.value = '';
            sendButton.disabled = true;
            searchButton.disabled = true;
            
            // Keep scroll at bottom
            const richDisplay = document.getElementById('rich-display');
            if (richDisplay) {
                richDisplay.scrollTop = richDisplay.scrollHeight;
            }
        }
    });
    
    // Handle Enter key in textarea
    writeArea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && !sendButton.disabled) {
            e.preventDefault();
            sendButton.click();
        }
    });
});