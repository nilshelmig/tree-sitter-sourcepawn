const PREC = {
  PAREN_DECLARATOR: -10,
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
  ARRAY_MEMBER: 18,
};

module.exports = grammar({
  name: "sourcepawn",

  extras: ($) => [
    /\s|\\\r?\n/,
    $.comment,
    $.preproc_endif,
    $.preproc_if,
    $.preproc_else,
  ],

  inline: ($) => [
    $._statement,
    $._top_level_statements,
    $.methodmap_visibility,
  ],

  conflicts: ($) => [
    [$._type, $.type_expression],
    [$.type_expression, $._type, $._expression],
    [$.type_expression, $._expression],
    [$.function_declaration, $._expression],
    [$.function_declaration, $.type_expression],
    [$.function_storage_class, $.variable_storage_class],
    [$.variable_storage_class, $.old_variable_storage_class],
    [$.function_storage_class, $.old_variable_storage_class],
    [
      $.function_storage_class,
      $.variable_storage_class,
      $.old_variable_storage_class,
    ],
    // [$.old_type_cast, $.ternary_expression],
    [$.argument_declaration, $.type_expression],
    [$.argument_declarations, $.function_call_arguments],
    [$.global_variable, $._type],
    [$.global_variable, $._old_type],
  ],

  word: ($) => $.symbol,

  rules: {
    source_file: ($) =>
      repeat(
        choice(
          $.function_declaration,
          $.function_definition,
          $.callback_implementation,
          $.enum,
          $.enum_struct,
          $.typedef,
          $.typeset,
          $.functag,
          $.funcenum,
          $.methodmap,
          $.struct,
          $.global_variable,
          $._top_level_statements,
          $.preproc_include,
          $.preproc_tryinclude,
          $.preproc_define,
          $.preproc_macro,
          $.preproc_undefine,
          $.preproc_pragma_semicolon,
          $.preproc_pragma_newdecls,
          $.preproc_pragma_deprecated,
          $.preproc_pragma_dynamic
        )
      ),

    // Preprocesser

    preproc_include: ($) =>
      seq(
        preprocessor("include"),
        field("path", choice($.string_literal, $.system_lib_string)),
        "\n"
      ),

    preproc_tryinclude: ($) =>
      seq(
        preprocessor("tryinclude"),
        field("path", choice($.string_literal, $.system_lib_string)),
        "\n"
      ),

    preproc_macro: ($) =>
      seq(
        preprocessor("define"),
        field("name", $.symbol),
        token.immediate("("),
        commaSep1(seq("%", /[0-9]/)),
        token.immediate(")"),
        field("value", $.preproc_arg),
        "\n"
      ),

    preproc_define: ($) =>
      seq(
        preprocessor("define"),
        field("name", $.symbol),
        field("value", optional($._expression)),
        "\n"
      ),
    preproc_arg: ($) => token(prec(-1, repeat1(/.|\\\r?\n/))),

    preproc_undefine: ($) =>
      seq(preprocessor("undef"), field("name", $.symbol), "\n"),

    preproc_if: ($) =>
      seq(
        preprocessor("if"),
        field("condition", choice($.symbol, $.preproc_defined_condition)),
        optional($.comment),
        "\n"
      ),
    preproc_defined_condition: ($) =>
      seq(token(seq(optional("!"), "defined")), field("name", $.symbol)),
    preproc_else: ($) => seq(preprocessor("else"), optional($.comment), "\n"),
    preproc_endif: ($) => seq(preprocessor("endif"), optional($.comment), "\n"),

    preproc_pragma_semicolon: ($) =>
      seq(
        preprocessor("pragma"),
        "semicolon",
        field("enabled", $.int_literal),
        optional($.semicolon),
        "\n"
      ),

    preproc_pragma_newdecls: ($) =>
      seq(
        preprocessor("pragma"),
        "newdecls",
        field("value", $.symbol),
        optional($.semicolon),
        "\n"
      ),

    preproc_pragma_deprecated: ($) =>
      seq(
        preprocessor("pragma"),
        "deprecated",
        field("info", optional($.preproc_arg)),
        "\n"
      ),

    preproc_pragma_dynamic: ($) =>
      seq(
        preprocessor("pragma"),
        "dynamic",
        field("value", $.int_literal),
        "\n"
      ),

    // Main Grammar

    function_declaration: ($) =>
      seq(
        optional($.function_storage_class),
        field("returnType", optional(seq($._type, optional($.dimension)))),
        field("name", $.symbol),
        field("arguments", $.argument_declarations),
        $.block
      ),
    function_storage_class: ($) =>
      choice("stock", "static", seq("stock", "static"), seq("static", "stock")),

    function_definition: ($) =>
      seq(
        $.function_definition_type,
        field("returnType", optional(seq($._type, optional($.dimension)))),
        field("name", $.symbol),
        field("arguments", $.argument_declarations),
        optional($.semicolon)
      ),

    function_definition_type: ($) => choice("forward", "native"),

    callback_implementation: ($) =>
      seq(
        "public",
        field("returnType", optional(seq($._type, optional($.dimension)))),
        field("name", $.symbol),
        field("arguments", $.argument_declarations),
        choice($.block, $._statement)
      ),

    argument_declarations: ($) =>
      seq(
        "(",
        choice(
          $.rest_argument,
          seq(
            commaSep($.argument_declaration),
            optional(seq(",", $.rest_argument))
          )
        ),
        ")"
      ),
    argument_declaration: ($) =>
      prec(
        PREC.PAREN_DECLARATOR,
        seq(
          optional("const"),
          optional("&"),
          field(
            "type",
            optional(choice($.type_expression, $.old_type_expression))
          ),
          optional("&"),
          field("name", $.symbol),
          repeat(choice($.dimension, $.fixed_dimension)),
          field(
            "defaultValue",
            optional(
              seq(
                "=",
                choice(
                  $.array_indexed_access,
                  $.ternary_expression,
                  $.field_access,
                  $.scope_access,
                  $.binary_expression,
                  $.unary_expression,
                  $.sizeof_expression,
                  $.view_as,
                  $.old_type_cast,
                  $.symbol,
                  $._literal,
                  $.concatenated_string,
                  $.char_literal,
                  $.parenthesized_expression,
                  $.vector
                )
              )
            )
          )
        )
      ),

    rest_argument: ($) =>
      seq(
        field("type", choice($.type_expression, $.old_type_expression)),
        "..."
      ),

    variable_declaration_statement: ($) =>
      prec.left(
        seq(
          repeat($.variable_storage_class),
          field("type", $.type_expression),
          commaSep1($.variable_declaration),
          optional($.semicolon)
        )
      ),

    variable_storage_class: ($) => choice("const", "static"),
    variable_declaration: ($) =>
      seq(
        field("name", $.symbol),
        repeat(choice($.dimension, $.fixed_dimension)),
        field(
          "initialValue",
          optional(
            seq("=", choice($._expression, $.dynamic_array, $.new_instance))
          )
        )
      ),

    dynamic_array: ($) =>
      seq(
        "new",
        field("type", choice($.builtin_type, $.symbol)),
        repeat1($.fixed_dimension)
      ),

    new_instance: ($) =>
      seq(
        "new",
        field("class", $.symbol),
        field("arguments", $.function_call_arguments)
      ),

    old_variable_declaration_statement: ($) =>
      prec.left(
        seq(
          $.old_variable_storage_class,
          commaSep1($.old_variable_declaration),
          optional($.semicolon)
        )
      ),
    old_variable_storage_class: ($) =>
      choice(seq("new", optional("const")), "decl", "static"),
    old_variable_declaration: ($) =>
      seq(
        field("type", optional($._old_type)),
        field("name", $.symbol),
        repeat(choice($.dimension, $.fixed_dimension)),
        field("initialValue", optional(seq("=", $._expression)))
      ),

    enum: ($) =>
      seq(
        "enum",
        field("name", optional(seq($.symbol, optional(token.immediate(":"))))),
        optional(
          seq(
            "(",
            choice(
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
              ">>="
            ),
            $._expression,
            ")"
          )
        ),
        field("entries", $.enum_entries),
        optional($.semicolon)
      ),
    enum_entries: ($) => seq("{", commaSep1($.enum_entry), optional(","), "}"),
    enum_entry: ($) =>
      seq(
        field(
          "type",
          optional(seq(choice($.builtin_type, $.symbol), token.immediate(":")))
        ),
        field("name", $.symbol),
        optional($.fixed_dimension),
        field("value", optional(seq("=", $._expression)))
      ),

    enum_struct: ($) =>
      seq(
        "enum",
        "struct",
        field("name", $.symbol),
        "{",
        repeat1(choice($.enum_struct_field, $.enum_struct_method)),
        "}"
      ),
    enum_struct_field: ($) =>
      seq(
        field("type", choice($.builtin_type, $.symbol)),
        field("name", $.symbol),
        optional($.fixed_dimension),
        $.semicolon
      ),
    enum_struct_method: ($) =>
      seq(
        field("returnType", choice($.builtin_type, $.symbol)),
        field("name", $.symbol),
        $.argument_declarations,
        $.block
      ),

    typedef: ($) =>
      seq(
        "typedef",
        field("name", $.symbol),
        "=",
        $.typedef_expression,
        optional($.semicolon)
      ),
    typeset: ($) =>
      seq(
        "typeset",
        field("name", $.symbol),
        "{",
        repeat1(seq($.typedef_expression, optional($.semicolon))),
        "}",
        optional($.semicolon)
      ),
    typedef_expression: ($) =>
      choice(
        seq(
          "function",
          field("returnType", choice(seq($._type, optional($.dimension)))),
          $.typedef_args
        ),
        seq(
          "(",
          "function",
          field("returnType", choice(seq($._type, optional($.dimension)))),
          $.typedef_args,
          ")"
        )
      ),
    typedef_args: ($) => seq("(", commaSep($.typedef_arg), ")"),
    typedef_arg: ($) =>
      seq(
        optional("const"),
        field("type", $.type_expression, $.any_type),
        optional("&"),
        field("name", $.symbol),
        optional($.fixed_dimension)
      ),

    funcenum: ($) =>
      seq(
        "funcenum",
        field("name", $.symbol),
        "{",
        commaSep1($.funcenum_member),
        optional(","),
        "}",
        optional($.semicolon)
      ),
    funcenum_member: ($) =>
      seq(
        field("returnType", optional($.old_type_expression)),
        "public",
        $.functag_args
      ),

    functag: ($) =>
      choice(
        seq(
          "functag",
          "public",
          field("returnType", $.old_type_expression),
          field("name", $.symbol),
          $.functag_args,
          optional($.semicolon)
        ),
        seq(
          "functag",
          field("name", $.symbol),
          "public",
          $.functag_args,
          optional($.semicolon)
        ),
        seq(
          "functag",
          field("name", $.symbol),
          field("returnType", $.old_type_expression),
          "public",
          $.functag_args,
          optional($.semicolon)
        )
      ),

    functag_args: ($) => seq("(", commaSep($.functag_arg), ")"),
    functag_arg: ($) =>
      seq(
        optional("const"),
        optional("&"),
        field("type", optional(choice($.old_type_expression, $.any_type))),
        field("name", $.symbol),
        optional($.fixed_dimension)
      ),

    methodmap: ($) =>
      seq(
        "methodmap",
        field("name", $.symbol),
        optional(choice(seq("<", field("inherits", $.symbol)), "__nullable__")),
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
            $.methodmap_property
          )
        ),
        "}",
        optional($.semicolon)
      ),
    methodmap_alias: ($) =>
      seq(
        $.methodmap_visibility,
        optional("~"),
        field("name", $.symbol),
        "(",
        ")",
        "=",
        field("function", $.symbol),
        $.semicolon
      ),
    methodmap_native: ($) =>
      seq(
        $.methodmap_visibility,
        "native",
        field("returnType", choice($.builtin_type, $.symbol)),
        field("name", $.symbol),
        $.argument_declarations,
        $.semicolon
      ),
    methodmap_native_constructor: ($) =>
      seq(
        $.methodmap_visibility,
        "native",
        field("name", $.symbol),
        $.argument_declarations,
        $.semicolon
      ),
    methodmap_native_destructor: ($) =>
      seq(
        $.methodmap_visibility,
        "native",
        "~",
        field("name", $.symbol),
        "(",
        ")",
        $.semicolon
      ),
    methodmap_method: ($) =>
      seq(
        $.methodmap_visibility,
        optional("static"),
        field("returnType", choice($.builtin_type, $.symbol)),
        field("name", $.symbol),
        $.argument_declarations,
        $.block
      ),
    methodmap_method_constructor: ($) =>
      seq(
        $.methodmap_visibility,
        field("name", $.symbol),
        $.argument_declarations,
        $.block
      ),
    methodmap_method_destructor: ($) =>
      seq(
        $.methodmap_visibility,
        "~",
        field("name", $.symbol),
        "(",
        ")",
        $.block
      ),
    methodmap_property: ($) =>
      seq(
        "property",
        field("type", choice($.builtin_type, $.symbol)),
        field("name", $.symbol),
        "{",
        repeat1(
          choice(
            $.methodmap_property_alias,
            $.methodmap_property_native,
            $.methodmap_property_method
          )
        ),
        "}"
      ),
    methodmap_property_alias: ($) =>
      seq(
        $.methodmap_visibility,
        $.methodmap_property_getter,
        "=",
        field("function", $.symbol),
        $.semicolon
      ),
    methodmap_property_native: ($) =>
      seq(
        $.methodmap_visibility,
        "native",
        choice($.methodmap_property_getter, $.methodmap_property_setter),
        $.semicolon
      ),
    methodmap_property_method: ($) =>
      seq(
        $.methodmap_visibility,
        choice($.methodmap_property_getter, $.methodmap_property_setter),
        $.block
      ),
    methodmap_property_getter: ($) => seq("get", "(", ")"),
    methodmap_property_setter: ($) =>
      seq(
        "set",
        "(",
        field("type", choice($.builtin_type, $.symbol)),
        field("name", $.symbol),
        ")"
      ),
    methodmap_visibility: ($) => "public",

    struct: ($) =>
      seq(
        "struct",
        field("name", $.symbol),
        "{",
        repeat($.struct_field),
        "}",
        optional($.semicolon)
      ),
    struct_field: ($) =>
      seq(
        "public",
        optional("const"),
        field("type", $.type_expression),
        field("name", $.symbol),
        $.semicolon
      ),

    global_variable: ($) =>
      seq(
        "public",
        field("type", choice($.symbol, seq($.symbol, token.immediate(":")))),
        field("name", $.symbol),
        "=",
        field("value", $.struct_constructor),
        optional($.semicolon)
      ),
    struct_constructor: ($) =>
      seq("{", commaSep($.struct_field_value), optional(","), "}"),
    struct_field_value: ($) =>
      seq(field("name", $.symbol), "=", field("value", $._expression)),

    type_expression: ($) =>
      seq(choice($.builtin_type, $.symbol, $.any_type), repeat($.dimension)),
    old_type_expression: ($) =>
      seq(
        choice($._old_type, seq($.any_type, token.immediate(":"))),
        repeat($.dimension)
      ),

    dimension: ($) => seq("[", "]"),
    fixed_dimension: ($) => seq("[", $._expression, "]"),

    _type: ($) => choice($.builtin_type, $.symbol, $._old_type),
    _old_type: ($) =>
      choice($.old_builtin_type, seq($.symbol, token.immediate(":"))),
    builtin_type: ($) => choice("void", "bool", "int", "float", "char"),
    old_builtin_type: ($) =>
      token(seq(choice("_", "Float", "bool", "String"), token.immediate(":"))),
    any_type: ($) => "any",

    block: ($) => seq("{", repeat($._statement), "}"),

    // Statements
    _statement: ($) =>
      choice(
        $.block,
        $._top_level_statements,
        $.for_loop,
        $.while_loop,
        $.do_while_loop,
        $.break_statement,
        $.continue_statement,
        $.condition_statement,
        $.switch_statement,
        $.return_statement,
        $.delete_statement,
        $.expression_statement
      ),

    _top_level_statements: ($) =>
      choice(
        $.variable_declaration_statement,
        $.old_variable_declaration_statement
      ),

    for_loop: ($) =>
      seq(
        "for",
        "(",
        field(
          "initialization",
          commaSep(choice($._top_level_statements, $.assignment_expression))
        ),
        $.semicolon,
        field("condition", optional($._expression)),
        $.semicolon,
        field("iteration", optional($._statement)),
        ")",
        $._statement
      ),
    while_loop: ($) =>
      seq("while", "(", field("condition", $._expression), ")", $._statement),
    do_while_loop: ($) =>
      prec.right(
        seq(
          "do",
          $.block,
          "while",
          "(",
          field("condition", $._expression),
          ")",
          optional($.semicolon)
        )
      ),
    break_statement: ($) => prec.right(seq("break", optional($.semicolon))),
    continue_statement: ($) =>
      prec.right(seq("continue", optional($.semicolon))),

    condition_statement: ($) =>
      prec.left(
        seq(
          "if",
          "(",
          field("condition", $._expression),
          ")",
          field("truePath", $._statement),
          optional(seq("else", field("falsePath", $._statement)))
        )
      ),

    switch_statement: ($) =>
      seq(
        "switch",
        "(",
        field("condition", $._expression),
        ")",
        "{",
        repeat(choice($.switch_case, $.switch_default_case)),
        "}"
      ),
    switch_case: ($) =>
      seq(
        "case",
        field("value", $.switch_case_values),
        ":",
        $._statement,
        optional($.break_statement)
      ),
    switch_case_values: ($) =>
      prec.left(commaSep1(choice($._literal, $.symbol))),
    switch_default_case: ($) =>
      seq("default", ":", $._statement, optional($.break_statement)),

    expression_statement: ($) =>
      prec.right(
        seq(choice($._expression, $.comma_expression), optional($.semicolon))
      ),

    return_statement: ($) =>
      prec.right(
        seq(
          "return",
          optional(choice($._expression, $.comma_expression)),
          optional($.semicolon)
        )
      ),

    delete_statement: ($) =>
      prec.right(
        PREC.FREE,
        seq("delete", field("free", $._expression), optional($.semicolon))
      ),

    semicolon: ($) => ";",

    // Expressions

    _expression: ($) =>
      choice(
        $.assignment_expression,
        $.function_call,
        $.array_indexed_access,
        $.ternary_expression,
        $.field_access,
        $.scope_access,
        $.binary_expression,
        $.unary_expression,
        $.update_expression,
        $.sizeof_expression,
        $.view_as,
        $.old_type_cast,
        $.symbol,
        $._literal,
        $.concatenated_string,
        $.char_literal,
        $.parenthesized_expression,
        $.vector,
        $.this
      ),

    assignment_expression: ($) =>
      prec.right(
        PREC.ASSIGNMENT,
        seq(
          field(
            "left",
            choice(
              $.array_indexed_access,
              $.view_as,
              $.field_access,
              $.scope_access,
              $.symbol,
              $.this
            )
          ),
          field(
            "operator",
            choice(
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
              ">>="
            )
          ),
          field("right", choice($._expression, $.dynamic_array, $.new_instance))
        )
      ),

    function_call: ($) =>
      prec.left(
        PREC.CALL,
        seq(
          field("function", choice($.symbol, $.field_access)),
          $.function_call_arguments
        )
      ),
    function_call_arguments: ($) =>
      prec.left(
        -11,
        seq(
          "(",
          commaSep(
            choice(
              seq("&", $.symbol),
              $._expression,
              $.named_arg,
              $.ignore_argument
            )
          ),
          ")"
        )
      ),
    named_arg: ($) =>
      seq(
        ".",
        field("name", $.symbol),
        "=",
        field("value", choice(seq("&", $.symbol), $._expression))
      ),
    ignore_argument: ($) => "_",

    array_indexed_access: ($) =>
      prec(
        PREC.ARRAY_MEMBER,
        seq(
          field(
            "array",
            choice($.symbol, $.array_indexed_access, $.field_access)
          ),
          "[",
          field("index", $._expression),
          "]"
        )
      ),

    parenthesized_expression: ($) =>
      seq("(", choice($._expression, $.comma_expression), ")"),

    comma_expression: ($) =>
      seq(
        field("left", $._expression),
        ",",
        field("right", choice($._expression, $.comma_expression))
      ),

    ternary_expression: ($) =>
      prec.left(
        20,
        seq(
          field("condition", $._expression),
          "?",
          field("consequence", prec.left(16, $._expression)),
          ":",
          field("alternative", $._expression)
        )
      ),

    field_access: ($) =>
      prec.right(
        PREC.FIELD,
        seq(field("target", $._expression), ".", field("field", $.symbol))
      ),

    scope_access: ($) =>
      prec.right(
        PREC.FIELD,
        seq(field("scope", $.symbol), "::", field("field", $.symbol))
      ),

    unary_expression: ($) =>
      prec.left(
        PREC.UNARY,
        seq(
          field("operator", choice("!", "~", "-", "+")),
          field("argument", $._expression)
        )
      ),

    binary_expression: ($) => {
      const table = [
        ["+", PREC.ADD],
        ["-", PREC.ADD],
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
              field("left", $._expression),
              field("operator", operator),
              field("right", $._expression)
            )
          );
        })
      );
    },

    update_expression: ($) => {
      const argument = field("argument", $._expression);
      const operator = field("operator", choice("--", "++"));
      return prec.right(
        PREC.UNARY,
        choice(seq(operator, argument), seq(argument, operator))
      );
    },

    sizeof_expression: ($) =>
      prec(
        PREC.SIZEOF,
        seq(
          "sizeof",
          choice(
            seq(
              "(",
              field("type", choice($.symbol, $.scope_access)),
              repeat($.dimension),
              ")"
            ),
            seq(
              field("type", choice($.symbol, $.scope_access)),
              repeat($.dimension)
            )
          )
        )
      ),

    view_as: ($) =>
      prec.left(
        PREC.CAST,
        seq(
          "view_as",
          "<",
          field("type", choice($.builtin_type, $.symbol)),
          ">",
          "(",
          field("value", $._expression),
          ")"
        )
      ),

    old_type_cast: ($) =>
      prec.left(
        PREC.CAST,
        seq(field("type", $._old_type), field("value", $._expression))
      ),

    vector: ($) =>
      prec(
        10,
        seq(
          "{",
          commaSep1(
            choice($.vector, $._literal, $.symbol, $.view_as, $.old_type_cast)
          ),
          optional(seq(",", optional($.rest_operator))),
          "}"
        )
      ),

    _literal: ($) =>
      prec(
        10,
        choice(
          $.int_literal,
          $.float_literal,
          $.char_literal,
          $.string_literal,
          $.concatenated_string,
          $.bool_literal,
          $.null
        )
      ),

    int_literal: ($) => {
      const separator = "'";
      const hex = /[0-9a-fA-F]/;
      const decimal = /[0-9]/;
      const hexDigits = seq(repeat1(hex), repeat(seq(separator, repeat1(hex))));
      const decimalDigits = seq(
        repeat1(decimal),
        repeat(seq(separator, repeat1(decimal)))
      );
      return token(
        seq(
          optional(/[-\+]/),
          choice(decimalDigits, seq("0b", decimalDigits), seq("0x", hexDigits)),
          optional(seq(/[eEpP]/, optional(seq(optional(/[-\+]/), hexDigits))))
        )
      );
    },

    float_literal: ($) => {
      const separator = "'";
      const decimal = /[0-9]/;
      const decimalDigits = seq(
        repeat1(decimal),
        repeat(seq(separator, repeat1(decimal)))
      );
      return token(
        seq(
          optional(/[-\+]/),
          choice(
            seq(decimalDigits, optional(seq(".", optional(decimalDigits)))),
            seq(".", decimalDigits)
          )
        )
      );
    },

    char_literal: ($) =>
      seq("'", choice($.escape_sequence, token.immediate(/[^\n']/)), "'"),

    concatenated_string: ($) =>
      prec.left(
        seq(
          field("left", choice($.string_literal, $.symbol)),
          "...",
          field(
            "right",
            choice($.string_literal, $.symbol, $.concatenated_string)
          )
        )
      ),

    string_literal: ($) =>
      seq(
        '"',
        repeat(
          choice(token.immediate(prec(1, /[^"]|\\\r?\n/)), $.escape_sequence)
        ),
        '"'
      ),

    escape_sequence: ($) =>
      token(
        prec(
          1,
          seq(
            "\\",
            choice(
              /[^xuU]/,
              /\d{2,3}/,
              /x[0-9a-fA-F]{2,}/,
              /u[0-9a-fA-F]{4}/,
              /U[0-9a-fA-F]{8}/
            )
          )
        )
      ),

    bool_literal: ($) => token(choice("true", "false")),
    null: ($) => "null",
    this: ($) => "this",
    rest_operator: ($) => "...",

    system_lib_string: ($) =>
      token(seq("<", repeat(choice(/[^>\n]/, "\\>")), ">")),

    symbol: ($) => /[a-zA-Z_]\w*/,

    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: ($) =>
      token(
        choice(
          seq("//", /(\\(.|\r?\n)|[^\\\n])*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")
        )
      ),
  },

  supertypes: ($) => [$._expression, $._statement],
});

module.exports.PREC = PREC;

function preprocessor(command) {
  return alias(new RegExp("#[ \t]*" + command), "#" + command);
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
