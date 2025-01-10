export interface Playlist {
  _id: string;
  id: string;
  name: string;
  description?: string;
  songs: any[];
  createdAt?: string;
  updatedAt?: string;
  duration?: number;
  coverImage?: string;
  isPublic?: boolean;
  owner?: string;
  tags?: string[];
}