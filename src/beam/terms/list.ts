// Copyright 2018 Valentin Ivanov (valen.ivanov@gmail.com)

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

export default class List {

  _elements: any[] = [];

  add(obj: any) {
    this._elements.push(obj);
  }

  toString(): string {
    let str = '[';
    for (let i = 0; i < this._elements.length; i++) {
      str += i!==0? ', ' : '';
      str += `${this._elements[i]}`;
    }
    str += ']';
    return str;
  }

  get(index :number) : any | undefined {
    if( index >=0 && index < this._elements.length ){
      return this._elements[index];
    }
    return;
  }
}
