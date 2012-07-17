(function()
{
  const MAX_LINE_CHARS = 4000;
  const RE_WS = /^\s*$/;

  this.search_panel = function(search, type, handler)
  {
    return (
    [
      ['div',
        this['advanced_' + type + '_search'](search),
        'class', 'advanced-search-controls'],
      ['div',
        ['div', 'class', 'panel-search mono'],
        'class', 'panel-search-container',
        'handler', handler],
    ]);
  };

  this.searchbar_content = function(search)
  {
    var content = this.filters(search.controls);
    content[0] = 'div';
    content.push('class', 'advanced-panel-search');
    return content;
  };

  this._search_input = function(name, type, value, label,
                                is_selected, is_disabled, title)
  {
    var input = ['input', 'type', type, 'value', value, 'name', name];
    if (is_selected)
    {
      input.push('checked', 'checked');
    }
    if (is_disabled)
    {
      input.push('disabled', 'disabled');
    }
    if (title)
    {
      input.push('title', title);
    }

    var ret = ['label', input, label];

    if (title)
    {
      ret.push('title', title);
    }
    return ret;
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
                             ui_strings.S_LABEL_SEARCH_TYPE_TEXT,
                             DOMSearch.PLAIN_TEXT == search.search_type),
          this._search_input('dom-search-type',
                             'radio',
                             DOMSearch.REGEXP,
                             ui_strings.S_LABEL_SEARCH_TYPE_REGEXP,
                             DOMSearch.REGEXP == search.search_type),
          this._search_input('dom-search-type',
                             'radio',
                             DOMSearch.CSS,
                             ui_strings.S_LABEL_SEARCH_TYPE_CSS,
                             DOMSearch.CSS == search.search_type),
          this._search_input('dom-search-type',
                             'radio',
                             DOMSearch.XPATH,
                             ui_strings.S_LABEL_SEARCH_TYPE_XPATH,
                             DOMSearch.XPATH == search.search_type),
          this._search_input('dom-search-ignore-case',
                             'checkbox',
                             'ignore-case',
                             ui_strings.S_LABEL_SEARCH_FLAG_IGNORE_CASE,
                             search.ignore_case,
                             !search.is_token_search),
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
                             ui_strings.S_LABEL_SEARCH_TYPE_REGEXP,
                             TextSearch.REGEXP == search.search_type),
          this._search_input('js-search-ignore-case',
                             'checkbox',
                             'ignore-case',
                             ui_strings.S_LABEL_SEARCH_FLAG_IGNORE_CASE,
                             search.ignore_case),
          this._search_input('js-search-all-files',
                             'checkbox',
                             'search-all-files',
                             ui_strings.S_LABEL_SEARCH_ALL_FILES,
                             search.search_all_files),
          this._search_input('js-search-injected-scripts',
                             'checkbox',
                             'search-injected-scripts',
                             ui_strings.S_LABEL_SEARCH_INJECTED_SCRIPTS,
                             search.search_injected_scripts,
                             !search.search_all_files,
                             ui_strings.S_LABEL_SEARCH_INJECTED_SCRIPTS_TOOLTIP),

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
                  ['div', ui_strings.S_INFO_TOO_MANY_SEARCH_RESULTS
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

  this.resource_link = function(url, text, line)
  {
    var ret =
    ["span", text, "handler", "open-resource-tab",
                   "data-resource-url", url,
                   "class", "internal-link"];
    if (line)
    {
      ret.push("data-resource-line-number", String(line));
    }
    return ret;
  };

  this.search_result_script = function(script, show_script_uri)
  {
    var ret = ['div'];
    if (this._js_search_ctx.count < this._js_search_ctx.max_count)
    {
      if (typeof show_script_uri != 'boolean' || show_script_uri)
      {
        var h3 = ['h3'];
        if (script.uri)
        {
          h3.push(this.resource_link(script.uri, script.uri), ':');
        }
        else if (script.script_type == "inline")
        {
          var rt = window.runtimes.getRuntime(script.runtime_id);
          if (rt && rt.uri)
          {
            h3.push(script.script_type + " (");
            h3.push(this.resource_link(rt.uri,  rt.uri));
            h3.push("):");
          }
        }
        else
        {
          h3.push(script.script_type + ":");
        }
        ret.push(h3);
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
            if (script_tmpl.length == 2 && RE_WS.test(script_tmpl[1]))
            {
              script_tmpl[1] += "\u00a0";
            }
            if (script.line_offsets_length[i] &&
                script.line_offsets[i] + script.line_offsets_length[i] > script.get_line_length(line))
            {
              script_tmpl.push(['span', '…', 'class', 'match-following-line'])
            }
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
