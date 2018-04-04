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

import * as vscode from 'vscode';
import * as fs from 'fs';
import BeamFile from './beam/beamFile';


import { formatCode } from './codeFormatter';

export default class BeamDasmContentProvider implements vscode.TextDocumentContentProvider {

  public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
    
    if( !uri || !(uri instanceof vscode.Uri)){
      return;
    }
    
    let beamFile : string = uri.fsPath.replace(".beamdasm", ".beam");

    if( !fs.existsSync(beamFile) ){
      return;
    }

    let bm = BeamFile.fromFile(beamFile);

    //TODO: Introduce configurable formatter to have different ways to show
    //      disassembler code. similar to ILDASM, erlang .S style, etc.
    return formatCode(bm);
  }
}