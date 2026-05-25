import './style.css';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics } from '@capacitor/haptics';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { GOOGLE_SHEET_CSV_URL } from './config.js';

// DOM Elements
const videoSplash = document.getElementById('video-splash');
const splashVideo = document.getElementById('splash-video');
const skipSplashBtn = document.getElementById('skip-splash-btn');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');
const offlineBanner = document.getElementById('offline-banner');
const retryBtn = document.getElementById('retry-btn');
const tabCurrent = document.getElementById('tab-current');
const tabPast = document.getElementById('tab-past');
const announcementsFeed = document.getElementById('announcements-feed');
const scrollWrapper = document.getElementById('scroll-wrapper');
const pullIndicatorContainer = document.getElementById('pull-indicator-container');

// State Variables
let currentTab = 'current'; // 'current' or 'past'
let announcementsData = [];
let isPulling = false;
let startY = 0;
let pullDistance = 0;
const PULL_THRESHOLD = 80; // Distance in px required to refresh

// --- 1. LIGHT / DARK MODE SYSTEM ---
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
}

themeToggle.addEventListener('click', async () => {
  const isDark = document.documentElement.classList.contains('dark');
  
  // Trigger light haptic click
  if (Capacitor.isNativePlatform()) {
    try { await Haptics.vibrate({ duration: 30 }); } catch (e) {}
  }

  if (isDark) {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  } else {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  }
});

// --- 2. PREMIUM VIDEO SPLASH ENGINE ---
function initSplash() {
  let splashCompleted = false;

  const completeSplash = () => {
    if (splashCompleted) return;
    splashCompleted = true;
    
    // Smooth transition fade-out
    videoSplash.classList.add('fade-out');
    
    // Stop video playback
    try {
      splashVideo.pause();
    } catch(e) {}
    
    // Remove element from DOM after fade out transition completes
    setTimeout(() => {
      videoSplash.style.display = 'none';
    }, 500);
  };

  // Set up 4.5 second hard fallback timeout to avoid hanging on splash
  const fallbackTimeout = setTimeout(completeSplash, 4500);

  // Setup video events
  splashVideo.addEventListener('play', () => {
    // Show video and hide static loading fallback once playing
    splashVideo.classList.remove('hidden');
  });

  splashVideo.addEventListener('ended', completeSplash);
  
  // Handle video error (e.g. file not found/loaded)
  splashVideo.addEventListener('error', () => {
    console.warn("Splash video not loaded/error. Falling back to main screen.");
    clearTimeout(fallbackTimeout);
    completeSplash();
  });

  // Handle Skip Button Click
  skipSplashBtn.addEventListener('click', async () => {
    if (Capacitor.isNativePlatform()) {
      try { await Haptics.vibrate({ duration: 50 }); } catch (e) {}
    }
    clearTimeout(fallbackTimeout);
    completeSplash();
  });

  // Attempt to play
  splashVideo.load();
  const playPromise = splashVideo.play();
  
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log("Auto-play prevented or video missing. Displaying fallback spinner.", error);
      // Wait 2.5 seconds on beautiful static placeholder screen, then fade out
      setTimeout(completeSplash, 2500);
    });
  }
}

// --- 3. CUSTOM ROBUST CSV PARSER ---
// Correctly parses CSV grids including fields with quoted commas and quoted newlines.
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    
    if (c === '"') {
      if (inQuotes && next === '"') {
        // Escaped quote
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push("");
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += c;
    }
  }
  
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  
  return lines;
}

