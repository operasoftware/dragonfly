window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["5.0"] || (cls.EcmascriptDebugger["5.0"] = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  */

cls.EcmascriptDebugger["6.0"].InspectableDOMNode =
cls.EcmascriptDebugger["5.0"].InspectableDOMNode = function(rt_id, obj_id)
{
  this._init(rt_id, obj_id);
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

cls.EcmascriptDebugger["6.0"].InspectableDOMNode.prototype = new function()
{
  
  const 
  NODE_LIST = 0,
  ID = 0, 
  TYPE = 1, 
  NAME = 2, 
  DEPTH = 3,

  ATTRS = 5,
  ATTR_PREFIX = 0,
  ATTR_KEY = 1, 
  ATTR_VALUE = 2,
  CHILDREN_LENGTH = 6, 
  PUBLIC_ID = 4,
  SYSTEM_ID = 5,
  MATCH_REASON = cls.EcmascriptDebugger["6.0"].InspectableDOMNode.MATCH_REASON,
  TRAVERSE_SEARCH = "search",
  TRAVERSAL = 1,
  SEARCH_PARENT = 2,
  SEARCH_HIT = 3;

  this._set_mime = function()
  {
    if (this._data)
      for (var node = null, i = 0; node = this._data[i]; i++)
      {
        if (node[TYPE] == 1 )
        {
          // TODO take in account doctype if present
          return /^[A-Z]*$/.test(node[NAME]) && "text/html" || "application/xml";
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

  // workaround for bug CORE-16147
  this.getDoctypeName = function()
  {
    for (var node = null, i = 0; node = this._data[i]; i++)
    {
      if (node[TYPE] == 1)
        return node[NAME];
    }
    return null;
  }

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
              splice_args = [i + 1, 0];
              if (object_id == _data[0][ID])
              {
                this.collapse(object_id);
                splice_args = [i, 1]
              }
              Array.prototype.splice.apply(this._data, splice_args.concat(_data));
            }
          }
          else if (!this._data.length)
            this._data = _data;
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
    else
    {
      opera.postError(error_ms + ' ' + JSON.stringify(message));
    }
    this._isprocessing = false;
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
        path.push({
          name: this._get_element_name(this._data[i], force_lower_case, show_id_and_classes), 
          id: this._data[i][ID],
          combinator: "", 
          is_parent_offset: this._parse_parent_offset(parent_offset_chain) 
        });
        j = i;
        i--;
        for (  ; this._data[i]; i--)
        {
          if(this._data[i][TYPE] == 1)
          {
            if(this._data[i][DEPTH] <= this._data[j][DEPTH])
            {
              if (this._data[i][DEPTH] < this._data[j][DEPTH])
                path.push({
                  name: this._get_element_name(this._data[i], force_lower_case, show_id_and_classes), 
                  id: this._data[i][ID], 
                  combinator: ">" ,
                  is_parent_offset: this._parse_parent_offset(parent_offset_chain) 
                });
              else if (show_siblings)
                path.push({
                  name: this._get_element_name(this._data[i], force_lower_case, show_id_and_classes), 
                  id: this._data[i][ID], 
                  combinator: "+",
                  is_parent_offset: false
                });
              j = i;
            }
          } 
        }
      }
    }
    return path.reverse();
  }

  this.has_data = function()
  {
    return Boolean(this._data && this._data.length);
  }

  this.has_node = function(node_id)
  {
    for (var i = 0; this._data[i] && this._data[i][ID] != node_id; i++);
    return Boolean(this._data[i]);
  }

  this.get_data = this.getData = function()
  {
    return this._data;
  }

  this.getParentElement = function(obj_id)
  {
    var i = 0, depth = 0;
    for ( ; this._data[i] && this._data[i][ID] != obj_id; i++);
    if (this._data[i])
    {
      depth = this._data[i][DEPTH];
      for ( ; this._data[i] && !((this._data[i][TYPE] == 1 || this._data[i][TYPE] == 9) && this._data[i][DEPTH] < depth); i--);
      return this._data[i] && this._data[i][ID] || 0;
    }
  }

  this.getRootElement = function()
  {
    for (var i = 0; this._data[i] && this._data[i][TYPE] != 1; i++);
    return this._data[i] && this._data[i][ID] || 0;
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

  this._init = function(rt_id, obj_id)
  {
    this.id = this._get_id();
    this._data_runtime_id = rt_id || 0;  // data of a dom tree has always just one runtime
    this._root_obj_id = obj_id || 0;
    this._data = [];
    this._mime = '';
    if (!window.dominspections)
    {
      new cls.Namespace("dominspections");
    }
    window.dominspections.add(this);
  };

};
