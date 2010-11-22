window.cls = window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */

cls.ReplView = function(id, name, container_class, html, default_handler) {
  this._resolver = new cls.PropertyFinder();
  this._data = new cls.ReplData(this);
  this._service = new cls.ReplService(this, this._data);
  this._linelist = null;
  this._textarea = null;
  this._lastupdate = null;
  this._current_input = "";
  this._current_scroll = null;
  this._container = null;
  this._backlog_index = -1;
  this._input_row_height = null;
  this._toolbar_visibility = null;
  this._recent_autocompletion = null;
  this._autocompletion_index = null;
  this._autocompletion_elem = null;
  this._autocompletion_scope = null;
  this._use_autocomplete_highlight = true; // fixme: turn this in to a setting
  this._textarea_handler = null;
  this._closed_group_nesting_level = 0;
  this._keywords = ["break", "case", "catch", "continue", "debugger",
      "default", "delete", "do", "else", "finally", "for", "function",
      "if", "in", "instanceof", "new", "return", "switch", "this",
      "throw", "try", "typeof", "var", "void", "while", "with"];
  this._actionbroker = ActionBroker.get_instance();
  this.mode = "single-line-edit";

  this.ondestroy = function()
  {
    this._lastupdate = 0;
    this._backlog_index = -1;
    this._current_input = this._textarea.value;
    this._container.removeEventListener("scroll", this._save_scroll_bound, false);
  };

  this._create_structure = function(container)
  {
    container.clearAndRender(templates.repl_main());
    this._linelist = container.querySelector("ol");
    this._textarea = container.querySelector("textarea");
    this._textarea_handler = new cls.BufferManager(this._textarea);
    this._textarea.value = this._current_input;
    this._container = container;
    this._input_row_height = this._textarea.scrollHeight;
    this._closed_group_nesting_level = 0;
    this._textarea.addEventListener("input", this._handle_input_bound, false);
  }

  this._init_scroll_handling = function()
  {
      var padder = this._container.querySelector(".padding");
      // defer adding listeners until after update
      this._container.addEventListener("scroll", this._save_scroll_bound, false);
      padder.addEventListener("DOMAttrModified", this._update_scroll_bound, false);
      padder.addEventListener("DOMNodeInserted", this._update_scroll_bound, false);

      if(this._current_scroll === null)
      {
        this._container.scrollTop = 999999;
      }
      else
      {
        this._container.scrollTop = this._current_scroll;
      }
  }

  this.createView = function(container)
  {
    var first_update = !this._lastupdate;

    // on first update, render view skeleton stuff
    if (first_update)
    {
      this._create_structure(container);
    }

    // Always render the lines of data
    this._update_runtime_selector_bound();
    this._update();

    // On first update add scroll listeners and update scroll,
    // but after the view was rendered so we don't trigger a
    // flood of events when rendering the backlog.
    if (first_update)
    {
      this._init_scroll_handling();
    }
  };

  this.clear = function()
  {
    this.ondestroy();
  };

  this._update_input_height_bound = function()
  {
    this._textarea.rows = Math.max(1, Math.ceil(this._textarea.scrollHeight / this._input_row_height));
  }.bind(this);

  this._save_scroll_bound = function()
  {
    var at_bottom = (this._container.scrollTop + this._container.offsetHeight >= this._container.scrollHeight);
    this._current_scroll = at_bottom ? null : this._container.scrollTop;
  }.bind(this);

  this._update_scroll_bound = function()
  {
    if (this._current_scroll === null)
    {
      this._container.scrollTop = 9999999;
    }
  }.bind(this);

  /**
   * Pulls all the available, non-rendered, events from the data
   * object and renders them
   */
  this._update = function()
  {
    var entries = this._data.get_log(this._lastupdate);

    if (entries.length) { this._lastupdate = entries[entries.length -1].time; }
    for (var n=0, e; e=entries[n]; n++)
    {
      switch(e.type) { // free like a flying demon
        case "input":
          this._render_input(e.data);
          break;
        case "string":
          this._render_string(e.data);
          break;
        case "exception":
          this._render_error(e.data);
          break;
        case "iobj":
          this._render_inspectable_object(e.data);
          break;
        case "iele":
          this._render_inspectable_element(e.data);
          break;
        case "pobj":
          this._render_pointer_to_object(e.data);
          break;
        case "valuelist":
          this._render_value_list(e.data);
          break;
        case "trace":
          this._render_trace(e.data);
          break;
        case "groupstart":
          this._render_groupstart(e.data);
          break;
        case "groupend":
          this._render_groupend();
          break;
        case "count":
          this._render_count(e.data);
          break;
        case "completion":
          this._render_completion(e.data);
          break;
      default:
          this._render_string("unknown");
      }
    }
  };

  this._render_count = function(data)
  {
    this._render_string((data.label ? data.label + ": " : "") + data.count);
  };

  this._render_groupstart = function(data)
  {
    if (this._closed_group_nesting_level) {
      // don't do anything if we're in a closed group
      this._closed_group_nesting_level++;
      return;
    }
    else if (data.collapsed)
    {
      // if not nested but this group is closed, render the button for it
      this._closed_group_nesting_level++;
    }

    this._add_line(templates.repl_group_line(data));
    var ol = document.createElement("ol");
    ol.className="repl-lines";
    this._add_line(ol);

    if (data.collapsed) {
      ol.parentNode.style.display = "none";
    }

    this._linelist = ol;
  };

  this._render_groupend = function()
  {
    this._closed_group_nesting_level--;
    this._closed_group_nesting_level = Math.max(0, this._closed_group_nesting_level);

    if (this._closed_group_nesting_level)
    {
      return;
    }

    if (this._linelist.parentNode.parentNode.nodeName.toLowerCase() == "ol")
    {
      this._linelist = this._linelist.parentNode.parentNode;
    }
  };

  this._render_pointer_to_object = function(data)
  {
    this._add_line(templates.repl_output_pobj(data));
  };

  this._render_inspectable_element = function(data)
  {
    if (!data.view) {
      var rt_id = data.rt_id, obj_id=data.obj_id, name=data.name;
      data.view = new cls.InspectableDomNodeView(rt_id, obj_id, name, false);
    }

    if (data.view && !data.view.expanded)
    {
      // re-enter once we have the data.
      data.view.expand(this._render_inspectable_element.bind(this, data));
      return;
    }

    this._add_line(data.view.render());
  };

  this._render_inspectable_object = function(data)
  {
    if (!data.view) {
      var rt_id = data.rt_id, obj_id=data.obj_id, name=data.name;
      data.view = new cls.InspectableObjectView(rt_id, obj_id, name, false);
    }

    if (data.view && !data.view.expanded)
    {
      // re-enter once we have the data.
      data.view.expand(this._render_inspectable_object.bind(this, data));
      return;
    }

    this._add_line(data.view.render());
  };

  this._render_error = function(data)
  {
    this._render_string(data.message, data.stacktrace);
  };

  this._render_trace = function(data)
  {
    this._add_line("console.trace:");
    this._add_line(templates.repl_output_trace(data));
  };

  this._render_value_list = function(values)
  {
    const SPAN = 1, BRACKET = 2;
    var type = 0;
    var tpl = values.reduce(function(list, value)
    {
      switch (value.df_intern_type)
      {
        case "unpack-header":
          list.push(templates.repl_output_pobj(value), ["span", "["]);
          type = BRACKET;
          break;
        case "unpack-footer":
          if (type == SPAN) { list.pop(); }
          list.push(["span", "]"], ["span", ", "]);
          type = SPAN;
          break;
        default:
          list.push(templates.repl_output_native_or_pobj(value), ["span", ", "]);
          type = SPAN;
      }
      return list;
    }, []);
    tpl.pop();
    this._add_line(tpl);
  };

  this._render_completion = function(s)
  {
    this._add_line(["span", s, "class", "repl-completion"]);
  };

  /**
   * Render a string. Return the element that was rendered.
   */
  this._render_string = function(s)
  {
    return this._add_line(templates.repl_output_native(s));
  };

  /**
   * Render an arbitrary number of string arguments
   */
  this._render_strings = function()
  {
    for (var n=0; n<arguments.length; n++)
    {
      this._render_string(arguments[n]);
    }
  };

  this._render_input = function(str)
  {
    window.simple_js_parser.format_source(str).forEach(function(line, index) {
      this._add_line('<span class="repl-line-marker">' + (index ? "... " : "&gt&gt&gt ") + "</span>" + line);
    }, this);
  };

  this.set_current_input = function(str)
  {
    this._textarea.textContent = str;
  };

  this._add_line = function(elem_or_template)
  {
    var line = document.createElement("li");

    if (elem_or_template.nodeType === undefined)
    {
      line.render(elem_or_template);
    }
    else
    {
      line.appendChild(elem_or_template);
    }
    this._linelist.appendChild(line);
    return line;
  };

  this._handle_input_bound = function(evt)
  {
    if (this.mode == "autocomplete")
    {
      this._recent_autocompletion = null;
      this._be_singleline();
    }

    this._check_for_multiline();
    this._update_input_height_bound();
  }.bind(this);

  /**
   * Apply a (somewhat lame) metric to guess if we should really be in
   * multiline mode.
   */
  this._check_for_multiline = function()
  {
    if (this.mode == "single-line-edit" &&
        this._textarea_handler.get_value().indexOf("\n") != -1)
    {
      this._be_multiline();
    }
  }

  this._handle_backlog = function(delta)
  {
    this._set_input_from_backlog(this._backlog_index + delta);
  };

  this._set_input_from_backlog = function(index)
  {
    if (index <= -1)
    {
      this._backlog_index = -1;
      this._textarea.value = this._current_input;
      return;
    }

    if (this._backlog_index == -1)
    {
      this._current_input = this._textarea.value;
    }

    var log = this._data.get_typed_history();
    this._backlog_index = Math.min(index, log.length-1);
    var entry = log[this._backlog_index];

    if (entry != undefined)
    {
      this._textarea.value = entry;
    }
  };

  this._commit_selection = function()
  {
    this._update_textarea_value(this._recent_autocompletion[this._autocompletion_index][0]);
    this._be_singleline();
    this._recent_autocompletion = null;
  };

  this._update_textarea_value = function(prop)
  {
    var pos = this._textarea.value
                  .slice(0, this._textarea.selectionStart)
                  .lastIndexOf(this._autocompletion_localpart);
    if (pos != -1)
    {
      var pre = this._textarea.value.slice(0, pos);
      var post = this._textarea.value.slice(this._textarea.selectionStart);
      var line = this._construct_line(pre, prop, post);
      this._textarea.value = line;
      this._textarea_handler.put_cursor(line.length - post.length);
    }
  };

  this._construct_line = function(pre, prop, post)
  {
    // This doesn't cover every allowed character, but should be fine most of the time
    var is_valid_identifier = /^[a-z$_]$|^[a-z$_][a-z$_0-9]/i.test(prop);
    var is_number_without_leading_zero = /^0$|^[1-9][0-9]*$/;
    if ((!is_valid_identifier || this._keywords.indexOf(prop) != -1)
         && this._autocompletion_scope) {
      if (!is_number_without_leading_zero.test(prop))
      {
        prop = '"' + prop + '"';
      }
      pre = pre.slice(0, -1) + "[";
      post = "]" + post;
    }
    return pre + prop + post;
  };

  this._highlight_completion = function(index)
  {
    var sel = window.getSelection();
    sel.collapseToStart();

    // with no arg, clear the selection.
    if (index === null || index === undefined) {
      return;
    }

    var entry = this._recent_autocompletion[this._autocompletion_index];
    var range = document.createRange();
    var ele = this._autocompletion_elem.firstChild; // get TextNode

    range.setStart(ele, entry[1]);
    range.setEnd(ele, entry[2]);

    sel.addRange(range);
  };


  this._on_invoke_completer = function()
  {
    if (this._recent_autocompletion) {
      this.mode = "autocomplete";
    }
    else
    {
      this._handle_completer();
    }
  }

  this._update_highlight = function(direction)
  {
    direction = direction === undefined ? 1 : direction;
    if (!this._use_autocomplete_highlight) { return; }

    this._autocompletion_index += direction;
    if (this._autocompletion_index >= this._recent_autocompletion.length)
    {
      this._autocompletion_index = 0;
    }
    else if (this._autocompletion_index < 0)
    {
      this._autocompletion_index = this._recent_autocompletion.length-1;
    }

    this._highlight_completion(this._autocompletion_index);
  };

  this._handle_completer = function(props)
  {
    if (props)
    {
      var localpart = props.identifier;
      this._autocompletion_localpart = localpart;
      this._autocompletion_scope = props.scope;
      var has_uppercase_letter = /[A-Z]/.test(localpart);
      var matches = props.props.filter(function(candidate) {
        // If only lowercase letters are used, make the autocompletion case-insensitive
        if (!has_uppercase_letter)
        {
            candidate = candidate.toLowerCase();
        }
        return candidate.indexOf(localpart) == 0;
      });

      if (! matches.length) {
        return;
      }

      var match = this._longest_common_prefix(matches.slice(0));
      if (match.length > localpart.length || matches.length == 1)
      {
        this._update_textarea_value(match);
      }
      else
      {
        this._data.add_input(this._textarea.value);
        this._data.add_output_completion(matches.sort(cls.PropertyFinder.prop_sorter).join(", "));
        this.mode = "autocomplete";

        var completions = this._linelist.querySelectorAll(".repl-completion");
        this._autocompletion_elem = completions[completions.length-1];
        this._autocompletion_elem = this._autocompletion_elem.parentNode;


        // the recent autocomplete array contains tuples, (word, start, end)
        // that can be used when selecting a range.
        var offset = 0;
        this._recent_autocompletion = matches.sort(cls.PropertyFinder.prop_sorter).map(function(word) {
          var ret = [word, offset, offset+word.length];
          offset += word.length + 2; // +2 accounts for ", "
          return ret;
        });

        // fixme: this should not rely as much on the inards of the markup
        this._autocompletion_elem = this._autocompletion_elem.firstChild;
        this._autocompletion_index = -1;
        this._update_highlight();
      }
    }
    else
    {
      this._resolver.find_props(this._on_completer.bind(this),
                                this._textarea.value.slice(0, this._textarea.selectionStart),
                                window.stop_at.getSelectedFrame());
    }
  };

  this._on_completer = function(props)
  {
    this._handle_completer(props);
  };

  /**
   * Return the longest common prefix of all the strings in the array
   * of strings. For example ["foobar", "foobaz", "foomatic"] -> "foo"
   */
  this._longest_common_prefix = function(strings)
  {
    if (strings.length == 0)
    {
      return "";
    }
    else if (strings.length == 1)
    {
      return strings[0];
    }
    else
    {
      var sorted = strings.slice(0).sort();
      var first = sorted.shift();
      var last = sorted.pop();

      for (var n=last.length; n; n--)
      {
        if (first.indexOf(last.slice(0,n)) == 0) { return last.slice(0, n); }
      }
    }
    return "";
  };

  this._be_multiline = function()
  {
    this.mode = "multi-line-edit";
    this._textarea.addClass("multiline");
  };

  this._be_singleline = function()
  {
    this.mode = "single-line-edit";
    this._textarea.removeClass("multiline");
  };

  this._handle_repl_frame_select_bound = function(event, target)
  {
    var sourceview = window.views.js_source;
    sourceview.highlight(parseInt(event.srcElement.getAttribute("script-id")),
                         parseInt(event.srcElement.getAttribute("line-number")));

    messages.post("trace-frame-selected", {rt_id: parseInt(target.getAttribute("runtime-id")),
                                           obj_id: parseInt(event.srcElement.getAttribute("scope-variable-object-id")),
                                           this_id: parseInt(event.srcElement.getAttribute("this-object-id")),
                                           arg_id: parseInt(event.srcElement.getAttribute("arguments-object-id"))
                                          }
                 );
  }.bind(this);

  this._handle_repl_toggle_group_bound = function(event, target)
  {
    var group = this._data.get_group(target.getAttribute("group-id"));
    group.collapsed = group.collapsed ? false : true;
    this.clear();
    this.update();
  }.bind(this);

  this._handle_option_change_bound = function(event, target)
  {
    settings.command_line.set('max-typed-history-length', target.value);
    messages.post("setting-changed", {id: "repl", key: "max-typed-history-length"});
  }.bind(this);

  this._handle_input_focus_bound = function()
  {
    this._be_singleline();
  }.bind(this);

  this._handle_input_blur_bound = function()
  {
    this._be_singleline();
    this.mode = "default";
  }.bind(this);

  this._update_runtime_selector_bound = function(msg)
  {
    var is_multi = host_tabs.isMultiRuntime();
    if( this._toolbar_visibility !== is_multi )
    {
      this._toolbar_visibility = is_multi;
      topCell.setTooolbarVisibility('command_line', is_multi);
    }
  }.bind(this);

  this._handle_repl_focus_bound = function()
  {
    if (this._current_scroll === null)
    {
      this._textarea.focus();
    }
  }.bind(this);

  this._new_repl_context_bound = function(msg)
  {
    // This is neccessary so you dont end up with autocomplete data
    // from the previous runtime/frame when tabbing.
    // The current tabbing context doesn't change though. Should not
    // be a problem unless you reload while tabbing or something.
    this._resolver.clear_cache();
  }.bind(this);

  this._handle_action_clear = function(evt, target)
  {
    this.clear();
    var cursor_pos = this._textarea_handler.get_cursor();
    this._data.clear();
    this._textarea_handler.put_cursor(cursor_pos);
    return false;
  };

  this["_handle_action_kill-to-end-of-line"] = function(evt, target)
  {
    this._textarea_handler.kill_to_end_of_line();
    return false;
  };

  this["_handle_action_kill-word-backwards"] = function(evt, target)
  {
    this._textarea_handler.kill_word_backwards();
    return false;
  };

  this["_handle_action_move-to-beginning-of-line"] = function(evt, target)
  {
    this._textarea_handler.move_to_beginning_of_line();
    return false;
  };

  this["_handle_action_move-to-end-of-line"] = function(evt, target)
  {
    this._textarea_handler.move_to_end_of_line();
    return false;
  };

  this["_handle_action_enter-multiline-mode"] = function(evt, target)
  {
    this._be_multiline();
    return false;
  };

  this["_handle_action_exit-multiline-mode"] = function(evt, target)
  {
    this._multiediting = false;
    this._be_singleline();
    return false;
  };

  this["_handle_action_autocomplete"] = function(evt, target)
  {
    this._on_invoke_completer(1);
    return false;
  }

  this["_handle_action_next-completion"] = function(evt, target)
  {
    this._update_highlight(1);
    return false;
  }

  this["_handle_action_prev-completion"] = function(evt, target)
  {
    this._update_highlight(-1);
    return false;
  }

  this["_handle_action_insert-tab-at-point"] = function(evt, target)
  {
    this._textarea_handler.insert_at_point("    ");
    return false;
  }

  this["_handle_action_eval"] = function(evt, target)
  {
    var input = this._textarea.value;
    input = input.trim();
    this._textarea.value = "";
    this._backlog_index = -1;
    this._current_input = "";
    this._resolver.clear_cache(); // evaling js voids the cache.
    this._service.handle_input(input);
    this._be_singleline();
    return false;
  }

  this["_handle_action_commit"] = function(evt, target)
  {
    if (this._use_autocomplete_highlight && this._recent_autocompletion)
    {
      this._highlight_completion();
      this._commit_selection();
      return false;
    }
  };

  this["_handle_action_cancel"] = function(evt, target)
  {
    this._highlight_completion();
    this._recent_autocompletion = null;
    this._be_singleline();
    return false;
  };

  this["_handle_action_backlog-next"] = function(evt, target)
  {
    this._handle_backlog(-1);
    this._update_input_height_bound();
    return false;
  };

  this["_handle_action_backlog-prev"] = function(evt, target)
  {
    this._handle_backlog(+1);
    this._update_input_height_bound();
    return false;
  };

  /**
   * Entry point for the action handling system
   */
  this.handle = function(action, evt, target)
  {
    var handler = this["_handle_action_" + action];
    if (handler)
    {
      return handler.call(this, evt, target);
    }
    else {} // if unhandled actions, add debugging here.
  };

  /**
   * action focus
   */
  this.focus = function()
  {
    this._textarea.focus();
  }

  /**
   * action blur
   */
  this.blur = function()
  {
  }

  /**
   * action blur
   */
  this.onclick = function()
  {
  }

  this.get_action_list = function()
  {
    var actions = [];
    for (var methodname in this)
    {
      if (methodname.indexOf("_handle_action_") == 0)
      {
        actions.push(methodname.slice(15));
      }
    }
    return actions;
  }

  this.mode_labels = {
    "single-line-edit": "Single line editing",
    "multi-line-edit": "Multi line editing",
    "autocomplete": "Autocompleting",
  }

  var eh = window.eventHandlers;
  eh.click["repl-toggle-group"] = this._handle_repl_toggle_group_bound;
  eh.click["select-trace-frame"] = this._handle_repl_frame_select_bound;
  eh.click["repl-focus"] = this._handle_repl_focus_bound;
  eh.change['set-typed-history-length'] = this._handle_option_change_bound;
  eh.focus["repl-textarea"] = this._handle_input_focus_bound;
  eh.blur["repl-textarea"] = this._handle_input_blur_bound;
  messages.addListener('active-tab', this._update_runtime_selector_bound);
  messages.addListener('new-top-runtime', this._new_repl_context_bound);
  messages.addListener('debug-context-selected', this._new_repl_context_bound);
  messages.addListener('frame-selected', this._new_repl_context_bound);

  this.init(id, name, container_class, html, default_handler);
  // Happens after base class init or else the call to .update that happens in
  // when adding stuff to data will fail.
  var hostinfo =  window.services['scope'].get_hello_message();
  this._data.add_message(hostinfo.userAgent + " (Core " + hostinfo.coreVersion + ")");
  ui_strings.S_REPL_WELCOME_TEXT.split("\n").forEach(function(s) {
    this._data.add_message(s);
  }, this);

  this._actionbroker.register_handler(this);

};
cls.ReplView.prototype = ViewBase;


