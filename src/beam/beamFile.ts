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

import * as fs from 'fs';
import * as zlib from 'zlib';
import List from './terms/list';
import Tuple from './terms/tuple';

import { opcodes } from './opcodes';

import * as Tags from './tags';
/// <reference path="interface.ts"/>

export default class BeamFile implements beamdasm.IBeamFile {

  readonly code: any[] = [];
  _codeNumberOfFunctions: number = 0;
  codeNumberOfLabels: number = 0;
  _codeHighestOpcode: number = 0;
  _codeInstructionSet: number = 0;
  _codeExtraFields: number = 0;

  sections: any = {};

  atoms: string[] = ["nil"];
  imports: any[] = [];
  exports: any[] = [];
  LocT: any[] = [];
  StrT: string = "";

  literals: any[] = [];
  attributes: any;
  compilationInfo: any;


  lineRefs: any[] = [];
  lineFNames: any[] = [];
  lineInstrCount: number = 0;


  static fromFile(filePath: string): BeamFile {

    let beamFile = new BeamFile();

    beamFile.readBeamFile(filePath);

    return beamFile;
  }

  readBeamFile(filePath: string) {
    let buffer: Buffer = fs.readFileSync(filePath);

    let for1 = buffer.toString('utf8', 0, 4).toLowerCase();

    if (for1 !== "for1") {
      throw Error("Not a valid BEAM binary");
    }

    let length = buffer.readUInt32BE(4);

    let beam = buffer.toString('utf8', 8, 12).toLowerCase();

    if (beam !== "beam") {
      throw Error("Not a valid BEAM binary");
    }

    let offset = 12;

    this.sections = {};
    //Quick scan to get chunks offsets and sizes
    //We want to read them in particular order, not the order
    //chunks are present in the file
    while (offset < length) {
      let name = buffer.toString('utf8', offset, offset + 4);
      let size = buffer.readUInt32BE(offset + 4);

      this.sections[name.toLowerCase()] = { start: offset + 8, length: size };

      offset = offset + 8 + (((size + 3) >> 2) << 2);
    }

    this.atoms = ['nil'];


    this.readAtu8Section(buffer);
    this.readAtomSection(buffer);
    this.readImptSection(buffer);
    this.readExptSection(buffer);
    this.readFuntSection(buffer);
    this.readLoctSection(buffer);
    this.readStrtSection(buffer);
    this.readCInfSection(buffer);
    this.readAttrSection(buffer);
    this.readLittSection(buffer);
    this.readLineSection(buffer);


    if ('catt' in this.sections) {
      console.log('Found CatT chunk');
    }

    if ('abst' in this.sections) {
      console.log('Found Abst chunk');
    }

    // if( 'exdc' in this._chunks ) {
    // this.readExDcSection(buffer);
    // this.readExDpSection(buffer);
    // this.readDbgiSection(buffer);

    this.readCodeSection(buffer);
  }

  readDbgiSection(buffer: Buffer) {
    if ('dbgi' in this.sections) {
      let section = this.sections['dbgi'];
      section.name = 'Debug Info (Dbgi)';
      let offset = section.start;
      let length = section.length;

      buffer.readUInt8(offset++); //131 marker
      buffer.readUInt8(offset++); //80

      buffer.readUInt32BE(offset); offset += 4; //uncompressedSize 
      let chunk = zlib.inflateSync(buffer.slice(offset, offset + length));

      offset = 0;
      let tag = chunk.readUInt8(offset);
      let obj = this.readObject(tag, chunk, offset + 1);
      console.log(`${obj.data}`);
    }
  }

  readExDpSection(buffer: Buffer) {
    if ('exdp' in this.sections) {
      let section = this.sections['exdp'];
      section.name = 'ExDp';
      let offset = section.start;
      buffer.readUInt8(offset++); //131
      let tag = buffer.readUInt8(offset++);
      let obj = this.readObject(tag, buffer, offset);

      console.log(`${obj.data}`);
    }
  }

  readExDcSection(buffer: Buffer) {
    if ('exdc' in this.sections) {
      let section = this.sections['exdc'];
      section.name = 'ExDoc (ExDc)';
      let offset = section.offset;
      let length = section.length;
      buffer.readUInt8(offset++); //131 marker
      buffer.readUInt8(offset++); //80
      buffer.readUInt32BE(offset); offset += 4; //uncompressedSize

      let chunk = zlib.inflateSync(buffer.slice(offset, offset + length));


      offset = 0;
      let tag = chunk.readUInt8(offset);
      let obj = this.readObject(tag, chunk, offset + 1);

      console.log(`${obj.data}`);
    }
  }

  _functions: any[] = [];

