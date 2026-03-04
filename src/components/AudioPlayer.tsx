import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Menu, Volume2, Share2, Shuffle, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrackDrawer } from "./TrackDrawer";
import { BackgroundSlideshow } from "./BackgroundSlideshow";
import { CaptionOverlay } from "./CaptionOverlay";
import { ShareModal } from "./ShareModal";
import { WelcomeModal } from "./WelcomeModal";
import { type Caption } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  trackAudioPlay,
  trackAudioPause,
  trackTrackChange,
  trackTrackSelect,
  trackSeek,
  trackVolumeChange,
  trackAudioShare,
  trackAudioError,
  trackAudioLoadTime,
  trackTrackSwitchTime,
  trackAudioPlayWithContext,
} from "@/lib/analytics";

// Extend Window interface for mobile Safari detection timeout
declare global {
  interface Window {
    mobileSafariResizeTimeout?: NodeJS.Timeout;
  }

  interface WakeLockSentinel {
    release(): Promise<void>;
    addEventListener(type: 'release', listener: () => void): void;
  }
}

// Simplified AudioContext management for mobile compatibility
let globalAudioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  
  if (!globalAudioContext && ('AudioContext' in window || 'webkitAudioContext' in window)) {
    try {
      globalAudioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      console.log('🎵 [AUDIO CONTEXT] Created new AudioContext, state:', globalAudioContext.state);
    } catch (e) {
      console.warn('🎵 [AUDIO CONTEXT] Failed to create AudioContext:', e);
      return null;
    }
  }
  
  return globalAudioContext;
};

// Resume audio context if suspended (critical for mobile)
const resumeAudioContext = async (): Promise<boolean> => {
  const audioContext = getAudioContext();
  if (!audioContext) return false;
  
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log('🎵 [AUDIO CONTEXT] Resumed suspended audio context');
      return true;
    } catch (e) {
      console.warn('🎵 [AUDIO CONTEXT] Failed to resume audio context:', e);
      return false;
    }
  }
  
  return audioContext.state === 'running';
};

// iOS compatibility detection
const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};


interface Track {
  id: string;
  title: string;
  description: string;
  duration: number;
  audioUrl: string;
  defaultBackgroundMusic?: string; // ID of the default background music track
}



const mockTracks: Track[] = [
  {
    id: "1",
    title: "Breath Between The Worlds",
    description: "The liminal rhythm where inhale becomes exhale, and two dimensions press softly together at the seam.",
    duration: 188,
    audioUrl: "/audio/Breath Between The Worlds.mp3",
  },
  {
    id: "2",
    title: "Celestia I",
    description: "First passage through the outer vault — light bending around ancient stars as consciousness unfolds toward the infinite.",
    duration: 469,
    audioUrl: "/audio/Celestia I.mp3",
  },
  {
    id: "3",
    title: "Celestia II",
    description: "The second arc deeper into luminous fields, where the sky forgets its own edges and becomes pure frequency.",
    duration: 244,
    audioUrl: "/audio/Celestia II.mp3",
  },
  {
    id: "4",
    title: "Driving 111",
    description: "A hypnotic pulse through infinite corridors of neon and stardust, where velocity itself becomes a form of meditation.",
    duration: 367,
    audioUrl: "/audio/Driving 111.mp3",
  },
  {
    id: "5",
    title: "Eros Orchard",
    description: "A garden blooming at the edge of desire and creation, where sacred fruit falls upward into the arms of the cosmos.",
    duration: 230,
    audioUrl: "/audio/Eros Orchard.mp3",
  },
  {
    id: "6",
    title: "In reach of meaning",
    description: "Fingers outstretched toward the ineffable — that trembling, suspended moment just before understanding arrives.",
    duration: 217,
    audioUrl: "/audio/In reach of meaning.mp3",
  },
  {
    id: "7",
    title: "Knocking at Heaven",
    description: "A gentle percussion against the membrane of the infinite, reverberating outward through galaxies waiting to open.",
    duration: 203,
    audioUrl: "/audio/Knocking at Heaven.mp3",
  },
  {
    id: "8",
    title: "Kosmographica",
    description: "The living atlas of the universe — each beat a continent, each melody a star system charted in pure sound.",
    duration: 317,
    audioUrl: "/audio/Kosmographica.mp3",
  },
  {
    id: "9",
    title: "Life is Vibration",
    description: "The fundamental truth humming beneath all matter — atoms, minds, and stars all singing the same secret frequency.",
    duration: 323,
    audioUrl: "/audio/Life is Vibration.mp3",
  },
  {
    id: "10",
    title: "Light in mind",
    description: "Photons threading through neural corridors, illuminating the vast interior landscape of awareness one synapse at a time.",
    duration: 264,
    audioUrl: "/audio/Light in mind.mp3",
  },
  {
    id: "11",
    title: "Maxsoft",
    description: "Texture at the threshold of touch and thought — the softest frequency the cosmos can whisper without dissolving into silence.",
    duration: 214,
    audioUrl: "/audio/Maxsoft.mp3",
  },
  {
    id: "12",
    title: "Nondualizer",
    description: "A sonic dissolution of all boundaries, where subject and object merge into a single, seamless, flowing field.",
    duration: 279,
    audioUrl: "/audio/Nondualizer.mp3",
  },
  {
    id: "13",
    title: "On The Temple Roof",
    description: "Above the sacred chamber, the stars press close enough to hear — devotion rising like incense smoke into the dark.",
    duration: 282,
    audioUrl: "/audio/On The Temple Roof.mp3",
  },
  {
    id: "14",
    title: "Orbitron",
    description: "A precise and eternal mechanical orbit, gears turning inside planets turning inside the great clockwork of galaxies.",
    duration: 230,
    audioUrl: "/audio/Orbitron.mp3",
  },
  {
    id: "15",
    title: "Outworld",
    description: "Beyond the edge of every map, where frequency becomes geography and sound becomes the terrain of unexplored dimensions.",
    duration: 223,
    audioUrl: "/audio/Outworld.mp3",
  },
  {
    id: "16",
    title: "Panentheon",
    description: "A pantheon that holds all worlds within it — every deity a frequency, every prayer a waveform returned as melody.",
    duration: 369,
    audioUrl: "/audio/Panentheon.mp3",
  },
  {
    id: "17",
    title: "Putting down",
    description: "The sacred art of release — setting down the weight of accumulated time and drifting into weightless, boundless presence.",
    duration: 279,
    audioUrl: "/audio/Putting down.mp3",
  },
  {
    id: "18",
    title: "Rainbow Arrows",
    description: "Chromatic shafts of light launched across the sky, each wavelength a different prayer finding its mark in the dark.",
    duration: 329,
    audioUrl: "/audio/Rainbow Arrows.mp3",
  },
  {
    id: "19",
    title: "Rewinding Time",
    description: "The tape unspools backward through memory, through birth, through stardust and the first silence before the first sound.",
    duration: 196,
    audioUrl: "/audio/Rewinding Time.mp3",
  },
  {
    id: "20",
    title: "Signals from Somewhere",
    description: "Transmissions arriving from coordinates unknown — meaning encoded in the luminous space between notes.",
    duration: 243,
    audioUrl: "/audio/Signals from Somewhere.mp3",
  },
  {
    id: "21",
    title: "Starfields in Bloom",
    description: "A garden of suns flowering across the dark, pollinated by wandering comets and the slow breath of cosmic wind.",
    duration: 300,
    audioUrl: "/audio/Starfields in Bloom.mp3",
  },
  {
    id: "22",
    title: "Stone Circuits",
    description: "Ancient architecture pulsing with electricity — the lithic and the digital converging across a billion years of time.",
    duration: 300,
    audioUrl: "/audio/Stone Circuits.mp3",
  },
  {
    id: "23",
    title: "Stratomind",
    description: "A mind expanded to the curvature of a stratosphere, dreaming in weather systems and tectonic whispers.",
    duration: 268,
    audioUrl: "/audio/Stratomind.mp3",
  },
  {
    id: "24",
    title: "Textures of feelings",
    description: "The tactile surface of emotion — each sensation a different fabric woven from the threads of lived light.",
    duration: 252,
    audioUrl: "/audio/Textures of feelings.mp3",
  },
  {
    id: "25",
    title: "There is a voice in you",
    description: "The inner resonance that never ceases — older than memory, quieter than silence, vaster than any sky.",
    duration: 259,
    audioUrl: "/audio/There is a voice in you.mp3",
  },
  {
    id: "26",
    title: "息がある。(Iki ga aru) — There is Breath",
    description: "The Japanese art of breath as being — every exhalation a universe released, every inhalation a cosmos born.",
    duration: 252,
    audioUrl: "/audio/息がある。(Iki ga aru)  There is Breath.mp3",
  },
];

