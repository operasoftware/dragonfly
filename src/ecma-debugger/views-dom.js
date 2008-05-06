(function()
{
  var View = function(id, name, container_class)
  {
    var self = this;
    // this was a quick fix to merge DOM tree style and DOM markup style
    // should be cleand up to prevent code duplication ( no private members )
    const 
    ID = 0, 
    TYPE = 1, 
    NAME = 2, 
    DEPTH = 3,
    NAMESPACE = 4, 
    VALUE = 4, 
    ATTRS = 5,
    ATTR_PREFIX = 0,
    ATTR_KEY = 1, 
    ATTR_VALUE = 2,
    CHILDREN_LENGTH = 6, 
    PUBLIC_ID = 4,
    SYSTEM_ID = 5,
    INDENT = "  ",
    LINEBREAK = '\n';

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
                  attr[ATTR_VALUE] + 
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
                        one_child_value + 
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
            tree +=  LINEBREAK  + getIndent(node[ DEPTH ] ) +
                    "&lt;" + node_name + attrs + "&gt;" + "&lt;/" + node_name + "&gt;" ;
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
                        "&lt;!--" + node[ VALUE ] + "--&gt;";
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
            tree += LINEBREAK  + getIndent(node[ DEPTH ] ) +
                    "&lt;!doctype " + getDoctypeName(data) +
                    ( node[PUBLIC_ID] ? 
                      ( " PUBLIC " + "\"" + node[PUBLIC_ID] + "\"" ) :"" ) +
                    ( node[SYSTEM_ID] ?  
                      ( " \"" + node[SYSTEM_ID] + "\"" ) : "" ) +
                    "&gt;";
            break;
          }

          default:
          {
            if( !/^\s*$/.test(node[ VALUE ] ) )
            {
              tree += LINEBREAK  + getIndent(node[ DEPTH ] ) + 
                      node[ VALUE ];
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

    var onSettingChange = function(msg)
    {
      if( msg.id == self.id )
      {
        switch (msg.key)
        {
          case 'dom-tree-style':
          {
            ( settings.dom.get('dom-tree-style') 
              ? DOM_tree_style 
              : DOM_markup_style ).apply(self.constructor.prototype);
            self.clearAllContainers();
            self.update();
            break;
          }
        }
      }
    }

    messages.addListener('setting-changed', onSettingChange);
    this.init(id, name, container_class);

  }

  View.prototype = ViewBase;

  new View('dom', ui_strings.VIEW_LABEL_DOM, 'scroll dom');

  View.prototype.constructor = View;

  DOM_markup_style.apply(View.prototype);

  new Settings
  (
    // id
    'dom', 
    // kel-value map
    {

      'find-with-click': true,
      'highlight-on-hover': false,
      'update-on-dom-node-inserted': false,
      'force-lowercase': false, 
      'show-comments': true, 
      'show-attributes': true,
      'show-whitespace-nodes': true,
      'dom-tree-style': false
    }, 
    // key-label map
    {
      'find-with-click': ui_strings.SWITCH_FIND_ELEMENT_BY_CLICKING,
      'highlight-on-hover': ui_strings.SWITCH_HIGHLIGHT_BY_MOUSE_OVER,
      'update-on-dom-node-inserted': ui_strings.SWITCH_UPDATE_DOM_ON_NODE_REMOVE,
      'force-lowercase': ui_strings.SWITCH_USE_LOWER_CASE_TAG_NAMES, 
      'show-comments': ui_strings.SWITCH_SHOW_COMMENT_NODES, 
      'show-attributes': ui_strings.SWITCH_SHOW_ATTRIBUTES,
      'show-whitespace-nodes': ui_strings.SWITCH_SHOW_WHITE_SPACE_NODES,
      'dom-tree-style': ui_strings.SWITCH_SHOW_DOM_INTREE_VIEW
    
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
        'update-on-dom-node-inserted'
      ]
    }
  );

  new ToolbarConfig
  (
    'dom',
    [
      {
        handler: 'dom-inspection-snapshot',
        title: ui_strings.BUTTON_LABEL_GET_THE_WOHLE_TREE
      },
      {
        handler: 'dom-inspection-export',
        title: ui_strings.BUTTON_LABEL_EXPORT_DOM
      }
    ],
    [
      {
        handler: 'dom-text-search',
        title: ui_strings.INPUT_DEFAULT_TEXT_SEARCH
      }
    ]/*,
    // test for help button
    [
      {
        handler: 'documentation',
        title: ui_strings.BUTTON_LABEL_HELP,
        param: 'http://www.opera.com'
      }
    ]
    */
  )

  new Switches
  (
    'dom',
    [
      'find-with-click',
      'highlight-on-hover',
      'update-on-dom-node-inserted',
      'show-comments',
      'show-whitespace-nodes',
      'dom-tree-style'
    ]
  )

  // button handlers
  eventHandlers.click['dom-inspection-snapshot'] = function(event, target)
  {
    dom_data.getSnapshot();
  }

  // filter handlers
  
  var textSearch = new TextSearch();

  var onViewCreated = function(msg)
  {
    if( msg.id == 'dom' )
    {
      textSearch.setContainer(msg.container);
    }
  }

  var onViewDestroyed = function(msg)
  {
    if( msg.id == 'dom' )
    {
      textSearch.cleanup();
    }
  }

  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);

  eventHandlers.input['dom-text-search'] = function(event, target)
  {
    textSearch.searchDelayed(target.value);
  }

  eventHandlers.keyup['dom-text-search'] = function(event, target)
  {
    if( event.keyCode == 13 )
    {
      textSearch.highlight();
    }
  }

  messages.post('setting-changed', {id: 'dom', key: 'dom-tree-style'});

})()


