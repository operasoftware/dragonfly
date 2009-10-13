window.templates = window.templates || {};

// TODO create text strings
      
window.templates.color_picker = function(
    width, height, cell_width, cell_height, max_pixel, cur_scale, delta_scale, max_dimensions)
{
  return (
    ['div',
        ['div',
          ['h2', 'Pixel Magnifier and Color Picker'],
          ['p', 
            ['input',
                'type', 'button',
                'handler', 'utils-color-picker',
                'value', window.color_picker_data.get_active_state() && "Stop" || "Start"
            ],
            ' ',
            ['label', 
              'Area' + ': ',
              ['select', 
                this.color_picker_create_dimesion_select(width, max_pixel),
                'id', 'color-picker-area', 
                'handler', 'update-area']
            ],
            ' ',
            ['label', 
              'Scale' + ': ',
              ['select', 
                this.color_picker_create_scale_select(width, cur_scale, delta_scale, max_dimensions),
                'id', 'color-picker-scale', 
                'handler', 'update-color-picker-scale']
            ],
          'class', 'controls'],
          ['div',
            this.color_picker_create_table(width, height, cell_width, cell_height),
            'id', 'table-container',
            'handler', 'color-picker-picked'],
          ['h2', 'Color Select'],
          this.color_picker_average_select(),
          ['div', 'id', 'center-color'],
          ['pre', 'id', 'center-color-values'],
        'class', 'color-picker'],
      'class', 'padding']);
}

window.templates.color_picker_average_select = function()
{
  var ret = [], i = 1, average = window.views.color_picker.get_average();
  for( ; i < 10; i+=2)
  {
    ret[ret.length] = 
      ['option', i + ' x ' + i, 'value', i.toString()].
        concat(average == i ? ['selected', 'selected'] : []);
  }
  return (
    ['p', 
      ['label', 'Average color of ',
        ['select', ret, 'handler', 'update-average'],
        ' pixels'],
    ]);
}

window.templates.color_picker_create_table = function(width, height, cell_width, cell_height)
{
  var 
  ret = [], 
  tr = ['tr'], 
  i = 0, 
  cell_count = width * height,
  style = 'height:' + cell_height + 'px;width:' + cell_width + 'px;';

  for( ; i < cell_count; i++)
  {
    if( i && !(i % width))
    {
      ret[ret.length] = tr;
      tr = ['tr'];
    }
    tr[tr.length] = ['td', 'style', style, 'data-index', i.toString()];
    
  }
  ret[ret.length] = tr;
  return ['table', ret];
}

window.templates.color_picker_create_dimesion_select = function(width, max_pixel)
{
  var ret = [], i = 3;
  for( ; i <= max_pixel; i+=2)
  {
    ret[ret.length] = 
      ['option', i + " x " + i, 'value', i.toString()].
      concat(i == width ? ['selected', 'selected'] : []);
  }
  return ret;
}

window.templates.color_picker_create_scale_select = function(width, cur_scale, delta_scale, max_dimensions)
{
  var ret = [], max_scale = max_dimensions / width >> 0, i = delta_scale;
  for( ; i <= max_scale; i += delta_scale)
  {
    ret[ret.length] = 
      ['option', i.toString()].
      concat(i == cur_scale ? ['selected', 'selected'] : []);
  }
  return ret;
}
