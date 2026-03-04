// Analytics utility for tracking user interactions
// Extends the global gtag function for TypeScript support

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

// Event categories for consistent tracking
export const ANALYTICS_CATEGORIES = {
  AUDIO: 'Audio',
  UI: 'User Interface',
  NAVIGATION: 'Navigation',
  SHARING: 'Sharing',
  SETTINGS: 'Settings',
  ERROR: 'Error',
  PERFORMANCE: 'Performance',
} as const;

// Audio-specific events
export const AUDIO_EVENTS = {
  PLAY: 'audio_play',
  PAUSE: 'audio_pause',
  TRACK_CHANGE: 'audio_track_change',
  TRACK_SELECT: 'audio_track_select',
  SEEK: 'audio_seek',
  VOLUME_CHANGE: 'audio_volume_change',
  BACKGROUND_MUSIC_PLAY: 'background_music_play',
  BACKGROUND_MUSIC_PAUSE: 'background_music_pause',
  BACKGROUND_MUSIC_CHANGE: 'background_music_change',
  CAPTIONS_TOGGLE: 'captions_toggle',
  SHARE: 'audio_share',
} as const;

// UI events
export const UI_EVENTS = {
  DRAWER_OPEN: 'drawer_open',
  DRAWER_CLOSE: 'drawer_close',
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  NAVIGATION_CLICK: 'navigation_click',
  SETTINGS_OPEN: 'settings_open',
} as const;

// Error events
export const ERROR_EVENTS = {
  AUDIO_ERROR: 'audio_error',
  LOAD_ERROR: 'load_error',
  NETWORK_ERROR: 'network_error',
} as const;

// Performance events
export const PERFORMANCE_EVENTS = {
  AUDIO_LOAD_TIME: 'audio_load_time',
  PAGE_LOAD_TIME: 'page_load_time',
  TRACK_SWITCH_TIME: 'track_switch_time',
} as const;

// Page view events
export const PAGE_EVENTS = {
  TRACK_PAGE_VIEW: 'track_page_view',
  HOME_PAGE_VIEW: 'home_page_view',
  NOT_FOUND_PAGE_VIEW: 'not_found_page_view',
} as const;

