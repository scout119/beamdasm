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

import BeamFile from './beam/beamFile';
import { opcodes } from './beam/opcodes';
import * as tags from './beam/tags';

let lbl: (val: number) => string;

export function formatCode(bm: BeamFile): any {

  let str = '';

  let lblLength = bm._codeNumberOfLabels.toString().length;
  lblLength = lblLength < 2 ? 2 : lblLength;
  if( !lbl ){
    lbl = (val: number) => `label${("0".repeat(lblLength) + val.toString()).slice(-lblLength)}`;
  }

  str += printModuleInfo(bm);
  str += printLiteralsTable(bm);
  str += printAtomsTable(bm);
  str += printImportTable(bm);
  str += printExportTable(bm);
  str += printLocalTable(bm);
  str += printStringTable(bm);

  for (let i = 0; i < bm._code.length; i++) {
    let obj = bm._code[i];

    if( obj.op === 2){      
      str += `\n//Function  ${bm._atoms[obj.params[0].data]}:${bm._atoms[obj.params[1].data]}/${obj.params[2].data}\n`;
    }

    if (obj.label) {
      str += `${lbl(obj.label[0].data)}:`;
    } else {
      //6 === 'label:'.length
      str += ' '.repeat(lblLength + 6);
    }

    if (obj.op === 7 || obj.op === 8) {
      str += instructionToString(bm, obj, 1);
    }
    else if (obj.op === 9) {
      str += instructionToString(bm, obj, 0);
    }
    else if (obj.op === 78) {
      str += instructionToString(bm, obj, 1);
    }
    else if (obj.op === 124 || obj.op === 125) {
      str += instructionToString(bm, obj, 2);
    }
    else {
      str += instructionToString(bm, obj, -1);
    }

    if (obj.line) {
      //skip zero lines
      if (obj.line[0].data !== 0) {
        let line_ref = bm._line_refs[obj.line[0].data];
        str += ` //line ${bm._line_fnames[line_ref[0]]}, ${line_ref[1]}`;
      }
    }

    str += '\n';
  }
  return { str: str} ;
}

function instructionToString(bm: BeamFile, obj: any, func: number): string {
  let name = opcodes[obj.op].nm;
  let str = `  ${name}` + ' '.repeat(20 - name.length);

  for (let i = 0; i < opcodes[obj.op].ar; i++) {
    if (i === func) {
      let func_info = bm._imports[obj.params[i].data];
      str += ` ${bm._atoms[func_info.module]}:${bm._atoms[func_info.function]}/${func_info.arity}`;
    }
    else {
      str += ` ${termToString(bm, obj.params[i])}`;
    }
  }
  return str;
}

function termToString(bm: BeamFile, obj: any): string {
  if (obj.tag === tags.TAG_LABEL) {
    return lbl(obj.data);
  }
  if (obj.tag === tags.TAG_X_REGISTER) {
    return `X[${obj.data}]`;
  }
  if (obj.tag === tags.TAG_Y_REGISTER) {
    return `Y[${obj.data}]`;
  }
  if (obj.tag === tags.TAG_ATOM) {
    let value = bm._atoms[obj.data];
    return value === undefined ? `.` : `${value}`;
  }
  if ( obj.tag === tags.TAG_EXT_FLOAT_REGISTER ) {
    return `FR[${obj.data}]`;
  }
  if (obj.tag === tags.TAG_EXT_LITERAL) {
    return `${bm._literals[obj.data]}`;
  }
  if (obj.tag === tags.TAG_EXT_LIST ) {
    let str = '[';
    for( let i = 0; i < obj.data.length; i++)
    {
      str += (i !== 0) ? ', ': '';
      str += `${termToString(bm,obj.data[i])}`;        
    }
    str +=']';

    return str;
  }

  if (obj.tag === tags.TAG_LITERAL || obj.tag === tags.TAG_INTEGER) {
    return `${obj.data}`;
  }
  
  return `.`;
}

export function printModuleInfo(bm: BeamFile): string {
  let str = `Module:  ${bm._atoms[1]}\n`;
  str += '\n';
  str += `Attributes: ${bm._attributes}\n`;
  str += '\n';
  str += `Compilation Info: ${bm._compilationInfo}\n`;  
  str += '\n';
  return str;
}

export function printLiteralsTable(bm: BeamFile): string {
  let str = 'Literals: ';
  str += `${bm._literals}\n`;

  str += '\n';
  return str;
}

export function printAtomsTable(bm: BeamFile): string {
  let str = 'Atoms:   ';
  let offset = str.length;

  for (let i = 0; i < bm._atoms.length; i++) {
    str += (i !== 0) ? ' '.repeat(offset) : '';
    str += `${i}\t${bm._atoms[i]}\n`;
  }
  str += '\n';

  return str;
}

export function printImportTable(bm: BeamFile): string {
  let str = 'Imports: ';
  let offset = str.length;

  for (let i = 0; i < bm._imports.length; i++) {
    let func_info = bm._imports[i];
    str += (i !== 0) ? ' '.repeat(offset) : '';
    str += `${func_info.module}/${func_info.function}/${func_info.arity} ${bm._atoms[func_info.module]}:${bm._atoms[func_info.function]}/${func_info.arity}\n`;
  }

  str += '\n';

  return str;
}

export function printExportTable(bm: BeamFile): string {

  if( !lbl ){
    let lblLength = bm._codeNumberOfLabels.toString().length;
    lblLength = lblLength < 2 ? 2 : lblLength;

      lbl = (val: number) => `label${("0".repeat(lblLength) + val.toString()).slice(-lblLength)}`;
  }

  let str = 'Exports: ';
  let offset = str.length;
  for (let i = 0; i < bm._exports.length; i++) {
    let func_info = bm._exports[i];
    str += (i !== 0) ? ' '.repeat(offset) : '';
    str += `${func_info.function}/${func_info.arity}/${func_info.label} ${bm._atoms[func_info.function]}/${func_info.arity} ${lbl(func_info.label)}\n`;
  }
  str += '\n';
  return str;
}

export function printLocalTable(bm: BeamFile): string {

  if( !lbl ){
    let lblLength = bm._codeNumberOfLabels.toString().length;
    lblLength = lblLength < 2 ? 2 : lblLength;
    
      lbl = (val: number) => `label${("0".repeat(lblLength) + val.toString()).slice(-lblLength)}`;
  }
  
  let str = 'Private: ';
  let offset = str.length;

  for( let i =0; i< bm._locals.length; i++)
  {
    let func_info = bm._locals[i];
    str += (i !== 0) ? ' '.repeat(offset) : '';    
    str += `${func_info.function}/${func_info.arity}/${func_info.label} ${bm._atoms[func_info.function]}/${func_info.arity} ${lbl(func_info.label)}\n`;
  }
  str += '\n';
  return str;
}

function printStringTable(bm: BeamFile): string {
  let str = 'Strings: ';

  str += `\"${bm._str}\"\n`;

  str += '\n';
  return str;
}