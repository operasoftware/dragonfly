window.cls || (window.cls = {});

/**
  * @constructor
  */
cls.Breakpoint = function(id, script_id, line_nr, event_type)
{
  this.id = id;
  this.script_id = script_id || "";
  this.line_nr = line_nr || 0;
  this.event_type = event_type || "";
  this.type = this.script_id ? "source" : "event";
  this.is_enabled = true;
  this.condition = "";
};

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
  this.get_breakpoint_with_id = function(bp_id){};
  this.script_has_breakpoint_on_line = function(script_id, line_nr){};
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
      this._bps.push(new this._bp_class(bp_id, script_id, line_nr, event_type));
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
        script.breakpoint_states[bp.line_nr] = absolute;
      }
      window.messages.post('breakpoint-updated',
                           {id: bp.id, script_id: bp.script_id});
    }
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
      }
    }
  };

  this._get_bp_index_with_bp_id = function(bp_id)
  {
    for (var i = 0; i < this._bps.length && this._bps[i].id != bp_id; i++);
    return i;
  };

  this._init = function()
  {
    this._bps = [];
    this._bp_class = window.cls.Breakpoint;
    this._esdb = window.services['ecmascript-debugger'];
  };

  /* implementation */

  this.get_breakpoints = function()
  {
    return this._bps;
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
      if (!script.breakpoint_states[line_nr])
      {
        script.breakpoint_states[line_nr] = BP_DISABLED;
      }
      if (script.breakpoint_states[line_nr] < BP_ENABLED)
      {
        script.breakpoint_states[line_nr] += BP_DELTA_ENABLE;
      }
      // message signature has changes with version 6.0
      // AddBreakpoint means always to a source line
      // for events it's now AddEventBreakpoint
      if (this._esdb.major_version > 5)
      {
        this._esdb.requestAddBreakpoint(0, [bp_id, script_id, line_nr]);
      }
      else
      {
        this._esdb.requestAddBreakpoint(0, [bp_id, "line", script_id, line_nr]);
      }
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
      if (script.breakpoint_states[line_nr] >= BP_ENABLED)
      {
        script.breakpoint_states[line_nr] -= BP_DELTA_ENABLE;
      }
      this._remove_bp(bp_id);
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
  };

  this.script_has_breakpoint_on_line = function(script_id, line_nr)
  {
    var script = window.runtimes.getScript(script_id);
    return Boolean(script && script.breakpoints[line_nr]);
  };

  this.set_condition = function(condition, bp_id)
  {
    var bp = this.get_breakpoint_with_id(bp_id);
    if (bp)
    {
      if (condition && !bp.condition)
      {
        this._update_bp_state(bp, BP_DELTA_CONDITION);
      }
      else if(!condition && bp.condition)
      {
        this._update_bp_state(bp, -BP_DELTA_CONDITION);
      }
      bp.condition = condition;
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
