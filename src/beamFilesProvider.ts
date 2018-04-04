'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import BeamFile from './beam/beamFile';

export default class BeamFilesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

  onDidChangeTreeData?: vscode.Event<vscode.TreeItem> | undefined;

  constructor(private workspaceRoot: string | undefined) {
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No beam files in empty workspace');
      return Promise.resolve([]);
    }


    let beamFiles: any[] = [];
    const isDirectory = (source: string) => fs.lstatSync(source).isDirectory();

    const getBeamFiles = (source: string, acc: any[]) => {
      let items = fs.readdirSync(source);
      items.forEach((value: string) => {
        try {
          let fullPath = path.join(source, value);
          if (isDirectory(fullPath)) {
            getBeamFiles(fullPath, acc);
          } else {
            if (path.extname(fullPath) === ".beam") {
              acc.push({ name: value, location: fullPath });
            }
          }
        } catch (ex) {
        }
        finally {
        }
      });
    };

    getBeamFiles(this.workspaceRoot, beamFiles);

    if (!element) {
      return new Promise(
        resolve => {
          resolve(
            beamFiles.map<BeamFileItem>(
              (item: any, index: number, array: any[]) => {
                return new BeamFileItem(item.name,
                  vscode.TreeItemCollapsibleState.Collapsed,
                  item.location
                );
              }
            )
          );
        }
      );
    } else if (element instanceof BeamFileItem) {
      if (fs.existsSync(element.filePath)) {
        let bm = BeamFile.fromFile(element.filePath);
        if ('impt' in bm._chunks) {
          let item = new vscode.TreeItem("ImptT", vscode.TreeItemCollapsibleState.None);
          item.iconPath = {
            light: path.join(__filename, '..','..', 'resources', 'light', 'code.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'code.svg')
          };

          return Promise.resolve(
            [
              item
            ]
          );
        }
      }
    }

    return Promise.resolve([]);
  }
}


class BeamFileItem extends vscode.TreeItem {
  constructor(public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly filePath: string
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    return this.filePath;
  }

  contextValue = 'beam';

  command = {
    command: "beamdasm.disassemble",
    arguments: [vscode.Uri.file(this.filePath)],
    title: 'Open BEAM'
  };
}