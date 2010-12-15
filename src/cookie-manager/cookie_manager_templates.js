window.templates || (window.templates = {});

templates.cookie_manager = {
  add_cookie_form: function(runtimes) {
    return [
      ["h2", "Add Cookie"],
      ["form",
        [
          ["div",
            [
              ["label", "Domain"],
              ["br"],
              (function(){
                // depending on amount of domains, return selection list or text and hidden input field
                var domains = {};
                var domain_count = 0;
                var domain;
                for (var runtime_id in runtimes) {
                  domain = runtimes[runtime_id].hostname;
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
                  return [
                    ["input", "type", "hidden", "name", "add_cookie_runtime", "value", domains[domain].runtimes.toString()],
                    ["span", runtimes[domains[domain].runtimes[0]].hostname]
                  ]
                }
                else {
                  var option_arr = [];
                  for (var id in domains) {
                    option_arr.push(["option", id, "value", domains[id].runtimes.toString()]);
                  };
                  return ["select", option_arr, "name", "add_cookie_runtime_select", "handler", "cookiemanager-add-cookie-domain-select", "class", "add_cookie_dropdown"];
                }
              })()
            ],
          "class", "container"],
          ["div",
            [
              ["label", "Name"],
              ["br"],
              ["input",
                "type", "text",
                "name", "cookiename"
              ]
            ],
          "class", "container"],
          ["div",
            [
              ["label", "Value"],
              ["br"],
              ["input",
                "type", "text",
                "name", "cookievalue"
              ]
            ],
          "class", "container"],
          ["div",
            [
              ["label", "Path"],
              ["br"],
              ["input",
                "type", "text",
                "name", "cookiepath",
                "list", "cookiepathlist",
                "value", "/"
              ]
            ],
            "class", "container"
          ],
          ["div",
            [
              ["label", "Expires"],
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
                "button", "Add",
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
  hostname_group_render: function(runtime) {
    return [
      [
        "span", runtime.hostname,
        "class", "group_hostname"
      ],
      runtime.pathname + " ",
      [
        "a",                 "(Remove all)",
        "class",             "delete_cookie",
        "href",              "#",
        "data-cookie-domain", runtime.hostname,
        "data-cookie-path",   runtime.pathname,
        "handler",           "cookiemanager-delete-domain-path-cookies"
      ]
    ];
  },
  clear_and_update_button: function(){
    return [
      [
        "button", "RemoveAllCookies",
        "handler", "cookiemanager-delete-all",
        "class", "spacedbutton"
      ],
      [
        "button", "Update",
        "handler", "cookiemanager-update",
        "class", "spacedbutton"
      ]
    ]
  },
  table_view: {
    editable_name: function(name, objectref) {
      return [
        "span",
        [
          "input", " ",
          "value", name,
          "type", "text",
          "data-objectref", objectref,
          "data-editproperty", "name",
          "blur-handler", "cookiemanager-edit",
          "class", "hidden edit_formelem",
        ],
        [
          "div", name,
          "handler", "cookiemanager-init-edit-mode"
        ],
        "class", "edit_container"
      ];
    },
    editable_value: function(value, objectref) {
      return [
        "span",
        [
          "input", " ",
          "value", value,
          "type", "text",
          "data-objectref", objectref,
          "data-editproperty", "value",
          "blur-handler", "cookiemanager-edit",
          "class", "hidden edit_formelem"
        ],
        [
          "div", value,
          "handler", "cookiemanager-init-edit-mode"
        ],
        "class", "edit_container"
      ];
    },
    expires_0values: function() {
      return ["span", "(when session is closed)", "class", "replaced-val"];
    },
    remove_button: function(objectref) {
      return [
        "button",
        "Remove",
        "data-objectref", objectref,
        "class",          "delete_cookie",
        "handler",        "cookiemanager-delete-cookie"
      ];
    }
  }
}