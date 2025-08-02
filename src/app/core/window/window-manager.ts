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

import { Injectable, signal } from '@angular/core';
import { DesktopAppId } from '../apps/desktop-app.enum';

/**
 * Manages open desktop windows, including create and destroy.
 */
@Injectable({
  providedIn: 'root'
})
export class WindowManager {

  private uniqueId = 0;

  private readonly _windows = signal<WindowInstance[]>([]);
  readonly windows = this._windows.asReadonly();

  /** Opens a new app window */
  open(appId: DesktopAppId) {
    this._windows.update((w) => [...w, { appId, instanceId: this.uniqueId++ }]);
  }

  /** Closes a window by its instance id */
  close(instanceId: number) {
    this._windows.update((w) => w.filter((win) => win.instanceId !== instanceId));
  }
  
}

/** Data of an opening window */
export interface WindowInstance {

  instanceId: number;
  appId: DesktopAppId;

}
