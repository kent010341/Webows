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
  CALCULATOR_KEY_DISLPAY as CALCULATOR_KEY_DISPLAY,
  CALCULATOR_KEYS,
  CalculatorKeyInput,
  formatMinutesToTime,
  FUNC_KEY_INPUT,
  GENERAL_KEY_INPUT,
  generateHistory,
  InputMeta,
  InputMode,
  OPERATOR_KEY_INPUT,
  parseTimeToMinutes,
  UNIT_KEYS,
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
  readonly UNIT_KEYS = UNIT_KEYS;
  readonly CALCULATOR_KEY_DISPLAY = CALCULATOR_KEY_DISPLAY;

  readonly INIT_META: InputMeta = {
    input: '0',
    mode: InputMode.REPLACE,
    dataType: 'number',
    value: 0,
    history: '0',
    pendingOperator: CalculatorKeyInput.ENTER,
  };

  private readonly _inputMeta = signal<InputMeta>(this.INIT_META);
  readonly inputMeta = this._inputMeta.asReadonly();

  private readonly inputMode = computed(() => this.inputMeta().mode);

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
      this._inputMeta.update(m => {
        // set input
        let input;
        let mode = InputMode.APPEND;
        const isInputDot = key === CalculatorKeyInput.DOT;
        if (m.mode === InputMode.REPLACE) {
          // start with dot is invalid
          if (isInputDot) {
            input = m.input;
            mode = InputMode.REPLACE;  // invalid start stays in REPLACE mode
          } else {
            input = key;
          }
        } else {
          if ((m.input.endsWith('.') && isInputDot)) {
            input = m.input;
          } else if (m.input === '0' && !isInputDot) {
            // aviod starting with 0, unless input dot
            input = key;
          } else {
            input = m.input + key;
          }
        }

        return {
          ...m,
          input,
          mode,
        };
      });
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
        this.calculate(key);
    }
  }

  private clearEntry(): void {
    this._inputMeta.update(m => ({
      ...m,
      input:'0',
      mode: InputMode.REPLACE,
    }));
  }

  private clearAll(): void {
    this._inputMeta.set(this.INIT_META);
  }

  private backspace(): void {
    if (this.inputMode() === InputMode.REPLACE) {
      return;
    }

    this._inputMeta.update(m => ({
      ...m,
      input: m.input.length === 1 ? '0' : m.input.slice(0, -1)
    }));
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
  private calculate(nextOp: CalculatorKeyInput): void {
    // press operator key in REPLACE mode is to replace current pending operator
    if (this.inputMode() === InputMode.REPLACE) {
      this._inputMeta.update(m => {
        const next = {...m};

        const preHistory = next.pendingOperator === CalculatorKeyInput.ENTER
          ? next.history
          : next.history.slice(0, -1);  // remove the previous operator

        const nextHistory = generateHistory(preHistory, nextOp);
        
        return {
          ...next,
          history: nextHistory,
          pendingOperator: nextOp,
        };
      });
      return;
    }

    this._inputMeta.update(m => {
      const next = { ...m, error: undefined };
      const input = m.input;
      const preOp = m.pendingOperator;

      const numericValue = Number(input);
      const isNum = !isNaN(numericValue) && isFinite(numericValue);
      
      // if the previous operator is ENTER, it means this is a new one
      if (preOp === CalculatorKeyInput.ENTER) {
        if (isNum) {
          const history = generateHistory(input, nextOp);
          return {
            input,
            mode: InputMode.REPLACE,
            dataType: 'number',
            value: numericValue,
            history,
            pendingOperator: nextOp,
          };
        } else {
          try {
            const value = parseTimeToMinutes(input);
            const history = generateHistory(formatMinutesToTime(value), nextOp);
            return {
              input,
              mode: InputMode.REPLACE,
              dataType: 'workday',
              value,
              history,
              pendingOperator: nextOp,
            };
          } catch (e) {
            return {
              ...next,
              error: e instanceof Error ? e.message : 'Invalid workday input.',
              mode: InputMode.APPEND
            };
          }
        }
      }

      if (isNum && next.dataType === 'number') {
        return calculateNumberWithNumber(next, nextOp);
      }
      if (isNum && next.dataType === 'workday') {
        return calculateNumberWithWorkday(next, nextOp);
      }
      if (!isNum && next.dataType === 'workday') {
        return calculateWorkdayWithWorkday(next, nextOp);
      }
      if (!isNum && next.dataType === 'number') {
        return calculateWorkdayWithNumber(next, nextOp);
      }

      return {
        ...next,
        error: 'Unhandled input combination.',
      };
    });

  }

}
