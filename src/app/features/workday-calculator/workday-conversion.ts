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

import { Injectable, signal } from '@angular/core';
import {
  InputMeta,
  CalculatorKeyInput,
  InputMode,
  generateHistory,
  WorkdaySetting
} from '@webows/features/workday-calculator/workday-calculator.metadata';

@Injectable()
export class WorkdayConversion {

  private readonly _settings = signal<WorkdaySetting>({
    daysPerWeek: 5,
    hoursPerDay: 8
  });

  readonly settings = this._settings.asReadonly();

  updateSetting(partial: Partial<WorkdaySetting>) {
    this._settings.update(s => ({ ...s, ...partial }));
  }

  /**
   * Calculate the current result.
   * 
   * @param isNumInput the current is or is not a number
   * @param preMeta previous {@link InputMeta}
   * @param nextOp next operator
   * @returns next {@link InputMeta}
   */
  calculate(
    isNumInput: boolean,
    preMeta: InputMeta,
    nextOp: CalculatorKeyInput
  ): InputMeta {
      if (isNumInput && preMeta.dataType === 'number') {
        return this.calculateNumberWithNumber(preMeta, nextOp);
      }
      if (isNumInput && preMeta.dataType === 'workday') {
        return this.calculateNumberWithWorkday(preMeta, nextOp);
      }
      if (!isNumInput && preMeta.dataType === 'workday') {
        return this.calculateWorkdayWithWorkday(preMeta, nextOp);
      }
      if (!isNumInput && preMeta.dataType === 'number') {
        return this.calculateWorkdayWithNumber(preMeta, nextOp);
      }

      return {
        ...preMeta,
        error: 'Unhandled input combination.',
      };
  }

  parseTimeToMinutes(time: string): number {
    const validTimeRegex = /^[\d.\swdhm]+$/;
    const matchesRegex = /(\d+\.?\d*)\s*([wdhm])/g;

    if (!validTimeRegex.test(time)) {
      throw new Error('Invalid time format.');
    }

    let totalMinutes = 0;
    let match: RegExpExecArray | null;

    const { daysPerWeek, hoursPerDay } = this.settings();
    const MINUTES_IN_HOUR = 60;

    while ((match = matchesRegex.exec(time)) !== null) {
      const value = parseFloat(match[1]);
      const unit = match[2];

      switch (unit) {
        case 'w':
          totalMinutes += value * daysPerWeek * hoursPerDay * MINUTES_IN_HOUR;
          break;
        case 'd':
          totalMinutes += value * hoursPerDay * MINUTES_IN_HOUR;
          break;
        case 'h':
          totalMinutes += value * MINUTES_IN_HOUR;
          break;
        case 'm':
          totalMinutes += value;
          break;
      }
    }

    return totalMinutes;
  }

  /**
   * Converts total minutes into a human-readable time string using weeks (w), days (d), hours (h), and minutes (m).
   * Follows the conversion: 1w = 5d, 1d = 8h, 1h = 60m.
   *
   * @param totalMinutes - Total time in minutes
   * @returns Time string (e.g., "1w2d3h15m")
   */
  formatMinutesToTime(totalMinutes: number): string {
    if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
      throw new Error('Invalid totalMinutes value.');
    }

    const { daysPerWeek, hoursPerDay } = this.settings();

    const MINUTES_IN_HOUR = 60;

    const MINUTES_IN_DAY = hoursPerDay * MINUTES_IN_HOUR;
    const MINUTES_IN_WEEK = daysPerWeek * MINUTES_IN_DAY;

    const weeks = Math.floor(totalMinutes / MINUTES_IN_WEEK);
    totalMinutes %= MINUTES_IN_WEEK;

    const days = Math.floor(totalMinutes / MINUTES_IN_DAY);
    totalMinutes %= MINUTES_IN_DAY;

    const hours = Math.floor(totalMinutes / MINUTES_IN_HOUR);
    const minutes = +(totalMinutes % MINUTES_IN_HOUR).toFixed(1);

    let result = '';
    if (weeks > 0) {
      result += `${weeks}w`;
    }
    if (days > 0) {
      result += `${days}d`;
    }
    if (hours > 0) {
      result += `${hours}h`;
    }
    if (minutes > 0) {
      result += `${minutes}m`;
    }

