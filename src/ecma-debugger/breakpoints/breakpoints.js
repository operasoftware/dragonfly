window.cls || (window.cls = {});

/**
  * @constructor
  */
cls.Breakpoint = function(id, script_id, line_nr, event_type, active_rt_ids)
{
  this.id = id;
  this.script_id = script_id || "";
  this.line_nr = line_nr || 0;
  this.event_type = event_type || "";
  this.type = this.script_id ? "source" : "event";
  this.is_enabled = true;
  this.condition = "";
  this.update_is_active(active_rt_ids);
};

cls.Breakpoint.prototype = new function()
{
  this._is_active = true;

  this.__defineGetter__('is_active', function()
  {
    return this._is_active;
  });

  this.__defineSetter__('is_active', function(){});

  this.update_is_active = function(active_rt_ids)
  {
    if (this.script_id)
    {
      var rt_id = window.runtimes.getScriptsRuntimeId(this.script_id);
      this._is_active = active_rt_ids.indexOf(rt_id) != -1;
    }
  }
}

/**
  * @constructor
  */
cls.Breakpoints = function()
{

  if (cls.Breakpoints.instance)
  {
    return cls.Breakpoints.instance;
  }

  cls.Breakpoints.instance = this;

  /* interface */

  this.get_breakpoints = function(){};
  this.get_active_breakpoints = function(){};
  this.get_breakpoint_with_id = function(bp_id){};
  this.script_has_breakpoint_on_line = function(script_id, line_nr){};
  this.get_breakpoint_on_script_line = function(script_id, line_nr){};
  // bp_id optional
  this.add_breakpoint = function(script_id, line_nr, bp_id){};
  // removes the breakpoint in the host
  // disables the breakpoint in the client
  this.remove_breakpoint = function(script_id, line_nr){};
  this.delete_breakpoint = function(bp_id){};
  this.add_event_breakpoint = function(event_name){};
  this.remove_event_breakpoint = function(bp_id){};
  this.copy_breakpoints = function(new_script, old_script){};
  this.set_condition = function(condition, bp_id){};
  this.get_condition = function(bp_id){};

  /* constants */

  const
  BP_NONE = cls.NewScript.BP_NONE,
  BP_DISABLED = cls.NewScript.BP_DISABLED,
  BP_ENABLED = cls.NewScript.BP_ENABLED,
  BP_DELTA_ENABLE = BP_ENABLED - BP_DISABLED,
  BP_DELTA_CONDITION = cls.NewScript.BP_ENABLED_CONDITION - BP_ENABLED;

  /* private */

  this._get_bp_id = (function()
  {
    var count = 1;
    return function() {return count++;}
  })();

  this._add_bp = function(bp_id, script_id, line_nr, event_type)
  {
    var bp = this.get_breakpoint_with_id(bp_id);
    if (bp)
    {
      bp.is_enabled = true;
    }
    else
    {
      this._bps.push(new this._bp_class(bp_id,
                                        script_id,
                                        line_nr,
                                        event_type,
                                        this._active_rt_ids));
    }
    window.messages.post("breakpoint-updated",
                         {id: bp_id, script_id: script_id});
  };

  this._remove_bp = function(bp_id)
  {
    var bp = this.get_breakpoint_with_id(bp_id);
    if (bp)
    {
      bp.is_enabled = false;
      window.messages.post("breakpoint-updated",
                           {id: bp.id, script_id: bp.script_id});
    }
  };

  this._get_bp_id_with_script_id_and_line_nr = function(script_id, line_nr)
  {
    for (var i = 0, bp; bp = this._bps[i]; i++)
    {
      if (bp.script_id == script_id && bp.line_nr == line_nr)
      {
        return bp.id;
      }
    }
    return 0;
  };

  this._update_bp_state = function(bp, delta, absolute)
  {
    var script = bp && window.runtimes.getScript(bp.script_id);
    if (script)
    {
      if (delta)
      {
        script.breakpoint_states[bp.line_nr] += delta;
      }
      else
      {
        var state = script.breakpoint_states[bp.line_nr] || 0;
        var pointer_state = state % 3;
        script.breakpoint_states[bp.line_nr] = absolute;
        script.breakpoint_states[bp.line_nr] += pointer_state;
      }
    }
    window.messages.post('breakpoint-updated',
                         {id: bp.id,
                          script_id: bp.script_id,
                          event_type: bp.event_type});
  };

  this._get_bp_id_with_event_name = function(event_name)
  {
    for (var i = 0, bp; bp = this._bps[i]; i++)
    {
      if (bp.event_type == event_name)
      {
        return bp.id;
      }
    }
    return 0;
  };

  this._replace_script_id = function(new_script_id, old_script_id)
  {
    for (var i = 0, bp; bp = this._bps[i]; i++)
    {
      if (bp.script_id == old_script_id)
      {
        bp.script_id = new_script_id;
        bp.update_is_active(this._active_rt_ids);
      }
    }
  };

  this._get_bp_index_with_bp_id = function(bp_id)
  {
    for (var i = 0; i < this._bps.length && this._bps[i].id != bp_id; i++);
    return i;
  };

  this._on_active_tab = function(msg)
  {
    this._active_rt_ids = msg.activeTab;
    this._bps.forEach(function(bp)
    {
      bp.update_is_active(this._active_rt_ids);
    }, this);
    window.views.breakpoints.update();
  };

  this._init = function()
  {
    this._bps = [];
    this._bp_class = window.cls.Breakpoint;
    this._esdb = window.services['ecmascript-debugger'];
    this._active_rt_ids = [];
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));
  };

  /* implementation */

  this.get_breakpoints = function()
  {
    return this._bps;
  };

  this.get_active_breakpoints = function()
  {
    return this._bps.filter(function(bp)
    {
      return bp.is_active;
    });
  };

  this.get_breakpoint_with_id = function(bp_id)
  {
    return this._bps[this._get_bp_index_with_bp_id(bp_id)];
  };

  this.add_breakpoint = function(script_id, line_nr, bp_id)
  {
    var script = window.runtimes.getScript(script_id);
    if (script)
    {
      bp_id = bp_id ||
              // if a breakpoint was set on the same script and line before
              this._get_bp_id_with_script_id_and_line_nr(script_id, line_nr) ||
              this._get_bp_id();
      script.breakpoints[line_nr] = bp_id;
      var state = script.breakpoint_states[line_nr] || 0;
      var pointer_state = state % 3;
      state -= pointer_state;
      if (!state)
      {
        state = BP_DISABLED;
      }
      if (state < BP_ENABLED)
      {
        state += BP_DELTA_ENABLE;
      }
      script.breakpoint_states[line_nr] = state + pointer_state;
      this._esdb.requestAddBreakpoint(0, [bp_id, script_id, line_nr]);
      this._add_bp(bp_id, script_id, line_nr);
    }
  };

  this.remove_breakpoint = function(script_id, line_nr)
  {
    var script = window.runtimes.getScript(script_id);
    if (script)
    {
      var bp_id = script.breakpoints[line_nr];
      this._esdb.requestRemoveBreakpoint(0, [bp_id]);
      script.breakpoints[line_nr] = 0;
      var state = script.breakpoint_states[line_nr] || 0;
      var pointer_state = state % 3;
      state -= pointer_state;
      if (state >= BP_ENABLED)
      {
        script.breakpoint_states[line_nr] = state - BP_DELTA_ENABLE;
      }
      script.breakpoint_states[line_nr] += pointer_state;
      this._remove_bp(bp_id);
      return bp_id;
    }
  };

  this.delete_breakpoint = function(bp_id)
  {
    var bp = this.get_breakpoint_with_id(bp_id);
    this._bps.splice(this._get_bp_index_with_bp_id(bp_id), 1);
    this._update_bp_state(bp, 0, BP_NONE);
  };

  this.add_event_breakpoint = function(event_name)
  {
    var bp_id = this._get_bp_id_with_event_name(event_name) ||
                this._get_bp_id();
    this._esdb.requestAddEventBreakpoint(0, [bp_id, event_name]);
    this._add_bp(bp_id, null, null, event_name);
    return bp_id;
  };

  this.remove_event_breakpoint = function(bp_id)
  {
    this._esdb.requestRemoveBreakpoint(0, [bp_id]);
    this._remove_bp(bp_id);
  };

  this.copy_breakpoints = function(new_script, old_script)
  {
    new_script.breakpoint_states = old_script.breakpoint_states;
    this._replace_script_id(new_script.script_id, old_script.script_id);
    var old_bps = old_script.breakpoints;
    for (line_nr in old_bps)
    {
      if (old_bps[line_nr])
      {
        line_nr = parseInt(line_nr);
        this.remove_breakpoint(old_script.script_id, line_nr);
        this.add_breakpoint(new_script.script_id, line_nr, old_bps[line_nr]);
      }
    }
    window.views.breakpoints.update();
  };

  this.script_has_breakpoint_on_line = function(script_id, line_nr)
  {
    var script = window.runtimes.getScript(script_id);
    return Boolean(script && script.breakpoints[line_nr]);
  };

  this.get_breakpoint_on_script_line = function(script_id, line_nr)
  {
    var bp_id = this._get_bp_id_with_script_id_and_line_nr(script_id, line_nr);
    return bp_id ? this.get_breakpoint_with_id(bp_id): null;
  };

  this.set_condition = function(condition, bp_id)
  {
    var bp = this.get_breakpoint_with_id(bp_id);
    if (bp)
    {
      var current_condition = bp.condition;
      bp.condition = condition;
      if (condition && !current_condition)
      {
        this._update_bp_state(bp, BP_DELTA_CONDITION);
      }
      else if(!condition && current_condition)
      {
        this._update_bp_state(bp, -BP_DELTA_CONDITION);
      }
    }
  };

  this.get_condition = function(bp_id)
  {
    var bp = this.get_breakpoint_with_id(bp_id);
    return bp && bp.condition || "";
  };

  /* instantiation */

  this._init();

};

cls.Breakpoints.get_instance = function()
{
  return this.instance || new cls.Breakpoints();
};
