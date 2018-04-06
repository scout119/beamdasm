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

/// <reference path="interface.ts"/>

export class ErlangFormatter implements beamdasm.BeamBytecodeFormatter {

  formatModuleInfo(beamFile: beamdasm.IBeamFile): string {
    return '';
  }

  formatcode(beamFile: beamdasm.IBeamFile):string {
    return '';
  }

  formatlitt(beamFile: beamdasm.IBeamFile):string {
    return '';
  }

  formatatu8(beamFile: beamdasm.IBeamFile):string {
    return '';
  }

  formatimpt(beamFile: beamdasm.IBeamFile):string {
    return '';
  }

  formatexpt(beamFile: beamdasm.IBeamFile):string {
    return '';
  }

  formatloct(beamFile: beamdasm.IBeamFile):string {
    return '';
  }

  formatstrt(beamFile: beamdasm.IBeamFile):string {
    return '';
  }

  [func: string]: (beamFile: beamdasm.IBeamFile) => string;
}