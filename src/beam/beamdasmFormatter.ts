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

/// <reference path="interface.ts"/>

import { opcodes } from './opcodes';
import * as Tags from './tags';

let lbl: (val: number) => string;

function instructionToString(beamFile: beamdasm.Beam, obj: any, func: number): string {
  const name = opcodes[obj.op].nm;
  let str = `  ${name}` + ' '.repeat(20 - name.length);

  for (let i = 0; i < opcodes[obj.op].ar; i++) {
    if (i === func) {
      const func_info = beamFile.imports[obj.params[i].data];
      str += ` ${beamFile.atoms[func_info.module]}:${beamFile.atoms[func_info.function]}/${func_info.arity}`;
    }
    else {
      str += ` ${termToString(beamFile, obj.params[i])}`;
    }
  }
  return str;
}

function termToString(beamFile: beamdasm.Beam, obj: any): string {
  if (obj.tag === Tags.TAG_LABEL) {
    return lbl(obj.data);
  }
  if (obj.tag === Tags.TAG_X_REGISTER) {
    return `X[${obj.data}]`;
  }
  if (obj.tag === Tags.TAG_Y_REGISTER) {
    return `Y[${obj.data}]`;
  }
  if (obj.tag === Tags.TAG_ATOM) {
    const value = beamFile.atoms[obj.data];
    return value === undefined ? `.` : `${value}`;
  }
  if (obj.tag === Tags.TAG_EXT_FLOAT_REGISTER) {
    return `FR[${obj.data}]`;
  }
  if (obj.tag === Tags.TAG_EXT_LITERAL) {
    return `${beamFile.literals[obj.data]}`;
  }
  if (obj.tag === Tags.TAG_EXT_LIST) {
    let str = '[';
    for (let i = 0; i < obj.data.length; i++) {
      str += (i !== 0) ? ', ' : '';
      str += `${termToString(beamFile, obj.data[i])}`;
    }
    str += ']';

    return str;
  }

  if (obj.tag === Tags.TAG_LITERAL || obj.tag === Tags.TAG_INTEGER) {
    return `${obj.data}`;
  }

  return `.`;
}

export class BeamdasmFormatter implements beamdasm.BeamFormatter {

  formatModuleInfo(beamFile: beamdasm.Beam): string {
    let str = `Module:  ${beamFile.atoms[1]}\n`;
    str += '\n';
    str += `Attributes: ${beamFile.attributes}\n`;
    str += '\n';
    str += `Compilation Info: ${beamFile.compilationInfo}\n`;
    str += '\n';
    return str;
  }

  formatcode(beamFile: beamdasm.Beam): string {

    let str = '';

    let lblLength = beamFile.codeNumberOfLabels.toString().length;
    lblLength = lblLength < 2 ? 2 : lblLength;
    if (!lbl) {
      lbl = (val: number) => `label${("0".repeat(lblLength) + val.toString()).slice(-lblLength)}`;
    }

    str += this.formatModuleInfo(beamFile);

    for (let i = 0; i < beamFile.code.length; i++) {
      const obj = beamFile.code[i];

      if (obj.op === 2) {
        str += `\n//Function  ${beamFile.atoms[obj.params[0].data]}:${beamFile.atoms[obj.params[1].data]}/${obj.params[2].data}\n`;
      }

      if (obj.label) {
        str += `${lbl(obj.label[0].data)}:`;
      } else {
        //6 === 'label:'.length
        str += ' '.repeat(lblLength + 6);
      }

      if (obj.op === 7 || obj.op === 8) {
        str += instructionToString(beamFile, obj, 1);
      }
      else if (obj.op === 9) {
        str += instructionToString(beamFile, obj, 0);
      }
      else if (obj.op === 78) {
        str += instructionToString(beamFile, obj, 1);
      }
      else if (obj.op === 124 || obj.op === 125) {
        str += instructionToString(beamFile, obj, 2);
      }
      else {
        str += instructionToString(beamFile, obj, -1);
      }

      if (obj.line) {
        //skip zero lines
        if (obj.line[0].data !== 0) {
          const line_ref = beamFile.lineRefs[obj.line[0].data];
          str += ` //line ${beamFile.lineFNames[line_ref[0]]}, ${line_ref[1]}`;
        }
      }

      str += '\n';
    }
    return str;
  }

  formatlitt(beamFile: beamdasm.Beam): string {
    let str = 'Literals: \n';

    for( let i = 0; i < beamFile.literals.length; i++ ){
      str += `\t${beamFile.literals[i]}\n`;
    }

    str += '\n';
    return str;
  }

  formatatu8(beamFile: beamdasm.Beam): string {
    let str = 'Atoms:   ';
    const offset = str.length;

    for (let i = 0; i < beamFile.atoms.length; i++) {
      str += (i !== 0) ? ' '.repeat(offset) : '';
      str += `${i}\t${beamFile.atoms[i]}\n`;
    }
    str += '\n';

    return str;
  }

  formatimpt(beamFile: beamdasm.Beam): string {
    let str = 'Imports: ';
    const offset = str.length;

    for (let i = 0; i < beamFile.imports.length; i++) {
      const func_info = beamFile.imports[i];
      str += (i !== 0) ? ' '.repeat(offset) : '';
      str += `${func_info.module}/${func_info.function}/${func_info.arity} ${beamFile.atoms[func_info.module]}:${beamFile.atoms[func_info.function]}/${func_info.arity}\n`;
    }

    str += '\n';

    return str;
  }

  formatexpt(beamFile: beamdasm.Beam): string {

    if (!lbl) {
      let lblLength = beamFile.codeNumberOfLabels.toString().length;
      lblLength = lblLength < 2 ? 2 : lblLength;

      lbl = (val: number) => `label${("0".repeat(lblLength) + val.toString()).slice(-lblLength)}`;
    }

    let str = 'Exports: ';
    const offset = str.length;
    for (let i = 0; i < beamFile.exports.length; i++) {
      const func_info = beamFile.exports[i];
      str += (i !== 0) ? ' '.repeat(offset) : '';
      str += `${func_info.function}/${func_info.arity}/${func_info.label} ${beamFile.atoms[func_info.function]}/${func_info.arity} ${lbl(func_info.label)}\n`;
    }
    str += '\n';
    return str;
  }

  formatloct(beamFile: beamdasm.Beam): string {

    if (!lbl) {
      let lblLength = beamFile.codeNumberOfLabels.toString().length;
      lblLength = lblLength < 2 ? 2 : lblLength;

      lbl = (val: number) => `label${("0".repeat(lblLength) + val.toString()).slice(-lblLength)}`;
    }

    let str = 'Private: ';
    const offset = str.length;

    for (let i = 0; i < beamFile.LocT.length; i++) {
      const func_info = beamFile.LocT[i];
      str += (i !== 0) ? ' '.repeat(offset) : '';
      str += `${func_info.function}/${func_info.arity}/${func_info.label} ${beamFile.atoms[func_info.function]}/${func_info.arity} ${lbl(func_info.label)}\n`;
    }
    str += '\n';
    return str;
  }

  formatstrt(beamFile: beamdasm.Beam): string {
    let str = 'Strings: ';

    str += `"${beamFile.StrT}"\n`;

    str += '\n';
    return str;
  }

  formatattr(beamFile: beamdasm.Beam): string {
    let str = 'Attributes:\n';

    str += `${beamFile.attributes}`;
    return str;
  }

  [func: string]: (beamFile: beamdasm.Beam) => string;
}