window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.NewStyle = function(id, name, container_class)
{
  this._es_debugger = window.services['ecmascript-debugger'];
  this._tag_manager = cls.TagManager.get_instance();

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
    var css_text = this._rt_style_map[this._rt_id]
                 ? this._rt_style_map[this._rt_id].css_text
                 : "";
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
                     window.helpers.escape_input(rt_style.css_text.replace(/\r\n/g, "\n")) +
                   "\";}catch(e){};";
      var tag = this._tag_manager.set_callback(this, window.element_style.update);
      this._es_debugger.requestEval(tag,
          [this._rt_id, 0, 0, script, [['style', rt_style.stylesheet_id]]]);
    }
    else
    {
      this._create_new_stylesheet();
    }
  };

  this._create_new_stylesheet = function(event, target)
  {
    var tag = this._tag_manager.set_callback(this, this._handle_new_style);
    var script =
      "(function() {" +
      "  return (document.head || document.body || document.documentElement)." +
      "    appendChild(document.createElement('style'));" +
      "})();";
    this._es_debugger.requestEval(tag, [this._rt_id, 0, 0, script]);
  };

  this._handle_new_style = function(status, message)
  {
    var STATUS = 0;
    var OBJECT_VALUE = 3;
    var OBJECT_ID = 0;
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
        this._textarea.value = this._rt_style_map[this._rt_id].css_text;
    }
  };

  this._init = function(id, name, container_class)
  {
    this.required_services = ["ecmascript-debugger"];
    this._rt_id = 0;
    this._rt_style_map = {};
    this._textarea = null;
    View.prototype.init.call(this, id, name, container_class);
  };

  window.messages.addListener('element-selected', this._on_element_selected.bind(this));
  window.eventHandlers.click['apply-new-style'] = this._update_style.bind(this);

  this._init(id, name, container_class);
};

