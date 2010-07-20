window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["5.0"] || (cls.EcmascriptDebugger["5.0"] = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

/**
  * @constructor 
  */

cls.EcmascriptDebugger["6.0"].DOMBaseData =
cls.EcmascriptDebugger["5.0"].DOMBaseData = new function()
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
  SYSTEM_ID = 5;

  this._set_mime = function()
  {
    for (var node = null, i = 0; node = this._data[i]; i++)
    {
      if (node[TYPE] == 1 )
      {
        // TODO take in account doctype if present
        return /^[A-Z]*$/.test(node[NAME]) && "text/html" || "application/xml";
      }
    }
  };

  this.isTextHtml = function()
  {
    return this._data.length && this._mime == "text/html" || false;
  };

  this._get_dom = function(object_id, traverse_type, cb)
  {
    var tag = window.tag_manager.set_callback(this, this.__handle_dom, [object_id, traverse_type, cb]);
    services['ecmascript-debugger'].requestInspectDom(tag, [object_id, traverse_type]);
  };

  this.__handle_dom = function(status, message, object_id, traverse_type, cb)
  {
    var
    _data = message[NODE_LIST],  
    error_ms = ui_strings.DRAGONFLY_INFO_MESSAGE + 'this.__handle_dom failed in DOMBaseData',
    splice_args = null,
    i = 0;
    
    if (!status)
    {
      switch (traverse_type)
      {
        // traverse_type 'node' so far not supported
        case "parent-node-chain-with-children":
        {
          this._data = _data;
          break;
        }
        case "subtree":
        case "children":
        {
          for (; this._data[i] && this._data[i][ID] != object_id; i++);
          if (this._data[i])
          {
            // if object_id matches the one of the first node 
            // of the return data the traversal was subtree
            splice_args = object_id == _data[0][ID] ? [i, 1] : [i + 1, 0];
            Array.prototype.splice.apply(this._data, splice_args.concat(_data));
          }
          else if (!this._data.length)
            this._data = _data;
          else
            opera.postError(error_ms);
          break;
        }
      }
      this._mime = this._set_mime();
      cb();
    }
    else
      opera.postError(error_ms);
  };

  this.collapse_node = function(object_id)
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
      this._data.splice(i, j - i);
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
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
        if (attr[ATTR_KEY] == 'class') 
          class_name = "." + attr[ATTR_VALUE].replace(/ /g, "."); 
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
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
                        "failed in this._parse_parent_offset in dom_data");
    }
    return ret;
  }

  this._get_css_path = function(object_id, parent_offset_chain, 
                                force_lower_case, show_id_and_classes, show_siblings)
  {
    var i = 0, j = 0, path = [];
    if (object_id)
    {
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

  this.getData = function()
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

  this._id_counter = 0;
  this._get_id = function()
  {
    this._id_counter++;
    return "dom-inspection-id-" + this._id_counter.toString();
  };

  this._init = function(id)
  {
    this.id = id || this._get_id();
    if (!window.dominspections)
    {
      new cls.Namespace("dominspections");
    }
    window.dominspections.add(this);
    this._data = [];
  };

};
