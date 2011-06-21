(function()
{
  const MAX_LINE_CHARS = 4000;

  this.search_panel = function(search, type)
  {
    return (
    [
      ['div',
        this['advanced_' + type + '_search'](search),
        'class', 'advanced-search-controls'],
      ['div',
        ['div', 'class', 'panel-search mono'],
        'class', 'panel-search-container',
        'handler', 'show-script'],
    ]);
  };

  this.searchbar_content = function(search)
  {
    var content = this.filters(search.controls);
    content[0] = 'div';
    content.push('class', 'advanced-panel-search');
    return content;
  };

  this._search_input = function(name, type, value, label, is_selected)
  {
    var input = ['input', 'type', type, 'value', value, 'name', name];
    if (is_selected)
    {
      input.push('checked', 'checked');
    }
    return ['label', input, label];
  };

  this.advanced_search_field = function(search)
  {
    return (
    ['div',
        ['table',
          ['tr',
            ['td', this.default_filter(search.controls[0])],
            ['td', 
              ['span', '\u00A0', 'class', 'search-info-badge'], 
              'width', '1px'],
            ['td', this.search_control(search.controls[1]), 'width', '1px'],
            ['td', this.search_control(search.controls[2]), 'width', '1px']],
          'class', 'advanced-search-table'],
        'class', 'advanced-search']);
  };

  this.advanced_dom_search = function(search)
  {
    return (
    [
      this.advanced_search_field(search),
      ['div', 
        ['form',
          this._search_input('dom-search-type', 
                             'radio', 
                             DOMSearch.PLAIN_TEXT, 
                             'text',
                             DOMSearch.PLAIN_TEXT == search.search_type),
          this._search_input('dom-search-type', 
                             'radio', 
                             DOMSearch.REGEXP, 
                             'reg exp',
                             DOMSearch.REGEXP == search.search_type),
          this._search_input('dom-search-type', 
                             'radio', 
                             DOMSearch.CSS, 
                             'css',
                             DOMSearch.CSS == search.search_type),
          this._search_input('dom-search-type', 
                             'radio', 
                             DOMSearch.XPATH, 
                             'x-path',
                             DOMSearch.XPATH == search.search_type),
          this._search_input('dom-search-ignore-case', 
                             'checkbox', 
                             'ignore-case', 
                             'ignore case',
                             search.ignore_case),
          'handler', 'dom-search-type-changed',
        ],
      ],
    ]);
  }.bind(this);



  this.advanced_js_search = function(search)
  {
    return (
    [
      this.advanced_search_field(search),
      ['div', 
        ['form',
          this._search_input('js-search-type', 
                             'checkbox', 
                             'reg-exp', 
                             'reg exp',
                             TextSearch.REGEXP == search.search_type),
          this._search_input('js-search-ignore-case', 
                             'checkbox', 
                             'ignore-case', 
                             'ignore case',
                             search.ignore_case),
          this._search_input('js-search-all-files', 
                             'checkbox', 
                             'search-all-files', 
                             'all files',
                             search.search_all_files),
          'handler', 'js-search-type-changed',
        ],
      ],
    ]);
  }.bind(this);

  this.js_search_window = function()
  {
    return ['div', 'class', 'js-search-results', 'handler', 'show-script'];
  };

  this.js_search_results = function(results, result_count, max_count)
  {
    var ret = this._search_result_init(result_count, max_count);
    var div = null;
    for (var rt_id in results)
    {
      div = ['div'];
      div.push(this._search_result_header(rt_id));
      div.extend(results[rt_id].map(this.search_result_script, this));
      div.push('class', 'js-search-results-runtime');
      ret.push(div);
      if (this._js_search_ctx.count > this._js_search_ctx.max_count)
      {
        break;
      }
    }
    return ret;
  };

  this.js_search_result_single_file = function(script, result_count, max_count)
  {
    var ret = this._search_result_init(result_count, max_count);
    ret.push(this.search_result_script(script));
    return ret;
  };

  this._search_result_init = function(result_count, max_count)
  {
    var ret = ['div'];
    this._js_search_ctx = {count: 0, max_count: max_count};
    if (result_count > max_count)
    {
      ret.push(['div', 
                  ['div', ui_strings.S_INFO_TOO_MANY_SEARCG_RESULTS
                       .replace('%(COUNT)s', result_count)
                       .replace('%(MAX)s', max_count),
                       'class', 'info-box'],
                       'class', 'info-box-container']);
    }
    return ret;
  };

  this._search_result_header = function(rt_id)
  {
    var runtime = window.runtimes.getRuntime(rt_id);
    var display_uri = runtime && helpers.shortenURI(runtime.uri);
    return ['h2', runtime && (runtime.title || display_uri.uri) || ''];
  };

  this._format_line_no = function(line_no)
  {
    line_no = String(line_no);
    var padding = ['      ', '     ', '    ', '   ', '  ', ' '];
    return  (padding[line_no.length] || '') + line_no;
  };

  this.search_result_script = function(script, show_script_uri)
  {
    var ret = ['div'];
    if (this._js_search_ctx.count < this._js_search_ctx.max_count)
    {
      if (typeof show_script_uri != 'boolean' || show_script_uri)
      {
        ret.push(['h3', (script.uri || script.script_type) + ':']);
      }
      var line = 0, cur_line = 0, script_data = '', script_tmpl = null, cur = null;
      for (var i = 0; i < script.line_matches.length; i++)
      {
        if (this._js_search_ctx.count++ < this._js_search_ctx.max_count)
        {
          cur_line = script.line_matches[i];
          if (cur_line != line)
          {
            line = cur_line;
            script_data = script.script_data.slice(script.line_arr[line - 1], 
                                                   script.line_arr[line]);
            script_tmpl = this.highlight_js_source(script_data, 
                                                   null, 
                                                   script.state_arr[line - 1], 
                                                   ['code'],
                                                   true);
            ret.push(['div', 
                       ['span', String(line), 'class', 'line-no'],
                       script_tmpl,
                       'data-line-no', String(line),
                       'class', 'search-match js-search']);
          }
        }
      }
      ret.push('class', 'js-search-results-script js-source',
               'data-script-id', String(script.script_id));
    }
    return ret;
  };

}).apply(window.templates || (window.templates = {}));