// --- 4. DATA ENGINE: SEGMENTATION & SORTING ---
function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getRelativeDateString(dateStr) {
  try {
    const targetDate = new Date(dateStr + "T00:00:00");
    const today = getToday();
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === -1) return "Yesterday";
    if (diffDays === 1) return "Tomorrow";
    
    // Format: "May 20, 2026"
    return targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

function processAndRenderFeed() {
  announcementsFeed.innerHTML = "";
  
  // Segment announcements
  const segmented = {
    current: [],
    past: []
  };

  const todayDate = getToday();

  announcementsData.forEach(item => {
    const target = new Date(item.targetDate + "T00:00:00");
    const diffTime = todayDate.getTime() - target.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24); // Positive means past, negative means future
    
    // New: today, in the future, or <= 2 days in the past (diffDays <= 2)
    if (diffDays <= 2) {
      segmented.current.push(item);
    } else {
      segmented.past.push(item);
    }
  });

  // Sort chronologically: newest (most future/recent) first (descending targetDate)
  const sortFeed = (arr) => {
    return arr.sort((a, b) => {
      const dateA = new Date(a.targetDate + "T00:00:00");
      const dateB = new Date(b.targetDate + "T00:00:00");
      return dateB - dateA;
    });
  };

  const activeAnnouncements = sortFeed(segmented[currentTab]);

  if (activeAnnouncements.length === 0) {
    announcementsFeed.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 text-center select-none animate-[fadeIn_0.5s_ease]">
        <div class="p-4 bg-m3-light-surfaceVariant dark:bg-m3-dark-surfaceVariant rounded-full mb-4 text-m3-light-onSurfaceVariant/50 dark:text-m3-dark-onSurfaceVariant/50">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <p class="text-sm font-semibold text-m3-light-onSurfaceVariant/60 dark:text-m3-dark-onSurfaceVariant/60">No announcements in this category</p>
      </div>
    `;
    return;
  }

  activeAnnouncements.forEach((item, index) => {
    const relativeDate = getRelativeDateString(item.targetDate);
    const card = document.createElement('div');
    card.className = "card-animation bg-m3-light-surface dark:bg-m3-dark-surface border border-m3-light-surfaceVariant/40 dark:border-m3-dark-surfaceVariant/40 rounded-large p-5 shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2 flex flex-col gap-3";
    card.style.animationDelay = `${index * 50}ms`;

    card.innerHTML = `
      <div class="flex items-center justify-between gap-4">
        <!-- Unified source block -->
        <div class="flex flex-col">
          <span class="text-xs font-bold tracking-wide uppercase text-m3-light-primary dark:text-m3-dark-primary">
            ${escapeHTML(item.ambition)}
          </span>
          <span class="text-[10px] text-m3-light-onSurfaceVariant/60 dark:text-m3-dark-onSurfaceVariant/60 font-medium">
            Shared by ${escapeHTML(item.name)}
          </span>
        </div>

        <!-- Date Tag badge -->
        <span class="px-3 py-1 text-[10px] font-bold rounded-full bg-m3-light-primaryContainer dark:bg-m3-dark-primaryContainer text-m3-light-onPrimaryContainer dark:text-m3-dark-onPrimaryContainer">
          ${relativeDate}
        </span>
      </div>
      
      <!-- Announcement Body -->
      <p class="text-sm md:text-base text-m3-light-onSurface dark:text-m3-dark-onSurface leading-relaxed font-medium">
        ${escapeHTML(item.announcement)}
      </p>
    `;

    announcementsFeed.appendChild(card);
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// --- 5. DETECT NEW & FIRE NATIVE NOTIFICATIONS ---
async function checkAndNotifyNew(newData) {
  // Read saved hashes snapshot
  const savedHashesRaw = localStorage.getItem('announcement_hashes');
  const isFirstLaunch = !savedHashesRaw;
  const oldHashes = savedHashesRaw ? JSON.parse(savedHashesRaw) : [];
  
  // Calculate new hashes
  const newHashesMap = {};
  const currentHashes = [];

  newData.forEach(item => {
    // Generate unique content hash
    const contentString = `${item.name}|${item.announcement}|${item.targetDate}`;
    const hash = btoa(unescape(encodeURIComponent(contentString)));
    newHashesMap[hash] = item;
    currentHashes.push(hash);
  });

  // Save new snapshot to disk
  localStorage.setItem('announcement_hashes', JSON.stringify(currentHashes));

  if (isFirstLaunch) {
    console.log("First startup. Storing snapshot without notifications.");
    return;
  }

  // Look for additions
  const newAdditions = currentHashes.filter(h => !oldHashes.includes(h));

  if (newAdditions.length > 0) {
    console.log(`${newAdditions.length} new announcements detected!`);
    
    // Trigger native vibrations
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.vibrate({ duration: 300 });
      } catch (e) {}
    }

    // Schedule notification for each new addition
    for (let i = 0; i < newAdditions.length; i++) {
      const item = newHashesMap[newAdditions[i]];
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: `New announcement from ${item.ambition}!`,
              body: item.announcement.substring(0, 100) + (item.announcement.length > 100 ? '...' : ''),
              id: Math.floor(Math.random() * 100000),
              schedule: { at: new Date(Date.now() + 500) }, // fire almost instantly
            }
          ]
        });
      } catch (err) {
        console.error("Local Notification schedule failed", err);
      }
    }
  }
}

// --- 6. CORE FETCH & RESILIENCE ENGINE ---
async function fetchCsvText(url) {
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({
      url,
      responseType: 'text',
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    return typeof response.data === 'string' ? response.data : String(response.data ?? '');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Server returned status: ${response.status}`);
  }

  return response.text();
}

