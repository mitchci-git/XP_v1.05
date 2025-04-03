/**
 * Windows XP Simulation - Program Data Module
 * Provides centralized configuration for all program window data
 */

/**
 * Program configuration for all available applications in the Windows XP simulation
 */
const programData = {
    "my-computer": {
        id: "my-computer-window",
        title: "My Computer",
        icon: "./assets/icons/desktop/my-computer.png",
        template: "my-computer",
        dimensions: {
            width: 600,
            height: 400
        },
        position: "cascade" // Default positioning method
    },
    "my-documents": {
        id: "my-documents-window",
        title: "My Documents",
        icon: "./assets/icons/desktop/my-documents.png",
        template: "folder-view",
        dimensions: {
            width: 600,
            height: 400
        }
    },
    "recycle-bin": {
        id: "recycle-bin-window",
        title: "Recycle Bin",
        icon: "./assets/icons/desktop/recycle-bin.png",
        template: "folder-view",
        dimensions: {
            width: 600,
            height: 400
        }
    },
    "internet-explorer": {
        id: "internet-explorer-window",
        title: "Internet Explorer",
        icon: "./assets/icons/desktop/internet-explorer.png",
        template: "browser",
        dimensions: {
            width: 800,
            height: 600
        }
    },
    "email": {
        id: "email-window",
        title: "New Message - Outlook Express",
        icon: "./assets/icons/desktop/email.png",
        template: "email",
        dimensions: {
            width: 650,
            height: 500
        }
    },
    "messenger": {
        id: "messenger-window",
        title: "Windows Messenger",
        icon: "./assets/icons/desktop/messenger.png",
        template: "messenger",
        dimensions: {
            width: 550,
            height: 453
        },
        position: "bottom-right", // Explicitly set bottom-right positioning
        margin: {
            right: 20,  // Right margin for consistent spacing
            bottom: 20  // Equal spacing from bottom (taskbar will be added in calculation)
        }
    },
    "my-pictures": {
        id: "my-pictures-window",
        title: "My Pictures",
        icon: "./assets/icons/desktop/my-pictures.png",
        template: "folder-view",
        dimensions: {
            width: 600,
            height: 400
        }
    },
    "image-viewer": {
        id: "image-viewer-window",
        title: "Windows Photo Viewer",
        icon: "./assets/icons/windows/image-viewer.png",
        template: "image-viewer",
        centerWindow: true
    },
    "music-player": {
        id: "music-player-window",
        title: "Windows Media Player",
        icon: "./assets/icons/desktop/music-player.png",
        template: "music-player",
        dimensions: {
            width: 348, // 50% of 697px
            height: 186  // 50% of 372px
        },
        position: "top-right", // Explicitly set top-right positioning
        margin: {
            top: 20,    // Equal spacing from top as Messenger has from bottom
            right: 20   // Consistent right margin
        }
    }
};

export default programData;
