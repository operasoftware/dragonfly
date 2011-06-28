(function()
{
  const ID = 0;
  const TYPE = 1;
  const NAME = 2;
  const DEPTH = 3;
  const NAMESPACE = 4;
  const VALUE = 7;
  const ATTRS = 5;
  const ATTR_PREFIX = 0;
  const ATTR_KEY = 1;
  const ATTR_VALUE = 2;
  const CHILDREN_LENGTH = 6;
  const MATCH_REASON = cls.EcmascriptDebugger["6.0"].InspectableDOMNode.MATCH_REASON;
  const INDENT = "  ";
  const LINEBREAK = '\n';
  const ELEMENT_NODE = Node.ELEMENT_NODE;
  const PROCESSING_INSTRUCTION_NODE = Node.PROCESSING_INSTRUCTION_NODE;
  const COMMENT_NODE = Node.COMMENT_NODE;
  const DOCUMENT_NODE = Node.DOCUMENT_NODE;
  const DOCUMENT_TYPE_NODE = Node.DOCUMENT_TYPE_NODE;
  const SEARCH_PARENT = 2;

  /**
   * Generates the part of the document type declaration after the document
   * element type name.
   */
  this._get_doctype_external_identifier = function(node)
  {
    const PUBLIC_ID = 8
    const SYSTEM_ID = 9;

    // Missing public IDs and system IDs are returned as empty strings,
    // so it's impossible to distinguish them from empty ones. In reality
    // this should happen very seldom, so it's not really a problem.
    var public_id = node[PUBLIC_ID];
    var system_id = node[SYSTEM_ID];
    return (public_id
             ? " PUBLIC \"" + public_id + "\""
             : "") +
           (!public_id && system_id
             ? " SYSTEM"
             : "") +
           (system_id
             ? " \"" + system_id + "\""
             : "");
  };

  var disregard_force_lower_case_whitelist = 
      cls.EcmascriptDebugger["5.0"].DOMData.DISREGARD_FORCE_LOWER_CASE_WHITELIST;

  var disregard_force_lower_case = function(node)
  {
    return disregard_force_lower_case_whitelist
           .indexOf(node[NAME].toLowerCase()) != -1;
  };

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

  var safe_escape_attr_key = function(attr, force_lower_case)
  {
    return (
    ((attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '') +
    /* regarding escaping "<". 
       it happens that there are very starnge keys in broken html.
       perhaps we will have to extend the escaping to other data 
       tokens as well */
    (force_lower_case ? attr[ATTR_KEY].toLowerCase() : attr[ATTR_KEY]))
    .replace(/</g, '&lt;'));
  }

  this._dom_attrs = function(node, force_lower_case, is_search_hit)
  {
    for (var i = 0, attr, attr_value, attrs = ''; attr = node[ATTRS][i]; i++)
    {
      attr_value = helpers.escapeAttributeHtml(attr[ATTR_VALUE]);
      if (typeof is_search_hit != 'boolean' || is_search_hit)
      {
        attrs += " <key>" + safe_escape_attr_key(attr) +
                 "</key>=<value>\"" + attr_value + "\"</value>";
      }
      else
      {
        attrs += " " + safe_escape_attr_key(attr) + "=\"" + attr_value + "\"";
      }
    }
    return attrs;
  };

  this.dom_search = function(model, target, editable)
  {
    var data = model.getData();
    var tree = "<div" +
               " rt-id='" + model.getDataRuntimeId() + "'" +
               " data-model-id='" + model.id + "'" +
               ">";
    var length = data.length;
    var attrs = null; 
    var force_lower_case = model.isTextHtml() && 
                           window.settings.dom.get('force-lowercase');
    var show_comments = window.settings.dom.get('show-comments');
    var node_name = '';
    var disregard_force_lower_case_depth = 0;

    for (var i = 0, node; node = data[i]; i++)
    {
      if (node[MATCH_REASON] == SEARCH_PARENT)
      {
        continue;
      }
      node_name = (node[NAMESPACE] ? node[NAMESPACE] + ':': '') + node[NAME];
      if (force_lower_case && disregard_force_lower_case(node))
      {
        disregard_force_lower_case_depth = node[DEPTH];
        force_lower_case = false;
      }
      else if (disregard_force_lower_case_depth && 
               disregard_force_lower_case_depth == node[DEPTH])
      {
        disregard_force_lower_case_depth = 0;
        force_lower_case = model.isTextHtml() && 
                           window.settings.dom.get('force-lowercase');
      }
      if (force_lower_case)
      {
        node_name = node_name.toLowerCase();
      }
      switch (node[TYPE])
      {
        case ELEMENT_NODE:
        {
          attrs = this._dom_attrs(node, force_lower_case);
          tree += 
            "<div class='search-match dom-search' "+
              "obj-id='" + node[ID] + "' handler='inspect-node-link' >" +
              "<node>&lt;" + node_name + attrs +
                (node[CHILDREN_LENGTH] ?
                 "&gt;</node>…<node>&lt;/" + node_name + "&gt;</node>" :
                 "/&gt;</node>") +
            "</div>";
          break;
        }
        case PROCESSING_INSTRUCTION_NODE:
        {
          tree += 
            "<div class='search-match dom-search processing-instruction' " +
              "obj-id='" + node[ID] + "' handler='inspect-node-link' >" +
              "&lt;?" + node[NAME] + ' ' +
              formatProcessingInstructionValue(node[VALUE], force_lower_case) + 
            "?&gt;</div>";
          break;
        }
        case COMMENT_NODE:
        {
          if (show_comments && !/^\s*$/.test(node[VALUE]))
          {
            tree += 
              "<div class='search-match dom-search comment pre-wrap' " +
                "obj-id='" + node[ID] + "' handler='inspect-node-link' >" +
                "&lt;!--" + helpers.escapeTextHtml(node[VALUE]) + "--&gt;" +
              "</div>";
          }
          break;
        }
        case DOCUMENT_NODE:
        {
          break;
        }
        case DOCUMENT_TYPE_NODE:
        {
          tree += 
            "<div class='search-match dom-search doctype' " +
              "obj-id='" + node[ID] + "' handler='inspect-node-link' >" +
              "&lt;!DOCTYPE " + node[NAME] +
              this._get_doctype_external_identifier(node) + "&gt;" +
            "</div>";
          break;
        }
        default:
        {
          if (!/^\s*$/.test(node[VALUE]))
          {
            tree += 
              "<div class='search-match dom-search' " +
                "obj-id='" + node[ID] + "' handler='inspect-node-link' >" +
                "<span class='dom-search-text-node'>#text</span>" + 
                helpers.escapeTextHtml(node[VALUE]) + 
              "</div>";
          }
        }
      }
    }
    tree += "</div>";
    return tree;
  };

  this._inspected_dom_node_markup_style= function(model, target, editable)
  {
    var data = model.getData();
    var tree = "<div class='padding dom'" +
               (editable ? " edit-handler='edit-dom'" : "") + 
               " rt-id='" + model.getDataRuntimeId() + "'" +
               " data-model-id='" + model.id + "'" +
               ">";
    var i = 0;
    var node = null;
    var length = data.length;
    var attrs = null, attr = null, k = 0, key = '', attr_value = '';
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
    var node_name = '';
    var class_name = '';
    var re_formatted = /script|style|#comment/i;
    var style = null;
    var is_script_node = true;
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
        case ELEMENT_NODE:
        {
          is_script_node = node[NAME].toLowerCase() == 'script';
          attrs = '';
          for (k = 0; attr = node[ATTRS][k]; k++)
          {
            attr_value = helpers.escapeAttributeHtml(attr[ATTR_VALUE]);
            attrs += " <key>" +
              ((attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '') +
              /* regarding escaping "<". it happens that there are very starnge keys in broken html.
                  perhaps we will have to extend the escaping to other data tokens as well */
              (force_lower_case ? attr[ATTR_KEY].toLowerCase() : attr[ATTR_KEY])).replace(/</g, '&lt;') +
              "</key>=<value" +
                (/^href|src$/i.test(attr[ATTR_KEY])
                  ? " handler='dom-resource-link' data-resource-url='" + attr_value + "' "
                  : "") + ">\"" +
                attr_value +
                "\"</value>";
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
                  (!is_script_node ? " ref-id='" + data[child_pointer][ID] + "' " : "") +
                  ">" + helpers.escapeTextHtml(data[child_pointer][VALUE]) + "</text>";
              }
            }
          }

          if (is_open)
          {
            if (has_only_one_child)
            {
              class_name = re_formatted.test(node_name)
                         ? " class='pre-wrap " +
                           (is_script_node ? "non-editable" : "") + "'"
                         : '';
              tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                      this._get_indent(node) +
                      "ref-id='" + node[ID] + "' handler='spotlight-node' " +
                      "data-menu='dom-element'" +
                      class_name + ">" +
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
                      this._get_indent(node) +
                      "ref-id='" + node[ID] + "' handler='spotlight-node' " +
                      "data-menu='dom-element' " +
                      (is_script_node ? "class='non-editable'" : "") + ">" +
                      (node[CHILDREN_LENGTH] ?
                          "<input handler='get-children' type='button' class='open' />" : '') +
                          "<node>&lt;" + node_name + attrs + "&gt;</node>" +
                      (is_debug && (" <d>[" + node[ID] + "]</d>" ) || "") +
                      "</div>";

              closing_tags.push("<div" + this._get_indent(node) +
                                "ref-id='" + node[ID] + "' handler='spotlight-node' " +
                                "data-menu='dom-element'><node>" +
                                "&lt;/" + node_name + "&gt;" +
                                "</node></div>");
            }
          }
          else
          {
              tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                      this._get_indent(node) +
                      "ref-id='" + node[ID] + "' handler='spotlight-node' " +
                      "data-menu='dom-element' " +
                      (is_script_node ? "class='non-editable'" : "") + ">" +
                      (children_length ?
                          "<input handler='get-children' type='button' class='close' />" : '') +
                          "<node>&lt;" + node_name + attrs + (children_length ? '' : '/') + "&gt;</node>" +
                      (is_debug && (" <d>[" + node[ID] + "]</d>" ) || "") +
                      "</div>";
          }
          break;
        }

        case PROCESSING_INSTRUCTION_NODE:
        {
          tree += "<div" + this._get_indent(node) +
            "class='processing-instruction'>&lt;?" + node[NAME] + ' ' +
            formatProcessingInstructionValue(node[VALUE], force_lower_case) + "?&gt;</div>";
          break;

        }

        case COMMENT_NODE:
        {
          if (show_comments)
          {
            if (!/^\s*$/.test(node[VALUE]))
            {
              tree += "<div" + this._get_indent(node) +
                      "class='comment pre-wrap'>&lt;!--" + helpers.escapeTextHtml(node[VALUE]) + "--&gt;</div>";
            }
          }
          break;
        }

        case DOCUMENT_NODE:
          // Don't show this in markup view
          break;

        case DOCUMENT_TYPE_NODE:
        {
          tree += "<div" + this._get_indent(node) + "class='doctype'>" +
                  "&lt;!DOCTYPE " + node[NAME] +
                    this._get_doctype_external_identifier(node) +
                  "&gt;</div>";
          break;
        }

        default:
        {
          if (!/^\s*$/.test(node[ VALUE ]))
          {
            tree += "<div" + this._get_indent(node) + "data-menu='dom-element'>" +
                    "<text" +
                    (!is_script_node ? " ref-id='"+ node[ID] + "' " : "") +
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
  };

  var nodeNameMap =
  {
    3: "<span class='text-node'>#text</span> ",
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
    var show_white_space_nodes = window.settings.dom.get('show-whitespace-nodes');
    var tree = "<div class='padding dom'" +
               (editable ? " edit-handler='edit-dom'" : "") + 
               " rt-id='" + model.getDataRuntimeId() + "'" +
               " data-model-id='" + model.id + "'" +
               "><div class='tree-style'>";
    var i = 0, node = null, length = data.length;
    var attrs = null, key = '', attr_value = '';
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
    var current_formatting = '';
    var re_formatted = /script|style/i;
    var style = null;
    var is_script_node = true;
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
        case ELEMENT_NODE:
        {
          is_script_node = node[NAME].toLowerCase() == 'script';
          attrs = '';
          for (k = 0; attr = node[ATTRS][k]; k++)
          {
            attr_value = helpers.escapeAttributeHtml(attr[ATTR_VALUE]);
            attrs += " <key>" +
              (attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '') +
              /* regarding escaping "<". it happens that there are very starnge keys in broken html.
                 perhaps we will have to extend the escaping to other data tokens as well */
              (force_lower_case ? attr[ATTR_KEY].toLowerCase() : attr[ATTR_KEY] ).replace(/</g, '&lt;') +
              "</key>=<value" +
                  (/^href|src$/i.test(attr[ATTR_KEY])
                    ? " handler='dom-resource-link' data-resource-url='" + attr_value + "' "
                    : "" ) + ">\"" +
                  attr_value +
              "\"</value>";
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
                    this._get_indent(node) +
                    "ref-id='"+node[ID] + "' handler='spotlight-node' data-menu='dom-element' " + (is_script_node ? "class='non-editable'" : "") + ">" +
                    (children_length && !has_only_one_child ?
                      "<input handler='get-children' type='button' class='open' />" : '') +
                    "<node>" + node_name + attrs + "</node>" +
                    "</div>";
          }
          else
          {
            tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                    this._get_indent(node) +
                    "ref-id='"+node[ID] + "' handler='spotlight-node' data-menu='dom-element' " + (is_script_node ? "class='non-editable'" : "") + ">" +
                    (node[CHILDREN_LENGTH] ?
                      "<input handler='get-children' type='button' class='close' />" : '') +
                    "<node>" + node_name + attrs + "</node>" +
                    "</div>";
          }
          current_formatting = re_formatted.test(node_name) &&  " class='pre-wrap'" || "";
          break;
        }

        case COMMENT_NODE:
        {
          if (show_comments)
          {
            tree += "<div" + this._get_indent(node) +
                    "class='comment pre-wrap'><span class='comment-node'>#comment</span>" +
                    helpers.escapeTextHtml(node[VALUE]) + "</div>";
          }
          break;
        }

        case DOCUMENT_NODE:
        {
          tree += "<div" + this._get_indent(node) + ">" +
                    "<span class='document-node'>#document</span></div>";
          break;
        }

        case DOCUMENT_TYPE_NODE:
        {
          tree += "<div" + this._get_indent(node) + ">" +
                    "<span class='doctype'>" + node[NAME] + " " +
                      this._get_doctype_external_identifier(node) +
                    "</span></div>";
          break;
        }

        default:
        {
          if (!(show_white_space_nodes) && (node[TYPE] == 3))
          {
            if (!/^\s*$/.test(node[VALUE]))
            {
               tree += "<div" + this._get_indent(node) +
                       current_formatting + " data-menu='dom-element'>" +
                       (node[NAME] ? node[NAME] : nodeNameMap[node[TYPE]]) +
                       "<text" + (!is_script_node ? " ref-id='" + node[ID] + "' " : "") + ">" +
                         helpers.escapeTextHtml(node[VALUE]) + "</text>" +
                       "</div>";
            }
          }
          else
          {
            tree += "<div" + this._get_indent(node) +
                    current_formatting + " data-menu='dom-element'>" +
                    (node[NAME] ? node[NAME] : nodeNameMap[node[TYPE]]) +
                      "<text" + (!is_script_node ? " ref-id='" + node[ID]+  "' " : "") + ">" +
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

  this._get_indent = function(node)
  {
    const INDENT_AMOUNT = 16;
    return " style='margin-left:" + INDENT_AMOUNT * node[DEPTH] + "px;' ";
  };

  this._offsets = function(value, index)
  {
    if (!this._OFFSETS)
      this._OFFSETS = cls.ElementLayout.OFFSETS
    return (Boolean(index) ?
    ['item',
      ['key', this._OFFSETS[index]],
      ['value', value],
      "data-spec", "dom#" + this._OFFSETS[index]
    ] : []);
  }
  
  this.offset_values = function(offsets_values)
  {
    var model = window.dominspections.active, ret = [];
    if (model)
    {
      if (model.breadcrumbhead && !model.has_node(model.breadcrumbhead))
      {
        model.breadcrumbhead = null;
        model.breadcrumb_offsets = null;
      }
      var target_is_head = !model.breadcrumbhead || 
                           model.breadcrumbhead == model.target;
      if (target_is_head)
      {
        model.breadcrumb_offsets = window.helpers.copy_array(offsets_values[0]);
      }
      ret =
      [
        ['h2', ui_strings.M_VIEW_SUB_LABEL_PARENT_OFFSETS],
        ['parent-node-chain', 
          target_is_head ?
          this.breadcrumb(model, model.target, offsets_values[0], null, true) :
          this.breadcrumb(model, model.breadcrumbhead, 
                          model.breadcrumb_offsets, model.target, true),
          'onmouseover', helpers.breadcrumbSpotlight, 
          'onmouseout', helpers.breadcrumbClearSpotlight,
          'class', 'mono'
        ],
        ['h2', ui_strings.M_VIEW_SUB_LABEL_OFFSET_VALUES],
        ['offsets', offsets_values.map(this._offsets)]
      ];
    }
    return ret;
  }

}).apply(window.templates || (window.templates = {}));
