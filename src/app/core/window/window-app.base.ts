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

import { inject, computed, Signal, Directive, Input } from '@angular/core';
import { WindowManager } from '@webows/core/window/window-manager';
import { WindowInstance } from '@webows/core/apps/desktop-app.model';

/**
 * Base class for desktop apps running inside windows.
 * Provides shared access to window instance, focus state, and utilities.
 */
@Directive()
export abstract class WindowAppBase {

  /**
   * The instance of this window.
   */
  @Input({ required: true })
  instance!: WindowInstance;

  /**
   * Reference to the WindowManager service.
   */
  protected readonly windowManager = inject(WindowManager);

  /**
   * Indicating whether this app currently has focus.
   */
  readonly isFocused: Signal<boolean> = computed(() =>
    this.windowManager.focusedId() === this.instance.instanceId
  );
}
