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
import * as vscode from 'vscode';

import { BeamdasmFormatter } from './beam/beamdasmFormatter';
import { ErlangFormatter } from './beam/erlangFormatter';
import { BeamCache } from './beam/beamFileCache';

/// <reference path="interface.ts"/>
/// <reference path="beamdasmFormatter.ts"/>
/// <reference path="erlangFormatter.ts"/>



export default class BeamTextDocumentContentProvider implements vscode.TextDocumentContentProvider {

  formatters: { [s: string]: beamdasm.BeamBytecodeFormatter; } = {};

  constructor() {
    this.formatters['erlang'] = new ErlangFormatter();
    this.formatters['beamdasm'] = new BeamdasmFormatter();
  }

  public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {

    if (token.isCancellationRequested) {
      return;
    }

    if (!uri || !(uri instanceof vscode.Uri)) {
      return;
    }

    let beamFilePath: string = uri.fsPath.substr(0, uri.fsPath.length - 5);

    if (!fs.existsSync(beamFilePath)) {
      return;
    }

    let beamFile = BeamCache.getBeamFile(beamFilePath);

    let str = '';

    function formatSection(formatter: beamdasm.BeamBytecodeFormatter, section: string): string {
      let str = '';

      if (section in beamFile.sections) {
        let funcName = `format${section}`;
        str = 'BEAM section is missing formatting function';
        if (funcName in formatter) {
          str = formatter[funcName](beamFile);
        }
      }
      return str;
    }

    let configuration = vscode.workspace.getConfiguration('beamdasm');
    let formatterToUse = configuration['formatter'];

    let section = uri.scheme.substr(4, 4);
    str = formatSection(this.formatters[formatterToUse], section);

    return str;
  }
}