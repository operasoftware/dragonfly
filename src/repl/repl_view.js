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
  this._current_scroll = 0;
  this._container = null;
  this._backlog_index = -1;


  this.ondestroy = function()
  {
    this._lastupdate = 0;
    this._backlog_index = -1;
    this._current_input = this._textarea.value;
  };

  this.createView = function(container)
  {
    if (!this._lastupdate)
    {
      container.render(templates.repl_main());
      this._linelist = container.querySelector("ol");
      this._textarea = container.querySelector("textarea");
      this._textarea.value = this._current_input;
      this._container = container;
      this._textarea.focus();

      // note: events are bound to handlers at the bottom of this class
    }

    this._update();
  };


  this.clear = function()
  {
    this._linelist.innerHTML = "";
    this.ondestroy();
  };

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
          this.render_input(e.data);
          break;
        case "string":
          this.render_string(e.data);
          break;
        case "exception":
          this.render_error(e.data);
          break;
        case "iobj":
          this.render_inspectable_object(e.data);
          break;
        case "iele":
          this.render_inspectable_element(e.data);
          break;
        case "pobj":
          this.render_pointer_to_object(e.data);
          break;
        case "valuelist":
          this.render_value_list(e.data);
          break;
        case "trace":
          this.render_trace(e.data);
          break;
        case "groupstart":
          this.render_groupstart(e.data);
          break;
        case "groupend":
          this.render_groupend();
          break;
      default:
          this.render_string("unknown");
      }
    }
  };

  this._focus_input_bound = function()
  {
    this._textarea.focus();
  }.bind(this);

  this.render_groupstart = function(data)
  {
    this._add_line([["button", "", "class", "folder-key"+(data.collapsed ? "" : " open" ),
                                   "handler", "repl-toggle-group"
                    ],
                    data.name]);
    var ol = document.createElement("ol");
    ol.className="repl-lines";
    this._add_line(ol);
    if (data.collapsed) {
      ol.parentNode.style.display = "none";
    }

    this._linelist = ol;
  };

  this.render_groupend = function()
  {
    if (this._linelist.parentNode.parentNode.nodeName.toLowerCase() == "ol")
    {
      this._linelist = this._linelist.parentNode.parentNode;
    }
  };

  this.render_pointer_to_object = function(data)
  {
    this._add_line(templates.repl_output_pobj(data));
  };

  this.render_inspectable_element = function(data)
  {
    if (!data.view) {
      var rt_id = data.rt_id, obj_id=data.obj_id, name=data.name;
      data.view = new cls.InspectableDomNodeView(rt_id, obj_id, name, false);
    }

    if (data.view && !data.view.expanded)
    {
      // re-enter once we have the data.
      data.view.expand(this.render_inspectable_element.bind(this, data));
      return;
    }

    this._add_line(data.view.render());
  };

  this.render_inspectable_object = function(data)
  {
    if (!data.view) {
      var rt_id = data.rt_id, obj_id=data.obj_id, name=data.name;
      data.view = new cls.InspectableObjectView(rt_id, obj_id, name, false);
    }

    if (data.view && !data.view.expanded)
    {
      // re-enter once we have the data.
      data.view.expand(this.render_inspectable_object.bind(this, data));
      return;
    }

    this._add_line(data.view.render());
  };

  this.render_error = function(data)
  {
    this.render_string(data.message, data.stacktrace);
  };

  this.render_trace = function(data)
  {
    this._add_line(templates.repl_output_trace(data));
  };

  this.render_value_list = function(values) {
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
   * Render an arbitrary numver of string arguments
   */
  this.render_string = function()
  {
    for (var n=0; n<arguments.length; n++)
    {
      this._add_line(templates.repl_output_native(arguments[n]));
    }
  };

  this.render_input = function(str)
  {
    this.render_string(">>> " + str);
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
    this._container.scrollTop = this._container.scrollHeight;
  };

  this._handle_keydown_bound = function(evt)
  {
    // opera.postError(evt.keyCode);

    if (evt.keyCode == 13)
    {
      evt.preventDefault();
      var input = this._textarea.value;
      input = input.trim();
      this._textarea.value = "";
      this._backlog_index = -1;
      this._current_input = "";

      if (input == "") {
        this.render_input("");
        return;
      }

      this._service.handle_input(input);
   }
    else if (evt.keyCode == 38 || evt.keyCode == 40) // up / down
    {
      evt.preventDefault();
      this._handle_backlog(evt.keyCode == 38 ? 1 : -1);
    }
    else if ( evt.keyCode == 82 && evt.ctrlKey) // ctrl-r
    {
      opera.postError("reverse search");
    }
    else if (evt.keyCode == 75 && evt.ctrlKey) // ctrk-k
    {
      opera.postError("kill to end of line");
    }
    else if (evt.keyCode == 87 && evt.ctrlKey) // ctrk-w
    {
      opera.postError("reverse kill word");
    }

  }.bind(this);

  this._handle_keypress_bound = function(evt)
  {

    if (evt.keyCode == 9)
    {
      evt.preventDefault();
      this._resolver.find_props(this._handle_completer.bind(this),
                                this._textarea.value,
                                window.stop_at.getSelectedFrame());
    }
    else if (evt.keyCode == 13)
    {
      evt.preventDefault();
    }
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

  this._handle_completer = function(props)
  {
    var localpart = props.identifier;

    var matches = props.props.filter(function(e) {
      return e.indexOf(localpart) == 0;
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
      this.render_input(this._textarea.value);
      this.render_string(matches.sort().join(", "));
    }

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

  this._handle_repl_toggle_group = function(event, target)
  {
    var li = target.parentNode;
    if (target.hasClass("open"))
    {
      target.removeClass("open");
      li.nextSibling.style.display = "none";
    }
    else
    {
      target.addClass("open");
      li.nextSibling.style.display = "";
    }
  };

  this._handle_option_change_bound = function(event, target)
  {
    settings.repl.set('max-typed-history-length', target.value);
  }.bind(this);


  this._init_settings = function()
  {
/*
    new Settings(
      'repl',
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
        ] );
      }
    });
*/
  };


  var eh = window.eventHandlers;
  eh.click["repl-toggle-group"] = this._handle_repl_toggle_group;
  eh.click['focus-repl'] = this._focus_input_bound;
  eh.keydown['repl-textarea'] = this._handle_keydown_bound;
  eh.keypress['repl-textarea'] = this._handle_keypress_bound;
  eh.change['set-typed-history-length'] = this._handle_option_change_bound;

//  window.messages.addListener("setting-changed")

  this._init_settings();
  this.init(id, name, container_class, html, default_handler);
};
cls.ReplView.prototype = ViewBase;



// fixme: move settings initialization back into class
new Settings(
  'repl',
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
    ] );
  }
});
