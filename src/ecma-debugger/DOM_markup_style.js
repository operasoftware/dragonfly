/**
  * @constructor 
  * @extends ViewBase
  * @see DOM_tree_style this class can be dynamically exchanged with DOM_tree_style
  */

var DOM_markup_style = function(id, name, container_class)
{
  var self = this;

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
  };

  var div_padding_value = 0;

  var spotlightElement = function()
  {
    hostspotlighter.spotlight(parseInt(this.getAttribute('ref-id')));
  }

  var clearSpotlightElement = function()
  {
    hostspotlighter.clearSpotlight();
  }

  this.updateTarget = function(ele, obj_id)
  {
    if(ele)
    {
      var target = document.getElementById('target-element');
      if(target)
      {
        target.removeAttribute('id');
        target.removeEventListener('mouseover', spotlightElement, false);
        target.removeEventListener('mouseout', clearSpotlightElement, false);
      }
      if(/<\//.test(ele.firstChild.nodeValue))
      {
        while( ( ele = ele.previousSibling ) && ele.getAttribute('ref-id') != obj_id );
      }
      topCell.statusbar.updateInfo
      (
        // the same template is used with inner html
        templates.breadcrumb(dom_data.getCSSPath()).
          concat(['onmouseover', helpers.breadcrumbSpotlight, 
                  'onmouseout', helpers.breadcrumbClearSpotlight])  
      );
    }
    if(ele || ( ele = document.getElementById('target-element') ) )
    {
      ele.id = 'target-element';
      ele.addEventListener('mouseover', spotlightElement, false);
      ele.addEventListener('mouseout', clearSpotlightElement, false);
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "missing implementation in updateTarget in views['dom-inspector']");
      // TODO
    }
  }

  var formatProcessingInstructionValue = function(str, force_lower_case)
  {
    
    var r_attrs = str.split(' '), r_attr = '', i=0, attrs = '', attr = null;
    
    for( ; i < r_attrs.length; i++)
    {
      if(r_attr = r_attrs[i])
      {
        attr = r_attr.split('=');
        attrs += " <key>" + 
          ( force_lower_case ? attr[0].toLowerCase() : attr[0] ) + 
          "</key>=<value>" + 
          attr[1] + 
          "</value>";
      }
    }
    return attrs;
  }


  this.createView = function(container)
  {
    if( container.hasClass('tree-style') )
    {
      container.removeClass('tree-style');
    }
    var data = dom_data.getData();

    var 
    tree = "<div class='padding' edit-handler='edit-dom' rt-id='" + dom_data.getDataRuntimeId() + "'>", 
    i = 0, 
    node = null, 
    length = data.length;
    
    var target = dom_data.getCurrentTarget();

    var attrs = null, attr = null, k = 0, key = '';

    var is_open = 0;
    var has_only_one_child = 0;
    var one_child_id = "";
    var one_child_value = ''
    var current_depth = 0;
    var child_pointer = 0;
    var child_level = 0;
    var j = 0;
    var children_length = 0;

    var closing_tags = [];

    

    var force_lower_case = dom_data.isTextHtml() && settings[this.id].get('force-lowercase');
    var show_comments = settings[this.id].get('show-comments');
    var show_attrs = settings[this.id].get('show-attributes');
    var node_name = '';
    var tag_head = '';
    var class_name = '';
    var re_formatted = /script|style|#comment/i;
    var scrollTop = 0;
    var container_scroll_width = 0;
    var container_first_child = null;
    var style = null;
    var is_not_script_node = true;
    var is_debug = ini.debug;
    
    if(!data.length)
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
    else
    {
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
        node_name =  ( node[NAMESPACE] ? node[NAMESPACE] + ':': '' ) +  node[NAME];
        if( force_lower_case )
        {
          node_name = node_name.toLowerCase();
        }
        switch ( node[TYPE] )
        {
          case 1:  // elements
          {
            is_not_script_node = node[NAME].toLowerCase() != 'script';
            if( show_attrs )
            {
              attrs = '';
              for( k = 0; attr = node[ATTRS][k]; k++ )
              {

                attrs += " <key>" + 
                  ( attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '' ) + 
                  ( force_lower_case ? attr[ATTR_KEY].toLowerCase() : attr[ATTR_KEY] ) +
                  "</key>=<value" + 
                    ( /^href|src$/i.test(attr[ATTR_KEY])
                      ? " handler='dom-resource-link'"
                      : "" ) + ">\"" + 
                    attr[ATTR_VALUE] + 
                    "\"</value>";
              }
            }
            else
            {
              attrs = '';
            }

            child_pointer = i + 1;

            is_open = ( data[ child_pointer ] && ( node[ DEPTH ] < data[ child_pointer ][ DEPTH ] ) );
            if( is_open ) 
            {
              has_only_one_child = 1;
              one_child_value = '';
              child_level = data[child_pointer][DEPTH];
              for( ; data[child_pointer] &&  data[child_pointer][DEPTH] == child_level; child_pointer += 1 )
              {
                one_child_value += data[child_pointer][VALUE];
                one_child_id = data[child_pointer][ID];
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
                class_name = re_formatted.test(node_name) ? " class='pre-wrap'" : '';
                tree += "<div " + ( node[ ID ] == target ? "id='target-element'" : '' ) + 
                        " style='margin-left:" + 16 * node[DEPTH] + "px;' "+
                        "ref-id='" + node[ ID ] + "' handler='spotlight-node' " +
                        class_name + ">"+
                        "<node>&lt;" + node_name +  attrs + "&gt;</node>" +
                  // TODO text node is a different node
                        "<text" +
                          ( is_not_script_node ? " ref-id='" + one_child_id + "' " : "" ) +
                          "'>" + one_child_value + "</text>" +
                        "<node>&lt;/" + node_name + "&gt;</node>" +
                        ( is_debug && ( " <d>[" + node[ ID ] +  "]</d>" ) || "" ) +
                        "</div>";
                i = child_pointer - 1;
              }
              else
              {
                tree += "<div " + ( node[ ID ] == target ? "id='target-element'" : '' ) + 
                        " style='margin-left:" + 16 * node[ DEPTH ] + "px;' "+
                        "ref-id='"+node[ ID ] + "' handler='spotlight-node'>"+
                        ( node[ CHILDREN_LENGTH ] ? 
                          "<input handler='get-children' type='button' class='open'>" : '' ) +
                        "<node>&lt;" + node_name + attrs + "&gt;</node>" +
                        ( is_debug && ( " <d>[" + node[ ID ] +  "]</d>" ) || "" ) +
                        "</div>";

                closing_tags.push("<div style='margin-left:" + 
                                  ( 16 * node[ DEPTH ] ) + "px;' " +
                                  "ref-id='"+node[ ID ] + "' handler='spotlight-node'><node>" +
                                  "&lt;/" + node_name + "&gt;" +
                                  "</node></div>");
              }

            }
            else
            {
            tree += "<div " + ( node[ ID ] == target ? "id='target-element'" : '' ) + 
                    " style='margin-left:" + 16 * node[ DEPTH ] + "px;' "+
                    "ref-id='"+ node[ ID ] + "' handler='spotlight-node'>"+
                    ( children_length ? 
                      "<input handler='get-children' type='button' class='close'>" : '' ) +
                    "<node>&lt;" + node_name + attrs + ( children_length ? '' : '/' ) + "&gt;</node>" +
                    ( is_debug && ( " <d>[" + node[ ID ] +  "]</d>" ) || "" ) +
                    "</div>";
            }
            break;
          }

          case 7:  // processing instruction
          {
            tree += "<div style='margin-left:" + 16 * node[ DEPTH ] + "px;' " +      
              "class='processing-instruction'>&lt;?" + node[NAME] + ' ' + 
              formatProcessingInstructionValue(node[VALUE], force_lower_case) + "?&gt;</div>";
            break;

          }

          case 8:  // comments
          {
            if( show_comments )
            {
              if( !/^\s*$/.test(node[ VALUE ] ) )
              {
                tree += "<div style='margin-left:" + 16 * node[ DEPTH ] + "px;' " +      
                        "class='comment pre-wrap'>&lt;!--" + node[ VALUE ] + "--&gt;</div>";
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
            tree += "<div style='margin-left:" + 16 * node[ DEPTH ] + "px;' class='doctype'>"+
                    "&lt;!doctype <doctype-attrs>" + node[NAME] +
                    ( node[PUBLIC_ID] ? 
                      ( " PUBLIC " + "\"" + node[PUBLIC_ID] + "\"" ) :"" ) +
                    ( node[SYSTEM_ID] ?  
                      ( " \"" + node[SYSTEM_ID] + "\"" ) : "" ) +
                    "</doctype-attrs>&gt;</div>";
            break;
          }

          default:
          {
            if( !/^\s*$/.test(node[ VALUE ] ) )
            {
              tree += 
                "<div style='margin-left:" + ( 16 * node[ DEPTH ] )  + "px;'>" + 
                  "<text" + 
                      ( is_not_script_node ? " ref-id='"+ node[ID] + "' " : "" ) + 
                      ">" + node[ VALUE ] + "</text>" +
                "</div>";
            }
          }

        }
      }
      
      while( closing_tags.length )
      {
        tree += closing_tags.pop();
      }
      tree += "</div>";
      scrollTop = container.scrollTop;
      container.innerHTML = tree;
      container.scrollTop = scrollTop;
      container_scroll_width = container.scrollWidth;
      container_first_child = container.firstChild;
      // preformatted text is in a span
      // that does just add to the scroll width but does not expand the container
      if( container_scroll_width > container_first_child.offsetWidth )
      {
        if( !div_padding_value )
        {
          style = getComputedStyle(container_first_child, null);
          div_padding_value = \
            parseInt( style.getPropertyValue('padding-left') ) +
            parseInt( style.getPropertyValue('padding-right') );
        }
        container.firstChild.style.width = ( container_scroll_width - div_padding_value ) + 'px';
        setTimeout(function(){container.scrollLeft = 0;}, 0);
      }
      this.updateTarget();
      topCell.statusbar.updateInfo(templates.breadcrumb(dom_data.getCSSPath()).
          concat(['onmouseover', helpers.breadcrumbSpotlight, 
                  'onmouseout', helpers.breadcrumbClearSpotlight]));
    }
  }



}