    return result || '0m';
  }

  /**
   * Case: number (result) { + - * / } number (input)
   * Fully supports all arithmetic operators.
   */
  private calculateNumberWithNumber(
    state: InputMeta,
    nextOp: CalculatorKeyInput
  ): InputMeta {
    const input = Number(state.input);
    const preOp = state.pendingOperator;

    if (preOp === CalculatorKeyInput.DIVIDE && input === 0) {
      return { ...state, error: 'Division by zero', mode: InputMode.APPEND };
    }

    let result = state.value;
    switch (preOp) {
      case CalculatorKeyInput.PLUS:
        result += input;
        break;
      case CalculatorKeyInput.MINUS:
        result -= input;
        break;
      case CalculatorKeyInput.TIMES:
        result *= input;
        break;
      case CalculatorKeyInput.DIVIDE:
        result /= input;
        break;
    }

    const resultStr = String(result);
    const history = generateHistory(resultStr, nextOp);

    return {
      input: String(result),
      mode: InputMode.REPLACE,
      dataType: 'number',
      value: result,
      history,
      pendingOperator: nextOp,
    };
  }

  /**
   * Case: workday (result) { * / } number (input)
   * Only multiplication and division are allowed.
   */
  private calculateNumberWithWorkday(
    state: InputMeta,
    nextOp: CalculatorKeyInput
  ): InputMeta {
    const input = Number(state.input);
    const preOp = state.pendingOperator;

    if (preOp === CalculatorKeyInput.PLUS || preOp === CalculatorKeyInput.MINUS) {
      return {
        ...state,
        mode: InputMode.APPEND,
        error: 'Operator not allowed',
      };
    }
    if (preOp === CalculatorKeyInput.DIVIDE && input === 0) {
      return {
        ...state,
        mode: InputMode.APPEND,
        error: 'Division by zero',
      };
    }

    const result = preOp === CalculatorKeyInput.TIMES
      ? state.value * input
      : state.value / input;

    const resultStr = this.formatMinutesToTime(result);
    const history = generateHistory(resultStr, nextOp);

    return {
      input: resultStr,
      mode: InputMode.REPLACE,
      dataType: 'workday',
      value: result,
      history,
      pendingOperator: nextOp,
    };
  }

  /**
   * Case: workday (result) { + - } workday (input)
   * Supports only addition and subtraction.
   */
  private calculateWorkdayWithWorkday(
    state: InputMeta,
    nextOp: CalculatorKeyInput
  ): InputMeta {
    const input = state.input;
    const preOp = state.pendingOperator;

    if (preOp !== CalculatorKeyInput.PLUS && preOp !== CalculatorKeyInput.MINUS) {
      return {
        ...state,
        mode: InputMode.APPEND,
        error: 'Operator not allowed',
      };
    }

    try {
      const val = this.parseTimeToMinutes(input);

      switch (preOp) {
        case CalculatorKeyInput.PLUS:
          const r1 = state.value + val;
          const s1 = this.formatMinutesToTime(r1);
          const h1 = generateHistory(s1, nextOp);

          return {
            input: s1,
            mode: InputMode.REPLACE,
            dataType: 'workday',
            value: state.value + val,
            pendingOperator: nextOp,
            history: h1,
          };
        case CalculatorKeyInput.MINUS:
          const r2 = state.value - val;
          const s2 = this.formatMinutesToTime(r2);
          const h2 = generateHistory(s2, nextOp);
          return {
            input: s2,
            mode: InputMode.REPLACE,
            dataType: 'workday',
            value: r2,
            history: h2,
            pendingOperator: nextOp,
          };
      }
    } catch (e) {
      return {
        ...state,
        mode: InputMode.APPEND,
        error: 'Invalid workday',
      };
    }
  }

  /**
   * Case: number (result) { * } workday (input)
   * Only multiplication is allowed. All other operators are rejected.
   */
  private calculateWorkdayWithNumber(
    state: InputMeta,
    nextOp: CalculatorKeyInput
  ): InputMeta {
    const input = state.input;
    const preOp = state.pendingOperator;

    if (preOp !== CalculatorKeyInput.TIMES) {
      return {
        ...state,
        error: 'Operator not allowed',
      };
    }

    try {
      const val = this.parseTimeToMinutes(input);
      const result = state.value * val;
      const resultStr = this.formatMinutesToTime(result);
      const history = generateHistory(resultStr, nextOp);

      return {
        input: resultStr,
        mode: InputMode.REPLACE,
        dataType: 'workday',
        value: result,
        history,
        pendingOperator: nextOp,
      };
    } catch (e) {
      return {
        ...state,
        mode: InputMode.APPEND,
        error: 'Invalid workday',
      };
    }
  }

}
