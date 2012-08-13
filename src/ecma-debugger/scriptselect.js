window.cls || (window.cls = {});

cls.ScriptSelect = function(id, class_name)
{

  var _selected_value = "";
  var _selected_script_id = 0;
  var _stopped_script_id = "";
  var MAX_MATCH_HISTORY = 10;

  this.getSelectedOptionTooltipText = function()
  {
    _selected_script_id = runtimes.getSelectedScript();
    var script = _selected_script_id && runtimes.getScript(_selected_script_id);
    return script && script.script_type == "linked" && script.uri || null;
  }

  this.getSelectedOptionText = function()
  {
    _selected_script_id = runtimes.getSelectedScript();
    if (_selected_script_id)
    {
      var script = runtimes.getScript(_selected_script_id);
      if (script)
      {
        var script_type = script.script_type.capitalize(true);
        return script.uri
             ? script.filename || script.uri
             : script_type + " – " + (script.script_data.replace(/\s+/g, " ").slice(0, 300) ||
               ui_strings.S_TEXT_ECMA_SCRIPT_SCRIPT_ID + ': ' + script.script_id);
      }
      else if(_selected_script_id == -1)
      {
        return " ";
      }
      else
      {
        opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
          'missing script in getSelectedOptionText in cls.ScriptSelect');
      }
    }
    else if(runtimes.getSelectedRuntimeId() &&
            runtimes.isReloadedWindow(runtimes.getActiveWindowId()))
    {
      return ui_strings.S_INFO_RUNTIME_HAS_NO_SCRIPTS;
    }
    return '';
  }

  this.getSelectedOptionValue = function()
  {

  }

  this.templateOptionList = function(select_obj)
  {
    this._runtimes = runtimes.get_dom_runtimes(true);
    this._selected_script = runtimes.getSelectedScript();
    return templates.script_dropdown(this._id,
                                     this._runtimes,
                                     _stopped_script_id,
                                     this._selected_script);
  };

  this.onshowoptionlist = function(container)
  {
    var input = container.querySelector("input");
    if (input)
    {
      this._input = input;
      this._clear_button = container.querySelector(".js-dd-clear-filter");
      this._container = container;
      this._script_list = container.querySelector(".js-dd-script-list");
      this._filter.setContainer(container);
      this._filter.setFormInput(input);
      input.focus();
      this._get_option_ele_list();
      this._update_clear_button_state();
      this._match_cursor = 0;
    }
  };

  this.onhideoptionlist = function()
  {
    this._filter.cleanup();
    this._filter.set_search_term("");
    this._input = null;
    this._clear_button = null;
    this._container = null;
    this._option_eles = null;
    this._option_box = null;
    this._option_ele_cursor = 0;
  }

  this.checkChange = function(target_ele)
  {
    var script_id_str = target_ele.get_attr('parent-node-chain', 'script-id');
    var script_id = script_id_str && parseInt(script_id_str);
    if (script_id)
    {
      if (script_id != _selected_script_id)
      {
        runtimes.setSelectedScript(script_id);
        topCell.showView(views.js_source.id);
        _selected_script_id = script_id;
      }
      _selected_value = target_ele.textContent;
      var target = this._option_eles && this._option_eles[this._option_ele_cursor];
      if (target)
      {
        if (!this._setting)
          this._init_match_history();

        if (this._input && this._input.value &&
            !this._match_history.contains(this._input.value))
        {
          this._match_history.push(this._input.value);
          while (this._match_history.length > MAX_MATCH_HISTORY)
            this._match_history.shift();

          if (this._setting)
            this._setting.set("js-dd-match-history", this._match_history);
        }
      }
      return true;
    }
    return false;
  }

  // this.updateElement

  var onThreadStopped = function(msg)
  {
    _stopped_script_id = msg.stop_at.script_id;
  }

  var onThreadContinue = function(msg)
  {
    _stopped_script_id = "";
  }

  var onApplicationSetup = function()
  {
    eventHandlers.change['set-tab-size']({target: {value:  settings.js_source.get('tab-size')}});
  }

  this._onfilterinput = function(event, target)
  {
    this._update_clear_button_state();
    this._filter.searchDelayed(target.value);
  };

  this._update_clear_button_state = function()
  {
    if (this._input && this._clear_button)
    {
      if (this._input.value && !this._is_clear_button_visible)
      {
        this._is_clear_button_visible = true;
        this._clear_button.addClass("js-dd-visible");
      }
      else if (!this._input.value && this._is_clear_button_visible)
      {
        this._is_clear_button_visible = false;
        this._clear_button.removeClass("js-dd-visible");
      }
    }
  };

  this._onshortcut = function(action_id, event, target)
  {
    switch (action_id)
    {
      case "highlight-next-match":
      case "highlight-previous-match":
        var target = this._option_eles[this._option_ele_cursor];
        if (target)
          target.dispatchMouseEvent("mouseup");

        return false;

      case "up":
        if (this._option_eles.length > 1)
        {
          var index = this._option_ele_cursor - 1;
          if (index < 0)
            index = this._option_eles.length - 1;

          this._move_highlight(index, true);
        }
        return false;

      case "down":
        if (this._option_eles.length > 1)
        {
          var index = this._option_ele_cursor + 1;
          if (index > this._option_eles.length - 1)
            index = 0;

          this._move_highlight(index, true);
        }
        return false;

      case "shift-down":
        if (!this._setting)
          this._init_match_history();

        this._match_cursor++;
        if (this._match_cursor > this._match_history.length - 1)
          this._match_cursor = 0;

        this._set_filter_value();
        return false;

      case "shift-up":
        if (!this._setting)
          this._init_match_history();

        this._match_cursor--;
        if (this._match_cursor < 0)
          this._match_cursor = this._match_history.length
                             ? this._match_history.length - 1
                             : 0;

        this._set_filter_value();
        return false;

    }
  };

  this._set_filter_value = function()
  {
    if (this._match_history[this._match_cursor] && this._input)
    {
      this._input.value = this._match_history[this._match_cursor];
      this._input.selectionStart = 0;
      this._input.selectionEnd = this._input.value.length;
      this._filter.search(this._input.value);
      this._update_clear_button_state();
    }
  };

  this._onbeforesearch = function(msg)
  {
    if (this._script_list)
    {
      var tmpl = templates.script_dropdown_options(this._id,
                                                   this._runtimes,
                                                   _stopped_script_id,
                                                   this._selected_script,
                                                   msg.search_term);
      this._script_list.clearAndRender(tmpl);
      this._get_option_ele_list();
    }
  };

  this._get_option_ele_list = function()
  {
    var list = this._script_list.querySelectorAll("cst-option");
    this._option_eles = Array.prototype.slice.call(list);
    var index = 0;

    if (this._option_eles.length)
    {
      for (var opt; opt = this._option_eles[index]; index++)
      {
        if (opt.hasClass("selected"))
          break;
      }

      if (!this._option_eles[index])
        index = 0;

      this._option_eles[index].addClass("hover");
    }

    this._option_ele_cursor = index;
    this._option_box = this._container
                     ? this._container.getBoundingClientRect()
                     : null;
    if (this._option_box && !this._option_box_delta)
    {
      var style = getComputedStyle(this._container);
      this._option_box_delta = parseInt(style.getPropertyValue("border-top-width"));
    }

  };

  this._onclearfilter = function(event, target)
  {
    this._filter.searchDelayed(this._input.value = "");
    this._update_clear_button_state();
  };

  this._onmouseover = function(event, target)
  {
    var option = event.target.get_ancestor("cst-option");
    var index = this._option_eles.indexOf(option);

    if (index > -1)
      this._move_highlight(index);
  };

  this._move_highlight = function(index, is_key_event)
  {
    if (index < this._option_eles.length)
    {
      if (this._option_eles[this._option_ele_cursor])
        this._option_eles[this._option_ele_cursor].removeClass("hover");

      this._option_ele_cursor = index;
      var ele = this._option_eles[this._option_ele_cursor];
      ele.addClass("hover");
      if (this._option_box && is_key_event)
      {
        var box = ele.getBoundingClientRect();
        if (box.bottom > this._option_box.bottom)
          ele.scrollIntoView();
        else if(box.top < this._option_box.top + this._option_box_delta)
          this._container.scrollTop -= this._option_box.top - box.top
                                     + this._option_box.height - box.height;
      }
    }
  };

  this._init_match_history = function()
  {
    this._setting = window.settings.js_source;
    this._match_history = this._setting && this._setting.get("js-dd-match-history");
    this._match_cursor = 0;
  }

  this._init = function(id, class_name)
  {
    this.init(id, class_name);
    this.ignore_option_handlers = true;
    this._is_clear_button_visible = false;
    this._filter = new TextSearch(1);
    this._filter.set_query_selector(".js-dd-s-scope");
    this._filter.no_highlight = true;
    this._clear_button = null;
    this._onbeforesearch_bound = this._onbeforesearch.bind(this);
    this._filter.addListener("onbeforesearch", this._onbeforesearch_bound);
    eventHandlers.input[this._id + "-filter"] = this._onfilterinput.bind(this);
    eventHandlers.click["js-dd-clear-filter"] = this._onclearfilter.bind(this);
    eventHandlers.mouseover["js-dd-move-highlight"] = this._onmouseover.bind(this);
    this._onshortcut_bound = this._onshortcut.bind(this);
    var gl_h = ActionBroker.get_instance().get_global_handler();
    gl_h.register_shortcut_listener(this._id + "-filter",
                                    this._onshortcut_bound,
                                    ["highlight-next-match",
                                     "highlight-previous-match",
                                     "show-script",
                                     "next",
                                     "previous"]);
    messages.addListener("thread-stopped-event", onThreadStopped);
    messages.addListener("thread-continue-event", onThreadContinue);
    messages.addListener("application-setup", onApplicationSetup);
    this._tooltip = Tooltips.register("js-script-select", true, false);
    this._setting = null;
    this._match_history = [];
    this._match_cursor = 0;
    this._option_box_delta = 0;
  }

  this._init(id, class_name);

}

cls.ScriptSelect.prototype = new CstSelect();
