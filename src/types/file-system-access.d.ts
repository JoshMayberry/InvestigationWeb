/* Minimal ambient types for File System Access API */
export {};

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
  type FileSystemPermissionMode = "read" | "readwrite";

  interface FileSystemHandle {
    kind: "file" | "directory";
    name: string;
    queryPermission?: (descriptor?: { mode?: FileSystemPermissionMode }) => Promise<PermissionState> | PermissionState;
    requestPermission?: (descriptor?: { mode?: FileSystemPermissionMode }) => Promise<PermissionState> | PermissionState;
  }
  interface FileSystemFileHandle extends FileSystemHandle { getFile(): Promise<File>; }
  interface FileSystemDirectoryHandle extends FileSystemHandle {
    values(): AsyncIterable<FileSystemHandle>;
    entries(): AsyncIterable<[string, FileSystemHandle]>;
    keys(): AsyncIterable<string>;
    getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
    [Symbol.asyncIterator](): AsyncIterator<FileSystemHandle>;
  }
}