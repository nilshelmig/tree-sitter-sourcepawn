; Assume all-caps names are constants
((symbol) @constant
 (#match? @constant "^[A-Z][A-Z\\d_]+$'"))

; Function definitions/declarations
(function_definition
  name: (symbol) @function)
(function_declaration
  name: (symbol) @function)
(parameter_declaration
  name: (symbol) @variable.parameter)

; Methods / Properties
(field_access
  field: (symbol) @field)

; Function calls
(call_expression
  function: (symbol) @function)
(call_expression
  function: (field_access
    field: (symbol) @method.call)) ; Must be after field_access

; Types
(builtin_type) @type.builtin
(type (symbol) @type)
(any_type) @type

; Variables
(variable_storage_class) @storageclass
(variable_declaration 
  name: (symbol) @variable)
(old_variable_declaration
  name: (symbol) @variable)

; Preprocessor
(preproc_include) @include
(preproc_tryinclude) @include
(system_lib_string) @string
(string_literal) @string

(preproc_assert) @preproc
(preproc_pragma) @preproc
(preproc_arg) @constant
(preproc_macro) @function.macro
(macro_param) @parameter
(preproc_if) @preproc
(preproc_else) @preproc
(preproc_elseif) @preproc
(preproc_endif) @preproc
(preproc_endinput) @preproc
(preproc_define) @define
(preproc_define
  name: (symbol) @constant)
(preproc_undefine) @define
(preproc_undefine
  name: (symbol) @constant)
(preproc_error) @function.macro ; Wrong color?
(preproc_warning) @function.macro ; Wrong color?

; Statements
(for_statement) @repeat
(condition_statement) @conditional
(while_statement) @repeat
(do_while_statement) @repeat
(switch_statement) @conditional
(switch_case) @conditional
(ternary_expression) @conditional.ternary

; Expressions
(view_as) @function.builtin
(sizeof_expression) @function.macro
(this) @variable.builtin

; https://github.com/alliedmodders/sourcemod/blob/5c0ae11a4619e9cba93478683c7737253ea93ba6/plugins/include/handles.inc#L78
(hardcoded_symbol) @variable.builtin

; Comments
(comment) @comment

; General
(parameter_declaration
  defaultValue: (symbol) @constant)
(fixed_dimension) @punctuation.bracket ; the [3] in var[3]
(dimension) @punctuation.bracket
(array_indexed_access) @punctuation.bracket
(escape_sequence) @string.escape

; Constructors
(new_expression
  class: (symbol) @type
  arguments: (call_arguments) @constructor)

; Methodmaps
(methodmap) @type.definition
(methodmap
  name: (symbol) @type)
(methodmap
  inherits: (symbol) @type)
(methodmap_method_constructor
  name: (symbol) @constructor)
(methodmap_method
  name: (symbol) @method)
(methodmap_native
  name: (symbol) @method)
(methodmap_property
  name: (symbol) @property)
(methodmap_property_getter) @method
(methodmap_property_setter) @method

; Enum structs
(enum_struct) @type.definition
(enum_struct
  name: (symbol) @type)
(enum_struct_field
  name: (symbol) @field)
(enum_struct_method
  name: (symbol) @method)

; Non-type Keywords
(variable_storage_class) @storageclass
(visibility) @storageclass
(visibility) @storageclass
(assertion) @function.builtin
(function_declaration_kind) @keyword.function
[
  "new"
  "delete"
] @keyword.operator
[
  "."
  ","
] @punctuation.delimiter

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "++"
  "--"
  "="
  "+="
  "-="
  "*="
  "/="
  "=="
  "!="
  "<"
  ">"
  ">="
  "<="
  "!"
  "&&"
  "||"
  "&"
  "|"
  "~"
  "^"
  "<<"
  ">>"
  ">>>"
  "|="
  "&="
  "^="
  "~="
  "<<="
  ">>="
] @operator
(ignore_argument) @operator
(scope_access) @operator
(rest_operator) @operator ; Should override (concatenated_string) but currently does nothing

; public Plugin myinfo
(struct_declaration
  name: (symbol) @variable.builtin)

; Typedef/Typedef
(typeset) @type.definition
(typedef) @type.definition
(functag) @type.definition
(funcenum) @type.definition
(typedef_expression) @keyword.function ; function void(int x)

; Enums
(enum) @type.definition
(enum
  name: (symbol) @type)
(enum_entry
  name: (symbol) @constant)
(enum_entry
  value: (_) @constant)

; Literals
(int_literal) @number
(char_literal) @character
(float_literal) @float
(string_literal) @string
(array_literal) @punctuation.bracket
(concatenated_string) @punctuation.delimiter ; Dots in string-literal concat--Doesn't seem to work?
[
  (bool_literal)
  (null)
] @constant.builtin
((symbol) @constant
  (#match? @constant "INVALID_HANDLE"))

; Comment specialisations (must be after comment)
; These might be unnecessary and/or used incorrectly, since they're intended
; for markup languages
((comment) @text.todo
  (#match? @text.todo "^\/[\/\*][\t ]TODO"))
((comment) @text.note
  (#match? @text.note "^\/[\/\*][\t ]NOTE"))
((comment) @text.warning
  (#match? @text.warning "^\/[\/\*][\t ]WARNING"))

; Keywords
[
  "__nullable__"
  "break"
  "case"
  "const"
  "continue"
  "default"
  "delete"
  "do"
  "else"
  "enum"
  "for"
  "forward"
  "funcenum"
  "functag"
  "get"
  "if"
  "methodmap"
  "native"
  "new"
  "property"
  "public"
  "return"
  "set"
  "static"
  "stock"
  "struct"
  "switch"
  "typedef"
  "typeset"
  "void"
  "while"
] @keyword

(symbol) @variable