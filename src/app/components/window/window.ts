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

import { AfterViewInit, Component, computed, ElementRef, inject, Input, signal, ViewChild } from '@angular/core';
import { WindowManager } from '@webows/core/window/window-manager';
import { CopyIcon, LucideAngularModule, MinusIcon, SquareIcon, XIcon } from 'lucide-angular';
import { fromEvent, map, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-window',
  imports: [
    LucideAngularModule,
  ],
  templateUrl: './window.html',
  styleUrl: './window.scss'
})
export class Window implements AfterViewInit {

  readonly MinusIcon = MinusIcon;
  readonly XIcon = XIcon;

  /** Title setter. Internally stored as a signal for reactive binding */
  @Input({ required: true })
  set title(t: string) {
    this._appTitle.set(t);
  }

  /** The unique identifier for this window instance */
  @Input({ required: true })
  instanceId!: number;

  /** Element reference for the window's title (used as drag handle) */
  @ViewChild('title', {static: true})
  private readonly titleEl!: ElementRef<HTMLDivElement>;

  private readonly windowManager = inject(WindowManager);

  /** Root container element of the window */
  private readonly el: ElementRef<HTMLDivElement> = inject(ElementRef);

  private readonly _appTitle = signal<string>('');
  readonly appTitle = this._appTitle.asReadonly();

  private readonly isMaximized = signal<boolean>(false);
  readonly maxOrRestoreIcon = computed(() => this.isMaximized() ? CopyIcon : SquareIcon);

  /**
   * Initialize RxJS streams for mouse-based dragging.
   * Streams are composed as: mousedown → mousemove* → mouseup.
   * This eliminates the need for isDragging flag and guarantees proper teardown.
   */
  ngAfterViewInit(): void {
    const mouseDown$ = fromEvent<MouseEvent>(this.titleEl.nativeElement, 'mousedown');
    const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
    const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');

    mouseDown$.pipe(
      switchMap((startEvent) => {
        const rect = this.el.nativeElement.getBoundingClientRect();

        // Calculate the offset between the mouse position and the top-left corner of the window.
        const offset = {
          x: startEvent.clientX - rect.left,
          y: startEvent.clientY - rect.top,
        };

        return mouseMove$.pipe(
          map(moveEvent => ({
            x: moveEvent.clientX - offset.x,
            y: moveEvent.clientY - offset.y,
          })),
          // Ends the drag stream when mouse is released
          takeUntil(mouseUp$)
        );
      }),
    ).subscribe(position => {
      this.windowManager.update(this.instanceId, {
        position,
      });
    });
  }

  minimize(): void {

  }

  maximizeOrRestore(): void {
    this.isMaximized.update(m => !m);
  }

  close(): void {
    this.windowManager.close(this.instanceId);
  }

}
