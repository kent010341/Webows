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

import { Directive, DOCUMENT, inject, NgZone, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Subject, fromEvent, throttleTime, takeUntil } from 'rxjs';

/**
 * Have fun with your Sanu cursor!
 */
@Directive({
  selector: '[konami]'
})
export class Konami implements OnInit, OnDestroy {

  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly ngZone = inject(NgZone);

  private readonly destroy$ = new Subject<void>();
  private activated = false;
  private cursorImg: HTMLImageElement | null = null;

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      import('konami-code-js').then(({ default: KonamiCode }) => {
        const konami = new KonamiCode(() => this.activateCursor());
        // konami.disable() not needed since it's one-time activation
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Triggered once when Konami code is detected.
   */
  private activateCursor(): void {
    if (this.activated) {
      return;
    }
    this.activated = true;

    // Hide system cursor
    this.renderer.setStyle(this.document.body, 'cursor', 'none');

    // Create GIF element
    const gif = this.renderer.createElement('img') as HTMLImageElement;
    gif.src = 'cursor/sanu-loading.gif';
    gif.style.position = 'fixed';
    gif.style.width = '48px';
    gif.style.height = '48px';
    gif.style.pointerEvents = 'none';
    gif.style.zIndex = '9999';
    this.renderer.appendChild(this.document.body, gif);
    this.cursorImg = gif;

    // Efficient mouse tracking via RxJS
    fromEvent<MouseEvent>(this.document, 'mousemove')
      .pipe(throttleTime(16), takeUntil(this.destroy$))
      .subscribe((event) => {
        requestAnimationFrame(() => {
          if (this.cursorImg) {
            this.cursorImg.style.left = `${event.clientX}px`;
            this.cursorImg.style.top = `${event.clientY}px`;
          }
        });
      });
  }

}
