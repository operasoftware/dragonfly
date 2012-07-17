window.cls || (window.cls = {});

window.cls.DOMSerializer = function(){};

window.cls.DOMSerializer.prototype = new function()
{

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
    if (count)
    {
      count--;
    }
    while (count > 0)
    {
      ret += INDENT;
      count--;
    }
    return ret;
  };

  this['text/html'] = function(model, is_xml)
  {
    const LINEBREAK = '\r\n';

    var
    data = model.getData(),
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
    force_lower_case = window.settings.dom.get('force-lowercase'),
    node_name = '',
    tag_head = '',
    start_depth = data[0][DEPTH] - 1,
    disregard_force_lower_case_whitelist =
      cls.EcmascriptDebugger["6.0"].DOMData.DISREGARD_FORCE_LOWER_CASE_WHITELIST,
    disregard_force_lower_case_depth = 0;

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

      if (force_lower_case && disregard_force_lower_case_whitelist.indexOf(node[NAME].toLowerCase()) != -1)
      {
        disregard_force_lower_case_depth = node[DEPTH];
        force_lower_case = false;
      }
      else if (disregard_force_lower_case_depth && disregard_force_lower_case_depth == node[DEPTH])
      {
        disregard_force_lower_case_depth = 0;
        force_lower_case = model.isTextHtml() && window.settings.dom.get('force-lowercase');
      }

      if( force_lower_case )
      {
        node_name = node_name.toLowerCase();
      }
      switch (node[TYPE])
      {
        case 0: // pseudos
        {
          break;
        }
        case 1: // elements
        {
          attrs = '';
          for( k = 0; attr = node[ATTRS][k]; k++ )
          {
            attrs += " " +
              (attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '') +
              ( force_lower_case ? attr[ATTR_KEY].toLowerCase() : attr[ATTR_KEY] ) +
              "=\"" +
              attr[ATTR_VALUE].replace(/"/g, "&quot;") +
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
                        helpers.escapeTextHtml(one_child_value) +
                      "</" + node_name + ">";
              i = child_pointer - 1;
            }
            else
            {
              tree += LINEBREAK  + getIndent(node[DEPTH] - start_depth) +
                      "<" + node_name + attrs + ">";
              if( !(node_name in VOID_ELEMENTS) ) // TODO: why?
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
            tree +=  LINEBREAK  + getIndent(node[DEPTH] - start_depth) + "<" + node_name + attrs +
              ( is_xml && "/>" || ">" +  ( node_name in VOID_ELEMENTS ? "" : "</" + node_name + ">" ) );
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
          tree += LINEBREAK + getIndent(node[DEPTH] - start_depth) +
                  "<!DOCTYPE " + node[NAME] +
                  (node[PUBLIC_ID] ?
                    (" PUBLIC " + "\"" + node[PUBLIC_ID] + "\"") : "") +
                  (!node[PUBLIC_ID] && node[SYSTEM_ID] ?
                    " SYSTEM" : "") +
                  (node[SYSTEM_ID] ?
                    (" \"" + node[SYSTEM_ID] + "\"") : "") +
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
    return tree.replace(/^(?:\r\n)+/, '');
  };

  this['application/xml'] = function(model)
  {
    // TODO
    return this['text/html'](model, true);
  };

  this.serialize = function(model /* of type InspectableDOMNode */)
  {
    return this[model.get_mime()](model);
  }
};
