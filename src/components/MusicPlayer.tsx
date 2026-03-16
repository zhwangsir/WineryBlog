import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Play, Pause, Music, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../utils/cn';

export const MusicPlayer: React.FC = () => {
  const { config } = useData();
  const music = config?.music;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (music?.autoplay && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Autoplay prevented by browser', e));
      setIsPlaying(true);
    }
  }, [music?.autoplay]);

  if (!music || !music.enabled) return null;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-end gap-4">
      <audio 
        ref={audioRef} 
        src={music.url} 
        loop 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* Expanded Player */}
      <div 
        className={cn(
          "bg-bg-card border border-border rounded-2xl shadow-xl overflow-hidden transition-all duration-300 origin-bottom-left flex flex-col",
          isExpanded ? "opacity-100 scale-100 w-64" : "opacity-0 scale-90 w-0 h-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-4 p-4">
          <div className={cn("w-12 h-12 rounded-full overflow-hidden shrink-0", isPlaying && "animate-[spin_4s_linear_infinite]")}>
            <img src={music.cover} alt="Cover" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-bold text-text-primary truncate">{music.title}</span>
            <span className="text-xs text-text-secondary truncate">{music.artist}</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 pb-4">
          <button onClick={togglePlay} className="p-2 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button onClick={toggleMute} className="p-2 text-text-secondary hover:text-text-primary transition-colors">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border",
          isPlaying ? "bg-accent text-white border-accent" : "bg-bg-card text-text-primary border-border hover:border-accent"
        )}
      >
        <Music className={cn("w-5 h-5", isPlaying && "animate-pulse")} />
      </button>
    </div>
  );
};
