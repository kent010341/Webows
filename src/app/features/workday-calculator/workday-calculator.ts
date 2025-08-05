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

import { Component, computed, HostListener, signal } from '@angular/core';
import { Window } from '@webows/components/window/window';
import {
  calculateNumberWithNumber,
  calculateNumberWithWorkday,
  calculateWorkdayWithNumber,
  calculateWorkdayWithWorkday,
  CALCULATOR_KEY_DISLPAY,
  CALCULATOR_KEYS,
  CalculatorKeyInput,
  FUNC_KEY_INPUT,
  GENERAL_KEY_INPUT,
  OPERATOR_KEY_INPUT,
  parseTimeToMinutes,
  ResultData,
} from '@webows/features/workday-calculator/workday-calculator.metadata';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { WindowAppBase } from '@webows/core/window/window-app.base';

/**
 * Workday calculator app with structured input handling and custom unit conversion.
 */
@Component({
  selector: 'app-workday-calculator',
  standalone: true,
  imports: [
    LucideAngularModule,
    NgClass,
    Window
  ],
  templateUrl: './workday-calculator.html',
})
export class WorkdayCalculator extends WindowAppBase {

  readonly CalculatorKeyInput = CalculatorKeyInput;
  readonly CALCULATOR_KEYS = CALCULATOR_KEYS;
  readonly CALCULATOR_KEY_DISLPAY = CALCULATOR_KEY_DISLPAY;

  readonly history = signal<string>('');
  readonly input = signal('0');

  private readonly _result = signal<ResultData>({ dataType: 'number', value: 0 });
  readonly result = this._result.asReadonly();

  readonly display = computed(() => this.input() || this._result());

  readonly isInputEmpty = computed(() => this.input() === '0');

  private pendingOperator: CalculatorKeyInput = CalculatorKeyInput.ENTER;

  /**
   * Handle keyboard input
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (!this.isFocused()) {
      return;
    }

    const key = event.key as CalculatorKeyInput;
    if (Object.values(CalculatorKeyInput).includes(key)) {
      this.applyInput(key);
      event.preventDefault();
    }
  }

  press(key: CalculatorKeyInput): void {
    this.applyInput(key);
  }

  private applyInput(key: CalculatorKeyInput): void {
    if (GENERAL_KEY_INPUT.has(key)) {
      this.input.update(f => this.isInputEmpty() ? key : f + key);
    } else if (FUNC_KEY_INPUT.has(key)) {
      switch (key) {
        case CalculatorKeyInput.BACKSPACE:
          this.backspace();
          break;
        case CalculatorKeyInput.DELETE:
          this.clearEntry();
          break;
        case CalculatorKeyInput.ESCAPE:
          this.clearAll();
          break;
      }
    } else if (OPERATOR_KEY_INPUT.has(key)) {
          this.pendingOperator = key;
          this.clearEntry();
          this.calculate();
    }
  }

  private clearEntry(): void {
    this.input.set('0');
  }

  private clearAll(): void {
    this._result.set({ dataType: 'number', value: 0 });
    this.input.set('0');
    this.history.set('');
  }

  private backspace(): void {
    this.input.update(f => {
      if (this.isInputEmpty()) {
        return f;
      }
      return f.slice(0, -1);
    });
  }

  /**
   * Executes a calculation based on current input, previous result, and pending operator.
   *
   * - If operator is Enter, replaces result directly.
   * - Otherwise dispatches to one of four utility functions based on:
   *   - number (result) {+ - * /} number (input)
   *   - workday (result) {* /} number (input)
   *   - workday (result) {+ -} workday (input)
   *   - number (result) {invalid unless Enter} workday (input)
   */
  private calculate(): void {
    this._result.update(r => {
      const next = { ...r, error: undefined };
      const input = this.input();
      const operator = this.pendingOperator;

      const numericValue = Number(input);
      const isNum = !isNaN(numericValue) && isFinite(numericValue);
      
      // if the previous operator is ENTER, it means this is a new one
      if (operator === CalculatorKeyInput.ENTER) {
        if (isNum) {
          return {
            dataType: 'number',
            value: numericValue,
          };
        } else {
          try {
            return {
              dataType: 'workday',
              value: parseTimeToMinutes(input),
            };
          } catch (e) {
            return {
              ...next,
              error: e instanceof Error ? e.message : 'Invalid workday input.',
            };
          }
        }
      }

      if (isNum && next.dataType === 'number') {
        return calculateNumberWithNumber(numericValue, next, operator);
      }
      if (isNum && next.dataType === 'workday') {
        return calculateNumberWithWorkday(numericValue, next, operator);
      }
      if (!isNum && next.dataType === 'workday') {
        return calculateWorkdayWithWorkday(input, next, operator);
      }
      if (!isNum && next.dataType === 'number') {
        return calculateWorkdayWithNumber(input, next, operator);
      }

      return {
        ...next,
        error: 'Unhandled input combination.',
      };
    });

  }

}
