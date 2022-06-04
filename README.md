# tree-sitter-sourcepawn

[![npm version](https://badge.fury.io/js/tree-sitter-sourcepawn.svg)](https://badge.fury.io/js/tree-sitter-sourcepawn)

[sourcepawn](https://github.com/alliedmodders/sourcepawn) grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter)

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
// (source_file
//     (struct_declaration
//         type: (symbol)
//         name: (symbol)
//         value: (struct_constructor
//             (struct_field_value
//                 name: (symbol)
//                 value: (string_literal))
//             (struct_field_value
//                 name: (symbol)
//                 value: (string_literal))
//             (struct_field_value
//                 name: (symbol)
//                 value: (string_literal))
//             (struct_field_value
//                 name: (symbol)
//                 value: (symbol))
//             (struct_field_value
//                 name: (symbol)
//                 value: (string_literal)))
//         (semicolon))
//     (function_declaration (function_visibility)
//         returnType: (type (builtin_type))
//         name: (symbol)
//         arguments: (argument_declarations)
//         (block (comment))))
```

### Note

All available nodes are defined in the `grammar.js` or `src/node-types.json`

## Want to help?

You can help by writing tests which are not covered or valid sourcepawn code, that fails parsing. Tests can be found in the `test` directory.

If you aren't familiar with tree-sitter tests, you can refer to the [official documentation](https://tree-sitter.github.io/tree-sitter/creating-parsers#command-test) or read some of the available tests.
