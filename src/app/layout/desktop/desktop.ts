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

import { AppIcon } from '@webows/components/app-icon/app-icon';
import { Component, inject, Injector } from '@angular/core';
import { DESKTOP_APPS, WINDOW_INSTANCE_ID } from '@webows/core/apps/desktop-app.data';
import { Taskbar } from '@webows/layout/desktop/taskbar/taskbar';
import { WindowInstance, WindowManager } from '@webows/core/window/window-manager';
import { DesktopAppId } from '@webows/core/apps/desktop-app.enum';
import { NgComponentOutlet } from '@angular/common';

/**
 * This component represents the main desktop environment.
 * It acts as the root visual layer where desktop icons, open windows,
 * the taskbar, and start menu will be rendered.
 */
@Component({
  selector: 'app-desktop',
  imports: [
    AppIcon,
    Taskbar,
    NgComponentOutlet
  ],
  templateUrl: './desktop.html',
  styleUrl: './desktop.scss'
})
export class Desktop {

  readonly DesktopAppId = DesktopAppId;
  readonly DESKTOP_APPS = DESKTOP_APPS;

  private readonly windowManager = inject(WindowManager);
  private readonly injector = inject(Injector);

  readonly apps = Object.values(DESKTOP_APPS);
  readonly windows = this.windowManager.windows;


  onLaunch(id: DesktopAppId): void {
    this.windowManager.open(id);
  }

  createInjector(instance: WindowInstance): Injector {
  return Injector.create({
    providers: [
      { provide: WINDOW_INSTANCE_ID, useValue: instance.instanceId },
    ],
    parent: this.injector,
  });
}


}
