window.templates || (window.templates = {});

// todo: mostly to be merged with cookie_manager
window.templates.storage = {
  runtime_group_render: function(uri) {
    return this.wrap_ellipsis(uri);
  },
  wrap_ellipsis: function(elem) {
    var template = [
      "div",
        [
          "div", elem,
          "class", "ellipsis"
        ],
      "class", "ellipsis_cont"
    ];
    if (typeof elem === "string")
    {
      template.push("title", elem);
    }
    return template;
  },
  edit_mode_switch_container: function(value, edit_elem) {
    return [
      [
        "div", value,
        "class", "value_container"
      ],
      [
        "div", edit_elem,
        "class", "edit_container"
      ]
    ];
  },
  input_text_container: function(name, value) {
    return [
      "input",
      "value", value || "",
      "type",  "text",
      "name",  name,
      "handler", "storage-input-field"
    ]
  },
  input_textarea_container: function(name, value) {
    var elem = [
      "textarea", value || "",
      "type", "text",
      "name", name,
      "handler", "storage-input-field",
      "focus-handler", "textarea-focus",
      "blur-handler", "textarea-blur"
    ];
    return elem;
  },
  input_hidden: function(name, value) {
    return [
      "input",
      "value", value || "",
      "type",  "hidden",
      "name",  name
    ]
  },
  editable_key: function(key) {
    var edit_elem = this.input_text_container("name", key);
    return this.edit_mode_switch_container(key, edit_elem);
  },
  editable_value: function(value) {
    var edit_elem = this.input_text_container("value", value);
    return this.edit_mode_switch_container(value, edit_elem);
  },
  add_storage_row: function(rt_id) {
    return ["tr",
        ["td", [this.input_text_container("key"), this.input_hidden("rt_id", rt_id)]],
        ["td", this.input_text_container("value")],
      "class", "edit_mode add_storage_row"
    ];
  },
  add_item_button: function(storage_name) {
    return [
      "button",       "Add " + storage_name,
      "class",        "add_storage_button container-button",
      "handler",      "storage-add-key",
      "unselectable", "on"
    ];
  },
  not_existing: function(storage_id) {
    return ['div',
      ['div',
        ui_strings.S_INFO_STORAGE_TYPE_DOES_NOT_EXIST.replace("%s", 'window.' + storage_id),
        'class', 'info-box'
      ],
      'class', 'padding'
    ];
  }
};

