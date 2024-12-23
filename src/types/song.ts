export interface Song {
  _id: string;
  name: string;
  artist: string;
  duration: number;
  filePath: string;
  artwork?: string;
}