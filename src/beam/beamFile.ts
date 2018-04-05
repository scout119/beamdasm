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

  _chunks:any = {};

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

    this._chunks ={};
    //Quick scan to get chunks offsets and sizes
    //We want to read them in particular order, not the order
    //chunks are present in the file
    while ( offset < length )
    {
      let name = buffer.toString('utf8', offset, offset+4);
      let size = buffer.readUInt32BE(offset+4);

      this._chunks[name.toLowerCase()] = {start: offset + 8, length: size};

      offset = offset + 8 + (((size + 3)>>2)<<2);
    }

    this._atoms = ['nil'];

    if( 'atu8' in this._chunks ){
      this.readAttomsChunk(buffer, this._chunks['atu8'].start, true);
    }

    if( 'atom' in this._chunks ){
      this.readAttomsChunk(buffer, this._chunks['atom'].start, false);
    }

    if( 'impt' in this._chunks ){      
      this.readImportChunk(buffer, this._chunks['impt'].start);
    }

    if( 'expt' in this._chunks ){
      this.readExportChunk(buffer, this._chunks['expt'].start);
    }

    if( 'funt' in this._chunks ){
      this.readFunctionChunk(buffer, this._chunks['funt'].start);
    }

    if( 'loct' in this._chunks ){
      this.readLocalChunk(buffer, this._chunks['loct'].start);
    }

    if( 'strt' in this._chunks ){
      this.readStringChunk(buffer, this._chunks['strt'].start, this._chunks['strt'].length);
    }

    if( 'cinf' in this._chunks ){
      this.readCompilationInfoChunk(buffer, this._chunks['cinf'].start);
    }

    if( 'attr' in this._chunks ){
      this.readAttributesChunk(buffer, this._chunks['attr'].start);
    }

    if( 'litt' in this._chunks ){
      this.readLiteralsChunk(buffer, this._chunks['litt'].start, this._chunks['litt'].length);
    }

    if( 'line' in this._chunks ) {
      this.readLineChunk(buffer, this._chunks['line'].start);
    }

    if( 'catt' in this._chunks ){
      console.log('Found CatT chunk');
    }

    if( 'abst' in this._chunks ){
      console.log('Found Abst chunk');
    }

    // if( 'exdc' in this._chunks ) {
    //   this.readExDcChunk(buffer, this._chunks['exdc'].start, this._chunks['exdc'].length);
    // }

    // if( 'exdp' in this._chunks ) {
    //   this.readExDpChunk(buffer, this._chunks['exdp'].start);
    // }

    // if( 'dbgi' in this._chunks ) {
    //   this.readDbgiChunk(buffer, this._chunks['dbgi'].start, this._chunks['dbgi'].length);
    // }

    if( 'code' in this._chunks ){
      this.readCodeChunk(buffer, this._chunks['code'].start, this._chunks['code'].length);
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

  readAttomsChunk(buffer: Buffer, offset: number, utf: boolean) {

    let nAtoms = buffer.readUInt32BE(offset);
    offset += 4;

    while (nAtoms-- > 0) {
      let atomLength = buffer.readUInt8(offset);
      let atom = buffer.toString(utf ? 'utf8' : 'latin1', offset + 1, offset + 1 + atomLength);
      offset = offset + 1 + atomLength;
      this._atoms.push(atom);
    }
  }

  //TODO: implement the rest of the terms
  readObject(tag: number, buffer: Buffer, offset: number): any {

    switch (tag) {
      case 70: {
        return { data: "float8bytes", offset: offset + 8};
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

  readonly hex: (d:number) => string = (d: number) => ("0" + d.toString(16)).slice(-2).toUpperCase();

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
      index = tags.TAG_UNKNOWN;
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

      if( byteCode === 1){
        label = list;
        continue;
      }

      if( byteCode === 153 ){
        line = list;
        continue;
      }
      
      this._code.push({ op: byteCode, params: list, label: label, line: line });
      line = null;
      label = null;
    }
  }
}