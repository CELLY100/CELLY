import React from 'react';
import { Play, Pause, Volume2, VolumeX, ShoppingBag, Radio } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';

interface AudioPlayerBarProps {
  onOpenLicenseModal?: (beat: any) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ onOpenLicenseModal }) => {
  const {
    currentBeat,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
  } = useAudioPlayer();

  if (!currentBeat) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <aside aria-label="Audio playback controls" className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-[#0d0f17]/95 backdrop-blur-lg px-4 py-2.5 shadow-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Track Details */}
        <div className="flex items-center gap-3 min-w-0 w-1/4">
          <img
            src={currentBeat.artworkUrl}
            alt={currentBeat.title}
            className="h-12 w-12 rounded object-cover border border-zinc-700/80 shrink-0"
          />
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-white leading-tight">
              {currentBeat.title}
            </h4>
            <p className="text-xs text-amber-400/90 font-medium">
              Prod. by Celly
            </p>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
              <span>{currentBeat.bpm} BPM</span>
              <span>•</span>
              <span>{currentBeat.key}</span>
            </div>
          </div>
        </div>

        {/* Center Controls & Scrubber */}
        <div className="flex flex-col items-center flex-1 max-w-xl">
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-black hover:bg-amber-400 transition-transform active:scale-95 shadow-md"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-black" /> : <Play className="h-5 w-5 fill-black ml-0.5" />}
            </button>
          </div>

          <div className="flex w-full items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>

            {/* Scrubber Bar */}
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newTime = (clickX / rect.width) * (duration || currentBeat.duration);
                seek(newTime);
              }}
              className="relative flex-1 h-2 bg-zinc-800 rounded-full cursor-pointer overflow-hidden group"
            >
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <span className="text-[11px] font-mono text-zinc-400 w-10">
              {formatTime(duration || currentBeat.duration)}
            </span>
          </div>
        </div>

        {/* Volume & Purchase CTA */}
        <div className="flex items-center justify-end gap-4 w-1/4">
          <div className="hidden md:flex items-center gap-2">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="h-1.5 w-18 accent-amber-500 bg-zinc-700 rounded-lg cursor-pointer"
            />
          </div>

          {currentBeat.status !== 'exclusive_sold' ? (
            <button
              onClick={() => onOpenLicenseModal?.(currentBeat)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors shadow-sm whitespace-nowrap"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>License (${currentBeat.basePrice.toFixed(2)})</span>
            </button>
          ) : (
            <span className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-semibold">
              EXCLUSIVE SOLD
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
