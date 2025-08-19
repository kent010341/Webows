/**
 * MIT License
 * 
 * Copyright (c) 2025 Kent010341
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { computed, Injectable, signal } from '@angular/core';
import { DesktopAppMeta, WindowInstance, WindowInstanceState } from '@webows/core/apps/desktop-app.model';

/**
 * Manages open desktop windows, including create and destroy.
 */
@Injectable({
  providedIn: 'root'
})
export class WindowManager {

  private uniqueId = 0;

  private readonly BASE_Z_INDEX = 10000;

  private readonly windowMap = signal<Map<number, WindowInstance>>(new Map<number, WindowInstance>());
  readonly windows = computed(() => {
    const map = this.windowMap();
    const order = this.windowOrder();
    const total = order.length;

    return order.map((id, index) => {
      const win = map.get(id);
      if (!win) {
        return null;
      }

      return {
        ...win,
        zIndex: this.BASE_Z_INDEX + (total - index - 1)
      };
    }).filter(w => w != null);
  });

  readonly windowsSorted = computed(() => [...this.windows()]
    .sort((a, b) => a.instanceId - b.instanceId)
  );

  /** Tracks window stacking order, most recent first */
  private readonly windowOrder = signal<number[]>([]);

  /** Instance id of the focus window */
  readonly focusedId = computed(() => {
    const map = this.windowMap();
    const order = this.windowOrder();

    return order.find(id => !(map.get(id)?.state === WindowInstanceState.MINIMIZED));
  });

  /** Opens a new app window */
  open(appMeta: DesktopAppMeta) {
    const nextId = this.uniqueId++;
    
    this.windowMap.update(pre => {
      const next = new Map(pre);

      next.set(nextId, {
        appId: appMeta.id,
        instanceId: nextId,
        title: appMeta.label,
        position: { x: 200, y: 200 },
        zIndex: 0,  // temporary, will be recalculated
        state: WindowInstanceState.NORMAL,
      });

      return next;
    });

    this.windowOrder.update(prev => {
      const next = [nextId, ...prev];
      return next;
    });
  }

  /** Closes a window by its instance id */
  close(instanceId: number) {
    this.windowMap.update(pre => {
      const next = new Map(pre);
      next.delete(instanceId);

      return next;
    });
  }

  /** Brings a window to the top of stacking order */
  focus(instanceId: number): void {
    this.windowOrder.update(prev => {
      if (prev[0] === instanceId) {
        return prev;
      }

      return [instanceId, ...prev.filter(id => id !== instanceId)];
    });
  }

  minimize(instanceId: number): void {
    this.update(instanceId, curr => ({
      ...curr,
      state: WindowInstanceState.MINIMIZED,
      stateBeforeMinimize: curr.state
    }));
  }

  maximize(instanceId: number): void {
    this.update(instanceId, {state: WindowInstanceState.MAXIMIZED});
  }

  restore(instanceId: number): void {
    this.update(instanceId, {state: WindowInstanceState.NORMAL});
    this.focus(instanceId);
  }

  toggleTaskbarItem(instanceId: number, isFocused: boolean): void {
    if (!isFocused) {
      this.focus(instanceId);
    }

    this.update(instanceId, curr => {
      let patch: Partial<WindowInstance> = {};
      // if it's not focused and is minimized, restore its state
      if (!isFocused) {
        patch.state = curr.stateBeforeMinimize ?? WindowInstanceState.NORMAL;
      } else {
        // toggle between minimized and restored
        if (curr.state === WindowInstanceState.MINIMIZED) {
          patch.state = curr.stateBeforeMinimize ?? WindowInstanceState.NORMAL;
        } else {
          patch.state = WindowInstanceState.MINIMIZED;
          patch.stateBeforeMinimize = curr.state;
        }
      }

      return { ...curr, ...patch };
    });
  }

  /**
   * Updates a window instance.
   *
   * Two forms are supported:
   *
   * 1. **Patch object (Partial update)**  
   *    Use this when you simply want to override a few fields.
   *    ```ts
   *    manager.update(id, { state: WindowInstanceState.MAXIMIZED });
   *    manager.update(id, { title: "New Title" });
   *    ```
   *
   * 2. **Patcher function (Functional update)**  
   *    Use this when the new state depends on the current state.
   *    This ensures safe state transitions without stale reads.
   *    ```ts
   *    manager.update(id, curr => ({
   *      ...curr,
   *      state: WindowInstanceState.MINIMIZED,
   *      stateBeforeMinimize: curr.state
   *    }));
   *    ```
   *
   * Notes:
   * - This method guarantees only the specified window entry is replaced,
   *   without mutating others.
   * - Internally always wraps in `signal.update` to maintain consistency.
   */
  update(instanceId: number, patch: Partial<WindowInstance>): void;
  update(instanceId: number, patcher: (curr: WindowInstance) => WindowInstance): void;
  update(instanceId: number, patchOrFn: Partial<WindowInstance> | ((curr: WindowInstance) => WindowInstance)): void {
    this.windowMap.update(pre => {
      const curr = pre.get(instanceId);
      if (!curr) return pre;

      const next = new Map(pre);

      if (typeof patchOrFn === 'function') {
        next.set(instanceId, patchOrFn(curr));
      } else {
        next.set(instanceId, { ...curr, ...patchOrFn });
      }

      return next;
    });
  }

}
