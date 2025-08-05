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

import {
  DivideIcon,
  XIcon,
  EqualIcon,
  DeleteIcon,
  LucideIconData,
} from 'lucide-angular';

/**
 * Represents the current mode of input behavior in a calculator UI.
 */
export enum InputMode {

  /**
   * Next {@link GENERAL_KEY_INPUT} will replace the current input.
   * Triggered after {@link FUNC_KEY_INPUT} or {@link OPERATOR_KEY_INPUT},
   * excluding {@link CalculatorKeyInput.BACKSPACE}.
   */
  REPLACE = 'REPLACE',

  /**
   * Next {@link GENERAL_KEY_INPUT} will be appended to the current input.
   * Triggered after {@link GENERAL_KEY_INPUT} or {@link CalculatorKeyInput.BACKSPACE}.
   */
  APPEND = 'APPEND',

}


export interface InputMeta {

  input: string;

  mode: InputMode;

  dataType: 'number' | 'workday';

  /**
   * Current result value. If {@link dataType} is:
   * - 'number': pure number
   * - 'workday': workday parsed in minutes
   */
  value: number;

  pendingOperator: CalculatorKeyInput;

  error?: string;

}

export enum CalculatorKeyInput {
  // unction keys
  DELETE = 'Delete',
  ESCAPE = 'Escape',
  BACKSPACE = 'Backspace',
  ENTER = 'Enter',

  // Operators
  DIVIDE = '/',
  TIMES = '*',
  MINUS = '-',
  PLUS = '+',

  // Digits and decimal point
  DIGIT_0 = '0',
  DIGIT_1 = '1',
  DIGIT_2 = '2',
  DIGIT_3 = '3',
  DIGIT_4 = '4',
  DIGIT_5 = '5',
  DIGIT_6 = '6',
  DIGIT_7 = '7',
  DIGIT_8 = '8',
  DIGIT_9 = '9',
  DOT = '.',

  // Units
  W = 'w',
  D = 'd',
  H = 'h',
  M = 'm',
}

// Function keys, which is effect on the input or result slot.
export const FUNC_KEY_INPUT = new Set<string>(['Delete', 'Escape', 'Backspace']);

// operator keys, which cause a calculating process.
export const OPERATOR_KEY_INPUT = new Set<string>(['+', '-', '*', '/', 'Enter']);

// Units, which is directly append to current input.
export const UNIT_KEY_INPUT = new Set<string>(['w', 'd', 'h', 'm']);

