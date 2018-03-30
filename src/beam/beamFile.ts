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

import * as fs from 'fs';
import * as zlib from 'zlib';
import List from './terms/list';
import Tuple from './terms/tuple';

import { opcodes } from './opcodes';
import * as tags from './tags';


export default class BeamFile {

  _code: any[] = [];
  _codeNumberOfFunctions: number = 0;
  _codeNumberOfLabels: number = 0;
  _codeHighestOpcode: number = 0;
  _codeInstructionSet: number = 0;
  _codeExtraFields: number = 0;

  _atoms: string[] = ["nil"];
  _imports: any[] = [];
  _exports: any[] = [];
  _locals: any[] = [];
  _str: string = "";

  _literals: any[] = [];
  _attributes: any;
  _compilationInfo: any;

  static fromFile(filePath: string): BeamFile {

    let beamFile = new BeamFile();

    beamFile.readBeamFile(filePath);

    return beamFile;
  }

  readBeamFile(filePath: string) {
    let buffer: Buffer = fs.readFileSync(filePath);

    let for1 = buffer.toString('utf8', 0, 4);

    if (for1 !== "FOR1") {
      throw Error("Not a valid BEAM binary");
    }

    let length = buffer.readUInt32BE(4);

    let beam = buffer.toString('utf8', 8, 12);

    if (beam !== "BEAM") {
      throw Error("Not a valid BEAM binary");
    }

    let offset = 12;

    while (offset < length) {
      var chunkName = buffer.toString('utf8', offset, offset + 4);
      offset += 4;
      var chunkLength = buffer.readUInt32BE(offset);
      var chunkStart = offset + 4;

      switch (chunkName) {
        case 'AtU8':
          this.readAttomsChunk(buffer, chunkStart);
          break;
        case 'Code':
          this.readCodeChunk(buffer, chunkStart, chunkLength);
          break;
        case 'ImpT':
          this.readImportChunk(buffer, chunkStart);
          break;
        case 'ExpT':
          this.readExportChunk(buffer, chunkStart);
          break;
        case 'FunT':
          this.readFunctionChunk(buffer, chunkStart);
          break;
        case 'LocT':
          this.readLocalChunk(buffer, chunkStart);
          break;
        case 'StrT':
          this.readStringChunk(buffer, chunkStart, chunkLength);
          break;
        case 'CInf':
          this.readCompilationInfoChunk(buffer, chunkStart);
          break;
        case 'Attr':
          this.readAttributesChunk(buffer, chunkStart);
          break;
        case 'LitT':
          this.readLiteralsChunk(buffer, chunkStart, chunkLength);
          break;
        case 'Line':
          this.readLineChunk(buffer, chunkStart);
          break;
        case 'ExDc':
          //this.readExDcChunk(buffer, chunkStart, chunkLength);
          break;
        case 'ExDp':
          //this.readExDpChunk(buffer, chunkStart);
          break;
        case 'Dbgi':
          //this.readDbgiChunk(buffer, chunkStart, chunkLength);
          break;
        default:
          console.log(`Reading chunk: ${chunkName}(${chunkLength} bytes) is not implemented.`);
          break;
      }

      var nextChunk = ((chunkLength + 3) >> 2) << 2;
      offset = chunkStart + nextChunk;
    }
  }

  readDbgiChunk(buffer: Buffer, offset: number, length: number) {
    buffer.readUInt8(offset++); //131 marker
    buffer.readUInt8(offset++); //80

    buffer.readUInt32BE(offset); offset += 4; //uncompressedSize 
    let chunk = zlib.inflateSync(buffer.slice(offset, offset + length));

    offset = 0;
    let tag = chunk.readUInt8(offset);
    let obj = this.readObject(tag, chunk, offset + 1);
    console.log(`${obj.data}`);
  }

  readExDpChunk(buffer: Buffer, offset: number) {
    buffer.readUInt8(offset++); //131
    let tag = buffer.readUInt8(offset++);
    let obj = this.readObject(tag, buffer, offset);

    console.log(`${obj.data}`);
  }

  readExDcChunk(buffer: Buffer, offset: number, length: number) {
    buffer.readUInt8(offset++); //131 marker
    buffer.readUInt8(offset++); //80
    buffer.readUInt32BE(offset); offset += 4; //uncompressedSize

    let chunk = zlib.inflateSync(buffer.slice(offset, offset + length));


    offset = 0;
    let tag = chunk.readUInt8(offset);
    let obj = this.readObject(tag, chunk, offset + 1);

    console.log(`${obj.data}`);
    //let numValues = res.readUInt32BE(0);
  }


