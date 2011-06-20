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
  SEARCHFIELD = 0,
  MOVE_HIGHLIGHT_UP = 1,
  MOVE_HIGHLIGHT_DOWN = 2;  

  this.createView = function(container)
  {
    this._container = container;
    container.clearAndRender(this._tmpl());
    var query = '[handler="' + this.controls[SEARCHFIELD].handler + '"]';
    this._input = container.querySelector(query);
    var search_container = this._container
                           .getElementsByClassName('panel-search-container')[0];
    var info = this._container.getElementsByClassName('search-info-badge')[0];
    this._search.set_container(search_container);
    this._search.set_info_element(info);
    this._search.set_form_input(this._input);
    this._search.show_last_search();
  };

  // duplicated code domsearch
  this._tmpl = function()
  {
    return (
    [
      ['div',
        window.templates.advanced_js_search(this),
        'class', 'advanced-search-controls'],
      ['div',
        ['div', 'class', 'panel-search mono'],
        'class', 'panel-search-container',
        'handler', 'show-script'],
    ]);
  };

  // DOMSearchView
  ActionHandlerInterface.apply(this);
  
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
  

  this._onshortcut = function(action_id, event, target)
  {
    switch (action_id)
    {
      case 'highlight-next-match':
      {
        this._search.highlight_next();
        return false;
      }
      case 'highlight-previous-match':
      {
        this._search.highlight_previous();
        return false;
      }
      case "show-script":
      {
        this._search.show_script_of_search_match(event, target);
        break;
      }
    }
  };

  this._onsearchtypechange = function(event)
  {
    switch (event.target.name)
    {
      case 'js-search-type':
      {
        this._search.search_type = event.target.checked ?
                                   TextSearch.REGEXP :
                                   TextSearch.PLAIN_TEXT;
        this._setting.set('js-search-type', this._search.search_type);
        break;
      }
      case 'js-search-ignore-case':
      {
        this._search.ignore_case = Number(event.target.checked);
        this._setting.set('js-search-ignore-case', this._search.ignore_case);
        break;
      }
      case 'js-search-all-files':
      {
        this._search.search_all_files = Number(event.target.checked);
        this._setting.set('js-search-all-files', this._search.search_all_files);
        break;
      }
    }
    this._search.update_search();
  }.bind(this);

  this._onscriptselected = function(msg)
  {
    this._selected_script = msg.script_id;
    if (this._search)
    {
      this._search.set_script(this._rts.getScript(this._selected_script));
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
    this._search = new JSMultifileSearch();
    this._search.ignore_case = this._setting.get('js-search-ignore-case');
    this._search.search_all_files = this._setting.get('js-search-all-files');
    this._search.search_type = this._setting.get('js-search-type');
    
    this.controls =
    [
      {
        handler: this.id + '-simple-text-search',
        class: 'panel-search-input-container',
        shortcuts: this.id + '-simple-text-search',
        title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
      },
      {
        handler: this.id + '-move-highlight-up',
        type: "search_control",
        class: "search-move-highlight-up container-button",
        title: ui_strings.S_LABEL_MOVE_HIGHLIGHT_UP
      },
      {
        handler: this.id + '-move-highlight-down',
        type: "search_control",
        class: "search-move-highlight-down container-button ",
        title: ui_strings.S_LABEL_MOVE_HIGHLIGHT_DOWN
      },
    ];
  
    [
      'search_type',
      'ignore_case',
      'search_all_files',
    ].forEach(function(prop)
    {
      this.__defineGetter__(prop, function()
      {
        return this._search[prop];
      });
      this.__defineSetter__(prop, function(){});
    }, this);
    
    this._onscriptselected_bound = this._onscriptselected.bind(this);
    
    window.eventHandlers.click[this.controls[MOVE_HIGHLIGHT_DOWN].handler] = 
      this._onshortcut.bind(this, 'highlight-next-match');
    window.eventHandlers.click[this.controls[MOVE_HIGHLIGHT_UP].handler] = 
      this._onshortcut.bind(this, 'highlight-previous-match');
    window.eventHandlers.change['js-search-type-changed'] = 
      this._onsearchtypechange;
    var action_broker = ActionBroker.get_instance();
    action_broker.register_handler(this);
    action_broker.get_global_handler()
    .register_shortcut_listener(this.controls[SEARCHFIELD].shortcuts, 
                                this._onshortcut.bind(this));
    messages.addListener('script-selected', this._onscriptselected.bind(this));
  };

  this._init(id, name, container_class);

};