// Digits, which is directly append to current input.
export const DIGIT_KEY_INPUT = new Set<string>(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

// Units, Digits and decimal point, which is directly append to current input.
export const GENERAL_KEY_INPUT = new Set<string>([
  ...UNIT_KEY_INPUT, ...DIGIT_KEY_INPUT, '.'
]);

export const CALCULATOR_KEY_DISLPAY: Record<string, string | LucideIconData> = {
  'Delete': 'CE',
  'Escape': 'C',
  'Backspace': DeleteIcon,
  '/': DivideIcon,
  'Enter': EqualIcon,

  '7': '7',
  '8': '8',
  '9': '9',
  '*': XIcon,
  '4': '4',
  '5': '5',
  '6': '6',
  '-': '-',
  '1': '1',
  '2': '2',
  '3': '3',
  '+': '+',
  '0': '0',
  '.': '.',

  'w': 'w',
  'd': 'd',
  'h': 'h',
  'm': 'm',
}

export const CALCULATOR_KEYS: CalculatorKeyInput[] = [
  CalculatorKeyInput.DELETE,
  CalculatorKeyInput.ESCAPE,
  CalculatorKeyInput.BACKSPACE,
  CalculatorKeyInput.DIVIDE,

  CalculatorKeyInput.DIGIT_7,
  CalculatorKeyInput.DIGIT_8,
  CalculatorKeyInput.DIGIT_9,
  CalculatorKeyInput.TIMES,

  CalculatorKeyInput.DIGIT_4,
  CalculatorKeyInput.DIGIT_5,
  CalculatorKeyInput.DIGIT_6,
  CalculatorKeyInput.MINUS,

  CalculatorKeyInput.DIGIT_1,
  CalculatorKeyInput.DIGIT_2,
  CalculatorKeyInput.DIGIT_3,
  CalculatorKeyInput.PLUS,

  CalculatorKeyInput.DIGIT_0,
  CalculatorKeyInput.DOT,
  CalculatorKeyInput.ENTER,

  CalculatorKeyInput.W,
  CalculatorKeyInput.D,
  CalculatorKeyInput.H,
  CalculatorKeyInput.M,
];

export function parseTimeToMinutes(time: string): number {
  const validTimeRegex = /^[\d.\swdhm]+$/;
  const matchesRegex = /(\d+\.?\d*)\s*([wdhm])/g;

  if (!validTimeRegex.test(time)) {
    throw new Error('Invalid time format.');
  }

  let totalMinutes = 0;
  let match: RegExpExecArray | null;

  while ((match = matchesRegex.exec(time)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'w':
        totalMinutes += value * 5 * 8 * 60;
        break;
      case 'd':
        totalMinutes += value * 8 * 60;
        break;
      case 'h':
        totalMinutes += value * 60;
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
export function formatMinutesToTime(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
    throw new Error('Invalid totalMinutes value.');
  }

  const MINUTES_IN_HOUR = 60;
  const HOURS_IN_DAY = 8;
  const DAYS_IN_WEEK = 5;

  const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
  const MINUTES_IN_WEEK = DAYS_IN_WEEK * MINUTES_IN_DAY;

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
export function calculateNumberWithNumber(
  input: number,
  state: InputMeta,
  nextOp: CalculatorKeyInput
): InputMeta {
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

  return {
    input: String(result),
    dataType: 'number',
    value: result,
    pendingOperator: nextOp,
    mode: InputMode.REPLACE
  };
}

/**
 * Case: workday (result) { * / } number (input)
 * Only multiplication and division are allowed.
 */
export function calculateNumberWithWorkday(
  input: number,
  state: InputMeta,
  nextOp: CalculatorKeyInput
): InputMeta {
  const preOp = state.pendingOperator;
  if (preOp === CalculatorKeyInput.PLUS || preOp === CalculatorKeyInput.MINUS) {
    return { ...state, error: 'Operator not allowed', mode: InputMode.APPEND };
  }
  if (preOp === CalculatorKeyInput.DIVIDE && input === 0) {
    return { ...state, error: 'Division by zero', mode: InputMode.APPEND };
  }

  const result = preOp === CalculatorKeyInput.TIMES
    ? state.value * input
    : state.value / input;

  return {
    input: formatMinutesToTime(result),
    dataType: 'workday',
    value: result,
    pendingOperator: nextOp,
    mode: InputMode.REPLACE
  };
}

/**
 * Case: workday (result) { + - } workday (input)
 * Supports only addition and subtraction.
 */
export function calculateWorkdayWithWorkday(
  input: string,
  state: InputMeta,
  nextOp: CalculatorKeyInput
): InputMeta {
  const preOp = state.pendingOperator;
  try {
    if (preOp !== CalculatorKeyInput.PLUS && preOp !== CalculatorKeyInput.MINUS) {
      return {
        ...state,
        error: 'Operator not allowed',
        mode: InputMode.APPEND
      };
    }

    const val = parseTimeToMinutes(input);
    
    switch (preOp) {
      case CalculatorKeyInput.PLUS:
        const r1 = state.value + val;
        return {
          input: formatMinutesToTime(r1),
          dataType: 'workday',
          value: state.value + val,
          pendingOperator: nextOp,
          mode: InputMode.REPLACE
        };
      case CalculatorKeyInput.MINUS:
        const r2 = state.value - val;
        return {
          input: formatMinutesToTime(r2),
          dataType: 'workday',
          value: r2,
          pendingOperator: nextOp,
          mode: InputMode.REPLACE
        };
    }
  } catch (e) {
    return {
      ...state,
      error: 'Invalid workday',
      mode: InputMode.APPEND
    };
  }
}

/**
 * Case: number (result) { * } workday (input)
 * Only multiplication is allowed. All other operators are rejected.
 */
export function calculateWorkdayWithNumber(
  input: string,
  state: InputMeta,
  nextOp: CalculatorKeyInput
): InputMeta {
  const preOp = state.pendingOperator;
  if (preOp !== CalculatorKeyInput.TIMES) {
    return {
      ...state,
      error: 'Operator not allowed',
    };
  }

  try {
    const val = parseTimeToMinutes(input);
    const result = state.value * val;
    return {
      input: formatMinutesToTime(result),
      dataType: 'workday',
      value: result,
      pendingOperator: nextOp,
      mode: InputMode.REPLACE
    };
  } catch (e) {
    return {
      ...state,
      error: 'Invalid workday',
      mode: InputMode.APPEND
    };
  }
}
