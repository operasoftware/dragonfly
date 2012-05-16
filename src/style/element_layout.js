"use strict";

window.cls || (window.cls = {});

/**
 * @constructor
 */
cls.ElementLayout = function()
{
  this._es_debugger = window.services['ecmascript-debugger'];
  this._tag_manager = cls.TagManager.get_instance();
  this._stylesheets = window.stylesheets;
  this._css_index_map = null;
  this._selected_element = null;
  this._comp_style = null;
  this._offset_values = "";
  this._views = ['css-layout'];

  var OFFSET_TOP = 1;
  var OFFSET_LEFT = 2;
  var OFFSET_WIDTH = 3;
  var OFFSET_HEIGHT = 4;
  var SCROLL_TOP = 5;
  var SCROLL_LEFT = 6;
  var SCROLL_WIDTH = 7;
  var SCROLL_HEIGHT = 8;
  var CLIENT_TOP = 9;
  var CLIENT_LEFT = 10;
  var CLIENT_WIDTH = 11;
  var CLIENT_HEIGHT = 12;
  var OFFSETS = cls.ElementLayout.OFFSETS;
  var OFFSETS_SCRIPT = "\
    (function(ele)\
    {\
      var \
      parent = ele,\
      log = ele.nodeName + '|0;',\
      offsetParent = ele.offsetParent,\
      offsets =\
      [\
        '" + OFFSETS[OFFSET_TOP] + "',\
        '" + OFFSETS[OFFSET_LEFT] + "',\
        '" + OFFSETS[OFFSET_WIDTH] + "',\
        '" + OFFSETS[OFFSET_HEIGHT] + "',\
        '" + OFFSETS[SCROLL_TOP] + "',\
        '" + OFFSETS[SCROLL_LEFT] + "',\
        '" + OFFSETS[SCROLL_WIDTH] + "',\
        '" + OFFSETS[SCROLL_HEIGHT] + "',\
        '" + OFFSETS[CLIENT_TOP] + "',\
        '" + OFFSETS[CLIENT_LEFT] + "',\
        '" + OFFSETS[CLIENT_WIDTH] + "',\
        '" + OFFSETS[CLIENT_HEIGHT] + "'\
      ],\
      offset = '',\
      i = 0;\
      while ((parent = parent.parentNode) && parent.nodeType == 1)\
      {\
        if (parent == offsetParent)\
        {\
          log = parent.nodeName + '|1,' + log;\
          offsetParent = parent.offsetParent;\
        }\
        else\
        {\
          log = parent.nodeName + '|0,' + log;\
        }\
      };\
      for ( ; offset = offsets[i]; i++)\
      {\
        log += ele[offset] + ';';\
      }\
      return log;\
    })(ele)\
    ";

  this._on_element_selected = function(msg)
  {
    this._comp_style = null;
    this._offset_values = "";
    this._selected_element = msg.rt_id && msg.obj_id
                           ? {rt_id: msg.rt_id,
                              obj_id: msg.obj_id,
                              model: msg.model}
                           : null;

    for (var i = 0, view_id; view_id = this._views[i]; i++)
    {
      window.views[view_id].update();
    }
  };

  this.has_selected_element = function()
  {
    return Boolean(this._selected_element);
  };

  this.get_layout_values = function(callback)
  {
    if (!this._selected_element)
    {
      callback(null);
      return;
    }

    if (this._comp_style)
    {
      callback(this._comp_style);
      return;
    }

    var rt_id = this._selected_element.rt_id;
    var obj_id = this._selected_element.obj_id;

    if (this._stylesheets.has_stylesheets_runtime(rt_id))
    {
      var tag = this._tag_manager.set_callback(this, this._handle_get_metrics_data, [rt_id, obj_id, callback]);
      this._es_debugger.requestCssGetStyleDeclarations(tag, [rt_id, obj_id]);
    }
    else
    {
      this._stylesheets.get_stylesheets(this._selected_element.rt_id, this.get_layout_values.bind(this, callback));
    }
  };

  this._handle_get_metrics_data = function(status, message, rt_id, obj_id, callback, index_map)
  {
    var COMPUTED_STYLE_LIST = 0;
    var NODE_STYLE_LIST = 1;

    this._comp_style = message[COMPUTED_STYLE_LIST];
    if (!this._css_index_map)
    {
      if (!index_map)
      {
        window.stylesheets.get_css_index_map(this._handle_get_metrics_data.bind(this, status, message, rt_id, obj_id, callback));
        return;
      }
      else
      {
        this._css_index_map = index_map;
      }
    }

    if (callback)
      callback(this._comp_style);
  };

  this.get_offset_values = function(cb)
  {
    if (!this._selected_element)
    {
      cb(null);
    }
    else if (this._offset_values)
    {
      cb(window.helpers.copy_object(this._offset_values));
    }
    else
    {
      var rt_id = this._selected_element.rt_id;
      var obj_id = this._selected_element.obj_id;
      var tag = this._tag_manager.set_callback(null, this._handle_get_offset_data_bound, [rt_id, obj_id, cb]);
      this._es_debugger.requestEval(tag, [rt_id, 0, 0, OFFSETS_SCRIPT, [['ele', obj_id]]]);
    }
  };

  this._handle_get_offset_data = function(status, message, rt_id, obj_id, cb)
  {
    var STATUS = 0;
    var VALUE = 2;
    if (message[STATUS] == 'completed')
    {
      this._offset_values = this._parse_offset_values(message[VALUE]);
      if (cb)
        cb(window.helpers.copy_object(this._offset_values));
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
        '_handle_get_offset_data failed')
    }
  };

  this._handle_get_offset_data_bound = this._handle_get_offset_data.bind(this);

  this._parse_offset_values = function(offset_values)
  {
    var data = offset_values.slice(0, -1).split(';'); // Remove the last ';' before splitting
    data[0] = data[0].split(',').map(function(item){
      return item.split('|');
    });
    return data;
  };

  this.get_metrics_template = function(comp_style)
  {
    var index_map = this._css_index_map;
    var is_positioned = comp_style[index_map.indexOf("position")] != "static";
    var width = this._get_dimension("width", comp_style);
    var height = this._get_dimension("height", comp_style);
    return (
      ['div',
        ['ul',
          ['li',
            ['ul',
              ['li',
                ['p',
                  '\u00A0',
                  ['span',
                    is_positioned
                    ? 'position'
                    : '\u00A0'
                  ]
                ]
              ],
              ['li',
                is_positioned
                ? this._convert_to_unitless(comp_style[index_map.indexOf("top")], true)
                : '\u00A0'
              ],
              ['li']
            ],
            ['ul',
              ['li',
                is_positioned
                ? this._convert_to_unitless(comp_style[index_map.indexOf("left")], true)
                : '\u00A0'
              ],
              ['li',
                ['ul',
                  ['li',
                    ['p',
                      '\u00a0',
                      ['span',
                        'margin'
                      ]
                    ]
                  ],
                  ['li',
                    this._convert_to_unitless(comp_style[index_map.indexOf("margin-top")])
                  ],
                  ['li']
                ],
                ['ul',
                  ['li',
                    this._convert_to_unitless(comp_style[index_map.indexOf("margin-left")])
                  ],
                  ['li',
                    ['ul',
                      ['li',
                        ['p',
                          '\u00a0',
                          ['span',
                            'border'
                          ]
                        ]
                      ],
                      ['li',
                        this._convert_to_unitless(comp_style[index_map.indexOf("border-top-width")])
                      ],
                      ['li']
                    ],
                    ['ul',
                      ['li',
                        this._convert_to_unitless(comp_style[index_map.indexOf("border-left-width")])
                      ],
                      ['li',
                        ['ul',
                          ['li',
                            ['p',
                              '\u00a0',
                              ['span',
                                'padding'
                              ]
                            ]
                          ],
                          ['li',
                            this._convert_to_unitless(comp_style[index_map.indexOf("padding-top")])
                          ],
                          ['li']
                        ],
                        ['ul',
                          ['li',
                            this._convert_to_unitless(comp_style[index_map.indexOf("padding-left")])
                          ],
                          ['li',
                            ['ul',
                              ['li',
                                '\u00a0'
                              ]
                            ],
                            ['ul',
                              ['li',
                                width + ' × ' + height
                              ]
                            ],
                            ['ul',
                              ['li',
                                '\u00a0'
                              ]
                            ],
                           'class', 'dimension'
                          ],
                          ['li',
                            this._convert_to_unitless(comp_style[index_map.indexOf("padding-right")])
                          ]
                        ],
                        ['ul',
                          ['li'],
                          ['li',
                            this._convert_to_unitless(comp_style[index_map.indexOf("padding-bottom")])
                          ],
                          ['li']
                        ],
                      'class', 'padding'
                      ],
                      ['li',
                        this._convert_to_unitless(comp_style[index_map.indexOf("border-right-width")])
                      ]
                    ],
                    ['ul',
                      ['li'],
                      ['li',
                        this._convert_to_unitless(comp_style[index_map.indexOf("border-bottom-width")])
                      ],
                      ['li']
                    ],
                   'class', 'border'
                  ],
                  ['li',
                    this._convert_to_unitless(comp_style[index_map.indexOf("margin-right")])
                  ]
                ],
                ['ul',
                  ['li'],
                  ['li',
                    this._convert_to_unitless(comp_style[index_map.indexOf("margin-bottom")])
                  ],
                  ['li']
                ],
               'class', 'margin'
              ],
              ['li',
                is_positioned
                ? this._convert_to_unitless(comp_style[index_map.indexOf("right")], true)
                : '\u00A0'
              ]
            ],
            ['ul',
              ['li'],
              ['li',
                is_positioned
                ? this._convert_to_unitless(comp_style[index_map.indexOf("bottom")], true)
                : '\u00A0'
              ],
              ['li']
            ],
           'class', is_positioned ? 'position' : ''
          ],
         'class', comp_style[index_map.indexOf("box-sizing")]
        ],
        ['table',
          ['tr',
            ['th',
              'position:'
            ],
            ['td',
              comp_style[index_map.indexOf("position")] || "–"
            ],
           'data-spec', 'css#position'
          ],
          ['tr',
            ['th',
              'z-index:'
            ],
            ['td',
              comp_style[index_map.indexOf("z-index")] || "–"
            ],
           'data-spec', 'css#z-index'
          ],
          ['tr',
            ['th',
              'box-sizing:'
            ],
            ['td',
              comp_style[index_map.indexOf("box-sizing")] || "–"
            ],
           'data-spec', 'css#box-sizing'
          ],
         'id', 'layout-info'
        ]
      ]
    );
  };

  this._get_dimension = function(direction, comp_style)
  {
    var index_map = this._css_index_map;
    var value = comp_style[index_map.indexOf(direction)]
    if (value === "auto" || value.endswith("%"))
      return value;
    var dim = parseInt(value);
    var is_border_box = comp_style[index_map.indexOf("box-sizing")] == "border-box";
    var props = {
      "width": [
        "border-left",
        "border-right",
        "padding-left",
        "padding-right"
      ],
      "height": [
        "border-top",
        "border-bottom",
        "padding-top",
        "padding-bottom"
      ]
    };

    if (is_border_box)
    {
      dim -= props[direction].reduce(function(prev, curr) {
        return prev + parseInt(comp_style[index_map.indexOf(curr)]);
      }, 0);
    }

    return dim;
  };

  this._convert_to_unitless = function(value, no_replace)
  {
    switch (value)
    {
    case "auto":
    case "":
      return "–";
    case "0px":
      return no_replace ? "0" : "–";
    default:
      return String(parseInt(value))
    }
  };

  window.messages.addListener('element-selected', this._on_element_selected.bind(this));
};

cls.ElementLayout.OFFSETS = [
  '',
  'offsetTop',
  'offsetLeft',
  'offsetWidth',
  'offsetHeight',
  'scrollTop',
  'scrollLeft',
  'scrollWidth',
  'scrollHeight',
  'clientTop',
  'clientLeft',
  'clientWidth',
  'clientHeight'
];

