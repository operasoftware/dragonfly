window.templates = window.templates || {};

(function()
{
  var self = this;
  this.hello = function(enviroment)
  {
    var ret = ['ul'];
    var prop = '';
    var prop_dict =
    {
      "stpVersion": ui_strings.S_TEXT_ENVIRONMENT_PROTOCOL_VERSION,
      "coreVersion": "Core Version",
      "operatingSystem": ui_strings.S_TEXT_ENVIRONMENT_OPERATING_SYSTEM,
      "platform": ui_strings.S_TEXT_ENVIRONMENT_PLATFORM,
      "userAgent": ui_strings.S_TEXT_ENVIRONMENT_USER_AGENT
    }
    for( prop in prop_dict)
    {
      ret[ret.length] = ['li', prop_dict[prop] + ': ' + enviroment[prop]];
    }
    if( ini.revision_number.indexOf("$") != -1 && ini.mercurial_revision )
    {
      ini.revision_number = ini.mercurial_revision;
    }
    ret[ret.length] = ['li', ui_strings.S_TEXT_ENVIRONMENT_DRAGONFLY_VERSION + ': ' + ini.dragonfly_version];
    ret[ret.length] = ['li', ui_strings.S_TEXT_ENVIRONMENT_REVISION_NUMBER + ': ' + ini.revision_number];
    ret.push('class', 'selectable');
    return ['div', ret, 'class', 'padding'];
  }

  this.runtimes = function(runtimes, type, arg_list)
  {
    var ret = [], rt = null, i = 0;
    for( ; rt = runtimes[i]; i++)
    {
      ret[ret.length] = self['runtime-' + type](rt, arg_list);
    }
    return ret;
  }

  this.runtime_dropdown = function(runtimes)
  {
    return this._group_runtimes(runtimes, false).map(this.runtime, this);
  }

  this.runtime = function(runtime)
  {
    var option = ['cst-option', runtime.title, 'rt-id', String(runtime.id)];
    if (runtime.title_attr)
      option.push('title', runtime.title_attr);
    var ret = [option];
    if (runtime.extensions && runtime.extensions.length)
      ret.push(['cst-group', runtime.extensions.map(this.runtime, this)]);
    return ret;
  }

  this['runtime-runtime'] = function(runtime, arg_list)
  {
    var display_uri = helpers.shortenURI(runtime.uri);

    return [
      'cst-option',
      runtime['title'] || display_uri.uri,
      'rt-id', runtime.runtime_id.toString()
    ].concat( display_uri.title ? ['title', display_uri.title] : [] )
    ;
  }

  // to extract the extension runtimes from the runtimes list
  // and push them to a extension property of the owner runtime
  // if the get_script flag is set, the scripts of the runtime are sorted to 
  // scripts, browser_js and user_js_s.
  this._group_runtimes = function(runtimes, get_scripts)
  {
    /*
      runtime =
      {
        runtime_id: r_t[RUNTIME_ID],
        html_frame_path: r_t[HTML_FRAME_PATH],
        window_id: r_t[WINDOW_ID] || __selected_window,
        object_id: r_t[OBJECT_ID],
        uri: r_t[URI],
        description: r_t[DESCRIPTION],
      };

      script =
      {
        runtime_id: message[RUNTIME_ID],
        script_id: message[SCRIPT_ID],
        script_type: message[SCRIPT_TYPE],
        script_data: message[SCRIPT_DATA],
        uri: message[URI]
      };
    */

    var 
    rts = [],
    rt_map = {},
    rt = null, 
    rt_obj = null,
    i = 0,
    display_uri = null,
    rt_id = 0,
    scripts = null,
    script = null,
    j = 0,
    browser_js = null,
    user_js_s = null;
    
    for ( ; rt = runtimes[i]; i++)
    {
      rt_id = rt.runtime_id;
      switch (rt.description)
      {
        case "extensionjs":
        {
          var owner_rt = rt_map[rt.uri];
          if (owner_rt)
          {
            rt_obj =
            {
              type: "extension",
              id: rt_id,
              uri: rt.uri,
              title: "Extension Runtime " + rt.runtime_id,
            };
            if (get_scripts)
              rt_obj.scripts = window.runtimes.getScripts(rt_id);
            owner_rt.extensions.push(rt_obj);
            runtimes.splice(i, 1);
            i--;
          }
          else
            opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + 
                            'extension rt without owner rt in templates.script_dropdown')
          break
        }
        
        default:
        {
          display_uri = helpers.shortenURI(rt.uri);
          rt_obj = 
          {
            type: "document",
            id: rt_id,
            uri: rt.uri,
            title: rt.title || display_uri.uri,
            title_attr: display_uri.title,
            selected: rt.selected,
            extensions: [],
          };
          if (get_scripts)
          {
            scripts = window.runtimes.getScripts(rt_id, true);
            browser_js = null;
            user_js_s = [];
            for (j = scripts.length - 1; script = scripts[j]; j--)
            {
              switch (script.script_type)
              {
                case "Browser JS":
                  browser_js = scripts.splice(j, 1)[0];
                  break;

                case "User JS":
                  user_js_s.push(scripts.splice(j, 1)[0]); 
                  break;
              }
            }
            rt_obj.scripts = scripts;
            rt_obj.browser_js = browser_js;
            rt_obj.user_js_s = user_js_s;
          }
          rt_map[rt.uri] = rt_obj;
          rts.push(rt_obj);
        }
      }
    }
    return rts;
  }

  this.script_dropdown = function(runtimes, stopped_script_id, selected_script_id)
  {
    var context = new this._ScriptsContext(stopped_script_id, selected_script_id);
    return context._group_runtimes(runtimes, true).map(context.runtime_script, context);
  }

  this._ScriptsContext = function(stopped_script_id, selected_script_id)
  {
    this.stopped_script_id = stopped_script_id;
    this.selected_script_id = selected_script_id;
  }

  this._ScriptsContext.prototype = this;

  this.runtime_script = function(runtime)
  {
    var
    ret = [],
    script_list = null,
    script_uri_paths = {};
    title = runtime.type == "extension" ?
            ['cst-title', runtime.title] :
            ['h2', runtime.title];

    if (runtime.selected)
      title.push('class', 'selected-runtime');
    if (runtime.title_attr)
      title.push('title', runtime.title_attr);
    ret.push(title);

    var me = this;
    runtime.scripts.forEach(function(script){
      var ret_script = me.script_option(script);
      var display_uri = helpers.shortenURI(script.uri);
      var root_uri = me._uri_path(runtime.uri, script, display_uri.uri);
      if(script_uri_paths.hasOwnProperty(root_uri)){
        script_uri_paths[root_uri].push(ret_script);
      } else {
        script_uri_paths[root_uri] = [ret_script];
      }
    });
    script_list = this.flatten_uri_scripts(script_uri_paths);

    if (runtime.type == "extension")
      ret.push(['cst-group', script_list]);
    else
    {
      ret.push.apply(ret, script_list);
      if (runtime.browser_js)
        ret.push(['cst-title', 'Browser JS'], 
                 this.script_option(runtime.browser_js));
      if (runtime.user_js_s && runtime.user_js_s.length)
      {
        ret.push(['cst-title', 'User JS']);
        ret.push.apply(ret, runtime.user_js_s.map(this.script_option, this));
      }
      if (runtime.extensions && runtime.extensions.length)
      {
        ret.push.apply(ret, runtime.extensions.map(this.runtime_script, this));
      }
    }
    return ret;
  }

  this._uri_path = function(uri, script, script_name)
  {
    var uri_path = '';
    if( script.script_type === 'linked' )
    {
      uri_path = script.uri.replace(uri, '');
      uri_path = uri_path.replace(script_name, '');
      uri_path = uri_path.replace(/\?.*/,'');
    } else {
      uri_path = 'Anonymous';
    }
    return uri_path === "" ? script_name : uri_path;
  }

  this.flatten_uri_scripts = function(uri_paths){
    var ret = [];
    for(uri in uri_paths){
      ret.push(['cst-title',uri]);
      uri_paths[uri].forEach(function(script){ret.push(script);});
    }
    return ret;
  }

  // script types in the protocol:
  // "inline", "event", "linked", "timeout",
  // "java", "generated", "unknown"
  // "Greasemonkey JS", "Browser JS", "User JS", "Extension JS"
  this._script_type_map =
  {
    "inline": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_INLINE,
    "linked": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_LINKED,
    "unknown": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_UNKNOWN
  };

  this.script_option = function(script)
  {
    var display_uri = helpers.shortenURI(script.uri);
    var script_type = this._script_type_map[script.script_type] || script.script_type;
    var ret = 
    [
      'cst-option',
      ["span", (script.script_type != "linked" ? script_type.capitalize(true) + ' – ' : ''),
        [(
          display_uri.uri ?
          ["span", display_uri.uri] :
          ["code", 
            script.script_data.slice(0, 360).replace(/\s+/g, " ").slice(0, 120), 
            "class", "code-snippet"]
        )]
      ],
      'script-id', script.script_id.toString()
    ];
    var class_name = script.script_id == this.selected_script_id ? 
                     'selected' : '';
    if (this.stopped_script_id == script.script_id)
      class_name += ( class_name && ' ' || '' ) + 'stopped';
    if (display_uri.title)
      ret.push('title', display_uri.title);
    if (class_name)
      ret.push('class', class_name);

    return ret;
  }

  this['runtime-css'] = function(runtime, org_args)
  {
    const
    OBJECT_ID = 0,
    HREF = 2,
    TITLE = 7;

    var
    display_uri = helpers.shortenURI(runtime.uri),
    ret =
    [
      ['h2', runtime['title'] || display_uri.uri].
      concat( display_uri.title ? ['title', display_uri.title] : [] )
    ],
    sheets = stylesheets.getStylesheets(runtime.runtime_id),
    sheet = null,
    i = 0,
    container = [],
    rt_id = runtime.runtime_id,
    title = '';

    if(sheets)
    {
      for( ; sheet = sheets[i]; i++)
      {
        title = sheet[HREF] ? sheet[HREF] : 'inline stylesheet ' + ( i + 1 ) ;
        container[container.length] =
        [
          'cst-option',
          title,
          'runtime-id', '' + rt_id,
          'index', '' + i
        ];
      }
    }
    /*
    else
    {
      container = ['p', ui_strings.S_INFO_DOCUMNENT_LOADING, 'class', 'info-text'];
    }
    */
    //container.splice(container.length, 0, 'runtime-id', runtime.runtime_id);
    ret = ret.concat([container])

    return ret;
  }


  this['runtime-dom'] = function(runtime)
  {
    var display_uri = runtime['title'] || helpers.shortenURI(runtime.uri).uri;
    return (
    [
      'cst-option',
       runtime['title'] || runtime.uri,
      'runtime-id', runtime.runtime_id.toString()
    ].concat( dom_data.getDataRuntimeId() == runtime.runtime_id ? ['class', 'selected'] : [] ).
      concat( display_uri != runtime.uri ? ['title', runtime.uri] : [] ) )
  }

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
    // Fall back to document URI if it's inline
    var uri = frame.script_id && runtimes.getScript(frame.script_id)
            ? (runtimes.getScript(frame.script_id).uri || runtimes.getRuntime(frame.rt_id).uri)
            : null;
    return ['li',
             ['span', frame.fn_name, 'class', 'scope-name'],
             ['span',
              " " + (uri && frame.line ? helpers.basename(uri) + ':' + frame.line : ""),
              'class', 'file-line'],
      'handler', 'show-frame',
      'ref-id', String(frame.id),
      'title', uri
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
    return ['span',
          'tabindex', '1',
          'value', '',
          'title', name,
          'mode', mode,
          'id', 'continue-' + mode,
          'handler', 'continue',
          'disabled', true,
          'class', 'ui-button'
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


  this.runtimes_dropdown = function(ele)
  {
    return ['div', ['ul', 'id', 'runtimes'], 'class', 'window-container'];
  }

  this['js-script-select'] = function(ui_obj)
  {
    return self['cst-select'](ui_obj.script_select);
  }

  this.breadcrumb = function(model, obj_id, parent_node_chain, target_id, show_combinator)
  {
    var setting = window.settings.dom;
    var css_path = model._get_css_path(obj_id, parent_node_chain,
                                       setting.get('force-lowercase'),
                                       setting.get('show-id_and_classes-in-breadcrumb'),
                                       setting.get('show-siblings-in-breadcrumb'));
    var ret = [];
    target_id || (target_id = obj_id)
    if (css_path)
    {
      for (var i = 0; i < css_path.length; i++ )
      {
        ret[ret.length] =
        [
          "breadcrumb", css_path[i].name,
          'ref-id', css_path[i].id.toString(),
          'handler', 'breadcrumb-link',
          'data-menu', 'breadcrumb',
          'class', (css_path[i].is_parent_offset ? 'parent-offset' : '') + 
                   (css_path[i].id == target_id ? ' active' : ''),
        ];
        if (show_combinator)
        {
          ret[ret.length] = " " + css_path[i].combinator + " ";
        }
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
        name: "Беларуская"
      },
      {
        browserLanguge: "bg",
        key: "bg",
        name: "Български"
      },
      {
        browserLanguge: "cs",
        key: "cs",
        name: "Česky"
      },
      {
        browserLanguge: "da",
        key: "da",
        name: "Dansk"
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
        name: "U.S. English"
      },
      {
        browserLanguge: "en-GB",
        key: "en-GB",
        name: "British English"
      },
      {
        browserLanguge: "es-ES",
        key: "es-ES",
        name: "Español (España)"
      },
      {
        browserLanguge: "es-LA",
        key: "es-LA",
        name: "Español (Latinoamérica)"
      },
      {
        browserLanguge: "et",
        key: "et",
        name: "Eesti keel"
      },
      {
        browserLanguge: "fi",
        key: "fi",
        name: "Suomen kieli"
      },
      {
        browserLanguge: "fr",
        key: "fr",
        name: "Français"
      },
      {
        browserLanguge: "fr-CA",
        key: "fr-CA",
        name: "Français Canadien"
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
        name: "日本語"
      },
      {
        browserLanguge: "ka",
        key: "ka",
        name: "ქართული"
      },
      {
        browserLanguge: "ko",
        key: "ko",
        name: "한국어"
      },
      {
        browserLanguge: "lt",
        key: "lt",
        name: "Lietuvių kalba"
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
        name: "Polski"
      },
      {
        browserLanguge: "pt",
        key: "pt",
        name: "Português"
      },
      {
        browserLanguge: "pt-BR",
        key: "pt-BR",
        name: "Português (Brasil)"
      },
      {
        browserLanguge: "ro",
        key: "ro",
        name: "Română"
      },
      {
        browserLanguge: "ru",
        key: "ru",
        name: "Русский язык"
      },
      {
        browserLanguge: "sk",
        key: "sk",
        name: "Slovenčina"
      },
      {
        browserLanguge: "sr",
        key: "sr",
        name: "српски"
      },
      {
        browserLanguge: "sv",
        key: "sv",
        name: "Svenska"
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
        browserLanguge: "zh-cn",
        key: "zh-cn",
        name: "简体中文"
      },
      {
        browserLanguge: "zh-tw",
        key: "zh-tw",
        name: "繁體中文"
      }
    ],
    lang = null,
    i = 0,
    selected_lang = window.ui_strings.lang_code,
    ret = [];

    for( ; lang = dict[i]; i++)
    {
      ret[ret.length] = ['option', lang.name, 'value', lang.key].
        concat( selected_lang == lang.key ? ['selected', 'selected'] : [] );
    }
    return ret;
  }

}).apply(window.templates);
