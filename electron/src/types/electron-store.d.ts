declare module 'electron-store' {
  interface StoreOptions<T> {
    name?: string;
    cwd?: string;
    defaults?: Partial<T>;
  }

  class Store<T extends Record<string, any>> {
    constructor(options?: StoreOptions<T>);
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    delete<K extends keyof T>(key: K): void;
    clear(): void;
    store: T;
  }

  export = Store;
}