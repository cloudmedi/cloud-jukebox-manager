export interface Song {
  _id: string;
  name: string;
  artist: string;
  filePath: string;
  localPath?: string;
  artwork?: string;
  duration: number;
}