window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends ViewBase
  */

cls.NewStyle = function(id, name, container_class)
{

  this.createView = function(container)
  {
    if (this._stylesheet)
    {
      var textarea = container.clearAndRender(this._tmpl_edit(this._current_style));
      setTimeout(function() {
        textarea.focus();
        textarea.selectionEnd = textarea.value.length;
      }, 1);
    }
    else
    {
      container.clearAndRender(this._tmpl_create());
    }
  };

  this._tmpl_edit = function(value)
  {
    return (
    ['_auto_height_textarea',
       value || '',
       'handler', 'css-update-new-style',
       'class', 'css-new-style-sheet']);
  };

  this._tmpl_create = function()
  {
    return (
    ['p', 
      ['input',
        'type', 'button',
        'handler', 'css-create-new-style',
        'value', 'Create new stylesheet'
      ]
    ]);
  };

  this._update_style = function()
  {
    if (this._current_style == this._new_style)
    {
      clearInterval(this._update_interval);
      this._update_interval = 0;
    }
    else
    {
      var script = "try{style.textContent = \"" + 
                   this._new_style.replace(/\r?\n/g, "") +
                   "\";}catch(e){};";
      this._esdb.requestEval(0, [this._top_rt_id, 0, 0, script, 
                                 [['style', this._stylesheet]]]);
      this._current_style = this._new_style;
    }
  };
  

  this._handle_new_style = function(status, message)
  {
    const STATUS = 0, OBJECT_VALUE = 3, OBJECT_ID = 0;
    if (status || message[STATUS] != 'completed' || !message[OBJECT_VALUE])
    {
      opera.postError("Not possible to add a new style elment.")
    }
    else
    {
      this._stylesheet = message[OBJECT_VALUE][OBJECT_ID];
      this.update();
    }
  };

  this._create_new_stylesheet = function()
  {
    return (document.head || document.body || document.documentElement).
           appendChild(document.createElement('style'));
  };

  this._on_active_tab = function(msg)
  {
    if (msg.activeTab[0] && msg.activeTab[0] != this._top_rt_id)
    {
      this._reset();
      this._top_rt_id = msg.activeTab[0];
    }
  };

  this._reset = function()
  {
    this._stylesheet = 0;
    this._new_style = '';
    this._current_style = '';
    this._top_rt_id = 0;
  };

  this._create_new_sylesheet = function(event, target)
  {
    var tag = this._tagman.set_callback(this, this._handle_new_style);
    var script = "(" + this._create_new_stylesheet.toString() + ")();";
    this._esdb.requestEval(tag, [this._top_rt_id, 0, 0, script]);
  };

  this._update_new_style = function(event, target)
  {
    this._new_style = target.value;
    if (this._current_style != this._new_style && !this._update_interval)
    {
      this._update_interval = setInterval(this._update_style_bound, 250);
    }
  };

  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class);
    this._esdb = window.services['ecmascript-debugger'];
    this._tagman = window.tag_manager;
    this._stylesheet = 0;
    this._new_style = '';
    this._current_style = '';
    this._top_rt_id = 0;
    this._update_style_bound = this._update_style.bind(this);
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
    window.eventHandlers.click['css-create-new-style'] = 
      this._create_new_sylesheet.bind(this);
    window.eventHandlers.input['css-update-new-style'] = 
      this._update_new_style.bind(this);
  };

  this._init(id, name, container_class);

};
