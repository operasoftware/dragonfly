window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends DOM_markup_style
  */

cls.DOMView = function(id, name, container_class)
{

  this.updateTarget = function(ele, obj_id)
  {
    if (ele)
    {
      var target = document.getElementById('target-element');
      if (target)
        target.removeAttribute('id');
      if (!window.settings.dom.get('dom-tree-style') && /<\//.test(ele.firstChild.textContent))
      {
        while ((ele = ele.previousSibling) && ele.getAttribute('ref-id') != obj_id);
      }
      topCell.statusbar.updateInfo(templates.breadcrumb(dom_data.getCSSPath()));
    }
    if (ele || (ele = document.getElementById('target-element')))
    {
      ele.id = 'target-element';
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        "missing implementation in updateTarget in views['dom-inspector']");
      // TODO
    }
  };

  this.createView = function(container)
  {
    if (this._create_view_no_data_timeout)
    {
      clearTimeout(this._create_view_no_data_timeout);
      this._create_view_no_data_timeout = 0;
    }
    if (dom_data.has_data())
    {
      var target = dom_data.getCurrentTarget();
      var scrollTop = container.scrollTop;      
      container.clearAndRender(window.templates.inspected_dom_node(window.dom_data, target, true));
      if (!this.scrollTargetIntoView())
      {
        container.scrollTop = scrollTop;
      }
      window.topCell.statusbar.updateInfo(templates.breadcrumb(dom_data.getCSSPath()));
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

  this.scrollTargetIntoView = function()
  {
    var target = document.getElementById('target-element'), container = target;
    while (container && !/container/i.test(container.nodeName))
    {
      container = container.parentElement;
    }
    if (target && container)
    {
      container.scrollTop -= (
        container.getBoundingClientRect().top - 
        target.getBoundingClientRect().top +
        Math.min(container.offsetHeight * .5, 100)
      );
      container.scrollLeft = 0;
    }
    return target && container;
  }



  this.updateBreadcrumbLink = function(obj_id)
  {

    var target = document.getElementById('target-element');
    if(target)
    {
      target.removeAttribute('id');
      while( target && !/container/i.test(target.nodeName) && ( target = target.parentElement ) );
      if( target )
      {
        var 
        divs = target.getElementsByTagName('div'),
        div = null,
        i = 0;

        for( ; ( div = divs[i] ) && div.getAttribute('ref-id') != obj_id; i++ );
        if( div )
        {
          div.id = 'target-element';
          this.scrollTargetIntoView();
          if(!this.updateBreadcrumbLink.timeout )
          {
            hostspotlighter.spotlight(obj_id, true);
          }
        }
      }
    }
  }

  this.serializer = new cls.DOMSerializer();

  this.serializeToOuterHTML = function(data)
  {
    return this.serializer[dom_data.isTextHtml() && 'text/html' || 'application/xml'](data);
  }



  this.ondestroy = function()
  {
    hostspotlighter.clearSpotlight();
  }

  this.on_setting_change = function(msg)
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

  messages.addListener('setting-changed', this.on_setting_change.bind(this));



  this.init(id, name, container_class);









  // TODO dupliacted code, see cls.DOMSerializer

  const 
  ID = 0, 
  TYPE = 1, 
  NAME = 2, 
  DEPTH = 3,
  NAMESPACE = 4, 
  VALUE = 7, 
  ATTRS = 5,
  ATTR_PREFIX = 0,
  ATTR_KEY = 1, 
  ATTR_VALUE = 2,
  CHILDREN_LENGTH = 6, 
  PUBLIC_ID = 8,
  SYSTEM_ID = 9,
  INDENT = "  ",
  LINEBREAK = '\n',
  VOID_ELEMENTS =
  {
    'area': 1,
    'base': 1,
    'basefont': 1,
    'bgsound': 1,
    'br': 1,
    'col': 1,
    'embed': 1,
    'frame': 1,
    'hr': 1,
    'img': 1,
    'input': 1,
    'link': 1,
    'meta': 1,
    'param': 1,
    'spacer': 1,
    'wbr': 1,
    'command': 1,
    'event-source': 1,
    'source': 1,
  };

  var getIndent = function(count)
  {
    var ret = '';
    if(count)
    {
      count--;
    }
    while(count)
    {
      ret += INDENT;
      count--;
    }
    return ret;
  }


  this.exportMarkup = function()
  {
    
    var data = dom_data.getData();
    var tree = '', i = 0, node = null, length = data.length;
    var attrs = null, attr = null, k = 0, key = '';
    var is_open = 0;
    var has_only_one_child = 0;
    var one_child_value = ''
    var current_depth = 0;
    var child_pointer = 0;
    var child_level = 0;
    var j = 0;
    var children_length = 0;
    var closing_tags = [];
    var force_lower_case = settings[this.id].get('force-lowercase');
    var show_comments = settings[this.id].get('show-comments');
    var show_attrs = settings[this.id].get('show-attributes');
    var node_name = '';
    var tag_head = '';
    var disregard_force_lower_case_whitelist = cls.EcmascriptDebugger["5.0"].DOMData.DISREGARD_FORCE_LOWER_CASE_WHITELIST;
    var disregard_force_lower_case_depth = 0;

    for( ; node = data[i]; i += 1 )
    {
      while( current_depth > node[DEPTH] )
      {
        tree += closing_tags.pop();
        current_depth--;
      }
      current_depth = node[ DEPTH ];
      children_length = node[ CHILDREN_LENGTH ];
      child_pointer = 0;
      node_name =  ( node[NAMESPACE] ? node[NAMESPACE] + ':': '' ) +  node[ NAME ];

      if (force_lower_case && disregard_force_lower_case_whitelist.indexOf(node[NAME].toLowerCase()) != -1)
      {
        disregard_force_lower_case_depth = node[DEPTH];
        force_lower_case = false;
      }
      else if (disregard_force_lower_case_depth && disregard_force_lower_case_depth == node[DEPTH])
      {
        disregard_force_lower_case_depth = 0;
        force_lower_case = dom_data.isTextHtml() && settings[this.id].get('force-lowercase');
      }

      if( force_lower_case )
      {
        node_name = node_name.toLowerCase();
      }
      switch ( node[ TYPE ] )
      {
        case 1:  // elemets
        {
          attrs = '';
          if( show_attrs )
          {
            for( k = 0; attr = node[ATTRS][k]; k++ )
            {
              attrs += " " + 
                ( attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '' ) + 
                ( force_lower_case ? attr[ATTR_KEY].toLowerCase() : attr[ATTR_KEY] ) + 
                "=\"" + 
                helpers.escapeAttributeHtml(attr[ATTR_VALUE]) +
                "\"";
            }
          }

          child_pointer = i + 1;

          is_open = ( data[ child_pointer ] && ( node[ DEPTH ] < data[ child_pointer ][ DEPTH ] ) );
          if( is_open ) 
          {
            has_only_one_child = 1;
            one_child_value = '';
            child_level = data[ child_pointer ][ DEPTH ];
            for( ; data[child_pointer] &&  data[ child_pointer ][ DEPTH ] == child_level; child_pointer += 1 )
            {
              one_child_value += data[ child_pointer ] [ VALUE ];
              if( data[ child_pointer ][ TYPE ] != 3 )
              {
                has_only_one_child = 0;
                one_child_value = '';
                break;
              }
            }
          }

          if( is_open )
          {
            if( has_only_one_child )
            {
              tree += LINEBREAK  + getIndent(node[ DEPTH ] ) +
                      "&lt;" + node_name +  attrs + "&gt;" +
                      helpers.escapeTextHtml(one_child_value) +
                      "&lt;/" + node_name + "&gt;";
              i = child_pointer - 1;
            }
            else
            {
              tree += LINEBREAK  + getIndent(node[ DEPTH ] ) + 
                      "&lt;" + node_name + attrs + "&gt;";

              closing_tags.push( LINEBREAK  + getIndent(node[ DEPTH ]) + 
                                    "&lt;/" + node_name + "&gt;");
            }

          }
          else // is closed
          {
              // TODO: only output "/>" if it's XML, otherwise ">"
              tree += LINEBREAK + getIndent(node[DEPTH]) +
                      "&lt;" + node_name + attrs + (node_name in VOID_ELEMENTS ? "/>" : ">&lt;/" + node_name + ">");
          }
          break;
        }

        case 7:  // processing instruction
        {
          tree += LINEBREAK  + getIndent(node[ DEPTH ] ) +      
            "&lt;?" + node[NAME] + ( node[VALUE] ? ' ' + node[VALUE] : '' ) + "?&gt;";
          break;

        }

        case 8:  // comments
        {
          if( show_comments )
          {
            if( !/^\s*$/.test(node[ VALUE ] ) )
            {
              tree += LINEBREAK  + getIndent(node[ DEPTH ] ) +      
                      "&lt;!--" + helpers.escapeTextHtml(node[VALUE]) + "--&gt;";
            }
          }
          break;

        }

        case 9:  // document node
        {
          /* makes not too much sense in the markup view
          tree += "<div style='margin-left:" + 16 * node[ DEPTH ] + "px;' " +      
            ">#document</div>";
          */
          break;

        }

        case 10:  // doctype
        {
          tree += LINEBREAK + getIndent(node[ DEPTH ]) +
                  "&lt;!DOCTYPE " + this.getDoctypeName(data) +
                  (node[PUBLIC_ID] ?
                    (" PUBLIC " + "\"" + node[PUBLIC_ID] + "\"") : "") +
                  (!node[PUBLIC_ID] && node[SYSTEM_ID] ?
                    " SYSTEM" : "") +
                  (node[SYSTEM_ID] ?
                    (" \"" + node[SYSTEM_ID] + "\"") : "") +
                  "&gt;";
          break;
        }

        default:
        {
          if( !/^\s*$/.test(node[ VALUE ] ) )
          {
            tree += LINEBREAK  + getIndent(node[ DEPTH ] ) + 
                    helpers.escapeTextHtml(node[VALUE]);
          }
        }

      }
    }
    
    while( closing_tags.length )
    {
      tree += closing_tags.pop();
    }
    return tree;
  }

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

  eventHandlers.click['breadcrumb-link'] = function(event, target)
  {
    var obj_id = parseInt(target.getAttribute('obj-id')); 
    if( obj_id )
    {
      dom_data.setCurrentTarget(obj_id);
      views['dom'].updateBreadcrumbLink(obj_id);
    }
  };

  eventHandlers.mouseover['spotlight-node'] = function(event, target)
  {
    if(settings['dom'].get('highlight-on-hover'))
    {
      hostspotlighter.soft_spotlight(parseInt(target.getAttribute('ref-id')));
    }
  }

}





