# tree-sitter-sourcepawn

This crate provides a SourcePawn grammar for the [tree-sitter](https://tree-sitter.github.io/tree-sitter/) parsing
library.  To use this crate, add it to the `[dependencies]` section of your
`Cargo.toml` file, as well as the [tree-sitter][https://crates.io/crates/tree-sitter].

``` toml
[dependencies]
tree-sitter = "0.24.7"
tree-sitter-sourcepawn = "0.7.7"
```

Typically, you will use the [`language`] function to add this
grammar to a tree-sitter [`Parser`], and then use the parser to parse some code.

The below example demonstrates a simple program that parses a SourcePawn variable and prints the result to your
terminal.

``` rust
use tree_sitter::Parser;

fn main() {
    let source = "int foo";
    let mut parser = Parser::new();
    parser
        .set_language(tree_sitter_sourcepawn::language())
        .expect("Error loading SourcePawn grammar");
    let tree = parser.parse(source, None);
    println!("{:#?}", tree.to_sexp());
}
```