  readFuntSection(buffer: Buffer) {

    if ('funt' in this.sections) {
      let section = this.sections['funt'];
      section.name = 'Functions/Lambdas (FunT)';

      this._functions = [];
      let offset = section.start;

      let count = buffer.readUInt32BE(offset);

      if (count === 0) {
        section.empty = true;
        return;
      }

      offset += 4;

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
  }

  readLineSection(buffer: Buffer) {

    if ('line' in this.sections) {
      let section = this.sections['line'];
      section.name = 'Line Numbers (Line)';
      let offset = section.start;

      this.lineRefs = [[0, 0]];
      this.lineFNames = [""];
      this.lineInstrCount = 0;
      //version
      buffer.readUInt32BE(offset); offset += 4;
      //flags
      buffer.readUInt32BE(offset); offset += 4;
      //line_instr_count
      this.lineInstrCount = buffer.readUInt32BE(offset); offset += 4;
      let num_line_refs = buffer.readUInt32BE(offset); offset += 4;
      let num_filenames = buffer.readUInt32BE(offset); offset += 4;

      let fname_index = 0;

      while (num_line_refs-- > 0) {
        let term = this.readTerm(buffer, offset);
        offset = term.offset;

        if (term.tag === Tags.TAG_ATOM) {
          num_line_refs++;
          fname_index = term.data;
        }
        else {
          this.lineRefs.push([fname_index, term.data]);
        }
      }

      while (num_filenames-- > 0) {
        let size = buffer.readUInt16BE(offset); offset += 2;
        let filename = buffer.toString('utf8', offset, offset + size);
        offset += size;
        this.lineFNames.push(filename);
      }
    }
  }

  readLittSection(buffer: Buffer) {

    if ('litt' in this.sections) {

      let section = this.sections['litt'];
      section.name = 'Literals (LitT)';
      let offset = section.start;
      let length = section.length;

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
        this.literals.push(obj.data);
      }
    }
  }

  readAttrSection(buffer: Buffer) {
    if ('attr' in this.sections) {
      let section = this.sections['attr'];
      section.name = 'Attributes (Attr)';
      let offset = section.start;
      //let marker = buffer.readUInt8(offset);
      let tag = buffer.readUInt8(offset + 1);
      this.attributes = this.readObject(tag, buffer, offset + 2).data;
    }
  }

  readCInfSection(buffer: Buffer) {
    if ('cinf' in this.sections) {
      let section = this.sections['cinf'];
      section.name = 'Compilation Info (CInf)';
      let offset = section.start;
      //let marker = buffer.readUInt8(offset);
      let tag = buffer.readUInt8(offset + 1);
      this.compilationInfo = this.readObject(tag, buffer, offset + 2).data;
    }
  }

  readStrtSection(buffer: Buffer) {
    if ('strt' in this.sections) {
      let section = this.sections['strt'];
      section.name = 'Strings (StrT)';

      let length = section.length;
      if (length === 0) {
        section.empty = true;
        return;
      }
      let offset = section.start;
      this.StrT = buffer.toString('utf8', offset, offset + length);
    }
  }

  readImptSection(buffer: Buffer) {

    if ('impt' in this.sections) {
      let section = this.sections['impt'];
      section.name = 'Imports (ImpT)';
      this.imports = [];

      let offset = section.start;
      let nImports = buffer.readUInt32BE(offset);

      if (nImports === 0) {
        section.empty = true;
        return;
      }

      offset += 4;

      while (nImports-- > 0) {
        let module = buffer.readUInt32BE(offset); offset += 4;
        let func = buffer.readUInt32BE(offset); offset += 4;
        let arity = buffer.readUInt32BE(offset); offset += 4;

        this.imports.push({ module: module, function: func, arity: arity });
      }
    }
  }

  readExptSection(buffer: Buffer) {

    if ('expt' in this.sections) {

      this.exports = [];

      let section = this.sections['expt'];
      section.name = 'Exports (ExpT)';
      let offset = section.start;
      let nExport = buffer.readUInt32BE(offset);

      if (nExport === 0) {
        section.empty = true;
        return;
      }

      offset += 4;

      while (nExport-- > 0) {
        let func = buffer.readUInt32BE(offset); offset += 4;
        let arity = buffer.readUInt32BE(offset); offset += 4;
        let label = buffer.readUInt32BE(offset); offset += 4;

        this.exports.push({ function: func, arity: arity, label: label });
      }
    }
  }

  readLoctSection(buffer: Buffer) {

    if ('loct' in this.sections) {
      this.LocT = [];

      let section = this.sections['loct'];
      section.name = 'Local Functions (LocT)';

      let offset = section.start;

      let nLocals = buffer.readUInt32BE(offset);

      if (nLocals === 0) {
        section.empty = true;
        return;
      }

      offset += 4;

      while (nLocals-- > 0) {
        let func = buffer.readUInt32BE(offset); offset += 4;
        let arity = buffer.readUInt32BE(offset); offset += 4;
        let label = buffer.readUInt32BE(offset); offset += 4;

        this.LocT.push({ function: func, arity: arity, label: label });
      }
    }
  }

