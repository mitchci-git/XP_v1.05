document.addEventListener('DOMContentLoaded', function() {
  // Track navigation and project state
  const state = {
    currentProject: null,
    history: {
      back: [],
      forward: [],
      current: 'portfolio-home'
    }
  };
  
  // DOM Elements
  const projectNavItems = document.querySelectorAll('.project-nav-item');
  const projectContents = document.querySelectorAll('.project-content');
  const backBtn = document.querySelector('.back-btn');
  const forwardBtn = document.querySelector('.forward-btn');
  const statusText = document.querySelector('.status-left .status-text');
  const addressPath = document.querySelector('.address-path');
  
  // Initialize states
  updateNavButtons();
  
  // Select the first project by default (instead of showing welcome screen)
  setTimeout(() => {
    const firstProject = document.querySelector('.project-nav-item');
    if (firstProject) {
      openProject(firstProject.getAttribute('data-project'));
    }
  }, 100);
  
  // Project selection handling
  projectNavItems.forEach(item => {
    item.addEventListener('click', function(e) {
      openProject(this.getAttribute('data-project'));
    });
  });
  
  // Navigation button handlers
  backBtn.addEventListener('click', function() {
    if (state.history.back.length > 0) {
      navigateHistory('back');
    }
  });
  
  forwardBtn.addEventListener('click', function() {
    if (state.history.forward.length > 0) {
      navigateHistory('forward');
    }
  });
  
  // Gallery image click handling
  document.querySelectorAll('.image-gallery img').forEach(img => {
    img.addEventListener('click', function() {
      // Replace main image with clicked thumbnail
      const mainImage = this.closest('.project-images').querySelector('.main-image');
      if (mainImage && !mainImage.classList.contains('video-container')) {
        const mainSrc = mainImage.src;
        mainImage.src = this.src;
        this.src = mainSrc;
      }
    });
  });
  
  // Video play overlay handling
  document.querySelectorAll('.play-overlay').forEach(overlay => {
    overlay.addEventListener('click', function() {
      const videoContainer = this.closest('.video-container');
      const thumbnail = videoContainer.querySelector('.video-thumb');
      
      // Replace thumbnail with embedded video (simulated)
      videoContainer.innerHTML = `
        <div class="video-player">
          <div class="video-controls">
            <div class="play-button">▶</div>
            <div class="progress-bar">
              <div class="progress" style="width: 0%"></div>
            </div>
            <div class="time-display">0:00 / 2:30</div>
          </div>
          <img src="${thumbnail.src}" style="filter:brightness(0.7);" alt="Video Playing">
        </div>
      `;
      
      // Simulate video progress
      simulateVideoProgress(videoContainer);
    });
  });
  
  // Function to select a project (highlight but don't open)
  function selectProject(projectId) {
    // Clear existing selections
    projectNavItems.forEach(item => {
      item.classList.remove('selected');
    });
    
    // Apply selected class to this project
    const selectedItem = document.querySelector(`.project-nav-item[data-project="${projectId}"]`);
    if (selectedItem) {
      selectedItem.classList.add('selected');
      state.currentProject = projectId;
      updateStatusBar(projectId);
    }
  }
  
  // Function to open a project and display its content
  function openProject(projectId) {
    // Add to navigation history
    addToHistory(projectId);
    
    // Hide all project content
    hideAllProjects();
    
    // Show the selected project content
    const projectContent = document.getElementById(`project-${projectId}`);
    if (projectContent) {
      projectContent.classList.add('active');
      
      // Update address path
      const projectName = document.querySelector(`.project-nav-item[data-project="${projectId}"]`)
        .querySelector('.project-name').textContent;
      addressPath.textContent = `My Portfolio Projects > ${projectName}`;
      
      // Update status bar
      updateStatusBar(projectId, true);
      
      // Also highlight the project in the sidebar
      selectProject(projectId);
    } else {
      // If project content not found, show first available project
      const fallbackProject = document.querySelector('.project-content');
      if (fallbackProject) {
        const fallbackId = fallbackProject.id.replace('project-', '');
        openProject(fallbackId);
      }
    }
  }
  
  // Function to hide all projects
  function hideAllProjects() {
    projectContents.forEach(content => {
      content.classList.remove('active');
    });
  }
  
  // Function to add item to history
  function addToHistory(projectId) {
    if (state.history.current !== projectId) {
      state.history.back.push(state.history.current);
      state.history.current = projectId;
      state.history.forward = [];
      updateNavButtons();
    }
  }
  
  // Function to navigate history
  function navigateHistory(direction) {
    if (direction === 'back' && state.history.back.length > 0) {
      state.history.forward.push(state.history.current);
      state.history.current = state.history.back.pop();
    } else if (direction === 'forward' && state.history.forward.length > 0) {
      state.history.back.push(state.history.current);
      state.history.current = state.history.forward.pop();
    }
    
    updateNavButtons();
    
    // Open the project from history
    openProject(state.history.current);
  }
  
  // Function to update navigation buttons state
  function updateNavButtons() {
    backBtn.disabled = state.history.back.length === 0;
    forwardBtn.disabled = state.history.forward.length === 0;
  }
  
  // Update status bar text
  function updateStatusBar(item, isOpen = false) {
    if (isOpen) {
      statusText.textContent = `Viewing: ${getProjectName(item)}`;
    } else {
      statusText.textContent = `Selected: ${getProjectName(item)}`;
    }
  }
  
  // Helper function to get project name from ID
  function getProjectName(projectId) {
    const nameMap = {
      'reds-rebrand': 'Reds Rebrand',
      'rugby-website': 'Rugby Website',
      'motion-reel': 'Motion Reel 2024',
      'rwc-social': 'RWC Social Pack'
    };
    
    return nameMap[projectId] || 'Project';
  }
  
  // Function to simulate video playback
  function simulateVideoProgress(container) {
    const progressBar = container.querySelector('.progress');
    let width = 0;
    
    const interval = setInterval(() => {
      width += 1;
      if (progressBar) {
        progressBar.style.width = `${width}%`;
      }
      
      if (width >= 100) {
        clearInterval(interval);
      }
    }, 150); // Simulate ~15 seconds of video
  }
  
  // Communication with parent window
  window.addEventListener('message', function(event) {
    if (event.data.type === 'init-parent-comm') {
      // Respond to initialization
      if (window.parent) {
        window.parent.postMessage({
          type: 'portfolio-ready',
          from: 'portfolio-iframe'
        }, '*');
      }
    }
  });
  
  // Notify parent window about clicks to maintain focus
  document.addEventListener('mousedown', function() {
    if (window.parent) {
      window.parent.postMessage({
        type: 'iframe-clicked',
        windowId: 'my-computer-window'
      }, '*');
    }
  });
});
