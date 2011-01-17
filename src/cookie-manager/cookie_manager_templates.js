window.templates || (window.templates = {});

templates.cookie_manager = {
  add_cookie_form: function(runtimes) {
    return [
      ["h2", ui_strings.S_LABEL_COOKIE_MANAGER_ADD_COOKIE_HEADLINE],
      ["form",
        [
          ["div",
            [
              ["label", ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_DOMAIN],
              ["br"],
              ["div", this.domain_selector(runtimes), "class", "domain_select_container"]
            ],
          "class", "container"],
          ["div",
            [
              ["label", ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_NAME],
              ["br"],
              ["input",
                "type", "text",
                "name", "cookiename"
              ]
            ],
          "class", "container"],
          ["div",
            [
              ["label", ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_VALUE],
              ["br"],
              ["input",
                "type", "text",
                "name", "cookievalue"
              ]
            ],
          "class", "container"],
          ["div",
            [
              ["label", ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_PATH],
              ["br"],
              ["input",
                "type",  "text",
                "name",  "cookiepath",
                "list",  "cookiepathlist",
                "value", "/"
              ]
            ],
            "class", "container"
          ],
          ["div",
            [
              ["label", ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES],
              ["br"],
              ["input",
                "type", "datetime",
                "name", "cookieexpires"
              ]
            ],
            "class", "container"
          ],
          [
            "div",
            [
              ["br"],
              [
                "button",  ui_strings.S_BUTTON_ADD,
                "handler", "add-cookie-handler"
              ]
            ],
            "class", "container"
          ]
        ],
        "class", "add-cookie-form"
      ]
    ];
  },
  domain_selector: function(runtimes) {
    // depending on amount of domains, return selection list or text and hidden input field
    var container = ["div", " ", "class", "domain_selector"];
    var domains = {};
    var domain_count = 0;
    var domain;
    for (var runtime_id in runtimes) {
      domain = runtimes[runtime_id].hostname || ""; // avoids undefined values where hostname is non-existent
      if(!domains[domain])
      {
        domains[domain] = { runtimes: [runtime_id] };
        domain_count++;
      }
      else
      {
        domains[domain].runtimes.push(runtime_id);
      }
    };
    if(domain_count <= 1) {
      // 'domain' is left on the first and only value. maybe not the best way to do it.
      container[1]=[
        ["input", "type", "hidden", "name", "add_cookie_runtime", "value", domains[domain].runtimes.toString()],
        ["span", runtimes[domains[domain].runtimes[0]].hostname]
      ];
    }
    else {
      var option_arr = [];
      for (var id in domains) {
        option_arr.push(["option", id, "value", domains[id].runtimes.toString()]);
      };
      container[1]=[["select", option_arr, "name", "add_cookie_runtime_select", "handler", "cookiemanager-add-cookie-domain-select", "class", "add_cookie_dropdown"]];
    }
    return container;
  },  
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
  clear_and_refetch_button: function(){
    return [
      [
        "button",  ui_strings.S_BUTTON_STORAGE_DELETE_ALL,
        "handler", "cookiemanager-delete-all",
        "class",   "spacedbutton"
      ],
      [
        "button",  ui_strings.S_LABEL_STORAGE_UPDATE,
        "handler", "cookiemanager-update",
        "class",   "spacedbutton"
      ]
    ]
  },
  table_view: {
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
    expires_0values: function() {
      return ["span", ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES_ON_SESSION_CLOSE, "class", "replaced-val"];
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
}