  _functions: any[] = [];

  readFunctionChunk(buffer: Buffer, offset: number) {
    let count = buffer.readUInt32BE(offset); offset += 4;
    this._functions = [];
    while (count-- > 0) {
      let atom_index = buffer.readUInt32BE(offset); offset += 4;
      let arity = buffer.readUInt32BE(offset); offset += 4;
      let code_position = buffer.readUInt32BE(offset); offset += 4;
      let index = buffer.readUInt32BE(offset); offset += 4;
      let n_free = buffer.readInt32BE(offset); offset += 4;
      let ouniq = buffer.readUInt32BE(offset); offset += 4;

      this._functions.push({
        atom: atom_index,
        arity: arity,
        code: code_position,
        index: index,
        free: n_free,
        ouniq: ouniq
      });
    }
  }

  _line_refs: any[] = [];
  _line_fnames: any[] = [];
  _line_instr_count: number = 0;

  readLineChunk(buffer: Buffer, offset: number) {

    this._line_refs = [[0, 0]];
    this._line_fnames = [""];
    this._line_instr_count = 0;
    //version
    buffer.readUInt32BE(offset); offset += 4;
    //flags
    buffer.readUInt32BE(offset); offset += 4;
    //line_instr_count
    this._line_instr_count = buffer.readUInt32BE(offset); offset += 4;
    let num_line_refs = buffer.readUInt32BE(offset); offset += 4;
    let num_filenames = buffer.readUInt32BE(offset); offset += 4;

    let fname_index = 0;

    while (num_line_refs-- > 0) {
      let term = this.readTerm(buffer, offset);
      offset = term.offset;

      if (term.tag === tags.TAG_ATOM) {
        num_line_refs++;
        fname_index = term.data;
      }
      else {
        this._line_refs.push([fname_index, term.data]);
      }
    }

    while (num_filenames-- > 0) {
      let size = buffer.readUInt16BE(offset); offset += 2;
      let filename = buffer.toString('utf8', offset, offset + size);
      offset += size;
      this._line_fnames.push(filename);
    }
  }

  readLiteralsChunk(buffer: Buffer, offset: number, length: number) {

    buffer.readUInt32BE(offset); offset += 4; //uncompressedSize

    let chunk = zlib.inflateSync(buffer.slice(offset, offset + length));

    let numValues = chunk.readUInt32BE(0);

    offset = 4;
    while (numValues-- > 0) {
      //Ignore "skip" UInt32 value and "marker" byte"
      offset += 5;
      let tag = chunk.readUInt8(offset);
      let obj = this.readObject(tag, chunk, offset + 1);
      offset = obj.offset;
      this._literals.push(obj.data);
    }
  }

  readAttributesChunk(buffer: Buffer, offset: number) {
    //let marker = buffer.readUInt8(offset);
    let tag = buffer.readUInt8(offset + 1);
    this._attributes = this.readObject(tag, buffer, offset + 2).data;
  }

  readCompilationInfoChunk(buffer: Buffer, offset: number) {
    //let marker = buffer.readUInt8(offset);
    let tag = buffer.readUInt8(offset + 1);
    this._compilationInfo = this.readObject(tag, buffer, offset + 2).data;
  }

  readStringChunk(buffer: Buffer, offset: number, length: number) {
    this._str = buffer.toString('utf8', offset, offset + length);
  }

  readImportChunk(buffer: Buffer, offset: number) {

    this._imports = [];

    let nImports = buffer.readUInt32BE(offset);
    offset += 4;

    while (nImports-- > 0) {
      let module = buffer.readUInt32BE(offset); offset += 4;
      let func = buffer.readUInt32BE(offset); offset += 4;
      let arity = buffer.readUInt32BE(offset); offset += 4;

      this._imports.push({ module: module, function: func, arity: arity });
    }
  }

  readExportChunk(buffer: Buffer, offset: number) {

    this._exports = [];

    let nExport = buffer.readUInt32BE(offset);
    offset += 4;


    while (nExport-- > 0) {
      let func = buffer.readUInt32BE(offset); offset += 4;
      let arity = buffer.readUInt32BE(offset); offset += 4;
      let label = buffer.readUInt32BE(offset); offset += 4;

      this._exports.push({ function: func, arity: arity, label: label });
    }
  }

  readLocalChunk(buffer: Buffer, offset: number) {

    this._locals = [];

    let nLocals = buffer.readUInt32BE(offset);
    offset += 4;

    while (nLocals-- > 0) {
      let func = buffer.readUInt32BE(offset); offset += 4;
      let arity = buffer.readUInt32BE(offset); offset += 4;
      let label = buffer.readUInt32BE(offset); offset += 4;

      this._locals.push({ function: func, arity: arity, label: label });
    }
  }

