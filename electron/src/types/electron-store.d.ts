declare module 'electron-store' {
  interface ElectronStore<T> {
    get: <K extends keyof T>(key: K) => T[K];
    set: <K extends keyof T>(key: K, value: T[K]) => void;
    delete: <K extends keyof T>(key: K) => void;
    clear: () => void;
    store: T;
  }

  export default class Store<T extends Record<string, any>> implements ElectronStore<T> {
    constructor(options?: {
      name?: string;
      cwd?: string;
      defaults?: Partial<T>;
    });

    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    delete<K extends keyof T>(key: K): void;
    clear(): void;
    store: T;
  }
}