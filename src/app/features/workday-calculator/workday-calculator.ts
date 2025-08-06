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

import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { Window } from '@webows/components/window/window';
import {
  CALCULATOR_KEY_DISLPAY as CALCULATOR_KEY_DISPLAY,
  CALCULATOR_KEYS,
  CalculatorKeyInput,
  FUNC_KEY_INPUT,
  GENERAL_KEY_INPUT,
  generateHistory,
  InputMeta,
  InputMode,
  OPERATOR_KEY_INPUT,
  UNIT_KEY_INPUT,
  UNIT_KEYS,
  WorkdaySetting,
} from '@webows/features/workday-calculator/workday-calculator.metadata';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { WindowAppBase } from '@webows/core/window/window-app.base';
import { WorkdayConversion } from './workday-conversion';

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
  providers:[
    WorkdayConversion,
  ]
})
export class WorkdayCalculator extends WindowAppBase {

  readonly CalculatorKeyInput = CalculatorKeyInput;
  readonly CALCULATOR_KEYS = CALCULATOR_KEYS;
  readonly UNIT_KEYS = UNIT_KEYS;
  readonly CALCULATOR_KEY_DISPLAY = CALCULATOR_KEY_DISPLAY;

  private readonly workdayConversion = inject(WorkdayConversion);
  
  readonly settings = this.workdayConversion.settings;

  private readonly _tempSettings = signal<WorkdaySetting>({ ...this.settings() });

  readonly tempSettings = this._tempSettings.asReadonly();

  readonly canApplySettings = computed(() => {
    const applied = this.settings();
    const now = this.tempSettings();

    return applied.daysPerWeek !== now.daysPerWeek
      || applied.hoursPerDay !== now.hoursPerDay;
  });

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
   * Currently active key for visual feedback.
   */
  private readonly _activeKey = signal<CalculatorKeyInput | null>(null);
  readonly activeKey = this._activeKey.asReadonly();

  readonly isUnitDisable = computed(() => {
    const meta = this.inputMeta();
    return meta.mode === InputMode.REPLACE
      || UNIT_KEY_INPUT.has(meta.input.slice(-1))
      || meta.input === '0'; 
  }); 

  /**
   * Handle keyboard input
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (!this.isFocused()) {
      return;
    }

    const key = event.key.toLowerCase() as CalculatorKeyInput;
    if (Object.values(CalculatorKeyInput).includes(key)) {
      this.applyInput(key);
      event.preventDefault();
    }
  }

  press(key: CalculatorKeyInput): void {
    this.applyInput(key);
  }

  /**
   * Increment/decrement temp personal settings
   */
  adjustTempSetting(field: keyof WorkdaySetting, delta: number): void {
    const current = this.tempSettings();

    this._tempSettings.update(s => {
      const next = { ...s };

      if (field === 'daysPerWeek') {
        next.daysPerWeek = Math.min(7, Math.max(1, current.daysPerWeek + delta));
      } else if (field === 'hoursPerDay') {
        next.hoursPerDay = Math.min(24, Math.max(1, current.hoursPerDay + delta));
      }

      return next;
    });
  }

  submitPersonalSettings(): void {
    this.workdayConversion.updateSetting(this.tempSettings());
    this.clearAll();
  }

  private applyInput(key: CalculatorKeyInput): void {
    this.triggerActiveKey(key);
    if (GENERAL_KEY_INPUT.has(key)) {
      if (UNIT_KEY_INPUT.has(key) && this.isUnitDisable()) {
        return;
      }

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
            // avoid double dot
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
   * Mark a key as active for a short duration (used for UI effect).
   */
  private triggerActiveKey(key: CalculatorKeyInput) {
    this._activeKey.set(key);
    setTimeout(() => {
      this._activeKey.set(null);
    }, 150);
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
            const value = this.workdayConversion.parseTimeToMinutes(input);
            const history = generateHistory(this.workdayConversion.formatMinutesToTime(value), nextOp);
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

      return this.workdayConversion.calculate(isNum, next, nextOp);
    });

  }

}
