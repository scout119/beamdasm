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

import BeamTextDocumentContentProvider from './beamTextDocumentContentProvider';
import BeamHoverProvider from './beamHoverProvider';
import BeamTreeDataProvider from './beamTreeDataProvider';

import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

    const rootPath = vscode.workspace.rootPath;

    context.subscriptions.push(vscode.languages.registerHoverProvider("beam", new BeamHoverProvider()));

    const supportedSections = [
        "code",
        "impt",
        "expt",
        "atom",
        "atu8",
        "litt",
        "loct",
        "attr",
        "strt"
    ];

    const contentProvider = new BeamTextDocumentContentProvider();
    supportedSections.forEach((section: string) => {
        context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(`beam${section}`, contentProvider));
    });

    const beamTreeDataProvider = new BeamTreeDataProvider(context, rootPath, supportedSections);
    context.subscriptions.push(vscode.window.registerTreeDataProvider("beamdasm.beamFilesTree", beamTreeDataProvider));

    context.subscriptions.push(vscode.commands.registerCommand('beamdasm.refreshBeamTree', () => beamTreeDataProvider.refresh()));

    context.subscriptions.push(vscode.commands.registerCommand('beamdasm.disassemble', (fileUri, beamFile?: any) => {
        if (!fileUri || !(fileUri instanceof vscode.Uri)) {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                return;
            }

            fileUri = editor.document.uri;
        }

        if (fs.existsSync(fileUri.fsPath)) {
            const sectionDocument = vscode.Uri.file(fileUri.fsPath.replace('.beam', '.beam_code'));
            vscode.commands.executeCommand('vscode.open', sectionDocument.with({ scheme: 'beamcode' }));
        }
    }));

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

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            triggerUpdateDecorations();
        }
    });

    function updateDecorations() {
        if (!activeEditor) {
            return;
        }

        if (activeEditor.document.uri.scheme !== "beamcode") {
            return;
        }

        const regEx = /\/\/Function/g;
        const text = activeEditor.document.getText();

        const ranges: vscode.DecorationOptions[] = [];
        let match: any;
        while ( (match = regEx.exec(text)) != null ) {
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
