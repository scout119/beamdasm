'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import BeamFile from './beam/beamFile';

export default class BeamFilesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

  onDidChangeTreeData?: vscode.Event<vscode.TreeItem> | undefined;

  constructor(private workspaceRoot: string | undefined) {

    if( workspaceRoot && fs.existsSync(workspaceRoot) ){
      //Watcher is not 100% consistent on all platforms 
      fs.watch(workspaceRoot, {recursive: true}, (event: string, filename: string | Buffer) => {
        let file = ( filename instanceof Buffer ) ? filename.toString() : filename;

        if( path.extname(file) === ".beam" ){
          console.log(`${event} happend to ${filename}`);
        }
        return undefined;
      });
    }

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
          let item = new BeamChunkItem("ImptT");
          item.iconPath = {
            light: path.join(__filename, '..','..', 'resources', 'light', 'atom.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'atom.svg')
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

  elixir:boolean = false;

  constructor(public readonly label: string,    
    public readonly filePath: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);

    if( label.startsWith('Elixir.') ){
      this.elixir = true;    
    }

    this.iconPath = {
      light: path.join(__filename, '..','..', 'resources', this.elixir ? 'elixir.svg' : 'erlang.svg'),
      dark: path.join(__filename, '..', '..', 'resources', this.elixir ? 'elixir.svg' : 'erlang.svg')
    };
  }

  get tooltip(): string {
    return this.filePath;
  }

  contextValue = 'beam';

  command = {
    command: "beamdasm.disassemble",
    arguments: [vscode.Uri.file(this.filePath), this],
    title: 'Open BEAM'
  };  
}

class BeamChunkItem extends vscode.TreeItem {
  constructor(public readonly label: string){
    super(label,vscode.TreeItemCollapsibleState.None);
  }
}