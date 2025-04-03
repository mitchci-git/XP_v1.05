document.addEventListener('DOMContentLoaded', function() {
    // Cache form elements
    const fromField = document.getElementById('from');
    const nameField = document.getElementById('name');
    const subjectField = document.getElementById('subject');
    const messageField = document.getElementById('message-body');
    const sendButton = document.querySelector('.toolbar-button');
    const statusBar = document.querySelector('.status-text');

    // Set up send button
    sendButton.addEventListener('click', function() {
        if (validateForm()) {
            // Simulate sending
            statusBar.textContent = 'Sending message...';
            
            setTimeout(() => {
                // Success state
                statusBar.textContent = 'Message sent successfully!';
                
                // Reset form
                fromField.value = '';
                nameField.value = '';
                subjectField.value = '';
                messageField.value = '';
                
                alert('Thanks for your message! I\'ll get back to you soon.');
            }, 1500);
        }
    });

    // Form validation
    function validateForm() {
        let isValid = true;
        let errorMessage = '';

        // Reset field styling
        [fromField, nameField, subjectField, messageField].forEach(field => {
            field.style.borderColor = '';
        });

        // Email validation
        if (!fromField.value || !validateEmail(fromField.value)) {
            fromField.style.borderColor = 'red';
            errorMessage += '• Please enter a valid email address\n';
            isValid = false;
        }

        // Name validation
        if (!nameField.value) {
            nameField.style.borderColor = 'red';
            errorMessage += '• Please enter your name\n';
            isValid = false;
        }

        // Subject validation
        if (!subjectField.value) {
            subjectField.style.borderColor = 'red';
            errorMessage += '• Please enter a subject\n';
            isValid = false;
        }

        // Message validation
        if (!messageField.value || messageField.value.length < 10) {
            messageField.style.borderColor = 'red';
            errorMessage += '• Please enter a message (at least 10 characters)\n';
            isValid = false;
        }

        // Show validation result
        if (!isValid) {
            statusBar.textContent = 'Please complete all required fields';
            alert('Please correct the following errors:\n\n' + errorMessage);
        } else {
            statusBar.textContent = 'Form is valid, ready to send';
        }

        return isValid;
    }

    // Email validation helper
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Text formatting buttons
    const boldButton = document.querySelector('.format-button.bold');
    const italicButton = document.querySelector('.format-button.italic');
    const underlineButton = document.querySelector('.format-button.underline');

    boldButton.addEventListener('click', () => {
        document.execCommand('bold', false, null);
        messageField.focus();
    });

    italicButton.addEventListener('click', () => {
        document.execCommand('italic', false, null);
        messageField.focus();
    });

    underlineButton.addEventListener('click', () => {
        document.execCommand('underline', false, null);
        messageField.focus();
    });

    // Status bar updates
    messageField.addEventListener('focus', () => {
        statusBar.textContent = 'Editing message...';
    });

    messageField.addEventListener('blur', () => {
        statusBar.textContent = 'Ready to send';
    });

    // Communication with parent window
    setupIframeActivation();
    
    // Focus on the name field
    nameField.focus();
    
    // Helper function to set up iframe activation
    function setupIframeActivation() {
        if (window.parent && window.parent !== window) {
            // Get parent window ID from URL if available
            const urlParams = new URLSearchParams(window.location.search);
            const windowId = urlParams.get('windowId');
            
            // Add click handler to activate parent window
            document.addEventListener('mousedown', () => {
                window.parent.postMessage({
                    type: 'iframe-clicked',
                    windowId: windowId || 'email-window',
                    timestamp: Date.now()
                }, '*');
            });
        }
    }
});
