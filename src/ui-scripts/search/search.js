var Search = function(view_id, searchbar_class, searchwindow_class)
{
  this._init(view_id, searchbar_class, searchwindow_class);
};

Search.prototype = new function()
{


  /* interface */

  this.is_active;
  this.hashas_searchbar;

  this.show = function()
  {
    if (!this._is_active)
    {
      this._is_active = true;
      if (this._mode == MODE_SEARCHBAR)
      {
        this._toggle_searchbar(this._is_active);
      }
      else
      {

      }
    }
  };

  this.hide = function()
  {
    if (this._is_active)
    {
      this._is_active = false;
      if (this._mode == MODE_SEARCHBAR)
      {
        this._toggle_searchbar(this._is_active);
        this._simple_text_search.cleanup();
      }
      else
      {

      }
    }
  };

  this.get_searchbar = function()
  {
    return this._is_active && 
           this._searchbar && 
           this._mode == MODE_SEARCHBAR && 
           this._searchbar || null;
  };

  const 
  MODE_SEARCHBAR = 1, 
  MODE_SEARCHWINDOW = 2;

  this.__defineSetter__('is_active', function(){});
  this.__defineGetter__('is_active', function(){return this._is_active;});
  this.__defineSetter__('has_searchbar', function(){});
  this.__defineGetter__('has_searchbar', function()
  {
    return this._is_active && this._searchbar && this._mode == MODE_SEARCHBAR;
  });

  this._toggle_searchbar = function(bool)
  {
    if (this._searchbar.isvisible() != bool)
    {
      this._searchbar.setVisibility(bool);
      var layout_box = this._ui.get_layout_box(this._view_id);
      if (layout_box)
      {
        if (bool)
        {
          this._container = layout_box.container.getElement();
          layout_box.add_searchbar(this._searchbar);
          
        }
        else
        {
          this._container = null;
          layout_box.remove_searchbar(this._searchbar);
          
        }
        var button = layout_box.toolbar.get_control("show-search");
        if (button)
        {
          button.setAttribute("is-active", String(bool));
        }
      }
    }
  };

  /* event handlers */

  this._onserachbar_created = function()
  {
    var ele = this._searchbar.getElement(), cur = null;
    if (ele && !ele.firstChild)
    {
      ele.render(window.templates.searchbar_content(this));
      this._simple_text_search.setContainer(this._container);
      cur = ele.getElementsByTagName('info')[0];
      this._simple_text_search.set_info_element(cur);
      cur = ele.getElementsByTagName('filter')[0].getElementsByTagName('input')[0];
      this._simple_text_search.setFormInput(cur);
      setTimeout(function(){cur.focus();}, 0);
    }
  };

  this._onviewcreated = function(msg)
  {
    if (msg.id == this._view_id)
    {
      var layout_box = this._ui.get_layout_box(this._view_id);
      if (layout_box)
      {
        this._container = layout_box.container.getElement();
        this._onserachbar_created();
      }
    }
  };

  this._onviewdestroyed = function(msg)
  {
    if (msg.id == this._view_id)
    {
      this._simple_text_search.cleanup();
    }
  };

  this._onsearchfieldinput = function(event, target)
  {
    if (this._mode == MODE_SEARCHBAR)
    {
      this._simple_text_search.searchDelayed(target.value);
    }
  }

  this._onshortcut = function(action_id, event, target)
  {
    switch (action_id)
    {
      case 'highlight-next-match':
      {
        if (this._mode == MODE_SEARCHBAR)
        {
          this._simple_text_search.highlight_next();
        }
        return false;
      }
      case 'highlight-previous-match':
      {
        if (this._mode == MODE_SEARCHBAR)
        {
          this._simple_text_search.highlight_previous();
        }
        return false;
      }
      case 'hide-search':
      {
        this.hide();
        return false;
      }
    }
  };

  this._init = function(view_id, searchbar, simple_search, searchwindow)
  {
    this._is_active = false;
    this._mode = MODE_SEARCHBAR;
    this._view_id = view_id;
    if (searchbar)
    {
      this._searchbar = searchbar;
      this._searchbar.add_listener("searchbar-created", 
                                  this._onserachbar_created.bind(this));
      this._simple_text_search = simple_search;
      this.search_field =
      {
        handler: this._view_id + '-simple-text-search',
        shortcuts: this._view_id + '-simple-text-search',
        title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
      }
      messages.addListener('view-destroyed', this._onviewdestroyed.bind(this));
      messages.addListener('view-created', this._onviewcreated.bind(this));
      eventHandlers.input[this.search_field.handler] = 
        this._onsearchfieldinput.bind(this)
      ActionBroker.get_instance().get_global_handler().
      register_shortcut_listener(this.search_field.shortcuts, 
                                 this._onshortcut.bind(this));
    }
    else
    {
      this._searchbar = null;
    }
    this._searchwindow = null;
    this._ui = UI.get_instance();
    this._ui.register_search(view_id, this);
  };

};