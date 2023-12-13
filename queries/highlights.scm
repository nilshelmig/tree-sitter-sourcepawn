; General
(symbol) @variable
(type (builtin_type) @type.builtin)
(builtin_type) @type.builtin
(type (symbol) @type)
(any_type) @type

(function_declaration
  name: (symbol) @function)
(function_call_arguments) @function.call
(function_call
  function: (symbol) @function.call)
(parameter_declarations) @parameter
(argument_declaration
  defaultValue: (symbol) @constant)

(fixed_dimension) @punctuation.bracket ; the [3] in var[3]
(dimension) @punctuation.bracket
(array_indexed_access) @punctuation.bracket

(sizeof_expression) @function.macro
(view_as) @function.builtin
(comment) @comment
(variable_declaration
  name: (symbol) @variable)
(variable_storage_class) @storageclass
(this) @variable.builtin
(escape_sequence) @string.escape


; Assume all uppercase symbols are constants
((symbol) @constant
  (#match? @constant "^[A-Z][A-Z\\d_]*$"))


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
(preproc_error) @function.macro ; Wrong colour?
(preproc_warning) @function.macro ; Wrong colour?

; https://github.com/alliedmodders/sourcemod/blob/5c0ae11a4619e9cba93478683c7737253ea93ba6/plugins/include/handles.inc#L78
(hardcoded_symbol) @variable.builtin


; Control-flow
(for_loop) @repeat
(condition_statement) @conditional
(while_loop) @repeat
(do_while_loop) @repeat
(switch_statement) @conditional
(switch_case) @conditional
(switch_case_values) @constant
(return_statement) @keyword.return
(ternary_expression) @conditional.ternary


; Constructors (must be after function_call_arguments)
(new_instance
  class: (symbol) @type
  arguments: (function_call_arguments) @constructor)
  
 
; Methods / Properties
(field_access
  field: (symbol) @field)

(function_call
  function: (field_access
    field: (symbol) @method.call)) ; Must be after field_access


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
(variable_visibility) @storageclass
(function_visibility) @storageclass
(assertion) @function.builtin
(function_declaration_kind) @keyword.function

[
  "new"
  "delete"
] @keyword.operator

[
  "public" ; public Plugin myinfo
] @storageclass

[
  ";"
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
(bool_literal) @boolean
(char_literal) @character
(float_literal) @float
(string_literal) @string
(array_literal) @punctuation.bracket
(concatenated_string) @punctuation.delimiter ; Dots in string-literal concat--Doesn't seem to work?

(null) @constant
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
