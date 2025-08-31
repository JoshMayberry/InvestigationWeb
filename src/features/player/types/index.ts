export interface FileNode {
  name: string;
  isDirectory: boolean;
  children?: FileNode[];
  url?: string; // for files
}