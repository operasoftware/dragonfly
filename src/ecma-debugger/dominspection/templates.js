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
  const SEARCH_PARENT = 2;

  const ELEMENT_NODE = Node.ELEMENT_NODE;
  const TEXT_NODE = Node.TEXT_NODE;
  const CDATA_SECTION_NODE = Node.CDATA_SECTION_NODE;
  const PROCESSING_INSTRUCTION_NODE = Node.PROCESSING_INSTRUCTION_NODE;
  const COMMENT_NODE = Node.COMMENT_NODE;
  const DOCUMENT_NODE = Node.DOCUMENT_NODE;
  const DOCUMENT_TYPE_NODE = Node.DOCUMENT_TYPE_NODE;
  const PSEUDO_NODE = cls.EcmascriptDebugger["6.0"].InspectableDOMNode.PSEUDO_NODE;

  const PSEUDO_ELEMENT_LIST = 14;
  const PSEUDO_ELEMENT_TYPE = 0;
  const PSEUDO_ELEMENT_CONTENT = 1;

  const PSEUDO_ELEMENT_BEFORE = 1;
  const PSEUDO_ELEMENT_AFTER = 2;
  const PSEUDO_ELEMENT_FIRST_LETTER = 3;
  const PSEUDO_ELEMENT_FIRST_LINE = 4;
  const EVENT_LISTENER_LIST = 15;

  var EV_LISTENER_MARKUP = "<span class=\"ev-listener\" " +
                                 "data-tooltip=\"event-listener\" " +
                                 "></span>"

  this._pseudo_element_map = {};
  this._pseudo_element_map[PSEUDO_ELEMENT_BEFORE] = "before";
  this._pseudo_element_map[PSEUDO_ELEMENT_AFTER] = "after";
  this._pseudo_element_map[PSEUDO_ELEMENT_FIRST_LETTER] = "first-letter";
  this._pseudo_element_map[PSEUDO_ELEMENT_FIRST_LINE] = "first-line";

  this._node_name_map = {};
  this._node_name_map[TEXT_NODE] = "<span class='text-node'>#text</span> ";
  this._node_name_map[CDATA_SECTION_NODE] = "<span class='cdata-node'>#cdata-section</span>";

  var disregard_force_lower_case_whitelist =
      cls.EcmascriptDebugger["6.0"].DOMData.DISREGARD_FORCE_LOWER_CASE_WHITELIST;

  var disregard_force_lower_case = function(node)
  {
    return disregard_force_lower_case_whitelist
           .indexOf(node[NAME].toLowerCase()) != -1;
  };

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

  this._get_pseudo_elements = function(element)
  {
    var is_tree_mode = window.settings.dom.get("dom-tree-style");
    var pseudo_element_list = element[PSEUDO_ELEMENT_LIST];
    var pseudo_elements = {};

    if (pseudo_element_list)
    {
      pseudo_element_list.forEach(function(pseudo_element) {
        var type = this._pseudo_element_map[pseudo_element[PSEUDO_ELEMENT_TYPE]];
        pseudo_elements[pseudo_element[PSEUDO_ELEMENT_TYPE]] =
          "<div handler='spotlight-node' " +
               "class='spotlight-node'" +
               "ref-id='" + element[ID] + "'" +
               "data-pseudo-element='" + type + "'" +
               this._margin_style(element) +
          ">" +
            "<node class='pseudo-element'>" +
              (is_tree_mode ? "::" + type : "&lt::" + type + "/>") +
            "</node>" +
          "</div>";
      }, this);
    }

    return pseudo_elements;
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

  this._dom_attrs_search = function(node, force_lower_case)
  {
    for (var i = 0, attr, attr_value, attrs = ''; attr = node[ATTRS][i]; i++)
    {
      attr_value = helpers.escapeAttributeHtml(attr[ATTR_VALUE]);
      attrs += " <key>" +
                 "<match-token>" + safe_escape_attr_key(attr) + "</match-token>" +
               "</key>=<value>\"" +
                 "<match-token>" + attr_value + "</match-token>" +
               "\"</value>";
    }
    return attrs;
  };

  this.dom_search = function(model)
  {
    var data = model.getData();
    var is_tree_style = window.settings.dom.get('dom-tree-style');
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
    var open_tag = is_tree_style ? "" : "&lt;";
    var close_tag =  is_tree_style ? "" : "&gt;";
    var ev_listener = "";

    for (var i = 0, node; node = data[i]; i++)
    {
      if (node[MATCH_REASON] == SEARCH_PARENT)
      {
        continue;
      }
      node_name = (node[NAMESPACE] ? node[NAMESPACE] + ':': '') + node[NAME];
      node_name = helpers.escapeTextHtml(node_name);
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
      ev_listener = node[EVENT_LISTENER_LIST] && node[EVENT_LISTENER_LIST].length
                  ? EV_LISTENER_MARKUP
                  : "";
      switch (node[TYPE])
      {
        case PSEUDO_NODE:
        {
          break;
        }
        case ELEMENT_NODE:
        {
          attrs = this._dom_attrs_search(node, force_lower_case);
          tree += "<div class='search-match dom-search' "+
                       "obj-id='" + node[ID] + "' " +
                       "handler='show-search-match' " +
                       ">" +
                    "<node>" + open_tag +
                      "<match-token>" + node_name + "</match-token>" +
                      attrs;
          if (close_tag)
          {
            tree += node[CHILDREN_LENGTH] ?
                    "&gt;</node>…<node>&lt;/" + node_name + "&gt;</node>" :
                    "/&gt;</node>";
          }
          else
          {
            tree += "</node>";
          }
          tree += ev_listener + "</div>";
          break;
        }
        case PROCESSING_INSTRUCTION_NODE:
        {
          // TODO <match-token>
          tree +=
            "<div class='search-match dom-search processing-instruction' " +
              "obj-id='" + node[ID] + "' handler='show-search-match' >" +
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
                "obj-id='" + node[ID] + "' handler='show-search-match' >" +
                (open_tag ? open_tag + "!--" : "#comment") +
                "<match-token>" + helpers.escapeTextHtml(node[VALUE]) + "</match-token>" +
                (close_tag ? "--" + close_tag : "") +
              "</div>";
          }
          break;
        }
        case DOCUMENT_NODE:
        {
          if (ev_listener)
          {
            tree += "<div class='search-match dom-search document' " +
                         "rt-id='" + String(model.getDataRuntimeId()) + "' " +
                         "obj-id='" + String(node[ID]) + "' " +
                         "handler='inspect-object-link' >" +
                      "document" + ev_listener + "</div>";
          }
          break;
        }
        case DOCUMENT_TYPE_NODE:
        {
          // TODO <match-token>
          // currently we don't earch in doctype nodes on the host side
          tree +=
            "<div class='search-match dom-search doctype' " +
              "obj-id='" + node[ID] + "' handler='show-search-match' >" +
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
                "obj-id='" + node[ID] + "' handler='show-search-match' >" +
                "<span class='dom-search-text-node'>#text</span>" +
                "<match-token>" + helpers.escapeTextHtml(node[VALUE]) + "</match-token>" +
              "</div>";
          }
        }
      }
    }
    tree += "</div>";
    return tree;
  };

  this._inspected_dom_node_markup_style= function(model, target, editable, no_contextmenu)
  {
    var data = model.getData();
    var tree = "<div class='padding dom-tree'" +
               (editable ? " edit-handler='edit-dom'" : "") +
               " rt-id='" + model.getDataRuntimeId() + "'" +
               " data-model-id='" + model.id + "'" +
               ">";
    var i = 0;
    var node = null;
    var length = data.length;
    var attrs = null, attr = null, k = 0, key = '', attr_value = '';
    var is_open = false;
    var has_only_text_content = false;
    var one_child_text_content = '';
    var current_depth = 0;
    var child_pointer = 0;
    var child_level = 0;
    var children_length = 0;
    var closing_tags = [];
    var force_lower_case = model.isTextHtml() && window.settings.dom.get('force-lowercase');
    var show_comments = window.settings.dom.get('show-comments');
    var class_name = '';
    var re_formatted = /script|style|#comment/i;
    var style = null;
    var is_script_node = true;
    var is_debug = ini.debug;
    var disregard_force_lower_case_depth = 0;
    var depth_first_ele = model.get_depth_of_first_element();
    var show_pseudo_elements = window.settings.dom.get("show-pseudo-elements");
    var is_expandable = false;

    for ( ; node = data[i]; i += 1)
    {
      while (current_depth > node[DEPTH])
      {
        tree += closing_tags.pop();
        current_depth--;
      }
      current_depth = node[DEPTH];
      children_length = node[CHILDREN_LENGTH];
      is_expandable = children_length || (show_pseudo_elements &&
                                          node[PSEUDO_ELEMENT_LIST]);
      child_pointer = 0;

      if (force_lower_case && disregard_force_lower_case(node))
      {
        disregard_force_lower_case_depth = node[DEPTH];
        force_lower_case = false;
      }
      else if (disregard_force_lower_case_depth &&
               disregard_force_lower_case_depth == node[DEPTH])
      {
        disregard_force_lower_case_depth = 0;
        force_lower_case = model.isTextHtml() && window.settings.dom.get('force-lowercase');
      }

      switch (node[TYPE])
      {
        case PSEUDO_NODE:
        {
          if (show_pseudo_elements)
          {
            tree += "<div " + this._margin_style(node, depth_first_ele) +
                              "ref-id='" + node[ID] + "' " +
                              "handler='spotlight-node' " +
                              "data-pseudo-element='" + node[NAME] + "' " +
                              "class='spotlight-node'>" +
                      "<node class='pseudo-element'>" +
                        "&lt;::" + node[NAME] + "&gt;" +
                      "</node>" +
                    "</div>";
          }
          break;
        }
        case ELEMENT_NODE:
        {
          var node_name = (node[NAMESPACE] ? node[NAMESPACE] + ':' : '') + node[NAME];
          node_name = helpers.escapeTextHtml(node_name);
          var ev_listener = node[EVENT_LISTENER_LIST] && node[EVENT_LISTENER_LIST].length
                          ? EV_LISTENER_MARKUP
                          : "";

          if (force_lower_case)
          {
            node_name = node_name.toLowerCase();
          }
          is_script_node = node[NAME].toLowerCase() == 'script';
          attrs = '';
          for (k = 0; attr = node[ATTRS][k]; k++)
          {
            attr_value = helpers.escapeAttributeHtml(attr[ATTR_VALUE]);
            attrs += " <key>" +
              ((attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '') +
              /* Regarding escaping "<". It happens that there are very
                 strange keys in broken html. Perhaps we will have to extend
                 the escaping to other data tokens as well */
              (force_lower_case ? attr[ATTR_KEY].toLowerCase()
                                : attr[ATTR_KEY])).replace(/</g, '&lt;') +
              "</key>=<value" +
                (/^href|src$/i.test(attr[ATTR_KEY])
                  ? " handler='dom-resource-link' class='dom-resource-link' " +
                     "data-resource-url='" + attr_value + "' "
                  : "") + ">\"" +
                attr_value +
                "\"</value>";
          }

          child_pointer = i + 1;
          is_open = (data[child_pointer] && (node[DEPTH] < data[child_pointer][DEPTH]));
          if (is_open)
          {
            one_child_text_content = '';
            has_only_text_content = false;
            child_level = data[child_pointer][DEPTH];
            for ( ; data[child_pointer] && data[child_pointer][DEPTH] == child_level;
                    child_pointer += 1)
            {
              has_only_text_content = true;
              if (data[child_pointer][TYPE] != TEXT_NODE)
              {
                has_only_text_content = false;
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
                  " ref-id='" + data[child_pointer][ID] + "' " +
                  ">" + helpers.escapeTextHtml(data[child_pointer][VALUE]) + "</text>";
              }
            }
            if (has_only_text_content)
            {
              class_name = " class='spotlight-node";
              if (re_formatted.test(node_name))
              {
                class_name += " pre-wrap";
                if (is_script_node)
                {
                  class_name += " non-editable";
                }
              }
              class_name += "'";
              tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                      this._margin_style(node, depth_first_ele) +
                      "ref-id='" + node[ID] + "' handler='spotlight-node' " +
                      (no_contextmenu ? "" : "data-menu='dom-element' ") +
                      class_name + ">" +
                          "<input handler='get-children' type='button' class='open' />" +
                          "<node>&lt;" + node_name + attrs + "&gt;</node>" +
                              one_child_text_content +
                          "<node>&lt;/" + node_name + "&gt;</node>" +
                          (is_debug && (" <d>[" + node[ID] + "]</d>" ) || "") +
                      ev_listener + "</div>";
              i = child_pointer - 1;
            }
            else
            {

              tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                      this._margin_style(node, depth_first_ele) +
                      "ref-id='" + node[ID] + "' handler='spotlight-node' " +
                      (no_contextmenu ? "" : "data-menu='dom-element' ") +
                      "class='spotlight-node " + (is_script_node ? "non-editable" : "") + "'>" +
                      (is_expandable ?
                          "<input handler='get-children' type='button' class='open' />" : '') +
                          "<node>&lt;" + node_name + attrs + "&gt;</node>" +
                      (is_debug && (" <d>[" + node[ID] + "]</d>" ) || "") +
                      ev_listener + "</div>";

              closing_tags.push("<div" + this._margin_style(node, depth_first_ele) +
                                  "ref-id='" + node[ID] + "' handler='spotlight-node' " +
                                  "class='spotlight-node' " +
                                  (no_contextmenu ? "" : "data-menu='dom-element' ") +
                                  "><node>" +
                                  "&lt;/" + node_name + "&gt;" +
                                "</node></div>");
            }
          }
          else
          {
              tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                      this._margin_style(node, depth_first_ele) +
                      "ref-id='" + node[ID] + "' handler='spotlight-node' " +
                      (no_contextmenu ? "" : "data-menu='dom-element' ") +
                      "class='spotlight-node " + (is_script_node ? "non-editable" : "") + "'>" +
                      (is_expandable ?
                          "<input handler='get-children' type='button' class='close' />" : '') +
                          "<node>&lt;" + node_name + attrs + (is_expandable ? '' : '/') + "&gt;</node>" +
                      (is_debug && (" <d>[" + node[ID] + "]</d>" ) || "") +
                      ev_listener + "</div>";
          }
          break;
        }

        case PROCESSING_INSTRUCTION_NODE:
        {
          tree += "<div" + this._margin_style(node, depth_first_ele) +
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
              tree += "<div" + this._margin_style(node, depth_first_ele) +
                               "ref-id='" + node[ID] + "' " +
                               "class='comment pre-wrap'>" +
                               "&lt;!--" +
                                   helpers.escapeTextHtml(node[VALUE]) +
                               "--&gt;</div>";
            }
          }
          break;
        }

        case DOCUMENT_NODE:
          // Don't show this in markup view
          break;

        case DOCUMENT_TYPE_NODE:
        {
          tree += "<div" + this._margin_style(node, depth_first_ele) + "class='doctype'>" +
                  "&lt;!DOCTYPE " + node[NAME] +
                    this._get_doctype_external_identifier(node) +
                  "&gt;</div>";
          break;
        }

        default:
        {
          if (!/^\s*$/.test(node[ VALUE ]))
          {
            // style and script elements are handled in
            // the 'has_only_text_content' check,
            // so we don't need to check here again for 'pre-wrap' content

            tree += "<div" + this._margin_style(node, depth_first_ele) +
                             (no_contextmenu ? "" : "data-menu='dom-element' ") +
                             ">" +
                    "<text ref-id='"+ node[ID] + "' " +
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

  this._inspected_dom_node_tree_style = function(model, target, editable, no_contextmenu)
  {

    var data = model.getData();
    var force_lower_case = model.isTextHtml() && window.settings.dom.get('force-lowercase');
    var show_comments = window.settings.dom.get('show-comments');
    var show_white_space_nodes = window.settings.dom.get('show-whitespace-nodes');
    var tree = "<div class='padding dom-tree'" +
               (editable ? " edit-handler='edit-dom'" : "") +
               " rt-id='" + model.getDataRuntimeId() + "'" +
               " data-model-id='" + model.id + "'" +
               "><div class='tree-style'>";
    var i = 0, node = null, length = data.length;
    var attrs = null, key = '', attr_value = '';
    var is_open = false;
    var has_only_text_content = false;
    var one_child_value = ''
    var current_depth = 0;
    var child_pointer = 0;
    var child_level = 0;
    var k = 0;
    var children_length = 0;
    var closing_tags = [];
    var current_formatting = '';
    var re_formatted = /script|style/i;
    var style = null;
    var is_script_node = true;
    var disregard_force_lower_case_depth = 0;
    var depth_first_ele = model.get_depth_of_first_element();
    var show_pseudo_elements = window.settings.dom.get("show-pseudo-elements");
    var parent_ele_stack = [];
    var parent_ele = null;
    var is_expandable = false;
    var ev_listener = "";

    for ( ; node = data[i]; i += 1)
    {
      while (current_depth > node[DEPTH])
      {
        current_depth--;
      }
      current_depth = node[DEPTH];
      children_length = node[CHILDREN_LENGTH];
      is_expandable = children_length || (show_pseudo_elements &&
                                          node[PSEUDO_ELEMENT_LIST]);
      child_pointer = 0;
      while ((parent_ele = parent_ele_stack.last) &&
             current_depth <= parent_ele[DEPTH])
      {
        parent_ele_stack.pop();
      }

      if (force_lower_case && disregard_force_lower_case(node))
      {
        disregard_force_lower_case_depth = node[DEPTH];
        force_lower_case = false;
      }
      else if (disregard_force_lower_case_depth && disregard_force_lower_case_depth == node[DEPTH])
      {
        disregard_force_lower_case_depth = 0;
        force_lower_case = model.isTextHtml() && window.settings.dom.get('force-lowercase');
      }

      ev_listener = node[EVENT_LISTENER_LIST] && node[EVENT_LISTENER_LIST].length
                  ? EV_LISTENER_MARKUP
                  : "";

      switch (node[TYPE])
      {
        case PSEUDO_NODE:
        {
          if (show_pseudo_elements)
          {
            tree += "<div " + this._margin_style(node, depth_first_ele) +
                              "ref-id='" + node[ID] + "' " +
                              "handler='spotlight-node' " +
                              "data-pseudo-element='" + node[NAME] + "' " +
                              "class='spotlight-node'>" +
                      "<node class='pseudo-element'>" +
                        "::" + node[NAME] +
                      "</node>" +
                    "</div>";
          }
          break;
        }
        case ELEMENT_NODE:
        {
          var node_name = (node[NAMESPACE] ? node[NAMESPACE] + ':' : '') + node[NAME];
          node_name = helpers.escapeTextHtml(node_name);
          if (force_lower_case)
          {
            node_name = node_name.toLowerCase();
          }
          var pseudo_elements = show_pseudo_elements && this._get_pseudo_elements(node);
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
                    ? " handler='dom-resource-link' class='dom-resource-link' data-resource-url='" + attr_value + "' "
                    : "" ) + ">\"" +
                  attr_value +
              "\"</value>";
          }

          child_pointer = i + 1;

          is_open = (data[child_pointer] && (node[DEPTH] < data[child_pointer][DEPTH]));
          if (is_open)
          {
            has_only_text_content = !node.hasOwnProperty(PSEUDO_ELEMENT_LIST);
            one_child_value = '';
            child_level = data[child_pointer][DEPTH];
            for ( ; data[child_pointer] && data[child_pointer][DEPTH] == child_level; child_pointer += 1)
            {
              one_child_value += data[child_pointer][VALUE];
              if (data[child_pointer][TYPE] != TEXT_NODE)
              {
                has_only_text_content = false;
                one_child_value = '';
                break;
              }
            }

            tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                    this._margin_style(node, depth_first_ele) +
                    "ref-id='"+node[ID] + "' handler='spotlight-node' " +
                    (no_contextmenu ? "" : "data-menu='dom-element' ") +
                    "class='spotlight-node " + (is_script_node ? "non-editable" : "") + "'>" +
                    (is_expandable ?
                      "<input handler='get-children' type='button' class='open' />" : '') +
                    "<node>" + node_name + attrs + "</node>" +
                    ev_listener + "</div>";
          }
          else
          {
            tree += "<div " + (node[ID] == target ? "id='target-element'" : '') +
                    this._margin_style(node, depth_first_ele) +
                    "ref-id='"+node[ID] + "' handler='spotlight-node' " +
                    (no_contextmenu ? "" : "data-menu='dom-element' ") +
                    "class='spotlight-node " + (is_script_node ? "non-editable" : "") + "'>" +
                    (is_expandable ?
                      "<input handler='get-children' type='button' class='close' />" : '') +
                    "<node>" + node_name + attrs + "</node>" +
                    ev_listener + "</div>";
          }
          parent_ele_stack.push(node);
          break;
        }

        case COMMENT_NODE:
        {
          if (show_comments)
          {
            tree += "<div" + this._margin_style(node, depth_first_ele) +
                            "ref-id='"+node[ID] + "' " +
                            "class='comment pre-wrap'>" +
                        "<span class='comment-node'>#comment</span>" +
                        helpers.escapeTextHtml(node[VALUE]) + "</div>";
          }
          break;
        }

        case DOCUMENT_NODE:
        {
          tree += "<div" + this._margin_style(node, depth_first_ele) +
                          "ref-id='" + node[ID] + "'>" +
                    "<span class='document-node'>#document</span>" +
                    ev_listener + "</div>";
          break;
        }

        case DOCUMENT_TYPE_NODE:
        {
          tree += "<div" + this._margin_style(node, depth_first_ele) + ">" +
                    "<span class='doctype'>" + node[NAME] + " " +
                      this._get_doctype_external_identifier(node) +
                    "</span></div>";
          break;
        }

        default:
        {
          current_formatting = "";
          parent_ele = parent_ele_stack.last;
          if (re_formatted.test(parent_ele))
          {
            current_formatting = parent_ele[NAME].toLowerCase() == 'script'
                               ? " class='pre-wrap non-editable' "
                               : " class='pre-wrap' ";
          }
          if (!(show_white_space_nodes) && (node[TYPE] == TEXT_NODE))
          {
            if (!/^\s*$/.test(node[VALUE]))
            {
               tree += "<div" + this._margin_style(node, depth_first_ele) +
                                current_formatting +
                                (no_contextmenu ? "" : "data-menu='dom-element' ") +
                                ">" +
                       (node[NAME] ? node[NAME] : this._node_name_map[node[TYPE]]) +
                       "<text ref-id='" + node[ID] + "' >" +
                         helpers.escapeTextHtml(node[VALUE]) + "</text>" +
                       "</div>";
            }
          }
          else
          {
            var only_whitespace = /^\s*$/.test(node[VALUE]);
            tree += "<div" + this._margin_style(node, depth_first_ele) +
                             current_formatting +
                             (no_contextmenu ? "" : "data-menu='dom-element' ") +
                             ">" +
                    (node[NAME] ? node[NAME] : this._node_name_map[node[TYPE]]) +
                      "<text ref-id='" + node[ID]+  "' " +
                        " class='" + (only_whitespace ? "only-whitespace" : "") + "'>" +
                        (only_whitespace ? helpers.escape_whitespace(node[VALUE])
                                         : helpers.escapeTextHtml(node[VALUE])) +
                      "</text>" +
                    "</div>";
          }
        }
      }
    }
    tree += "</div></div>";
    return tree;
  }

  this.inspected_dom_node = function(model, target, editable, no_contextmenu)
  {
    return (window.settings.dom.get('dom-tree-style') ?
           this._inspected_dom_node_tree_style(model, target, editable, no_contextmenu) :
           this._inspected_dom_node_markup_style(model, target, editable, no_contextmenu));
  }

  this._margin_style = function(node, start_depth)
  {
    const INDENT_AMOUNT = 16;
    return " style='margin-left:" +
           INDENT_AMOUNT * (node[DEPTH] - (start_depth || 0)) +
           "px;' ";
  };

  this._offsets = function(value, index)
  {
    if (!this._OFFSETS)
      this._OFFSETS = cls.ElementLayout.OFFSETS
    return (Boolean(index) ?
    ['tr',
      ['th', this._OFFSETS[index]],
      ['td',
        value,
       "class", "number"
      ],
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
        model.breadcrumb_offsets = window.helpers.copy_object(offsets_values[0]);
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
        ['table',
          offsets_values.map(this._offsets),
         "class", "offsets"
        ]
      ];
    }
    return ret;
  }

  this.disabled_view = function()
  {
    return (
    ["div",
      ["p", window.app.profiles[window.app.profiles.PROFILER].is_enabled ?
            ui_strings.S_INFO_PROFILER_MODE :
            ui_strings.S_INFO_HTTP_PROFILER_MODE],
      ["p",
        ["span", ui_strings.S_LABEL_ENABLE_DEFAULT_FEATURES,
                 "class", "container-button ui-button",
                 "handler", "enable-ecmascript-debugger",
                 "unselectable", "on",
                 "tabindex", "1"]],
      "class", "info-box"]);
  };

}).apply(window.templates || (window.templates = {}));
