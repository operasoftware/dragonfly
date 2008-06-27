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
    string = new String(string), _char = '', i = 0, ret = '';
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

  var getDoctypeName = function(data)
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
      topCell.statusbar.updateInfo(dom_data.getCSSPath());
    }
    else
    {
      opera.postError("missing implementation in updateTarget in views['dom-inspector']");
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

    var tree = '', i = 0, node = null, length = data.length;
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

    var force_lower_case = settings[this.id].get('force-lowercase');
    var show_comments = settings[this.id].get('show-comments');
    var show_attrs = settings[this.id].get('show-attributes');
    var show_white_space_nodes = settings[this.id].get('show-whitespace-nodes');
    var node_name = '';
    var tag_head = '';

    var current_formatting = '';
    var re_formatted = /script|style/i;

    var graphic_arr = [];

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
        case 1:  // elemets
        {
          attrs = '';
          if( show_attrs )
          {
            for( k = 0; attr = node[ATTRS][k]; k++ )
            {
              attrs += " <span class='key'>" + 
                ( attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '' ) + 
                ( force_lower_case ? attr[ATTR_KEY].toLowerCase() : attr[ATTR_KEY] ) + 
                "</span>=<span class='value'>\"" + 
                attr[ATTR_VALUE] + 
                "\"</span>";
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
                    "<span class='node'>" + node_name + attrs + "</span>" +
                    "</div>";


            

          }
          else
          {
          tree += "<div " + ( node[ID] == target ? "id='target-element'" : '' ) + 
                  " style='margin-left:" + 16 * node[DEPTH] + "px;' "+
                  "ref-id='"+node[ID] + "' handler='spotlight-node'>"+
                  ( node[CHILDREN_LENGTH] ? 
                    "<input handler='get-children' type='button' class='close'>" : '' ) +
                  "<span class='node'>" + node_name + attrs + "</span>" +
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
                    "<span class='doctype-value'>" + getDoctypeName(data) + " " +
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
                ( node[NAME] ? node[NAME] :  nodeNameMap[node[TYPE]] ) + ' ' +
                node[VALUE] +
                "</div>";
            }
          }
          else
          {


            tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;'" +
              current_formatting + ">" +
              ( node[NAME] ? node[NAME] :  nodeNameMap[node[TYPE]] ) + ' ' +
              ( /^\s*$/.test( node[VALUE] ) ? _escape(node[VALUE]) : node[VALUE] ) +
              "</div>";
            


          }
        }

      }
    }
    

    

      var scrollTop = container.scrollTop;
      if( !container.firstChild )
      {
        container.render(['div', ['div'], 'class', 'padding'])
      }

      container.firstChild.firstChild.innerHTML = tree;

      container.scrollTop.scrollTop = scrollTop;
      topCell.statusbar.updateInfo(dom_data.getCSSPath());
      
    }


}