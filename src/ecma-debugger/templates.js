window.templates = window.templates || ( window.templates = {} );

(function()
{
  var self = this; 
  this.hello = function(enviroment)
  {
    var ret = ['ul'];
    var prop = '';
    for( prop in enviroment)
    {
      ret[ret.length] = ['li', prop+': '+enviroment[prop]];
    }
    ret[ret.length] = ['li', 'Dragonfly Version: ' + ini.dragonfly_version];
    ret[ret.length] = ['li', 'Revision Number: ' + ini.revision_number];
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
          ? ui_strings.RUNTIME_HAS_NO_SCRIPTS
          : ui_strings.INFO_NO_SCRIPTS_PLEASE_RELOAD, 
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
        container = ['p', ui_strings.INFO_DOCUMNENT_LOADING, 'class', 'info-text'];
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
    var ret = ['li',
        script['script-type']+' - ' + 
         ( 
            display_uri.uri
            ? display_uri.uri
            : 'script-id: ' + script['script-id'] 
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
    return ['li',
      ( frame.fn_name ? frame.fn_name : 'anonymous' ) + 
        ( frame.line ? ' ' + 'line ' + frame.line : '' ) + 
        ( frame.script_id ? ' script id ' + frame.script_id : '' ),
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
      ['uri', message.uri],
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
  

}).apply(window.templates);
