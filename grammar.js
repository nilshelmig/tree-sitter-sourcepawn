const PREC = {
  ASSIGNMENT: -1,
  DEFAULT: 0,
  TERNARY: 1,
  FREE: 2,
  LOGICAL_OR: 2,
  LOGICAL_AND: 3,
  INCLUSIVE_OR: 4,
  EXCLUSIVE_OR: 5,
  BITWISE_AND: 6,
  EQUAL: 7,
  RELATIONAL: 8,
  SIZEOF: 9,
  SHIFT: 10,
  ADD: 11,
  MULTIPLY: 12,
  UNARY: 14,
  CAST: 15,
  CALL: 16,
  FIELD: 17,
};

const ASSIGNMENT_OPERATORS = [
  "=",
  "+=",
  "-=",
  "*=",
  "/=",
  "|=",
  "&=",
  "^=",
  "~=",
  "<<=",
  ">>=",
  ">>>=",
  "%=",
];

// Subset of the assignment operators accepted in `enum (op start)` headers.
const ENUM_OPERATORS = [
  "=",
  "+=",
  "-=",
  "*=",
  "/=",
  "|=",
  "&=",
  "^=",
  "~=",
  "<<=",
  ">>=",
];

const ALIAS_OPERATORS = [
  "+",
  "++",
  "-",
  "--",
  "*",
  "/",
  "%",
  "||",
  "&&",
  "|",
  "^",
  "&",
  "==",
  "!=",
  ">",
  ">=",
  "<=",
  "<",
  "<<",
  ">>",
  ">>>",
  "!",
];

