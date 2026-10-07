// Copyright 2018 Valentin Ivanov (valen.ivanov@gmail.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

export default class Binary {

  bytes: number[] = [];

  constructor(buffer: Buffer, offset: number, length: number) {
    for (let i = 0; i < length; i++) {
      this.bytes.push(buffer.readUInt8(offset + i));
    }
  }

  toString(): string {
    if (this.bytes.length === 0) {
      return '<<>>';
    }

    const printable = this.bytes.every(byte => byte >= 32 && byte < 127);

    if (printable) {
      let str = '';

      for (let i = 0; i < this.bytes.length; i++) {
        const char = String.fromCharCode(this.bytes[i]);
        str += (char === '\\' || char === '"') ? '\\' + char : char;
      }

      return `<<"${str}">>`;
    }

    return `<<${this.bytes.join(', ')}>>`;
  }
}
