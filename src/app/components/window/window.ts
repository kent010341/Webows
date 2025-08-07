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

import { AfterViewInit, Component, computed, ElementRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { CopyIcon, LucideAngularModule, MinusIcon, SquareIcon, XIcon } from 'lucide-angular';
import { filter, fromEvent, map, switchMap, takeUntil } from 'rxjs';
import { WindowManager } from '@webows/core/window/window-manager';
import { WindowInstance, WindowInstanceState, WindowPosition, WindowSize } from '@webows/core/apps/desktop-app.model';
import { NgClass, NgStyle } from '@angular/common';

/**
 * Represents a single resizable, draggable, and stateful desktop window.
 * Handles UI behaviors like minimize, maximize, restore, and dynamic position/size.
 */
@Component({
  selector: 'app-window',
  imports: [
    LucideAngularModule,
    NgClass,
    NgStyle,
  ],
  templateUrl: './window.html',
  styleUrl: './window.scss'
})
export class Window implements OnInit, AfterViewInit {

  readonly MinusIcon = MinusIcon;
  readonly XIcon = XIcon;

  /** The window instance */
  @Input({ required: true })
  set instance(inst: WindowInstance) {
    this.windowInstance.set(inst);
  }
  
  /**
   * The minimum width in pixels that the window can be resized to.
   * Enforced during drag-based resizing to prevent the window from collapsing too small.
   * Default is 400px.
   */
  @Input()
  minWidth = 400;

  /**
   * The minimum height in pixels that the window can be resized to.
   * Enforced during drag-based resizing to prevent the window from collapsing too small.
   * Default is 350px.
   */
  @Input()
  minHeight = 350;

  /** DOM reference to the resizable content area */
  @ViewChild('window')
  private readonly windowEl!: ElementRef<HTMLDivElement>;

  /** Element reference for the window's title (used as drag handle) */
  @ViewChild('title', {static: true})
  private readonly titleEl!: ElementRef<HTMLDivElement>;

  /** Service injection for centralized window state management */
  private readonly windowManager = inject(WindowManager);

  /** Root container element of the window */
  private readonly el: ElementRef<HTMLDivElement> = inject(ElementRef);

  private readonly _appTitle = signal<string>('');
  readonly appTitle = this._appTitle.asReadonly();

  /** The window instance */
  private readonly windowInstance = signal<WindowInstance | null>(null);

  /** Whether the window is currently maximized */
  private readonly isMaximized = computed(() => this.windowInstance()?.state === WindowInstanceState.MAXIMIZED);
  
  /** Icon to show for the maximize/restore toggle button */
  readonly maxOrRestoreIcon = computed(() => this.isMaximized() ? CopyIcon : SquareIcon);

  /** Current window dimensions */
  private readonly size = signal<WindowSize>({ width: -1, height: -1 });
  readonly width = computed(() => this.size().width);
  readonly height = computed(() => this.size().height);

  /** Current window top-left position */
  private readonly position = computed(() => this.windowInstance()?.position);

  /** Cache original size before maximize */
  private cachedSize?: WindowSize;

  /** Cache original position before maximize */
  private cachedPos?: WindowPosition;

  /** Computed Tailwind class bindings based on maximize state */
  readonly windowClass = computed(() => {
    return this.isMaximized()
      ? {
        'w-screen': true,
        'h-[calc(100vh-40px)]': true,
        'top-0': true,
        'left-0': true,
      }
      : {
        'w-96': true,
      };
  });

  /** Computed inline styles for dimensions */
  readonly windowStyle = computed(() => {
    return this.isMaximized()
      ? {}
      : {
        width: `${this.width()}px`,
        height: `${this.height()}px`,
      }
  });

  ngOnInit(): void {
    this._appTitle.set(this.windowInstance()!.title);
  }

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
      filter(() => !this.isMaximized()),
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
      this.windowManager.update(this.windowInstance()!.instanceId, {
        position,
      });
    });
  }

  /**
   * Brings this window to the top of the stacking order.
   * Triggered by clicking anywhere on the window.
   */
  moveToTop(event: Event): void {
    event.stopPropagation();
    this.windowManager.moveToTop(this.windowInstance()!.instanceId);
  }

  /**
   * Minimizes the window, hiding it from view (but not closing).
   */
  minimize(): void {
    this.windowManager.minimize(this.windowInstance()!.instanceId);
  }

  /**
   * Toggles between maximized and restored layout.
   * Saves current size and position on maximize; restores it when toggling back.
   */
  maximizeOrRestore(): void {
    if (!this.isMaximized()) {
      // maximize
      this.cachedSize = this.size();
      this.cachedPos = this.position();
      this.applyPosition({x: 0, y: 0});
      this.windowManager.maximize(this.windowInstance()!.instanceId);
    } else {
      // restore
      this.applyPosition(this.cachedPos);
      this.applySize(this.cachedSize);
      this.windowManager.restore(this.windowInstance()!.instanceId);
    }
  }

  /**
   * Closes the window and removes it from WindowManager.
   */
  close(): void {
    this.windowManager.close(this.windowInstance()!.instanceId);
  }

  /**
   * Handles window resize via mouse drag on corner or edge handles.
   * Dynamically adjusts both size and position depending on the direction.
   * Enforces minimum width and height constraints.
   *
   * @param event - The initial mousedown event on a resize handle
   * @param direction - The resize direction
   */
  onResizeStart(event: MouseEvent, direction: ResizeDirection) {
    const startX = event.clientX;
    const startY = event.clientY;

    // elRect is used for accurate position (x, y) tracking.
    // This refers to the outer root container which retains correct DOM position.
    const elRect = this.el.nativeElement.getBoundingClientRect();

    // windowRect is used for accurate size (width, height) tracking.
    // This refers to the inner resizable container which reflects the actual content size.
    const windowRect = this.windowEl.nativeElement.getBoundingClientRect();

    const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
    const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');

    mouseMove$.pipe(
      takeUntil(mouseUp$),
      map(move => {
        const dx = move.clientX - startX;
        const dy = move.clientY - startY;

        let width = windowRect.width;
        let height = windowRect.height;
        let x = elRect.left;
        let y = elRect.top;

        // Adjust based on direction
        if (direction.includes('e')) {
          width += dx;
        }
        if (direction.includes('s')) {
          height += dy;
        }
        if (direction.includes('w')) {
          width -= dx;
          if (width > this.minWidth) {
            x += dx;
          } else {
            width = this.minWidth;
          }
        }
        if (direction.includes('n')) {
          height -= dy;
          if (height > this.minHeight) {
            y += dy;
          } else {
            height = this.minHeight;
          }
        }

        return { width, height, x, y };
      })
    ).subscribe(({ width, height, x, y }) => {
      this.windowManager.update(this.windowInstance()!.instanceId, {
        position: { x, y },
      });

      this.applySize({ width, height });
    });
  }

  /**
   * Updates the reactive size signal.
   * If undefined, resets to invalid (-1) to avoid applying stale bounds.
   */
  private applySize(size: WindowSize | undefined): void {
    if (!size) {
      this.size.set({ width: -1, height: -1 })
    } else {
      this.size.set(size);
    }
  }

  /**
   * Applies new position to the WindowManager.
   */
  private applyPosition(position: WindowPosition | undefined): void {
    if (position) {
      this.windowManager.update(this.windowInstance()!.instanceId, { position });
    }
  }

}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
