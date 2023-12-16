; ADT items
(methodmap
  name: (symbol) @name) @definition.class

(enum_struct
  name: (symbol) @name) @definition.class

(enum
  name: (symbol) @name) @definition.class

; Method definitions
(enum_struct_method
  name: (symbol) @name) @definition.method
(methodmap_method
  name: (symbol) @name) @definition.method
(methodmap_method_constructor
  name: (symbol) @name) @definition.method
(methodmap_method_destructor
  name: (symbol) @name) @definition.method
(methodmap_property_method
  name: (symbol) @name) @definition.method

; Function definitions
(function_definition
  name: (symbol) @name) @definition.function
(function_declaration
  name: (symbol) @name) @definition.function

; Enum entries
(enum_entry
  name: (symbol) @name) @definition.constant

; Typedef definitions
(typeset
  name: (symbol) @name) @definition.interface
(typedef
  name: (symbol) @name) @definition.interface
(functag
  name: (symbol) @name) @definition.interface
(funcenum
  name: (symbol) @name) @definition.interface

; Macro definitions
(preproc_define
  name: (symbol) @name) @definition.macro
(preproc_macro
  name: (symbol) @name) @definition.macro

; References
(call_expression
  function: (symbol) @name) @reference.call
(call_expression
  function: (field_access
    field: (symbol) @name)) @reference.call
(new_expression
  class: (symbol) @name) @reference.class