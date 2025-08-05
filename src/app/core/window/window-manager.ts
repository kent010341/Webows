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
import { DesktopAppId } from '@webows/core/apps/desktop-app.enum';
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
  readonly focusedId = computed(() =>　this.windowOrder()[0]);

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

  /** Update the specified window */
  update(instanceId: number, patch: Partial<WindowInstance>): void {
    this.windowMap.update(pre => {
      const curr = pre.get(instanceId);
      if (!curr) {
        return pre;
      }

      const next = new Map(pre);
      next.set(instanceId, { ...curr, ...patch });

      return next;
    });
  }

  /** Brings a window to the top of stacking order */
  moveToTop(instanceId: number): void {
    this.windowOrder.update(prev => {
      if (prev[0] === instanceId) {
        return prev;
      }

      return [instanceId, ...prev.filter(id => id !== instanceId)];
    });
  }

  minimize(instanceId: number): void {
    this.update(instanceId, {state: WindowInstanceState.MINIMIZED});
  }

  maximize(instanceId: number): void {
    this.update(instanceId, {state: WindowInstanceState.MAXIMIZED});
  }

  restore(instanceId: number): void {
    this.update(instanceId, {state: WindowInstanceState.NORMAL});
    this.moveToTop(instanceId);
  }

}