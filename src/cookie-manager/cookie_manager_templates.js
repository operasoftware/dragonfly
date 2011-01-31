window.templates || (window.templates = {});

templates.cookie_manager = {
  hostname_group_render: function(runtime) {
    return [
      [
        "span",  runtime.hostname,
        "class", "group_hostname"
      ],
      runtime.pathname/* + " ",
      [
        "a",                 "("+ui_strings.S_BUTTON_STORAGE_DELETE_ALL+")",
        "class",             "delete_cookie",
        "href",              "#",
        "data-cookie-domain", runtime.hostname,
        "data-cookie-path",   runtime.pathname,
        "handler",           "cookiemanager-delete-domain-path-cookies"
      ] */
    ];
  },
  wrap_ellipsis: function(text) {
    return [
      "div",
        [
          "div", text,
          "class", "ellipsis"
        ],
      "class", "ellipsis_cont",
      "title", text
    ]
  },
  editable_name: function(name, objectref) {
    return [
      "span",
      [
        "input",             " ",
        "value",             name,
        "type",              "text",
        "data-objectref",    objectref,
        "data-editproperty", "name",
        "blur-handler",      "cookiemanager-edit",
        "handler",           "cookiemanager-edit",
        "class",             "hidden edit_formelem",
      ],
      [
        "div",          name,
        "edit-handler", "cookiemanager-init-edit-mode",
        "class",        "editable",
        "title",        ui_strings.S_LABEL_STORAGE_DOUBLE_CLICK_TO_EDIT
      ],
      "class", "edit_container"
    ];
  },
  editable_value: function(value, objectref) {
    return [
      "span",
      [
        "input",             " ",
        "value",             value,
        "type",              "text",
        "data-objectref",    objectref,
        "data-editproperty", "value",
        "blur-handler",      "cookiemanager-edit",
        "handler",           "cookiemanager-edit",
        "class",             "hidden edit_formelem"
      ],
      [
        "div",          value,
        "class",        "editable",
        "edit-handler", "cookiemanager-init-edit-mode",
        "title",        ui_strings.S_LABEL_STORAGE_DOUBLE_CLICK_TO_EDIT
      ],
      "class", "edit_container"
    ];
  },
  expires_container: function(objectref, parsed_date) {
    return ["div", "id", "expires_container_"+objectref, "title", parsed_date.toUTCString()];
  },
  expires_0values: function() {
    return ["span", ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES_ON_SESSION_CLOSE, "class", "replaced-val"];
  },
  expired_value: function() {
    return ["span", ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRED, "class", "replaced-val"];
  },
  unknown_value: function() {
    return ["span", "-", "class", "replaced-val"];
  },
  remove_button: function(objectref) {
    return [
      "button",         ui_strings.S_LABEL_STORAGE_DELETE,
      "data-objectref", objectref,
      "class",          "delete_cookie",
      "handler",        "cookiemanager-delete-cookie"
    ];
  }
}