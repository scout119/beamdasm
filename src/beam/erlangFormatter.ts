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

/// <reference path="interface.ts"/>

export class ErlangFormatter implements beamdasm.BeamFormatter {

  formatModuleInfo(beamFile: beamdasm.Beam): string {
    let str = `Module:  ${beamFile.atoms[1]}\n`;
    str += '\n';
    str += `Attributes: ${beamFile.attributes}\n`;
    str += '\n';
    str += `Compilation Info: ${beamFile.compilationInfo}\n`;
    str += '\n';
    return str;
  }

  formatcode(beamFile: beamdasm.Beam): string {
    return '';
  }

  formatlitt(beamFile: beamdasm.Beam): string {
    return '';
  }

  formatatu8(beamFile: beamdasm.Beam): string {
    return '';
  }

  formatimpt(beamFile: beamdasm.Beam): string {
    return '';
  }

  formatexpt(beamFile: beamdasm.Beam): string {
    return '';
  }

  formatloct(beamFile: beamdasm.Beam): string {
    return '';
  }

  formatstrt(beamFile: beamdasm.Beam): string {
    return '';
  }

  formatattr(beamFile: beamdasm.Beam): string {
    return '';
  }

  [func: string]: (beamFile: beamdasm.Beam) => string;
}