var css_data = new function()
{
  var self = this;

  var view_id = 'css-inspector';  // this needs to be handled in a more general and sytematic way.

  var initializedRuntimes = {};

  var data = []; // TODO seperated for all runtimes off the active tab
  var data_runtime_id = '';  // data off a dom tree has always just one runtime
  var current_target = '';

 

/*

<get-matching-css-rules>
  <tag>2132</tag>
  <runtime-id>1</runtime-id>
  <object-id>376</object-id>
</get-matching-css-rules>

<style-rules>
  <tag>2132</tag>
  <rule>
    <object-id>392</object-id> // the same id as the target for direct matches
    <rule-id>395</rule-id> // cssRule
    <stylesheet-id>396</stylesheet-id>
    <specificity>26</specificity>
  </rule>
  ...

*/
  /* target-object, quartes off object, rule, stylesheet, specificity */
  var initRuntime_hostside = function(runtime_id)
  {
    return [
      runtime_id,
      window.document,
      function()  
      {
        var direct_matches = '';
        var inherited = '';
        var node = null, cssRule = null, sheet = null, specificity = 0, i = 1, length = arguments.length, k = 0;
        var getRules=function(style)
        {
          var __cssText='', i=0, styleProp='', setProps={};
          for( ; styleProp=style[i]; i++) 
          {
            if(setProps[styleProp]) 
            {
              continue;
            }
            setProps[styleProp]=1;
            __cssText+=(i?';\n  ':'  ')
              +styleProp
              +': '
              +style.getPropertyValue(styleProp)
              +(style.getPropertyPriority(styleProp)?' !important':'');
          }
          return __cssText;
        };
        for( ; arguments[i]; i += 4)
        {
          node = arguments[i]; 
          cssRule = arguments[i+1]; 
          sheet = arguments[i+2];
          specificity = arguments[i+3];
          if(node == arguments[0])
          {
            direct_matches += cssRule.selectorText + ' {\n' + getRules(cssRule.style) + '\n}\n\n';
          }
          else
          {
            inherited += cssRule.selectorText + ' {\n' + getRules(cssRule.style) + '\n  }\n\n';
          }
        };
        return 'DIRECT MATCHES\n\n' + direct_matches + '\n\nINHERITED\n\n' + inherited;
      }
    ];
  }

  var initRuntime_hostside_to_string = initRuntime_hostside.toString().replace(/&/g, '&amp;');
  //alert(initRuntime_hostside_to_string);

  // returned value is a an object-id, 
  var handleInitRuntimeCall = function(xml, runtime_id)
  {
    
    if(xml.getNodeData('status') == 'completed' )
    {
     var tag = tagManager.setCB(null, initRuntime, [runtime_id]);
     services['ecmascript-debugger'].examineObjects(tag, runtime_id, xml.getNodeData('object-id'))
    }
    else
    {
      opera.postError('initialization from runtime in dom_data has failed');
    }
    
  }

  var initRuntime = function(xml, runtime_id )
  {
    
    var items = xml.getElementsByTagName('object-id');
    if( items.length == 4 )
    {
      //items[0] is the id of the returned array
      initializedRuntimes[items[1].textContent] =
      {
        document_id: items[2].textContent,
        getMatchingRules: items[3].textContent
      }
      var view_id = '', i = 0;
      /*
      for( ; view_id = view_ids[i]; i++)
      {
        if(views[view_id].isvisible())
        {
          onShowView({id: view_id})
        }
      }
      */
    }
    
  }

  // a runtime was selected
  var onActiveTab = function(msg)
  {
    /*
    // TODO clean up old tab
    data = []; // this must be split for all runtimes in the active tab
    var tab = msg.activeTab, rt_id = '', i = 0, tag = 0;
    for( ; rt_id = tab[i]; i++)
    {
      tag = tagManager.setCB(null, handleInitRuntimeCall, [ rt_id ]);
      //alert(initRuntime_hostside_to_string);
      services['ecmascript-debugger'].eval
      (
        tag, 
        rt_id, '', '', 
        '(' + initRuntime_hostside_to_string +')(' + '$' + rt_id + ')', ['$' + rt_id, rt_id]
       );
    }
    */
    
  }


  var onSettingChange = function(msg)
  {

  }

  var onShowView = function(msg)
  {

    var msg_id = msg.id, id = '', i = 0;
    if( msg_id == view_id )
    {
      // i think we don't need this one
      //alert('on show tab: '+msg.id)
      /*
      if( !data.length )
      {

        var tab = host_tabs.getActiveTab(), rt_id = '', i = 0, tag = 0;
        var init_rt_id = null;
        for( ; rt_id = tab[i]; i++)
        {
          if( init_rt_id = initializedRuntimes[rt_id] )
          {
            tag = tagManager.setCB(null, handleGetTree, [ rt_id ]);
            services['ecmascript-debugger'].eval
            (
              tag, 
              rt_id, '', '', 
              '$' + init_rt_id.getTreeWithTarget + '($' + init_rt_id.document_id  + '.body)',  ['$' + init_rt_id.getTreeWithTarget, init_rt_id.getTreeWithTarget, '$' + init_rt_id.document_id, init_rt_id.document_id]
             );
           
          }
          else
          {
            opera.postError('missing initialized runtime in onShowView in dom_data');
          }
        }
      }
      */
    }
    
  }

  var onHideView = function(msg)
  {
    
  }

  var handleGetMatchingCSSRules = function(xml, rt_id, ob_id)
  {
    var string = xml.getElementsByTagName('string')[0];
    if(string)
    {
      data= string.textContent;
      views[view_id].update();
    }
    else
    {
      opera.postError( ( new XMLSerializer()).serializeToString(xml))
    }
    
  }

  var getCSSData = function(xml, rt_id, obj_id)
  {

    var init_rt_id = initializedRuntimes[rt_id];
    if( init_rt_id  )
    {
      data = [];
      var fn = '$' + init_rt_id.getMatchingRules ;
      var params = '$' + obj_id;
      var pairs_arr = ['$' + init_rt_id.getMatchingRules, init_rt_id.getMatchingRules]
      /*
        <rule>
    <object-id>392</object-id> // the same id as the target for direct matches
    <rule-id>395</rule-id> // cssRule
    <stylesheet-id>396</stylesheet-id>
    <specificity>26</specificity>
  </rule>

  */
      var rules = xml.getElementsByTagName('rule'), rule = null, i = 0;
      var obj_id = '', rule_id = '', speci = 0, sheet = '';
      
      for( ; rule = rules[i]; i++)
      {
        obj_id = rule.getElementsByTagName('object-id')[0].textContent;
        rule_id = rule.getElementsByTagName('rule-id')[0].textContent;
        speci = rule.getElementsByTagName('specificity')[0].textContent; 
        sheet = rule.getElementsByTagName('stylesheet-id')[0].textContent;
        params+= ', $' + obj_id + ', $' + rule_id + ', $' + sheet + ', ' + speci;
        pairs_arr = pairs_arr.concat(['$' + obj_id, obj_id, '$' + rule_id, rule_id, '$' + sheet, sheet]);
      }
      
      tag = tagManager.setCB(null, handleGetMatchingCSSRules, [ rt_id, obj_id ]);
      services['ecmascript-debugger'].eval
      (
        tag, 
        rt_id, '', '', 
        fn + '(' + params  + ')', pairs_arr
      );
     
    }
/*
    data = (new XMLSerializer()).serializeToString(xml);
    views[view_id].update();
*/
  }

  var onElementSeleceted = function(msg)
  {
    var tag = tagManager.setCB(null, getCSSData, [msg.rt_id, msg.obj_id]);
    services['ecmascript-debugger'].getMatchingCSSRules(tag, msg.rt_id, msg.obj_id);
  }

  this.getData = function()
  {
    return data.slice(0);
  }

  this.getDataRuntimeId = function()
  {
    return data_runtime_id;
  }


  
  messages.addListener('active-tab', onActiveTab);
  messages.addListener('show-view', onShowView);
  messages.addListener('hide-view', onHideView);
  messages.addListener('setting-changed', onSettingChange);
  messages.addListener('element-selected', onElementSeleceted);

}