module.exports = grammar({
  name: "sourcepawn",

  externals: ($) => [$._automatic_semicolon, $._ternary_colon, $.preproc_arg],

  extras: ($) => [
    /\s|\\\r?\n/,
    $.comment,
    $.preproc_endif,
    $.preproc_if,
    $.preproc_elseif,
    $.preproc_else,
    $.preproc_error,
    $.preproc_warning,
    $.preproc_assert,
    $.preproc_pragma,
    $.preproc_include,
    $.preproc_tryinclude,
    $.preproc_define,
    $.preproc_macro,
    $.preproc_undefine,
    $.preproc_endinput,
  ],

  inline: ($) => [$._statement],

  conflicts: ($) => [
    [$.type, $.old_variable_declaration],
    [$.array_indexed_access, $.type],
    [$.visibility, $.struct_declaration],
    [$.parameter_declaration, $.type],
    [$.alias_assignment, $.type],
    [$.alias_assignment, $.old_type],
    [$._preproc_expression, $._expression],
    [$.multi_tag, $._preproc_expression, $._expression],
    [$._preproc_expression, $.multi_tag],
  ],

  precedences: ($) => [[$.type, $._expression]],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) =>
      repeat(
        choice(
          $.assertion,
          $.function_definition,
          $.function_declaration,
          $.enum,
          $.enum_struct,
          $.typedef,
          $.typeset,
          $.functag,
          $.funcenum,
          $.methodmap,
          $.struct,
          $.struct_declaration,
          $.global_variable_declaration,
          $.old_global_variable_declaration,
          $.hardcoded_symbol,
          $.alias_declaration,
          $.alias_assignment,
        ),
      ),

    // Preprocessor
    _preproc_expression: ($) =>
      choice(
        $.preproc_binary_expression,
        $.preproc_unary_expression,
        $.identifier,
        $._literal,
        $.preproc_parenthesized_expression,
        $.preproc_defined_condition,
      ),

    preproc_parenthesized_expression: ($) =>
      seq("(", $._preproc_expression, ")"),

    preproc_unary_expression: ($) => unaryExpression($._preproc_expression),

    preproc_binary_expression: ($) => binaryExpression($._preproc_expression),

    preproc_quoted_path: ($) => token(seq('"', repeat(/[^"\n]/), '"')),

    preproc_include: ($) =>
      seq(preprocessor("include"), field("path", $._include_path)),

    preproc_tryinclude: ($) =>
      seq(preprocessor("tryinclude"), field("path", $._include_path)),

    // Quoted path (allows Windows backslashes), <system_lib> or bare name.
    // Not string_literal for the quoted form, because spcomp rejects unknown
    // escapes like `\s` in normal strings but accepts them in include paths.
    _include_path: ($) =>
      choice(
        alias($.preproc_quoted_path, $.string_literal),
        $.system_lib_string,
        // Bare `#include sdktools` (valid on SourceMod 1.7+)
        $.identifier,
      ),

    preproc_macro: ($) =>
      seq(
        preprocessor("define"),
        field("name", $.identifier),
        field("parameters", seq("(", commaSep($.macro_param), ")")),
        field("value", $.preproc_arg),
      ),

    macro_param: ($) => token(seq("%", /[0-9]/)),

    preproc_define: ($) =>
      seq(
        preprocessor("define"),
        field("name", $.identifier),
        field("value", $.preproc_arg),
      ),

    preproc_undefine: ($) =>
      seq(preprocessor("undef"), field("name", $.identifier)),

    preproc_if: ($) =>
      seq(preprocessor("if"), field("condition", $.preproc_arg)),

    preproc_elseif: ($) =>
      seq(preprocessor("elseif"), field("condition", $.preproc_arg)),

    preproc_assert: ($) =>
      seq(preprocessor("assert"), field("condition", $.preproc_arg)),

    preproc_defined_condition: ($) =>
      seq("defined", field("name", $.identifier)),

    preproc_else: ($) => preprocessor("else"),

    preproc_endif: ($) => preprocessor("endif"),

    preproc_endinput: ($) => preprocessor("endinput"),

    preproc_pragma: ($) => seq(preprocessor("pragma"), $.preproc_arg),

    preproc_error: ($) => seq(preprocessor("error"), $.preproc_arg),

    preproc_warning: ($) => seq(preprocessor("warning"), $.preproc_arg),

    // Hardcoded identifier
    // https://github.com/alliedmodders/sourcemod/blob/5c0ae11a4619e9cba93478683c7737253ea93ba6/plugins/include/handles.inc#L78
    hardcoded_symbol: ($) => seq("using __intrinsics__.Handle", $._semicolon),

    assertion: ($) =>
      seq(choice("assert", "static_assert"), $.call_arguments, $._semicolon),

    // Main Grammar
    function_definition: ($) =>
      seq(
        field("visibility", optional($.visibility)),
        field(
          "returnType",
          optional(choice(seq($.type, repeat($.dimension)), $.old_type)),
        ),
        field("name", $.identifier),
        field("parameters", $.parameter_declarations),
        field("body", $._statement),
      ),

    function_declaration: ($) =>
      seq(
        field("kind", $.function_declaration_kind),
        field(
          "returnType",
          optional(choice(seq($.type, optional($.dimension)), $.old_type)),
        ),
        field("name", $.identifier),
        field("parameters", $.parameter_declarations),
        optional(seq("=", $.identifier)), // native float __FLOAT_MUL__(float a, float b) = FloatMul;
        $._semicolon,
      ),

    function_declaration_kind: ($) => choice("forward", "native"),

    parameter_declarations: ($) =>
      seq(
        "(",
        commaSep(choice($.parameter_declaration, $.rest_parameter)),
        ")",
      ),

    parameter_declaration: ($) =>
      seq(
        field("storage_class", optional($.variable_storage_class)),
        choice(
          // Old
          seq(
            optional(field("type", $.old_type)),
            field("name", $.identifier),
            repeat(choice($.dimension, $.fixed_dimension)),
          ), // foo | foo[] | Float: foo
          seq("&", field("name", $.identifier)), // &foo
          seq(field("type", seq("&", $.old_type)), field("name", $.identifier)), // &Float: foo
          // New
          seq(field("type", $.type), "&", field("name", $.identifier)), // float &foo
          seq(field("type", $.array_type), field("name", $.identifier)), // float[] foo
          seq(
            field("type", $.type),
            field("name", $.identifier),
            repeat(choice($.dimension, $.fixed_dimension)),
          ), // float foo | float foo[]
        ),
        optional(seq("=", field("defaultValue", $._expression))),
      ),

    rest_parameter: ($) =>
      seq(
        field("storage_class", optional($.variable_storage_class)),
        field("type", choice($.type, $.old_type, $.array_type)),
        "...",
      ),

    alias_operator: ($) => token.immediate(choice(...ALIAS_OPERATORS)),

    alias_declaration: ($) =>
      choice(
        seq(
          optional($.visibility),
          field("returnType", choice($.type, $.old_type)),
          "operator",
          $.alias_operator,
          field("parameters", $.parameter_declarations),
          field("body", $._statement),
        ),
        // forbidden operators
        seq(
          $.function_declaration_kind,
          "operator",
          $.alias_operator,
          field("parameters", $.parameter_declarations),
          $._semicolon,
        ),
      ),

    alias_assignment: ($) =>
      seq(
        optional($.function_declaration_kind),
        field(
          "returnType",
          choice($.builtin_type, seq($.old_builtin_type, token.immediate(":"))),
        ),
        "operator",
        $.alias_operator,
        field("parameters", $.parameter_declarations),
        "=",
        $.identifier,
        $._semicolon,
      ),

    global_variable_declaration: ($) =>
      seq(
        field("visibility", optional($.visibility)), // Handle MaxClient
        field("storage_class", optional($.variable_storage_class)),
        field("type", $.type),
        commaSep1($.variable_declaration),
        $._semicolon,
      ),

    variable_declaration_statement: ($) =>
      /* Use left precedence to resolve conflict with variable
      declarations in for loops
       */
      prec.left(
        choice(
          // Action[] actions = new Action[32];
          seq(
            field("type", $.type),
            repeat1($.dimension),
            commaSep1($.dynamic_array_declaration),
            optional($._semicolon),
          ),
          // Action actions[32];
          // Action action;
          seq(
            optional($.visibility),
            optional($.variable_storage_class),
            field("type", $.type),
            commaSep1($.variable_declaration),
            optional($._semicolon),
          ),
        ),
      ),

    variable_storage_class: ($) => "const",

    visibility: ($) =>
      choice(
        "public",
        "stock",
        "static",
        seq("public", "static"),
        seq("stock", "static"),
        seq("static", "stock"),
        seq("static", "public"),
      ),

    variable_declaration: ($) =>
      seq(
        field("name", $.identifier),
        repeat(choice($.dimension, $.fixed_dimension)),
        optional(seq("=", field("initialValue", $._expression))),
      ),

    dynamic_array_declaration: ($) =>
      seq(
        field("name", $.identifier),
        "=",
        field("initialValue", choice($.dynamic_array, $.string_literal)),
      ),

    dynamic_array: ($) =>
      seq(
        "new",
        field("type", choice($.builtin_type, $.identifier)),
        repeat1($.fixed_dimension),
      ),

    new_expression: ($) =>
      seq(
        "new",
        field("class", $.identifier),
        field("arguments", $.call_arguments),
      ),

    old_global_variable_declaration: ($) =>
      choice(
        seq(
          choice(
            seq(
              choice("new", "decl"),
              field("storage_class", optional($.variable_storage_class)),
            ),
            field("storage_class", $.variable_storage_class),
            seq(
              field("visibility", $.visibility),
              field("storage_class", optional($.variable_storage_class)),
            ),
          ),
          commaSep1($.old_variable_declaration),
          $._semicolon,
        ),
        seq(commaSep1($.old_variable_declaration), $._semicolon),
      ),

    old_variable_declaration_statement: ($) =>
      prec.left(
        seq(
          choice(
            seq(choice("new", "decl"), optional($.variable_storage_class)),
            $.variable_storage_class,
            seq($.visibility, optional($.variable_storage_class)),
          ),
          commaSep1($.old_variable_declaration),
          $._semicolon,
        ),
      ),

    // Workaround for mandatory semicolon in for loops
    old_for_loop_variable_declaration_statement: ($) =>
      seq(
        choice(
          seq(choice("new", "decl"), optional($.variable_storage_class)),
          $.variable_storage_class,
          seq($.visibility, optional($.variable_storage_class)),
        ),
        commaSep1($.old_variable_declaration),
      ),

    old_variable_declaration: ($) =>
      seq(
        field("type", optional($.old_type)),
        field("name", $.identifier),
        repeat(choice($.dimension, $.fixed_dimension)),
        field("initialValue", optional(seq("=", $._expression))),
      ),

    enum: ($) =>
      seq(
        "enum",
        // Disjoint shapes avoid a self-conflict between tag and name on `enum Name:`.
        optional(
          choice(
            seq(
              field("tag", seq($.identifier, token.immediate(":"))),
              field("name", seq($.identifier, optional(token.immediate(":")))),
            ),
            field("name", seq($.identifier, optional(token.immediate(":")))),
          ),
        ),
        optional(
          seq("(", choice(...ENUM_OPERATORS), $._expression, ")"),
        ),
        field("entries", $.enum_entries),
        optional($._semicolon),
      ),

    enum_entries: ($) =>
      seq("{", repeat(seq($.enum_entry, optional(","))), "}"),

    enum_entry: ($) =>
      seq(
        field(
          "type",
          optional(
            seq(choice($.builtin_type, $.identifier), token.immediate(":")),
          ),
        ),
        field("name", $.identifier),
        optional($.fixed_dimension),
        field("value", optional(seq("=", $._expression))),
      ),

    enum_struct: ($) =>
      seq(
        "enum",
        "struct",
        field("name", $.identifier),
        "{",
        repeat(choice($.enum_struct_field, $.enum_struct_method)),
        "}",
      ),

    enum_struct_field: ($) =>
      seq(
        field("type", $.type),
        field("name", $.identifier),
        optional($.fixed_dimension),
        $._semicolon,
      ),

    enum_struct_method: ($) =>
      seq(
        field("returnType", seq($.type, repeat($.dimension))),
        field("name", $.identifier),
        field("parameters", $.parameter_declarations),
        field("body", $.block),
      ),

    typedef: ($) =>
      seq(
        "typedef",
        field("name", $.identifier),
        "=",
        choice(
          $.typedef_expression,
          // Type alias: `typedef Address = int64;`
          field(
            "type",
            seq($.type, repeat(choice($.dimension, $.fixed_dimension))),
          ),
        ),
        $._semicolon,
      ),

    typeset: ($) =>
      seq(
        "typeset",
        field("name", $.identifier),
        "{",
        repeat1(seq($.typedef_expression, optional($._semicolon))),
        "}",
        optional($._semicolon),
      ),

    _function_signature: ($) =>
      seq(
        field(
          "returnType",
          seq($.type, repeat(choice($.dimension, $.fixed_dimension))),
        ),
        field("parameters", $.parameter_declarations),
      ),

    typedef_expression: ($) =>
      choice(
        seq("function", $._function_signature),
        seq("(", "function", $._function_signature, ")"),
      ),

    funcenum: ($) =>
      seq(
        "funcenum",
        field("name", $.identifier),
        "{",
        commaSep1($.funcenum_member),
        optional(","),
        "}",
        optional($._semicolon),
      ),

    funcenum_member: ($) =>
      seq(
        field("returnType", optional($.old_type)),
        "public",
        field("parameters", $.parameter_declarations),
      ),

    functag: ($) =>
      choice(
        // `functag public Name(...)` and `functag public Return:Name(...)`
        seq(
          "functag",
          "public",
          field("returnType", optional($.old_type)),
          field("name", $.identifier),
          field("parameters", $.parameter_declarations),
          optional($._semicolon),
        ),
        // `functag Name public(...)`
        seq(
          "functag",
          field("name", $.identifier),
          "public",
          field("parameters", $.parameter_declarations),
          optional($._semicolon),
        ),
        // `functag Name Return:public(...)`
        seq(
          "functag",
          field("name", $.identifier),
          field("returnType", $.old_type),
          "public",
          field("parameters", $.parameter_declarations),
          optional($._semicolon),
        ),
      ),

    methodmap: ($) =>
      seq(
        "methodmap",
        field("name", $.identifier),
        optional(
          choice(seq("<", field("inherits", $.identifier)), "__nullable__"),
        ),
        "{",
        repeat(
          choice(
            $.methodmap_alias,
            $.methodmap_native,
            $.methodmap_native_constructor,
            $.methodmap_native_destructor,
            $.methodmap_method,
            $.methodmap_method_constructor,
            $.methodmap_method_destructor,
            $.methodmap_property,
          ),
        ),
        "}",
        optional($._semicolon),
      ),

    methodmap_alias: ($) =>
      seq(
        "public",
        optional("~"),
        field("name", $.identifier),
        "(",
        ")",
        "=",
        field("function", $.identifier),
        optional($._semicolon),
      ),

    methodmap_native: ($) =>
      seq(
        "public",
        optional("static"),
        "native",
        field("returnType", seq($.type, repeat($.dimension))),
        field("name", $.identifier),
        field("parameters", $.parameter_declarations),
        optional($._semicolon),
      ),

    methodmap_native_constructor: ($) =>
      seq(
        "public",
        optional("static"),
        "native",
        field("name", $.identifier),
        field("parameters", $.parameter_declarations),
        optional($._semicolon),
      ),

    methodmap_native_destructor: ($) =>
      seq(
        "public",
        "native",
        "~",
        field("name", $.identifier),
        "(",
        ")",
        optional($._semicolon),
      ),

    methodmap_method: ($) =>
      seq(
        "public",
        optional("static"),
        field("returnType", seq($.type, repeat($.dimension))),
        field("name", $.identifier),
        field("parameters", $.parameter_declarations),
        field("body", $.block),
      ),

    methodmap_method_constructor: ($) =>
      seq(
        "public",
        field("name", $.identifier),
        field("parameters", $.parameter_declarations),
        field("body", $.block),
      ),

    methodmap_method_destructor: ($) =>
      seq(
        "public",
        "~",
        field("name", $.identifier),
        "(",
        ")",
        field("body", $.block),
      ),

    methodmap_property: ($) =>
      seq(
        "property",
        field("type", $.type),
        field("name", $.identifier),
        "{",
        repeat(
          choice(
            $.methodmap_property_alias,
            $.methodmap_property_native,
            $.methodmap_property_method,
          ),
        ),
        "}",
      ),

    methodmap_property_alias: ($) =>
      seq(
        "public",
        choice(
          $.methodmap_property_getter,
          // Alias setters use empty params: `public set() = Native;`
          seq(field("name", "set"), "(", ")"),
        ),
        "=",
        field("function", $.identifier),
        optional($._semicolon),
      ),

    methodmap_property_native: ($) =>
      seq(
        "public",
        "native",
        choice($.methodmap_property_getter, $.methodmap_property_setter),
        optional($._semicolon),
      ),

    methodmap_property_method: ($) =>
      seq(
        "public",
        choice($.methodmap_property_getter, $.methodmap_property_setter),
        field("body", $.block),
      ),

    methodmap_property_getter: ($) => seq(field("name", "get"), "(", ")"),

    methodmap_property_setter: ($) =>
      seq(
        field("name", "set"),
        "(",
        field("parameter", $.parameter_declaration),
        ")",
      ),

    struct: ($) =>
      seq(
        "struct",
        field("name", $.identifier),
        "{",
        // Modern fields start with `public` and use semicolons.
        // Legacy fields are comma-separated (`const String:name[]`, bare `version`).
        choice(
          repeat($.struct_field),
          seq(commaSep1($.old_struct_field), optional(",")),
        ),
        "}",
        optional($._semicolon),
      ),

    struct_field: ($) =>
      seq(
        "public",
        optional("const"),
        field(
          "type",
          seq($.type, repeat(choice($.dimension, $.fixed_dimension))),
        ),
        field("name", $.identifier),
        optional($._semicolon),
      ),

    old_struct_field: ($) =>
      seq(
        optional("const"),
        field("type", optional($.old_type)),
        field("name", $.identifier),
        repeat(choice($.dimension, $.fixed_dimension)),
      ),

    struct_declaration: ($) =>
      seq(
        "public",
        field(
          "type",
          choice($.identifier, seq($.identifier, token.immediate(":"))),
        ),
        field("name", $.identifier),
        "=",
        field("value", $.struct_constructor),
        optional($._semicolon),
      ),

    struct_constructor: ($) =>
      seq("{", commaSep($.struct_field_value), optional(","), "}"),

    struct_field_value: ($) =>
      seq(field("field", $.identifier), "=", field("value", $._expression)),

    type: ($) => choice($.builtin_type, $.identifier, $.any_type),

    array_type: ($) =>
      seq($.type, repeat1(choice($.dimension, $.fixed_dimension))),

    old_type: ($) =>
      seq(
        choice($.old_builtin_type, $.identifier, $.any_type, $.multi_tag),
        token.immediate(":"),
      ),

    dimension: ($) => seq("[", "]"),

    fixed_dimension: ($) =>
      seq(
        "[",
        $._expression,
        optional(field("packing", $.dimension_packing)),
        "]",
      ),

    dimension_packing: (_) => "char",

    builtin_type: ($) =>
      choice("void", "bool", "int", "int64", "float", "char"),

    // `void` appears in both styles: new `void Foo()` and old `void:Foo()`.
    old_builtin_type: ($) => choice("_", "Float", "bool", "String", "void"),

    any_type: ($) => "any",

    multi_tag: ($) =>
      seq("{", commaSep1(choice($.identifier, $.old_builtin_type)), "}"),

    block: ($) => seq("{", repeat($._statement), "}"),

    // Statements
    _statement: ($) =>
      choice(
        $.block,
        $.variable_declaration_statement,
        $.old_variable_declaration_statement,
        $.for_statement,
        $.while_statement,
        $.do_while_statement,
        $.break_statement,
        $.continue_statement,
        $.condition_statement,
        $.switch_statement,
        $.return_statement,
        $.delete_statement,
        $.expression_statement,
      ),

    for_statement: ($) =>
      seq("for", "(", $._for_statement_body, ")", field("body", $._statement)),

    _for_statement_body: ($) =>
      seq(
        field(
          "initialization",
          optional(
            choice(
              $.variable_declaration_statement,
              $.old_for_loop_variable_declaration_statement,
              commaSep1($.assignment_expression),
            ),
          ),
        ),
        ";",
        field("condition", optional($._expression)),
        ";",
        field("iteration", optional(choice($._expression, $.comma_expression))),
      ),

    while_statement: ($) =>
      choice(
        // Modern: while (cond) stmt
        seq(
          "while",
          "(",
          field("condition", $._expression),
          ")",
          field("body", $._statement),
        ),
        // Legacy Pawn: while !cond do stmt (SourceMod 1.7 and earlier).
        // Restricted to unary_expression to avoid conflicts with
        // parenthesized modern while and bare literals.
        seq(
          "while",
          field("condition", $.unary_expression),
          "do",
          field("body", $._statement),
        ),
      ),

    do_while_statement: ($) =>
      prec.right(
        seq(
          "do",
          field("body", $._statement),
          "while",
          // Parens are usual; spcomp also accepts `while !expr`
          choice(
            seq("(", field("condition", $._expression), ")"),
            field("condition", $.unary_expression),
          ),
          optional($._semicolon),
        ),
      ),
    break_statement: ($) => seq("break", optional($._semicolon)),

    continue_statement: ($) => seq("continue", optional($._semicolon)),

    // FIXME: Make this nicer like tree-sitter-c
    condition_statement: ($) =>
      prec.right(
        seq(
          "if",
          "(",
          field("condition", $._expression),
          ")",
          field("truePath", $._statement),
          optional(seq("else", field("falsePath", $._statement))),
        ),
      ),

    switch_statement: ($) =>
      seq(
        "switch",
        "(",
        field("condition", $._expression),
        ")",
        "{",
        repeat($.switch_case),
        "}",
      ),

    switch_case: ($) =>
      prec.right(
        seq(
          choice(
            seq("case", field("value", commaSep1($._case_expression)), ":"),
            seq("default", ":"),
          ),
          field("body", $._statement),
        ),
      ),

    expression_statement: ($) =>
      prec.right(
        seq(choice($._expression, $.comma_expression), optional($._semicolon)),
      ),

    return_statement: ($) =>
      prec.right(
        seq(
          "return",
          optional(
            field("expression", choice($._expression, $.comma_expression)),
          ),
          optional($._semicolon),
        ),
      ),

    delete_statement: ($) =>
      prec.right(
        PREC.FREE,
        seq("delete", field("free", $._expression), optional($._semicolon)),
      ),

    _semicolon: ($) => choice($._automatic_semicolon, ";"),

    // Expressions

    _expression: ($) =>
      choice(
        $.assignment_expression,
        $.call_expression,
        $.array_indexed_access,
        $.packed_array_indexed_access,
        $.ternary_expression,
        $.field_access,
        $.scope_access,
        $.binary_expression,
        $.unary_expression,
        $.update_expression,
        $.sizeof_expression,
        $.view_as,
        $.old_type_cast,
        $.identifier,
        $._literal,
        $.parenthesized_expression,
        $.this,
        $.new_expression,
      ),

    // This is needed to resolve ambiguity between symbols and old type casts in case statements.
    _case_expression: ($) =>
      choice(
        $.scope_access,
        $.case_binary_expression,
        $.case_unary_expression,
        $.sizeof_expression,
        $.view_as,
        $.identifier,
        $._literal,
        $.parenthesized_expression,
        $.new_expression,
      ),

    assignment_expression: ($) =>
      prec.right(
        PREC.ASSIGNMENT,
        seq(
          field(
            "left",
            choice(
              $.array_indexed_access,
              $.packed_array_indexed_access,
              $.view_as,
              $.field_access,
              $.scope_access,
              $.identifier,
              $.this,
            ),
          ),
          field("operator", choice(...ASSIGNMENT_OPERATORS)),
          field("right", choice($._expression, $.dynamic_array)),
        ),
      ),

    call_expression: ($) =>
      prec.left(
        PREC.CALL,
        seq(
          field(
            "function",
            choice($.builtin_type, $.identifier, $.field_access),
          ),
          field("arguments", $.call_arguments),
        ),
      ),

    call_arguments: ($) =>
      prec.left(
        -11,
        seq(
          "(",
          commaSep(choice($._expression, $.named_arg, $.ignore_argument)),
          ")",
        ),
      ),

    named_arg: ($) =>
      seq(
        ".",
        field("arg_name", $.identifier),
        "=",
        field("value", $._expression),
      ),

    ignore_argument: ($) => "_",

    array_indexed_access: ($) =>
      seq(
        field(
          "array",
          choice($.identifier, $.array_indexed_access, $.field_access),
        ),
        "[",
        field("index", $._expression),
        "]",
      ),

    // https://forums.alliedmods.net/showthread.php?t=90735
    packed_array_indexed_access: ($) =>
      prec(
        PREC.FIELD,
        seq(
          field(
            "array",
            choice($.identifier, $.array_indexed_access, $.field_access),
          ),
          "{",
          field("index", $._expression),
          "}",
        ),
      ),

    parenthesized_expression: ($) =>
      seq(
        "(",
        field("expression", choice($._expression, $.comma_expression)),
        ")",
      ),

    comma_expression: ($) =>
      seq(
        field("left", $._expression),
        ",",
        field("right", choice($._expression, $.comma_expression)),
      ),

    ternary_expression: ($) =>
      prec.right(
        PREC.TERNARY,
        seq(
          field("condition", $._expression),
          "?",
          field("consequence", $._expression),
          $._ternary_colon,
          field("alternative", $._expression),
        ),
      ),

    field_access: ($) =>
      prec.right(
        PREC.FIELD,
        seq(
          field(
            "target",
            choice(
              $.identifier,
              $.field_access,
              $.scope_access,
              $.call_expression,
              $.array_indexed_access,
              $.packed_array_indexed_access,
              $.parenthesized_expression,
              $.view_as,
              $.this,
              $.new_expression,
            ),
          ),
          ".",
          field("field", $.identifier),
        ),
      ),

    scope_access: ($) =>
      prec.right(
        PREC.FIELD,
        seq(field("scope", $.identifier), "::", field("field", $.identifier)),
      ),

    unary_expression: ($) => unaryExpression($._expression),

    case_unary_expression: ($) => unaryExpression($._case_expression),

    binary_expression: ($) => binaryExpression($._expression),

    case_binary_expression: ($) => binaryExpression($._case_expression),

    update_expression: ($) => {
      // Only lvalue-like targets can be incremented/decremented.
      const argument = field(
        "argument",
        choice(
          $.identifier,
          $.field_access,
          $.array_indexed_access,
          $.packed_array_indexed_access,
          $.parenthesized_expression,
          $.this,
        ),
      );
      const operator = field("operator", choice("--", "++"));
      return prec.right(
        PREC.UNARY,
        choice(seq(operator, argument), seq(argument, operator)),
      );
    },

    _sizeof_call_expression: ($) =>
      prec(
        1,
        choice(
          $.call_expression,
          prec.right(1, seq($.identifier, repeat($.dimension))),
          prec.right(1, seq($.array_indexed_access, repeat($.dimension))),
          $.field_access,
          $.scope_access,
          $._literal,
          $.parenthesized_expression,
          $.this,
          $.array_scope_access,
        ),
      ),

    array_scope_access: ($) =>
      prec.right(
        PREC.FIELD,
        seq(
          field("scope", $.identifier),
          repeat1($.dimension),
          ".",
          field("field", $.identifier),
        ),
      ),

    sizeof_expression: ($) =>
      prec(
        PREC.SIZEOF,
        seq(
          "sizeof",
          choice(
            seq("(", field("type", $._sizeof_call_expression), ")"),
            field("type", $._sizeof_call_expression),
          ),
        ),
      ),

    view_as: ($) =>
      seq(
        "view_as",
        "<",
        field("type", $.type),
        ">",
        "(",
        field("value", $._expression),
        ")",
      ),

    old_type_cast: ($) =>
      prec.left(
        PREC.CAST,
        seq(field("type", $.old_type), field("value", $._expression)),
      ),

    array_literal: ($) =>
      prec(
        10,
        seq(
          "{",
          commaSep1(choice($.view_as, $.old_type_cast, $._preproc_expression)),
          optional(seq(",", optional($.rest_operator))),
          "}",
        ),
      ),

    _literal: ($) =>
      choice(
        $.int_literal,
        $.float_literal,
        $.char_literal,
        $.string_literal,
        $.packed_string_literal,
        $.bool_literal,
        $.array_literal,
        $.null,
      ),

    int_literal: ($) => {
      const separator = "_";
      const hex = /[0-9a-fA-F]/;
      const octo = /[o0-7]/;
      const decimal = /[0-9]/;
      const hexDigits = seq(repeat1(hex), repeat(seq(separator, repeat1(hex))));
      const octoDigits = seq(
        repeat1(octo),
        repeat(seq(separator, repeat1(octo))),
      );
      const decimalDigits = seq(
        repeat1(decimal),
        repeat(seq(separator, repeat1(decimal))),
      );
      return token(
        seq(
          choice(
            decimalDigits,
            seq("0b", decimalDigits),
            seq("0x", hexDigits),
            seq("0o", octoDigits),
          ),
          optional(seq(/[eEpP]/, optional(seq(optional(/[-\+]/), hexDigits)))),
        ),
      );
    },

    float_literal: (_) => {
      const digits = repeat1(/[0-9]+_?/);
      const exponent = seq(/[eE][\+-]?/, digits);

      return token(seq(digits, ".", optional(digits), optional(exponent)));
    },

    char_literal: ($) =>
      seq(
        "'",
        choice(
          $.escape_sequence,
          alias(token.immediate(/[^\n']/), $.character),
        ),
        "'",
      ),

    string_literal: ($) =>
      seq(
        '"',
        repeat(
          choice(token.immediate(prec(1, /[^"\\]|\\\r?\n/)), $.escape_sequence),
        ),
        '"',
      ),

    // Packed string
    // https://forums.alliedmods.net/showthread.php?t=90735
    packed_string_literal: ($) =>
      prec(PREC.UNARY + 1, seq("!", $.string_literal)),

    escape_sequence: ($) =>
      token(
        prec(
          1,
          // `%` is accepted by spcomp (e.g. Format(..., "%.2f\%"))
          seq("\\", /(?:[abefnrt'\"\\%]|(?:x[a-zA-Z0-9]{0,2}|\d+);?)/),
        ),
      ),

    bool_literal: ($) => token(choice("true", "false")),

    null: ($) => "null",

    this: ($) => "this",

    rest_operator: ($) => "...",

    system_lib_string: ($) =>
      token(seq("<", repeat(choice(/[^>]/, "\\>")), ">")),

    identifier: ($) => /[a-zA-Z_]\w*/,

    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: ($) =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
      ),
  },

  supertypes: ($) => [$._expression, $._statement],
});

module.exports.PREC = PREC;

function preprocessor(command) {
  return `#${command}`;
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function unaryExpression(rule) {
  return prec.left(
    PREC.UNARY,
    seq(
      field("operator", choice("!", "~", "-", "+", "&")),
      field("argument", rule),
    ),
  );
}

function binaryExpression(rule) {
  const table = [
    ["+", PREC.ADD],
    ["-", PREC.ADD],
    ["...", PREC.ADD],
    ["*", PREC.MULTIPLY],
    ["/", PREC.MULTIPLY],
    ["%", PREC.MULTIPLY],
    ["||", PREC.LOGICAL_OR],
    ["&&", PREC.LOGICAL_AND],
    ["|", PREC.INCLUSIVE_OR],
    ["^", PREC.EXCLUSIVE_OR],
    ["&", PREC.BITWISE_AND],
    ["==", PREC.EQUAL],
    ["!=", PREC.EQUAL],
    [">", PREC.RELATIONAL],
    [">=", PREC.RELATIONAL],
    ["<=", PREC.RELATIONAL],
    ["<", PREC.RELATIONAL],
    ["<<", PREC.SHIFT],
    [">>", PREC.SHIFT],
    [">>>", PREC.SHIFT],
  ];

  return choice(
    ...table.map(([operator, precedence]) => {
      return prec.left(
        precedence,
        seq(
          field("left", rule),
          field("operator", operator),
          field("right", rule),
        ),
      );
    }),
  );
}
