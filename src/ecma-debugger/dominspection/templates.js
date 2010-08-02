(function()
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
  LINEBREAK = '\n';

  var formatProcessingInstructionValue = function(str, force_lower_case)
  {
    var r_attrs = str.split(' '), r_attr = '', i=0, attrs = '', attr = null;

    for ( ; i < r_attrs.length; i++)
    {
      if (r_attr = r_attrs[i])
      {
        attr = r_attr.split('=');
        attrs += " <key>" +
          (force_lower_case ? attr[0].toLowerCase() : attr[0]) +
          "</key>=<value>" +
          attr[1] +
          "</value>";
      }
    }
    return attrs;
  };

  this._inspected_dom_node_markup_style= function(model, target, editable)
  {

    var data = model.getData();
    var tree = "<div class='padding table-cell dom'" +
               (editable ? " edit-handler='edit-dom'" : "") + 
               " rt-id='" + model.getDataRuntimeId() + "'" +
               " data-model-id='" + model.id + "'" +
               ">";
    var i = 0;
    var node = null;
    var length = data.length;
    var attrs = null, attr = null, k = 0, key = '';
    var is_open = 0;
    var has_only_one_child = 0;
    var one_child_text_content = '';
    var current_depth = 0;
    var child_pointer = 0;
    var child_level = 0;
    var j = 0;
    var children_length = 0;
    var closing_tags = [];
    var force_lower_case = model.isTextHtml() && window.settings.dom.get('force-lowercase');
    var show_comments = window.settings.dom.get('show-comments');
    var show_attrs = window.settings.dom.get('show-attributes');
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
    var disregard_force_lower_case_whitelist = cls.EcmascriptDebugger["5.0"].DOMData.DISREGARD_FORCE_LOWER_CASE_WHITELIST;
    var disregard_force_lower_case_depth = 0;

    for ( ; node = data[i]; i += 1)
    {
      while(current_depth > node[DEPTH])
      {
        tree += closing_tags.pop();
        current_depth--;
      }
      current_depth = node[DEPTH];
      children_length = node[CHILDREN_LENGTH];
      child_pointer = 0;
      node_name = (node[NAMESPACE] ? node[NAMESPACE] + ':': '') + node[NAME];

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

      if (force_lower_case)
      {
        node_name = node_name.toLowerCase();
      }

      switch (node[TYPE])
      {
        case 1:  // elements
        {
          is_not_script_node = node[NAME].toLowerCase() != 'script';
          if (show_attrs)
          {
            attrs = '';
            for (k = 0; attr = node[ATTRS][k]; k++)
            {
              attrs += " <key>" +
                ((attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '') +
                /* regarding escaping "<". it happens that there are very starnge keys in broken html.
                    perhaps we will have to extend the escaping to other data tokens as well */
                (force_lower_case ? attr[ATTR_KEY].toLowerCase() : attr[ATTR_KEY])).replace(/</g, '&lt;') +
                "</key>=<value" +
                  (/^href|src$/i.test(attr[ATTR_KEY])
                    ? " handler='dom-resource-link'"
                    : "") + ">\"" +
                  helpers.escapeAttributeHtml(attr[ATTR_VALUE]) +
                  "\"</value>";
            }
          }
          else
          {
            attrs = '';
          }
          child_pointer = i + 1;
          is_open = (data[child_pointer] && (node[DEPTH] < data[child_pointer][DEPTH]));
          if (is_open)
          {
            has_only_one_child = 1;
            one_child_text_content = '';
            child_level = data[child_pointer][DEPTH];
            for ( ; data[child_pointer] && data[child_pointer][DEPTH] == child_level; child_pointer += 1)
            {
              if (data[child_pointer][TYPE] != 3)
              {
                has_only_one_child = 0;
                one_child_text_content = '';
                break;
              }
              // perhaps this needs to be adjusted. a non-closed (e.g. p) tag
              // will create an additional CRLF text node, that means the text nodes are not normalized.
              // in markup view it doesn't make sense to display such a node, still we have to ensure
              // that there is at least one text node.
              // perhaps there are other situation with not-normalized text nodes,
              // with the following code each of them will be a single text node,
              // if they contain more than just white space.
              // for exact DOM representation it is anyway better to use the DOM tree style.
              if (!one_child_text_content || !/^\s*$/.test(data[child_pointer][VALUE]))
              {
                one_child_text_content += "<text" +
                  (is_not_script_node ? " ref-id='" + data[child_pointer][ID] + "' " : "") +
                  ">" + helpers.escapeTextHtml(data[child_pointer][VALUE]) + "</text>";
              }
            }
          }

          if (is_open)
          {
            if (has_only_one_child)
            {
              class_name = re_formatted.test(node_name) ? " class='pre-wrap'" : '';
              tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                      " style='margin-left:" + 16 * node[DEPTH] + "px;' "+
                      "ref-id='" + node[ID] + "' handler='spotlight-node' " +
                      class_name + ">"+
                          "<node>&lt;" + node_name + attrs + "&gt;</node>" +
                              one_child_text_content +
                          "<node>&lt;/" + node_name + "&gt;</node>" +
                          (is_debug && (" <d>[" + node[ID] + "]</d>" ) || "") +
                      "</div>";
              i = child_pointer - 1;
            }
            else
            {
              tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                      " style='margin-left:" + 16 * node[DEPTH] + "px;' " +
                      "ref-id='" + node[ID] + "' handler='spotlight-node'>" +
                      (node[CHILDREN_LENGTH] ?
                          "<input handler='get-children' type='button' class='open'>" : '') +
                          "<node>&lt;" + node_name + attrs + "&gt;</node>" +
                      (is_debug && (" <d>[" + node[ID] + "]</d>" ) || "") +
                      "</div>";

              closing_tags.push("<div style='margin-left:" +
                                (16 * node[DEPTH]) + "px;' " +
                                "ref-id='" + node[ID] + "' handler='spotlight-node'><node>" +
                                "&lt;/" + node_name + "&gt;" +
                                "</node></div>");
            }
          }
          else
          {
              tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                      " style='margin-left:" + 16 * node[DEPTH] + "px;' " +
                      "ref-id='" + node[ID] + "' handler='spotlight-node'>" +
                      (children_length ?
                          "<input handler='get-children' type='button' class='close'>" : '') +
                          "<node>&lt;" + node_name + attrs + (children_length ? '' : '/') + "&gt;</node>" +
                      (is_debug && (" <d>[" + node[ID] + "]</d>" ) || "") +
                      "</div>";
          }
          break;
        }

        case 7:  // processing instruction
        {
          tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;' " +
            "class='processing-instruction'>&lt;?" + node[NAME] + ' ' +
            formatProcessingInstructionValue(node[VALUE], force_lower_case) + "?&gt;</div>";
          break;

        }

        case 8:  // comments
        {
          if (show_comments)
          {
            if (!/^\s*$/.test(node[VALUE]))
            {
              tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;' " +
                      "class='comment pre-wrap'>&lt;!--" + helpers.escapeTextHtml(node[VALUE]) + "--&gt;</div>";
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
          tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;' class='doctype'>" +
                  "&lt;!DOCTYPE <doctype-attrs>" + node[NAME] +
                  (node[PUBLIC_ID] ?
                    (" PUBLIC " + "\"" + node[PUBLIC_ID] + "\"") : "") +
                  (!node[PUBLIC_ID] && node[SYSTEM_ID] ?
                    " SYSTEM" : "") +
                  (node[SYSTEM_ID] ?
                    (" \"" + node[SYSTEM_ID] + "\"") : "") +
                  "</doctype-attrs>&gt;</div>";
          break;
        }

        default:
        {
          if (!/^\s*$/.test(node[ VALUE ]))
          {
            tree += "<div style='margin-left:" + (16 * node[DEPTH])  + "px;'>" +
                    "<text" +
                    (is_not_script_node ? " ref-id='"+ node[ID] + "' " : "") +
                    ">" + helpers.escapeTextHtml(node[VALUE]) + "</text>" +
                    "</div>";
          }
        }
      }
    }

    while (closing_tags.length)
    {
      tree += closing_tags.pop();
    }
    tree += "</div>";
    return tree;
  }

  var nodeNameMap =
  {
    3: "<span class='text-node'>#text</span>",
    4: "<span class='cdata-node'>#cdata-section</span>"
  };

  var _escape = function(string)
  {
    var 
    _char = '', 
    i = 0, 
    map =
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
    },
    ret = '';

    for ( ; _char = string.charAt(i); i++)
      ret += map[_char];
    return ret;
  };

  this._inspected_dom_node_tree_style = function(model, target, editable)
  {

    var data = model.getData();
    var force_lower_case = model.isTextHtml() && window.settings.dom.get('force-lowercase');
    var show_comments = window.settings.dom.get('show-comments');
    var show_attrs = window.settings.dom.get('show-attributes');
    var show_white_space_nodes = window.settings.dom.get('show-whitespace-nodes');
    var tree = "<div class='padding table-cell dom'" +
               (editable ? " edit-handler='edit-dom'" : "") + 
               " rt-id='" + model.getDataRuntimeId() + "'" +
               " data-model-id='" + model.id + "'" +
               "><div class='tree-style'>";
    var i = 0, node = null, length = data.length;
    var scrollTop = 0;
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
    var node_name = '';
    var tag_head = '';
    var current_formatting = '';
    var re_formatted = /script|style/i;
    var scrollTop = 0;
    var container_scroll_width = 0;
    var container_first_child = null;
    var style = null;
    var is_not_script_node = true;
    var disregard_force_lower_case_whitelist = cls.EcmascriptDebugger["5.0"].DOMData.DISREGARD_FORCE_LOWER_CASE_WHITELIST;
    var disregard_force_lower_case_depth = 0;
    var graphic_arr = [];

    for ( ; node = data[i]; i += 1)
    {
      current_depth = node[DEPTH];
      children_length = node[CHILDREN_LENGTH];
      child_pointer = 0;
      node_name = (node[NAMESPACE] ? node[NAMESPACE] + ':': '') + node[NAME];

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

      if (force_lower_case)
      {
        node_name = node_name.toLowerCase();
      }

      switch (node[TYPE])
      {
        case 1:  // elements
        {
          is_not_script_node = node[NAME].toLowerCase() != 'script';
          attrs = '';
          if (show_attrs)
          {
            for (k = 0; attr = node[ATTRS][k]; k++)
            {
              attrs += " <key>" +
                (attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '') +
                /* regarding escaping "<". it happens that there are very starnge keys in broken html.
                   perhaps we will have to extend the escaping to other data tokens as well */
                (force_lower_case ? attr[ATTR_KEY].toLowerCase() : attr[ATTR_KEY] ).replace(/</g, '&lt;') +
                "</key>=<value" +
                    (/^href|src$/i.test(attr[ATTR_KEY])
                      ? " handler='dom-resource-link'"
                      : "" ) + ">\"" +
                    helpers.escapeAttributeHtml(attr[ATTR_VALUE]) +
                "\"</value>";
            }
          }

          child_pointer = i + 1;

          is_open = (data[child_pointer] && (node[DEPTH] < data[child_pointer][DEPTH]));
          if (is_open)
          {
            has_only_one_child = 1;
            one_child_value = '';
            child_level = data[child_pointer][DEPTH];
            for ( ; data[child_pointer] && data[child_pointer][DEPTH] == child_level; child_pointer += 1)
            {
              one_child_value += data[child_pointer][VALUE];
              if (data[child_pointer][TYPE] != 3)
              {
                has_only_one_child = 0;
                one_child_value = '';
                break;
              }
            }
          }

          if (is_open)
          {
            tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                    " style='margin-left:" + 16 * node[DEPTH] + "px;' " +
                    "ref-id='"+node[ID] + "' handler='spotlight-node'>" +
                    (children_length && !has_only_one_child ?
                      "<input handler='get-children' type='button' class='open'>" : '') +
                    "<node>" + node_name + attrs + "</node>" +
                    "</div>";
          }
          else
          {
            tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                    " style='margin-left:" + 16 * node[DEPTH] + "px;' " +
                    "ref-id='"+node[ID] + "' handler='spotlight-node'>" +
                    (node[CHILDREN_LENGTH] ?
                      "<input handler='get-children' type='button' class='close'>" : '') +
                    "<node>" + node_name + attrs + "</node>" +
                    "</div>";
          }
          current_formatting = re_formatted.test(node_name) &&  " class='pre-wrap'" || "";
          break;
        }

        case 8:  // comments
        {
          if (show_comments)
          {
            tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;' " +
                    "class='comment pre-wrap'><span class='comment-node'>#comment</span>" +
                    helpers.escapeTextHtml(node[VALUE]) + "</div>";
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
          tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;' class='doctype'>" +
                    "<span class='doctype-value'>" + model.getDoctypeName(data) + " " +
                    (node[PUBLIC_ID] ?
                      (" PUBLIC " + "\"" + node[PUBLIC_ID] + "\"") : "") +
                    (node[SYSTEM_ID] ?
                      (" \"" + node[SYSTEM_ID] + "\"") : "") +
                    "</span></div>";
          break;
        }

        default:
        {
          if (!(show_white_space_nodes) && (node[TYPE] == 3))
          {
            if (!/^\s*$/.test(node[VALUE]))
            {
               tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;'" +
                       current_formatting + ">" +
                       (node[NAME] ? node[NAME] : nodeNameMap[node[TYPE]]) +
                       "<text" + (is_not_script_node ? " ref-id='" + node[ID] + "' " : "") + ">" +
                         helpers.escapeTextHtml(node[VALUE]) + "</text>" +
                       "</div>";
            }
          }
          else
          {
            tree += "<div style='margin-left:" + 16 * node[DEPTH] + "px;'" +
                    current_formatting + ">" +
                    (node[NAME] ? node[NAME] : nodeNameMap[node[TYPE]]) +
                      "<text" + (is_not_script_node ? " ref-id='" + node[ID]+  "' " : "") + ">" +
                        (/^\s*$/.test(node[VALUE]) ? _escape(node[VALUE]) : helpers.escapeTextHtml(node[VALUE])) +
                      "</text>" +
                    "</div>";
          }
        }
      }
    }
    tree += "</div></div>";
    return tree;
  }

  this.inspected_dom_node = function(model, target, editable)
  {
    return (window.settings.dom.get('dom-tree-style') ?
           this._inspected_dom_node_tree_style(model, target, editable) :
           this._inspected_dom_node_markup_style(model, target, editable));
  }

  this._offsets = function(value, index)
  {
    if (!this._OFFSETS)
      this._OFFSETS = cls.ElementLayout.OFFSETS
    return (Boolean(index) ?
    ['item',
      ['key', this._OFFSETS[index]],
      ['value', value]
    ] : []);
  }
  
  this.offset_values = function(offsets_values)
  {
    var model = window.dominspections.active, ret = [];
    if (model)
    {
      ret =
      [
        ['h2', ui_strings.M_VIEW_SUB_LABEL_PARENT_OFFSETS],
        ['parent-node-chain', 
          this.breadcrumb(model, model.target, offsets_values[0]),
          'onmouseover', helpers.breadcrumbSpotlight, 
          'onmouseout', helpers.breadcrumbClearSpotlight
        ],
        ['h2', ui_strings.M_VIEW_SUB_LABEL_OFFSET_VALUES],
        ['offsets', offsets_values.map(this._offsets)]
      ];
    }
    return ret;
  }

}).apply(window.templates || (window.templates = {}))