var action_handler = new function()
{
  var handler = function(event)
  {
    var ele = event.target, handler = ele.getAttribute('handler');
    while( !handler && ( ele = ele.parentElement ) )
    {
      handler = ele.getAttribute('handler');
    }
    if( handler && handlers[handler] )
    {
      handlers[handler](event, ele);
    }
  }

  var handlers = {};
  /*
"<examine-objects>" 
  "<tag>" UNSIGNED "</tag>"
  "<runtime-id>" UNSIGNED "</runtime-id>" 
  "<object-id>" UNSIGNED "</object-id>"*
"</examine-objects>"

  {
    var msg = "<runtimes>";
    var tag = tagManager.setCB(this, parseRuntime);
    msg += "<tag>" + tag +"</tag>";
    var i=0, r_t=0;
    for ( ; r_t = arguments[i]; i++)
    {
      msg += "<runtime-id>" + r_t +"</runtime-id>";
    }
    msg += "</runtimes>";
    proxy.POST("/" + service, msg);
  }

  <LI 
  handler="show-frame" 
  runtime_id="1" 
  argument_id="0" 
  scope_id="0" 
  line="3" 
  script_id="1">anonymous line 3 script id 1</LI>

  */

  handlers['show-frame'] = function(event)
  {
    var frame = stop_at.getFrame(event.target['ref-id']);
    if(frame)
    {
      topCell.showView(views['frame_inspection'].id);
      messages.post('active-inspection-type', {inspection_type: 'frame'});
      messages.post('frame-selected', {frame_index: event.target['ref-id']});
      if( event.type == 'click' )
      {
        helpers.setSelected(event);
        if( views.js_source.isvisible() )
        {
          if( frame.script_id )
          { 
            views.js_source.showLine( frame.script_id, frame.line - 10 );
            views.js_source.showLinePointer( frame.line, frame.id == 0 );
          }
          else
          {
            views.js_source.clearView();
          }
        }
        
      }
    }
    else
    {
      opera.postError("missing frame in 'show-frame' handler");
    }

    
  }

  handlers['examine-object'] = function(event)
  {
    var ele = event.target.parentNode, 
      list = null, 
      path_arr = [], 
      cur = ele, 
      par = cur;
    do
    {
      cur = par;
      path_arr.unshift( parseInt( cur.getAttribute( 'ref_index' ) ) );
    }
    while ( ( par = cur.parentElement ) && ( par = par.parentElement ) && par.id != 'examine-objects' );
    var obj = frame_inspection.getObject(path_arr);
    if( !obj )
    {
      opera.postError("Error in action_handler handlers['examine-object']");
    }
    if(obj.items.length)
    {
      obj.items = []; // that should be done in frame_inspection
      views.frame_inspection.clearView(path_arr);
      event.target.style.removeProperty('background-position');
    }
    else
    {
      var runtime_id = frame_inspection.getRuntimeId();
      var tag = tagManager.setCB(null, responseHandlers.examinObject, [runtime_id, path_arr]);
      services['ecmascript-debugger'].examineObjects( tag, runtime_id, obj.value );
      event.target.style.backgroundPosition = '0 -11px';
    }
  }

 
  handlers['examine-object-2'] = function(event, target)
  {
    var
    parent = target.parentNode,
    parent_parent = parent.parentNode,
    obj_id = parent.getAttribute('obj-id'),
    depth = parseInt(parent.getAttribute('depth')),
    rt_id = parent_parent.getAttribute('rt-id'),
    data_id = parent_parent.getAttribute('data-id'),
    margin = parseInt(parent.style.paddingLeft),
    data = null,
    cur = parent,
    i = 0,
    cur_2 = parent.nextSibling,
    cur_3 = null,
    is_expanded = target.disabled
      || ( cur_2 && parseInt(cur_2.style.paddingLeft) > margin )
      // if it's the active search scope
      || ( cur_2 && ( cur_2 = cur_2.nextSibling ) && parseInt(cur_2.style.paddingLeft) > margin ),
    is_in_search_scope =
      parent.previousSibling && parent.previousSibling.nodeName == "start-search-scope",
    range = null;
    if( window[data_id] )
    {
      if( is_expanded )
      {
        if( !target.disabled )
        {
          window[data_id].clearData(rt_id, obj_id, depth, parent.getElementsByTagName('key')[0].textContent);
          range = document.createRange();
          range.setStartAfter(parent);
          while( ( cur = cur.nextSibling ) && ( parseInt(cur.style.paddingLeft) > margin || cur.nodeName != "item" ))
          {
            range.setEndAfter(cur);
            cur_2 = cur;
            if( cur.nodeName == "end-search-scope" )
            {
              is_in_search_scope = true;
            }
          }
          if(is_in_search_scope)
          {
            cur = cur_2;
            while( ( cur = cur.nextSibling ) && ( parseInt(cur.style.paddingLeft) >= margin || cur.nodeName != "item" ) )
            {
              cur_2 = cur;
            }
            if(cur_2.nodeName == 'end-search-scope' &&  !cur_2.nextSibling && cur_2.previousSibling)
            {
              range.setEndAfter(cur_2.previousSibling);
            }
            else
            {
              parent_parent.insertAfter(parent_parent.getElementsByTagName('end-search-scope')[0], cur_2);
            }
            cur = parent;
            while( ( cur = cur.previousSibling ) && ( parseInt(cur.style.paddingLeft) >= margin || cur.nodeName != "item" ) )
            {
              cur_2 = cur;
            }
            if( cur_3 = parent_parent.getElementsByTagName('start-search-scope')[0].previousSibling )
            {
              cur_3.removeClass('search-scope');
            }
            if( cur )
            {
              parent_parent.insertAfter(parent_parent.getElementsByTagName('start-search-scope')[0],
                cur );
              cur.addClass('search-scope');
              messages.post( 'list-search-context', 
                {
                  'data_id': data_id,
                  'rt_id': rt_id,
                  'obj_id': cur.getAttribute('obj-id'), 
                  'depth': cur.getAttribute('depth'),
                  'key': cur.getElementsByTagName('key')[0].textContent
                });
            }
            else
            {
              parent_parent.insertBefore(parent_parent.getElementsByTagName('start-search-scope')[0],
                parent_parent.firstChild );
              messages.post( 'list-search-context', 
                {
                  'data_id': data_id, 
                  'rt_id': rt_id,
                  'obj_id': parent_parent.getAttribute('obj-id'), 
                  'depth': '-1',
                  'key': ''
                });
            }
            
          }
          range.deleteContents();
          parent.removeClass('search-scope');
          target.style.removeProperty("background-position");
          //alert(parent_parent.getElementsByTagName('end-search-scope')[0]);
        }
      }
      else
      {
        
        if( data = window[data_id].getData(rt_id, obj_id, depth, arguments) )
        {
         
          if( data.length )
          {

            parent_parent.insertAfter( parent_parent.getElementsByTagName('end-search-scope')[0], parent);
            parent.spliceInnerHTML(window[data_id].prettyPrint(data, depth, window[data_id].getDataFilter(), window[data_id].filter_type));
            parent_parent.insertAfter( parent_parent.getElementsByTagName('start-search-scope')[0], parent);
            cur_2 = parent_parent.getElementsByClassName('search-scope');
            while( cur = cur_2[0] )
            {
              cur.removeClass('search-scope');
            }
            parent.addClass('search-scope');
            cur = parent;
            i = parseInt(cur.getAttribute('depth'));
            while( cur = cur.previousSibling )
            {
              if( parseInt(cur.getAttribute('depth')) < i )
              {
                i = parseInt(cur.getAttribute('depth'));
                cur.addClass('search-scope');
                if( !i )
                {
                  break;
                }
              }
            }
            target.style.backgroundPosition = "0px -11px";
            messages.post( 'list-search-context', 
              {
                'data_id': data_id, 
                'rt_id': rt_id,
                'obj_id': obj_id, 
                'depth': depth,
                'key': parent.getElementsByTagName('key')[0].textContent
              });
            
          }
          else
          {
            target.disabled = true;
          }
        }
      }
    }
  }

  handlers['show-global-scope'] = function(event) // and select runtime
  {
    var ele = event.target;
    var runtime = runtimes.getRuntime( ele.previousSibling && ele.previousSibling.getAttribute('runtime_id') || '' );
    if( runtime )
    {
      topCell.showView(views.frame_inspection.id);
      messages.post('active-inspection-type', {inspection_type: 'object'});
      object_inspection.showGlobalScope(runtime['runtime-id']);
      runtimes.setSelectedRuntime(runtime);
      views.runtimes.update();
    }
  }

  handlers['show-scripts'] = function(event)  
  {
    var runtime_id = event.target.getAttribute('runtime_id');
    var scripts = runtimes.getScripts(runtime_id);
    var scripts_container = event.target.parentNode.getElementsByTagName('ul')[0];
    var script = null, i=0;
    if(scripts_container)
    {
      event.target.parentNode.removeChild(scripts_container);
      event.target.style.removeProperty('background-position');
      runtimes.setUnfolded(runtime_id, 'script', false);
    }
    else
    {
      scripts_container =['ul'];
      for( ; script = scripts[i]; i++)
      {
        scripts_container.push(templates.scriptLink(script));
      }
      scripts_container.splice(scripts_container.length, 0, 'runtime-id', runtime_id);
      event.target.parentNode.render(scripts_container);
      event.target.style.backgroundPosition = '0 -11px';
      runtimes.setUnfolded(runtime_id, 'script', true);
    }
  }
  
  handlers['show-stylesheets'] = function(event, target)
  {
    var rt_id = target.getAttribute('runtime_id');
    // stylesheets.getStylesheets will call this function again if data is not avaible
    // handleGetAllStylesheets in stylesheets will 
    // set for this reason __call_count on the event object
    var sheets = stylesheets.getStylesheets(rt_id, arguments);
    if(sheets)
    {
      var container = event.target.parentNode.getElementsByTagName('ul')[0];
      var sheet = null, i = 0;
      if(container)
      {
        target.parentNode.removeChild(container);
        target.style.removeProperty('background-position');
        runtimes.setUnfolded(rt_id, 'css', false);
      }
      else
      {
        container = ['ul'];
        for( ; sheet = sheets[i]; i++)
        {
          container.push(templates.sheetLink(sheet, i));
        }
        event.target.parentNode.render(container);
        event.target.style.backgroundPosition = '0 -11px';
        runtimes.setUnfolded(rt_id, 'css', true);
      }
      
    }

    
  }
  
  handlers['display-stylesheet'] = function(event, target)
  {
    var index = parseInt(target.getAttribute('index'));
    var rt_id = target.parentNode.parentNode.firstChild.getAttribute('runtime_id');
    // stylesheets.getRulesWithSheetIndex will call this function again if data is not avaible
    // handleGetRulesWithIndex in stylesheets will 
    // set for this reason __call_count on the event object
    var rules = stylesheets.getRulesWithSheetIndex(rt_id, index, arguments);

    if(rules)
    {
      stylesheets.setSelectedSheet(rt_id, index, rules);
      topCell.showView(views.stylesheets.id);
      helpers.setSelected(event);
    }
  }

  handlers['display-rule-in-stylesheet'] = function(event, target)
  {
    var index = parseInt(target.getAttribute('index'));
    var rt_id = target.getAttribute('rt-id');
    var rule_id = target.parentNode.getAttribute('rule-id');
    // stylesheets.getRulesWithSheetIndex will call this function again if data is not avaible
    // handleGetRulesWithIndex in stylesheets will 
    // set for this reason __call_count on the event object
    var rules = stylesheets.getRulesWithSheetIndex(rt_id, index, arguments);
    if(rules)
    {
      stylesheets.setSelectedSheet(rt_id, index, rules, rule_id);
      topCell.showView(views.stylesheets.id);
    }
  }

  handlers['show-runtimes'] = function(event)  
  {
    var window_id = event.target.parentNode.getAttribute('window_id');
    var rts = runtimes.getRuntimes(window_id);
    var runtime_container = event.target.parentNode.getElementsByTagName('ul')[0];
    var rt = null, i=0;
    var template_type = event.target.parentNode.parentNode.getAttribute('template-type');
    if(runtime_container)
    {
      event.target.parentNode.removeChild(runtime_container);
      event.target.style.removeProperty('background-position');
      runtimes.setWindowUnfolded(window_id, false);
    }
    else
    {
      event.target.parentNode.render(templates.runtimes(rts, template_type));
      event.target.style.backgroundPosition = '0 -11px';
      runtimes.setWindowUnfolded(window_id, true);
    }
  }

  handlers['show-dom'] = function(event, target)
  {
    var rt_id = target.parentNode.getAttribute('runtime_id');
    
    if(rt_id)
    {
      topCell.showView('dom');
      dom_data.getDOM(rt_id);
    }
  }

  handlers['display-script'] = function(event)
  {
    var script_id  = event.target.getAttribute('script-id');
    if(script_id)
    {
      runtimes.setSelectedScript( script_id );
      views.runtimes.updateSelectedScript(event.target, script_id);
      topCell.showView(views.js_source.id);
    }
    else
    {
      opera.postError("missing script id in handlers['display-script']")
    }
  }

  handlers['continue'] = function(event)
  {
    views.js_source.clearView();
    views.callstack.clearView();
    views.frame_inspection.clearView();
    stop_at.__continue(event.target.id.slice(9));
  }

  handlers['set-stop-at'] = function(event)
  {
    stop_at.setUserStopAt(event.target.value, event.target.checked);
  }

  handlers['set-break-point'] = function(event)
  {
    var line = event.target.parentElement.children[0].value;
    var script_id = views.js_source.getCurrentScriptId();
    if( line )
    {
      if( runtimes.hasBreakpoint(script_id, line) )
      {
        runtimes.removeBreakpoint(script_id, line);
        views.js_source.removeBreakpoint(line);
      }
      else
      {
        runtimes.setBreakpoint(script_id, line);
        views.js_source.addBreakpoint(parseInt(line));
      }
    }
  }

  handlers['drop-down'] = function(event)
  {
    var ele = event.target;
    var drop_down = document.getElementById('drop-down-view');
    var type = ele.getAttribute('ref');
    if(drop_down)
    {
      //document.body.removeChild(drop_down.parentNode);
    }
    else
    {
      switch(type)
      {
        case 'runtimes':
        {
          if( windows.showWindow('runtimes', 'Runtimes', templates.runtimes_dropdown(ele)) )
          {
            views.runtimes.update();
          }
          break;
        }
        case 'console':
        {
          if( windows.showWindow('console', 'Console', ['div', 'class', 'window-container', 'id', 'console-view']) )
          {
            views.console.update();
          }
          break;
        }
        case 'environment':
        {
          if( windows.showWindow('environment', 'Environment', ['div', 'class', 'window-container', 'id', 'view-environment']) )
          {
            views.environment.update();
          }
          break;
        }
        case 'dom-inspector':
        {
          if( windows.showWindow('dom-inspector', 'DOM Inspector', templates.domInspector()/*['div', 'class', 'window-container', 'id', 'view-dom-inspector']*/) )
          {
            views['dom-inspector'].update();
          }
          break;
        }
        case 'configuration':
        {
          if( windows.showWindow('configuration', 'Stop At', ['div', 'class', 'window-container', 'id', 'configuration']) )
          {
            views.configuration.update();
          }
          break;
        }
        case 'debug':
        {
          if( windows.showWindow
            (
              'debug', 
              'Debug', 
              ['div', 
                ['input', 
                  'type', 'button', 
                  'value', 'clear output', 
                  'onclick', 'debug.clear()'],
                ['input', 
                  'type', 'button', 
                  'value', 'export', 
                  'onclick', 'debug.export()'],
                ['pre', 'id', 'debug'],
              'class', 'window-container', 'id', 'debug-container']
            )
          )
          {
            window.debug.output();
          }
          break;
        }

        case 'testing':
        {
          if( windows.showWindow('Testing', 'Testing', ['div', 'class', 'window-container', 'id', 'testing']) )
          {
            
            testing.view.update();
          }
          break;
        }

        case 'command-line':
        {
          if( windows.showWindow
            (
              'command-line', 
              'Command Line', 
              ['div', 
                ['div',
                  ['input', 
                    'type', 'button', 
                    'value', 'eval', 
                    'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<eval>\\n  <tag>1</tag>\\n  <runtime-id></runtime-id>\\n  <thread-id></thread-id>\\n  <frame-id></frame-id>\\n  <script-data></script-data>\\n</eval>';"],
                  ['input', 
                    'type', 'button', 
                    'value', 'set breakpoint', 
                    'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<add-breakpoint>\\n  <breakpoint-id> x </breakpoint-id>\\n  <source-position>\\n    <script-id> x </script-id>\\n    <line-number> x </line-number>\\n  </source-position>\\n</add-breakpoint>';"],
                  ['input', 
                    'type', 'button', 
                    'value', 'examine obj', 
                    'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<examine-objects>\\n  <tag>1</tag>\\n  <runtime-id>x</runtime-id>\\n  <object-id>x</object-id>\\n</examine-objects>';"],
                  ['input', 
                    'type', 'button', 
                    'value', 'post', 
                    'style', 'margin-left:10px',
                    'onclick', 'services[\'ecmascript-debugger\'].postCommandline()'],
                'style', 'text-align: right'],
                ['div', ['textarea'], 'id', 'command-line-container'],
              'class', 'window-container', 'id', 'command-line']
            )
          )
          {
            window.debug.output();
          }
          break;
        }       
      }
    }

  }

  handlers['get-children'] = function(event)
  {
    var container = event.target.parentNode;
    var level = ( parseInt(container.style.marginLeft) || 0 ) / 16;
    var level_next = ( container.nextSibling && parseInt(container.nextSibling.style.marginLeft) || 0 ) / 16;
    var ref_id = container.getAttribute('ref-id');
    if(level_next > level)
    {
      dom_data.closeNode(ref_id);
    }
    else
    {
      dom_data.getChildernFromNode(ref_id);
    }
    
  }

  handlers['spotlight-node'] = function(event, current_target)
  {
    var rt_id = dom_data.getDataRuntimeId(); // is this the correst way?
    var obj_id = current_target.getAttribute('ref-id');
    if(obj_id && !handlers['spotlight-node'].timeout )
    {
      services['ecmascript-debugger'].spotlight(rt_id, obj_id, obj_id != dom_data.getCurrentTarget());
      handlers['spotlight-node'].timeout = setTimeout(handlers['spotlight-node'].clearSpotlight, 800, rt_id);
      dom_data.setCurrentTarget(obj_id);
      views['dom'].updateTarget(current_target);
    }
  }

  handlers['spotlight-node'].timeout = 0;
  handlers['spotlight-node'].clearSpotlight = function(rt_id)
  {
    services['ecmascript-debugger'].clearSpotlight(rt_id);
    handlers['spotlight-node'].timeout = 0;
  }

  handlers['create-all-runtimes'] = function()
  {
    services['ecmascript-debugger'].createAllRuntimes();
  }

  handlers['update-global-scope'] = function(event)
  {
    handlers['show-frame']({'target': { 'ref-id': 0 } });
  }

  handlers['dom-inspection-export'] = function(event)
  {
    export_data.data = views['dom'].exportMarkup();
    if(!topCell.tab.hasTab('export_new'))
    {
      topCell.tab.addTab(new Tab('export_new', views['export_new'].name, true))
    }
    topCell.showView('export_data');
  }
/*
<category>
          <header>
            <input type="button"  handler="css-toggle-category"  cat-id="computedStyle"  class="unfolded" />
            computed style
          </header>
          <styles/>
        </category>
        */
  handlers['css-toggle-category'] = function(event, target)
  {
    if(/header/.test(target.nodeName))
    {
      target = target.firstChild;
    }
    var cat = target.getAttribute('cat-id'), value = target.hasClass('unfolded');
    var cat_container = target.parentNode.parentNode;
    if( value )
    {
      target.removeClass('unfolded');
      cat_container.removeClass('unfolded');
      var styles = cat_container.getElementsByTagName('styles')[0];
      if( styles )
      {
        styles.innerHTML = "";
      }
    }
    else
    {
      target.addClass('unfolded');
      cat_container.addClass('unfolded');
    }
    elementStyle.setUnfoldedCat( cat , !value);
    settings['css-inspector'].set(cat, !value);
  }

  handlers['inspect-object-link'] = function(event, target)
  {
    var rt_id = target.getAttribute('rt-id');
    var obj_id = target.getAttribute('obj-id');
    messages.post('active-inspection-type', {inspection_type: 'object'});
    // if that works it should be just inspection
    topCell.showView(views.frame_inspection.id);
    messages.post('object-selected', {rt_id: rt_id, obj_id: obj_id});

  }



  this.post = function(handler, event)
  {
    if(handlers[handler])
    {
      handlers[handler](event);
    }
  }

  document.addEventListener('click', handler, false);
}
