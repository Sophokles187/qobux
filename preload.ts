import { contextBridge, ipcRenderer } from 'electron';

// Timing constants
const DOM_READY_DELAY = 100;
const TRACK_CHECK_DELAY = 1000;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Media control commands from tray
    onMediaCommand: (callback: (command: string) => void) => {
      ipcRenderer.on('media-command', (_, command) => {
        callback(command);
      });
    },

    // Notifications
    showNotification: (title: string, body: string) => {
      ipcRenderer.send('show-notification', { title, body });
    },

    // Settings
    getSettings: () => {
      return ipcRenderer.invoke('get-settings');
    },

    // Remove listener
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    }
  });
} catch (error) {
  // Fallback: Direct window injection (less secure but works)
  (window as any).electronAPI = {
    onMediaCommand: (callback: (command: string) => void) => {
      ipcRenderer.on('media-command', (_, command) => {
        callback(command);
      });
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    }
  };
}

// Set up IPC handler directly in preload (not in injected script)
// Direct IPC listener in preload context
ipcRenderer.on('media-command', (_, command) => {
  // Execute DOM manipulation directly
  setTimeout(() => {
    switch (command) {
      case 'playpause':
        clickPlayButtonDirect();
        break;
      case 'next':
        clickNextButtonDirect();
        // Check for track change after next
        setTimeout(checkForTrackChange, TRACK_CHECK_DELAY);
        break;
      case 'previous':
        clickPreviousButtonDirect();
        // Check for track change after previous
        setTimeout(checkForTrackChange, TRACK_CHECK_DELAY);
        break;
    }
  }, DOM_READY_DELAY); // Small delay to ensure DOM is ready
});

// Track change detection for notifications
let lastTrackInfoDirect = { title: '', artist: '', album: '' };

function checkForTrackChange() {
  // Extract current track info
  const titleElement = document.querySelector('.player__track-name, .player__track-overflow');
  const albumElement = document.querySelector('.player__track-album');

  const title = titleElement?.textContent?.trim() || 'Unknown Track';
  const album = albumElement?.textContent?.trim() || 'Unknown Album';

  // For artist, try to extract from album element or other sources
  let artist = 'Unknown Artist';
  const albumLink = document.querySelector('.player__track-album a');
  if (albumLink && albumLink.textContent) {
    artist = albumLink.textContent.trim();
  }

  // Check if track changed
  const trackChanged = (
    title !== lastTrackInfoDirect.title ||
    artist !== lastTrackInfoDirect.artist ||
    album !== lastTrackInfoDirect.album
  );

  if (trackChanged && title !== 'Unknown Track') {
    // Send notification
    const notificationTitle = 'Now Playing';
    const notificationBody = artist + ' - ' + title;

    if ((window as any).electronAPI) {
      (window as any).electronAPI.showNotification(notificationTitle, notificationBody);
    }

    lastTrackInfoDirect = { title, artist, album };
  }
}

