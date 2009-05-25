/**
  * @constructor 
  * @extends ViewBase
  * @see DOM_markup_style this class can be dynamically exchanged with DOM_markup_style
  */

var DOM_tree_style = function(id, name, container_class)
{
  var self = this;

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
    SYSTEM_ID = 5;

  var map = 
  {   
    '\t': '\\t',
    '\v': '\\v',
    '\f': '\\f',
    '\u0020': '\\u0020',
    '\u00A0': '\\u00A0',
    '\r': '\\r',
    '\n': '\\n',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
  };

  var _escape = function(string)
  {
    string = new String(string);
    var _char = '', i = 0, ret = '';
    for( ; _char = string.charAt(i); i++ )
    {
      ret += map[_char];
    }
    return ret;
  }

  var nodeNameMap =
  {
    3: "<span class='text-node'>#text</span>",
    4: "<span class='cdata-node'>#cdata-section</span>"
  }

  var div_padding_value = 0;

  this.scrollTargetIntoView = function()
  {
    var target = document.getElementById('target-element');
    if(target)
    {
      document.getElementById('target-element').scrollIntoView();
      while( !/container/.test(target.nodeName) && ( target = target.parentElement) );
      if(target)
      {
        target.scrollTop -= 100;
      }
    }
  }

  this.updateTarget = function(ele)
  {
    if(ele)
    {
      var target = document.getElementById('target-element');
      if(target)
      {
        target.removeAttribute('id');
      }
      ele.id = 'target-element';
      topCell.statusbar.updateInfo(templates.breadcrumb(dom_data.getCSSPath()));
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        "missing implementation in updateTarget in views['dom-inspector']");
      // TODO
    }
  }

  this.createView = function(container)
  {
    if( !container.hasClass('tree-style') )
    {
      container.addClass('tree-style');
    }
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
    SYSTEM_ID = 5;

    var data = dom_data.getData();

    var target = dom_data.getCurrentTarget();

    var
    tree = "<div class='padding' edit-handler='edit-dom' rt-id='" + dom_data.getDataRuntimeId() + "'><div>",
    i = 0,
    node = null, 
    length = data.length;

    var scrollTop = document.documentElement.scrollTop;

    var attrs = null, key = '';

    var is_open = 0;
    var has_only_one_child = 0;
    var one_child_value = ''
    var current_depth = 0;
    var child_pointer = 0;
    var child_level = 0;
    var j = 0;
    var k = 0;

    var children_length = 0;

    var closing_tags = [];

    var force_lower_case = dom_data.isTextHtml() && settings[this.id].get('force-lowercase');
    var show_comments = settings[this.id].get('show-comments');
    var show_attrs = settings[this.id].get('show-attributes');
    var show_white_space_nodes = settings[this.id].get('show-whitespace-nodes');
    var node_name = '';
    var tag_head = '';

    var current_formatting = '';
    var re_formatted = /script|style/i;
    var scrollTop = 0;
    var container_scroll_width = 0;
    var container_first_child = null;
    var style = null;
    var is_not_script_node = true;

    var graphic_arr = [];
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
        current_depth = node[DEPTH];
        children_length = node[ CHILDREN_LENGTH ];
        child_pointer = 0;
        node_name = ( node[NAMESPACE] ? node[NAMESPACE] + ':': '' ) + node[ NAME ];

        if( force_lower_case )
        {
          node_name = node_name.toLowerCase();
        }
        
        switch ( node[TYPE] )
        {
          case 1:  // elements
          {
            is_not_script_node = node[NAME].toLowerCase() != 'script';
            attrs = '';
            if( show_attrs )
            {
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

            child_pointer = i + 1;

            is_open = ( data[ child_pointer ] && ( node[DEPTH] < data[child_pointer][DEPTH] ) );
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

              tree += "<div " + ( node[ID] == target ? "id='target-element'" : '' ) + 
                      " style='margin-left:" + 16 * node[DEPTH] + "px;' "+
                      "ref-id='"+node[ID] + "' handler='spotlight-node'>"+
                      ( children_length && !has_only_one_child ? 
                        "<input handler='get-children' type='button' class='open'>" : '' ) +
                      "<node>" + node_name + attrs + "</node>" +
                      "</div>";


              

            }
            else
            {
            tree += "<div " + ( node[ID] == target ? "id='target-element'" : '' ) + 
                    " style='margin-left:" + 16 * node[DEPTH] + "px;' "+
                    "ref-id='"+node[ID] + "' handler='spotlight-node'>"+
                    ( node[CHILDREN_LENGTH] ? 
                      "<input handler='get-children' type='button' class='close'>" : '' ) +
                    "<node>" + node_name + attrs + "</node>" +
                    "</div>";
            }

            current_formatting = re_formatted.test(node_name) &&  " class='pre-wrap'" || "";
            break;
          }

          case 8:  // comments
          {
            if( show_comments )
            {
              tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;' " +      
                      "class='comment pre-wrap'><span class='comment-node'>#comment</span>" + 
                node[VALUE] + "</div>";



            }
            break;

          }
          
          case 9:  // comments
          {

              tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;' " +      
                      "><span class='document-node'>#document</span></div>";

            
            break;

          }

          case 10:  // doctype
          {
            tree += "<div style='margin-left:" + 16 * node[ DEPTH ] + "px;' class='doctype'>"+
                      "<span class='doctype-value'>" + this.getDoctypeName(data) + " " +
                      ( node[PUBLIC_ID] ? 
                        ( " PUBLIC " + "\"" + node[PUBLIC_ID] + "\"" ) :"" ) +
                      ( node[SYSTEM_ID] ?  
                        ( " \"" + node[SYSTEM_ID] + "\"" ) : "" ) +
                      "</span></div>";


            break;
          }

          default:
          {
            if( !( show_white_space_nodes ) && ( node[TYPE] == 3 ) )
            {
              if( !/^\s*$/.test( node[VALUE] ) ) 
              {
                 tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;'" +
                   current_formatting + ">" +
                  ( node[NAME] ? node[NAME] :  nodeNameMap[node[TYPE]] ) + 
                  "<text" + ( is_not_script_node ? " ref-id='" + node[ID]+  "' " : "" ) + ">" + 
                    node[VALUE] + "</text>" +
                  "</div>";
              }
            }
            else
            {


              tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;'" +
                current_formatting + ">" +
                ( node[NAME] ? node[NAME] :  nodeNameMap[node[TYPE]] ) + 
                "<text" + ( is_not_script_node ? " ref-id='" + node[ID]+  "' " : "" ) + ">" + 
                  ( /^\s*$/.test( node[VALUE] ) ? _escape(node[VALUE]) : node[VALUE] ) + 
                "</text>" +
                "</div>";
              


            }
          }

        }
      }
    
    

    


      tree += "</div></div>";
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
      topCell.statusbar.updateInfo(templates.breadcrumb(dom_data.getCSSPath()));
    }
      
  }


}