  readCodeChunk(buffer: Buffer, offset: number, length: number) {
    this._codeExtraFields = buffer.readUInt32BE(offset); offset += 4;
    this._codeInstructionSet = buffer.readUInt32BE(offset); offset += 4;
    this._codeHighestOpcode = buffer.readUInt32BE(offset); offset += 4;
    this._codeNumberOfLabels = buffer.readUInt32BE(offset); offset += 4;
    this._codeNumberOfFunctions = buffer.readUInt32BE(offset); offset += 4;

    this.readBeamVmCode(buffer, offset, length - 20);
  }

  readAttomsChunk(buffer: Buffer, offset: number) {
    this._atoms = ["nil"];

    let nAtoms = buffer.readUInt32BE(offset);
    offset += 4;

    while (nAtoms-- > 0) {
      let atomLength = buffer.readUInt8(offset);
      let atom = buffer.toString('utf8', offset + 1, offset + 1 + atomLength);
      offset = offset + 1 + atomLength;
      this._atoms.push(atom);
    }
  }

  //TODO: implement the rest of the terms
  readObject(tag: number, buffer: Buffer, offset: number): any {

    switch (tag) {
      case 97:
        return { data: buffer.readUInt8(offset), offset: offset + 1 };
      case 98:
        return { data: buffer.readUInt32BE(offset), offset: offset + 4 };
      case 100:
        return this.readAtom(buffer, offset);
      case 104:
        return this.readSmallTuple(buffer, offset);
      case 106:
        return { data: null, offset: offset };
      case 107:
        return this.readString(buffer, offset);
      case 108:
        return this.readList(buffer, offset);
      case 109:
        return this.readBinaryText(buffer, offset);
      case 110:
        return this.readSmallBigNum(buffer, offset);
      case 116:
        return this.readMap(buffer, offset);
      default:
        console.log(`Term: ${tag} is not implmented`);
        return { data: null };
    }
  }

  readList(buffer: Buffer, offset: number): any {
    let list = new List();

    let listLength = buffer.readUInt32BE(offset); offset += 4;

    while (listLength-- > 0) {
      let tag = buffer.readUInt8(offset++);
      let obj = this.readObject(tag, buffer, offset);
      list.add(obj.data);
      offset = obj.offset;
    }

    //TODO: deal with 106 and improper lists
    buffer.readUInt8(offset++); //tail

    return { data: list, offset: offset };
  }

  readSmallTuple(buffer: Buffer, offset: number): any {
    let tuple = new Tuple();

    let arity = buffer.readUInt8(offset++);

    while (arity-- > 0) {
      let tag = buffer.readUInt8(offset++);
      let obj = this.readObject(tag, buffer, offset);
      tuple.add(obj.data);
      offset = obj.offset;
    }

    return { data: tuple, offset: offset };
  }

  readMap(buffer: Buffer, offset: number): any {
    let arity = buffer.readUInt32BE(offset); offset += 4;
    while (arity-- > 0) {
      let keyTag = buffer.readUInt8(offset++);
      let keyObj = this.readObject(keyTag, buffer, offset);
      offset = keyObj.offset;

      console.log(`${keyObj.data}`);

      let valTag = buffer.readUInt8(offset++);
      let valObj = this.readObject(valTag, buffer, offset);
      offset = valObj.offset;

      console.log(`${valObj.data}`);

      //Add object to the map
    }

    return { data: "Map", offset: offset };
  }

  readAtom(buffer: Buffer, offset: number): any {
    let length = buffer.readUInt16BE(offset); offset += 2;

    return { data: buffer.toString('utf8', offset, offset + length), offset: offset + length };
  }

  readString(buffer: Buffer, offset: number): any {
    let length = buffer.readUInt16BE(offset);
    offset += 2;

    return { data: buffer.toString('utf8', offset, offset + length), offset: offset + length };
  }

  //TODO: convert into a byte array instead
  readBinaryText(buffer: Buffer, offset: number): any {
    let length = buffer.readUInt32BE(offset);
    offset += 4;

    return { data: buffer.toString('utf8', offset, offset + length), offset: offset + length };
  }

  readSmallBigNum(buffer: Buffer, offset: number): any {
    const hex = (d: number) => ("0" + d.toString(16)).slice(-2).toUpperCase();
    let length = buffer.readUInt8(offset++);
    let sign = buffer.readUInt8(offset++);

    let result = sign === 0 ? "" : "-" + "0x";

    for (let i = 0; i < length; i++) {
      result += hex(buffer.readUInt8(offset + i));
    }

    return { data: result, offse: offset + length };
  }

