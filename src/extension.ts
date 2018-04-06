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

import BeamDasmContentProvider from './contentProvider';
import BeamDasmHoverProvider from './hoverProvider';
import BeamFilesProvider from './beamFilesProvider';

import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

    const rootPath = vscode.workspace.rootPath;

    context.subscriptions.push(
        vscode.languages.registerHoverProvider("beamdasm", new BeamDasmHoverProvider())
    );

    let contentProvider = new BeamDasmContentProvider();
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider("beamdasm", contentProvider));
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider("beamimpt", contentProvider));
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider("beamexpt", contentProvider));
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider("beamatom", contentProvider));
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider("beamlitt", contentProvider));
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider("beamloct", contentProvider));
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider("beamattr", contentProvider));

    let beamFilesProvider = new BeamFilesProvider(context, rootPath);
    let command = vscode.commands.registerCommand('beamdasm.refreshBeamTree', () => beamFilesProvider.refresh());
    context.subscriptions.push(command);

    context.subscriptions.push(vscode.window.registerTreeDataProvider("beamdasm.beamFilesTree", beamFilesProvider));


    context.subscriptions.push(
        vscode.commands.registerCommand('beamdasm.disassemble', (fileUri, beamFile?: any) => {
            if (!fileUri || !(fileUri instanceof vscode.Uri)) {
                let editor = vscode.window.activeTextEditor;

                if (!editor) {
                    return;
                }

                fileUri = editor.document.uri;
            }

            if (fs.existsSync(fileUri.fsPath)) {
                vscode.commands.executeCommand('vscode.open', fileUri.with({ scheme: 'beamdasm' }));
            }
        }
        )
    );

    setupDecorators(context);
}

function setupDecorators(context: vscode.ExtensionContext) {
    const functionDecorationType = vscode.window.createTextEditorDecorationType({
        light: {
            gutterIconPath: path.join(__filename, '..', '..', 'resources', 'light', 'func.svg')
        },
        dark: {
            gutterIconPath: path.join(__filename, '..', '..', 'resources', 'dark', 'func.svg')
        },
        gutterIconSize: "16px",
    });

    context.subscriptions.push(functionDecorationType);

    let timeout: any = null;
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(updateDecorations, 500);
    }

    let activeEditor = vscode.window.activeTextEditor;
    
    if (activeEditor) {
        triggerUpdateDecorations();
    }

    vscode.window.onDidChangeActiveTextEditor( editor => {
        activeEditor = editor;
        if( editor ){
            triggerUpdateDecorations();
        }
    });

    function updateDecorations() {
        if (!activeEditor) {
            return;
        }

        if( activeEditor.document.uri.scheme !== "beamdasm" ){
            return;
        }

        const regEx = /\/\/Function/g;
        const text = activeEditor.document.getText();

        const ranges: vscode.DecorationOptions[] = [];
        let match: any;
        while (match = regEx.exec(text)) {
            const startPos = activeEditor.document.positionAt(match.index);
            const endPos = activeEditor.document.positionAt(match.index + match[0].length);
            const decoration = { range: new vscode.Range(startPos, endPos) };
            ranges.push(decoration);
        }
        activeEditor.setDecorations(functionDecorationType, ranges);
    }
}

export function deactivate() {
    console.log('BEAMdasm is deactivated');
}
