window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor
  */

cls.EcmascriptDebugger["6.0"].InspectableDOMNode = function(rt_id,
                                                            obj_id,
                                                            has_error_handling)
{
  this._init(rt_id, obj_id, has_error_handling);
};

cls.EcmascriptDebugger["6.0"].InspectableDOMNode.OBJECT_ID = 0;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.TYPE = 1;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.NAME = 2;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.DEPTH = 3;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.NAMESPACE_PREFIX = 4;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.ATTRIBUTE_LIST = 5;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.CHILDREN_LENGTH = 6;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.VALUE = 7;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.PUBLIC_ID = 8;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.SYSTEM_ID = 9;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.RUNTIME_ID = 10;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.CONTENT_DOCUMENT = 11;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.FRAME_ELEMENT = 12;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.MATCH_REASON = 13;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.PSEUDO_ELEMENT = 14;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.EVENT_LISTENER_LIST = 15;
cls.EcmascriptDebugger["6.0"].InspectableDOMNode.PSEUDO_NODE = 0;

cls.EcmascriptDebugger["6.0"].InspectableDOMNode.prototype = new function()
{

  var NODE_LIST = 0;
  var ID = 0;
  var TYPE = 1;
  var NAME = 2;
  var DEPTH = 3;

  var ATTRS = 5;
  var ATTR_PREFIX = 0;
  var ATTR_KEY = 1;
  var ATTR_VALUE = 2;
  var CHILDREN_LENGTH = 6;
  var PUBLIC_ID = 4;
  var SYSTEM_ID = 5;
  var MATCH_REASON = cls.EcmascriptDebugger["6.0"].InspectableDOMNode.MATCH_REASON;
  var TRAVERSE_SEARCH = "search";
  var TRAVERSAL = 1;
  var SEARCH_PARENT = 2;
  var SEARCH_HIT = 3;
  var PSEUDO_TYPE = 0;
  var PSEUDO_ELEMENT = cls.EcmascriptDebugger["6.0"].InspectableDOMNode.PSEUDO_ELEMENT;
  var PSEUDO_NODE = cls.EcmascriptDebugger["6.0"].InspectableDOMNode.PSEUDO_NODE;
  var BEFORE = 1;
  var AFTER = 2;
  var FIRST_LETTER = 3;
  var FIRST_LINE = 4;
  var BEFORE_ALIKES = [BEFORE, FIRST_LETTER, FIRST_LINE];
  var AFTER_ALIKES = [AFTER];
  var ERROR_MSG = 0;
  var PSEUDO_NAME = {};
  var EVENT_LISTENER_LIST = cls.EcmascriptDebugger["6.0"].InspectableDOMNode.EVENT_LISTENER_LIST;

  PSEUDO_NAME[BEFORE] = "before";
  PSEUDO_NAME[AFTER] = "after";
  PSEUDO_NAME[FIRST_LETTER] = "first-letter";
  PSEUDO_NAME[FIRST_LINE] = "first-line";

  this._set_mime = function()
  {
    if (this._data)
      for (var node = null, i = 0; node = this._data[i]; i++)
      {
        if (node[TYPE] == 1 )
        {
          // TODO take in account doctype if present
          return /^[A-Z][A-Z0-9]*$/.test(node[NAME]) && "text/html" || "application/xml";
        }
      }
    return "";
  };

  this.get_mime = function()
  {
    return this._mime;
  }

  this.isTextHtml = function()
  {
    return this._data.length && this._mime == "text/html" || false;
  };

  this.expand = function(cb, object_id, traverse_type)
  {
    this._get_dom(object_id, traverse_type || "children", cb);
  }

  // this method is only supported in ECMAScriptDebugger 6.5 and higher
  this.search = function(query, type, ignore_case, object_id, cb)
  {
    this._isprocessing = true;
    var tag = window.tag_manager.set_callback(this,
                                              this.__handle_dom,
                                              [object_id, TRAVERSE_SEARCH, cb]);
    this.search_type = type;
    var msg = [this._data_runtime_id,
               query,
               type,
               object_id || null,
               ignore_case || 0];
    services['ecmascript-debugger'].requestSearchDom(tag, msg);
  };

  // this method makes only sense with ECMAScriptDebugger 6.5 and higher
  this.get_match_count = function()
  {
    var i = 0, count = 0, length = this._data ? this._data.length : 0;
    for (; i < length; i++)
    {
      if (this._data[i][MATCH_REASON] == SEARCH_HIT)
      {
        count++;
      }
    }
    return count;
  };

  // this method makes only sense with ECMAScriptDebugger 6.5 and higher
  this.clear_search = function()
  {
    for (var i = 0; this._data[i]; i++)
    {
      this._data[i][MATCH_REASON] = TRAVERSAL;
    };
  };

  this.node_has_attr = function(node_id, attr_name)
  {
    var node = this.get_node(node_id);
    var attrs = node && node[ATTRS];
    return attrs && attrs.some(function(attr)
    {
      return attr[ATTR_KEY] == attr_name;
    });
  }

  this._get_dom = function(object_id, traverse_type, cb)
  {
    this._isprocessing = true;
    var tag = window.tag_manager.set_callback(this, this.__handle_dom, [object_id, traverse_type, cb]);
    services['ecmascript-debugger'].requestInspectDom(tag, [object_id, traverse_type]);
  };

  this.__handle_dom = function(status, message, object_id, traverse_type, cb)
  {
    var
    _data = message[NODE_LIST] || [],
    error_ms = ui_strings.S_DRAGONFLY_INFO_MESSAGE + 'this.__handle_dom failed in DOMBaseData',
    splice_args = null,
    i = 0;

    if (!status)
    {
      switch (traverse_type)
      {
        // traverse_type 'node' so far not supported
        case TRAVERSE_SEARCH:
        case "parent-node-chain-with-children":
        {
          if (traverse_type != "search" || !object_id)
          {
            this._data = _data;
            this._unfold_pseudos();
            break;
          }
        }
        case "subtree":
        case "children":
        case "node":
        {
          for (; this._data[i] && this._data[i][ID] != object_id; i++);
          if (this._data[i])
          {
            // A search with an object_id searches only in the subtree
            // of that node, but returns a tree with the ancestor up
            // to the document.
            // For the use case in Dragonfly we cut away the chain from
            // the object up to the document.
            if (traverse_type == "search")
            {
              this.clear_search();
              for (var j = 0; _data[j] && _data[j][ID] != object_id; j++);
              if (_data[j])
              {
                _data = _data.slice(j);
              }
            }
            // if object_id matches the one of the first node
            // of the return data the traversal was subtree
            // a search can return no data
            if (_data[0])
            {
              if (object_id == _data[0][ID])
              {
                this.collapse(object_id);
                this._data.insert(i, _data, 1);
              }
              else
              {
                this._data.insert(i + 1, _data);
              }

            }
            this._unfold_pseudos(i, _data.length, traverse_type == "subtree");
          }
          else if (!this._data.length)
          {
            this._data = _data;
            this._unfold_pseudos();
          }
          else
            opera.postError(error_ms);
          break;
        }
      }
      this._mime = this._set_mime();
      if (cb)
        cb();
    }
    else if(traverse_type == "search")
    {
      this._data = [];
      cb();
    }
    else if (this._has_error_handling)
    {
      this.error = message[ERROR_MSG];
      if (cb)
        cb();
    }
    else
    {
      opera.postError(error_ms + ' ' + JSON.stringify(message));
    }
    this._isprocessing = false;
  };

  this._unfold_pseudos = function(index, length, force_unfold)
  {
    typeof index == "number" || (index = 0);
    typeof length == "number" || (length = this._data ? this._data.length : 0);

    if (this._data && this._data[index])
    {
      var current_depth = this._data[index][DEPTH];
      var parent_stack = [];
      var i = index;
      var delta = 0;
      var cur = null;

      for ( ; i <= index + length && (cur = this._data[i + delta]); i++)
      {
        if (cur[DEPTH] > current_depth)
        {
          parent_stack.push(this._data[i + delta - 1]);
          delta += this._insert_pseudos(parent_stack.last,
                                        i + delta,
                                        BEFORE_ALIKES);
          current_depth++;
        }
        else if (cur[DEPTH] < current_depth)
        {
          while (cur[DEPTH] < current_depth)
          {
            delta += this._insert_pseudos(parent_stack.last,
                                          i + delta,
                                          AFTER_ALIKES);
            parent_stack.pop();
            current_depth--;
          }
        }

        if (!cur[CHILDREN_LENGTH] &&
            (force_unfold || current_depth == this._data[index][DEPTH]))
        {
          delta += this._insert_pseudos(cur, i + delta + 1, BEFORE_ALIKES);
          delta += this._insert_pseudos(cur, i + delta + 1, AFTER_ALIKES);
        }
      }

      while (parent_stack.length)
      {
        delta += this._insert_pseudos(parent_stack.pop(),
                                      i + delta,
                                      AFTER_ALIKES);
      }
    }
  };

  this._insert_pseudos = function(node, index, alike)
  {
    var ret = [];

    if (node && node[PSEUDO_ELEMENT])
    {
      for (var i = 0, cur; cur = node[PSEUDO_ELEMENT][i]; i++)
      {
        if (alike.contains(cur[PSEUDO_TYPE]))
        {
          ret.push([node[ID],
                    PSEUDO_NODE,
                    PSEUDO_NAME[cur[PSEUDO_TYPE]],
                    node[DEPTH] + 1]);
        }
      }
    }

    if (ret.length)
    {
      this._data.insert(index, ret);
    }
    return ret.length;
  };

  this.__defineGetter__('isprocessing', function()
  {
    return this._isprocessing;
  });

  this.__defineSetter__('isprocessing', function(){});

  this.collapse = function(object_id)
  {
    var i = 0, j = 0, level = 0;
    for (; this._data[i] && this._data[i][ID] != object_id; i++ );
    if (this._data[i])
    {
      level = this._data[i][DEPTH];
      i += 1;
      j = i;
      while (this._data[j] && this._data[j][DEPTH] > level)
        j++;
      if (j - i)
      {
        this._data.splice(i, j - i);
      }
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      'missing refrence in collapse_node in DOMBaseData');
    }
  };

  this._get_element_name = function(data_entry, force_lower_case, with_ids_and_classes)
  {
    var name = data_entry[NAME], attrs = data_entry[ATTRS], id = '', class_name = '';
    if (force_lower_case)
      name = name.toLowerCase();
    if (with_ids_and_classes)
    {
      for (var attr, i = 0; attr = attrs[i]; i++)
      {
        if (attr[ATTR_KEY] == 'id')
          id = "#" + attr[ATTR_VALUE];
        if (attr[ATTR_KEY] == 'class' && attr[ATTR_VALUE].trim())
          class_name = "." + attr[ATTR_VALUE].trim().replace(/\s+/g, ".");
      }
    }
    return name + id + class_name;
  }

  this._parse_parent_offset = function(chain)
  {
    var ret = false, cur = null;
    if (chain)
    {
      cur = chain.pop();
      if (cur)
        ret = cur[1] == '1';
      else
        opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                        "failed in this._parse_parent_offset in InspectableDOMNode");
    }
    return ret;
  }

  this.get_css_path =
  this._get_css_path = function(object_id, parent_offset_chain,
                                force_lower_case, show_id_and_classes, show_siblings)
  {
    var i = 0, j = 0, path = [];
    if (object_id)
    {
      if (parent_offset_chain)
      {
        parent_offset_chain = parent_offset_chain.slice(0);
      }
      for ( ; this._data[i] && this._data[i][ID] != object_id; i++);
      if (this._data[i])
      {
        if (this._data[i][TYPE] == 1)
        {
          path.unshift({
            name: this._get_element_name(this._data[i], force_lower_case, show_id_and_classes),
            id: this._data[i][ID],
            combinator: "",
            is_parent_offset: this._parse_parent_offset(parent_offset_chain)
          });
        }
        j = i;
        i--;
        for ( ; this._data[i]; i--)
        {
          if (this._data[i][TYPE] == 1 && this._data[i][DEPTH] <= this._data[j][DEPTH])
          {
            if (this._data[i][DEPTH] < this._data[j][DEPTH])
            {
              path.unshift({
                name: this._get_element_name(this._data[i], force_lower_case, show_id_and_classes),
                id: this._data[i][ID],
                combinator: ">",
                is_parent_offset: this._parse_parent_offset(parent_offset_chain)
              });
            }
            else if (show_siblings)
            {
              path.unshift({
                name: this._get_element_name(this._data[i], force_lower_case, show_id_and_classes),
                id: this._data[i][ID],
                combinator: "+",
                is_parent_offset: false
              });
            }
            j = i;
          }
        }
      }
    }
    return path;
  }

  this.has_data = function()
  {
    return Boolean(this._data && this._data.length);
  }

  this.get_node = function(node_id)
  {
    if (this.has_data())
    {
      for (var i = 0; this._data[i] && this._data[i][ID] != node_id; i++);
      return this._data[i];
    }
    return null;
  };

  this.has_node = function(node_id)
  {
    return Boolean(this.get_node(node_id));
  };

  this.get_ev_listeners = function(node_id)
  {
    var node = this.get_node(node_id);
    return node && node[EVENT_LISTENER_LIST] || [];
  };

  this.get_data = this.getData = function()
  {
    return this._data;
  }

  this.getParentElement = function(obj_id)
  {
    var i = 0, depth = 0;
    for ( ; this._data[i] && this._data[i][ID] != obj_id; i++)
      ;
    if (this._data[i])
    {
      depth = this._data[i][DEPTH];
      for ( ; this._data[i] && !((this._data[i][TYPE] == 1 || this._data[i][TYPE] == 9) && this._data[i][DEPTH] < depth); i--);
      return this._data[i] && this._data[i][ID] || 0;
    }
  }

  this.getRootElement = function()
  {
    for (var i = 0; this._data[i] && this._data[i][TYPE] != 1; i++)
      ;
    return this._data[i] && this._data[i][ID] || 0;
  }

  this.get_depth_of_first_element = function()
  {
    for (var i = 0; this._data[i] && this._data[i][TYPE] != 1; i++)
      ;
    return this._data[i] && this._data[i][DEPTH] || 0;
  }

  this.getDataRuntimeId = function()
  {
    return this._data_runtime_id;
  }

  this._get_id = (function()
  {
    var id_counter = 0;
    return function()
    {
      id_counter++;
      return "dom-inspection-id-" + id_counter.toString();
    };
  })();

  this._init = function(rt_id, obj_id, has_error_handling)
  {
    this.id = this._get_id();
    this._data_runtime_id = rt_id || 0;  // data of a dom tree has always just one runtime
    this._root_obj_id = obj_id || 0;
    this._has_error_handling = has_error_handling;
    this._data = [];
    this._mime = '';
    if (!window.dominspections)
    {
      new cls.Namespace("dominspections");
    }
    window.dominspections.add(this);
  };

};