  readTag(value: number): number {
    let otp20 = true;
    let index = value & 0x07;

    if (index >= 7) {
      index = 6 + (value >> 4) + (otp20 ? 1 : 0);
    }

    if (index > 11) {
      return tags.TAG_UNKNOWN;
    }

    return index;
  }

  readTerm(buffer: Buffer, offset: number): any {
    let firstByte = buffer.readUInt8(offset++);
    let tag = this.readTag(firstByte);

    if (tag === tags.TAG_EXT_LITERAL) {
      //Read index in literals table
      let val = this.readTerm(buffer, offset);
      offset = val.offset;
      return {
        tag: tag,
        data: val.data,
        offset: offset
      };
    }

    if (tag === tags.TAG_EXT_LIST) {
      let size = this.readTerm(buffer, offset);
      offset = size.offset;
      let list:any[] = [];
      for (let i = 0; i < size.data; i++) {
        let obj = this.readTerm(buffer, offset);
        offset = obj.offset;
        list.push(obj);
      }
      return {
        tag: tag,
        data: list,
        offset: offset
      };
    }

    if (tag === tags.TAG_EXT_FLOAT_REGISTER) {
      //Read register number
      let val = this.readTerm(buffer, offset);
      //Would not hurt to assert the bellow assumption
      //i.e. assert( val.tag === TAG_LITERAL );
      offset = val.offset;
      return {
        tag: tag,
        //Float registers contain TAG_LITERAL for the register number
        //safe to pass it directly instead of nesting, but keep the tag
        //for reporting purposes
        data: val.data, 
        offset: offset
      };
    }
    if (tag === tags.TAG_EXT_ALLOC_LIST) {
      let size = this.readTerm(buffer, offset);
      offset = size.offset;
      let list = [];
      for (let i = 0; i < size.data; i++) {
        let obj = this.readTerm(buffer, offset);
        offset = obj.offset;
        list.push(obj);

        obj = this.readTerm(buffer, offset);
        offset = obj.offset;
        list.push(obj);
      }
      return {
        tag: tag,
        data: list,
        offset: offset
      };
    }

    if (tag > tags.TAG_CHARACTER) {
      console.log(`READING TAG: ${tag} is not implemented`);
    }

    //TODO: Add code for the rest of the EXT tags

    if ((firstByte & 0x8) === 0) {
      return {
        tag: tag,
        data: firstByte >> 4,
        offset: offset
      };
    }
    if ((firstByte & 0x10) === 0) {
      return {
        tag: tag,
        data: ((firstByte & 0xE0) << 3) | buffer.readUInt8(offset++),
        offset: offset
      };
    }

    let size = firstByte >> 5;

    if (size < 7) {
      size += 2;
      if (size === 2) {
        return {
          tag: tag,
          data: buffer.readUInt16BE(offset),
          offset: offset + 2
        };
      }
      if( size === 3 ) {
        return {
          tag: tag,
          data: (buffer.readUInt8(offset) << 16) + (buffer.readUInt8(offset+1) << 8) + buffer.readUInt8(offset+2),
          offset: offset + 3
        };
      }
      if (size <= 4) {
        return {
          tag: tag,
          data: buffer.readUInt32BE(offset),
          offset: offset + 4
        };
      }

      //TODO: add support for 64-bit numbers
      return {
        tag: tag,
        data: [buffer.readUInt32BE(offset), buffer.readUInt32BE(offset + 4)],
        offset: offset + 8
      };
    }

    //TODO: complete reading the data into a byte array
    let sizeObject = this.readTerm(buffer, offset);
    // for( let i = 0; i<sizeObject.data; i++ )
    // {
    // }
    return { tag: tag, data: "", offset: sizeObject.offset };
  }


  readBeamVmCode(buffer: Buffer, offset: number, length: number) {

    length = offset + length;
    while (offset < length) {
      let byteCode = buffer.readUInt8(offset++);

      if (byteCode > 163) {
        console.log(`Illegal opcode ${byteCode}`);
      }

      // if( byteCode === 125 ){
      //   console.log('fdiv');
      // }

      let list = [];
      for (let i = 0; i < opcodes[byteCode].ar; i++) {
        let obj = this.readTerm(buffer, offset);
        offset = obj.offset;
        list.push(obj);
      }
      this._code.push({ op: byteCode, params: list });
    }
  }
}