  readCodeSection(buffer: Buffer) {
    if ('code' in this.sections) {
      let section = this.sections['code'];
      section.name = 'Code section (Code)';
      let offset = section.start;
      let length = section.length;

      this._codeExtraFields = buffer.readUInt32BE(offset); offset += 4;
      this._codeInstructionSet = buffer.readUInt32BE(offset); offset += 4;
      this._codeHighestOpcode = buffer.readUInt32BE(offset); offset += 4;
      this.codeNumberOfLabels = buffer.readUInt32BE(offset); offset += 4;
      this._codeNumberOfFunctions = buffer.readUInt32BE(offset); offset += 4;

      this.readBeamVmCode(buffer, offset, length - 20);
    }
  }

  readAtu8Section(buffer: Buffer) {
    if ('atu8' in this.sections) {
      let section = this.sections['atu8'];
      section.name = 'Atoms (AtU8)';
      let offset = section.start;

      let nAtoms = buffer.readUInt32BE(offset);
      if (nAtoms === 0) {
        section.empty = 0;
        return;
      }

      offset += 4;

      while (nAtoms-- > 0) {
        let atomLength = buffer.readUInt8(offset);
        let atom = buffer.toString('utf8', offset + 1, offset + 1 + atomLength);
        offset = offset + 1 + atomLength;
        this.atoms.push(atom);
      }
    }
  }

  readAtomSection(buffer: Buffer) {
    if ('atom' in this.sections) {
      let section = this.sections['atom'];
      section.name = 'Atoms (Atom)';
      let offset = section.start;

      let nAtoms = buffer.readUInt32BE(offset);
      if (nAtoms === 0) {
        section.empty = 0;
        return;
      }

      offset += 4;

      while (nAtoms-- > 0) {
        let atomLength = buffer.readUInt8(offset);
        let atom = buffer.toString('latin1', offset + 1, offset + 1 + atomLength);
        offset = offset + 1 + atomLength;
        this.atoms.push(atom);
      }
    }
  }

  //TODO: implement the rest of the terms
  readObject(tag: number, buffer: Buffer, offset: number): any {

    switch (tag) {
      case 70: {
        return { data: "float8bytes", offset: offset + 8 };
      }
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

      //console.log(`${keyObj.data}`);

      let valTag = buffer.readUInt8(offset++);
      let valObj = this.readObject(valTag, buffer, offset);
      offset = valObj.offset;

      //console.log(`${valObj.data}`);

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

  readonly hex: (d: number) => string = (d: number) => ("0" + d.toString(16)).slice(-2).toUpperCase();

  readSmallBigNum(buffer: Buffer, offset: number): any {
    let length = buffer.readUInt8(offset++);
    let sign = buffer.readUInt8(offset++);

    let result = sign === 0 ? "" : "-" + "0x";

    for (let i = 0; i < length; i++) {
      result += this.hex(buffer.readUInt8(offset + i));
    }

    return { data: result, offse: offset + length };
  }

  readTag(value: number): number {
    //TODO: Get otp20 from file, somewhere?
    let otp20 = true;
    let index = value & 0x07;

    if (index >= 7) {
      index = 6 + (value >> 4) + (otp20 ? 1 : 0);
    }

    if (index > 11) {
      index = Tags.TAG_UNKNOWN;
    }

    return index;
  }

  readTerm(buffer: Buffer, offset: number): any {
    let firstByte = buffer.readUInt8(offset++);
    let tag = this.readTag(firstByte);

    if (tag === Tags.TAG_EXT_LITERAL) {
      //Read index in literals table
      let val = this.readTerm(buffer, offset);
      offset = val.offset;
      return {
        tag: tag,
        data: val.data,
        offset: offset
      };
    }

    if (tag === Tags.TAG_EXT_LIST) {
      let size = this.readTerm(buffer, offset);
      offset = size.offset;
      let list: any[] = [];
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

    if (tag === Tags.TAG_EXT_FLOAT_REGISTER) {
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
    if (tag === Tags.TAG_EXT_ALLOC_LIST) {
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

    if (tag > Tags.TAG_CHARACTER) {
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
      if (size === 3) {
        return {
          tag: tag,
          data: (buffer.readUInt8(offset) << 16) + (buffer.readUInt8(offset + 1) << 8) + buffer.readUInt8(offset + 2),
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

    let line = null;
    let label = null;

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

      if (byteCode === 1) {
        label = list;
        continue;
      }

      if (byteCode === 153) {
        line = list;
        continue;
      }

      this.code.push({ op: byteCode, params: list, label: label, line: line });
      line = null;
      label = null;
    }
  }
}