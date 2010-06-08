(function()
{
  /*
          "<examine-objects rt-id='" + selectedObject.rt_id + "' " +
                "data-id=" + cur_data + " " +
                "obj-id='" + selectedObject.obj_id + "' >" +
              "<start-search-scope></start-search-scope>" +
              data_model.prettyPrint(data, -1, use_filter, data_model.filter_type) +
              "<end-search-scope></end-search-scope>" +
          "</examine-objects>";

  */
  this.inspect_object = function(data_model, path)
  {
    
    var obj = data_model.get_object();
    if (obj)
    {
      var inner = data_model.pretty_print(path);
      window.__t_2 = Date.now();
      return ( 
      [
        'examine-objects',
        'data-id', data_model.id,
        'rt-id', obj.rt_id.toString(),
        'obj-id', obj.obj_id.toString(),
        'innerHTML', inner
      ]);
    };
    return [];
  };

  this.inspected_js_object = function(model, show_root, path)
  {
    if (typeof show_root === 'boolean' && model.get_object())
    {
      path = show_root ? null : [model.get_object().obj_id];
    };
    
    return this.inspect_object(model, path);
  }


}).apply(window.templates || (window.templates = {}));