// macOS HFS+/APFS stores filenames in Unicode NFD (decomposed) form.
// Browsers send URLs in NFC form, so the server can't match the file.
// Normalizing to NFD before assigning audio.src makes the encoded bytes match.
const resolveAudioUrl = (url: string): string => url.normalize('NFD');

interface AudioPlayerProps {
  initialTrackIndex?: number;
}

export function AudioPlayer({ initialTrackIndex = 0 }: AudioPlayerProps) {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(initialTrackIndex);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [backgroundMusic, setBackgroundMusic] = useState<string | null>(null);
  const [isBackgroundMusicPlaying, setIsBackgroundMusicPlaying] = useState(true);
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(0.2);
  const [selectedBackgroundTrack, setSelectedBackgroundTrack] = useState<string | null>(null);
  const [lastPlayingBackgroundTrack, setLastPlayingBackgroundTrack] = useState<string | null>(null);
  const [autoActivateBackgroundMusic, setAutoActivateBackgroundMusic] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCaptionsActive, setIsCaptionsActive] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [mobileSafariBottomPadding, setMobileSafariBottomPadding] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const backgroundGainNodeRef = useRef<GainNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const backgroundAudioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // iOS background playback refs
  const iosAudioContextRef = useRef<AudioContext | null>(null);
  const iosMixedAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const iosMediaStreamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const iosVoiceGainRef = useRef<GainNode | null>(null);
  const iosMusicGainRef = useRef<GainNode | null>(null);
  const iosMasterGainRef = useRef<GainNode | null>(null);
  const iosVoiceSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const iosMusicSourceRef = useRef<MediaElementAudioSourceNode | null>(null);


  const track = mockTracks[currentTrack];

  // Show welcome modal on first load
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (hasSeenWelcome !== 'true') {
      setIsWelcomeModalOpen(true);
    }
  }, []);

  // iOS background playback setup
  const setupIOSAudioMixing = useCallback(() => {
    if (!isIOS()) return;
    
    try {
      // Create iOS audio context
      iosAudioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Create mixed audio element for iOS
      iosMixedAudioElementRef.current = document.createElement('audio');
      iosMixedAudioElementRef.current.controls = false;
      iosMixedAudioElementRef.current.preload = 'auto';
      iosMixedAudioElementRef.current.crossOrigin = 'anonymous';
      (iosMixedAudioElementRef.current as any).playsInline = true;
      
      // Create media stream destination
      iosMediaStreamDestRef.current = iosAudioContextRef.current.createMediaStreamDestination();
      iosMixedAudioElementRef.current.srcObject = iosMediaStreamDestRef.current.stream;
      
      // Create gain nodes
      iosVoiceGainRef.current = iosAudioContextRef.current.createGain();
      iosMusicGainRef.current = iosAudioContextRef.current.createGain();
      iosMasterGainRef.current = iosAudioContextRef.current.createGain();
      
      // Connect audio sources
      const audio = audioRef.current;
      const backgroundAudio = backgroundAudioRef.current;
      
      if (audio) {
        iosVoiceSourceRef.current = iosAudioContextRef.current!.createMediaElementSource(audio);
        iosVoiceSourceRef.current.connect(iosVoiceGainRef.current!);
      }
      
      if (backgroundAudio) {
        iosMusicSourceRef.current = iosAudioContextRef.current!.createMediaElementSource(backgroundAudio);
        iosMusicSourceRef.current.connect(iosMusicGainRef.current!);
      }
      
      // Connect to master gain and destination
      iosVoiceGainRef.current!.connect(iosMasterGainRef.current!);
      iosMusicGainRef.current!.connect(iosMasterGainRef.current!);
      iosMasterGainRef.current!.connect(iosMediaStreamDestRef.current!);
      
      // Set initial volumes
      iosVoiceGainRef.current!.gain.value = volume;
      iosMusicGainRef.current!.gain.value = backgroundMusicVolume;
      iosMasterGainRef.current!.gain.value = 1.0;
      
      console.log('🍎 [iOS AUDIO] Audio mixing setup complete');
    } catch (error) {
      console.warn('🍎 [iOS AUDIO] Failed to setup audio mixing:', error);
    }
  }, [volume, backgroundMusicVolume]);

  // Setup Web Audio API for mobile volume control - simplified approach
  const setupWebAudioVolume = useCallback(() => {
    const audio = audioRef.current;
    const backgroundAudio = backgroundAudioRef.current;
    
    try {
      const audioContext = getAudioContext();
      if (!audioContext) {
        console.log('🎵 [VOLUME] AudioContext not available, using HTML5 audio controls');
        return;
      }

      // Ensure audio context is running
      if (audioContext.state === 'suspended') {
        console.log('🎵 [VOLUME] AudioContext suspended, will resume on user interaction');
        return;
      }

      // Setup main audio gain node (only if not already set up)
      if (audio && !audioSourceRef.current) {
        try {
          const source = audioContext.createMediaElementSource(audio);
          const gainNode = audioContext.createGain();
          
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          audioSourceRef.current = source;
          gainNodeRef.current = gainNode;
          gainNode.gain.value = volume;
          
          console.log('🎵 [VOLUME] Main audio Web Audio API setup complete');
        } catch (error) {
          console.warn('🎵 [VOLUME] Main audio Web Audio setup failed:', error);
        }
      }

      // Setup background audio gain node (only if not already set up)
      if (backgroundAudio && !backgroundAudioSourceRef.current) {
        try {
          const bgSource = audioContext.createMediaElementSource(backgroundAudio);
          const bgGainNode = audioContext.createGain();
          
          bgSource.connect(bgGainNode);
          bgGainNode.connect(audioContext.destination);
          
          backgroundAudioSourceRef.current = bgSource;
          backgroundGainNodeRef.current = bgGainNode;
          bgGainNode.gain.value = backgroundMusicVolume * volume;
          
          console.log('🎵 [VOLUME] Background audio Web Audio API setup complete');
        } catch (error) {
          console.warn('🎵 [VOLUME] Background audio Web Audio setup failed:', error);
        }
      }
    } catch (error) {
      console.warn('🎵 [VOLUME] Web Audio API setup failed, falling back to HTML5 audio:', error);
    }
  }, [volume, backgroundMusicVolume]);


  // Debug: Track isPlaying state changes
  useEffect(() => {
    console.log('🎵 [AUDIO SYNC] isPlaying state changed to:', isPlaying, 'at', new Date().toISOString());
  }, [isPlaying]);

  // Debug: Track currentTrack changes
  useEffect(() => {
    console.log('🎵 [AUDIO SYNC] currentTrack changed to:', currentTrack, 'track:', track.title, 'at', new Date().toISOString());
  }, [currentTrack, track.title]);

  // Initialize audio element with initial track
  useEffect(() => {
    const audio = audioRef.current;
    console.log('🎵 [AUDIO SYNC] Initializing audio element:', {
      hasAudio: !!audio,
      currentSrc: audio?.src,
      expectedSrc: track.audioUrl,
      trackTitle: track.title,
      trackIndex: currentTrack,
      timestamp: new Date().toISOString()
    });
    
    if (audio && !audio.src) {
      console.log('🎵 [AUDIO SYNC] Setting initial audio source and loading');
      audio.src = resolveAudioUrl(track.audioUrl);
      audio.load();
      
      // Mobile browser optimization: preload metadata
      audio.preload = 'metadata';
      
      // Add mobile-specific audio attributes
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      
      console.log('🎵 [AUDIO SYNC] Audio element initialized:', {
        src: audio.src,
        preload: audio.preload,
        playsinline: audio.getAttribute('playsinline'),
        webkitPlaysinline: audio.getAttribute('webkit-playsinline'),
        timestamp: new Date().toISOString()
      });
    } else if (audio && audio.src) {
      console.log('🎵 [AUDIO SYNC] Audio element already has source:', {
        src: audio.src,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('🎵 [AUDIO SYNC] Audio element not found during initialization');
    }
  }, []); // Run once on mount

  // Hide horizontal scrollbar for controls
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .flex.items-center.gap-1.md\\:gap-2.flex-nowrap.overflow-x-auto::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Simplified mobile audio initialization
  useEffect(() => {
    const initMobileAudio = () => {
      const audio = audioRef.current;
      const backgroundAudio = backgroundAudioRef.current;
      
      if (audio) {
        // Set essential mobile attributes
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
        audio.preload = 'metadata'; // Changed from 'auto' to reduce memory usage
        audio.crossOrigin = 'anonymous';
        
        // Set volume via HTML5 audio (fallback for when Web Audio isn't available)
        audio.volume = volume;
        
        console.log('📱 [MOBILE AUDIO] Main audio initialized for mobile');
      }
      
      if (backgroundAudio) {
        // Set essential mobile attributes for background music
        backgroundAudio.setAttribute('playsinline', 'true');
        backgroundAudio.setAttribute('webkit-playsinline', 'true');
        backgroundAudio.preload = 'metadata';
        backgroundAudio.crossOrigin = 'anonymous';
        backgroundAudio.loop = true;
        
        // Set volume via HTML5 audio (fallback)
        backgroundAudio.volume = backgroundMusicVolume * volume;
        
        console.log('📱 [MOBILE AUDIO] Background audio initialized for mobile');
      }
    };

    initMobileAudio();
    
    // Setup Web Audio API for volume control after user interaction
    if (hasUserInteracted) {
      setupWebAudioVolume();
      // Setup iOS audio mixing for background playback compatibility
      setupIOSAudioMixing();
    }
  }, [hasUserInteracted, volume, backgroundMusicVolume, setupWebAudioVolume, setupIOSAudioMixing]);

  // Consolidated audio event handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const newTime = audio.currentTime;
      console.log('🎵 [AUDIO SYNC] timeupdate event:', {
        currentTime: newTime,
        duration: audio.duration,
        readyState: audio.readyState,
        paused: audio.paused,
        timestamp: new Date().toISOString()
      });
      setCurrentTime(newTime);
    };
    
    const updateDuration = () => {
      console.log('🎵 [AUDIO SYNC] loadedmetadata event:', {
        duration: audio.duration,
        src: audio.src,
        readyState: audio.readyState,
        timestamp: new Date().toISOString()
      });
      setDuration(audio.duration);
    };
    
    const handlePlay = () => {
      console.log('🎵 [AUDIO SYNC] play event fired:', {
        currentTime: audio.currentTime,
        duration: audio.duration,
        src: audio.src,
        readyState: audio.readyState,
        timestamp: new Date().toISOString()
      });
      setIsPlaying(true);
      
      // Track audio play event with enhanced context
      const trackSlug = getTrackSlug(currentTrack);
      trackAudioPlayWithContext(
        track.title, 
        trackSlug, 
        currentTrack, 
        audio.duration,
        'user_click'
      );
    };
    
    const handlePause = () => {
      console.log('🎵 [AUDIO SYNC] pause event fired:', {
        currentTime: audio.currentTime,
        duration: audio.duration,
        src: audio.src,
        timestamp: new Date().toISOString()
      });
      setIsPlaying(false);
      
      // Track audio pause event
      trackAudioPause(track.title, currentTrack, audio.currentTime);
    };
    
    const handleEnded = () => {
      console.log('🎵 [AUDIO SYNC] ended event fired', { isShuffle, isLoop, currentTrack });
      if (isShuffle) {
        const randomIndex = getRandomNextTrack(currentTrack);
        handleNext(true, randomIndex);
      } else {
        handleNext(true);
      }
    };
    
    const handleError = (e: Event) => {
      console.error('🎵 [AUDIO SYNC] Audio error event:', {
        error: e,
        src: audio.src,
        readyState: audio.readyState,
        timestamp: new Date().toISOString()
      });
    };
    
    const handleLoadStart = () => {
      console.log('🎵 [AUDIO SYNC] loadstart event:', {
        src: audio.src,
        readyState: audio.readyState,
        timestamp: new Date().toISOString()
      });
    };
    
    const handleCanPlay = () => {
      console.log('🎵 [AUDIO SYNC] canplay event:', {
        src: audio.src,
        readyState: audio.readyState,
        duration: audio.duration,
        timestamp: new Date().toISOString()
      });
    };
    
    const handleCanPlayThrough = () => {
      console.log('🎵 [AUDIO SYNC] canplaythrough event:', {
        src: audio.src,
        readyState: audio.readyState,
        duration: audio.duration,
        timestamp: new Date().toISOString()
      });
    };

    // Add all event listeners
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [currentTrack, isShuffle, isLoop]); // Removed isPlaying dependency to prevent listener recreation

  // Handle background music playback and volume
  useEffect(() => {
    const backgroundAudio = backgroundAudioRef.current;
    
    console.log('🎵 [AUDIO SYNC] Background music effect triggered:', {
      hasBackgroundAudio: !!backgroundAudio,
      isBackgroundMusicPlaying,
      backgroundMusic,
      isPlaying, // CRITICAL: Check if main audio is playing
      backgroundAudioSrc: backgroundAudio?.src,
      backgroundAudioPaused: backgroundAudio?.paused,
      backgroundAudioCurrentTime: backgroundAudio?.currentTime,
      backgroundAudioReadyState: backgroundAudio?.readyState,
      timestamp: new Date().toISOString()
    });
    
    if (!backgroundAudio) {
      console.warn('🎵 [AUDIO SYNC] Background audio element not found');
      return;
    }

    // CRITICAL FIX: Background music should only play when main audio is playing
    if (isBackgroundMusicPlaying && backgroundMusic && isPlaying) {
      console.log('🎵 [AUDIO SYNC] Attempting to play background music (main audio is playing):', {
        src: backgroundAudio.src,
        readyState: backgroundAudio.readyState,
        currentTime: backgroundAudio.currentTime,
        paused: backgroundAudio.paused,
        mainAudioPlaying: isPlaying,
        isBackgroundMusicPlaying,
        backgroundMusic,
        timestamp: new Date().toISOString()
      });
      
      // Don't set volume here - let the volume handlers manage it
      // backgroundAudio.volume = volume * backgroundMusicVolume;
      backgroundAudio.play().then(() => {
        console.log('🎵 [AUDIO SYNC] Background music play() promise resolved:', {
          src: backgroundAudio.src,
          currentTime: backgroundAudio.currentTime,
          paused: backgroundAudio.paused,
          timestamp: new Date().toISOString()
        });
      }).catch((error) => {
        console.error('🎵 [AUDIO SYNC] Background music play() failed:', {
          error,
          src: backgroundAudio.src,
          readyState: backgroundAudio.readyState,
          timestamp: new Date().toISOString()
        });
      });
    } else {
      console.log('🎵 [AUDIO SYNC] Pausing background music:', {
        reason: !isBackgroundMusicPlaying ? 'isBackgroundMusicPlaying is false' : 
                !backgroundMusic ? 'no backgroundMusic' : 
                !isPlaying ? 'main audio is not playing' : 'unknown',
        src: backgroundAudio.src,
        currentTime: backgroundAudio.currentTime,
        mainAudioPlaying: isPlaying,
        isBackgroundMusicPlaying,
        backgroundMusic,
        timestamp: new Date().toISOString()
      });
      backgroundAudio.pause();
    }
  }, [backgroundMusic, isBackgroundMusicPlaying, isPlaying]); // Added isPlaying dependency

  // Ensure volume is properly applied to audio elements
  useEffect(() => {
    const audio = audioRef.current;
    const backgroundAudio = backgroundAudioRef.current;

    // Update main audio volume
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(volume, getAudioContext()?.currentTime || 0);
        console.log('🎵 [VOLUME] Main volume updated via Web Audio API:', volume);
      } catch (error) {
        console.warn('🎵 [VOLUME] Web Audio API volume update failed:', error);
      }
    }

    if (audio) {
      try {
        audio.volume = volume;
        console.log('🎵 [VOLUME] Main volume updated via HTML5 audio:', volume);
      } catch (error) {
        console.warn('🎵 [VOLUME] HTML5 volume update failed:', error);
      }
    }

    // Update background music volume
    if (backgroundAudio && backgroundMusic) {
      const bgVolume = volume * backgroundMusicVolume;
      
      if (backgroundGainNodeRef.current) {
        try {
          backgroundGainNodeRef.current.gain.setValueAtTime(bgVolume, getAudioContext()?.currentTime || 0);
          console.log('🎵 [VOLUME] Background volume updated via Web Audio API:', bgVolume);
        } catch (error) {
          console.warn('🎵 [VOLUME] Background Web Audio API volume update failed:', error);
        }
      }

      try {
        backgroundAudio.volume = bgVolume;
        console.log('🎵 [VOLUME] Background volume updated via HTML5 audio:', bgVolume);
      } catch (error) {
        console.warn('🎵 [VOLUME] Background HTML5 volume update failed:', error);
      }
    }
  }, [volume, backgroundMusicVolume, backgroundMusic]);

  // Cleanup Web Audio nodes on unmount
  useEffect(() => {
    return () => {
      try {
        if (audioSourceRef.current) {
          audioSourceRef.current.disconnect();
          audioSourceRef.current = null;
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.disconnect();
          gainNodeRef.current = null;
        }
        if (backgroundAudioSourceRef.current) {
          backgroundAudioSourceRef.current.disconnect();
          backgroundAudioSourceRef.current = null;
        }
        if (backgroundGainNodeRef.current) {
          backgroundGainNodeRef.current.disconnect();
          backgroundGainNodeRef.current = null;
        }
        
        // iOS audio cleanup
        if (iosMixedAudioElementRef.current) {
          iosMixedAudioElementRef.current.remove();
          iosMixedAudioElementRef.current = null;
        }
        if (iosAudioContextRef.current) {
          iosAudioContextRef.current.close();
          iosAudioContextRef.current = null;
        }
        iosMediaStreamDestRef.current = null;
        iosVoiceGainRef.current = null;
        iosMusicGainRef.current = null;
        iosMasterGainRef.current = null;
        iosVoiceSourceRef.current = null;
        iosMusicSourceRef.current = null;
        
        console.log('🎵 [VOLUME] Web Audio nodes cleaned up');
      } catch (error) {
        console.warn('🎵 [VOLUME] Error cleaning up Web Audio nodes:', error);
      }
    };
  }, []);

  // Background music auto-activation disabled for Lofinity (pure music player)
  // useEffect(() => {
  //   if (isBackgroundMusicPlaying && !backgroundMusic && hasUserInteracted) {
  //     activateDefaultBackgroundMusic(0);
  //   }
  // }, [hasUserInteracted]);

  // Captions disabled for Lofinity (pure music player)
  // useEffect(() => {
  //   const loadCaptions = async () => { ... };
  //   loadCaptions();
  // }, [currentTrack]);



  // Update URL on initial load if we have an initial track index
  useEffect(() => {
    if (initialTrackIndex > 0) {
      updateTrackUrl(initialTrackIndex);
    }
  }, [initialTrackIndex]);

  // Mobile Safari bottom bar detection - Conservative approach
  useEffect(() => {
    const detectMobileSafariBottomBar = () => {
      if (typeof window === 'undefined') return;
      
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) return;
      
      // Get viewport height
      const viewportHeight = window.innerHeight;
      const screenHeight = window.screen.height;
      
      // Calculate how much space is taken by browser UI
      const browserUIHeight = screenHeight - viewportHeight;
      
      // Very conservative estimation - only add padding if we detect significant browser UI
      let safePadding = 0;
      
      if (browserUIHeight > 20) {
        // Only add padding if there's significant browser UI detected
        // Use a much smaller multiplier and cap the maximum
        safePadding = Math.min(browserUIHeight * 0.3, 16); // Max 16px, 30% of detected UI
      }
      
      // Add minimal base padding only if we detected browser UI
      if (safePadding > 0) {
        safePadding += 16; // Just 1rem (16px) extra for safety
      }
      
      console.log('📱 [MOBILE SAFARI] Conservative bottom bar detection:', {
        viewportHeight,
        screenHeight,
        browserUIHeight,
        safePadding,
        timestamp: new Date().toISOString()
      });
      
      setMobileSafariBottomPadding(safePadding);
    };

    // Initial detection
    detectMobileSafariBottomBar();
    
    // Listen for viewport changes (when Safari bars show/hide)
    const handleResize = () => {
      // Debounce resize events
      clearTimeout(window.mobileSafariResizeTimeout);
      window.mobileSafariResizeTimeout = setTimeout(detectMobileSafariBottomBar, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(window.mobileSafariResizeTimeout);
    };
  }, []);



  // Page visibility change handling for background playback
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      
      console.log('📱 [BACKGROUND PLAYBACK] Page visibility changed:', {
        isVisible,
        isPlaying,
        timestamp: new Date().toISOString()
      });

      // Don't pause audio when page becomes hidden (background playback)
      if (!isVisible && isPlaying) {
        console.log('📱 [BACKGROUND PLAYBACK] Page hidden but audio continues playing');
      }
    };

    const handlePageHide = () => {
      console.log('📱 [BACKGROUND PLAYBACK] Page hide event - audio should continue');
    };

    const handlePageShow = () => {
      console.log('📱 [BACKGROUND PLAYBACK] Page show event - audio should continue');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isPlaying]);

  // Media Session API for background playback (better than Wake Lock for audio)
  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      console.log('📱 [MEDIA SESSION] Media Session API not supported');
      return;
    }

    try {
      // Set media metadata
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: 'Lofinity',
        album: 'Lofi Hip Hop',
        artwork: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      // Set playback state
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      // Set action handlers for media controls
      navigator.mediaSession.setActionHandler('play', async () => {
        console.log('📱 [MEDIA SESSION] Play action triggered');
        if (!isPlaying) {
          await togglePlay();
        }
      });

      navigator.mediaSession.setActionHandler('pause', async () => {
        console.log('📱 [MEDIA SESSION] Pause action triggered');
        if (isPlaying) {
          await togglePlay();
        }
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('📱 [MEDIA SESSION] Previous track action triggered');
        handlePrevious(isPlaying);
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('📱 [MEDIA SESSION] Next track action triggered');
        handleNext(isPlaying);
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        console.log('📱 [MEDIA SESSION] Seek backward action triggered', details);
        const audio = audioRef.current;
        if (audio) {
          const seekTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
          audio.currentTime = seekTime;
          setCurrentTime(seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        console.log('📱 [MEDIA SESSION] Seek forward action triggered', details);
        const audio = audioRef.current;
        if (audio) {
          const seekTime = Math.min(audio.duration, audio.currentTime + (details.seekOffset || 10));
          audio.currentTime = seekTime;
          setCurrentTime(seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        console.log('📱 [MEDIA SESSION] Seek to action triggered', details);
        const audio = audioRef.current;
        if (audio && details.seekTime !== undefined) {
          audio.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });

      // Set position state for scrubbing
      if (isPlaying && duration > 0) {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1.0,
          position: currentTime
        });
      }

      console.log('📱 [MEDIA SESSION] Media session configured for background playback');
    } catch (error) {
      console.warn('📱 [MEDIA SESSION] Failed to configure media session:', error);
    }
  }, [track.title, isPlaying, duration, currentTime]);

  // Centralized function to stop all audio playback
  const stopAllAudio = () => {
    console.log('🎵 [AUDIO SYNC] stopAllAudio called:', {
      currentTrack,
      trackTitle: track.title,
      isPlaying,
      currentTime,
      audioSrc: audioRef.current?.src,
      audioCurrentTime: audioRef.current?.currentTime,
      audioPaused: audioRef.current?.paused,
      backgroundMusic,
      backgroundAudioSrc: backgroundAudioRef.current?.src,
      backgroundAudioCurrentTime: backgroundAudioRef.current?.currentTime,
      backgroundAudioPaused: backgroundAudioRef.current?.paused,
      timestamp: new Date().toISOString()
    });
    
    // Stop main audio
    const audio = audioRef.current;
    if (audio) {
      console.log('🎵 [AUDIO SYNC] Stopping main audio:', {
        src: audio.src,
        currentTime: audio.currentTime,
        paused: audio.paused,
        readyState: audio.readyState,
        timestamp: new Date().toISOString()
      });
      audio.pause();
      audio.currentTime = 0;
    } else {
      console.warn('🎵 [AUDIO SYNC] Main audio element not found in stopAllAudio');
    }
    
    // Stop background audio
    const backgroundAudio = backgroundAudioRef.current;
    if (backgroundAudio) {
      console.log('🎵 [AUDIO SYNC] Stopping background audio:', {
        src: backgroundAudio.src,
        currentTime: backgroundAudio.currentTime,
        paused: backgroundAudio.paused,
        readyState: backgroundAudio.readyState,
        timestamp: new Date().toISOString()
      });
      backgroundAudio.pause();
      backgroundAudio.currentTime = 0;
    } else {
      console.log('🎵 [AUDIO SYNC] Background audio element not found in stopAllAudio');
    }
    
    // Update state to reflect stopped audio
    console.log('🎵 [AUDIO SYNC] Updating state to reflect stopped audio');
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('🎵 [AUDIO SYNC] togglePlay called:', {
      isPlaying,
      currentTrack,
      trackTitle: track.title,
      audioSrc: audio.src,
      audioReadyState: audio.readyState,
      audioCurrentTime: audio.currentTime,
      audioPaused: audio.paused,
      backgroundMusic,
      isBackgroundMusicPlaying,
      timestamp: new Date().toISOString()
    });

    // Mark that user has interacted with audio
    setHasUserInteracted(true);

    // Resume audio context if suspended (important for mobile)
    const contextResumed = await resumeAudioContext();

    if (isPlaying) {
      console.log('🎵 [AUDIO SYNC] Pausing audio and background music');
      // Pause current audio and background music
      audio.pause();
      
      // iOS: Pause mixed audio element
      if (isIOS() && iosMixedAudioElementRef.current) {
        iosMixedAudioElementRef.current.pause();
      }
      
      setIsPlaying(false);
      
      // Background music will automatically pause due to the useEffect that watches isPlaying
      // The useEffect will handle pausing background music when isPlaying becomes false
      console.log('🎵 [AUDIO SYNC] Background music will sync with main audio pause via useEffect');
    } else {
      console.log('🎵 [AUDIO SYNC] Starting audio playback');
      
      // Ensure audio has the correct source.
      // audio.src returns an absolute URL; compare decoded pathnames after NFD-normalizing
      // both sides so macOS filesystem encoding (NFD) matches the URL bytes.
      const resolvedUrl = resolveAudioUrl(track.audioUrl);
      const currentPathname = audio.src
        ? decodeURIComponent(new URL(audio.src).pathname)
        : null;
      if (currentPathname !== resolvedUrl) {
        console.log('🎵 [AUDIO SYNC] Audio source mismatch, updating:', {
          currentSrc: audio.src,
          expectedSrc: resolvedUrl,
          timestamp: new Date().toISOString()
        });
        audio.src = resolvedUrl;
        audio.load();
      }

      const playAudio = () => {
        console.log('🎵 [AUDIO SYNC] playAudio function called:', {
          audioReadyState: audio.readyState,
          audioSrc: audio.src,
          audioCurrentTime: audio.currentTime,
          currentTimeState: currentTime,
          timestamp: new Date().toISOString()
        });

        // If the audio element is in an error state (e.g. 404 on initial preload),
        // reset and reload with the correct NFD-normalized URL before attempting play.
        if (audio.error) {
          console.log('🎵 [AUDIO SYNC] Audio in error state, resetting src and reloading');
          audio.src = resolveAudioUrl(track.audioUrl);
          audio.load();
        }

        // Do NOT unconditionally call audio.load() here — calling it while a load
        // is already in progress aborts the fetch and causes NotSupportedError.

        if (audio.currentTime !== currentTime) {
          console.log('🎵 [AUDIO SYNC] Setting audio position to user-selected time:', {
            audioCurrentTime: audio.currentTime,
            userSelectedTime: currentTime,
            timestamp: new Date().toISOString()
          });
          audio.currentTime = currentTime;
        }
        
        setIsPlaying(true);
        
        audio.play().then(async () => {
          console.log('🎵 [AUDIO SYNC] Main audio play() promise resolved in togglePlay:', {
            audioCurrentTime: audio.currentTime,
            audioPaused: audio.paused,
            audioDuration: audio.duration,
            timestamp: new Date().toISOString()
          });
          
          // iOS: Play mixed audio element for background playback
          if (isIOS() && iosMixedAudioElementRef.current) {
            try {
              await iosMixedAudioElementRef.current.play();
              console.log('🍎 [iOS AUDIO] Mixed audio element playing');
            } catch (error) {
              console.warn('🍎 [iOS AUDIO] Failed to play mixed audio element:', error);
            }
          }
          
          console.log('🎵 [AUDIO SYNC] Background music will sync with main audio via useEffect');
        }).catch((error) => {
          console.error('🎵 [AUDIO SYNC] Audio play failed in togglePlay:', error);
          setIsPlaying(false);
          
          // Retry once the audio is actually ready rather than forcing another load(),
          // which would abort the in-progress fetch and repeat the error.
          const retryPlay = () => {
            audio.removeEventListener('canplay', retryPlay);
            audio.play()
              .then(() => {
                console.log('🎵 [AUDIO SYNC] Audio retry successful in togglePlay');
                setIsPlaying(true);
              })
              .catch((retryError) => {
                console.error('🎵 [AUDIO SYNC] Audio retry play failed in togglePlay:', retryError);
                setIsPlaying(false);
              });
          };

          if (audio.readyState >= 2) {
            retryPlay();
          } else {
            audio.addEventListener('canplay', retryPlay);
          }
        });
      };

      // Always try to play immediately for better mobile experience
      playAudio();
    }
  };

  const handlePrevious = (autoPlay: boolean = false) => {
    const newTrackIndex = currentTrack === 0 ? mockTracks.length - 1 : currentTrack - 1;
    
    // Track track change event
    trackTrackChange(
      mockTracks[currentTrack].title,
      mockTracks[newTrackIndex].title,
      currentTrack,
      newTrackIndex,
      autoPlay
    );
    
    // Stop all audio immediately using centralized function
    stopAllAudio();
    
    // Update track state immediately
    setCurrentTrack(newTrackIndex);
    updateTrackUrl(newTrackIndex);
    
    // Load and potentially play the new track
    const audio = audioRef.current;
    if (audio) {
      // Set new audio source immediately
      audio.src = resolveAudioUrl(mockTracks[newTrackIndex].audioUrl);
      audio.load();
      
      // Mark user interaction for mobile browsers
      setHasUserInteracted(true);
      
      // Only auto-play if explicitly requested (like when a track ends naturally)
      // Do NOT auto-play when user manually clicks next/previous buttons
      if (autoPlay) {
        const playPrevTrack = async () => {
          
          // Resume audio context if suspended (important for mobile)
          await resumeAudioContext();
          
          audio.play().then(() => {
            console.log('🎵 [AUDIO SYNC] Previous track play() promise resolved successfully:', {
              audioCurrentTime: audio.currentTime,
              audioPaused: audio.paused,
              audioDuration: audio.duration,
              timestamp: new Date().toISOString()
            });
            
            // CRITICAL FIX: Explicitly set isPlaying state since play event listener might not fire immediately
            setIsPlaying(true);
            console.log('🎵 [AUDIO SYNC] Explicitly set isPlaying to true after successful previous track play');
            
            // Handle background music for the new track
            if (isBackgroundMusicPlaying) {
              activateDefaultBackgroundMusic(newTrackIndex);
            }
          }).catch((error) => {
            console.error('Previous track play failed:', error);
            setIsPlaying(false);
          });
        };
        
        // Check if audio is ready to play, or wait for it
        if (audio.readyState >= 2) {
          playPrevTrack();
        } else {
          const handleCanPlay = () => {
            audio.removeEventListener('canplay', handleCanPlay);
            playPrevTrack();
          };
          audio.addEventListener('canplay', handleCanPlay);
        }
      }
    }
  };

  const handleNext = (autoPlay: boolean = false, targetIndex?: number) => {
    const newTrackIndex = targetIndex !== undefined
      ? targetIndex
      : (currentTrack === mockTracks.length - 1 ? 0 : currentTrack + 1);
    
    console.log('🎵 [AUDIO SYNC] handleNext called:', {
      autoPlay,
      currentTrack,
      newTrackIndex,
      currentTrackTitle: mockTracks[currentTrack]?.title,
      newTrackTitle: mockTracks[newTrackIndex]?.title,
      isPlaying,
      currentTime,
      audioReadyState: audioRef.current?.readyState,
      audioSrc: audioRef.current?.src,
      backgroundMusic,
      isBackgroundMusicPlaying,
      timestamp: new Date().toISOString()
    });
    
    // Track track change event
    trackTrackChange(
      mockTracks[currentTrack].title,
      mockTracks[newTrackIndex].title,
      currentTrack,
      newTrackIndex,
      autoPlay
    );
    
    // Stop all audio immediately using centralized function
    stopAllAudio();
    
    // Update track state immediately
    setCurrentTrack(newTrackIndex);
    updateTrackUrl(newTrackIndex);
    
    console.log('🎵 [AUDIO SYNC] Track state updated:', {
      newTrackIndex,
      newTrackUrl: mockTracks[newTrackIndex]?.audioUrl,
      timestamp: new Date().toISOString()
    });
    
    // Load and potentially play the new track
    const audio = audioRef.current;
    if (audio) {
      // Set new audio source immediately
      audio.src = resolveAudioUrl(mockTracks[newTrackIndex].audioUrl);
      audio.load();
      
      console.log('🎵 [AUDIO SYNC] Audio source set and loaded:', {
        newSrc: audio.src,
        readyState: audio.readyState,
        timestamp: new Date().toISOString()
      });
      
      // Mark user interaction for mobile browsers
      setHasUserInteracted(true);
      
      // Only auto-play if explicitly requested (like when a track ends naturally)
      // Do NOT auto-play when user manually clicks next/previous buttons
      if (autoPlay) {
        console.log('🎵 [AUDIO SYNC] Auto-play requested, preparing to play next track');
        
        const playNextTrack = async () => {
          console.log('🎵 [AUDIO SYNC] playNextTrack function called:', {
            audioReadyState: audio.readyState,
            audioSrc: audio.src,
            audioCurrentTime: audio.currentTime,
            audioPaused: audio.paused,
            timestamp: new Date().toISOString()
          });
          
          // Resume audio context if suspended (important for mobile)
          await resumeAudioContext();
          
          console.log('🎵 [AUDIO SYNC] Attempting to play audio...');
          audio.play().then(() => {
            console.log('🎵 [AUDIO SYNC] Audio play() promise resolved successfully:', {
              audioCurrentTime: audio.currentTime,
              audioPaused: audio.paused,
              audioDuration: audio.duration,
              timestamp: new Date().toISOString()
            });
            
            // CRITICAL FIX: Explicitly set isPlaying state since play event listener might not fire immediately
            setIsPlaying(true);
            console.log('🎵 [AUDIO SYNC] Explicitly set isPlaying to true after successful play');
            
            // Force a small delay to ensure state update is processed
            setTimeout(() => {
              console.log('🎵 [AUDIO SYNC] State update verification - isPlaying should be true now');
            }, 100);
            
            // Handle background music for the new track
            if (isBackgroundMusicPlaying) {
              console.log('🎵 [AUDIO SYNC] Activating default background music for new track');
              activateDefaultBackgroundMusic(newTrackIndex);
            }
          }).catch((error) => {
            console.error('🎵 [AUDIO SYNC] Next track play failed:', error);
            setIsPlaying(false);
          });
        };
        
        // Check if audio is ready to play, or wait for it
        if (audio.readyState >= 2) {
          console.log('🎵 [AUDIO SYNC] Audio ready, calling playNextTrack immediately');
          playNextTrack();
        } else {
          console.log('🎵 [AUDIO SYNC] Audio not ready, waiting for canplay event');
          const handleCanPlay = () => {
            console.log('🎵 [AUDIO SYNC] canplay event fired, removing listener and playing');
            audio.removeEventListener('canplay', handleCanPlay);
            playNextTrack();
          };
          audio.addEventListener('canplay', handleCanPlay);
        }
      } else {
        console.log('🎵 [AUDIO SYNC] Auto-play not requested, track loaded but not playing');
      }
    } else {
      console.error('🎵 [AUDIO SYNC] Audio element not found!');
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Mark that user has interacted with audio
    setHasUserInteracted(true);
    
    const newTime = value[0];
    const previousTime = audio.currentTime;
    
    // Track seek event
    trackSeek(track.title, previousTime, newTime);
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const activateDefaultBackgroundMusic = (trackIndex: number) => {
    const track = mockTracks[trackIndex];
    
    console.log('🎵 [AUDIO SYNC] activateDefaultBackgroundMusic called:', {
      trackIndex,
      trackTitle: track.title,
      defaultBackgroundMusic: track.defaultBackgroundMusic,
      autoActivateBackgroundMusic,
      backgroundMusic,
      isBackgroundMusicPlaying,
      timestamp: new Date().toISOString()
    });
    
    if (track.defaultBackgroundMusic && autoActivateBackgroundMusic) {
      const bgTrack = backgroundMusicTracks.find(bg => bg.id === track.defaultBackgroundMusic);
      if (bgTrack) {
        console.log('🎵 [AUDIO SYNC] Found background track:', {
          bgTrackId: bgTrack.id,
          bgTrackTitle: bgTrack.title,
          bgTrackUrl: bgTrack.audioUrl,
          timestamp: new Date().toISOString()
        });
        
        // Only stop current background music if it's different from the new one
        const backgroundAudio = backgroundAudioRef.current;
        if (backgroundAudio && backgroundAudio.src !== bgTrack.audioUrl) {
          console.log('🎵 [AUDIO SYNC] Stopping current background music (different track):', {
            currentSrc: backgroundAudio.src,
            newSrc: bgTrack.audioUrl,
            currentTime: backgroundAudio.currentTime,
            paused: backgroundAudio.paused,
            timestamp: new Date().toISOString()
          });
          backgroundAudio.pause();
          backgroundAudio.currentTime = 0;
        } else if (backgroundAudio) {
          console.log('🎵 [AUDIO SYNC] Background music is already the same track, not stopping:', {
            currentSrc: backgroundAudio.src,
            timestamp: new Date().toISOString()
          });
        }
        
        // Set the new background music source
        setBackgroundMusic(bgTrack.audioUrl);
        setIsBackgroundMusicPlaying(true);
        setSelectedBackgroundTrack(bgTrack.id);
        
        console.log('🎵 [AUDIO SYNC] Background music state updated:', {
          newBackgroundMusic: bgTrack.audioUrl,
          isBackgroundMusicPlaying: true,
          selectedBackgroundTrack: bgTrack.id,
          timestamp: new Date().toISOString()
        });
        
        // Update the background audio element source
        if (backgroundAudio) {
          backgroundAudio.src = bgTrack.audioUrl;
          backgroundAudio.load();
          
          console.log('🎵 [AUDIO SYNC] Background audio element updated:', {
            newSrc: backgroundAudio.src,
            readyState: backgroundAudio.readyState,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.warn('🎵 [AUDIO SYNC] Background track not found:', track.defaultBackgroundMusic);
      }
    } else {
      console.log('🎵 [AUDIO SYNC] Skipping background music activation:', {
        hasDefaultBackgroundMusic: !!track.defaultBackgroundMusic,
        autoActivateBackgroundMusic,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleTrackSelect = (trackIndex: number) => {
    console.log('🎵 [AUDIO SYNC] Track selected from navigation:', {
      trackIndex,
      trackTitle: mockTracks[trackIndex]?.title,
      timestamp: new Date().toISOString()
    });
    
    // Track track selection with enhanced context
    const trackSlug = getTrackSlug(trackIndex);
    trackTrackSelect(mockTracks[trackIndex].title, trackIndex);
    
    // Stop all audio immediately using centralized function
    stopAllAudio();
    
    // Update track state immediately
    setCurrentTrack(trackIndex);
    setIsDrawerOpen(false); // Ensure drawer closes on mobile
    updateTrackUrl(trackIndex);
    
    // Load the new track but don't auto-play
    const audio = audioRef.current;
    if (audio) {
      const newAudioUrl = resolveAudioUrl(mockTracks[trackIndex].audioUrl);
      
      // Set the new audio source immediately
      audio.src = newAudioUrl;
      audio.load();
      
      // Mark that user has interacted (since they selected a track)
      setHasUserInteracted(true);
      
      console.log('🎵 [AUDIO SYNC] Track loaded but not auto-playing - user must press play button');
      
      // Activate default background music for the new track (but don't play it yet)
      if (isBackgroundMusicPlaying) {
        activateDefaultBackgroundMusic(trackIndex);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRandomNextTrack = (currentIndex: number): number => {
    if (mockTracks.length <= 1) return 0;
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * mockTracks.length);
    } while (randomIndex === currentIndex);
    return randomIndex;
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => {
      if (!prev) setIsLoop(false);
      return !prev;
    });
  };

  const toggleLoop = () => {
    setIsLoop(prev => {
      if (!prev) setIsShuffle(false);
      return !prev;
    });
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    const previousVolume = volume;
    
    // Track volume change event
    trackVolumeChange(newVolume, previousVolume);
    
    setVolume(newVolume);

    console.log('🎵 [VOLUME] Volume change requested:', newVolume);

    // Try Web Audio API first (works on mobile)
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(newVolume, getAudioContext()?.currentTime || 0);
        console.log('🎵 [VOLUME] Main volume set via Web Audio API:', newVolume);
      } catch (error) {
        console.warn('🎵 [VOLUME] Web Audio API volume control failed:', error);
      }
    }

    // Fallback to direct volume control (desktop browsers)
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.volume = newVolume;
        console.log('🎵 [VOLUME] Main volume set via HTML5 audio:', newVolume);
      } catch (error) {
        console.warn('🎵 [VOLUME] HTML5 volume control failed:', error);
      }
    }

    // Update background music volume
    const bgVolume = newVolume * backgroundMusicVolume;
    
    // Try Web Audio API for background music
    if (backgroundGainNodeRef.current) {
      try {
        backgroundGainNodeRef.current.gain.setValueAtTime(bgVolume, getAudioContext()?.currentTime || 0);
        console.log('🎵 [VOLUME] Background volume set via Web Audio API:', bgVolume);
      } catch (error) {
        console.warn('🎵 [VOLUME] Background Web Audio API volume control failed:', error);
      }
    }

    // Fallback for background music
    const backgroundAudio = backgroundAudioRef.current;
    if (backgroundAudio) {
      try {
        backgroundAudio.volume = bgVolume;
        console.log('🎵 [VOLUME] Background volume set via HTML5 audio:', bgVolume);
      } catch (error) {
        console.warn('🎵 [VOLUME] Background HTML5 volume control failed:', error);
      }
    }
  };

  const handleBackgroundMusicSelect = (trackId: string) => {
    const selectedTrack = backgroundMusicTracks.find(track => track.id === trackId);
    if (selectedTrack) {
      // Track background music change
      const currentBgTrack = backgroundMusicTracks.find(track => track.id === selectedBackgroundTrack);
      if (currentBgTrack) {
        trackBackgroundMusicChange(
          currentBgTrack.title,
          selectedTrack.title,
          currentBgTrack.id,
          selectedTrack.id
        );
      } else {
        trackBackgroundMusicPlay(selectedTrack.title, selectedTrack.id);
      }
      
      // Stop current background music before switching
      const backgroundAudio = backgroundAudioRef.current;
      if (backgroundAudio) {
        backgroundAudio.pause();
        backgroundAudio.currentTime = 0;
      }
      
      setBackgroundMusic(selectedTrack.audioUrl);
      setIsBackgroundMusicPlaying(true);
      setSelectedBackgroundTrack(trackId);
      setLastPlayingBackgroundTrack(trackId);
    }
  };

  const toggleBackgroundMusic = () => {
    if (isBackgroundMusicPlaying) {
      // Track background music pause
      const currentBgTrack = backgroundMusicTracks.find(track => track.id === selectedBackgroundTrack);
      if (currentBgTrack) {
        trackBackgroundMusicPause(currentBgTrack.title, currentBgTrack.id);
      }
      setIsBackgroundMusicPlaying(false);
    } else {
      // Track background music play
      const currentBgTrack = backgroundMusicTracks.find(track => track.id === selectedBackgroundTrack);
      if (currentBgTrack) {
        trackBackgroundMusicPlay(currentBgTrack.title, currentBgTrack.id);
      }
      setIsBackgroundMusicPlaying(true);
    }
  };

  const stopBackgroundMusic = () => {
    // Store the current track as the last playing track before stopping
    if (selectedBackgroundTrack) {
      setLastPlayingBackgroundTrack(selectedBackgroundTrack);
    }
    setBackgroundMusic(null);
    setIsBackgroundMusicPlaying(false);
    // Keep the selectedBackgroundTrack so the purple selected state persists
    // setSelectedBackgroundTrack(null);
  };

  const resumeLastBackgroundMusic = () => {
    if (lastPlayingBackgroundTrack) {
      const lastTrack = backgroundMusicTracks.find(track => track.id === lastPlayingBackgroundTrack);
      if (lastTrack) {
        setBackgroundMusic(lastTrack.audioUrl);
        setIsBackgroundMusicPlaying(true);
        setSelectedBackgroundTrack(lastPlayingBackgroundTrack);
      }
    }
  };

  const handleBackgroundMusicVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setBackgroundMusicVolume(newVolume);

    console.log('🎵 [VOLUME] Background music volume change requested:', newVolume);

    const finalVolume = newVolume * volume;

    // Try Web Audio API first (works on mobile)
    if (backgroundGainNodeRef.current) {
      try {
        backgroundGainNodeRef.current.gain.setValueAtTime(finalVolume, getAudioContext()?.currentTime || 0);
        console.log('🎵 [VOLUME] Background music volume set via Web Audio API:', finalVolume);
      } catch (error) {
        console.warn('🎵 [VOLUME] Background Web Audio API volume control failed:', error);
      }
    }

    // Fallback to direct volume control (desktop browsers)
    if (backgroundAudioRef.current) {
      try {
        backgroundAudioRef.current.volume = finalVolume;
        console.log('🎵 [VOLUME] Background music volume set via HTML5 audio:', finalVolume);
      } catch (error) {
        console.warn('🎵 [VOLUME] Background HTML5 volume control failed:', error);
      }
    }
  };

  const toggleCaptions = () => {
    const newCaptionsState = !isCaptionsActive;
    setIsCaptionsActive(newCaptionsState);
    
    // Track captions toggle
    trackCaptionsToggle(newCaptionsState, track.title);
  };

  const getTrackSlug = (trackIndex: number) => {
    const trackSlugs = [
      "breath-between-the-worlds",
      "celestia-i",
      "celestia-ii",
      "driving-111",
      "eros-orchard",
      "in-reach-of-meaning",
      "knocking-at-heaven",
      "kosmographica",
      "life-is-vibration",
      "light-in-mind",
      "maxsoft",
      "nondualizer",
      "on-the-temple-roof",
      "orbitron",
      "outworld",
      "panentheon",
      "putting-down",
      "rainbow-arrows",
      "rewinding-time",
      "signals-from-somewhere",
      "starfields-in-bloom",
      "stone-circuits",
      "stratomind",
      "textures-of-feelings",
      "there-is-a-voice-in-you",
      "iki-ga-aru",
    ];
    return trackSlugs[trackIndex] || "breath-between-the-worlds";
  };

  // Update URL when track changes
  const updateTrackUrl = (trackIndex: number) => {
    const slug = getTrackSlug(trackIndex);
    navigate(`/track/${slug}`, { replace: true });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden pb-4">
      {/* Background Slideshow */}
      <BackgroundSlideshow trackIndex={currentTrack} isTransitioning={isTransitioning} />

      {/* Caption Overlay — disabled for Lofinity */}
      {/* <CaptionOverlay
        isActive={isCaptionsActive}
        currentTime={currentTime}
        captions={captions}
      /> */}



      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className={`absolute top-4 left-4 z-50 glass-morphism hover:bg-[hsl(var(--control-hover))] text-white transition-opacity duration-300 ${
          isDrawerOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={() => setIsDrawerOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Track Drawer */}
      <TrackDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        tracks={mockTracks}
        currentTrack={currentTrack}
        onTrackSelect={handleTrackSelect}
        isPlaying={isPlaying}
      />

      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={resolveAudioUrl(track.audioUrl)} 
        preload="auto"
        crossOrigin="anonymous"
        playsInline
        style={{ display: 'none' }}
        onError={(e) => {
          console.error('Audio error:', e);
          console.error('Audio src:', track.audioUrl);
        }}
        onLoadStart={() => {
        }}
        onCanPlay={() => {
        }}
      />
      
      {/* Background Music Element — disabled for Lofinity */}
      {/* {backgroundMusic && (
        <audio
          ref={backgroundAudioRef}
          src={backgroundMusic}
          loop
          preload="auto"
          crossOrigin="anonymous"
          playsInline
          style={{ display: 'none' }}
        />
      )} */}

      {/* Player Controls - Sticky Bottom Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-2 md:p-6 pb-safe-mobile md:pb-6 z-20"
        style={{
          paddingBottom: typeof window !== 'undefined' && window.innerWidth <= 768 && mobileSafariBottomPadding > 0 
            ? `${mobileSafariBottomPadding}px` 
            : undefined,
          backgroundColor: 'transparent'
        }}
      >
        <div className="rounded-xl p-2 md:p-4 max-w-2xl">
          {/* Track Info */}
          <div className={`mb-4 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <h2 className="text-lg md:text-xl font-semibold text-white mb-1">
              {track.title}
            </h2>
            <p className="text-xs md:text-sm text-white/70 mb-3">
              {track.description}
            </p>
          </div>

          {/* Timeline */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration || track.duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full mb-2 slider-thumb"
            />
            <div className="flex justify-between text-xs text-white/60">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || track.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div 
            className="flex items-center gap-1 md:gap-2 flex-nowrap overflow-x-auto"
            style={{
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none', /* Internet Explorer 10+ */
            }}
          >
            {/* Shuffle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleShuffle}
              title={isShuffle ? 'Shuffle on' : 'Shuffle off'}
              className={`h-9 w-9 md:h-12 md:w-12 flex-shrink-0 hover:bg-white/10 transition-colors ${
                isShuffle
                  ? 'text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]'
                  : 'text-white hover:text-[hsl(var(--control-hover))]'
              }`}
            >
              <Shuffle className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log('🎵 [AUDIO SYNC] Previous button clicked!');
                handlePrevious(isPlaying);
              }}
              className="text-white hover:text-[hsl(var(--control-hover))] hover:bg-white/10 h-9 w-9 md:h-12 md:w-12 flex-shrink-0"
            >
              <SkipBack className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log('🎵 [AUDIO SYNC] Play/Pause button clicked - current isPlaying state:', isPlaying);
                console.log('🎵 [AUDIO SYNC] Button should show:', isPlaying ? 'PAUSE icon' : 'PLAY icon');
                togglePlay();
              }}
              className="text-white hover:text-[hsl(var(--control-hover))] hover:bg-white/10 h-9 w-9 md:h-12 md:w-12 flex-shrink-0"
            >
              {(() => {
                console.log('🎵 [AUDIO SYNC] Button render - isPlaying:', isPlaying, 'showing:', isPlaying ? 'PAUSE' : 'PLAY');
                return isPlaying ? (
                  <Pause className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  <Play className="h-5 w-5 md:h-6 md:w-6 ml-0.5" />
                );
              })()}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log('🎵 [AUDIO SYNC] Next button clicked!');
                handleNext(isPlaying);
              }}
              className="text-white hover:text-[hsl(var(--control-hover))] hover:bg-white/10 h-9 w-9 md:h-12 md:w-12 flex-shrink-0"
            >
              <SkipForward className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            {/* Loop Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLoop}
              title={isLoop ? 'Loop on' : 'Loop off'}
              className={`h-9 w-9 md:h-12 md:w-12 flex-shrink-0 hover:bg-white/10 transition-colors ${
                isLoop
                  ? 'text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]'
                  : 'text-white hover:text-[hsl(var(--control-hover))]'
              }`}
            >
              <Repeat className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            {/* Volume Control */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-[hsl(var(--control-hover))] hover:bg-white/10 h-9 w-9 md:h-12 md:w-12 flex-shrink-0"
                >
                  <Volume2 className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-48 p-4 glass-morphism border-white/20"
                side="top"
                align="center"
                sideOffset={8}
              >
                <div className="space-y-3">
                  <div className="text-sm font-medium text-white">Volume</div>
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-full slider-thumb touch-manipulation"
                    style={{ touchAction: 'none' }}
                  />
                  <div className="text-xs text-white/60 text-center">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Background Music Control — disabled for Lofinity */}
            {/* <Popover>...</Popover> */}

            {/* Caption Control — disabled for Lofinity */}
            {/* {captions.length > 0 && (...)} */}

            {/* Share Control */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsShareModalOpen(true);
                trackAudioShare(track.title, currentTrack, 'modal');
              }}
              className="text-white hover:text-[hsl(var(--control-hover))] hover:bg-white/10 h-9 w-9 md:h-12 md:w-12 flex-shrink-0"
            >
              <Share2 className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        trackTitle={track.title}
        trackSlug={getTrackSlug(currentTrack)}
      />

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
      />
    </div>
  );
}