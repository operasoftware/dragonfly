cls.CommandLineRuntimeSelect = function(id, class_name)
{

  var selected_value = "";

  this.getSelectedOptionText = function()
  {
    var selected_rt_id = runtimes.getSelectedRuntimeId();
    if( selected_rt_id )
    {
      var rt = runtimes.getRuntime(selected_rt_id);
      if( rt )
      {
        return rt['title'] || helpers.shortenURI(rt.uri).uri;
      }
    }
    return '';
  }

  this.getSelectedOptionValue = function()
  {

  }

  this.templateOptionList = function(select_obj)
  {
    return templates.runtime_dropdown(runtimes.get_dom_runtimes());
  }

  this.checkChange = function(target_ele)
  {
    var rt_id = parseInt(target_ele.getAttribute('rt-id'));
    if( rt_id && rt_id != runtimes.getSelectedRuntimeId() )
    {
      runtimes.setSelectedRuntimeId(rt_id);
    }
    return true;
  }

  this.init(id, class_name);
};
