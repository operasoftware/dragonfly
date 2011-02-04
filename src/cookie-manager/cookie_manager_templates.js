window.templates || (window.templates = {});

templates.cookie_manager = {
  hostname_group_render: function(runtime) {
    return [
      [
        "span",  runtime.hostname,
        "class", "group_hostname"
      ],
      runtime.pathname
    ];
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
    if(typeof elem === "string")
    {
      template.push("title", elem);
    }
    return template;
  },
  edit_mode_switch_container: function(value_container, edit_container) {
    return [value_container, edit_container];
  },
  value_container: function(elem) {
    return [
      "div", this.wrap_ellipsis(elem), "class", "value_container"
    ];
  },
  edit_container: function(elem) {
    return [
      "div", elem, "class", "edit_container"
    ];
  },
  input_text_container: function(name, value) {
    return [
      "input",
      "value", value || "",
      "type",  "text",
      "name",  name
    ]
  },
  input_datetime_container: function(name, value) {
    return [
      "input",
      "value", value || "",
      "type",  "datetime",
      "name",  name
    ]
  },
  input_domain: function(current_runtime, runtimes) {
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
      if(runtime_id == current_runtime)
      {
        domains[domain].is_current = true;
      }
    };
    if(domain_count <= 1) {
      return [
        ["input", "type", "hidden", "name", "add_cookie_runtime", "value", domains[domain].runtimes.toString()],
        ["span", runtimes[domains[domain].runtimes[0]].hostname]
      ];
    }
    else {
      var option_arr = [];
      for (var id in domains) {
        var option = ["option", id, "value", domains[id].runtimes.toString()];
        if(domains[id].is_current)
        {
          option = option.concat(["selected", "selected"]);
        }
        option_arr.push(option);
      };
      return [
        ["select", option_arr, "name", "add_cookie_runtime", "handler", "cookiemanager-add-cookie-domain-select", "class", "add_cookie_dropdown"]
      ];
    }
  },
  editable_domain: function(current_runtime, runtimes, domain) {
    var edit_elem = this.input_domain(current_runtime, runtimes);
    return this.edit_mode_switch_container(this.value_container(domain), this.edit_container(edit_elem));
  },
  editable_name: function(name) {
    var edit_elem = this.input_text_container("name", name);
    return this.edit_mode_switch_container(this.value_container(name), this.edit_container(edit_elem));
  },
  editable_value: function(value) {
    var edit_elem = this.input_text_container("value", value);
    return this.edit_mode_switch_container(this.value_container(value), this.edit_container(edit_elem));
  },
  editable_path: function(path) {
    var edit_elem = this.input_text_container("path", path);
    return this.edit_mode_switch_container(this.value_container(path), this.edit_container(edit_elem));
  },
  editable_expires: function(date_in_seconds, objectref) {
    var parsed_date = new Date(date_in_seconds*1000);
    var expires_container = ["div", "id", "expires_container_"+objectref, "title", parsed_date.toUTCString()];
    var edit_elem = this.input_datetime_container("expires", parsed_date.toISOString())
    if(date_in_seconds === 0)
    {
      return this.edit_mode_switch_container(this.value_container(this.expires_0values()), this.edit_container(edit_elem));
    }
    return this.edit_mode_switch_container(this.value_container(expires_container), this.edit_container(edit_elem));
  },
  expires_0values: function() {
    return [
      "span",  ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES_ON_SESSION_CLOSE_SHORT,
      "class", "replaced-val",
      "title", ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES_ON_SESSION_CLOSE
    ];
  },
  expired_value: function() {
    return ["span", ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRED, "class", "replaced-val"];
  },
  unknown_value: function() {
    return ["span", "-", "class", "replaced-val"];
  },
  add_cookie_row: function(current_runtime, runtimes) {
    return ["tr",
      [
        ["td", this.input_domain(current_runtime, runtimes)],
        ["td", this.input_text_container("name")],
        ["td", this.input_text_container("value")],
        ["td", this.input_text_container("path")],
        ["td", this.input_datetime_container("expires")],
        ["td"],
        ["td"]
      ],
      "class", "edit_mode"
    ];
  }
}