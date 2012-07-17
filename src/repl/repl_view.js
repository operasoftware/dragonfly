window.cls = window.cls || {};

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
  this._prev_frame_index = null;
  this._closed_group_nesting_level = 0;
  this._actionbroker = ActionBroker.get_instance();
  this.mode = "single-line-edit";
  this.window_header = false;
  this.window_statusbar = false;
  this.window_type = UIWindow.HUD;
  this._delay_update = true;
  this._last_scroll = 0;

  const RENDER_DELAY = 20;

  this.ondestroy = function()
  {
    if (this._update_timeout)
      clearTimeout(this._update_timeout);

    if (this._container)
    {
      this._last_scroll = this._container.scrollTop;
      this._linelist = null;
      this._lastupdate = 0;
      this._backlog_index = -1;
      this._current_input = this._textarea.value;
      this._container.removeEventListener("scroll", this._save_scroll_bound, false);
      this._delay_update = true;
    }
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
    // defer adding listeners until after update
    this._container.addEventListener("scroll", this._save_scroll_bound, false);

    if (this._current_scroll === null)
      this._container.scrollTop = 999999;
    else
      this._container.scrollTop = this._current_scroll;
  }

  this.createView = function(container)
  {
    var first_update = !this._linelist;
    // on first update, render view skeleton stuff
    if (first_update)
      this._create_structure(container);

    // Always render the lines of data
    this._update_runtime_selector_bound();

    if (this._update_timeout)
      clearTimeout(this._update_timeout);

    if (this._delay_update)
    {
      this._update_timeout = setTimeout(this._update_bound, RENDER_DELAY);
    }
    else
    {
      this._update();
      this._delay_update = true;
    }

    // On first update add scroll listeners and update scroll,
    // but after the view was rendered so we don't trigger a
    // flood of events when rendering the backlog.
    if (first_update)
    {
      this._init_scroll_handling();
    }
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

  this.clear = function()
  {
    this._cancel_completion();
    this.ondestroy();
  };

  this.show_help = function()
  {
    opera.postError("fixme: implement help function and split into help/commands")
  };

  this.do_not_queue_next_update = function()
  {
    this._delay_update = false;
  };

  this._update_input_height_bound = function()
  {
    this._textarea.rows = Math.max(1, Math.floor(this._textarea.scrollHeight / this._input_row_height));
    if (this._textarea.selectionStart == this._textarea.value.length)
      this._update_scroll_bound();

  }.bind(this);

  this._save_scroll_bound = function()
  {
    var at_bottom = (this._container.scrollTop + this._container.offsetHeight >= this._container.scrollHeight);
    this._current_scroll = at_bottom ? null : this._container.scrollTop;
  }.bind(this);

  this._update_scroll_bound = function()
  {
    if (this._last_scroll)
    {
      this._container.scrollTop = this._last_scroll;
      this._last_scroll = 0;
    }
    else if (this._current_scroll === null)
    {
      this._container.scrollTop = 9999999;
    }
  };

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
        case "pobj":
          this._render_pointer_to_object(e.data);
          break;
        case "valuelist":
          this._render_value_list(e);
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
        case "errorlog":
          this._render_errorlog(e.data);
          break;
      default:
          this._render_string("unknown");
      }
    }

    this._update_scroll_bound();
  };

  this._update_bound = this._update.bind(this);

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

  this._render_error = function(data)
  {
    this._render_string(data.message, data.stacktrace);
  };

  this._render_trace = function(data)
  {
    this._add_line(ui_strings.S_CONSOLE_TRACE_LABEL);
    this._add_line(templates.repl_output_trace(data));
  };

  this._render_value_list = function(entry)
  {
    var values = entry.data;
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

    if (entry.pos)
    {
      tpl = [templates.repl_output_location_link(entry.pos.scriptid, entry.pos.scriptline), tpl];
    }
    var severity = entry.severity != null
                 ? "severity-" + ["log", "debug", "info", "warn", "error"][entry.severity-1]
                 : "";
    this._add_line(tpl, severity);
  };

  this._render_completion = function(s, do_not_queue)
  {
    this._add_line(["span", s, "class", "repl-completion"], null, do_not_queue);
  };

  this._render_errorlog = function(s) {
    if (settings.command_line.get('show-js-errors-in-repl'))
    {
      this._render_string(s);
    }
  }

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
      this._add_line('<span class="repl-line-marker">' +
                       (index ? "... " : "&gt;&gt;&gt; ") +
                     "</span>" + line);
    }, this);
  };

  this.set_current_input = function(str)
  {
    this._textarea.textContent = str;
  };

  this._add_line = function(elem_or_template, class_name)
  {
    var line = document.createElement("li");
    if (class_name)
    {
      line.className = class_name;
    }

    if (elem_or_template.nodeType === undefined)
    {
      line.render(elem_or_template);
    }
    else
    {
      line.appendChild(elem_or_template);
    }

    if (this._linelist)
      this._linelist.appendChild(line);

    return line;
  };

  this._handle_input_bound = function(evt)
  {
    if (this.mode == "autocomplete")
    {
      this._cancel_completion();
    }
    if (this._check_for_multiline())
    {
      this._be_multiline();
    }
    this._update_input_height_bound();
  }.bind(this);

  /**
   * Apply a (somewhat lame) metric to guess if we should really be in
   * multiline mode.
   */
  this._check_for_multiline = function()
  {
    return this._textarea_handler.get_value().contains("\n")
  }

  this._handle_backlog = function(delta)
  {
    var new_index = this._backlog_index + delta;
    if (delta == 1 && new_index == 0) { // started navigating back from current input
      this._current_input = this._textarea.value;
    }
    this._set_input_from_backlog(new_index);
  };

  this._set_input_from_backlog = function(index)
  {
    if (index <= -1)
    {
      this._backlog_index = -1;
      this._textarea.value = this._current_input;
      return;
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

  this._update_textarea_value = function(prop, is_partial_completion)
  {
    var pos = this._textarea.value
                  .slice(0, this._textarea.selectionStart)
                  .lastIndexOf(this._autocompletion_localpart);
    if (pos != -1)
    {
      var pre = this._textarea.value.slice(0, pos);
      var post = this._textarea.value.slice(this._textarea.selectionStart);
      var line = this._construct_line(pre, prop, post, is_partial_completion);
      this._textarea.value = line;
      this._textarea_handler.put_cursor(line.length - post.length);
    }
  };

  this._construct_line = function(pre, prop, post, is_partial_completion)
  {
    var is_number_without_leading_zero = /^0$|^[1-9][0-9]*$/;
    if (!is_partial_completion &&
        !JSSyntax.is_valid_identifier(prop) &&
        this._autocompletion_scope)
    {
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
    if (!(this._linelist && this._textarea))
      return;

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
        return candidate.startswith(localpart);
      });

      if (! matches.length) {
        return;
      }

      var match = this._longest_common_prefix(matches.slice(0));
      if (match.length > localpart.length || matches.length == 1)
      {
        var is_partial_completion = match.length > localpart.length &&
                                    matches.length !== 1;
        this._update_textarea_value(match, is_partial_completion);
      }
      else
      {
        this._data.add_input(this._textarea.value, true);
        this._data.add_output_completion(matches.sort(cls.PropertyFinder.prop_sorter).join(", "),
                                         true);
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
        this._textarea.focus();
      }
    }
    else
    {
      var current_selection = this._service.get_selected_objects();
      var context = {};
      for (var n=0; n<current_selection.length; n++)
      {
        context["$" + n] = current_selection[n];
      }

      this._resolver.find_props(this._on_completer.bind(this),
                                this._textarea.value.slice(0, this._textarea.selectionStart),
                                window.stop_at.getSelectedFrame(), context);
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
        if (first.startswith(last.slice(0, n))) { return last.slice(0, n); }
      }
    }
    return "";
  };

  this._be_multiline = function()
  {
    this.mode = "multi-line-edit";
    this._textarea.addClass("multiline");
    this._textarea.focus();
  };

  this._be_singleline = function()
  {
    if (this.mode == "autocomplete")
    {
      this._resolver.clear_cache();
      this._highlight_completion();
      this._recent_autocompletion = null;
    }
    this.mode = "single-line-edit";
    if (this._textarea)
    {
      this._textarea.removeClass("multiline");
      this._textarea.rows = "1";
      this._textarea.focus();
    }
  };

  this._cancel_completion = function()
  {
    if (this.mode == "autocomplete")
    {
      this._be_singleline();
    }
  }

  this._handle_repl_frame_select_bound = function(event, target)
  {
    if (event.target.getAttribute("data-script-id") == null)
    {
      return;
    }
    var sourceview = window.views.js_source;
    sourceview.highlight(parseInt(event.target.getAttribute("data-script-id")),
                         parseInt(event.target.getAttribute("data-line-number")));

    messages.post("trace-frame-selected", {rt_id: parseInt(target.getAttribute("runtime-id")),
                                           obj_id: parseInt(event.target.getAttribute("data-scope-variable-object-id")),
                                           this_id: parseInt(event.target.getAttribute("data-this-object-id")),
                                           arg_id: parseInt(event.target.getAttribute("data-arguments-object-id"))
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

  this._update_runtime_selector_bound = function(msg)
  {
    var is_multi = host_tabs.isMultiRuntime();
    if( this._toolbar_visibility !== is_multi )
    {
      this._toolbar_visibility = is_multi;
      topCell.setTooolbarVisibility('command_line', is_multi);
    }
  }.bind(this);

  this._new_repl_context_bound = function(msg)
  {
    // This is neccessary so you dont end up with autocomplete data
    // from the previous runtime/frame when tabbing.
    // The current tabbing context doesn't change though. Should not
    // be a problem unless you reload while tabbing or something.
    if (msg.type == "frame-selected")
    {
      if (msg.frame_index == this._prev_frame_index)
      {
        return; // do nothing if there's no new frame index.
      }
      else
      {
        this._prev_frame_index = msg.frame_index;
      }
    }
    this._cancel_completion();
  }.bind(this);

  this._on_profile_disabled_bound = function(msg)
  {
    if (msg.profile == window.app.profiles.DEFAULT)
    {
      this.ondestroy();
      this._toolbar_visibility = false;
      topCell.setTooolbarVisibility("command_line", false);
    }
  }.bind(this);

  this["_handle_action_clear"] = function(evt, target)
  {
    this.clear();
    var cursor_pos = this._textarea_handler.get_cursor();
    this._data.clear();
    this._textarea.focus();
    this._textarea_handler.put_cursor(cursor_pos);
    return false;
  };

  this["_handle_action_kill-to-end-of-line"] = function(evt, target)
  {
    this._cancel_completion();
    this._textarea_handler.kill_to_end_of_line();
    return false;
  };

  this["_handle_action_kill-to-beginning-of-line"] = function(evt, target)
  {
    this._cancel_completion();
    this._textarea_handler.kill_to_beginning_of_line();
    return false;
  };

  this["_handle_action_kill-word-backwards"] = function(evt, target)
  {
    this._cancel_completion();
    this._textarea_handler.kill_word_backwards();
    return false;
  };

  this["_handle_action_move-to-beginning-of-line"] = function(evt, target)
  {
    this._cancel_completion();
    this._textarea_handler.move_to_beginning_of_line();
    return false;
  };

  this["_handle_action_move-to-end-of-line"] = function(evt, target)
  {
    this._cancel_completion();
    this._textarea_handler.move_to_end_of_line();
    return false;
  };

  this["_handle_action_yank"] = function(evt, target)
  {
    this._cancel_completion();
    this._textarea_handler.yank();
    return false;
  };

  this["_handle_action_enter-multiline-mode"] = function(evt, target)
  {
    this._cancel_completion();
    this._be_multiline();
    return false;
  };

  this["_handle_action_exit-multiline-mode"] = function(evt, target)
  {
    if (!this._check_for_multiline())
    {
      this._multiediting = false;
      this._be_singleline();
    }
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
    this._current_input = "";
    this._backlog_index = -1;
    this._resolver.clear_cache(); // evaling js voids the cache.
    this._service.handle_input(input);
    this._cancel_completion();
    this._be_singleline();
    this._current_scroll = null;
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

  // Same as above, but since the event isn't canceled, whatever
  // character was pressed is added to the input.
  this["_handle_action_commit-and-insert"] = function(evt, target)
  {
    if (this._use_autocomplete_highlight && this._recent_autocompletion)
    {
      this._highlight_completion();
      this._commit_selection();
    }
  };

  this["_handle_action_cancel-completion"] = function(evt, target)
  {
    this._cancel_completion();
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

  this["_handle_action_cancel-input"] = function(evt, target)
  {
    return false;
  }

  this["_handle_action_help"] = function(evt, target)
  {
    this.show_help();
  }

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
    if (this._textarea)
      this._textarea.focus();
  }

  /**
   * action blur
   */
  this.blur = function()
  {
    if (this._textarea)
      this._textarea.blur();
  }

  /**
   * action click
   */
  this.onclick = function(event)
  {
    if (!this._container)
      return;

    if (this._textarea &&
        !/^(?:input|textarea|button)$/i.test(event.target.nodeName) &&
        !event.target.hasTextNodeChild())
    {
      this._textarea.focus();
      this._current_scroll = null;
    }
    else
    {
      this._current_scroll = this._container.scrollTop;
    }
  };

  this.get_action_list = function()
  {
    var actions = [];
    for (var methodname in this)
    {
      if (methodname.startswith("_handle_action_"))
      {
        actions.push(methodname.slice(15));
      }
    }
    return actions;
  }

  this._handle_repl_show_log_entry_source_bound = function(event, target)
  {
    if (window.Tooltips)
      window.Tooltips.hide_tooltip();

    var script_id = Number(target.getAttribute("data-scriptid"));
    var start_line = Number(target.getAttribute("data-scriptline"));
    var end_line = Number(target.getAttribute("data-script-endline"));
    if (window.views.js_source)
      window.views.js_source.show_script(script_id, start_line, end_line);
  }.bind(this);

  this.required_services = ["ecmascript-debugger", "console-logger"];
  this.mode_labels = {
    "single-line-edit": ui_strings.S_LABEL_REPL_MODE_DEFAULT,
    "single-line-edit": ui_strings.S_LABEL_REPL_MODE_SINGLELINE,
    "multi-line-edit":  ui_strings.S_LABEL_REPL_MODE_MULTILINE,
    "autocomplete":  ui_strings.S_LABEL_REPL_MODE_AUTOCOMPLETE,
  }

  var eh = window.eventHandlers;
  eh.click["repl-toggle-group"] = this._handle_repl_toggle_group_bound;
  eh.click["select-trace-frame"] = this._handle_repl_frame_select_bound;
  eh.click["show-log-entry-source"] = this._handle_repl_show_log_entry_source_bound;
  messages.addListener('active-tab', this._update_runtime_selector_bound);
  messages.addListener('new-top-runtime', this._new_repl_context_bound);
  messages.addListener('debug-context-selected', this._new_repl_context_bound);
  messages.addListener('frame-selected', this._new_repl_context_bound);
  messages.addListener("profile-disabled", this._on_profile_disabled_bound);

  this.init(id, name, container_class, html, default_handler);
  // Happens after base class init or else the call to .update that happens in
  // when adding stuff to data will fail.
  var hostinfo =  window.services['scope'].get_hello_message();
  this._data.add_message(hostinfo.userAgent + " (Core " + hostinfo.coreVersion + ")");
  var welcome_text = ui_strings.S_REPL_WELCOME_TEXT
                                             .replace("%(CLEAR_COMMAND)s", "\"clear()\"")
                                             .replace("%(HELP_COMMAND)s", "\"// help()\"");
  welcome_text.split("\n").forEach(function(s) {
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
      'typed-history': [],
      'unpack-list-alikes': true,
      'do-friendly-print': true,
      'is-element-type-sensitive': true,
      'show-js-errors-in-repl': true,
      'expand-objects-inline': true,
    },
    { // key/label
      'unpack-list-alikes': ui_strings.S_SWITCH_UNPACK_LIST_ALIKES,
      'do-friendly-print': ui_strings.S_SWITCH_FRIENDLY_PRINT,
      'is-element-type-sensitive': ui_strings.S_SWITCH_IS_ELEMENT_SENSITIVE,
      'show-js-errors-in-repl': ui_strings.S_SWITCH_SHOW_ECMA_ERRORS_IN_COMMAND_LINE,
      'expand-objects-inline': ui_strings.S_SWITCH_EXPAND_OBJECTS_INLINE,
    },
    { // settings map
      checkboxes:
      [
        'unpack-list-alikes',
        'do-friendly-print',
        'is-element-type-sensitive',
        'show-js-errors-in-repl',
        'expand-objects-inline',
      ]
    },
    null,
    "general"
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

  var broker = ActionBroker.get_instance();
  var contextmenu = ContextMenu.get_instance();
  var default_menu =
  [
    {
      label: ui_strings.S_CLEAR_COMMAND_LINE_LOG,
      handler: function() {
        broker.dispatch_action("command_line", "clear");
      }
    },
  ];
  var with_close_option = default_menu.slice(0);
  with_close_option.push(
  {
    label: ui_strings.S_CLOSE_COMMAND_LINE,
    handler: function(event, target) {
      broker.dispatch_action("global", "toggle-commandline", event, target);
    }
  });

  contextmenu.register("command_line",
  [
    {
      callback: function(event, target)
      {
        if (UI.get_instance().get_mode() == "console_panel")
        {
          return default_menu;
        }
        return with_close_option;
      }
    }
  ]);
};
