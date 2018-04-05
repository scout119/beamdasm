'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import BeamFile from './beam/beamFile';

export default class BeamFilesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

  private _didChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData?: vscode.Event<vscode.TreeItem | undefined> = this._didChangeTreeData.event;

  dev: BeamVirtualFolder = new BeamVirtualFolder('dev');
  prod: BeamVirtualFolder = new BeamVirtualFolder('prod');
  deps: BeamVirtualFolder = new BeamVirtualFolder('deps');

  private watcher : vscode.FileSystemWatcher;
  
  constructor(private workspaceRoot: string | undefined) {

    this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{beam}');

    this.watcher.onDidChange( (e:vscode.Uri) => {
      triggerUpdateTree();
    });

    this.watcher.onDidCreate( (e:vscode.Uri) => {
      triggerUpdateTree();
    });
    
    this.watcher.onDidDelete( (e:vscode.Uri) => {
      triggerUpdateTree();
    });

    //For some reason onDidDelete is not firing when file is deleted by not a user
    if (workspaceRoot && fs.existsSync(workspaceRoot)) {
      //Watcher is not 100% consistent on all platforms     
      fs.watch(workspaceRoot, { recursive: true }, (event: string, filename: string | Buffer) => {
        let file = (filename instanceof Buffer) ? filename.toString() : filename;
        
        if (path.extname(file) === ".beam") {
          if( event === 'rename') {
            triggerUpdateTree();
          }
        }
        return undefined;
      });
    }

    var timeout: any = null;
    let provider = this;
    function triggerUpdateTree() {
      if( timeout ){
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        provider.refresh();
      }, 500);
    }
  }

  refresh(): void {   
    this._didChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {

    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No beam files in empty workspace');
      return Promise.resolve([]);
    }

  
    let provider = this;
    let root = this.workspaceRoot;

    return new Promise(resolve => {

      let final: vscode.TreeItem[] = [];

      if (!element) {
        
        this.dev.items = [];
        this.prod.items = [];
        this.deps.items = [];

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
                  if (fullPath.search('_build\\\\prod') !== -1) {
                    this.prod.items.push(new BeamFileItem(value, fullPath));
                  }
                  else if (fullPath.search('_build\\\\dev') !== -1) {
                    this.dev.items.push(new BeamFileItem(value, fullPath));
                  }
                  else if (fullPath.search('deps') !== -1) {
                    this.deps.items.push(new BeamFileItem(value, fullPath));
                  }
                  else {
                    acc.push({ name: value, location: fullPath });
                  }
                }
              }
            } catch (ex) {
            }
            finally {
            }
          });
        };
        getBeamFiles(root, beamFiles);
  

        let top: vscode.TreeItem[] = [provider.dev, provider.prod, provider.deps];
        final = top.concat(
          beamFiles.map<vscode.TreeItem>(
            (item: any, index: number, array: any[]) => {
              return new BeamFileItem(item.name,
                item.location
              );
            }
          ));
      } else if (element instanceof BeamFileItem) {
        if (fs.existsSync(element.filePath)) {
          
          let bm = BeamFile.fromFile(element.filePath);

          if ('atu8' in bm._chunks || 'atom' in bm._chunks ) {
            let item = new BeamChunkItem("Atoms");
            item.iconPath = {
              light: path.join(__filename, '..', '..', 'resources', 'light', 'atom.svg'),
              dark: path.join(__filename, '..', '..', 'resources', 'dark', 'atom.svg')
            };

            final.push(item);            
          }

          if ('impt' in bm._chunks  ) {
            let item = new BeamChunkItem("Imports");
            item.iconPath = {
              light: path.join(__filename, '..', '..', 'resources', 'light', 'func.svg'),
              dark: path.join(__filename, '..', '..', 'resources', 'dark', 'func.svg')
            };

            final.push(item);            
          }

          if ('expt' in bm._chunks  ) {
            let item = new BeamChunkItem("Exports");
            item.iconPath = {
              light: path.join(__filename, '..', '..', 'resources', 'light', 'func.svg'),
              dark: path.join(__filename, '..', '..', 'resources', 'dark', 'func.svg')
            };

            final.push(item);            
          }
          
        }
      } else if (element instanceof BeamVirtualFolder) {
        final = element.items;
      }

      return resolve(final);
    });
  }
}

class BeamVirtualFolder extends vscode.TreeItem {
  constructor(public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
  }

  items: vscode.TreeItem[] = [];
}
class BeamFileItem extends vscode.TreeItem {

  elixir: boolean = false;

  constructor(public readonly label: string,
    public readonly filePath: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);

    if (label.startsWith('Elixir.')) {
      this.elixir = true;
    }

    this.iconPath = {
      light: path.join(__filename, '..', '..', 'resources', this.elixir ? 'elixir.svg' : 'erlang.svg'),
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
  constructor(public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}