import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { trackTrackPageView } from "@/lib/analytics";

// Track data mapping
const trackData = [
  { title: "Breath Between The Worlds", slug: "breath-between-the-worlds", duration: 188 },
  { title: "Celestia I", slug: "celestia-i", duration: 469 },
  { title: "Celestia II", slug: "celestia-ii", duration: 244 },
  { title: "Driving 111", slug: "driving-111", duration: 367 },
  { title: "Eros Orchard", slug: "eros-orchard", duration: 230 },
  { title: "In reach of meaning", slug: "in-reach-of-meaning", duration: 217 },
  { title: "Knocking at Heaven", slug: "knocking-at-heaven", duration: 203 },
  { title: "Kosmographica", slug: "kosmographica", duration: 317 },
  { title: "Life is Vibration", slug: "life-is-vibration", duration: 323 },
  { title: "Light in mind", slug: "light-in-mind", duration: 264 },
  { title: "Maxsoft", slug: "maxsoft", duration: 214 },
  { title: "Nondualizer", slug: "nondualizer", duration: 279 },
  { title: "On The Temple Roof", slug: "on-the-temple-roof", duration: 282 },
  { title: "Orbitron", slug: "orbitron", duration: 230 },
  { title: "Outworld", slug: "outworld", duration: 223 },
  { title: "Panentheon", slug: "panentheon", duration: 369 },
  { title: "Putting down", slug: "putting-down", duration: 279 },
  { title: "Rainbow Arrows", slug: "rainbow-arrows", duration: 329 },
  { title: "Rewinding Time", slug: "rewinding-time", duration: 196 },
  { title: "Signals from Somewhere", slug: "signals-from-somewhere", duration: 243 },
  { title: "Starfields in Bloom", slug: "starfields-in-bloom", duration: 300 },
  { title: "Stone Circuits", slug: "stone-circuits", duration: 300 },
  { title: "Stratomind", slug: "stratomind", duration: 268 },
  { title: "Textures of feelings", slug: "textures-of-feelings", duration: 252 },
  { title: "There is a voice in you", slug: "there-is-a-voice-in-you", duration: 259 },
  { title: "息がある。(Iki ga aru) — There is Breath", slug: "iki-ga-aru", duration: 252 },
];

export function TrackPage() {
  const { trackSlug } = useParams();
  const navigate = useNavigate();

  // Convert slug back to track index
  const getTrackIndexFromSlug = (slug: string) => {
    const trackMap: { [key: string]: number } = {
      "breath-between-the-worlds": 0,
      "celestia-i": 1,
      "celestia-ii": 2,
      "driving-111": 3,
      "eros-orchard": 4,
      "in-reach-of-meaning": 5,
      "knocking-at-heaven": 6,
      "kosmographica": 7,
      "life-is-vibration": 8,
      "light-in-mind": 9,
      "maxsoft": 10,
      "nondualizer": 11,
      "on-the-temple-roof": 12,
      "orbitron": 13,
      "outworld": 14,
      "panentheon": 15,
      "putting-down": 16,
      "rainbow-arrows": 17,
      "rewinding-time": 18,
      "signals-from-somewhere": 19,
      "starfields-in-bloom": 20,
      "stone-circuits": 21,
      "stratomind": 22,
      "textures-of-feelings": 23,
      "there-is-a-voice-in-you": 24,
      "iki-ga-aru": 25,
    };
    return trackMap[slug];
  };

  const trackIndex = getTrackIndexFromSlug(trackSlug || "");

  // Enhanced debug logging for routing issues
  console.log('🔍 [ROUTING DEBUG] TrackPage loaded:', {
    trackSlug,
    trackIndex,
    isValidSlug: trackSlug && trackIndex !== undefined,
    timestamp: new Date().toISOString()
  });

  // Track page view when component mounts
  useEffect(() => {
    if (trackSlug && trackIndex !== undefined) {
      const track = trackData[trackIndex];
      if (track) {
        trackTrackPageView(track.title, track.slug, trackIndex, track.duration);
      }
    }
  }, [trackSlug, trackIndex]);

  // If invalid slug, redirect to home
  if (!trackSlug || trackIndex === undefined) {
    console.log('TrackPage - Invalid slug, redirecting to home');
    navigate("/");
    return null;
  }

  return (
    <div className="h-screen w-full">
      <AudioPlayer initialTrackIndex={trackIndex} />
    </div>
  );
} 