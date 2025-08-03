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

import { Component, computed, inject, Signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DESKTOP_APPS } from '@webows/core/apps/desktop-app.data';
import { interval, map, startWith } from 'rxjs';
import { LucideAngularModule, LucideIconData, MenuIcon } from 'lucide-angular';
import { TooltipModule } from 'primeng/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';
import { WindowManager } from '@webows/core/window/window-manager';
import { WindowInstance } from '@webows/core/apps/desktop-app.model';

/**
 * Taskbar with start button, apps and time placeholder.
 */
@Component({
  selector: 'app-taskbar',
  imports: [
    DatePipe,
    LucideAngularModule,
    TooltipModule,
  ],
  templateUrl: './taskbar.html',
  styleUrl: './taskbar.scss',
})
export class Taskbar {

  readonly MenuIcon = MenuIcon;

  private readonly windowManager = inject(WindowManager);

  time = toSignal(
    interval(500).pipe(
      startWith(0),
      map(() => new Date()),
    )
  );

  /**
   * Distinct apps that currently have any instance open
   */
  readonly openApps: Signal<TaskbarItem[]> = computed(() => {
    return this.windowManager.windowsSorted().map(w => ({
      instance: w,
      icon: DESKTOP_APPS[w.appId].icon
    }));
  });

  /**
   * trigger when clicking menu button
   */
  openMenu(): void {

  }

  restoreApp(app: TaskbarItem): void {
    this.windowManager.restore(app.instance.instanceId);
  }

}

interface TaskbarItem {

  instance: WindowInstance;

  icon: LucideIconData;

}