cls.ReplView.create_ui_widgets = function()
{

  new Settings(
    'command_line',
    { // key/value
      'max-typed-history-length': 32,
      'typed-history': [],
      'unpack-list-alikes': true,
      'is-element-type-sensitive': true
    },
    { // key/label
      'max-typed-history-length': ui_strings.S_LABEL_REPL_BACKLOG_LENGTH,
      'unpack-list-alikes': ui_strings.S_SWITCH_UNPACK_LIST_ALIKES,
      'is-element-type-sensitive': ui_strings.S_SWITCH_IS_ELEMENT_SENSITIVE
    },
    { // settings map
      checkboxes:
      [
        'unpack-list-alikes',
        'is-element-type-sensitive'
      ],
      customSettings:
      [
        'max-typed-history-length'
      ]
    },
    {  // custom templates
      'max-typed-history-length':
      function(setting)
      {
        return (
        [
          'setting-composite',
          ['label',
           setting.label_map['max-typed-history-length'] + ': ',
           ['input',
            'type', 'number',
            'handler', 'set-typed-history-length',
            'max', '1000',
            'min', '0',
            'value', setting.get('max-typed-history-length')
           ]
          ]
        ]);
      }
    }
  );

  new ToolbarConfig
  (
    'command_line',
    null,
    null,
    null,
    [
      {
        handler: 'select-window',
        title: ui_strings.S_BUTTON_LABEL_SELECT_WINDOW,
        type: 'dropdown',
        class: 'window-select-dropdown',
        template: window['cst-selects']['cmd-runtime-select'].getTemplate()
      }
    ]
  );
};
