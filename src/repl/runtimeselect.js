cls.CndRtSelect = function(id, class_name)
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
    // TODO this is a relict of protocol 3, needs cleanup

    var active_window_id = runtimes.getActiveWindowId();

    if( active_window_id )
    {
      var
      _runtimes = runtimes.getRuntimes(active_window_id),
      rt = null,
      i = 0;

      for( ; ( rt = _runtimes[i] ) && !rt['selected']; i++);
      if( !rt && _runtimes[0] )
      {
        opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + 'no runtime selected')
        return;
      }
      return templates.runtime_dropdown(_runtimes);
    }

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
