window.templates || (window.templates = {});

templates.cookie_manager = {
  runtime_group_render: function(protocol, domain, path) {
    return this.wrap_ellipsis(protocol + "//" + domain + path);
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
        "div", this.wrap_ellipsis(value),
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
      "handler", "cookiemanager-input-field"
    ]
  },
  input_checkbox_container: function(name, checked) {
    var template = [
     "input",
     "type", "checkbox",
     "name", name,
     "handler", "cookiemanager-input-field"
   ];
   if (checked)
   {
     template.push("checked", "checked");
   }
   return template;
  },
  input_datetime_container: function(name, value) {
    var lz = function(nr) // todo: move this somewhere else
    {
      nr = String(nr);
      if(nr.length < 2)
        nr = "0" + nr;
      return nr;
    };
    var datetime_local_val;
    if(value)
    {
      var d = new Date(value);
      datetime_local_val= d.getFullYear()+"-"+lz(d.getMonth() + 1)+"-"+lz(d.getDate())+"T"+lz(d.getHours())+":"+lz(d.getMinutes())+":"+lz(d.getSeconds());
    }
    return [
      "input",
      "value", datetime_local_val || "",
      "type",  "datetime-local",
      "name",  name,
      "handler", "cookiemanager-input-field"
    ]
  },
  input_domain: function(current_runtime, runtimes) {
    var domains = {};
    var domain_count = 0;
    var domain;
    for (var runtime_id in runtimes) {
      domain = runtimes[runtime_id].hostname || ""; // avoids undefined values where hostname is non-existent
      if (!domains[domain])
      {
        domains[domain] = { runtimes: [runtime_id] };
        domain_count++;
      }
      else
      {
        domains[domain].runtimes.push(runtime_id);
      }
      if (runtime_id == current_runtime)
      {
        domains[domain].is_current = true;
      }
    };
    if (domain_count <= 1) {
      return [
        [
          "input",
          "type", "hidden",
          "name", "add_cookie_runtime",
          "value", domains[domain].runtimes.toString()
        ],
        ["span", runtimes[domains[domain].runtimes[0]].hostname]
      ];
    }
    else {
      var option_arr = [];
      for (var id in domains) {
        var option = ["option", id, "value", domains[id].runtimes.toString()];
        if (domains[id].is_current)
        {
          option = option.concat(["selected", "selected"]);
        }
        option_arr.push(option);
      };
      return [
        "select", option_arr,
        "name", "add_cookie_runtime",
        "handler", "cookiemanager-add-cookie-domain-select",
        "class", "add_cookie_dropdown",
        "handler", "cookiemanager-input-field"
      ];
    }
  },
  editable_domain: function(current_runtime, runtimes, domain) {
    var edit_elem = this.input_domain(current_runtime, runtimes);
    return this.edit_mode_switch_container(domain, edit_elem);
  },
  all_editable_domain: function(domain) {
    var edit_elem = this.input_text_container("domain", domain);
    return this.edit_mode_switch_container(domain, edit_elem);
  },
  editable_name: function(name) {
    var edit_elem = this.input_text_container("name", name);
    return this.edit_mode_switch_container(name, edit_elem);
  },
  editable_value: function(value) {
    var edit_elem = this.input_text_container("value", value);
    return this.edit_mode_switch_container(value, edit_elem);
  },
  editable_path: function(path) {
    var edit_elem = this.input_text_container("path", path);
    return this.edit_mode_switch_container(path, edit_elem);
  },
  editable_expires: function(date_in_seconds, objectref) {
    var parsed_date = new Date(date_in_seconds*1000);
    var expires_container = ["div", "id", "expires_container_"+objectref, "title", parsed_date.toLocaleString()];
    var edit_elem = this.input_datetime_container("expires", parsed_date.toISOString())
    if (date_in_seconds === 0)
    {
      return this.edit_mode_switch_container(this.expires_0values(), edit_elem);
    }
    return this.edit_mode_switch_container(expires_container, edit_elem);
  },
  editable_secure: function(is_secure) {
    var edit_elem = this.input_checkbox_container("is_secure", is_secure);
    return this.edit_mode_switch_container(this.boolean_value(is_secure), edit_elem);
  },
  editable_http_only: function(is_http_only) {
    var edit_elem = this.input_checkbox_container("is_http_only", is_http_only);
    return this.edit_mode_switch_container(this.boolean_value(is_http_only), edit_elem);
  },
  expires_0values: function() {
    return [
      "span",  ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES_ON_SESSION_CLOSE_SHORT,
      "class", "replaced-val",
      "title", ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES_ON_SESSION_CLOSE
    ];
  },
  unknown_value: function() {
    return ["span", "-", "class", "replaced-val"];
  },
  boolean_value: function(bool) {
    if (bool)
    {
      return ["div", "class", "check"];
    }
    else {
      return [];
    }
  },
  add_cookie_row: function(current_runtime, runtimes) {
    return ["tr",
        ["td", this.input_domain(current_runtime, runtimes)],
        ["td", this.input_text_container("name")],
        ["td", this.input_text_container("value")],
        ["td", this.input_text_container("path")],
        ["td", this.input_datetime_container("expires")],
        ["td"],
        ["td"],
      "class", "edit_mode add_cookie_row"
    ];
  },
  add_cookie_row_all_editable: function(default_domain) {
    return ["tr",
        ["td", this.input_text_container("domain", default_domain)],
        ["td", this.input_text_container("name")],
        ["td", this.input_text_container("value")],
        ["td", this.input_text_container("path")],
        ["td", this.input_datetime_container("expires")],
        ["td", this.input_checkbox_container("is_secure")],
        ["td", this.input_checkbox_container("is_http_only")],
      "class", "edit_mode add_cookie_row"
    ];
  }
}
