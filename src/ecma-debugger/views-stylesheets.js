
var cls = window.cls || ( window.cls = {} );

/**
* @constructor 
* @extends ViewBase
*/

cls.StylesheetsView = function(id, name, container_class)
{
  var self = this;

  this.createView = function(container)
  {
    var selected_sheet = stylesheets.getSelectedSheet(arguments);
    if(selected_sheet)
    {
      // TODO check markup
      //var t = new Date().getTime();
      container.innerHTML = 
        "<div class='padding'>" + 
        stylesheets.prettyPrintRules(selected_sheet.rules, settings[self.id].get('shortcuts') ) + 
        "</div>";
      if(selected_sheet.rule_id)
      {
        //opera.postError(selected_sheet.rule_id);
        var rules = container.getElementsByTagName('rule'), rule = null, i = 0;
        for( ; rule = rules[i]; i++)
        {
          if(rule.getAttribute('rule-id') == selected_sheet.rule_id )
          {
            container.scrollTop = rule.offsetTop;
            //opera.postError(selected_sheet.rule_id+' '+rule.offsetTop)
            break;
          }
        }
        //alert(selected_sheet.rule_id);
      }
      //window.open('data:text/plain;charset=utf-8,'+encodeURIComponent(container.innerHTML))
      //opera.postError((new Date().getTime() - t) +' '+ container.innerHTML.length);  
    }
    else
    {
      container.innerHTML = '';
    }
    
  }
  
  this.show = function(rules)
  {
    if( !this.isvisible() )
    {
      topCell.showView(this.id);
    }
    var cs = this.getAllContainers(), c = null , i= 0;
    for( ; c = cs[i]; i++)
    {
      
    }
    
  }
  this.init(id, name, container_class);
}
cls.StylesheetsView.prototype = ViewBase;
new cls.StylesheetsView('stylesheets', ui_strings.M_VIEW_LABEL_STYLESHEET, 'scroll stylesheets');


cls.StylesheetSelect = function(id)
{

  var selected_value = "";

  const 
    HREF = 2,
  TITLE = 7;

  

  this.getSelectedOptionText = function()
  {
    var 
    title = '',
    selected_sheet = stylesheets.getSelectedSheet(),
    sheet = null;

    if(selected_sheet)
    {
      sheet = stylesheets.getSheetWithRtIdAndIndex(selected_sheet.runtime_id, selected_sheet.index);
      if( sheet )
      {
        title = sheet[TITLE] || sheet[HREF] || 'inline stylesheet ' + ( selected_sheet.index + 1 );
      }
    }
    return title;
  }

  this.getSelectedOptionValue = function()
  {

  }

  this.templateOptionList = function(select_obj)
  {
    
    // TODO this is a relict of protocol 3, needs cleanup
    var active_window_id = runtimes.getActiveWindowId();

    if( active_window_id )
    {
      return templates.runtimes(runtimes.getRuntimes(active_window_id), 'css');
    }
    opera.postError('no active window in templateOptionList in cls.StylesheetSelect');
    return [];
  }

  this.checkChange = function(target_ele)
  {

    var index = parseInt(target_ele.getAttribute('index'));
    var rt_id = target_ele.getAttribute('runtime-id');
    // stylesheets.getRulesWithSheetIndex will call this function again if data is not avaible
    // handleGetRulesWithIndex in stylesheets will 
    // set for this reason __call_count on the event object
    var rules = stylesheets.getRulesWithSheetIndex(rt_id, index, arguments);

    if(rules)
    {
      stylesheets.setSelectedSheet(rt_id, index, rules);
      topCell.showView(views.stylesheets.id);
    }


    /*
    var rt_id = target_ele.getAttribute('runtime-id');

    if( rt_id != dom_data.getDataRuntimeId() )
    {
      if(rt_id)
      {
        dom_data.getDOM(rt_id);
      }
      else
      {
        opera.postError("missing runtime id in cls.StylesheetSelect.checkChange")
      }
      return true;
    }
    return false;
    */
  }

  // this.updateElement

  this.init(id);
}

cls.StylesheetSelect.prototype = new CstSelect();

new cls.StylesheetSelect('stylesheet-select', 'stylesheet-options');

new Settings
(
  // id
  'stylesheets', 
  // key-value map
  {
    'shortcuts': true
  }, 
  // key-label map
  {
    'shortcuts': ui_strings.S_SWITCH_CREATE_SHORTHANDS
  },
  // settings map
  {
    checkboxes:
    [
      'shortcuts'
    ]
  }
);

new ToolbarConfig
(
  'stylesheets',
  null,
  [
    {
      handler: 'stylesheets-text-search',
      title: 'text search'
    }
  ],
  null,
  [
    {
      handler: 'select-window',
      title: ui_strings.S_BUTTON_LABEL_SELECT_WINDOW,
      type: 'dropdown',
      class: 'window-select-dropdown',
      template: window['cst-selects']['stylesheet-select'].getTemplate()
    }
  ]
)

new Switches
(
  'stylesheets',
  [
    'shortcuts'
  ]
);

  // button handlers

(function()
{
  // filter handlers
  var textSearch = new TextSearch();

  var onViewCreated = function(msg)
  {
    if( msg.id == 'stylesheets' )
    {
      textSearch.setContainer(msg.container);
      textSearch.update();
    }
  }

  var onViewDestroyed = function(msg)
  {
    if( msg.id == 'stylesheets' )
    {
      textSearch.cleanup();
    }
  }

  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);



  eventHandlers.input['stylesheets-text-search'] = function(event, target)
  {
    textSearch.searchDelayed(target.value);
  }

  eventHandlers.keyup['stylesheets-text-search'] = function(event, target)
  {
    if( event.keyCode == 13 )
    {
      textSearch.highlight();
    }
  }
  
})();