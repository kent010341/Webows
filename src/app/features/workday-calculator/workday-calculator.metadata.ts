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

  history: string;

  pendingOperator: CalculatorKeyInput;

  error?: string;

}

export interface WorkdaySetting {

  daysPerWeek: number,
  hoursPerDay: number

}

export enum CalculatorKeyInput {
  // unction keys
  DELETE = 'delete',
  ESCAPE = 'escape',
  BACKSPACE = 'backspace',
  ENTER = 'enter',

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
export const FUNC_KEY_INPUT = new Set<string>(['delete', 'escape', 'backspace']);

// operator keys, which cause a calculating process.
export const OPERATOR_KEY_INPUT = new Set<string>(['+', '-', '*', '/', 'enter']);

// Units, which is directly append to current input.
export const UNIT_KEY_INPUT = new Set<string>(['w', 'd', 'h', 'm']);

// Digits, which is directly append to current input.
export const DIGIT_KEY_INPUT = new Set<string>(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

// Units, Digits and decimal point, which is directly append to current input.
export const GENERAL_KEY_INPUT = new Set<string>([
  ...UNIT_KEY_INPUT, ...DIGIT_KEY_INPUT, '.'
]);

export const CALCULATOR_KEY_DISLPAY: Record<string, string | LucideIconData> = {
  'delete': 'CE',
  'escape': 'C',
  'backspace': DeleteIcon,
  '/': DivideIcon,
  'enter': EqualIcon,

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

export const UNIT_KEYS: CalculatorKeyInput[] = [
  CalculatorKeyInput.W,
  CalculatorKeyInput.D,
  CalculatorKeyInput.H,
  CalculatorKeyInput.M,
]

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
];

export function generateHistory(resultStr: string, op: CalculatorKeyInput): string {
  if (op === CalculatorKeyInput.ENTER) {
    return `${resultStr}`;
  }
  return `${resultStr} ${op}`;
}
