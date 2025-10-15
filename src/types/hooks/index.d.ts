

/** Keys allowed for hook names */
export type HookKey = string | symbol;

/** Unsubscribe function returned by add* calls */
export type Unsubscribe = () => void;

/** Action callback type */
export type ActionCallback<Args extends any[] = any[]> = (...args: Args) => void | Promise<void>;

/** Filter callback type (can return Bail to stop the chain) */
export type FilterCallback<T = any, Args extends any[] = any[]> =
  (value: T, ...args: Args) => T | typeof Bail | void | Promise<T | typeof Bail | void>;
