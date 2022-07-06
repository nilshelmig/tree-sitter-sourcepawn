# tree-sitter-javascript

This crate provides a SourcePawn grammar for the [tree-sitter][] parsing
library.  To use this crate, add it to the `[dependencies]` section of your
`Cargo.toml` file.  (Note that you will probably also need to depend on the
[`tree-sitter`][tree-sitter crate] crate to use the parsed result in any useful
way.)

``` toml
[dependencies]
tree-sitter = "0.20"
tree-sitter-sourcepawn = "0.3.0"
```

Typically, you will use the [language][language func] function to add this
grammar to a tree-sitter [Parser][], and then use the parser to parse some code.

The below example demonstrates a simple program that parses a JavaScript
function and prints the result to your terminal.

``` rust
use tree_sitter::Parser;

fn main() {
    let code = "int foo";
    let mut parser = Parser::new();
    parser
        .set_language(tree_sitter_sourcepawn::language())
        .expect("Error loading SourcePawn grammar");
    let parsed = parser.parse(code, None);
    println!("{:#?}", parsed);
}
```