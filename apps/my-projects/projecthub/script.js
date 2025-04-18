const menuBtn = document.querySelector('.menu-btn');
const mainMenu = document.querySelector('.main-menu');

// Menu button listener
menuBtn.addEventListener('click', () => {
  mainMenu.classList.toggle('show');
});

// --- End Theme Toggle ---

// --- Removed Event Listener for Home Card Links ---

// --- Removed Event Listeners for Nav Links ---

// --- Removed Event Listener for Logo Link ---

// --- Placeholder Data for Lightboxes ---
const lightboxData = {
  "video-tab": {
    title: "Project Details: Video Content",
    description: "Placeholder description for the video project section.",
    tools: ["Video Editing", "HTML", "CSS"],
    images: ["images/p1i1.webp", "images/placeholder.webp"], // Example placeholder
    overview: "Overview text specific to the video content.",
    features: [
      { title: "Feature 1", text: "Video feature description 1." },
      { title: "Feature 2", text: "Video feature description 2." }
    ],
    challenges: "Technical challenges related to video processing or display."
  },
  "images-tab": {
    title: "Project Details: Image Gallery",
    description: "Placeholder description for the image gallery section.",
    tools: ["Image Editing", "HTML", "CSS", "JavaScript"],
    images: ["images/p1i2.webp", "images/placeholder.webp"],
    overview: "Overview text specific to the image gallery.",
    features: [
      { title: "Gallery View", text: "Image gallery feature 1." },
      { title: "Zoom/Pan", text: "Image gallery feature 2." }
    ],
    challenges: "Challenges related to image loading and display performance."
  },
  "code-tab": {
    title: "Project Details: Code Repositories",
    description: "Placeholder description for the code repositories section.",
    tools: ["Git", "GitHub", "JavaScript", "Node.js"],
    images: ["images/p1i3.webp", "images/placeholder.webp"],
    overview: "Overview text specific to the code repositories.",
    features: [
      { title: "Code Highlighting", text: "Code repo feature 1." },
      { title: "Version Control", text: "Code repo feature 2." }
    ],
    challenges: "Challenges related to code integration and deployment."
  },
  "showcase": { // Added entry for original showcase button
    title: "Project Details: Retro OS Portfolio",
    description: "A concise summary of the project, highlighting its core concept and purpose. Built as an interactive simulation within a larger portfolio.",
    tools: ["HTML", "CSS", "JavaScript", "VS Code", "Git"],
    images: ["images/p1i1.webp", "images/p1i2.webp", "images/p1i3.webp", "images/p1i4.webp"],
    overview: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    features: [
      { title: "Interactive Simulation", text: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur." },
      { title: "Modern Tech Stack", text: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Built with HTML, CSS, and vanilla JavaScript." },
      { title: "Responsive Design", text: "Though designed for a desktop view, layout adjusts reasonably for different iframe sizes within the simulation." },
      { title: "Tabbed Browsing Integration", text: "Leverages \`postMessage\` to communicate with the parent 'Projects' app for tab management." }
    ],
    challenges: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit."
  }
};

// --- Lightbox Functionality ---
const showcaseViewDetailsButton = document.querySelector('.showcase .btn'); 
const cardButtons = document.querySelectorAll('.home-cards a.btn');
const mainContainer = document.getElementById('main-content-container');
const lightboxElement = document.getElementById('project-lightbox');
let lightboxCloseButton = null; 

function populateLightbox(projectId) {
  const data = lightboxData[projectId];
  if (!data || !lightboxElement) {
    return;
  }

  // Populate basic fields
  lightboxElement.querySelector('h2').textContent = data.title;
  lightboxElement.querySelector('.lightbox-description').textContent = data.description;

  // Populate tools
  const toolsContainer = lightboxElement.querySelector('.lightbox-tools');
  toolsContainer.innerHTML = '<strong>Tools Used:</strong>'; // Clear previous
  data.tools.forEach((tool, index) => {
    const span = document.createElement('span');
    span.textContent = tool;
    toolsContainer.appendChild(span);
    if (index < data.tools.length - 1) {
      toolsContainer.appendChild(document.createTextNode(' | '));
    }
  });

  // Populate images
  const imageRow = lightboxElement.querySelector('.lightbox-image-row');
  imageRow.innerHTML = ''; // Clear previous
  data.images.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = data.title + ' Image'; // Generic alt text
    img.className = 'lightbox-row-image';
    imageRow.appendChild(img);
  });

  // Populate text content
  const textContent = lightboxElement.querySelector('.lightbox-text-content');
  const featuresList = data.features.map(f => `<li><strong>${f.title}:</strong> ${f.text}</li>`).join('');
  textContent.innerHTML = `
    <h3>Overview</h3>
    <p>${data.overview}</p>
    <h3>Key Features</h3>
    <ul>${featuresList}</ul>
    <h3>Technical Challenges</h3>
    <p>${data.challenges}</p>
  `;
}

function setupLightboxListeners() {
  if (!lightboxElement) return;
  
  lightboxCloseButton = lightboxElement.querySelector('.lightbox-close');
  if (lightboxCloseButton) {
    lightboxCloseButton.addEventListener('click', closeInFlowLightbox);
  }
}

function openInFlowLightbox(projectId) { 
  populateLightbox(projectId);
  if (mainContainer && lightboxElement) {
    mainContainer.classList.add('lightbox-active');
    lightboxElement.style.display = 'block'; // Make sure it's visible
  }
}

function closeInFlowLightbox() {
  if (mainContainer && lightboxElement) {
    mainContainer.classList.remove('lightbox-active');
    lightboxElement.style.display = 'none'; // Hide it again
  }
}

// Attach listener to Showcase button
if (showcaseViewDetailsButton) {
  showcaseViewDetailsButton.addEventListener('click', (e) => {
    e.preventDefault();
    openInFlowLightbox('showcase'); // Use a specific ID for the showcase
  });
}

// Attach listeners to Card buttons
cardButtons.forEach(button => {
  const targetProjectId = button.dataset.projectTarget;
  if (targetProjectId) {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      openInFlowLightbox(targetProjectId);
    });
  }
});

setupLightboxListeners();