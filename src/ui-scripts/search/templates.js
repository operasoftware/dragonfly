(function()
{
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
      ['h2', 'Search results:'],
      ['div', 'class', 'js-search-results'],
      'class', 'search-window-content padding'
    ]);
  };

  this.js_serach_results = function(results)
  {
    var ret = [];
    for (var rt_id in results)
    {
      ret.push(this._search_result_header(rt_id));
      ret.extend(results[rt_id].map(this._search_result_script, this));
    }
    return ret;
  };

  this._search_result_header = function(rt_id)
  {
    var runtime = window.runtimes.getRuntime(rt_id);
    var display_uri = helpers.shortenURI(runtime.uri);
    return ['h2', runtime.title || display_uri.uri];
  };

  this._search_result_script = function(script)
  {
     return (
     [
       ['h3', 'script ' + (script.uri || script.script_type)],
       ['div', 'matches: ' + String(script.line_matches.length)]
     ]);
  };

}).apply(window.templates || (window.templates = {}));
