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
    return ( 
    [
      'examine-objects',
      'data-id', data_model.id,
      'rt-id', obj.rt_id.toString(),
      'obj-id', obj.obj_id.toString(),
      'innerHTML', data_model.pretty_print(path)
    ]);
  }

}).apply(window.templates || (window.templates = {}));