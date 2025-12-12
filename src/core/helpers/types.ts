export type SyncFn = (...args: any[]) => any;
export type AsyncFn = (...args: any[]) => Promise<any>;
export type Fn = (...args: any[]) => Promise<any> | any;
