import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, Play, Pause, ShoppingBag, Heart, Filter, Disc3, Tag } from 'lucide-react';
import { Beat } from '../types';
import { PRODUCER_CREDIT } from '../lib/licenseConstants';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { MAJOR_KEYS, MINOR_KEYS, MUSICAL_KEYS } from '../lib/keys';

interface BeatStorePageProps {
  onOpenLicenseModal: (beat: Beat) => void;
  onSelectBeatDetail: (slug: string) => void;
}

export const BeatStorePage: React.FC<BeatStorePageProps> = ({
  onOpenLicenseModal,
  onSelectBeatDetail,
}) => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('celly_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { currentBeat, isPlaying, playBeat } = useAudioPlayer();

  useEffect(() => {
    fetch('/api/beats')
      .then((r) => r.json())
      .then((data) => {
        setBeats(data.beats || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('celly_favorites', JSON.stringify(next));
      return next;
    });
  };

  const genres = useMemo(() => {
    const set = new Set<string>();
    beats.forEach((b) => {
      if (b.genre) set.add(b.genre);
    });
    return Array.from(set);
  }, [beats]);

  const availableKeys = useMemo(() => {
    const set = new Set<string>();
    beats.forEach((b) => {
      if (b.key) set.add(b.key);
    });
    return Array.from(set);
  }, [beats]);

  const displayedBeats = useMemo(() => {
    return beats.filter((beat) => {
      if (selectedGenre !== 'all' && beat.genre !== selectedGenre) return false;
      if (selectedKey !== 'all' && beat.key !== selectedKey) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = beat.title.toLowerCase().includes(q);
      const matchGenre = beat.genre.toLowerCase().includes(q);
      const matchKey = (beat.key || '').toLowerCase().includes(q);
      const matchMood = beat.mood?.toLowerCase().includes(q);
      const matchTags = (beat.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchGenre || matchKey || matchMood || matchTags;
    });
  }, [beats, searchQuery, selectedGenre, selectedKey]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Official Catalog
          </span>
          <h1 className="font-['Syne'] text-3xl sm:text-4xl font-extrabold text-white mt-1">
            Beat Store
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Producer beats with instant untagged audio downloads and dynamic legal licensing agreements.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Key Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full sm:w-auto rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="all">Key: All Keys</option>
              <optgroup label="Active In Catalog">
                {availableKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Major Keys (12)">
                {MAJOR_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Minor Keys (12)">
                {MINOR_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, key, genre..."
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Badges / Active Filter status */}
      {(selectedKey !== 'all' || selectedGenre !== 'all' || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500">Active Filters:</span>
          {selectedKey !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-amber-400 font-mono">
              Key: {selectedKey}
              <button onClick={() => setSelectedKey('all')} className="hover:text-white ml-1">×</button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-zinc-300">
              "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-white ml-1">×</button>
            </span>
          )}
          <button
            onClick={() => {
              setSelectedKey('all');
              setSelectedGenre('all');
              setSearchQuery('');
            }}
            className="text-[11px] text-zinc-500 hover:text-white underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Beats List / Grid */}
      {isLoading ? (
        <div className="py-24 text-center text-zinc-500">Loading beats catalog...</div>
      ) : displayedBeats.length === 0 ? (
        <div className="py-20 text-center space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/20 max-w-xl mx-auto p-8">
          <Disc3 className="h-12 w-12 text-amber-500/60 mx-auto animate-spin-slow" />
          <h3 className="font-['Syne'] text-lg font-bold text-white">No Beats in Store Yet</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            All sample beats have been cleared as requested. As the producer, you can upload your own beats with custom artwork, BPM, musical Key, audio files, and pricing in the Admin Dashboard to start selling.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBeats.map((beat) => {
            const isCurrentlyPlaying = currentBeat?.id === beat.id && isPlaying;
            const isFav = favorites.includes(beat.id);

            return (
              <div
                key={beat.id}
                className="group relative rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-4 hover:border-zinc-700 transition-all hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Artwork + Play Overlay */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                    <img
                      src={beat.artworkUrl}
                      alt={beat.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => playBeat(beat)}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-black shadow-lg hover:scale-105 transition-transform"
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="h-5 w-5 fill-black" />
                        ) : (
                          <Play className="h-5 w-5 fill-black ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Top Right Badges */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      {beat.status === 'exclusive_sold' ? (
                        <span className="rounded bg-red-900/90 border border-red-700 px-2 py-0.5 text-[10px] font-bold text-red-100 uppercase tracking-wider">
                          Exclusive Sold
                        </span>
                      ) : (
                        beat.isNewRelease && (
                          <span className="rounded bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider">
                            New
                          </span>
                        )
                      )}

                      <button
                        onClick={(e) => toggleFavorite(beat.id, e)}
                        className="h-7 w-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-red-400 transition-colors"
                      >
                        <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="mt-3.5 space-y-1">
                    <button
                      onClick={() => onSelectBeatDetail(beat.slug)}
                      className="text-left font-['Syne'] text-base font-bold text-white hover:text-amber-400 transition-colors truncate block w-full"
                    >
                      {beat.title}
                    </button>

                    <p className="text-xs text-amber-400/90 font-medium">
                      {PRODUCER_CREDIT}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 pt-1">
                      <span>{beat.genre}</span>
                      <span>•</span>
                      <span>{beat.bpm} BPM</span>
                      <span>•</span>
                      <span>{beat.key}</span>
                    </div>

                    {/* Tags */}
                    {beat.tags && beat.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {beat.tags.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="font-mono text-sm font-bold text-zinc-200">
                    {beat.status === 'exclusive_sold' ? (
                      <span className="text-xs text-zinc-400">Sold Out</span>
                    ) : (
                      <span>From ${beat.basePrice.toFixed(2)}</span>
                    )}
                  </div>

                  {beat.status === 'exclusive_sold' ? (
                    <span className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-semibold">
                      Exclusive Sold
                    </span>
                  ) : (
                    <button
                      onClick={() => onOpenLicenseModal(beat)}
                      className="rounded-md bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>License</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
