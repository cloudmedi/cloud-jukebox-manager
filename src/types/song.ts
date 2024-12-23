export interface Song {
  _id: string;
  name: string;
  artist: string;
  genre: string;
  album?: string;
  duration: number;
  artwork?: string;
  createdAt: string;
  updatedAt: string;
}