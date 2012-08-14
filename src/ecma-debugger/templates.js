;(function()
{
  var self = this;

  var STRING_MAX_VALUE_LENGTH = 30;

  var TYPE_UNDEFINED = 0;
  var TYPE_NULL = 1;
  var TYPE_TRUE = 2;
  var TYPE_FALSE = 3;
  var TYPE_NAN = 4;
  var TYPE_PLUS_INFINITY = 5;
  var TYPE_MINUS_INFINITY = 6;
  var TYPE_NUMBER = 7;
  var TYPE_STRING = 8;
  var TYPE_OBJECT = 9;

  var types = {};
  types[TYPE_UNDEFINED] = "undefined";
  types[TYPE_NULL] = "null";
  types[TYPE_TRUE] = "boolean";
  types[TYPE_FALSE] = "boolean";
  types[TYPE_NAN] = "number";
  types[TYPE_PLUS_INFINITY] = "number";
  types[TYPE_MINUS_INFINITY] = "number";
  types[TYPE_NUMBER] = "number";
  types[TYPE_STRING] = "string";

  var names = {};
  names[TYPE_TRUE] = "true";
  names[TYPE_FALSE] = "false";
  names[TYPE_NAN] = "NaN";
  names[TYPE_PLUS_INFINITY] = "Infinity";
  names[TYPE_MINUS_INFINITY] = "-Infinity";

  this.hello = function(enviroment)
  {
    var ret = ["ul"];
    var prop = "";
    var prop_dict =
    {
      "stpVersion": ui_strings.S_TEXT_ENVIRONMENT_PROTOCOL_VERSION,
      "coreVersion": "Core Version",
      "operatingSystem": ui_strings.S_TEXT_ENVIRONMENT_OPERATING_SYSTEM,
      "platform": ui_strings.S_TEXT_ENVIRONMENT_PLATFORM,
      "userAgent": ui_strings.S_TEXT_ENVIRONMENT_USER_AGENT
    }
    for( prop in prop_dict)
    {
      ret[ret.length] = ["li", prop_dict[prop] + ": " + enviroment[prop]];
    }
    if( ini.revision_number.indexOf("$") != -1 && ini.mercurial_revision )
    {
      ini.revision_number = ini.mercurial_revision;
    }
    ret[ret.length] = ["li", ui_strings.S_TEXT_ENVIRONMENT_DRAGONFLY_VERSION + ": " + ini.dragonfly_version];
    ret[ret.length] = ["li", ui_strings.S_TEXT_ENVIRONMENT_REVISION_NUMBER + ": " + ini.revision_number];
    ret.push("class", "selectable");
    return ["div", ret, "class", "padding"];
  }

  this.runtime_dropdown = function(runtimes)
  {
    return runtimes.map(this.runtime, this);
  }

  this.runtime = function(runtime)
  {
    var option = ["cst-option", runtime.title, "rt-id", String(runtime.id)];
    if (runtime.title_attr)
      option.push("title", runtime.title_attr);
    var ret = [option];
    if (runtime.extensions && runtime.extensions.length)
      ret.push(["cst-group", runtime.extensions.map(this.runtime, this)]);
    return ret;
  }

  this.script_dropdown = function(select_id, runtimes, stopped_script_id, selected_script_id)
  {
    var option_list = this.script_dropdown_options(select_id,
                                                   runtimes,
                                                   stopped_script_id,
                                                   selected_script_id);
    return [["div",
              ["div",
                ["input", "type", "text",
                          "handler", select_id + "-filter",
                          "shortcuts", select_id + "-filter",
                          "class", "js-dd-filter"],
                "class", "js-dd-filter-container"],
                ["span", "class", "js-dd-clear-filter",
                         "handler", "js-dd-clear-filter"],
              "class", "js-dd-filter-bar"],
            option_list];
  };

  this.script_dropdown_options = function(select_id, runtimes, stopped_script_id,
                                          selected_script_id, search_term)
  {
    var script_list = ["div"];
    if (runtimes && runtimes.length)
    {
      for (var i = 0, rt; rt = runtimes[i]; i++)
      {
        script_list.push(this.runtime_script(rt, stopped_script_id,
                                             selected_script_id, search_term));
      }
    }
    script_list.push("class", "js-dd-script-list",
                     "handler", "js-dd-move-highlight");
    return script_list;
  };

  this.runtime_script = function(runtime, stopped_script_id,
                                 selected_script_id, search_term)
  {
    // search_term only applies to .js-dd-s-scope
    var ret = [];
    var script_uri_paths = new HashMap();
    var inline_and_evals = [];
    var title = ["cst-title", runtime.title];
    var class_name = runtime.type == "extension"
                   ? "js-dd-ext-runtime"
                   : "js-dd-runtime";

    title.push("class", class_name + (runtime.selected ? " selected-runtime" : ""));

    if (runtime.title != runtime.uri)
      title.push("title", runtime.uri);

    runtime.scripts.forEach(function(script)
    {
      var ret_script = this.script_option(script,
                                          stopped_script_id,
                                          selected_script_id,
                                          search_term);
      if (ret_script)
      {
        if (script.script_type === "linked")
        {
          var root_uri = this._uri_path(runtime, script, search_term);
          if (script_uri_paths[root_uri])
            script_uri_paths[root_uri].push(ret_script);
          else
            script_uri_paths[root_uri] = [ret_script];
        }
        else
          inline_and_evals.push(ret_script);
      }

    }, this);

    var script_list = [];
    Object.getOwnPropertyNames(script_uri_paths).sort().forEach(function(uri)
    {
      var group = ["div"];
      if (uri != "./")
        group.push(["cst-title", uri, "class", "js-dd-dir-path"]);

      group.extend(script_uri_paths[uri]);
      group.push("class", "js-dd-group js-dd-s-scope");
      ret.push(group);
    });

    if (inline_and_evals.length)
    {
      if (runtime.type == "extension")
      {
        ret.push(["div", inline_and_evals, "class", "js-dd-group js-dd-s-scope"]);
      }
      else
      {
        var group = ["div"];
        group.push(["cst-title",
                      ui_strings.S_SCRIPT_SELECT_SECTION_INLINE_AND_EVALS,
                      "class", "js-dd-dir-path"]);

        group.extend(inline_and_evals);
        group.push("class", "js-dd-group");
        ret.push(group);
      }
    }

    if (runtime.type != "extension")
    {
      if (runtime.browser_js || (runtime.user_js_s && runtime.user_js_s.length))
      {
        var scripts = [];
        var sc_op = null;
        if (runtime.browser_js)
        {
          sc_op = this.script_option(runtime.browser_js, stopped_script_id,
                                     selected_script_id, search_term);
          if (sc_op)
            scripts.push(sc_op);
        }

        if (runtime.user_js_s)
        {
          for (var i = 0, script; script = runtime.user_js_s[i]; i++)
          {
            sc_op = this.script_option(script, stopped_script_id,
                                       selected_script_id, search_term)
            if (sc_op)
              scripts.push(sc_op);
          }
        }

        if (scripts.length)
        {
          ret.push(["div",
                     ["cst-title",
                        ui_strings.S_SCRIPT_SELECT_SECTION_BROWSER_AND_USER_JS,
                        "class", "js-dd-dir-path"],
                     ["div", scripts, "class", "js-dd-s-scope"],
                     "class", "js-dd-group"]);
        }
      }

      if (runtime.extensions)
      {
        for (var i = 0, rt; rt = runtime.extensions[i]; i++)
        {
          var ext_scripts = this.runtime_script(rt, stopped_script_id,
                                                selected_script_id, search_term)
          if (ext_scripts.length)
            ret.push(ext_scripts);
        }
      }
    }

    if (ret.length)
      ret.unshift(title);

    return ret;
  }

  this._uri_path = function(runtime, script, search_term)
  {
    var uri_path = script.abs_dir;

    if (script.abs_dir.indexOf(runtime.abs_dir) == 0 &&
        (!search_term || !runtime.abs_dir.contains(search_term)))
      uri_path = "./" + script.abs_dir.slice(runtime.abs_dir.length);
    else if (script.origin == runtime.origin &&
             (!search_term || !(script.origin.contains(search_term))))
      uri_path = script.dir_pathname;

    return uri_path;
  };

  // script types in the protocol:
  // "inline", "event", "linked", "timeout",
  // "java", "generated", "unknown"
  // "Greasemonkey JS", "Browser JS", "User JS", "Extension JS"
  this._script_type_map =
  {
    "inline": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_INLINE,
    "linked": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_LINKED,
    "unknown": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_UNKNOWN
  };

  this.script_option = function(script, stopped_script_id,
                                selected_script_id, search_term)
  {
    var script_type = this._script_type_map[script.script_type] ||
                      script.script_type;
    var ret = null;

    if (search_term &&
        !((script.uri && script.uri.toLowerCase().contains(search_term)) ||
          (!script.uri && script_type.toLowerCase().contains(search_term))))
      return ret;

    if (script.uri)
    {
      var is_linked = script.script_type == "linked";
      ret = ["cst-option",
              ["span",
                 script.filename || script.uri,
                 "data-tooltip", is_linked && "js-script-select",
                 "data-tooltip-text", is_linked && script.uri]];

      if (script.search)
        ret.push(["span", script.search, "class", "js-dd-scr-query"]);

      if (script.hash)
        ret.push(["span", script.query, "class", "js-dd-scr-hash"]);

      ret.push("script-id", script.script_id.toString());
    }
    else
    {
      var code_snippet = script.script_data.slice(0, 360)
                               .replace(/\s+/g, " ").slice(0, 120);
      ret = ["cst-option",
              ["span", script_type.capitalize(true), "class", "js-dd-s-scope"],
              " – ",
              ["code", code_snippet, "class", "code-snippet"],
              "script-id", script.script_id.toString()];
    }

    var class_name = script.script_id == selected_script_id
                   ? "selected"
                   : "";

    if (stopped_script_id == script.script_id)
      class_name += (class_name ? " " : "") + "stopped";

    if (class_name)
      ret.push("class", class_name);

    return ret;
  };

  this.runtime_dom = function(runtime)
  {
    var display_uri = runtime["title"] || helpers.shortenURI(runtime.uri).uri;
    return (
    [
      "cst-option",
       runtime["title"] || runtime.uri,
      "runtime-id", runtime.runtime_id.toString()
    ].concat( dom_data.getDataRuntimeId() == runtime.runtime_id ? ["class", "selected"] : [] ).
      concat( display_uri != runtime.uri ? ["title", runtime.uri] : [] ) )
  }

  this.frame = function(frame, is_top)
  {
    // Fall back to document URI if it's inline
    var uri = frame.script_id && runtimes.getScript(frame.script_id)
            ? (runtimes.getScript(frame.script_id).uri || runtimes.getRuntime(frame.rt_id).uri)
            : null;
    return ["li",
             ["span", frame.fn_name, "class", "scope-name"],
             ["span",
              " " + (uri && frame.line ? helpers.basename(uri) + ":" + frame.line : ""),
              "class", "file-line"],
      "handler", "show-frame",
      "ref-id", String(frame.id),
      "title", uri
    ].concat( is_top ? ["class", "selected"] : [] );
  }

  this.return_values = function(return_values, search_term)
  {
    return (
      ["ol",
        return_values.return_value_list.map(function(retval) {
          return this.return_value(retval,
                                   return_values.rt_id,
                                   search_term);
        }, this),
       "class", "return-values"
      ]
    );
  };

  this.return_value = function(retval, rt_id, search_term)
  {
    var value_template = [];
    var value = "";
    var type = types[retval.value.type];
    switch (retval.value.type)
    {
    case TYPE_UNDEFINED:
    case TYPE_NULL:
      if (type.toLowerCase().contains(search_term))
      {
        value_template.push(
          ["item",
            ["value",
              type,
             "class", type
            ]
          ]
        );
      }
      break;

    case TYPE_TRUE:
    case TYPE_FALSE:
    case TYPE_NAN:
    case TYPE_PLUS_INFINITY:
    case TYPE_MINUS_INFINITY:
    case TYPE_NUMBER:
      value = (retval.value.type == TYPE_NUMBER)
            ? String(retval.value.number)
            : names[retval.value.type];
      if (value.toLowerCase().contains(search_term))
      {
        value_template.push(
          ["item",
            ["value",
              value
            ],
           "class", type
          ]
        );
      }
      break;

    case TYPE_STRING:
      value = retval.value.str;
      if (value.toLowerCase().contains(search_term))
      {
        var short_value = value.length > STRING_MAX_VALUE_LENGTH
                        ? value.slice(0, STRING_MAX_VALUE_LENGTH) + "…"
                        : null;
        if (short_value)
        {
          value_template.push(
            ["item",
              ["input",
               "type", "button",
               "handler", "expand-value",
               "class", "folder-key"
              ],
              ["value",
                "\"" + short_value + "\"",
               "class", type,
               "data-value", "\"" + value + "\"",
              ]
            ]
          );
        }
        else
        {
          value_template.push(
            ["item",
              ["value",
                "\"" + value + "\"",
               "class", type
              ]
            ]
          );
        }
      }
      break;

    case TYPE_OBJECT:
      var object = retval.value.object;
      var name = object.className === "Function" && !object.functionName
               ? ui_strings.S_ANONYMOUS_FUNCTION_NAME
               : object.functionName;
      value = window.templates.inspected_js_object(retval.value.model, true, null, search_term);
      if (value !== "")
        value_template.push(value);
      break;
    }

    var object = retval.functionFrom;
    var function_name = object.functionName || ui_strings.S_ANONYMOUS_FUNCTION_NAME;
    var func_model = window.inspections.get_object(object.objectID) ||
                     new cls.InspectableJSObject(rt_id,
                                                 object.objectID,
                                                 function_name,
                                                 object.className,
                                                 null,
                                                 null,
                                                 true);
    var func_search_term = value_template.length ? null : search_term;
    var func = window.templates.inspected_js_object(func_model, true, null, func_search_term);

    // If there is no function or value, don't show anything
    if (func === "" && !value_template.length)
      return [];

    var from_uri = window.helpers.get_script_name(retval.positionFrom.scriptID);
    from_uri = from_uri ? new URI(from_uri).basename : ui_strings.S_UNKNOWN_SCRIPT;
    var to_uri = window.helpers.get_script_name(retval.positionTo.scriptID);
    to_uri = to_uri ? new URI(to_uri).basename : ui_strings.S_UNKNOWN_SCRIPT;

    return [
      ["li",
        ["div",
          ["div",
           "class", "return-value-arrow return-value-arrow-from",
           "handler", "goto-script-line",
           "data-tooltip", "return-value-tooltip",
           "data-tooltip-text", ui_strings.S_RETURN_VALUES_FUNCTION_FROM
                                          .replace("%s", from_uri)
                                          .replace("%s", retval.positionFrom.lineNumber),
           "data-script-id", String(retval.positionFrom.scriptID),
           "data-script-line", String(retval.positionFrom.lineNumber)
          ],
          [func],
         "class", "return-function-from"
        ],
        (value_template.length
        ? ["div",
            ["div",
              ["div",
               "class", "return-value-arrow-to",
               "data-tooltip", "return-value-tooltip",
               "data-tooltip-text", ui_strings.S_RETURN_VALUES_FUNCTION_TO
                                              .replace("%s", to_uri)
                                              .replace("%s", retval.positionTo.lineNumber)
              ],
             "class", "return-value-arrow",
             "handler", "goto-script-line",
             "data-script-id", String(retval.positionTo.scriptID),
             "data-script-line", String(retval.positionTo.lineNumber)
            ],
            value_template,
           "class", "return-value"
          ]
        : [])
      ]
    ];
  };

  this.configStopAt = function(config)
  {
    var ret =["ul"];
    var arr = ["script", "exception", "error", "abort"], n="", i=0;
    for( ; n = arr[i]; i++)
    {
      ret[ret.length] = this.checkbox(n, config[n]);
    }
    return ["div"].concat([ret]);
  }

  this.breakpoint = function(line_nr, top)
  {
    return ["li",
          "class", "breakpoint",
          "line_nr", line_nr,
          "style", "top:"+ top +"px"
        ]
  }

  this.breadcrumb = function(model, obj_id, parent_node_chain, target_id, show_combinator)
  {
    var setting = window.settings.dom;
    var css_path = model._get_css_path(obj_id, parent_node_chain,
                                       setting.get("force-lowercase"),
                                       setting.get("show-id_and_classes-in-breadcrumb"),
                                       setting.get("show-siblings-in-breadcrumb"));
    var ret = [];
    target_id || (target_id = obj_id)
    if (css_path)
    {
      for (var i = 0; i < css_path.length; i++ )
      {
        ret[ret.length] =
        [
          "breadcrumb", css_path[i].name,
          "ref-id", css_path[i].id.toString(),
          "handler", "breadcrumb-link",
          "data-menu", "breadcrumb",
          "class", (css_path[i].is_parent_offset ? "parent-offset" : "") +
                   (css_path[i].id == target_id ? " active" : ""),
        ];
        if (show_combinator)
        {
          ret[ret.length] = " " + css_path[i].combinator + " ";
        }
      }
    }
    return ret;
  }

  this.uiLangOptions = function(lang_dict)
  {
    var dict =
    [
      {
        browserLanguge: "be",
        key: "be",
        name: "Беларуская"
      },
      {
        browserLanguge: "bg",
        key: "bg",
        name: "Български"
      },
      {
        browserLanguge: "cs",
        key: "cs",
        name: "Česky"
      },
      {
        browserLanguge: "de",
        key: "de",
        name: "Deutsch"
      },
      {
        browserLanguge: "en",
        key: "en",
        name: "U.S. English"
      },
      {
        browserLanguge: "en-GB",
        key: "en-GB",
        name: "British English"
      },
      {
        browserLanguge: "es-ES",
        key: "es-ES",
        name: "Español (España)"
      },
      {
        browserLanguge: "es-LA",
        key: "es-LA",
        name: "Español (Latinoamérica)"
      },
      {
        browserLanguge: "et",
        key: "et",
        name: "Eesti keel"
      },
      {
        browserLanguge: "fr",
        key: "fr",
        name: "Français"
      },
      {
        browserLanguge: "fr-CA",
        key: "fr-CA",
        name: "Français Canadien"
      },
      {
        browserLanguge: "fy",
        key: "fy",
        name: "Frysk"
      },
      {
        browserLanguge: "gd",
        key: "gd",
        name: "Gàidhlig"
      },
      {
        browserLanguge: "hu",
        key: "hu",
        name: "Magyar"
      },
      {
        browserLanguge: "id",
        key: "id",
        name: "Bahasa Indonesia"
      },
      {
        browserLanguge: "it",
        key: "it",
        name: "Italiano"
      },
      {
        browserLanguge: "ja",
        key: "ja",
        name: "日本語"
      },
      {
        browserLanguge: "ka",
        key: "ka",
        name: "ქართული"
      },
      {
        browserLanguge: "mk",
        key: "mk",
        name: "македонски јазик"
      },
      {
        browserLanguge: "nb",
        key: "nb",
        name: "Norsk bokmål"
      },
      {
        browserLanguge: "nl",
        key: "nl",
        name: "Nederlands"
      },
      {
        browserLanguge: "nn",
        key: "nn",
        name: "Norsk nynorsk"
      },
      {
        browserLanguge: "pl",
        key: "pl",
        name: "Polski"
      },
      {
        browserLanguge: "pt",
        key: "pt",
        name: "Português"
      },
      {
        browserLanguge: "pt-BR",
        key: "pt-BR",
        name: "Português (Brasil)"
      },
      {
        browserLanguge: "ro",
        key: "ro",
        name: "Română"
      },
      {
        browserLanguge: "ru",
        key: "ru",
        name: "Русский язык"
      },
      {
        browserLanguge: "sk",
        key: "sk",
        name: "Slovenčina"
      },
      {
        browserLanguge: "sr",
        key: "sr",
        name: "српски"
      },
      {
        browserLanguge: "sv",
        key: "sv",
        name: "Svenska"
      },
      {
        browserLanguge: "tr",
        key: "tr",
        name: "Türkçe"
      },
      {
        browserLanguge: "uk",
        key: "uk",
        name: "Українська"
      },
      {
        browserLanguge: "zh-cn",
        key: "zh-cn",
        name: "简体中文"
      },
      {
        browserLanguge: "zh-tw",
        key: "zh-tw",
        name: "繁體中文"
      }
    ],
    lang = null,
    i = 0,
    selected_lang = window.ui_strings.lang_code,
    ret = [];

    for( ; lang = dict[i]; i++)
    {
      ret[ret.length] = ["option", lang.name, "value", lang.key].
        concat(selected_lang == lang.key ? ["selected", "selected"] : []);
    }
    return ret;
  }

}).apply(window.templates || (window.templates = {}));
