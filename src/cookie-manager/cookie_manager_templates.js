window.templates || (window.templates = {});

templates.cookie_manager = {
  runtime_group_render: function(protocol, domain, path) {
    return protocol + "//" + domain + path;
  },
  value_container: function(content) {
    return [
      "div", templates.storage.wrap_ellipsis(content),
      "class", "value_container"
    ]
  },
  edit_container: function(edit_elem) {
    return [
      "div", edit_elem,
      "class", "edit_container"
    ];
  },
  input_text_container: function(name, value) {
    return [
      "input",
      "value", value || "",
      "type",  "text",
      "class",  "text",
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
  input_datetime_container: function(name, value_in_seconds) {
    var datetime_local_val;
    if (value_in_seconds)
    {
      datetime_local_val= new Date(value_in_seconds * 1000).toLocaleISOString();
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
        "class", "add_cookie_dropdown",
        "handler", "cookiemanager-input-field"
      ];
    }
  },
  domain: function(domain) {
    return this.value_container(domain || this.unknown_value());
  },
  all_editable_domain: function(current_runtime, runtimes, domain) {
    var editing_default = domain || runtimes[current_runtime].hostname;
    var edit_elem = this.input_text_container("domain", editing_default);
    return [this.domain(domain), this.edit_container(edit_elem)];
  },
  name: function(name) {
    return this.value_container(name);
  },
  editable_name: function(name) {
    var edit_elem = this.input_text_container("name", name);
    return [this.value_container(name), this.edit_container(edit_elem)];
  },
  value: function(value) {
    return this.value_container(value);
  },
  editable_value: function(value) {
    var editing_default = value || "";
    var edit_elem = this.input_text_container("value", editing_default);
    return [this.value(value), this.edit_container(edit_elem)];
  },
  path: function(path) {
    return this.value_container(path || this.unknown_value());
  },
  editable_path: function(path) {
    var editing_default = path || "/";
    var edit_elem = this.input_text_container("path", editing_default);
    return [this.path(path), this.edit_container(edit_elem)];
  },
  expires: function(date_in_seconds, objectref) {
    if (date_in_seconds === undefined)
    {
      return this.value_container(this.unknown_value());
    }
    if (date_in_seconds === 0)
    {
      return this.value_container(this.expires_0values());
    }
    var parsed_date = new Date(date_in_seconds * 1000);
    return this.value_container(["div", "id", "expires_container_"+objectref, "title", parsed_date.toLocaleString()]);
  },
  editable_expires: function(date_in_seconds, objectref) {
    var editing_default = date_in_seconds;
    if (date_in_seconds === undefined)
    {
       editing_default = new Date().getTime() / 1000 + 60 * 60; // if expiry is unknown, editing default is in one hour
    }
    var edit_elem = this.input_datetime_container("expires", editing_default);
    return [this.expires(date_in_seconds, objectref), this.edit_container(edit_elem)];
  },
  secure: function(is_secure) {
    if (is_secure === undefined)
    {
      return this.value_container(this.unknown_value());
    }
    return this.value_container(this.boolean_value(is_secure));
  },
  editable_secure: function(is_secure) {
    // editing_default is implicitely 0 > "off"
    var edit_elem = this.input_checkbox_container("is_secure", is_secure);
    return [this.secure(is_secure), this.edit_container(edit_elem)];
  },
  http_only: function(is_http_only) {
    if (is_http_only === undefined)
    {
      return this.value_container(this.unknown_value());
    }
    return this.value_container(this.boolean_value(is_http_only));
  },
  editable_http_only: function(is_http_only) {
    // editing_default is implicitely 0 > "off"
    var edit_elem = this.input_checkbox_container("is_http_only", is_http_only);
    return [this.http_only(is_http_only), this.edit_container(edit_elem)];
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
        ["td", this.edit_container(this.input_domain(current_runtime, runtimes))],
        ["td", this.edit_container(this.input_text_container("name"))],
        ["td", this.edit_container(this.input_text_container("value"))],
        ["td", this.edit_container(this.input_text_container("path"))],
        ["td", this.edit_container(this.input_datetime_container("expires"))],
        ["td"],
        ["td"],
      "class", "edit_mode add_cookie_row"
    ];
  },
  add_cookie_row_all_editable: function(default_domain) {
    return ["tr",
        ["td", this.edit_container(this.input_text_container("domain", default_domain))],
        ["td", this.edit_container(this.input_text_container("name"))],
        ["td", this.edit_container(this.input_text_container("value"))],
        ["td", this.edit_container(this.input_text_container("path"))],
        ["td", this.edit_container(this.input_datetime_container("expires"))],
        ["td", this.edit_container(this.input_checkbox_container("is_secure"))],
        ["td", this.edit_container(this.input_checkbox_container("is_http_only"))],
      "class", "edit_mode add_cookie_row"
    ];
  }
}
