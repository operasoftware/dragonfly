var hostspotlighter = new function()
{
  const
  INITIAL_DIMENSION_COLOR = [54, 68, 130, .3 * 255],
  INITIAL_PADDING_COLOR = [54, 68, 130, .5 * 255],
  INITIAL_BORDER_COLOR = [54, 68, 130, .7 * 255],
  INITIAL_MARGIN_COLOR = [54, 68, 130, .9 * 255],
  INITIAL_FRAME_COLOR = [54, 68, 130, 1 * 255],
  INITIAL_GRID_COLOR = [170, 33, 18, .3 * 255];
  INITIAL_LOCKED_COLOR = [170, 33, 18, .5 * 255];

  var self = this;
  var host_colors = {};
  var client_colors = {};

  const
  DIMENSION = 0,
  PADDING = 1,
  BORDER = 2,
  MARGIN = 3,
  FILL = 0,
  FRAME = 1,
  GRID = 2,
  START_TAG = ["<fill-color>", "<frame-color>", "<grid-color>"],
  END_TAG = ["</fill-color>", "</frame-color>", "</grid-color>"];

  var matrixes =
  {
    "default": [],
    "metrics-hover": [],
    "locked": []
  }


  var parse_int_16 = function(str)
  {
    return parseInt(str, 16);
  };

  var convert_hex = function(hex)
  {
    if(hex && hex.length == 8)
    {
      return /(..)(..)(..)(..)/.exec(hex).slice(1).map(parse_int_16);
    }
    return 0;
  }

  var convert_rgba_to_int = function(arr)
  {
    var i = 4, ret = 0;
    if(arr && arr.length == 4)
    {
      for( ; i--; )
      {
        ret += arr[3-i] << (i * 8);
      }
    }
    return ret;
  }
  // adjust the luminosity with the alpah channel
  var convert_rgba_to_hex = function(arr)
  {
    var i = 4, ret = 0;
    if(arr && arr.length == 4)
    {
      colors.setRGB(arr.slice(0,3));
      var l = parseFloat(colors.getLuminosity());
      colors.setLuminosity(l + (100 - l) * (1 - arr[3]/255));
      return "#" + colors.getHex();
    }
    return "";
  }

  var set_metrics_matrixes = function( metrics_inner_inner, metrics_inner, metrics_active)
  {

  }

  var setMetricsHoverMatrixes = function(matrix)
  {

  }


  var set_initial_values = function()
  {
    var 
    matrix = matrixes["default"],
    source_matrix = ini.hostspotlight_matrixes["default"],
    temp = null,
    box = null,
    color = null,
    i = 0,
    j = 0;

    for( ; i < 4; i++ )
    {
      if( box = source_matrix[i] )
      {
        matrix[i] = [];
        for( j = 0; j < 3; j++)
        {
          matrix[i][j] = (color = box[j]) && convert_rgba_to_int(color) || 0;
        }
      }
      else
      {
        matrix[i] = null;
      }
    }

    matrix = [];
    source_matrix = ini.hostspotlight_matrixes["default"]
    for( i = 0; i < 3; i++ )
    {
      if( box = source_matrix[i] )
      {
        matrix[i] = [];
        for( j = 0; j < 3; j++)
        {
          matrix[i][j] = (color = box[j]) && convert_rgba_to_int(color) || 0;
        }
      }
      else
      {
        matrix[i] = null;
      }
    }

    setMetricsHoverMatrixes(matrix);



    host_colors.dimension = convert_rgba_to_int(INITIAL_DIMENSION_COLOR);
    client_colors.dimension = convert_rgba_to_hex(INITIAL_DIMENSION_COLOR);
    host_colors.padding = convert_rgba_to_int(INITIAL_PADDING_COLOR);
    host_colors.border = convert_rgba_to_int(INITIAL_BORDER_COLOR);
    host_colors.margin = convert_rgba_to_int(INITIAL_MARGIN_COLOR);
    client_colors.margin = convert_rgba_to_hex(INITIAL_MARGIN_COLOR);
    host_colors.frame = convert_rgba_to_int(INITIAL_FRAME_COLOR);
    host_colors.grid = convert_rgba_to_int(INITIAL_GRID_COLOR);
    host_colors.locked = convert_rgba_to_int(INITIAL_LOCKED_COLOR);
    
  }

  this.setRGBA = function(target, rgba_arr)
  {

  }

  this.setHex = function(target, hex)
  {

  }

  this.get_command = function(node_id, scroll_into_view, matrix)
  {
    var ret = \
    "<spotlight-object>" +
    "<object-id>" + node_id + "</object-id>" +
    "<scroll-into-view>" + ( scroll_into_view && 1 || 0 ) + "</scroll-into-view>",
    box = null, 
    i = 0, 
    j = 0;

    for( ; i < 4; i++)
    {
      if( box = matrix[i] )
      {
        ret += "<box><box-type>" + i + "</box-type>";
        for( j = 0; j < 3; j++ )
        {
          if( box[j] )
          {
            ret += START_TAG[j] + box[j] + END_TAG[j];
          }
        }
        ret += "</box>";
      }
    }
    ret += "</spotlight-object>";
    return ret;
  }

  this.spotlight = function(node_id, scroll_into_view)
  {
    services['ecmascript-debugger'].post
    (
      "<spotlight-objects>" +
       this.get_command(node_id, scroll_into_view, matrixes["default"]) +
      "</spotlight-objects>"
    )
  }

  this.spotlight_dimension = function(node_id, scroll_into_view)
  {
    services['ecmascript-debugger'].post
    (
      "<spotlight-objects>" +
        "<spotlight-object>" +
          "<object-id>" + node_id + "</object-id>" +
          "<scroll-into-view>0</scroll-into-view>" +
          "<box>" +
            "<box-type>0</box-type>" +
            "<fill-color>" + host_colors.border + "</fill-color>" +
            //"<frame-color>" + host_colors.frame + "</frame-color>" +
            "<grid-color>" + host_colors.grid + "</grid-color>" +
          "</box>"  +
        "</spotlight-object>" +
        getSpotlighLockedElements() +
      "</spotlight-objects>"
    );
  }
  this.spotlight_padding = function(node_id, scroll_into_view)
  {
    services['ecmascript-debugger'].post
    (
      "<spotlight-objects>" +
        "<spotlight-object>" +
          "<object-id>" + node_id + "</object-id>" +
          "<scroll-into-view>0</scroll-into-view>" +
          "<box>" +
            "<box-type>1</box-type>" +
            "<fill-color>" + host_colors.border + "</fill-color>" +
            //"<frame-color>" + host_colors.frame + "</frame-color>" +
            "<grid-color>" + host_colors.grid + "</grid-color>" +
          "</box>"  +
          "<box>" +
            "<box-type>0</box-type>" +
            "<fill-color>" + host_colors.dimension + "</fill-color>" +
            "<frame-color>" + host_colors.frame + "</frame-color>" +
          "</box>"  +
        "</spotlight-object>" +
        getSpotlighLockedElements() +
      "</spotlight-objects>"
    );
  }
  this.spotlight_border = function(node_id, scroll_into_view)
  {
    services['ecmascript-debugger'].post
    (
      "<spotlight-objects>" +
        "<spotlight-object>" +
          "<object-id>" + node_id + "</object-id>" +
          "<scroll-into-view>0</scroll-into-view>" +
          "<box>" +
            "<box-type>2</box-type>" +
            "<fill-color>" + host_colors.border + "</fill-color>" +
            //"<frame-color>" + host_colors.frame + "</frame-color>" +
            "<grid-color>" + host_colors.grid + "</grid-color>" +
          "</box>"  +
          "<box>" +
            "<box-type>1</box-type>" +
            "<fill-color>" + host_colors.dimension + "</fill-color>" +
            "<frame-color>" + host_colors.frame + "</frame-color>" +
          "</box>"  +
          "<box>" +
            "<box-type>0</box-type>" +
            "<fill-color>" + host_colors.dimension + "</fill-color>" +
          "</box>"  +
        "</spotlight-object>" +
        getSpotlighLockedElements() +
      "</spotlight-objects>"
    );
  }
  this.spotlight_margin = function(node_id, scroll_into_view)
  {
    services['ecmascript-debugger'].post
    (
      "<spotlight-objects>" +
        "<spotlight-object>" +
          "<object-id>" + node_id + "</object-id>" +
          "<scroll-into-view>0</scroll-into-view>" +
          "<box>" +
            "<box-type>3</box-type>" +
            "<fill-color>" + host_colors.border + "</fill-color>" +
            //"<frame-color>" + host_colors.frame + "</frame-color>" +
            "<grid-color>" + host_colors.grid + "</grid-color>" +
          "</box>"  +
          "<box>" +
            "<box-type>2</box-type>" +
            "<fill-color>" + host_colors.dimension + "</fill-color>" +
            "<frame-color>" + host_colors.frame + "</frame-color>" +
          "</box>"  +
          "<box>" +
            "<box-type>1</box-type>" +
            "<fill-color>" + host_colors.dimension + "</fill-color>" +
          "</box>"  +
          "<box>" +
            "<box-type>0</box-type>" +
            "<fill-color>" + host_colors.dimension + "</fill-color>" +
          "</box>"  +
        "</spotlight-object>" +
        getSpotlighLockedElements() +
      "</spotlight-objects>"
    );
  }

  var mouse_handler_target = null;
  var mouse_handler_timeouts = new Timeouts();
  var colors = new Colors();
  var class_names = ['margin', 'border', 'padding', 'dimension'];
  this.clearMouseHandlerTarget = function()
  {
    var index = 0, style = null;
    if(mouse_handler_target)
    {
      style = mouse_handler_target.style;
      style.removeProperty('background-color');  
      style.removeProperty('color');  
      index = class_names.indexOf(mouse_handler_target.className) + 1;
      if( index && index < 4 )
      {
        style = mouse_handler_target.getElementsByClassName(class_names[index])[0].style;
        style.removeProperty('background-color');
        style.removeProperty('color');
      }
      self.clearSpotlight();
    }
    mouse_handler_target = null;    
  }
  var setStyleMouseHandlerTarget = function(target, class_name)
  {
    mouse_handler_target = target;
    target.style.backgroundColor = client_colors.margin;
    target.style.color = "#fff"; //client_colors.margin;
    var index = class_names.indexOf(class_name) + 1, style = null;
    if( index && index < 4 )
    {
      style = target.getElementsByClassName(class_names[index])[0].style
      style.backgroundColor = client_colors.dimension;
      style.color = "#000"; //client_colors.dimension;
    }
  }
  // mouseover handler in Layout Metrics
  this.metricsMouseoverHandler = function(event)
  {
    var target = event.target, class_name = '';
    while(target && target != this 
            && !(class_name = target.className) &&  ( target = target.parentNode ) );
    if( target && class_name )
    {
      mouse_handler_timeouts.clear();
      self.clearMouseHandlerTarget();
      setStyleMouseHandlerTarget(target, class_name);
      self['spotlight_' + class_name](dom_data.getCurrentTarget());
    }
  }
  // mouseover handler in Layout Metrics
  this.metricsMouseoutHandler = function(event)
  {
    var target = event.target, class_name = '';
    while(target && target != this 
            && !(class_name = target.className) &&  ( target = target.parentNode ) );
    if( target && class_name && /^margin$/.test(class_name)  )
    {
      mouse_handler_timeouts.set(self.clearMouseHandlerTarget, 50);
    }
  }

  this.clearSpotlight = function()
  {
    services['ecmascript-debugger'].post("<spotlight-objects/>");
  }
  //{obj_id: obj_id, rt_id: data_runtime_id});
  var getSpotlighLockedElements = function()
  {
    var ret = "", cursor = null, i = 0;
    if(settings.dom.get('lock-selecked-elements'))
    {
      for( ; cursor = locked_elements[i]; i++)
      {
        ret += \
        "<spotlight-object>" +
          "<object-id>" + cursor + "</object-id>" +
          "<scroll-into-view>0</scroll-into-view>" +
          "<box>" +
            "<box-type>2</box-type>" +
            "<frame-color>" + host_colors.locked + "</frame-color>" +
          "</box>"  +
        "</spotlight-object>";
      }
    }
    return ret;
  }
  // {activeTab: __activeTab} 
  // TODO make a new message for new top runtime
  var onActiveTab = function(msg)
  {
    if( msg.activeTab[0] != top_runtime )
    {
      top_runtime = msg.activeTab[0];
      locked_elements = [];
    }
  }
  var locked_elements = [];
  var top_runtime ='';
  var settings_id = 'dom';
  var onElementSelected = function(msg)
  {
    if(settings.dom.get('lock-selecked-elements'))
    {
      locked_elements[locked_elements.length] = msg.obj_id;
    }
  }
  var onSettingChange = function(msg)
  {
    if( msg.id == settings_id )
    {

      switch (msg.key)
      {
        case 'lock-selecked-elements':
        {
          if(!settings[settings_id].get(msg.key))
          {
            locked_elements = [];
            self.clearSpotlight();
          }
          break;
        }
      }
    }
  }

  messages.addListener("element-selected", onElementSelected); 
  messages.addListener('active-tab', onActiveTab);
  messages.addListener('setting-changed', onSettingChange);

  set_initial_values();
}