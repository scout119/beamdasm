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

import Tuple from './tuple';

export default class Map {
  items: Tuple[] =[];

  add( key: any, value: any) {
    const item = new Tuple();
    item.add(key);
    item.add(value);
    this.items.push(item);
  }

  toString():string {
    let str = '%{';

    for( let i = 0; i< this.items.length; i++)
    {
      str += i!==0 ? ', ' : '';
      str += `${this.items[i].items[0]} => ${this.items[0].items[1]}`;
    }

    str += '}';

    return str;
  }
}