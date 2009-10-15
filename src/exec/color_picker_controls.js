eventHandlers.click['utils-color-picker'] = function(event, target)
{
  var is_active = window.color_picker_data.get_active_state();
  window.color_picker_data.set_active_state(!is_active);
  event.target.value = is_active && "Start" || "Stop";
}

eventHandlers.change["set-color-picker-scale"] = function(event, target)
{
  window.views.color_picker.set_scale(parseInt(target.value));
}

eventHandlers.change["update-area"] = function(event, target)
{
  window.color_picker_data.set_screenshot_dimension(parseInt(target.value));
}

eventHandlers.change["update-average"] = function(event, target)
{
  window.views.color_picker.set_average_dimension(parseInt(target.value));
}

eventHandlers.click["color-picker-picked"] = function(event, target)
{
  window.views.color_picker.pick_color(event, target); 
}
