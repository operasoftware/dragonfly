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
  this._is_first_showing = true;
  this._recent_autocompletion = null;
  this._autocompletion_index = null;
  this._autocompletion_elem = null;
  this._use_autocomplete_highlight = true; // fixme: turn this in to a setting
  this._textarea_handler = null;
  this._closed_group_nesting_level = 0;

  this.ondestroy = function()
  {
    this._lastupdate = 0;
    this._backlog_index = -1;
    this._current_input = this._textarea.value;
    this._container.removeEventListener("scroll", this._save_scroll_bound, false);
  };

  this.createView = function(container)
  {
    var switched_to_view = false;
    if (!this._lastupdate)
    {
      container.clearAndRender(templates.repl_main());
      this._linelist = container.querySelector("ol");
      this._textarea = container.querySelector("textarea");
      this._textarea_handler = new cls.BufferManager(this._textarea);
      this._textarea.value = this._current_input;
      this._container = container;
      this._input_row_height = this._textarea.scrollHeight;
      this._closed_group_nesting_level = 0;

      switched_to_view = true;
      // note: events are bound to handlers at the bottom of this class
    }

    this._update_runtime_selector_bound();
    this._update();

    if (switched_to_view)
    {
      var padder = this._container.querySelector(".padding");
      // defer adding listeners until after update
      this._container.addEventListener("scroll", this._save_scroll_bound, false);
      padder.addEventListener("DOMAttrModified", this._update_scroll_bound, false);
      padder.addEventListener("DOMNodeInserted", this._update_scroll_bound, false);

      if (this._is_first_showing)
      {
        this._is_first_showing = false;
        var hostinfo = this._service.hostinfo;
        if (hostinfo) {
          this._render_string(hostinfo.userAgent + " (Core " + hostinfo.coreVersion + ")");
        }
      }

      if(this._current_scroll === null)
      {
        this._container.scrollTop = 999999;
        // timer works around issue where element is unfocusable when created
        window.setTimeout(function() {this._textarea.focus();}.bind(this), 0);
      }
      else
      {
        this._container.scrollTop = this._current_scroll;
      }
    }

  };

  this.clear = function()
  {
    this.ondestroy();
  };

  this._update_input_height_bound = function()
  {
    this._textarea.rows = Math.max(1, Math.ceil(this._textarea.scrollHeight / this._input_row_height));
    this._multiediting = Boolean(this._textarea.rows-1);
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
    var now = new Date().getTime();
    var entries = this._data.get_log(this._lastupdate);
    this._lastupdate = now;

    for (var n=0, e; e=entries[n]; n++)
    {
      switch(e.type) {
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

  this._render_value_list = function(values) {
    var tpl = values.map(templates.repl_output_native_or_pobj);
    var separated = [];
    separated.push(tpl.shift());
    while (tpl.length)
    {
      separated.push(["span", ", "]);
      separated.push(tpl.shift());
    }
    this._add_line(separated);
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

  this._handle_keypress_bound = function(evt)
  {
    //opera.postError("" + evt.keyCode + " " + evt.which );

    if (this._textarea_handler.handle(evt)) {
      evt.preventDefault();
      return;
    }

    switch (evt.keyCode) {
      case 9: // tab
      {
        evt.preventDefault();
        if (this._multiediting) {
          var pos = this._textarea.selectionStart;
          this._textarea.value = this._textarea.value.slice(0, pos) + "\t" + this._textarea.value.slice(pos);
          break; // tab should be off when in a multiline box.
        }
        else
        {
          this._on_invoke_completer(evt.shiftKey ? -1 : +1);
          return;
        }
      }
      case 13: // enter
      {
        if (evt.ctrlKey)
        {
          this._textarea.rows = this._textarea.rows + 1;
          this._textarea.value = this._textarea.value + "\n";
        }
        else if (this._use_autocomplete_highlight && this._recent_autocompletion)
        {
          evt.preventDefault();
          this._commit_selection();
        }
        else
        {
          // stop it from adding a newline just before processing. Looks strange
          evt.preventDefault();

          var input = this._textarea.value;
          input = input.trim();
          this._textarea.value = "";
          this._backlog_index = -1;
          this._current_input = "";
          this._service.handle_input(input);
        }
        break;
      }
      case 37: // left
      case 39: // right
      {
        // workaround as long as we don't have support for keyIdentifier
        // event.which is 0 in a keypress event for function keys
        if( !evt.which )
        {
          if (this._recent_autocompletion)
          {
            evt.preventDefault();
            this._update_highlight(evt.keyCode==37 ? -1 : 1);
            return;
          }
        }
        break;
      }
      case 38: // up and down. maybe. See DSK-246193
      case 40:
      {
        // workaround as long as we don't have support for keyIdentifier
        // event.which is 0 in a keypress event for function keys
        if( !evt.which )
        {
          // the multiediting stuff here makes sure we can navigate inside
          // multiline blocks from the typed history. Moving cursor to the
          // 0th position of the textare and pressing up resumes backwards
          // history navigation. The same applies when navigating forward
          // and positioning the cursor at the end of the input.
          if (this._multiediting)
          {
            if ((evt.keyCode==38 && this._textarea.selectionStart > 0) ||
                (evt.keyCode==40 && this._textarea.selectionStart < this._textarea.value.length))
              {
                break;
              }
          }
          evt.preventDefault();
          this._handle_backlog(evt.keyCode == 38 ? 1 : -1);
        }
        break;
      }
      case 108: // l key
      {
        if (evt.ctrlKey) {
          evt.preventDefault();
          this.clear();
          this._data.clear();
        }
        break;
      }
    }

    this._recent_autocompletion = null;
    this._highlight_completion();

    // timeout makes sure we do this after all events have fired to update box
    window.setTimeout(this._update_input_height_bound, 0);

  }.bind(this);

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
    var localpos = this._textarea.value.lastIndexOf(this._autocompletion_localpart);
    if (localpos!=-1)
    {
      var pre = this._textarea.value.slice(0, localpos);
      var post = this._textarea.value.slice(localpos+this._autocompletion_localpart.length);
      this._textarea.value = pre + this._recent_autocompletion[this._autocompletion_index][0] + post;
    }
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

  this._on_invoke_completer = function(direction)
  {
    // tab/arrows was pressed while the completer is showing something
    if (this._recent_autocompletion)
    {
      this._update_highlight(direction);
    }
    else
    {
      this._handle_completer();
    }
  };

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
      if (match.length > localpart.length)
      {
        var pos = this._textarea.value.lastIndexOf(localpart);
        this._textarea.value = this._textarea.value.slice(0, pos) + match;
      }
      else
      {
        this._render_input(this._textarea.value);
        this._autocompletion_elem = this._render_string(matches.sort().join(", "));

        // the recent autocomplete array contains tuples, (word, start, end)
        // that can be used when selecting a range.
        var offset = 0;
        this._recent_autocompletion = matches.sort().map(function(word) {
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
                                this._textarea.value,
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

  var eh = window.eventHandlers;
  eh.click["repl-toggle-group"] = this._handle_repl_toggle_group_bound;
  eh.click["select-trace-frame"] = this._handle_repl_frame_select_bound;
  eh.click["repl-focus"] = this._handle_repl_focus_bound;
  eh.keypress['repl-textarea'] = this._handle_keypress_bound;
  eh.change['set-typed-history-length'] = this._handle_option_change_bound;
  messages.addListener('active-tab', this._update_runtime_selector_bound);

  this.init(id, name, container_class, html, default_handler);
};
cls.ReplView.prototype = ViewBase;



cls.ReplView.create_ui_widgets = function()
{

  new Settings(
    'command_line',
    { // key/value
      'max-typed-history-length': 8,
      'typed-history': []
    },
    { // key/label
      'max-typed-history-length': "Max items in typed history to remember"
    },
    { // settings map
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
