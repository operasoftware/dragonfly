window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends DOM_markup_style
  */

cls.DOMView = function(id, name, container_class)
{

  this.createView = function(container)
  {
    if (this._create_view_no_data_timeout)
    {
      clearTimeout(this._create_view_no_data_timeout);
      this._create_view_no_data_timeout = 0;
    }
    if (dom_data.has_data())
    {
      var model = window.dominspections.active;
      var scrollTop = container.scrollTop;      
      container.clearAndRender(window.templates.inspected_dom_node(window.dom_data, 
                                                                   model && model.target, 
                                                                   true));
      if (!window.helpers.scroll_dom_target_into_view())
      {
        container.scrollTop = scrollTop;
      }
      if (model == this)
      {
        window.topCell.statusbar.updateInfo(templates.breadcrumb(model, model.target));
      }
    }
    else
    {
      this._create_view_no_data_timeout = setTimeout(this._create_view_no_data, 100, container);
    }
  };

  this._create_view_no_data_timeout = 0;

  this._create_view_no_data = function(container)
  {
    if(!dom_data.getDataRuntimeId())
    {
      container.innerHTML = 
        "<div class='padding'><div class='info-box'>" +
          ui_strings.S_INFO_WINDOW_HAS_NO_RUNTIME +
        "</div></div>";
    }
    else
    {
      container.innerHTML = "<div class='padding' edit-handler='edit-dom'><p></p></div>";
    }
    topCell.statusbar.updateInfo('');
  }

  this.serializer = new cls.DOMSerializer();

  this.serializeToOuterHTML = function(data)
  {
    // TODO should take a data model as argument
    return this.serializer[dom_data.isTextHtml() && 'text/html' || 'application/xml'](data);
  }

  this.exportMarkup = function()
  {
    return this.serializeToOuterHTML(dom_data.getData());
  }

  this.ondestroy = function()
  {
    hostspotlighter.clearSpotlight();
  }

  this._on_setting_change = function(msg)
  {
    if( msg.id == this.id )
    {
      switch (msg.key)
      {
        case 'dom-tree-style':
        {
          this.update();
          break;
        }
      }
    }
  }

  messages.addListener('setting-changed', this._on_setting_change.bind(this));

  this.init(id, name, container_class);

}


cls.DocumentSelect = function(id)
{

  var selected_value = "";

  this.getSelectedOptionText = function()
  {
    var selected_rt_id = dom_data.getDataRuntimeId();
    if(selected_rt_id)
    {
      var rt = runtimes.getRuntime(selected_rt_id);
      if( rt )
      {
        return rt['title'] || helpers.shortenURI(rt.uri).uri;
      }
    }
    return '';
  }

  this.getSelectedOptionValue = function()
  {

  }

  this.templateOptionList = function(select_obj)
  {
    
    // TODO this is a relict of protocol 3, needs cleanup
    var active_window_id = runtimes.getActiveWindowId();

    if( active_window_id )
    {
      var 
      _runtimes = runtimes.getRuntimes(active_window_id),
      rt = null, 
      i = 0;

      for( ; ( rt = _runtimes[i] ) && !rt['selected']; i++);
      if( !rt && _runtimes[0] )
      {
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 'no runtime selected')
        return;
      }
      return templates.runtimes(_runtimes, 'dom');
    }
    
  }

  this.checkChange = function(target_ele)
  {
    var rt_id = parseInt(target_ele.getAttribute('runtime-id'));

    if( rt_id != dom_data.getDataRuntimeId() )
    {
      if(rt_id)
      {
        dom_data.getDOM(rt_id);
      }
      else
      {
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
          "missing runtime id in cls.DocumentSelect.checkChange")
      }
      return true;
    }
    return false;
  }

  // this.updateElement

  this.init(id);
}


