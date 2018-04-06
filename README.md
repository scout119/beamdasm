# BEAMdasm

[![GitHub issues](https://img.shields.io/github/issues/scout119/beamdasm.svg)](https://github.com/scout119/beamdasm/issues)
[![GitHub license](https://img.shields.io/github/license/scout119/beamdasm.svg)](https://github.com/scout119/beamdasm/blob/master/LICENSE.md)
[![VS Code marketplace](https://vsmarketplacebadge.apphb.com/installs/Valentin.beamdasm.svg)](https://marketplace.visualstudio.com/items?itemName=Valentin.beamdasm)
[![Join the chat at https://gitter.im/scout119/beamdasm](https://badges.gitter.im/scout119/beamdasm.svg)](https://gitter.im/scout119/beamdasm?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
![GitHub stars](https://img.shields.io/github/stars/scout119/beamdasm.svg?style=social&label=Stars)

BEAM files disassembler extension for Visual Studio Code.

## Description

Erlang\Elixir bytecode viewer.
This extension allows to "peek" inside compiled bytecode for BEAM (Bogdan/Björn Erlang Abstract machine) binary files.

## Features

- Dedicated View in the Explorer for all .beam files in the workspace
  - Subitems for main sections:
    - Atoms ('**Atom**' and '**AtU8**' sections)
    - Exported functions ('**ExpT**' section)
    - Imported functions ('**ImpT**' section)
    - Local functions ('**LocT**' section)
    - Strings '**StrT**' section)
    - Attributes ('**Attr**' section)
    - Literals ('**LitT**' section)
- Opcodes, labels, registers highlighting
- Hover description for opcodes taken from erlang source code  (when available)
- Gutter images for start of the functions

To activate the extension select "Disassemble BEAM" from the context menu for a .beam file in the Explorer View:

![Activation](media/main.gif)

![Highlight](media/highlight.png)

## Requirements

Visual Studio Code 1.21.0

## Extension Settings

None

## Known Issues

None

## Release Notes

Initial previe release

## Contributing

1. Fork ![Fork Me](https://img.shields.io/github/forks/scout119/beamdasm.svg?style=social&label=Fork%20Me)
2. Create your branch
3. Commit your changes
4. Push to the branch
5. Submit a pull request
6. (Optional) Send me a beer

## License

[Apache 2.0](LICENSE.md)