async function fetchAnnouncements() {
  try {
    const csvText = await fetchCsvText(GOOGLE_SHEET_CSV_URL);
    const rows = parseCSV(csvText);

    // Schema Mapping (expecting 4 columns)
    // Row 0 is header: Column A (Name), Column B (Ambition), Column C (Announcement), Column D (Target Date)
    const formattedData = [];
    
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length >= 4 && cols[2].trim() !== "") {
        formattedData.push({
          name: cols[0] ? cols[0].trim() : "Unknown",
          ambition: cols[1] ? cols[1].trim() : "General",
          announcement: cols[2].trim(),
          targetDate: cols[3] ? cols[3].trim() : "2026-05-20"
        });
      }
    }

    if (formattedData.length === 0) {
      throw new Error("No announcements found in sheet");
    }

    // Success! Update Cache
    announcementsData = formattedData;
    localStorage.setItem('announcements_cache', JSON.stringify(formattedData));
    offlineBanner.classList.add('hidden');

    // Run notification evaluation engine
    await checkAndNotifyNew(formattedData);

    processAndRenderFeed();
  } catch (err) {
    console.warn("Fetch failed, loading from cache...", err);
    offlineBanner.classList.remove('hidden');

    // Fallback: Read from local Cache
    const cached = localStorage.getItem('announcements_cache');
    if (cached) {
      announcementsData = JSON.parse(cached);
    } else {
      console.log("No cache found.");
      announcementsData = [];
    }
    processAndRenderFeed();
  }
}

// --- 7. PULL TO REFRESH INTERACTIONS ---
function initPullToRefresh() {
  scrollWrapper.addEventListener('touchstart', (e) => {
    // Only pull if container is scrolled to the absolute top
    if (scrollWrapper.scrollTop === 0) {
      startY = e.touches[0].pageY;
      isPulling = true;
      scrollWrapper.classList.add('pulling');
    }
  });

  scrollWrapper.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY;
    
    if (diff > 0) {
      e.preventDefault(); // Stop native elasticity bounce
      pullDistance = Math.min(diff * 0.4, PULL_THRESHOLD + 20); // damping factor
      
      // Pull indicator grows in height
      pullIndicatorContainer.style.height = `${pullDistance}px`;
      
      // Rotate the spinner in relation to pull depth
      const rotation = (pullDistance / PULL_THRESHOLD) * 360;
      const spinner = document.getElementById('pull-indicator');
      spinner.style.transform = `rotate(${rotation}deg)`;
      
      if (pullDistance >= PULL_THRESHOLD) {
        spinner.style.opacity = '1';
      } else {
        spinner.style.opacity = '0.5';
      }
    }
  });

  scrollWrapper.addEventListener('touchend', async () => {
    if (!isPulling) return;
    isPulling = false;
    scrollWrapper.classList.remove('pulling');
    
    if (pullDistance >= PULL_THRESHOLD) {
      // Trigger haptic tick to acknowledge refresh start
      if (Capacitor.isNativePlatform()) {
        try { await Haptics.vibrate({ duration: 50 }); } catch (e) {}
      }
      
      // Keep pull container open during load
      pullIndicatorContainer.style.height = `${PULL_THRESHOLD}px`;
      
      await fetchAnnouncements();
      
      // Animate slide-shut smoothly
      setTimeout(() => {
        pullIndicatorContainer.style.height = '0px';
      }, 300);
    } else {
      // Slide back shut
      pullIndicatorContainer.style.height = '0px';
    }
    pullDistance = 0;
  });
}

