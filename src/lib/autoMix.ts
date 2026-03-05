const bpmCache = new Map<string, number>();

const FRAME_SIZE = 1024;
const MIN_BPM = 70;
const MAX_BPM = 180;
const BPM_BUCKET_SIZE = 1;

export const AUTO_MIX_LOOKAHEAD_SECONDS = 12;
export const AUTO_MIX_FADE_SECONDS = 10;

const normalizeBpmToRange = (bpm: number): number => {
  let normalized = bpm;
  while (normalized < MIN_BPM) normalized *= 2;
  while (normalized > MAX_BPM) normalized /= 2;
  return normalized;
};

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)));
  return sorted[index];
};

const extractPeakPositions = (channelData: Float32Array, sampleRate: number): number[] => {
  const frameEnergies: number[] = [];
  for (let i = 0; i < channelData.length; i += FRAME_SIZE) {
    let sum = 0;
    const end = Math.min(i + FRAME_SIZE, channelData.length);
    for (let j = i; j < end; j++) {
      const value = channelData[j];
      sum += value * value;
    }
    frameEnergies.push(Math.sqrt(sum / (end - i)));
  }

  const threshold = percentile(frameEnergies, 0.82);
  const minDistanceFrames = Math.floor((sampleRate * 0.22) / FRAME_SIZE);
  const peaks: number[] = [];
  let lastAccepted = -Infinity;

  for (let i = 1; i < frameEnergies.length - 1; i++) {
    const candidate = frameEnergies[i];
    const isPeak = candidate > threshold && candidate > frameEnergies[i - 1] && candidate >= frameEnergies[i + 1];
    if (!isPeak) continue;
    if (i - lastAccepted < minDistanceFrames) continue;
    peaks.push(i * FRAME_SIZE);
    lastAccepted = i;
  }

  return peaks;
};

const estimateBpmFromPeaks = (peaks: number[], sampleRate: number): number => {
  if (peaks.length < 3) return 120;

  const histogram = new Map<number, number>();
  for (let i = 0; i < peaks.length - 1; i++) {
    const intervalSamples = peaks[i + 1] - peaks[i];
    if (intervalSamples <= 0) continue;
    const intervalSeconds = intervalSamples / sampleRate;
    const bpm = normalizeBpmToRange(60 / intervalSeconds);
    const bucket = Math.round(bpm / BPM_BUCKET_SIZE) * BPM_BUCKET_SIZE;
    histogram.set(bucket, (histogram.get(bucket) ?? 0) + 1);
  }

  if (histogram.size === 0) return 120;

  let bestBpm = 120;
  let bestVotes = -1;
  histogram.forEach((votes, bpm) => {
    if (votes > bestVotes) {
      bestVotes = votes;
      bestBpm = bpm;
    }
  });

  return bestBpm;
};

export const estimateTrackBpm = async (audioUrl: string): Promise<number> => {
  const cached = bpmCache.get(audioUrl);
  if (cached) return cached;

  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    await audioContext.close();

    const channelData = audioBuffer.getChannelData(0);
    const analysisLength = Math.min(channelData.length, Math.floor(audioBuffer.sampleRate * 90));
    const analysisData = channelData.slice(0, analysisLength);
    const peaks = extractPeakPositions(analysisData, audioBuffer.sampleRate);
    const bpm = estimateBpmFromPeaks(peaks, audioBuffer.sampleRate);
    bpmCache.set(audioUrl, bpm);
    return bpm;
  } catch (error) {
    console.warn("🎚️ [AUTOMIX] BPM analysis failed; using fallback tempo.", error);
    const fallback = 120;
    bpmCache.set(audioUrl, fallback);
    return fallback;
  }
};

export const getBeatMatchedPlaybackRate = (currentBpm: number, nextBpm: number): number => {
  if (!Number.isFinite(currentBpm) || !Number.isFinite(nextBpm) || nextBpm <= 0) return 1;
  const rawRate = currentBpm / nextBpm;
  return Math.min(1.08, Math.max(0.92, rawRate));
};
