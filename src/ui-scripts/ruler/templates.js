
(function()
{

  const MIN_WIDTH = 30;
  const SCALES = {};

  SCALES[50] = [50, 10, 2];
  SCALES[20] = [20, 10, 1];
  SCALES[10] = [10, 5, 1];
  SCALES[5] = [5, 1, 1];
  SCALES[1] = [10, 5, 1];

  this.ruler = function(ruler)
  {
    return ['div',this.ruler_body(ruler),'class', cls.Ruler.BASE_CLASS];
  };

  this.ruler_body = function(ruler)
  {
    var label_width = [50, 20, 10, 5, 1].reduce(function(scale, iter)
    {
      return iter * ruler.scale > MIN_WIDTH ? iter : scale;
    }, 50);
    var pixel_width = label_width * ruler.scale;
    var scales = this._get_scales(label_width, ruler.scale);

    return (
    ['div',
      ['div', 'class', 'ruler-top-bg'],
      ['div', 'class', 'ruler-right-bg'],
      ['div', 'class', 'ruler-bottom-bg'],
      ['div', 'class', 'ruler-left-bg'],
      this._ruler_top_labels(label_width, pixel_width, ruler.target_width),
      this._ruler_left_labels(label_width, pixel_width, ruler.target_height),
      this._ruler_top_scale(scales),
      this._ruler_right_scale(scales),
      this._ruler_bottom_scale(scales),
      this._ruler_left_scale(scales),
      ['span', 'class', cls.Ruler.CLOSE_BUTTON_CLASS],
      'style', 'top:' + ruler.top + 'px;' +
               'left:' + ruler.left + 'px;' +
               'width:' + ruler.width + 'px;' +
               'height:' + ruler.height + 'px;',
      'class', 'ruler-body']);
  };

  this._get_scales = function(label_width, scale)
  {
    return SCALES[label_width].map(function(s){return scale * s});
  };

  this._ruler_top_scale = function(scales)
  {
    var style = "background-size: " + scales[2] + "px 3px, " +
                                      scales[1] + "px 6px, " +
                                      scales[0] + "px 10px;";
    return ['div', 'style', style, 'class', 'ruler-top-scale'];
  };

  this._ruler_bottom_scale = function(scales)
  {
    var style =
    "background-size: " + scales[2] + "px 3px, " +
                          scales[1] + "px 6px, " +
                          scales[0] + "px 10px;";
    return ['div', 'style', style, 'class', 'ruler-bottom-scale'];
  };

  this._ruler_left_scale = function(scales)
  {
    var style = "background-size: 3px " + scales[2] + "px, " +
                                 "6px " + scales[1] + "px, " +
                                 "9px " + scales[0] + "px;";
    return ['div', 'style', style, 'class', 'ruler-left-scale'];
  };

  this._ruler_right_scale = function(scales)
  {
    var style = "background-size: 3px " + scales[2] + "px, " +
                                 "6px " + scales[1] + "px, " +
                                 "9px " + scales[0] + "px;";
    return ['div', 'style', style, 'class', 'ruler-right-scale'];
  };

  this._ruler_top_labels = function(label_width, pixel_width, max_width)
  {
    var labels = ['div'], i = 0;
    while (true)
    {
      labels.push(
      ['span',
        i * pixel_width <= max_width ? String(i * label_width) : '\u00A0',
        'style', 'width: ' + pixel_width + 'px;' +
                 (!i ? "margin-left: -" + (pixel_width / 2 >> 0) + "px;" : ""),
        'class', 'ruler-label-top']);
      if (i * pixel_width > max_width + pixel_width)
      {
        break;
      }
      i++;
    }
    labels.push('class', 'ruler-labels-top');
    return labels;
  };

  this._ruler_left_labels = function(label_width, pixel_width, max_width)
  {
    var labels = ['div'], i = 0;
    while (true)
    {
      labels.push(
      ['span',
        i * pixel_width <= max_width ? String(i * label_width) : '\u00A0',
        'style', 'height: ' + pixel_width + 'px;' +
                 'line-height: ' + pixel_width + 'px;' +
                 (!i ? "margin-top: -" + (pixel_width / 2 >> 0) + "px;" : ""),
        'class', 'ruler-label-left']);
      if (i * pixel_width > max_width + pixel_width)
      {
        break;
      }
      i++;
    }
    labels.push('class', 'ruler-labels-left');
    return labels;
  };

}).apply(window.templates || (window.templates = {}));
