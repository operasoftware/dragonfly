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
  this._groupstack = [];

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
      var markup = "" +
        "<div class='padding'>" +
          "<div class='repl-output' handler='focus-repl'><ul id='repl-lines'></ul></div>" +
          "<div class='repl-input'>" +
            "<span class='repl-prefix'>&gt;&gt;&gt; </span>" +
            "<div><textarea rows='1' title='hold shift to add a new line'></textarea></div>" +
          "</div>" +
        "</div>";

      container.innerHTML = markup;

      this._linelist = container.querySelector("#repl-lines");
      this._textarea = container.querySelector("textarea");
      this._textarea.addEventListener("keydown", this._handle_input.bind(this), false);
      this._textarea.addEventListener("keypress", this._handle_keypress.bind(this), false);
      this._textarea.value = this._current_input;
      this._container = container;
      this._container.addEventListener("click", this._focus_input.bind(this), false);
    }

    this._update();
  };

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
          this._groupstack.push(e.data);
          break;
        case "groupend":
          this.render_groupend();
          this._groupstack.pop();
          break;
      default:
          this.render_string("unknown");
      }
    }
  };

  this._focus_input = function()
  {
    this._textarea.focus();
  };

  this.render_groupstart = function(data)
  {
    this.render_string("group started: " + data.name);
  };

  this.render_groupend = function()
  {
    this.render_string("group ended");
  };

  this.render_pointer_to_object = function(data)
  {
    this._add_line(templates.repl_output_pobj(data));
  };

  this.render_inspectable_object = function(data)
  {
    var rt_id = data.rt_id, obj_id=data.obj_id, name=data.name;
    var v = new cls.InspectableObjectView(rt_id, obj_id, name);
    var div = document.createElement("div");
    div.render(v.render()); // fixme: superflous div.
    this._add_line(div);
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

  this._handle_input = function(evt)
  {

//    opera.postError(evt.keyCode);

    if (evt.keyCode == 13)
    {
      evt.preventDefault();
      var input = this._textarea.value;
      // trim leading and trailing whitespace
      input = input.replace(/^\s*/, "").replace(/$\s*/, "");
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

  this._handle_keypress = function(evt)
  {

    if (evt.keyCode == 9)
    {
      evt.preventDefault();
      this._resolver.find_props(this._handle_completer.bind(this), this._textarea.value);
    }
    else if (evt.keyCode == 13)
    {
      evt.preventDefault();
    }
  };

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


  this.init(id, name, container_class, html, default_handler);
};
cls.ReplView.prototype = ViewBase;
