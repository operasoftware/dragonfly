window.templates = window.templates || ( window.templates = {} );

(function()
{
  var self = this; 
  this.hello = function(enviroment)
  {
    var ret = ['ul'];
    var prop = '';
    var prop_dict =
    {
      "protocol-version": ui_strings.S_TEXT_ENVIRONMENT_PROTOCOL_VERSION,
      "operating-system": ui_strings.S_TEXT_ENVIRONMENT_OPERATING_SYSTEM,
      "platform": ui_strings.S_TEXT_ENVIRONMENT_PLATFORM, 
      "user-agent": ui_strings.S_TEXT_ENVIRONMENT_USER_AGENT
    }
    for( prop in enviroment)
    {
      ret[ret.length] = ['li', prop_dict[prop] + ': ' + enviroment[prop]];
    }
    if( ini.revision_number.indexOf("$") != -1 && ini.mercurial_revision )
    {
      ini.revision_number = ini.mercurial_revision;
    }
    ret[ret.length] = ['li', ui_strings.S_TEXT_ENVIRONMENT_DRAGONFLY_VERSION + ': ' + ini.dragonfly_version];
    ret[ret.length] = ['li', ui_strings.S_TEXT_ENVIRONMENT_REVISION_NUMBER + ': ' + ini.revision_number];
    return ['div', ret, 'class', 'padding'];
  }



  this.windows = function(windows, win_type)
  {
    var ret = ['ul'];
    var win = null, i = 0;
    for( ; win = windows[i]; i++ )  
    {
      ret[ret.length] = self['window-' + win_type](win);
    }
    return ['div', ret.concat(['class', 'folder', 'template-type', win_type]), 'class', 'padding'];
  }

  this['window-script']  = function(win)
  {
    var 
    rts_c = null, 
    rt = null, 
    i = 0,
    ret = ['li', 
            ['input', 
              'type', 'button', 
              'handler', 'show-runtimes', 
              'class', 'folder-key'].
                concat(win.is_unfolded  ? ['style', 'background-position:0 -11px'] : [] ),
            ['span', 
              win['title'] || win['uri'], 
              'handler', 'select-window', 
              'title', 'select a window']
         ];
    if( win.is_unfolded )
    {
      ret.splice(ret.length, 0, this.runtimes(win.runtimes, 'script'));
    } 
    if (win.is_selected)
    {
      ret.splice(ret.length, 0, 'class', 'selected'); 
    }
    ret.splice(ret.length, 0, 'window_id', win.id);
    return ret;
  }

  this['window-dom'] = function(win)
  {
    var 
    rts_c = null, 
    rt = null, 
    i = 0,
    ret = ['li', 
            ['input', 
              'type', 'button', 
              'handler', 'show-runtimes',
              'class', 'folder-key'].
                concat(win.is_unfolded  ? ['style', 'background-position:0 -11px'] : [] ),
            ['span', 
              win['title'] || win['uri'], 
              'handler', 'select-window', 
              'title', 'select a window']
         ];
    if( win.is_unfolded )
    {
      ret.splice(ret.length, 0, this.runtimes(win.runtimes, 'dom'));
    } 
    if (win.is_selected)
    {
      ret.splice(ret.length, 0, 'class', 'selected'); 
    }
    ret.splice(ret.length, 0, 'window_id', win.id);
    return ret;
  }
  
  this['window-css']  = function(win)
  {
    var 
    rts_c = null, 
    rt = null, 
    i = 0,
    ret = ['li', 
            ['input', 
              'type', 'button', 
              'handler', 'show-runtimes', 
              'class', 'folder-key'].
                concat(win.is_unfolded  ? ['style', 'background-position:0 -11px'] : [] ),
            ['span', 
              win['title'] || win['uri'], 
              'handler', 'select-window', 
              'title', 'select a window']
         ];
    if( win.is_unfolded )
    {
      ret.splice(ret.length, 0, this.runtimes(win.runtimes, 'css'));
    } 
    if (win.is_selected)
    {
      ret.splice(ret.length, 0, 'class', 'selected'); 
    }
    ret.splice(ret.length, 0, 'window_id', win.id);
    return ret;
  }

  this.runtimes = function(runtimes, type, _class, org_args)
  {
    var ret = ['ul'], rt = null, i = 0;
    for( ; rt = runtimes[i]; i++)
    {
      ret[ret.length] = self['runtime-' + type](rt, org_args);
    }
    return ret.concat( _class ? ['class', _class] : [] );
  }

  this['runtime-script'] = function(runtime)
  {
    var display_uri = helpers.shortenURI(runtime['uri']);
    var is_reloaded_window = runtimes.isReloadedWindow(runtime['window-id']);
    var ret = ['li',
          ['input',
            'type', 'button',
            'handler', 'show-scripts',
            'runtime_id', runtime['runtime-id'],
            'class', 'folder-key'].concat(runtime['unfolded-script'] ? ['style', 'background-position:0 -11px'] : [] ),
          ['span', display_uri.uri, 'handler', 'show-global-scope', 'title', 'select a runtime'].
            concat( runtime.selected ? ['class', 'selected-runtime'] : [] ).
            concat( display_uri.title ? ['title', display_uri.title] : [] )
 
      ];
    if( runtime['unfolded-script'])
    {
      var scripts = runtimes.getScripts(runtime['runtime-id']),
        script = null, i=0, scripts_container =['ul'];
      if( scripts.length )
      {
        for( ; script = scripts[i]; i++)
        {
          scripts_container.push(templates.scriptLink(script, runtimes.getSelectedScript()));
        }
      }
      else
      {
        scripts_container = ['p', 
          settings.runtimes.get('reload-runtime-automatically') || is_reloaded_window 
          ? ui_strings.S_INFO_RUNTIME_HAS_NO_SCRIPTS
          : ui_strings.S_INFO_RELOAD_FOR_SCRIPT, 
          'class', 'info-text'];
      }
      scripts_container.splice(scripts_container.length, 0, 'runtime-id', runtime['runtime-id']);
      ret = ret.concat([scripts_container]);
    }
    return ret;
  }
  
  this['runtime-css'] = function(runtime, org_args)
  {
    var ret = ['li',
          ['input', 
            'type', 'button', 
            'handler', 'show-stylesheets', 
            'runtime_id', runtime['runtime-id'],
            'class', 'folder-key'].concat(runtime['unfolded-css'] ? ['style', 'background-position:0 -11px'] : [] ),
          ['span', runtime['uri']]
        
      ];
    if( runtime['unfolded-css'] )
    {
      
      var sheets = stylesheets.getStylesheets(runtime['runtime-id'], org_args),
        sheet = null, i = 0, container = ['ul'];
      if(sheets)
      {
        
        for( ; sheet = sheets[i]; i++)
        {
          container.push(templates.sheetLink(sheet, i, stylesheets.isSelectedSheet(runtime['runtime-id'], i)));
        }
      }
      else
      {
        container = ['p', ui_strings.S_INFO_DOCUMNENT_LOADING, 'class', 'info-text'];
      }
      container.splice(container.length, 0, 'runtime-id', runtime['runtime-id']);
      ret = ret.concat([container])
    }
    return ret;
  }

  this['runtime-dom'] = function(runtime)
  {
    var selected_rt = dom_data.getDataRuntimeId();
    var ret = ['li',
          ['span', runtime['uri'], 'handler', 'show-dom', 'title', 'show dom'].
            concat( selected_rt == runtime['runtime-id'] ? ['class', 'selected-runtime'] : [] ),
          'runtime_id', runtime['runtime-id']
        
      ];
    return ret;
  }

  this.scriptLink = function(script, selected_script)
  {
    var display_uri = helpers.shortenURI(script['uri']);
    // script types in the protocol: 
    //   "inline" | "event" | "linked" | "timeout" | "java" | "generated" | "unknown"
    var type_dict =
    {
      "inline": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_INLINE,
      "linked": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_LINKED,
      "unknown": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_UNKNOWN
    };
    var script_type = script['script-type'];
    var ret = ['li',
        ( type_dict[script_type] || script_type ) + ' - ' + 
         ( 
            display_uri.uri
            ? display_uri.uri
            : ui_strings.S_TEXT_ECMA_SCRIPT_SCRIPT_ID + ': ' + script['script-id'] 
         ),
        'handler', 'display-script',
        'script-id', script['script-id'],
        'tabindex', '1'
      ];

    if( display_uri.title )
    {
      ret.splice(ret.length, 0, 'title', display_uri.title); 
    }
    if( script['script-id'] == selected_script )
    {
      ret.splice(ret.length, 0, 'class', 'selected'); 
    }
    if( script['stop-ats'].length )
    {
      ret.splice(ret.length, 0, 'style', 'background-position: 0 0'); 
    }
    return ret;
  }
  
  this.sheetLink = function(sheet, index, is_selected)
  {
    const
    OBJECT_ID = 0,
    HREF = 2,
    TITLE = 7;
    
    var title = sheet[HREF] ? sheet[HREF] : 'inline stylesheet ' + ( index + 1 ) ;
    return ['li',
            title,
            'handler', 'display-stylesheet',
            'index', '' + index
      ].concat( is_selected ? ['class', 'selected'] : [] )
  }
  //templates.configStopAt(config)
  // stop at: "script" | "exception" | "error" | "abort", yes/no;

  this.checkbox = function(settingName, settingValue)
  {
    return ['li',
      ['label',
        ['input', 
        'type', 'checkbox', 
        'value', settingName,
        'checked', settingValue ?  true : false,
        'handler', 'set-stop-at'
        ],
        settingName
      ]
    ]
  }

  this.frame = function(frame, is_top)
  {
    // %(function name)s line %(line number)s script id %(script id)s
    return ['li',
      ui_strings.S_TEXT_CALL_STACK_FRAME_LINE.
        replace("%(FUNCTION_NAME)s", ( frame.fn_name || ui_strings.ANONYMOUS_FUNCTION_NAME ) ).
        replace("%(LINE_NUMBER)s", ( frame.line || '-' ) ).
        replace("%(SCRIPT_ID)s", ( frame.script_id || '-' ) ),
      'handler', 'show-frame',
      'ref-id', frame.id,

    ].concat( is_top ? ['class', 'selected'] : [] );
  }

  this.configStopAt = function(config)
  {
    var ret =['ul'];
    var arr = ["script", "exception", "error", "abort"], n='', i=0;
    for( ; n = arr[i]; i++)
    {
      ret[ret.length] = this.checkbox(n, config[n]); 
    }
    return ['div'].concat([ret]);
  }
/*

MODE ::= "<mode>" 
             ( "run" | "step-into-call" | "step-next-line" | "step-out-of-call" )
           "</mode>" ;

           */
  this.continues = function()
  {
    var ret = [];
    ret[ret.length] = self.continueWithMode('run ( F5 )', 'run');
    ret[ret.length] = self.continueWithMode('step into call ( F11 )', 'step-into-call');
    ret[ret.length] = self.continueWithMode('step next line ( F10 )', 'step-next-line');
    ret[ret.length] = self.continueWithMode('step out of call ( Shift F11 )', 'step-out-of-call');
    return ret;
  }

  this.continueWithMode = function(name, mode)
  {
    return ['input',
          'type', 'button',
          'value', '',
          'title', name,
          'mode', mode,
          'id', 'continue-' + mode,
          'handler', 'continue',
          'disabled', true
        ]
  }

  this.examineObject = function( data )
  {
    var prop = null, 
    i = 0, 
    ret = ['ul'];


    for( i=0 ; prop = data[i]; i++)
    {
      switch(prop.type)
      {
        case 'object':
        {
          ret[ret.length] = self.key_value_folder(prop.key, i);
          break;
        }
        case 'undefined':
        case 'null':
        {
          ret[ret.length] = self.key_value(prop.key, prop.value, prop.type, i);
          break;
        }
        default:
        {
          ret[ret.length] = ret[ret.length] = self.key_value(prop.key, prop.value, prop.type, i);
          break;
        }
      }
    }

    if( window.__profiling__ ) 
    {
      window.__times__[4] =  new Date().getTime(); // creating markup
    }

    return ret;
  }



  this.key_value = function(key, value, value_class, ref_index)
  {
    return ['li', 
        ['span', key, 'class', 'key'], 
        ['span', value].concat( value_class ? ['class', value_class] : []),
      'ref_index', ref_index
    ];
  }

  this.key_value_folder = function(key, ref_index)
  {
    return ['li', 
      ['input', 'type', 'button', 'handler', 'examine-object', 'class', 'folder-key'],
      ['span', key, 'class', 'key'], 
      ['span', 'object', 'class', 'object'],
      'ref_index', ref_index
    ];
  }

  this.breakpoint = function(line_nr, top)
  {
    return ['li',
          'class', 'breakpoint',
          'line_nr', line_nr,
          'style', 'top:'+ top +'px'
        ]
  }


  this.toolbars = function()
  {
    return ['div', 
      ['h1', 'Opera developer tools'],
      ['div', 'id', 'continues'],
      ['div', 
        ['input', 'type', 'button', 'value', 'create runtimes', 'handler', 'create-all-runtimes'],
      'id', 'main-button-toolbar'],
      ['ul', 
        ['li', 'Runtimes', 'handler', 'drop-down', 'ref', 'runtimes'],
        ['li', 'Configuration', 'handler', 'drop-down', 'ref', 'configuration'],
        ['li', 'Console', 'handler', 'drop-down', 'ref', 'console'],
        ['li', 'Enviroment', 'handler', 'drop-down', 'ref', 'environment'],
        ['li', 'DOM Inspector', 'handler', 'drop-down', 'ref', 'dom-inspector'],
        (ini.debug || window.__profiling__ || window.__times_spotlight__ || window.__times_dom ? 
           ['li', 'Debug', 'handler', 'drop-down', 'ref', 'debug'] : [] ),
        (ini.debug || window.__profiling__ ? ['li', 'Command Line', 'handler', 'drop-down', 'ref', 'command-line'] : [] ),
        (ini.debug || window.__testing__ ? ['li', 'Testing', 'handler', 'drop-down', 'ref', 'testing'] : [] ),

      'class', 'dropdowns'],
      'id', 'ecma-debugger-toolbar']
  }

  this.runtimes_dropdown = function(ele)
  {
    return ['div', ['ul', 'id', 'runtimes'], 'class', 'window-container'];
  }

  this.messages = function(messages)
  {
    var message = null, i = 0;
    var ret = ['div'];
    for( ; message = messages[i]; i++)
    {
      ret[ret.length] = self.message(message);
    }
    return ret;//.concat(['class', 'padding']);
  }

/*

<?xml version="1.0"?>
<message>
<time>1194441921</time>
<uri>file://localhost/d:/cvs-source/scope/http-clients/ecma-debugger/tests/test-console.html</uri>
<context>Inline script thread</context>
<severity>error</severity>
<source>ecmascript</source>
<description xml:space="preserve">Error:
name: ReferenceError
message: Statement on line 2: Undefined variable: b
Backtrace:
  Line 2 of inline#1 script in file://localhost/d:/cvs-source/scope/http-clients/ecma-debugger/tests/test-console.html
    b.b = 'hallo';
</description>
</message>


<message>
<time>1194442013</time>
<uri>file://localhost/d:/cvs-source/scope/http-clients/ecma-debugger/tests/test-console.html</uri>
<context>Inlined stylesheet</context>
<severity>information</severity>
<source>css</source>
<description xml:space="preserve">xxcolor is an unknown property

Line 2:
  body {xxcolor:red}
  --------------^</description></message>

"<severity>"
 ( "debug" | "verbose" | "information" | "error" | "critical" )
"</severity>"

*/

  this.message = function( message)
  {
    return ['div',
      ['date', new Date(parseInt( message.time )*1000).toString().replace(/GMT.*$/, '') ],
      ['h2', message.source, 'severity', message.severity],
      ['uri', (
                (message.uri && (message.uri.indexOf("http://") == 0 || message.uri.indexOf("https://") == 0 || message.uri.indexOf("file://")==0)) ? ["a", message.uri, "href", message.uri, "target", "_blank"] : message.uri
              )
      ],
      ['context', message.context],
      ['pre', message.description]
    ]
  }
    /*

     <div id='dom-view-container'>

      <div id='toolbar'>
      <form>

      <label><input type='radio' id='radio-markup-view' checked='checked'> markup view</label>
      <label><input type='radio' id='radio-dom-view'> dom view</label>
      <label>
        <input type='checkbox' id='checkbox-show-attributes' checked='checked'>
       show attributes</label>

      <label>
        <input type='checkbox' id='checkbox-force-lower-case' checked='checked'>
      force lower case</label>

      <label>
        <input type='checkbox' id='checkbox-show-comments'>
       show comments</label>

      <label>
        <input type='checkbox' id='checkbox-show-white-space-nodes'>
       show white space nodes</label>

      </form>
      </div>

      <div id='content'>
        <div id='dom-view'></div>
      </div>

    </div>

    */

  this.domInspector = function()
  {
    return ['div', 
      ['div',
        ['form',
          ['label',
            ['input', 'type', 'radio', 'id', 'radio-markup-view', 'checked', 'checked'],
          ' markup view '],
          ['label',
            ['input', 'type', 'radio', 'id', 'radio-dom-view'],
          ' dom view '],
          ['label',
            ['input', 'type', 'checkbox', 'id', 'checkbox-show-attributes', 'checked', 'checked'],
          ' show attributes '],
          ['label',
            ['input', 'type', 'checkbox', 'id', 'checkbox-force-lower-case', 'checked', 'checked'],
          ' lower case node names '],
          ['label',
            ['input', 'type', 'checkbox', 'id', 'checkbox-show-comments'],
          ' show comments '],
          ['label',
            ['input', 'type', 'checkbox', 'id', 'checkbox-show-white-space-nodes'],
          ' show white space nodes '],
          ['label',
            ['input', 'type', 'checkbox', 'id', 'checkbox-highlight-on-hover'],
          ' highlight on hover '],
          ['label',
            ['input', 'type', 'checkbox', 'id', 'checkbox-find-element-with-click', 'checked', 'checked'],
          ' find element with click '],
        ],
      'class', 'toolbar'],
      ['div', ['div', 'id', 'dom-view'], 'class', 'content'],
      ['div', '<status>', 'id', 'status-bar-dom-view', 'class', 'status-bar'],
    'class', 'window-container', 'id', 'dom-view-container']
  }

  this.cssInspector = function(categories)
  {
    var ret = [], cat = null, i = 0;
    for( ; cat = categories[i]; i++)
    {
      ret[ret.length] = this.cssInspectorCategory(cat);
    }
    return ret;
  }

  this.cssInspectorCategory = function(cat)
  {
    //<input type="button"  handler="toggle-setting"  view-id="css-inspector"  tab-id="css-inspector"  class="unfolded" />
    var ret = ['category',
        ['header',
          ['input',
            'type', 'button',
            'handler', 'css-toggle-category',
            'cat-id', cat.id
          ].concat( cat.unfolded ? ['class', 'unfolded'] : [] ),
          cat.name,
          'handler', 'css-toggle-category'
        ],
        ['styles']
      ];

    if( cat.unfolded )
    {
      ret.splice(ret.length, 0, 'class', 'unfolded');
    }

    if( cat.handler )
    {
      ret.splice(ret.length, 0, 'handler', cat.handler);
    }

    return ret;
             

  }

  this.breadcrumb = function(css_path)
  {
    var
    ret = ["breadcrumb"],
    i = 0;
    if( css_path )
    {
      for( ; i < css_path.length; i++ )
      {
        ret[ret.length] = 
        [
          "span", css_path[i].name, 
          'obj-id', css_path[i].id.toString(), 
          'handler', 'breadcrumb-link',
          'class', css_path[i].is_parent_offset ? 'parent-offset' : '', 
        ];
        ret[ret.length] = css_path[i].combinator;
      }
    }
    return ret;

  }

  this.uiLangOptions = function(lang_dict)
  {
    var dict =
    [
      {
        browserLanguge: "be",
        key: "be",
        name: "български език"
      },
      {
        browserLanguge: "cs",
        key: "cs",
        name: "česky"
      },
      {
        browserLanguge: "da",
        key: "da",
        name: "dansk"
      },
      {
        browserLanguge: "de",
        key: "de",
        name: "Deutsch"
      },
      {
        browserLanguge: "el",
        key: "el",
        name: "Ελληνικά"
      },
      {
        browserLanguge: "en",
        key: "en",
        name: "English"
      },
      {
        browserLanguge: "en-GB",
        key: "en",
        name: "English"
      },
      {
        browserLanguge: "es-ES",
        key: "es-ES",
        name: "Español"
      },
      {
        browserLanguge: "es-LA",
        key: "es-LA",
        name: "Español"
      },
      {
        browserLanguge: "et",
        key: "et",
        name: "Eesti keel"
      },
      {
        browserLanguge: "fi",
        key: "fi",
        name: "suomen kieli"
      },
      {
        browserLanguge: "fr",
        key: "fr",
        name: "Français"
      },
      {
        browserLanguge: "fr-CA",
        key: "fr-CA",
        name: "Français"
      },
      {
        browserLanguge: "fy",
        key: "fy",
        name: "Frysk"
      },
      {
        browserLanguge: "hi",
        key: "hi",
        name: "हिन्दी"
      },
      {
        browserLanguge: "hr",
        key: "hr",
        name: "Hrvatski"
      },
      {
        browserLanguge: "hu",
        key: "hu",
        name: "Magyar"
      },
      {
        browserLanguge: "id",
        key: "id",
        name: "Bahasa Indonesia"
      },
      {
        browserLanguge: "it",
        key: "it",
        name: "Italiano"
      },
      {
        browserLanguge: "ja",
        key: "ja",
        name: "日本語 (にほんご／にっぽんご)"
      },
      {
        browserLanguge: "ka",
        key: "ka",
        name: "ქართული"
      },
      {
        browserLanguge: "ko",
        key: "ko",
        name: "한국어 (韓國語)"
      },
      {
        browserLanguge: "lt",
        key: "lt",
        name: "lietuvių kalba"
      },
      {
        browserLanguge: "mk",
        key: "mk",
        name: "македонски јазик"
      },
      {
        browserLanguge: "nb",
        key: "nb",
        name: "Norsk bokmål"
      },
      {
        browserLanguge: "nl",
        key: "nl",
        name: "Nederlands"
      },
      {
        browserLanguge: "nn",
        key: "nn",
        name: "Norsk nynorsk"
      },
      {
        browserLanguge: "pl",
        key: "pl",
        name: "polski"
      },
      {
        browserLanguge: "pt",
        key: "pt",
        name: "Português"
      },
      {
        browserLanguge: "pt-BR",
        key: "pt-BR",
        name: "Português"
      },
      {
        browserLanguge: "ru",
        key: "ru",
        name: "русский язык"
      },
      {
        browserLanguge: "sv",
        key: "sv",
        name: "svenska"
      },
      {
        browserLanguge: "ta",
        key: "ta",
        name: "தமிழ்"
      },
      {
        browserLanguge: "te",
        key: "te",
        name: "తెలుగు"
      },
      {
        browserLanguge: "tr",
        key: "tr",
        name: "Türkçe"
      },
      {
        browserLanguge: "uk",
        key: "uk",
        name: "Українська"
      },
      {
        browserLanguge: "sv",
        key: "sv",
        name: "svenska"
      },
      {
        browserLanguge: "zh-cn",
        key: "zh-cn",
        name: "中文, 汉语, 漢語"
      },
      {
        browserLanguge: "zh-tw",
        key: "zh-tw",
        name: "中文, 汉语, 漢語"
      }
    ],
    lang = null,
    i = 0,
    selected_lang = window.ui_strings.lang_code,
    ret = [];

    for( ; lang = dict[i]; i++)
    {
      ret[ret.length] = \
        ['option', lang.name, 'value', lang.key].
        concat( selected_lang == lang.key ? ['selected', 'selected'] : [] ); 
    }
    return ret;
  }
  

}).apply(window.templates);
