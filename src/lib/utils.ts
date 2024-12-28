import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDuration = (seconds: number) => {
  if (!seconds) return '0 dk';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} sa${minutes > 0 ? ` ${minutes} dk` : ''}`; 
  }
  
  return `${minutes} dk`;
};

// Upload kısmı için normal süre formatı (3:45 gibi)
export const formatSongDuration = (seconds: number) => {
  if (!seconds) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};