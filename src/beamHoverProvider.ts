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

import * as vscode from 'vscode';
import { get_doc } from './beam/opcodes';

export default class BeamHoverProvider implements vscode.HoverProvider {

  provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {

    if (token.isCancellationRequested) {
      return;
    }

    return new Promise(resolve => {
      const range = document.getWordRangeAtPosition(position);
      if (range) {
        const word = document.getText(range);
        const doc = get_doc(word);
        if (doc !== "") {
          //TODO: Pull markdown description if "word" is a valid opcode
          const markdown = new vscode.MarkdownString(`#### Bytecode: ${word}\n`);
          const lines = doc.split('\n');
          markdown.appendMarkdown('---\n');
          markdown.appendMarkdown(`>${lines[0]}\n\n`);
          markdown.appendMarkdown(`${lines[1]}  \n`);
          resolve(new vscode.Hover(markdown));
        }
      }
      resolve(null);
    });
  }
}