// --- 8. TABS SYSTEM ---
tabCurrent.addEventListener('click', async () => {
  if (currentTab === 'current') return;
  currentTab = 'current';
  
  if (Capacitor.isNativePlatform()) {
    try { await Haptics.vibrate({ duration: 25 }); } catch (e) {}
  }

  // Active Pill class styling transitions
  tabCurrent.className = "flex-1 text-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 bg-m3-light-primaryContainer dark:bg-m3-dark-primaryContainer text-m3-light-onPrimaryContainer dark:text-m3-dark-onPrimaryContainer shadow-sm";
  tabPast.className = "flex-1 text-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 text-m3-light-onSurfaceVariant dark:text-m3-dark-onSurfaceVariant hover:opacity-80";
  
  processAndRenderFeed();
});

tabPast.addEventListener('click', async () => {
  if (currentTab === 'past') return;
  currentTab = 'past';
  
  if (Capacitor.isNativePlatform()) {
    try { await Haptics.vibrate({ duration: 25 }); } catch (e) {}
  }

  // Active Pill class styling transitions
  tabPast.className = "flex-1 text-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 bg-m3-light-primaryContainer dark:bg-m3-dark-primaryContainer text-m3-light-onPrimaryContainer dark:text-m3-dark-onPrimaryContainer shadow-sm";
  tabCurrent.className = "flex-1 text-center py-2.5 rounded-full text-sm font-semibold transition-all duration-300 text-m3-light-onSurfaceVariant dark:text-m3-dark-onSurfaceVariant hover:opacity-80";
  
  processAndRenderFeed();
});

// --- 9. APP INITIALIZATION & BOOTSTRAP ---
window.addEventListener('load', async () => {
  // Init Theme & Display Splash
  initTheme();
  initSplash();
  initPullToRefresh();
  
  // Try loading cached items immediately so the screen is never blank
  const cached = localStorage.getItem('announcements_cache');
  if (cached) {
    announcementsData = JSON.parse(cached);
    processAndRenderFeed();
  } else {
    announcementsData = [];
    processAndRenderFeed();
  }

  // Request notifications permissions on native launch
  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display !== 'granted') {
        console.warn('Native LocalNotification permissions denied by user.');
      }
    } catch(err) {
      console.warn("Failed requesting notification permissions:", err);
    }
  }

  // Load live data from Google Sheet
  await fetchAnnouncements();
});

// Retry Button & Resilience actions
retryBtn.addEventListener('click', async () => {
  if (Capacitor.isNativePlatform()) {
    try { await Haptics.vibrate({ duration: 40 }); } catch (e) {}
  }
  offlineBanner.innerHTML = `<span>Refreshing...</span>`;
  await fetchAnnouncements();
  offlineBanner.innerHTML = `
    <svg class="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
    </svg>
    <span>Offline: Displaying cached announcements.</span>
    <button id="retry-btn" class="ml-2 underline font-bold hover:opacity-85">Retry</button>
  `;
});

// Network online/offline status monitors
window.addEventListener('online', () => {
  fetchAnnouncements();
});
window.addEventListener('offline', () => {
  offlineBanner.classList.remove('hidden');
});