cls.DOMView.create_ui_widgets = function()
{

  new Settings
  (
    // id
    'dom', 
    // kel-value map
    {

      'find-with-click': true,
      'highlight-on-hover': true,
      'update-on-dom-node-inserted': false,
      'force-lowercase': true, 
      'show-comments': true, 
      'show-attributes': true,
      'show-whitespace-nodes': true,
      'dom-tree-style': false,
      'show-siblings-in-breadcrumb': false,
      'show-id_and_classes-in-breadcrumb': true,
      'scroll-into-view-on-spotlight': true,
      'lock-selecked-elements': false
    }, 
    // key-label map
    {
      'find-with-click': ui_strings.S_SWITCH_FIND_ELEMENT_BY_CLICKING,
      'highlight-on-hover': ui_strings.S_SWITCH_HIGHLIGHT_BY_MOUSE_OVER,
      'update-on-dom-node-inserted': ui_strings.S_SWITCH_UPDATE_DOM_ON_NODE_REMOVE,
      'force-lowercase': ui_strings.S_SWITCH_USE_LOWER_CASE_TAG_NAMES, 
      'show-comments': ui_strings.S_SWITCH_SHOW_COMMENT_NODES, 
      'show-attributes': ui_strings.S_SWITCH_SHOW_ATTRIBUTES,
      'show-whitespace-nodes': ui_strings.S_SWITCH_SHOW_WHITE_SPACE_NODES,
      'dom-tree-style': ui_strings.S_SWITCH_SHOW_DOM_INTREE_VIEW,
      'show-siblings-in-breadcrumb': ui_strings.S_SWITCH_SHOW_SIBLINGS_IN_BREAD_CRUMB,
      'show-id_and_classes-in-breadcrumb': ui_strings.S_SWITCH_SHOW_ID_AND_CLASSES_IN_BREAD_CRUMB,
      'scroll-into-view-on-spotlight': ui_strings.S_SWITCH_SCROLL_INTO_VIEW_ON_FIRST_SPOTLIGHT,
      'lock-selecked-elements': ui_strings.S_SWITCH_LOCK_SELECTED_ELEMENTS
    
    },
    // settings map
    {
      checkboxes:
      [
        'force-lowercase',
        'show-comments',
        'show-attributes',
        'show-whitespace-nodes',
        'find-with-click',
        'highlight-on-hover',
        'update-on-dom-node-inserted',
        'show-siblings-in-breadcrumb',
        'show-id_and_classes-in-breadcrumb',
        'scroll-into-view-on-spotlight',
        'lock-selecked-elements'
      ]
    }
  );

  new ToolbarConfig
  (
    'dom',
    [
      {
        handler: 'dom-inspection-snapshot',
        title: ui_strings.S_BUTTON_LABEL_GET_THE_WOHLE_TREE
      },
      {
        handler: 'dom-inspection-export',
        title: ui_strings.S_BUTTON_LABEL_EXPORT_DOM
      }/*,
      {
        handler: 'df-show-live-source',
        title: 'show live source of DF'
      }*/
    ],
    [
      {
        handler: 'dom-text-search',
        title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
      }
    ],
    null,
    [
      {
        handler: 'select-window',
        title: ui_strings.S_BUTTON_LABEL_SELECT_WINDOW,
        type: 'dropdown',
        class: 'window-select-dropdown',
        template: window['cst-selects']['document-select'].getTemplate()
      }
    ]
  )


  new CstSelectToolbarSettings
  (
    'dom', 
    [
      'show-comments',
      'show-whitespace-nodes',
      'dom-tree-style'
    ]
  );

  new Switches
  (
    'dom',
    [
      'find-with-click',
      'highlight-on-hover',
      'update-on-dom-node-inserted',
      'lock-selecked-elements'
    ]
  );

  // button handlers
  eventHandlers.click['dom-inspection-snapshot'] = function(event, target)
  {
    dom_data.getSnapshot();
  };

  eventHandlers.click['df-show-live-source'] = function(event, target)
  {
    debug_helpers.liveSource.open();
  };



  var textSearch = new TextSearch();

  var onViewCreated = function(msg)
  {
    if( msg.id == 'dom' )
    {
      textSearch.setContainer(msg.container);
      textSearch.setFormInput(views.dom.getToolbarControl( msg.container, 'dom-text-search'));
    }
  }

  var onViewDestroyed = function(msg)
  {
    if( msg.id == 'dom' )
    {
      textSearch.cleanup();
      topCell.statusbar.updateInfo();
    }
  }

  var onActionModeChanged = function(msg)
  {
    if( msg.id == 'dom' && msg.mode == 'default' )
    {
      textSearch.revalidateSearch();
    }
  }

  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);
  messages.addListener('action-mode-changed', onActionModeChanged);

  eventHandlers.input['dom-text-search'] = function(event, target)
  {
    textSearch.searchDelayed(target.value);
  }

  eventHandlers.keypress['dom-text-search'] = function(event, target)
  {
    if( event.keyCode == 13 )
    {
      textSearch.highlight();
    }
  }



}





