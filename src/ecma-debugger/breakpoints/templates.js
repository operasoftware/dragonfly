(function()
{
  const MAX_SOURCE_CHARS = 300;
  this.breakpoint_condition = function(condition)
  {
    return (
    ['div',
      'condition: ',
      ['span', condition || ''],
      'class', 'condition',
      'edit-handler', 'edit-condition'
    ]);
  };

  this.breakpoint = function(bp)
  {
    var ret = ['div'];
    var input =
    ['input',
      'type', 'checkbox',
      'class', 'breakpoint-checkbox',
      'handler', 'toggle-breakpoint'];
    if (bp.is_enabled)
    {
      input.push('checked', 'checked');
    }
    ret.push(input);
    if (bp.script_id)
    {
      var script = runtimes.getScript(bp.script_id);
      var uri = script.uri || runtimes.getRuntime(script.runtime_id).uri;
      var line_nr = bp.line_nr;
      ret.push(['div',
                  helpers.basename(uri) + ':' + line_nr,
                  'title', uri,
                  'handler', 'show-breakpoint-in-script-source',
                  'class', 'file-line']);
      if (!script.line_arr)
      {
        script.set_line_states();
      }
      var script_data = script.script_data.slice(script.line_arr[line_nr - 1],
                                                 script.line_arr[line_nr]).trim();
      if (script_data.length > MAX_SOURCE_CHARS)
      {
        script_data = script_data.slice(0, MAX_SOURCE_CHARS) + " …";
      }
      var script_tmpl = this.highlight_js_source(script_data,
                                                 null,
                                                 script.state_arr[line_nr - 1],
                                                 ['code']);
      ret.push(['div', script_tmpl,
                'class', 'source-line',
                'handler', 'show-breakpoint-in-script-source']);
      if (bp.condition)
      {
        ret.push(this.breakpoint_condition(bp.condition));
      }
    }
    else if (bp.event_type)
    {
      ret.push(['div',
                  'event: ' + bp.event_type,
                  'class', 'event-type']);
      if (bp.condition)
      {
        ret.push(this.breakpoint_condition(bp.condition));
      }
    }
    ret.push('class', 'breakpoint',
             'data-breakpoint-id', String(bp.id));
    return ret;
  };

  this.no_breakpoints = function()
  {
    return (
    [
      'div',
        ui_strings.M_VIEW_LABEL_NO_BREAKPOINT,
        'class', 'not-content inspection'
    ]);
  };

}).apply(window.templates || (window.templates = {}));
