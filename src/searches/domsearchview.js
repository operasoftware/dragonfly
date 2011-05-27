window.cls || (window.cls = {});

cls.DOMSearchView = function(id, name, container_class)
{

  const 
  MODE_SEARCHBAR = 1, 
  MODE_SEARCHWINDOW = 2,
  MOVE_HIGHLIGHT_UP = 0,
  MOVE_HIGHLIGHT_DOWN = 1,  
  SEARCHFIELD = 2,
  SEARCH_MORE = 3;

  this._tmpl = function()
  {
    return (
    [
      ['div',
        window.templates.dom_search_bar_content(this),
        'focus-handler', 'focus',
        'blur-handler', 'blur',
        'class', 'dom-search-controls'],
      ['div',
        ['div', 'class', 'dom-search mono'],
        'class', 'dom-search-container',
        'handler', 'clear-style-highlight-node'],
      ['div',
        ['info', '\u00A0'],
        'class', 'dom-search-info'],
    ]);
  };

  this._adjust_scroll_height = function()
  {
    if (this._search_container)
    {
      this._search_container.style.borderTopWidth = 
        (this._search_container.parentNode.firstElementChild.offsetHeight + 1) + 'px';
    }
  };

  this.createView = function(container)
  {
    container.clearAndRender(this._tmpl());
    this._search_container = container.childNodes[1];
    this._search.set_container(this._search_container);
    var input = container.querySelector('[handler="' + 
                                        this.controls[SEARCHFIELD].handler + 
                                        '"]');
    this._search.set_form_input(input);
    this._search.set_info_element(container.getElementsByTagName('info')[0]);
    this._adjust_scroll_height();

  };

  this.onresize = function()
  {
    this._adjust_scroll_height();
    this._search.set_container(this._search_container);
  };

  ActionHandlerInterface.apply(this);

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
        this._search.inspect_selected_node();
        break;
      }

    }
  };

  this._onsearchfieldinput = function(event)
  {
    // opera.postError(event.target.value)
    this._search.search_delayed();
  }



  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class);
    this._search = new DOMSearch();
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

    [
      'search_type',
      'ignore_case',
      'search_only_selected_node',
    ].forEach(function(prop)
    {
      this.__defineGetter__(prop, function()
      {
        return this._search[prop];
      });
      this.__defineSetter__(prop, function(){});
    }, this);

    eventHandlers.input[this.controls[SEARCHFIELD].handler] = 
      this._onsearchfieldinput.bind(this)
    eventHandlers.click[this.controls[MOVE_HIGHLIGHT_DOWN].handler] = 
      this._onshortcut.bind(this, 'highlight-next-match');
    eventHandlers.click[this.controls[MOVE_HIGHLIGHT_UP].handler] = 
      this._onshortcut.bind(this, 'highlight-previous-match');
    eventHandlers.mouseover['clear-style-highlight-node'] =
      this._search.clear_style_highlight_node.bind(this._search);
    ActionBroker.get_instance().get_global_handler().
    register_shortcut_listener(this.controls[SEARCHFIELD].shortcuts, 
                               this._onshortcut.bind(this), 
                               ['highlight-next-match',
                                'highlight-previous-match',
                                'hide-search']);
    
  };



  this._init(id, name, container_class);

};