// Check if gtag is available
const isGtagAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Base analytics function
const trackEvent = (
  eventName: string,
  parameters: Record<string, any> = {}
): void => {
  if (!isGtagAvailable()) {
    console.warn('Analytics: gtag not available, event not tracked:', eventName);
    return;
  }

  try {
    window.gtag('event', eventName, {
      event_category: parameters.category || 'General',
      event_label: parameters.label,
      value: parameters.value,
      custom_map: parameters.customMap,
      ...parameters,
    });
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [ANALYTICS]', eventName, parameters);
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

// Audio analytics functions
export const trackAudioPlay = (trackTitle: string, trackIndex: number, duration?: number) => {
  trackEvent(AUDIO_EVENTS.PLAY, {
    category: ANALYTICS_CATEGORIES.AUDIO,
    label: trackTitle,
    track_index: trackIndex,
    track_duration: duration,
  });
};

export const trackAudioPause = (trackTitle: string, trackIndex: number, currentTime: number) => {
  trackEvent(AUDIO_EVENTS.PAUSE, {
    category: ANALYTICS_CATEGORIES.AUDIO,
    label: trackTitle,
    track_index: trackIndex,
    current_time: currentTime,
  });
};

export const trackTrackChange = (
  fromTrack: string,
  toTrack: string,
  fromIndex: number,
  toIndex: number,
  autoPlay: boolean = false
) => {
  trackEvent(AUDIO_EVENTS.TRACK_CHANGE, {
    category: ANALYTICS_CATEGORIES.AUDIO,
    label: `${fromTrack} → ${toTrack}`,
    from_track: fromTrack,
    to_track: toTrack,
    from_index: fromIndex,
    to_index: toIndex,
    auto_play: autoPlay,
  });
};

export const trackTrackSelect = (trackTitle: string, trackIndex: number) => {
  trackEvent(AUDIO_EVENTS.TRACK_SELECT, {
    category: ANALYTICS_CATEGORIES.AUDIO,
    label: trackTitle,
    track_index: trackIndex,
  });
};

export const trackSeek = (trackTitle: string, fromTime: number, toTime: number) => {
  trackEvent(AUDIO_EVENTS.SEEK, {
    category: ANALYTICS_CATEGORIES.AUDIO,
    label: trackTitle,
    from_time: fromTime,
    to_time: toTime,
    seek_duration: Math.abs(toTime - fromTime),
  });
};

export const trackVolumeChange = (volume: number, previousVolume: number) => {
  trackEvent(AUDIO_EVENTS.VOLUME_CHANGE, {
    category: ANALYTICS_CATEGORIES.AUDIO,
    volume: volume,
    previous_volume: previousVolume,
    volume_change: volume - previousVolume,
  });
};

export const trackBackgroundMusicPlay = (musicTitle: string, musicId: string) => {
  trackEvent(AUDIO_EVENTS.BACKGROUND_MUSIC_PLAY, {
    category: ANALYTICS_CATEGORIES.AUDIO,
    label: musicTitle,
    music_id: musicId,
  });
};

export const trackBackgroundMusicPause = (musicTitle: string, musicId: string) => {
  trackEvent(AUDIO_EVENTS.BACKGROUND_MUSIC_PAUSE, {
    category: ANALYTICS_CATEGORIES.AUDIO,
    label: musicTitle,
    music_id: musicId,
  });
};

export const trackBackgroundMusicChange = (
  fromMusic: string,
  toMusic: string,
  fromId: string,
  toId: string
) => {
  trackEvent(AUDIO_EVENTS.BACKGROUND_MUSIC_CHANGE, {
    category: ANALYTICS_CATEGORIES.AUDIO,
    label: `${fromMusic} → ${toMusic}`,
    from_music: fromMusic,
    to_music: toMusic,
    from_id: fromId,
    to_id: toId,
  });
};

export const trackCaptionsToggle = (enabled: boolean, trackTitle: string) => {
  trackEvent(AUDIO_EVENTS.CAPTIONS_TOGGLE, {
    category: ANALYTICS_CATEGORIES.AUDIO,
    label: trackTitle,
    captions_enabled: enabled,
  });
};

export const trackAudioShare = (trackTitle: string, trackIndex: number, method: string) => {
  trackEvent(AUDIO_EVENTS.SHARE, {
    category: ANALYTICS_CATEGORIES.SHARING,
    label: trackTitle,
    track_index: trackIndex,
    share_method: method,
  });
};

// UI analytics functions
export const trackDrawerOpen = () => {
  trackEvent(UI_EVENTS.DRAWER_OPEN, {
    category: ANALYTICS_CATEGORIES.UI,
  });
};

export const trackDrawerClose = () => {
  trackEvent(UI_EVENTS.DRAWER_CLOSE, {
    category: ANALYTICS_CATEGORIES.UI,
  });
};

export const trackModalOpen = (modalType: string) => {
  trackEvent(UI_EVENTS.MODAL_OPEN, {
    category: ANALYTICS_CATEGORIES.UI,
    label: modalType,
  });
};

export const trackModalClose = (modalType: string) => {
  trackEvent(UI_EVENTS.MODAL_CLOSE, {
    category: ANALYTICS_CATEGORIES.UI,
    label: modalType,
  });
};

export const trackNavigationClick = (pageName: string) => {
  trackEvent(UI_EVENTS.NAVIGATION_CLICK, {
    category: ANALYTICS_CATEGORIES.NAVIGATION,
    label: pageName,
  });
};

export const trackSettingsOpen = (settingsType: string) => {
  trackEvent(UI_EVENTS.SETTINGS_OPEN, {
    category: ANALYTICS_CATEGORIES.SETTINGS,
    label: settingsType,
  });
};

// Error analytics functions
export const trackAudioError = (error: string, trackTitle: string, trackIndex: number) => {
  trackEvent(ERROR_EVENTS.AUDIO_ERROR, {
    category: ANALYTICS_CATEGORIES.ERROR,
    label: trackTitle,
    track_index: trackIndex,
    error_message: error,
  });
};

export const trackLoadError = (resource: string, error: string) => {
  trackEvent(ERROR_EVENTS.LOAD_ERROR, {
    category: ANALYTICS_CATEGORIES.ERROR,
    label: resource,
    error_message: error,
  });
};

export const trackNetworkError = (url: string, error: string) => {
  trackEvent(ERROR_EVENTS.NETWORK_ERROR, {
    category: ANALYTICS_CATEGORIES.ERROR,
    label: url,
    error_message: error,
  });
};

// Performance analytics functions
export const trackAudioLoadTime = (trackTitle: string, loadTime: number) => {
  trackEvent(PERFORMANCE_EVENTS.AUDIO_LOAD_TIME, {
    category: ANALYTICS_CATEGORIES.PERFORMANCE,
    label: trackTitle,
    load_time_ms: loadTime,
  });
};

export const trackPageLoadTime = (pageName: string, loadTime: number) => {
  trackEvent(PERFORMANCE_EVENTS.PAGE_LOAD_TIME, {
    category: ANALYTICS_CATEGORIES.PERFORMANCE,
    label: pageName,
    load_time_ms: loadTime,
  });
};

export const trackTrackSwitchTime = (fromTrack: string, toTrack: string, switchTime: number) => {
  trackEvent(PERFORMANCE_EVENTS.TRACK_SWITCH_TIME, {
    category: ANALYTICS_CATEGORIES.PERFORMANCE,
    label: `${fromTrack} → ${toTrack}`,
    switch_time_ms: switchTime,
  });
};

// User engagement tracking
export const trackUserEngagement = (action: string, details: Record<string, any> = {}) => {
  trackEvent('user_engagement', {
    category: ANALYTICS_CATEGORIES.UI,
    label: action,
    ...details,
  });
};

// Page view tracking functions
export const trackTrackPageView = (
  trackTitle: string,
  trackSlug: string,
  trackIndex: number,
  duration?: number
) => {
  // Track custom page view event
  trackEvent(PAGE_EVENTS.TRACK_PAGE_VIEW, {
    category: ANALYTICS_CATEGORIES.NAVIGATION,
    label: trackTitle,
    track_title: trackTitle,
    track_slug: trackSlug,
    track_index: trackIndex,
    track_duration: duration,
    page_path: `/track/${trackSlug}`,
  });

  // Also send a standard page view to GA4
  if (isGtagAvailable()) {
    try {
      window.gtag('config', 'G-BRVLR3TZPQ', {
        page_title: `${trackTitle} - Andrew Visions Zen`,
        page_location: `${window.location.origin}/track/${trackSlug}`,
        custom_map: {
          track_title: trackTitle,
          track_slug: trackSlug,
          track_index: trackIndex,
          track_duration: duration,
        },
      });
    } catch (error) {
      console.error('Analytics page view error:', error);
    }
  }
};

export const trackHomePageView = () => {
  trackEvent(PAGE_EVENTS.HOME_PAGE_VIEW, {
    category: ANALYTICS_CATEGORIES.NAVIGATION,
    page_path: '/',
  });

  if (isGtagAvailable()) {
    try {
      window.gtag('config', 'G-BRVLR3TZPQ', {
        page_title: 'Andrew Visions Zen - Meditation and Spiritual Teachings',
        page_location: window.location.origin,
      });
    } catch (error) {
      console.error('Analytics page view error:', error);
    }
  }
};

export const trackNotFoundPageView = (path: string) => {
  trackEvent(PAGE_EVENTS.NOT_FOUND_PAGE_VIEW, {
    category: ANALYTICS_CATEGORIES.NAVIGATION,
    label: path,
    page_path: path,
  });
};

// Enhanced audio tracking with page context
export const trackAudioPlayWithContext = (
  trackTitle: string,
  trackSlug: string,
  trackIndex: number,
  duration?: number,
  source: 'page_load' | 'user_click' | 'auto_play' = 'user_click'
) => {
  trackEvent(AUDIO_EVENTS.PLAY, {
    category: ANALYTICS_CATEGORIES.AUDIO,
    label: trackTitle,
    track_title: trackTitle,
    track_slug: trackSlug,
    track_index: trackIndex,
    track_duration: duration,
    play_source: source,
    page_path: `/track/${trackSlug}`,
  });
};

// Session tracking
export const trackSessionStart = () => {
  trackEvent('session_start', {
    category: ANALYTICS_CATEGORIES.UI,
  });
};

export const trackSessionEnd = (duration: number) => {
  trackEvent('session_end', {
    category: ANALYTICS_CATEGORIES.UI,
    session_duration: duration,
  });
};
