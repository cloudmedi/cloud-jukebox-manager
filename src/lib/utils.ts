import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDuration = (duration: number) => {
  if (!duration) return '0 dk';
  
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} sa${minutes > 0 ? ` ${minutes} dk` : ''}`; 
  }
  
  return `${minutes} dk`;
};