var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends DOM_markup_style
  */

cls.DOMView = function(id, name, container_class)
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
  LINEBREAK = '\n',
  VOID_ELEMNTS = 
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
  }

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

  // workaround for bug CORE-16147
  this.getDoctypeName = function(data)
  {
    var node = null, i = 0;
    for( ; node = data[i]; i++)
    {
      if( node[TYPE] == 1 )
      {
        return node[NAME];
      }
    }
  }

  this.updateBreadcrumbLink = function(obj_id)
  {

    var target = document.getElementById('target-element');
    if(target)
    {
      target.removeAttribute('id');
      while( target && !/container/.test(target.nodeName) && ( target = target.parentElement ) );
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
        }
      }
    }
  }

  this.serializer =
  {
    'text/html': function(data)
    {
      const LINEBREAK = '\u200F\r\n';

      var 
      tree = '', 
      i = 0, 
      node = null, 
      length = data.length,
      attrs = '', 
      attr = null, 
      k = 0, 
      key = '',
      is_open = 0,
      has_only_one_child = 0,
      one_child_value = '',
      current_depth = 0,
      child_pointer = 0,
      child_level = 0,
      j = 0,
      children_length = 0,
      closing_tags = [],
      force_lower_case = settings[self.id].get('force-lowercase'),
      node_name = '',
      tag_head = '',
      start_depth = data[0][DEPTH] - 1;

      for( ; node = data[i]; i++ )
      {
        while( current_depth > node[DEPTH] )
        {
          tree += closing_tags.pop();
          current_depth--;
        }
        current_depth = node[DEPTH];
        children_length = node[CHILDREN_LENGTH];
        child_pointer = 0;
        node_name =  node[NAME];
        if( force_lower_case )
        {
          node_name = node_name.toLowerCase();
        }
        switch (node[TYPE])
        {
          case 1: // elemets
          {
            attrs = '';
            for( k = 0; attr = node[ATTRS][k]; k++ )
            {
              attrs += " " + 
                ( force_lower_case ? attr[ATTR_KEY].toLowerCase() : attr[ATTR_KEY] ) + 
                "=\"" + 
                attr[ATTR_VALUE].replace(/"/g, "&quot") + 
                "\"";
            }
            child_pointer = i + 1;
            is_open = ( data[child_pointer] && ( node[DEPTH] < data[child_pointer][DEPTH] ) );
            if( is_open ) 
            {
              has_only_one_child = 1;
              one_child_value = '';
              child_level = data[child_pointer][DEPTH];
              for( ; data[child_pointer] && data[child_pointer][DEPTH] == child_level; child_pointer++ )
              {
                one_child_value += data[child_pointer][VALUE];
                if( data[child_pointer][TYPE] != 3 )
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
                tree += LINEBREAK  + getIndent(node[DEPTH] - start_depth) +
                        "<" + node_name +  attrs + ">" +
                        one_child_value + 
                        "</" + node_name + ">";
                i = child_pointer - 1;
              }
              else
              {
                tree += LINEBREAK  + getIndent(node[DEPTH] - start_depth) + 
                        "<" + node_name + attrs + ">";
                if( !(node_name in VOID_ELEMNTS) )
                {
                  closing_tags.push
                  ( 
                    LINEBREAK  + getIndent(node[DEPTH] - start_depth) + "</" + node_name + ">"
                  );
                }
              }
            }
            else // is closed or empty
            {
              tree +=  LINEBREAK  + getIndent(node[DEPTH] - start_depth) +
                    "<" + node_name + attrs + ">" + 
                    ( node_name in VOID_ELEMNTS ? "" : "</" + node_name + ">" );
            }
            break;
          }
          case 7:  // processing instruction
          {
            tree += LINEBREAK  + getIndent(node[DEPTH] - start_depth) +      
              "<?" + node[NAME] + ( node[VALUE] ? ' ' + node[VALUE] : '' ) + "?>";
            break;
          }
          case 8:  // comments
          {
            tree += LINEBREAK  + getIndent(node[DEPTH] - start_depth) +      
                    "<!--" + ( node[ VALUE ] || ' ' ) + "-->";
            break;
          }
          case 9:  // document node
          {
            break;
          }
          case 10:  // doctype
          {
            tree += LINEBREAK  + getIndent(node[DEPTH] - start_depth) +
                    "<!doctype " + this.getDoctypeName(data) +
                    ( node[PUBLIC_ID] ? 
                      ( " PUBLIC " + "\"" + node[PUBLIC_ID] + "\"" ) :"" ) +
                    ( node[SYSTEM_ID] ?  
                      ( " \"" + node[SYSTEM_ID] + "\"" ) : "" ) +
                    ">";
            break;
          }
          default:
          {
            if( !/^\s*$/.test(node[ VALUE ] ) )
            {
              tree += LINEBREAK  + getIndent(node[DEPTH] - start_depth) + helpers.escapeTextHtml(node[VALUE]);
            }
          }
        }
      }
      while( closing_tags.length )
      {
        tree += closing_tags.pop();
      }
      return tree.replace(/^(?:\u200F\r\n)+/, '');
    },
    'application/xml': function(data)
    {
      return 'application/xml';
    },
  }

  this.serializeToOuterHTML = function(data)
  {
    return this.serializer[dom_data.isTextHtml() && 'text/html' || 'application/xml'](data);
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
                  "&lt;!doctype " + this.getDoctypeName(data) +
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

cls.DOMView.prototype = ViewBase;

new cls.DOMView('dom', ui_strings.M_VIEW_LABEL_DOM, 'scroll dom');

cls.DOMView.prototype.constructor = cls.DOMView;

DOM_markup_style.apply(cls.DOMView.prototype);

new Settings
(
  // id
  'dom', 
  // kel-value map
  {

    'find-with-click': true,
    'highlight-on-hover': false,
    'update-on-dom-node-inserted': false,
    'force-lowercase': true, 
    'show-comments': true, 
    'show-attributes': true,
    'show-whitespace-nodes': true,
    'dom-tree-style': false,
    'show-siblings-in-breadcrumb': false,
    'show-id_and_classes-in-breadcrumb': true
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
    'show-id_and_classes-in-breadcrumb': ui_strings.S_SWITCH_SHOW_ID_AND_CLASSES_IN_BREAD_CRUMB
  
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
      'show-id_and_classes-in-breadcrumb'
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
    }
  ],
  [
    {
      handler: 'dom-text-search',
      title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
    }
  ]/*,
  // test for help button
  [
    {
      handler: 'documentation',
      title: ui_strings.S_BUTTON_LABEL_HELP,
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
};


// filter handlers

(function()
{
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
      topCell.statusbar.updateInfo();
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

})();





messages.post('setting-changed', {id: 'dom', key: 'dom-tree-style'});

eventHandlers.click['breadcrumb-link'] = function(event, target)
{
  // TODO: string or number?
  var obj_id = target.getAttribute('obj-id'); 
  if( obj_id )
  {
    dom_data.setCurrentTarget(obj_id);
    views['dom'].updateBreadcrumbLink(obj_id);
  }
};

eventHandlers.dblclick['dom-edit'] = function(event, target)
{
  alert(event.target.nodeName);
  event.preventDefault();
  event.stopPropagation();
}




