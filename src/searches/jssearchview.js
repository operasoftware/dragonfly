window.cls || (window.cls = {});

cls.JSSearchView = function(id, name, container_class)
{
  /* interface */

  this.search_type;
  this.ignore_case;
  this.search_all_files;

  /* constants */

  const 
  JS_SOURCE_ID = 'js_source',
  ALL_FILES = 1,
  SINGLE_FILE = 0,
  MOVE_HIGHLIGHT_UP = 0,
  MOVE_HIGHLIGHT_DOWN = 1,  
  SEARCHFIELD = 2;

  this.createView = function(container)
  {
    this._container = container;
    container.clearAndRender(this._tmpl());
    var query = '[handler="' + this.controls[SEARCHFIELD].handler + '"]';
    this._input = container.querySelector(query);
    this._setup_search();

    /*
    this._search.show_last_search();
    */
  };

  // TODO sync with the DOMSearchView

  this._tmpl = function()
  {
    return (
    [
      ['div',
        window.templates.js_search_bar_content(this),
        'class', 'dom-search-controls'],
      ['div',
        ['div', 'class', 'dom-search mono'],
        'class', 'dom-search-container',
        'handler', 'show-script'],
      ['div',
        ['info', '\u00A0'],
        'class', 'dom-search-info'],
    ]);
  };

  // DOMSearchView
  ActionHandlerInterface.apply(this);
  /*
  this.focus = function(event, container)
  {
    setTimeout(this._focus_input, 50);
  };

  this._focus_input = function()
  {
    if (this._input)
    {
      this._input.selectionStart = 0;
      this._input.selectionEnd = this._input.value.length; 
      this._input.focus();
    }
  }.bind(this);
  */

  this._setup_search = function()
  {
    if (this._container)
    {
      var search_container = null;
      var info = this._container.getElementsByTagName('info')[0];
      switch (this._search_mode)
      {
        case SINGLE_FILE:
        {
          search_container = this._ui.get_container(JS_SOURCE_ID);
          messages.addListener('view-scrolled', this._onviewscrolled_bound);
          break;
        }
        case ALL_FILES:
        {
          search_container = this._container
                             .getElementsByClassName('dom-search-container')[0];
          messages.removeListener('view-scrolled', this._onviewscrolled_bound);
          break;
        }
      }
      this._search = this._searches[this._search_mode];
      this._search.search_type = this.search_type;
      this._search.ignore_case = this.ignore_case;
      this._search.set_container(search_container);
      this._search.set_info_element(info);
      this._search.set_form_input(this._input);
      this._search.set_script(this._rts.getScript(this._selected_script));
    }

  }

  this._onshortcut = function(action_id, event, target)
  {
    switch (action_id)
    {
      case 'highlight-next-match':
      {
        if (this._search)
        {
          this._search.highlight_next();
        }
        return false;
      }
      case 'highlight-previous-match':
      {
        if (this._search)
        {
          this._search.highlight_previous();
        }
        return false;
      }
      case "show-script":
      {
        if (this._search && this._search.show_script_of_search_match)
        {
          this._search.show_script_of_search_match(event, target);
        }
        break;
      }
    }
  };

  this._onsearchfieldinput = function(event)
  {
    if (this._search)
    {
      this._search.search_delayed(this._input.value);
    }
  };

  this._onsearchtypechange = function(event)
  {
    switch (event.target.name)
    {
      case 'js-search-type':
      {
        this.search_type = parseInt(event.target.value);
        this._setting.set('js-search-type', this.search_type);
        //this._validate_current_search();
        break;
      }
      case 'js-search-ignore-case':
      {
        this.ignore_case = Number(event.target.checked);
        this._setting.set('js-search-ignore-case', this.ignore_case);
        //this._validate_current_search();
        break;
      }
      case 'js-search-all-files':
      {
        this.search_all_files = Number(event.target.checked);
        this._setting.set('js-search-all-files', this.search_all_files);
        this._search_mode = this.search_all_files ? ALL_FILES : SINGLE_FILE;
        //this._validate_current_search();
        break;
      }
    }
  }.bind(this);

  this._onscriptselected = function(msg)
  {
    this._selected_script = msg.script_id;
    if (this._search)
    {
      this._search.set_script(this._rts.getScript(this._selected_script));
    }
  };

  this._onviewscrolled = function(msg)
  {
    if (msg.id == JS_SOURCE_ID && this._search)
    {
      this._search.update_hits(msg.top_line, msg.bottom_line);
    }
  };

  this._on_active_tab = function(msg)
  {
    this._rt_ids = msg.activeTab.slice(0);
    this._search_term = '';
  };

  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class);
    this._setting = window.settings.js_source;
    this._rts = window.runtimes;
    this._ui = UI.get_instance();
    this.search_type = this._setting.get('js-search-type');
    this.ignore_case = this._setting.get('js-search-ignore-case');
    this.search_all_files = this._setting.get('js-search-all-files');
    this._search_mode = this.search_all_files ? ALL_FILES : SINGLE_FILE;

    this._searches = [];

    this._searches[ALL_FILES] = new JSMultifileSearch();
    this._searches[SINGLE_FILE] = new VirtualTextSearch()
    
    
    this.controls =
    [
      {
        handler: this.id + '-move-highlight-up',
        type: "search_control",
        class: "search-move-highlight-up",
        title: ui_strings.S_LABEL_MOVE_HIGHLIGHT_UP
      },
      {
        handler: this.id + '-move-highlight-down',
        type: "search_control",
        class: "search-move-highlight-down",
        title: ui_strings.S_LABEL_MOVE_HIGHLIGHT_DOWN
      },
      {
        handler: this.id + '-simple-text-search',
        shortcuts: this.id + '-simple-text-search',
        title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
      },
    ];
    /*
    [
      'search_type',
      'ignore_case',
    ].forEach(function(prop)
    {
      this.__defineGetter__(prop, function()
      {
        return this._search[prop];
      });
      this.__defineSetter__(prop, function(){});
    }, this);
    */
    this._onviewscrolled_bound = this._onviewscrolled.bind(this);
    this._onscriptselected_bound = this._onscriptselected.bind(this);

    // DOMSearchView
    
    eventHandlers.input[this.controls[SEARCHFIELD].handler] = 
      this._onsearchfieldinput.bind(this)
    eventHandlers.click[this.controls[MOVE_HIGHLIGHT_DOWN].handler] = 
      this._onshortcut.bind(this, 'highlight-next-match');
    eventHandlers.click[this.controls[MOVE_HIGHLIGHT_UP].handler] = 
      this._onshortcut.bind(this, 'highlight-previous-match');
    eventHandlers.change['js-search-type-changed'] = 
      this._onsearchtypechange;
    //eventHandlers.click['show-script'] = this._show_script.bind(this);
    /*
    eventHandlers.mouseover['clear-style-highlight-node'] =
      this._search.clear_style_highlight_node.bind(this._search);
    */
    var action_broker = ActionBroker.get_instance();
    action_broker.register_handler(this);
    action_broker.get_global_handler()
    .register_shortcut_listener(this.controls[SEARCHFIELD].shortcuts, 
                                this._onshortcut.bind(this), 
                                ['highlight-next-match',
                                 'highlight-previous-match',
                                 'hide-search']);

    messages.addListener('script-selected', this._onscriptselected.bind(this));
    
    //window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    // jssearchwindow
    /*
    this._searchhandler = searchhandler;
    this._ui = UI.get_instance();
    this.highlight_next = this._onhighlightnext.bind(this);
    this.highlight_previous = this._onhighlightprevious.bind(this);
    this._input = null;
    this._output = null;
    this._rt_ids = null;
    this._search_term = '';
    this.searchresults = {};
    this._window_highlighter = new JSSearchWindowHighlight();
    this._source_highlighter = new VirtualTextSearch();
    this._show_search_results_bound = this._show_search_results.bind(this);
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    ActionBroker.get_instance().register_handler(this);
    */
  };



  this._init(id, name, container_class);
};
