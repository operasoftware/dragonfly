var Search = function(view_id, searchbar, searchwindow)
{
  this._init(view_id, searchbar, searchwindow);
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
        this._toggle_searchwindow(this._is_active);
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
        this._toggle_searchwindow(this._is_active);
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
  MODE_SEARCHWINDOW = 2,
  MOVE_HIGHLIGHT_UP = 0,
  MOVE_HIGHLIGHT_DOWN = 1,  
  SEARCHFIELD = 2,
  SEARCH_MORE = 3;


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
        this._update_toolbarbutton(layout_box);
      }
    }
  };

  this._update_toolbarbutton = function(layout_box)
  {
    layout_box || (layout_box = this._ui.get_layout_box(this._view_id));
    var button = layout_box && layout_box.toolbar.get_control("show-search");
    if (button)
    {
      button.setAttribute("is-active", String(this._is_active));
    }
  };

  /* event handlers */

  this._onserachbar_created = function()
  {
    var ele = this._searchbar.getElement(), cur = null;
    if (ele && !ele.firstChild)
    {
      ele.render(window.templates.searchbar_content(this));
      cur = ele.getElementsByTagName('info')[0];
      this._simple_text_search.set_info_element(cur);
      cur = ele.getElementsByTagName('filter')[0].getElementsByTagName('input')[0];
      this._simple_text_search.set_form_input(cur);
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
        this._simple_text_search.set_container(this._container);
        if (this._searchwindow)
        {
          this._searchwindow;
        }
      }
    }
  };

  this._onviewdestroyed = function(msg)
  {
    if (msg.id == this._view_id)
    {
      this._simple_text_search.cleanup();
      if (this._searchwindow)
      {
        this._searchwindow;
      }
    }
  };

  this._onserachwindowclosed = function(msg)
  {
    if (this._searchwindow && msg.id == this._searchwindow.id)
    {
      this._is_active = false;
      this._update_toolbarbutton()
    }
  }

  this._onsearchfieldinput = function(event, target)
  {
    if (this._mode == MODE_SEARCHBAR)
    {
      this._simple_text_search.search_delayed(target.value);
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
        else if (this._mode == MODE_SEARCHWINDOW)
        {
          this._searchwindow.highlight_next();
        }
        return false;
      }
      case 'highlight-previous-match':
      {
        if (this._mode == MODE_SEARCHBAR)
        {
          this._simple_text_search.highlight_previous();
        }
        else if (this._mode == MODE_SEARCHWINDOW)
        {
          this._searchwindow.highlight_previous();
        }
        return false;
      }
      case 'show-script':
      {
        if (this._mode == MODE_SEARCHWINDOW)
        {
          this._searchwindow.show_script(event, target);
          return false;
        }
      }
      case 'hide-search':
      {
        this.hide();
        return false;
      }
    }
  };

  this._toggle_mode = function()
  {
    var is_active = this._is_active;
    if (is_active)
    {
      this.hide();
    }
    this._mode = this._mode == MODE_SEARCHBAR ?
                 MODE_SEARCHWINDOW :
                 MODE_SEARCHBAR;
    if (is_active)
    {
      this.show();
    }
  }

  this._toggle_searchwindow = function(bool)
  {
    if (this._searchwindow && this._searchwindow.isvisible() != bool)
    {
      if (bool)
      {
        this._searchwindow.show_search_window();
      }
      else
      {
        this._searchwindow.close_search_window();
      }
      this._update_toolbarbutton();
    }
  }



  this._init = function(view_id, searchbar, searchwindow)
  {
    var searchbarclass = searchbar && searchbar[0];
    var simplesearchclass = searchbar && (searchbar[1] || TextSearch);
    var searchwindowclass = searchwindow && searchwindow[0];
    var advancedserachclass  = '';
    this._is_active = false;
    this._mode = MODE_SEARCHBAR;
    this._view_id = view_id;
    this.controls = [];
    this.advanced_controls = [];
    this._searchbar = null;
    this._searchwindow = null;
    if (searchbarclass)
    {
      this._searchbar = new searchbarclass();
      this._searchbar.add_listener("searchbar-created", 
                                   this._onserachbar_created.bind(this));
      this._simple_text_search = new simplesearchclass();
      this.controls.push({
                           handler: this._view_id + '-move-highlight-up',
                           type: "search_control",
                           class: "search-move-highlight-up",
                           title: "Move highlight up"
                         },
                         {
                           handler: this._view_id + '-move-highlight-down',
                           type: "search_control",
                           class: "search-move-highlight-down",
                           title: "Move highlight down"
                         },
                         {
                           handler: this._view_id + '-simple-text-search',
                           shortcuts: this._view_id + '-simple-text-search',
                           title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
                         });
      messages.addListener('view-destroyed', this._onviewdestroyed.bind(this));
      messages.addListener('view-created', this._onviewcreated.bind(this));
      eventHandlers.input[this.controls[SEARCHFIELD].handler] = 
        this._onsearchfieldinput.bind(this)
      eventHandlers.click[this.controls[MOVE_HIGHLIGHT_DOWN].handler] = 
        this._onshortcut.bind(this, 'highlight-next-match');
      eventHandlers.click[this.controls[MOVE_HIGHLIGHT_UP].handler] = 
        this._onshortcut.bind(this, 'highlight-previous-match');
      ActionBroker.get_instance().get_global_handler().
      register_shortcut_listener(this.controls[SEARCHFIELD].shortcuts, 
                                 this._onshortcut.bind(this), 
                                 ['highlight-next-match',
                                  'highlight-previous-match',
                                  'hide-search']);
    }
    if (searchwindowclass)
    {


      if (this.controls.length)
      {
        this.advanced_controls = this.controls.slice(0);
      }
      this.controls[SEARCH_MORE] =
      {
        handler: this._view_id + '-show-search-window',
        type: "search_control",
        class: "search-more",
        title: "Show advanced search",
        label: "More"
      };
      this.advanced_controls[SEARCH_MORE] =
      {
        handler: this._view_id + '-show-search-window',
        type: "search_control",
        class: "search-more",
        title: "Show search bar",
        label: "Less"
      };
      this._window_view_id = view_id + "-search-window";
      this._searchwindow = new searchwindowclass(this._window_view_id, 
                                                 "Search", 
                                                 view_id + "-search-window scroll",
                                                 this.controls[SEARCHFIELD].handler);

      new ToolbarConfig(this._window_view_id, 
                        null, 
                        this.advanced_controls, 
                        null,
                        [{template: function(){return ['info']}}]);
      eventHandlers.click[this.controls[SEARCH_MORE].handler] = 
        this._toggle_mode.bind(this);
      messages.addListener('view-destroyed', this._onserachwindowclosed.bind(this));
      
    }
    
    this._ui = UI.get_instance();
    this._ui.register_search(view_id, this);
  };

};

var JSSourceSearch = function(view_id, searchbar, searchwindow)
{
  this._init(view_id, searchbar, searchwindow);
};

var JSSourceSearchBase = function()
{
  this._onscriptselected = function(msg)
  {
    var script = window.runtimes.getScript(msg.script_id);
    if (script)
    {
      this._simple_text_search.set_script(script);
    }
  };

  this._onviewscrolled = function(msg)
  {
    if (msg.id == this._view_id && this.has_searchbar)
    {
      this._simple_text_search.update_hits(msg.top_line, msg.bottom_line);
    }
  };

  this._init = function(view_id, searchbar, searchwindow)
  {
    Search.prototype._init.call(this, view_id, searchbar, searchwindow);
    // TODO add listeners when serach-bar is shown
    messages.addListener('script-selected', this._onscriptselected.bind(this));
    // TODO only when searchbar active
    messages.addListener('view-scrolled', this._onviewscrolled.bind(this));
  }
  
};

JSSourceSearchBase.prototype = Search.prototype;
JSSourceSearch.prototype = new JSSourceSearchBase();
