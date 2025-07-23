import { contextBridge, ipcRenderer } from 'electron';

console.log('Qobux Preload: Script is loading...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Media control commands from tray
    onMediaCommand: (callback: (command: string) => void) => {
      console.log('Qobux Preload: IPC listener registered');
      ipcRenderer.on('media-command', (event, command) => {
        console.log('Qobux Preload: IPC message received:', command);
        callback(command);
      });
    },

    // Remove listener
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    }
  });
  console.log('Qobux Preload: electronAPI exposed via contextBridge');
} catch (error) {
  console.error('Qobux Preload: contextBridge failed:', error);

  // Fallback: Direct window injection (less secure but works)
  (window as any).electronAPI = {
    onMediaCommand: (callback: (command: string) => void) => {
      console.log('Qobux Preload: Fallback IPC listener registered');
      ipcRenderer.on('media-command', (event, command) => {
        console.log('Qobux Preload: Fallback IPC message received:', command);
        callback(command);
      });
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    }
  };
  console.log('Qobux Preload: electronAPI exposed via fallback window injection');
}

// Set up IPC handler directly in preload (not in injected script)
console.log('Qobux Preload: Setting up direct IPC handler...');

// Direct IPC listener in preload context
ipcRenderer.on('media-command', (event, command) => {
  console.log('Qobux Preload: Direct IPC received:', command);

  // Execute DOM manipulation directly
  setTimeout(() => {
    switch (command) {
      case 'playpause':
        console.log('Qobux Preload: Executing direct play/pause');
        clickPlayButtonDirect();
        break;
      case 'next':
        console.log('Qobux Preload: Executing direct next');
        clickNextButtonDirect();
        break;
      case 'previous':
        console.log('Qobux Preload: Executing direct previous');
        clickPreviousButtonDirect();
        break;
    }
  }, 100); // Small delay to ensure DOM is ready
});

// Direct DOM manipulation functions
function clickPlayButtonDirect() {
  const selectors = [
    // Qobuz-specific selectors (found via debugging)
    '.player__action-pause',
    '.player__action-play',
    '.pct-player-pause',
    '.pct-player-play',
    // Generic fallbacks
    '[data-testid="play-button"]',
    '.play-button',
    '.pf-play-button',
    'button[aria-label*="play"]',
    'button[aria-label*="pause"]',
    '.player-controls button:first-child'
  ];

  console.log('Qobux Direct: Available buttons:', document.querySelectorAll('button').length);

  // Debug: Look for any player-related elements
  const playerElements = document.querySelectorAll('[class*="player"], [class*="Player"], [id*="player"], [id*="Player"]');
  console.log('Qobux Direct: Player elements found:', playerElements.length);
  playerElements.forEach((el, i) => {
    console.log(`Player element ${i}:`, el.className, el.id, el);
  });

  // Debug: Look for play/pause icons
  const playIcons = document.querySelectorAll('[class*="play"], [class*="pause"], .icon-play, .icon-pause');
  console.log('Qobux Direct: Play/pause icons found:', playIcons.length);
  playIcons.forEach((el, i) => {
    console.log(`Play icon ${i}:`, el.className, el.tagName, el);
  });

  for (const selector of selectors) {
    const button = document.querySelector(selector);
    console.log('Qobux Direct: Trying selector:', selector, 'Found:', !!button);
    if (button) {
      (button as HTMLElement).click();
      console.log('Qobux Direct: Successfully clicked play/pause button:', selector);
      return;
    }
  }
  console.log('Qobux Direct: Play/pause button not found');
}

function clickNextButtonDirect() {
  const selectors = [
    // Qobuz-specific selectors
    '.player__action-next',
    '.pct-player-next',
    // Generic fallbacks
    '[data-testid="next-button"]',
    '.next-button',
    '.pf-next-button',
    'button[aria-label*="next"]',
    '.player-controls button:last-child'
  ];

  for (const selector of selectors) {
    const button = document.querySelector(selector);
    console.log('Qobux Direct: Trying next selector:', selector, 'Found:', !!button);
    if (button) {
      (button as HTMLElement).click();
      console.log('Qobux Direct: Successfully clicked next button:', selector);
      return;
    }
  }
  console.log('Qobux Direct: Next button not found');
}

function clickPreviousButtonDirect() {
  const selectors = [
    // Qobuz-specific selectors
    '.player__action-previous',
    '.pct-player-prev',
    // Generic fallbacks
    '[data-testid="previous-button"]',
    '.previous-button',
    '.pf-previous-button',
    'button[aria-label*="previous"]',
    '.player-controls button:nth-child(1)'
  ];

  for (const selector of selectors) {
    const button = document.querySelector(selector);
    console.log('Qobux Direct: Trying previous selector:', selector, 'Found:', !!button);
    if (button) {
      (button as HTMLElement).click();
      console.log('Qobux Direct: Successfully clicked previous button:', selector);
      return;
    }
  }
  console.log('Qobux Direct: Previous button not found');
}

