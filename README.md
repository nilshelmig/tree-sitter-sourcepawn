<div align="center">
  <h1><code>tree-sitter-sourcepawn</code></h1>
  <p>
    <strong>
      <a href="https://github.com/alliedmodders/sourcepawn">SourcePawn</a> grammar for <a href="https://github.com/tree-sitter/tree-sitter">tree-sitter</a>
      </strong>
  </p>
  <p style="margin-bottom: 0.5ex;">
    <a href="https://www.npmjs.com/package/tree-sitter-sourcepawn"><img
        src="https://img.shields.io/npm/v/tree-sitter-sourcepawn"
        />
    </a>
    <a href="https://crates.io/crates/tree-sitter-sourcepawn"><img
        src="https://img.shields.io/crates/v/tree-sitter-sourcepawn"
        />
    </a>
  </p>
</div>

## Install

```bash
npm install tree-sitter-sourcepawn tree-sitter
```

## Usage

```javascript
const Parser = require("tree-sitter");
const SourcePawn = require("tree-sitter-sourcepawn");

const parser = new Parser();
parser.setLanguage(SourcePawn);

const sourceCode = `
public Plugin myinfo =
{
    name = "Test",
    author = "Developer",
    description = "demonstrating parser",
    version = PLUGIN_VERSION,
    url = "http://forums.alliedmods.net"
};

public void OnPluginStart() {
    // your code
}
`;

const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());
// (source_file [0, 0] - [11, 1]
//   (struct_declaration [0, 0] - [7, 2]
//     type: (symbol [0, 7] - [0, 13])
//     name: (symbol [0, 14] - [0, 20])
//     value: (struct_constructor [1, 0] - [7, 1]
//       (struct_field_value [2, 4] - [2, 17]
//         name: (symbol [2, 4] - [2, 8])
//         value: (string_literal [2, 11] - [2, 17]))
//       (struct_field_value [3, 4] - [3, 24]
//         name: (symbol [3, 4] - [3, 10])
//         value: (string_literal [3, 13] - [3, 24]))
//       (struct_field_value [4, 4] - [4, 40]
//         name: (symbol [4, 4] - [4, 15])
//         value: (string_literal [4, 18] - [4, 40]))
//       (struct_field_value [5, 4] - [5, 28]
//         name: (symbol [5, 4] - [5, 11])
//         value: (symbol [5, 14] - [5, 28]))
//       (struct_field_value [6, 4] - [6, 40]
//         name: (symbol [6, 4] - [6, 7])
//         value: (string_literal [6, 10] - [6, 40]))))
//   (function_declaration [9, 0] - [11, 1]
//     (function_visibility [9, 0] - [9, 6])
//     returnType: (type [9, 7] - [9, 11]
//       (builtin_type [9, 7] - [9, 11]))
//     name: (symbol [9, 12] - [9, 25])
//     arguments: (argument_declarations [9, 25] - [9, 27])
//     (block [9, 28] - [11, 1]
//       (comment [10, 4] - [10, 17]))))
```

### Note

All available nodes are defined in the `grammar.js` or `src/node-types.json`.

## Install For Neovim

Currently this parser is not ready to add officially to nvim-treesitter, so it will have to be installed manually.

First create `{YOUR_NVIM_CONFIG_DIR}/ftdetect/sourcepawn.vim` and put the following inside:
```vim
function! s:setf(filetype) abort
    if &filetype !=# a:filetype
        let &filetype = a:filetype
    endif
endfunction

au BufNewFile,BufRead *.sp,*.sourcepawn,*.inc call s:setf('sourcepawn')
```

Next install [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter "nvim-treesitter"), then add the following to your config (init.lua):

```lua
local parser_config = require "nvim-treesitter.parsers".get_parser_configs()
parser_config.sourcepawn = {
  install_info = {
    url = "https://github.com/nilshelmig/tree-sitter-sourcepawn",
    files = {"src/parser.c", "src/scanner.c"},
    branch = "main",
    generate_requires_npm = false,
    requires_generate_from_grammar = false,
  },
  filetype = "sp",
}
```

After that, run `:so` and `:TSInstall sourcepawn` (you may need to reload neovim before these will work).

Lastly, because this is unfortunately a manual install, you\'ll need to copy the query files from the repo\'s `queries` directory into your neovim\'s runtime path: `{YOUR_NVIM_CONFIG_DIR}/queries/sourcepawn/`

## Want to help?

You can help by writing tests which are not covered or valid Sourcepawn code, that fails parsing. Tests can be found in the `test` directory.

If you aren't familiar with tree-sitter tests, you can refer to the [official documentation](https://tree-sitter.github.io/tree-sitter/creating-parsers#command-test) or read some of the available tests.

## Notable Mentions
This project is used by the [SourcePawn VSCode](https://github.com/Sarrus1/sourcepawn-vscode) extension. From it, the tree-sitter-sourcepawn got a lot of contributions, especially from [Sarrus1](https://github.com/Sarrus1) ❤️ 
