window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.NewStyle = function(id, name, container_class)
{
  this._template = function(value)
  {
    return (
        ['div',
           ['_auto_height_textarea',
              value || '',
            'handler', 'css-update-new-style',
            'class', 'css-new-style-sheet'
           ],
           ['span',
              ui_strings.S_BUTTON_TEXT_APPLY,
            'class', 'ui-button',
            'handler', 'apply-new-style',
            'tabindex', '1'
           ],
         'class', 'padding'
        ]);
  };

  this.createView = function(container)
  {
    var css_text = this._rt_style_map[this._rt_id] ? this._rt_style_map[this._rt_id].css_text : "";
    var ele = container.clearAndRender(this._template(css_text));
    this._textarea = ele.querySelector("textarea");
    this._textarea.value = css_text;
  };

  this._update_style = function()
  {
    var rt_style = this._rt_style_map[this._rt_id];
    if (rt_style && rt_style.stylesheet_id)
    {
      rt_style.css_text = this._textarea.value;
      var script = "try{style.textContent = \"" +
                     helpers.escape_input(rt_style.css_text).replace(/\r?\n/g, "") +
                   "\";}catch(e){};";
      var tag = window.tag_manager.set_callback(this, window.elementStyle.update);
      window.services['ecmascript-debugger'].requestEval(tag,
          [this._rt_id, 0, 0, script, [['style', rt_style.stylesheet_id]]]);
    }
    else
    {
      this._create_new_stylesheet();
    }
  };

  this._create_new_stylesheet = function(event, target)
  {
    var tag = window.tag_manager.set_callback(this, this._handle_new_style);
    var script =
      "(function() {" +
      "  return (document.head || document.body || document.documentElement)." +
      "    appendChild(document.createElement('style'));" +
      "})();";
    window.services['ecmascript-debugger'].requestEval(tag, [this._rt_id, 0, 0, script]);
  };

  this._handle_new_style = function(status, message)
  {
    const STATUS = 0;
    const OBJECT_VALUE = 3;
    const OBJECT_ID = 0;
    if (status || message[STATUS] != 'completed' || !message[OBJECT_VALUE])
    {
      opera.postError("Not possible to add a new style elment.")
    }
    else
    {
      this._rt_style_map[this._rt_id].stylesheet_id = message[OBJECT_VALUE][OBJECT_ID];
      this._update_style();
    }
  };

  this._on_element_selected = function(msg)
  {
    if (msg.rt_id != this._rt_id)
    {
      this._rt_id = msg.rt_id;

      if (!this._rt_style_map[msg.rt_id])
      {
        this._rt_style_map[msg.rt_id] = {
          stylesheet_id: 0,
          css_text: ""
        };
      }

      if (this._textarea)
      {
        this._textarea.value = this._rt_style_map[this._rt_id].css_text;
      }
    }
  };

  // ViewBase init
  this._super_init = this.init;

  this._init = function(id, name, container_class)
  {
    this._rt_id = 0;
    this._rt_style_map = {};
    this._textarea = null;

    window.messages.addListener('element-selected', this._on_element_selected.bind(this));
    window.eventHandlers.click['apply-new-style'] = this._update_style.bind(this);

    this._super_init(id, name, container_class);
  };

  this._init(id, name, container_class);
};

