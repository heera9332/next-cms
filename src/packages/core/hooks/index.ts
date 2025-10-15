/**
 * @author: Heera Singh
 * @date: 22-03-2025
 * @description: Hooks features like WordPress (with optional priority)
 */

import type { ActionCallback, FilterCallback, HookKey, Unsubscribe } from "@/types/hooks";

/** Special control value to bail out of a filter chain */
export const Bail: unique symbol = Symbol("HOOK_BAIL");

type HookItem<Cb> = {
  id: number;
  cb: Cb;
  priority: number;
  once: boolean;
};

class PriorityHookBag<Cb> {
  protected _hooks = new Map<HookKey, HookItem<Cb>[]>();
  protected _uid = 0;

  protected _get(hook: HookKey): HookItem<Cb>[] {
    if (!this._hooks.has(hook)) this._hooks.set(hook, []);
    // non-null because we just set it
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._hooks.get(hook)!;
  }

  add(hook: HookKey, cb: Cb, priority: number = 10, once = false): Unsubscribe {
    if (typeof cb !== "function") {
      console.log(`Hook '${String(hook)}': attempted to register non-function`)
      return () => {};
    }
    const list = this._get(hook);
    const id = ++this._uid;
    const item: HookItem<Cb> = { id, cb, priority: Number(priority) || 10, once };
    list.push(item);
    list.sort((a, b) => (a.priority - b.priority) || (a.id - b.id));
    return () => this.removeById(hook, id);
  }

  remove(hook: HookKey, cb: Cb): void {
    const list = this._get(hook);
    const next = list.filter((it) => it.cb !== cb);
    this._hooks.set(hook, next);
  }

  removeById(hook: HookKey, id: number): void {
    const list = this._get(hook);
    const next = list.filter((it) => it.id !== id);
    this._hooks.set(hook, next);
  }

  removeAll(hook?: HookKey): void {
    if (hook) this._hooks.delete(hook);
    else this._hooks.clear();
  }

  listeners(hook: HookKey): HookItem<Cb>[] {
    return [...(this._hooks.get(hook) || [])];
  }
}

class ActionManager extends PriorityHookBag<ActionCallback<any[]>> {
  doAction<Args extends any[]>(hook: HookKey, ...args: Args): void {
    const list = this.listeners(hook);
    for (const item of list) {
      try {
        item.cb(...args);
      } catch (err: unknown) {
        console.log(`Error in action '${String(hook)}': ${errToString(err)}`);
      }
      if (item.once) this.removeById(hook, item.id);
    }
  }

  async doActionAsync<Args extends any[]>(hook: HookKey, ...args: Args): Promise<void> {
    const list = this.listeners(hook);
    for (const item of list) {
      try {
        const r = item.cb(...args);
        if (r && typeof (r as Promise<void>).then === "function") await r;
      } catch (err: unknown) {
        console.log(`Error in action '${String(hook)}': ${errToString(err)}`);
      }
      if (item.once) this.removeById(hook, item.id);
    }
  }
}

class FilterManager extends PriorityHookBag<FilterCallback<any, any[]>> {
  applyFilters<T, Args extends any[]>(
    hook: HookKey,
    value: T,
    ...args: Args
  ): T {
    let out = value;
    const list = this.listeners(hook);
    for (const item of list) {
      try {
        const next = item.cb(out, ...args);
        if (next === Bail) break;
        if (next !== undefined) out = next as T;
      } catch (err: unknown) {
        console.log(`Error in filter '${String(hook)}': ${errToString(err)}`);
      }
      if (item.once) this.removeById(hook, item.id);
    }
    return out;
  }

  async applyFiltersAsync<T, Args extends any[]>(
    hook: HookKey,
    value: T,
    ...args: Args
  ): Promise<T> {
    let out = value;
    const list = this.listeners(hook);
    for (const item of list) {
      try {
        const r = item.cb(out, ...args);
        const next = (r && typeof (r as Promise<any>).then === "function") ? await r : r;
        if (next === Bail) break;
        if (next !== undefined) out = next as T;
      } catch (err: unknown) {
        log.debug?.(`Error in filter '${String(hook)}': ${errToString(err)}`);
      }
      if (item.once) this.removeById(hook, item.id);
    }
    return out;
  }
}

function errToString(err: unknown): string {
  if (err == null) return "null/undefined";
  if (err instanceof Error) return `${err.message}\n${err.stack || ""}`;
  if ((err as any)?.error && ((err as any).error.description || (err as any).error.message)) {
    const code = (err as any).error.code || (err as any).error.reason || "no-code";
    return `${(err as any).error.description || (err as any).error.message} [${code}]`;
  }
  try { return JSON.stringify(err); } catch { /* noop */ }
  return String(err);
}

/** Singletons */
const actions = new ActionManager();
const filters = new FilterManager();

/** Public API (kept same names as your JS) */
// actions
export const addAction = <Args extends any[] = any[]>(
  hook: HookKey,
  cb: ActionCallback<Args>,
  prio = 10
): Unsubscribe => actions.add(hook, cb as ActionCallback<any[]>, prio, false);

export const addOnceAction = <Args extends any[] = any[]>(
  hook: HookKey,
  cb: ActionCallback<Args>,
  prio = 10
): Unsubscribe => actions.add(hook, cb as ActionCallback<any[]>, prio, true);

export const doAction = <Args extends any[] = any[]>(
  hook: HookKey,
  ...args: Args
): void => actions.doAction(hook, ...args);

export const doActionAsync = async <Args extends any[] = any[]>(
  hook: HookKey,
  ...args: Args
): Promise<void> => actions.doActionAsync(hook, ...args);

export const removeAction = <Args extends any[] = any[]>(
  hook: HookKey,
  cb: ActionCallback<Args>
): void => actions.remove(hook, cb as ActionCallback<any[]>);

export const removeAllActions = (hook?: HookKey): void => actions.removeAll(hook);

// filters
export const addFilter = <T = any, Args extends any[] = any[]>(
  hook: HookKey,
  cb: FilterCallback<T, Args>,
  prio = 10
): Unsubscribe => filters.add(hook, cb as FilterCallback<any, any[]>, prio, false);

export const addOnceFilter = <T = any, Args extends any[] = any[]>(
  hook: HookKey,
  cb: FilterCallback<T, Args>,
  prio = 10
): Unsubscribe => filters.add(hook, cb as FilterCallback<any, any[]>, prio, true);

export const applyFilters = <T = any, Args extends any[] = any[]>(
  hook: HookKey,
  value: T,
  ...args: Args
): T => filters.applyFilters<T, Args>(hook, value, ...args);

export const applyFiltersAsync = async <T = any, Args extends any[] = any[]>(
  hook: HookKey,
  value: T,
  ...args: Args
): Promise<T> => filters.applyFiltersAsync<T, Args>(hook, value, ...args);

export const removeFilter = <T = any, Args extends any[] = any[]>(
  hook: HookKey,
  cb: FilterCallback<T, Args>
): void => filters.remove(hook, cb as FilterCallback<any, any[]>);

export const removeAllFilters = (hook?: HookKey): void => filters.removeAll(hook);

// Optional: export managers if you want lower-level access
export { actions, filters, ActionManager, FilterManager };
