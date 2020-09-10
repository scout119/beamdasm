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

import BeamFile from './beamFile';

class BeamCacheSingleton
{
  private static _instance: BeamCacheSingleton = new BeamCacheSingleton();

  private constructor()
  {}

  public static get Instance()
  {
    return this._instance;
  }
  
  beamFilePath = '';
  beamFile: beamdasm.Beam | undefined = undefined;

  public getBeamFile(path: string): beamdasm.Beam {
    if( this.beamFilePath === path ){
      return this.beamFile as beamdasm.Beam;
    }

    this.beamFilePath = path;
    this.beamFile = BeamFile.fromFile(this.beamFilePath);
    return this.beamFile;
  }
}

export const BeamCache = BeamCacheSingleton.Instance;