// Media Session API integration
// This will be injected into the web page to handle media controls
const mediaSessionScript = `
(function() {
  console.log('Qobux: Initializing Media Session API integration');
  
  // Wait for the page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMediaSession);
  } else {
    initMediaSession();
  }
  
  function initMediaSession() {
    if ('mediaSession' in navigator) {
      console.log('Qobux: Media Session API available');

      // Note: Media Session will activate automatically after first user play interaction

      // Set up media session handlers
      navigator.mediaSession.setActionHandler('play', () => {
        console.log('Qobux: Media Session play command');
        clickPlayButton();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('Qobux: Media Session pause command');
        clickPlayButton();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('Qobux: Media Session previous command');
        clickPreviousButton();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('Qobux: Media Session next command');
        clickNextButton();
      });

      // Monitor for track changes to update media session metadata
      observeTrackChanges();

      console.log('Qobux: Media Session handlers registered');
    } else {
      console.log('Qobux: Media Session API not available');
    }
  }
  
  function clickPlayButton() {
    console.log('Qobux DOM: Searching for play/pause button...');
    // Look for common play/pause button selectors in Qobuz
    const selectors = [
      '[data-testid="play-button"]',
      '.play-button',
      '.pf-play-button',
      'button[aria-label*="play"]',
      'button[aria-label*="pause"]',
      '.player-controls button:first-child'
    ];

    console.log('Qobux DOM: Available buttons:', document.querySelectorAll('button').length);

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      console.log('Qobux DOM: Trying selector:', selector, 'Found:', !!button);
      if (button) {
        button.click();
        console.log('Qobux DOM: Successfully clicked play/pause button:', selector);
        return;
      }
    }
    console.log('Qobux DOM: Play/pause button not found with any selector');
  }
  
  function clickNextButton() {
    console.log('Qobux DOM: Searching for next button...');
    const selectors = [
      '[data-testid="next-button"]',
      '.next-button',
      '.pf-next-button',
      'button[aria-label*="next"]',
      '.player-controls button:last-child'
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      console.log('Qobux DOM: Trying next selector:', selector, 'Found:', !!button);
      if (button) {
        button.click();
        console.log('Qobux DOM: Successfully clicked next button:', selector);
        return;
      }
    }
    console.log('Qobux DOM: Next button not found with any selector');
  }
  
  function clickPreviousButton() {
    console.log('Qobux DOM: Searching for previous button...');
    const selectors = [
      '[data-testid="previous-button"]',
      '.previous-button',
      '.pf-previous-button',
      'button[aria-label*="previous"]',
      '.player-controls button:nth-child(1)'
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      console.log('Qobux DOM: Trying previous selector:', selector, 'Found:', !!button);
      if (button) {
        button.click();
        console.log('Qobux DOM: Successfully clicked previous button:', selector);
        return;
      }
    }
    console.log('Qobux DOM: Previous button not found with any selector');
  }
  
  function observeTrackChanges() {
    // Create a mutation observer to watch for track changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          updateMediaSessionMetadata();
        }
      });
    });
    
    // Start observing the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Initial metadata update
    setTimeout(updateMediaSessionMetadata, 2000);
  }
  
  function updateMediaSessionMetadata() {
    if (!('mediaSession' in navigator)) return;
    
    try {
      // Try to extract track information from the page
      const titleSelectors = [
        '.track-title',
        '.current-track-title',
        '[data-testid="track-title"]',
        '.player-track-title'
      ];
      
      const artistSelectors = [
        '.track-artist',
        '.current-track-artist',
        '[data-testid="track-artist"]',
        '.player-track-artist'
      ];
      
      const albumSelectors = [
        '.track-album',
        '.current-track-album',
        '[data-testid="track-album"]',
        '.player-track-album'
      ];
      
      let title = 'Unknown Track';
      let artist = 'Unknown Artist';
      let album = 'Unknown Album';
      
      // Extract title
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          title = element.textContent.trim();
          break;
        }
      }
      
      // Extract artist
      for (const selector of artistSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          artist = element.textContent.trim();
          break;
        }
      }
      
      // Extract album
      for (const selector of albumSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          album = element.textContent.trim();
          break;
        }
      }
      
      // Update media session metadata
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: artist,
        album: album
      });
      
      console.log('Qobux: Updated media session metadata:', { title, artist, album });
    } catch (error) {
      console.error('Qobux: Error updating media session metadata:', error);
    }
  }
  
  // Handle media commands from tray menu
  console.log('Qobux Preload: Checking for electronAPI...', !!window.electronAPI);
  if (window.electronAPI) {
    console.log('Qobux Preload: Setting up media command listener');
    window.electronAPI.onMediaCommand((command) => {
      console.log('Qobux Preload: Received media command from tray:', command);

      switch (command) {
        case 'playpause':
          console.log('Qobux Preload: Executing play/pause');
          clickPlayButton();
          break;
        case 'next':
          console.log('Qobux Preload: Executing next');
          clickNextButton();
          break;
        case 'previous':
          console.log('Qobux Preload: Executing previous');
          clickPreviousButton();
          break;
        default:
          console.log('Qobux Preload: Unknown command:', command);
      }
    });
  } else {
    console.log('Qobux Preload: electronAPI not available');
  }
})();
`;

// Inject the media session script when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const script = document.createElement('script');
  script.textContent = mediaSessionScript;
  document.head.appendChild(script);

  // Note: Media Session API requires user interaction to activate
  // Media keys will work after the user clicks play for the first time
  // This is normal browser security behavior
  console.log('Qobux: Media Session API ready (will activate after first play interaction)');
});
