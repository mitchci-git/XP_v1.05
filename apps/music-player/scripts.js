const albumArt = [
  "../../assets/apps/music-player/images/cover1.jpg", 
  "../../assets/apps/music-player/images/cover2.jpg", 
  "../../assets/apps/music-player/images/cover3.jpg"
];

// Fallback images in case the primary ones don't load
const fallbackAlbumArt = [
  "../../assets/apps/music-player/images/cover.1jpg", 
  "../../assets/apps/music-player/images/cover.2jpg",
  "../../assets/apps/music-player/images/cover.3jpg"
];

const songInfo = [ 
  {"band": "The Gorillaz", "song": "19-2000 Soulchild Remix"}, 
  {"band": "Bomfunk MC's", "song": "Freestyler"},
  {"band": "Vengaboys", "song": "Skinnydippin'"}
];

// Cache DOM elements and event targets
const play = document.querySelector('.play-btn');
const back = document.querySelector('.skip-left');
const forward = document.querySelector('.skip-right');
const volUp = document.querySelector('.vol-up');
const volDown = document.querySelector('.vol-down');
const controlBtn = document.querySelector('.btn-overlay');
const audioPlayer = document.querySelectorAll('audio'); 
let artwork = document.querySelector('.album-artwork');
let songTitle = document.querySelector('#song-title');
let artist = document.querySelector('#artist-name');

let songPlaying = 0;
let playingAudio = null; // Track currently playing audio element
let currentVolume = 0.1; // Store current volume level

// Initialize volume for all audio players
audioPlayer.forEach(player => {
  player.volume = currentVolume;
});

setSongImg();

function setSongImg() {
  if (!artwork) return;
  
  const img = new Image();
  img.onload = function() {
    artwork.style.backgroundImage = `url(${albumArt[songPlaying]})`;
    updateTextInfo();
  };
  
  img.onerror = loadFallbackImage;
  img.src = albumArt[songPlaying];
}

function loadFallbackImage() {
  const fallbackImg = new Image();
  
  fallbackImg.onload = function() {
    if (artwork) {
      artwork.style.backgroundImage = `url(${fallbackAlbumArt[songPlaying]})`;
    }
    updateTextInfo();
  };
  
  fallbackImg.onerror = function() {
    if (artwork) {
      artwork.style.backgroundImage = 'linear-gradient(45deg, #333, #222)';
    }
    updateTextInfo();
  };
  
  fallbackImg.src = fallbackAlbumArt[songPlaying];
}

function updateTextInfo() {
  if (songTitle && artist) {
    songTitle.innerText = songInfo[songPlaying].song;
    artist.innerText = songInfo[songPlaying].band;
  }
}

// Player control event handlers
play.addEventListener('click', () => {
  toggleAudio(songPlaying);
});

play.addEventListener("mousedown", () => play.classList.add('pressed'));
play.addEventListener("mouseup", () => play.classList.remove('pressed'));

back.addEventListener('click', () => {
  songPlaying = songPlaying !== 0 ? songPlaying - 1 : 2;
  audioPlayer[songPlaying].volume = currentVolume; // Use stored volume
  toggleAudio(songPlaying);
  setSongImg();
});

back.addEventListener('mousedown', () => controlBtn.classList.add('left'));
back.addEventListener('mouseup', () => controlBtn.classList.remove('left'));

forward.addEventListener('click', () => {
  songPlaying = songPlaying !== 2 ? songPlaying + 1 : 0;
  audioPlayer[songPlaying].volume = currentVolume; // Use stored volume
  setSongImg();
  toggleAudio(songPlaying);
});

forward.addEventListener('mousedown', () => controlBtn.classList.add('right'));
forward.addEventListener('mouseup', () => controlBtn.classList.remove('right'));

volUp.addEventListener('click', () => {
  if (currentVolume < 1) {
    currentVolume = Math.min(1, currentVolume + 0.1);
    audioPlayer[songPlaying].volume = currentVolume;
  }
});

volUp.addEventListener('mousedown', () => controlBtn.classList.add('up'));
volUp.addEventListener('mouseup', () => controlBtn.classList.remove('up'));

volDown.addEventListener('click', () => {
  if (currentVolume > 0.1) {
    currentVolume = Math.max(0, currentVolume - 0.1);
    audioPlayer[songPlaying].volume = currentVolume;
  }
});

volDown.addEventListener('mousedown', () => controlBtn.classList.add('down'));
volDown.addEventListener('mouseup', () => controlBtn.classList.remove('down'));

function toggleAudio(idx) {
  if (playingAudio !== null && playingAudio !== audioPlayer[idx]) {
    playingAudio.pause();
  }

  // Make sure the audio has the current volume before playing
  audioPlayer[idx].volume = currentVolume;

  if (audioPlayer[idx].paused) {
    audioPlayer[idx].play();
    playingAudio = audioPlayer[idx];
  } else {
    audioPlayer[idx].pause();
    playingAudio = null;
  }
}

// Tooltip functionality with optimized DOM manipulation
function setupTooltips() {
  const elements = document.querySelectorAll('[data-tooltip]');
  let activeTooltip = null;
  
  elements.forEach(element => {
    if (element.id === 'close-player') return;
    
    element.addEventListener('mouseenter', () => {
      const tooltipText = element.getAttribute('data-tooltip');
      if (!tooltipText) return;
      
      if (activeTooltip) {
        activeTooltip.remove();
      }
      
      const tooltip = document.createElement('div');
      tooltip.className = 'music-player-tooltip';
      tooltip.textContent = tooltipText;
      document.body.appendChild(tooltip);
      activeTooltip = tooltip;
      
      const elemRect = element.getBoundingClientRect();
      tooltip.style.left = (elemRect.left + (elemRect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
      tooltip.style.top = (elemRect.top - tooltip.offsetHeight - 10) + 'px';
      
      setTimeout(() => tooltip.style.opacity = '1', 50);
    });
    
    element.addEventListener('mouseleave', () => {
      if (activeTooltip) {
        activeTooltip.style.opacity = '0';
        setTimeout(() => {
          if (activeTooltip) {
            activeTooltip.remove();
            activeTooltip = null;
          }
        }, 200);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', setupTooltips);

// Optimize close button functionality
const closeBtn = document.getElementById('close-player');
if (closeBtn) { 
  closeBtn.addEventListener('click', function() {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ action: 'closeMediaPlayer' }, '*');
      } else {
        const musicPlayer = document.querySelector('.music-player');
        if (musicPlayer) {
          musicPlayer.style.display = 'none';
        }
      }
      
      if (playingAudio) {
        playingAudio.pause();
        playingAudio = null;
      }
    } catch (err) {
      console.error("Error in close button handler:", err);
    }
  });
}
