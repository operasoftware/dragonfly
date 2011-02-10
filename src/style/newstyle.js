window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends ViewBase
  */

cls.NewStyle = function(id, name, container_class)
{
  this._stylesheet = 0;
  this._new_style = '';
  this._current_style = '';
  this._top_rt_id = 0;
  this.createView = function(container)
  {
    if (this._stylesheet)
    {
      container.clearAndRender(['_auto_height_textarea',
                                'handler', 'css-update-new-style',
                                'class', 'css-new-style-sheet']);
    }
    else
    {
      container.clearAndRender(['p', 
                                  ['input',
                                    'type', 'button',
                                    'handler', 'css-create-new-style',
                                    'value', 'Create new stylesheet']
                                ]);
    }
    
  };

  eventHandlers.click['css-create-new-style'] = function(event, target)
  {
    var tag = this._tagman.set_callback(this, this._handle_new_style);
    var script = "(" + this._create_new_stylesheet.toString() + ")();";
    this._esdb.requestEval(tag, [this._top_rt_id, 0, 0, script]);
  }.bind(this);

  eventHandlers.input['css-update-new-style'] = function(event, target)
  {
    this._new_style = target.value;
    if (this._current_style != this._new_style && !this._update_interval)
    {
      this._update_interval = setInterval(this._update_style_bound, 250);
    }
  }.bind(this);

  this._update_style_bound = function()
  {
    if (this._current_style == this._new_style)
    {
      clearInterval(this._update_interval);
      this._update_interval = 0;
    }
    else
    {
      var script = "try{style.textContent = \"" + this._new_style.replace(/\r?\n/g, "") +"\";}catch(e){};";
      this._esdb.requestEval(0, [this._top_rt_id, 0, 0, script, [['style', this._stylesheet]]]);
      this._current_style = this._new_style;
    }
  }.bind(this);
  

  this._handle_new_style = function(status, message)
  {
    const STATUS = 0, OBJECT_VALUE = 3, OBJECT_ID = 0;
    if (status || message[STATUS] != 'completed' || !message[OBJECT_VALUE])
    {
      opera.postError("Not possible to add a new style elmenet")
    }
    else
    {
      this._stylesheet = message[OBJECT_VALUE][OBJECT_ID];
      this.update();
    }
  }

  this._create_new_stylesheet = function()
  {
    return (document.head || document.body || document.documentElement).
           appendChild(document.createElement('style'));
  }

  this._on_active_tab = function(msg)
  {
    if (msg.activeTab[0] && msg.activeTab[0] != this._top_rt_id)
    {
      this._top_rt_id = msg.activeTab[0];
      this._reset();
    }
  };

  this._reset = function()
  {
    this._stylesheet = 0;
  }

  this._esdb = window.services['ecmascript-debugger'];
  this._tagman = window.tag_manager;
  this.init(id, name, container_class);
  window.messages.addListener('active-tab', this._on_active_tab.bind(this));

};
