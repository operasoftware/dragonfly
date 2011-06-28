window.cls || (window.cls = {});

cls.DOMSearchView = function(id, name, container_class)
{

  const 
  SEARCHFIELD = 0,
  MOVE_HIGHLIGHT_UP = 1,
  MOVE_HIGHLIGHT_DOWN = 2; 

  this.createView = function(container)
  {
    container.clearAndRender(window.templates.search_panel(this, 'dom'));
    this._search_container = container.childNodes[1];
    this._search.set_container(this._search_container);
    var query = '[handler="' + this.controls[SEARCHFIELD].handler + '"]';
    this._input = container.querySelector(query);
    this._search.set_form_input(this._input);
    var info_ele = container.getElementsByClassName('search-info-badge')[0];
    this._search.set_info_element(info_ele);
    this._search.show_last_search();
  };

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
        this._search.inspect_selected_node();
        break;
      }

    }
  };

  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class);
    this._search = new DOMSearch();
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
        class: "search-move-highlight-down container-button",
        title: ui_strings.S_LABEL_MOVE_HIGHLIGHT_DOWN
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

    eventHandlers.click[this.controls[MOVE_HIGHLIGHT_DOWN].handler] = 
      this._onshortcut.bind(this, 'highlight-next-match');
    eventHandlers.click[this.controls[MOVE_HIGHLIGHT_UP].handler] = 
      this._onshortcut.bind(this, 'highlight-previous-match');
    eventHandlers.mouseover['clear-style-highlight-node'] =
      this._search.clear_style_highlight_node.bind(this._search);
    var action_broker = ActionBroker.get_instance();
    action_broker.register_handler(this);
    action_broker.get_global_handler()
    .register_shortcut_listener(this.controls[SEARCHFIELD].shortcuts, 
                                this._onshortcut.bind(this), 
                                ['highlight-next-match',
                                 'highlight-previous-match',
                                 'hide-search']);
  };

  this._init(id, name, container_class);

};
