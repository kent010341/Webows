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

import { Component, computed, inject, Input, signal } from '@angular/core';
import { WindowManager } from '@webows/core/window/window-manager';
import { CopyIcon, LucideAngularModule, MinusIcon, SquareIcon, XIcon } from 'lucide-angular';

@Component({
  selector: 'app-window',
  imports: [
    LucideAngularModule,
  ],
  templateUrl: './window.html',
  styleUrl: './window.scss'
})
export class Window {

  readonly MinusIcon = MinusIcon;
  readonly XIcon = XIcon;

  @Input({required: true})
  set title(t: string) {
    this._appTitle.set(t);
  }

  @Input({required: true})
  instanceId!: number;

  private readonly windowManager = inject(WindowManager);

  private readonly _appTitle = signal<string>('');
  readonly appTitle = this._appTitle.asReadonly();

  private readonly isMaximized = signal<boolean>(false);
  readonly maxOrRestoreIcon = computed(() => this.isMaximized() ? CopyIcon : SquareIcon);

  minimize(): void {

  }

  maximizeOrRestore(): void {
    this.isMaximized.update(m => !m);
  }

  close(): void {
    this.windowManager.close(this.instanceId);
  }

}
