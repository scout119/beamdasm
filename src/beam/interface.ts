namespace beamdasm {
  export interface IBeamFile{
    atoms: string[];
    code: any[];
    lineRefs: any[];
    lineFNames: any[];

    imports: any[];
    exports: any[];
    literals: any[];    
      
    attributes: any;
    compilationInfo: any;
  

    codeNumberOfLabels: number;
  }
  export interface BeamBytecodeFormatter {
    formatModuleInfo(beamFile: beamdasm.IBeamFile): string;
    formatCode(bm: beamdasm.IBeamFile): any;
    formatAtomsTable(beamFile: IBeamFile) :string;
    formatImportTable(beamFile: beamdasm.IBeamFile): string;
    formatExportTable(beamFile: beamdasm.IBeamFile): string;
  }
}
