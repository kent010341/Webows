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
import { WindowInstance } from '@webows/core/apps/desktop-app.model';

/**
 * Manages open desktop windows, including create and destroy.
 */
@Injectable({
  providedIn: 'root'
})
export class WindowManager {

  private uniqueId = 0;

  private readonly windowMap = signal<Map<number, WindowInstance>>(new Map<number, WindowInstance>());
  readonly windows = computed(() => [...this.windowMap().values()]);

  /** Opens a new app window */
  open(appId: DesktopAppId) {
    this.windowMap.update(pre => {
      const next = new Map(pre);
      const nextId = this.uniqueId++;

      next.set(nextId, {
        appId,
        instanceId: nextId,
        position: { x: 20, y: 20 }
      });

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
  
}
