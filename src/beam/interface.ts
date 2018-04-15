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

namespace beamdasm {
  export interface Beam {

    sections: any;

    atoms: string[];
    numberOfAtoms: number;
    maxAtomNameLength: number;

    code: any[];
    lineRefs: any[];
    lineFNames: any[];

    StrT: string;
    LocT: any[];

    imports: any[];
    exports: any[];
    literals: any[];

    attributes: any;
    compilationInfo: any;


    codeNumberOfLabels: number;
  }
  export interface BeamFormatter {

    formatcode(beamFile: Beam): string;
    formatlitt(beamFile: Beam): string;
    formatatu8(beamFile: Beam): string;
    formatimpt(beamFile: Beam): string;
    formatexpt(beamFile: Beam): string;
    formatloct(beamFile: Beam): string;
    formatstrt(beamFile: Beam): string;
    formatattr(beamFile: Beam): string;

    [func: string]: (beamFile: Beam) => string;
  }
}
