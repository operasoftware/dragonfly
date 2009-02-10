var hostspotlighter = new function()
{
  const
  INITIAL_DIMENSION_COLOR = [54, 68, 130, .3 * 255],
  INITIAL_PADDING_COLOR = [54, 68, 130, .5 * 255],
  INITIAL_BORDER_COLOR = [54, 68, 130, .7 * 255],
  INITIAL_MARGIN_COLOR = [54, 68, 130, .9 * 255],
  INITIAL_FRAME_COLOR = [54, 68, 130, 1 * 255],
  INITIAL_GRID_COLOR = [170, 33, 18, .3 * 255];

  var self = this;
  var dimension_color = 0;
  var padding_color = 0;
  var border_color = 0;
  var margin_color = 0;
  var frame_color = 0;
  var grid_color = 0;

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

  var convert_rgba = function(arr)
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

  var set_initial_values = function()
  {
    dimension_color = convert_rgba(INITIAL_DIMENSION_COLOR);
    padding_color = convert_rgba(INITIAL_PADDING_COLOR);
    border_color = convert_rgba(INITIAL_BORDER_COLOR);
    margin_color = convert_rgba(INITIAL_MARGIN_COLOR);
    frame_color = convert_rgba(INITIAL_FRAME_COLOR);
    grid_color = convert_rgba(INITIAL_GRID_COLOR);
  }

  this.setRGBA = function(target, rgba_arr)
  {

  }

  this.setHex = function(target, hex)
  {

  }

  this.spotlight = function(node_id, scroll_into_view)
  {
    services['ecmascript-debugger'].post
    (
      "<spotlight-objects>" +
        "<spotlight-object>" +
          "<object-id>" + node_id + "</object-id>" +
          "<scroll-into-view>" + ( scroll_into_view && 1 || 0 ) + "</scroll-into-view>" +
          "<box>" +
            "<box-type>2</box-type>" +
            "<fill-color>" + border_color + "</fill-color>" +
            "<frame-color>" + frame_color + "</frame-color>" +
            "<grid-color>" + grid_color + "</grid-color>" +
          "</box>"  +
          "<box>" +
            "<box-type>1</box-type>" +
            "<fill-color>" + padding_color + "</fill-color>" +
          "</box>"  +
          "<box>" +
            "<box-type>0</box-type>" +
            "<fill-color>" + dimension_color + "</fill-color>" +
          "</box>"  +
        "</spotlight-object>" +
      "</spotlight-objects>"
    );
  }

  this.clearSpotlight = function()
  {
    services['ecmascript-debugger'].post("<spotlight-objects/>");
  }

  set_initial_values();
}