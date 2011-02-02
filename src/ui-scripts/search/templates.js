(function()
{
  const MAX_LINE_CHARS = 4000;
  this.searchbar_content = function(search)
  {
    return (
    [
      this.filters(search.controls),
      ['info'],
    ]);
  };

  this.js_search_window = function()
  {
    return (
    ['div',
      ['div', 'class', 'js-search-results'],
      'class', 'search-window-content padding'
    ]);
  };

  this.js_serach_results = function(results)
  {
    var ret = ['div'], div = null;
    for (var rt_id in results)
    {
      div = ['div'];
      div.push(this._search_result_header(rt_id));
      div.extend(results[rt_id].map(this._search_result_script, this));
      div.push('class', 'js-search-results-runtime');
      ret.push(div);
    }
    return ret;
  };

  this._search_result_header = function(rt_id)
  {
    var runtime = window.runtimes.getRuntime(rt_id);
    var display_uri = helpers.shortenURI(runtime.uri);
    return ['h2', runtime.title || display_uri.uri];
  };

  this._format_line_no = function(line_no)
  {
    line_no = String(line_no);
    var padding = ['      ', '     ', '    ', '   ', '  ', ' '];
    return  (padding[line_no.length] || '') + line_no;
  }

  this._search_result_script = function(script)
  {
    var ret = ['div', ['h3', 'script ' + (script.uri || script.script_type)]];
    var line = 0, cur_line = 0, script_data = '', script_tmpl = null, cur = null;
    for (var i = 0; i < script.line_matches.length; i++)
    {
      cur_line = script.line_matches[i];
      if (cur_line != line)
      {
        line = cur_line;
        cur = ['div', ['span', this._format_line_no(line), 'class', 'line-no']];
        script_data = script.script_data.slice(script.line_arr[line-1], 
                                               script.line_arr[line]);
        if (script_data.length > MAX_LINE_CHARS)
        {
          script_data = script_data.slice(0, MAX_LINE_CHARS) + " ... max line width exceeded";
        }
        this.highlight_js_source(script_data, null, null, cur);
        ret.push(cur);
      }
    }
    ret.push('class', 'js-search-results-script js-source');
    return ret;
  };

}).apply(window.templates || (window.templates = {}));