// Note: Track changes are only checked after next/previous button clicks
// No periodic polling to save performance

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

  for (const selector of selectors) {
    const button = document.querySelector(selector);
    if (button) {
      (button as HTMLElement).click();
      return;
    }
  }
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
    if (button) {
      (button as HTMLElement).click();
      return;
    }
  }
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
    if (button) {
      (button as HTMLElement).click();
      return;
    }
  }
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
    console.log('Qobux: Setting up track change observer...');

    // Create a mutation observer to watch for track changes
    const observer = new MutationObserver((mutations) => {
      console.log('Qobux: DOM mutations detected:', mutations.length);
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          console.log('Qobux: Relevant mutation detected, updating metadata...');
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

    console.log('Qobux: Observer started, scheduling initial metadata update...');

    // Initial metadata update
    setTimeout(() => {
      console.log('Qobux: Running initial metadata update...');
      updateMediaSessionMetadata();
    }, 2000);

    // Also try periodic updates in case mutations are missed
    setInterval(() => {
      console.log('Qobux: Running periodic metadata update...');
      updateMediaSessionMetadata();
    }, 10000); // Every 10 seconds
  }
  
  let lastTrackInfo = { title: '', artist: '', album: '' };

  function updateMediaSessionMetadata() {
    console.log('Qobux: updateMediaSessionMetadata() called');
    if (!('mediaSession' in navigator)) {
      console.log('Qobux: Media Session API not available');
      return;
    }

    try {
      // Try to extract track information from the page using Qobuz-specific selectors
      const titleSelectors = [
        '.player__track-name', // Qobuz specific
        '.player__track-overflow', // Qobuz specific
        '.track-title',
        '.current-track-title',
        '[data-testid="track-title"]',
        '.player-track-title'
      ];

      const artistSelectors = [
        '.player__track-album a', // Qobuz specific - artist is often in album link
        '.track-artist',
        '.current-track-artist',
        '[data-testid="track-artist"]',
        '.player-track-artist'
      ];

      const albumSelectors = [
        '.player__track-album', // Qobuz specific
        '.track-album',
        '.current-track-album',
        '[data-testid="track-album"]',
        '.player-track-album'
      ];

      let title = 'Unknown Track';
      let artist = 'Unknown Artist';
      let album = 'Unknown Album';
      let coverUrl = '';

      // Extract title
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          title = element.textContent.trim();
          break;
        }
      }

      // Extract artist - try multiple approaches for Qobuz
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

      // Extract cover image URL
      console.log('Qobux: Searching for cover image...');
      const coverSelectors = [
        '.player__track-cover img', // Qobuz specific
        '.player__track-cover [style*="background-image"]', // Background image
        '.current-track-cover img',
        '.track-cover img',
        '[data-testid="track-cover"] img'
      ];

      for (const selector of coverSelectors) {
        const element = document.querySelector(selector);
        console.log('Qobux: Trying cover selector:', selector, 'Found:', !!element);
        if (element) {
          console.log('Qobux: Cover element details:', element.tagName, element.className, element);
          if (element.tagName === 'IMG') {
            coverUrl = element.src || '';
            console.log('Qobux: Extracted IMG src:', coverUrl);
          } else {
            // Extract from background-image style
            const style = element.getAttribute('style') || '';
            const computedStyle = getComputedStyle(element);
            console.log('Qobux: Element style:', style);
            console.log('Qobux: Computed background-image:', computedStyle.backgroundImage);

            const match = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/) ||
                         computedStyle.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (match) {
              coverUrl = match[1];
              console.log('Qobux: Extracted background URL:', coverUrl);
            }
          }
          if (coverUrl) {
            console.log('Qobux: Found cover URL:', coverUrl);
            break;
          }
        }
      }

      if (!coverUrl) {
        console.log('Qobux: No cover found, checking all images on page...');
        const allImages = document.querySelectorAll('img');
        console.log('Qobux: Total images on page:', allImages.length);
        allImages.forEach((img, i) => {
          if (i < 5) { // Show first 5 images
            console.log('Qobux: Image', i, ':', img.src, img.className);
          }
        });
      }

      // Check if track changed
      const currentTrackInfo = { title, artist, album };
      const trackChanged = (
        currentTrackInfo.title !== lastTrackInfo.title ||
        currentTrackInfo.artist !== lastTrackInfo.artist ||
        currentTrackInfo.album !== lastTrackInfo.album
      );

      // Update media session metadata with cover
      const mediaMetadata = {
        title: title,
        artist: artist,
        album: album
      };

      // Add artwork if cover URL is available
      if (coverUrl) {
        mediaMetadata.artwork = [
          {
            src: coverUrl,
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ];
      }

      navigator.mediaSession.metadata = new MediaMetadata(mediaMetadata);

      // Show notification if track changed and we have valid info
      if (trackChanged && title !== 'Unknown Track' && window.electronAPI) {
        const notificationTitle = 'Now Playing';
        const notificationBody = artist + ' - ' + title;

        console.log('Qobux: Track changed, showing notification:', notificationBody);
        console.log('Qobux: Using cover URL for notification:', coverUrl);

        // Use cover URL as notification icon if available
        window.electronAPI.showNotification(notificationTitle, notificationBody, coverUrl);

        lastTrackInfo = currentTrackInfo;
      }

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
});
