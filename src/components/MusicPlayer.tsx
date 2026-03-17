import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { 
  Play, 
  Pause, 
  Music, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Repeat1, 
  Shuffle, 
  ListMusic,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'motion/react';

interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
}

type PlayMode = 'order' | 'repeat' | 'shuffle';

interface MusicState {
  isPlaying: boolean;
  currentSongIndex: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;
}

const STORAGE_KEY = 'winery-music-state';

export const MusicPlayer: React.FC = () => {
  const { config } = useData();
  const music = config?.music;
  
  // Default playlist
  const defaultPlaylist: Song[] = [
    {
      id: '1',
      title: '使一颗心免于哀伤',
      artist: '知更鸟 / HOYO-MiX / Chevy',
      cover: '/images/music/cover1.jpg',
      url: 'https://music.163.com/song/media/outer/url?id=2140117698.mp3'
    },
    {
      id: '2', 
      title: '若我不曾见过太阳',
      artist: '知更鸟 / HOYO-MiX / Chevy',
      cover: '/images/music/cover2.jpg',
      url: 'https://music.163.com/song/media/outer/url?id=2155420538.mp3'
    },
    {
      id: '3',
      title: '在银河中孤独摇摆', 
      artist: '知更鸟 / HOYO-MiX / Chevy',
      cover: '/images/music/cover3.jpg',
      url: 'https://music.163.com/song/media/outer/url?id=2140117703.mp3'
    }
  ];

  const [playlist, setPlaylist] = useState<Song[]>(defaultPlaylist);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playMode, setPlayMode] = useState<PlayMode>('order');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const currentSong = playlist[currentSongIndex];

  // Load state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state: MusicState = JSON.parse(savedState);
        setIsPlaying(state.isPlaying);
        setCurrentSongIndex(state.currentSongIndex);
        setCurrentTime(state.currentTime);
        setVolume(state.volume);
        setIsMuted(state.isMuted);
        setPlayMode(state.playMode);
      } catch (e) {
        console.error('Failed to load music state:', e);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    const state: MusicState = {
      isPlaying,
      currentSongIndex,
      currentTime,
      volume,
      isMuted,
      playMode
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isPlaying, currentSongIndex, currentTime, volume, isMuted, playMode]);

  // Set audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Restore playback position
  useEffect(() => {
    if (audioRef.current && currentTime > 0) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentSongIndex]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log('Playback failed:', e));
      }
    }
  }, [isPlaying]);

  const playNext = useCallback(() => {
    if (playMode === 'shuffle') {
      const nextIndex = Math.floor(Math.random() * playlist.length);
      setCurrentSongIndex(nextIndex);
    } else {
      setCurrentSongIndex((prev) => (prev + 1) % playlist.length);
    }
    setIsPlaying(true);
  }, [playMode, playlist.length]);

  const playPrevious = useCallback(() => {
    if (playMode === 'shuffle') {
      const prevIndex = Math.floor(Math.random() * playlist.length);
      setCurrentSongIndex(prevIndex);
    } else {
      setCurrentSongIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    }
    setIsPlaying(true);
  }, [playMode, playlist.length]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  }, [isDragging]);

  const handleEnded = useCallback(() => {
    if (playMode === 'repeat') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      playNext();
    }
  }, [playMode, playNext]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playModeIcons = {
    order: <Repeat className="w-4 h-4" />,
    repeat: <Repeat1 className="w-4 h-4 text-accent" />,
    shuffle: <Shuffle className="w-4 h-4 text-accent" />
  };

  const playModeLabels = {
    order: '顺序播放',
    repeat: '单曲循环',
    shuffle: '随机播放'
  };

  if (!music || !music.enabled) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
      />

      {/* Main Player */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "fixed bottom-6 left-6 z-50 bg-bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300",
          isExpanded ? "w-80" : "w-auto"
        )}
      >
        {/* Collapsed View */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 transition-all duration-300",
              isPlaying ? "bg-accent/10" : "hover:bg-bg-base"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full overflow-hidden shrink-0 border-2",
              isPlaying ? "border-accent animate-[spin_8s_linear_infinite]" : "border-border"
            )}>
              <img src={currentSong.cover} alt="Cover" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-text-primary truncate max-w-[120px]">
                {currentSong.title}
              </span>
              <span className="text-xs text-text-secondary truncate max-w-[120px]">
                {currentSong.artist}
              </span>
            </div>
            <div className="ml-2">
              {isPlaying ? (
                <div className="flex gap-0.5 items-end h-4">
                  <span className="w-1 bg-accent animate-[music-bar_0.8s_ease-in-out_infinite]" style={{ height: '60%' }} />
                  <span className="w-1 bg-accent animate-[music-bar_0.6s_ease-in-out_infinite_0.1s]" style={{ height: '100%' }} />
                  <span className="w-1 bg-accent animate-[music-bar_0.9s_ease-in-out_infinite_0.2s]" style={{ height: '40%' }} />
                </div>
              ) : (
                <Music className="w-5 h-5 text-text-secondary" />
              )}
            </div>
          </button>
        )}

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-80"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-bold text-text-primary">音乐播放器</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      showPlaylist ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary hover:bg-bg-base"
                    )}
                  >
                    <ListMusic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-base rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Song Info */}
              <div className="flex items-center gap-4 p-4">
                <div className={cn(
                  "w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg",
                  isPlaying && "animate-[spin_8s_linear_infinite]"
                )}>
                  <img src={currentSong.cover} alt="Cover" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-base font-bold text-text-primary truncate">{currentSong.title}</span>
                  <span className="text-sm text-text-secondary truncate">{currentSong.artist}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-4 pb-2">
                <div
                  ref={progressRef}
                  className="h-1.5 bg-bg-base rounded-full cursor-pointer group"
                  onClick={handleProgressClick}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                  onMouseMove={handleProgressDrag}
                >
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-100 relative"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 px-4 py-3">
                <button
                  onClick={() => setPlayMode(mode => {
                    const modes: PlayMode[] = ['order', 'repeat', 'shuffle'];
                    const nextIndex = (modes.indexOf(mode) + 1) % modes.length;
                    return modes[nextIndex];
                  })}
                  className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                  title={playModeLabels[playMode]}
                >
                  {playModeIcons[playMode]}
                </button>

                <button
                  onClick={playPrevious}
                  className="p-2 text-text-primary hover:text-accent transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-accent hover:bg-accent-hover text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30 transition-all hover:scale-105"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <button
                  onClick={playNext}
                  className="p-2 text-text-primary hover:text-accent transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <div className="relative group">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  {/* Volume Slider */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-bg-card border border-border rounded-lg shadow-xl opacity-0 group-hover:opacity-0 hover:opacity-100 transition-opacity">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-24 accent-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Playlist */}
              <AnimatePresence>
                {showPlaylist && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 200, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border overflow-hidden"
                  >
                    <div className="h-full overflow-y-auto custom-scrollbar p-2">
                      {playlist.map((song, index) => (
                        <button
                          key={song.id}
                          onClick={() => {
                            setCurrentSongIndex(index);
                            setIsPlaying(true);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                            index === currentSongIndex 
                              ? "bg-accent/10 text-accent" 
                              : "hover:bg-bg-base text-text-secondary"
                          )}
                        >
                          <span className="text-xs w-5 text-center">
                            {index === currentSongIndex && isPlaying ? (
                              <span className="flex gap-0.5 justify-center">
                                <span className="w-0.5 h-3 bg-accent animate-[music-bar_0.8s_ease-in-out_infinite]" />
                                <span className="w-0.5 h-3 bg-accent animate-[music-bar_0.6s_ease-in-out_infinite_0.1s]" />
                                <span className="w-0.5 h-3 bg-accent animate-[music-bar_0.9s_ease-in-out_infinite_0.2s]" />
                              </span>
                            ) : (
                              index + 1
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "text-sm font-medium truncate",
                              index === currentSongIndex ? "text-accent" : "text-text-primary"
                            )}>
                              {song.title}
                            </div>
                            <div className="text-xs text-text-muted truncate">{song.artist}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Add CSS animation for music bars */}
      <style>{`
        @keyframes music-bar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </>
  );
};
