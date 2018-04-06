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
import * as vscode from 'vscode';
import BeamFile from './beam/beamFile';
import { DasmFormatter } from './codeFormatter';

/// <reference path="interface.ts"/>
/// <reference path="codeFormatter.ts"/>



export default class BeamDasmContentProvider implements vscode.TextDocumentContentProvider {

  formatter: beamdasm.BeamBytecodeFormatter;
  constructor(){
    this.formatter = new DasmFormatter();
  }

  public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {

    if(token.isCancellationRequested){
      return;
    }

    if( !uri || !(uri instanceof vscode.Uri)){
      return;
    }

    
    let beamFile : string = uri.fsPath;//.replace(".beamdasm", ".beam");

    
    beamFile = beamFile.substr(0,beamFile.length-5);    
    if( !fs.existsSync(beamFile) ){
      return;
    }

    let bm = BeamFile.fromFile(beamFile);

    let str = '';



    //TODO: Introduce configurable formatter to have different ways to show
    //      disassembler code. similar to ILDASM, erlang .S style, etc.
    if(uri.scheme === 'beamimpt'){
      str += this.formatter.formatModuleInfo(bm);
      str += this.formatter.formatImportTable(bm);
    }
    else if(uri.scheme === 'beamexpt'){
      str += this.formatter.formatModuleInfo(bm);
      str += this.formatter.formatExportTable(bm);
    }
    else if(uri.scheme === 'beamatom') {
      str += this.formatter.formatModuleInfo(bm);
      str += this.formatter.formatAtomsTable(bm);      
    }
    else{

      // for (const key in bm._chunks) {
      //   if (bm._chunks.hasOwnProperty(key)) {
      //     const element = bm._chunks[key];
      //     console.log(key);
      //   }
      // }

      let content = this.formatter.formatCode(bm);
      str = content.str;
    }

    
    return str;
  }
}