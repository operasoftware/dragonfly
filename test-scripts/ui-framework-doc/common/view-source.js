/**
  * @constructor 
  */

var export_data = new function ()
{
  this.data = '';
  this.type = '';
};


window.cls || ( window.cls = {} );
/**
  * @constructor 
  * @extends ViewBase
  */
cls.ExportDataView = function(id, name, container_class)
{
  this.is_hidden = true;
  this.hidden_in_settings = true;
  this.createView = function(container)
  {
    container.innerHTML = "<div class='padding " + (export_data.type && ' ' + export_data.type || '' ) + " '><pre>" + export_data.data + "</pre></div>";
  }
  this.init(id, name, container_class);
}

cls.ExportDataView.prototype = ViewBase;

new cls.ExportDataView('export_data', 'Source View', 'scroll export-data');

ui_framework.layouts.export_rough_layout =
{
  tabs: ['export_data'] 
}

new CompositeView('export_new', 'Source View', ui_framework.layouts.export_rough_layout);

( window.utils || ( window.utils = {} ) ).sourceView = new function()
{
  var
  void_elements = 
  {
    'area': 1,
    'base': 1,
    'basefont': 1,
    'bgsound': 1,
    'br': 1,
    'col': 1,
    'embed': 1,
    'frame': 1,
    'hr': 1,
    'img': 1,
    'input': 1,
    'link': 1,
    'meta': 1,
    'param': 1,
    'spacer': 1,
    'wbr': 1,
    'command': 1,
    'event-source': 1,
    'source': 1,
  },
  force_tag_names_lower_case = 1,
  include_tags_in_selection = 0,
  show_whole_dom_on_empty_selection = 1,
  tab = "  ",
  xml = false,
  selection_start = "", 
  selection_end = "", 
  anchor_node = null,
  focus_node = null,
  selection = null,
  opening_tag_head = function(name)
  {
    return \
      ( include_tags_in_selection ? selection_start : "" ) + 
      "<span class='tag'>&lt;" + 
      ( force_tag_names_lower_case ? name.toLowerCase() : name );
  },
  opening_tag_foot = function(xmlemptyTag)
  {
    return \
      ( xmlemptyTag ? '/' : '' ) + "&gt;</span>" + 
      ( include_tags_in_selection ? selection_end : "" );
  },
  closing_tag = function(name, xmlemptyTag)
  {
    if( xmlemptyTag || void_elements[name.toLowerCase()]) return '';
    return \
      ( include_tags_in_selection ? selection_start : "" ) + 
      "<span class='tag'>&lt;/" + 
      ( force_tag_names_lower_case ? name.toLowerCase() : name ) + 
      "&gt;</span>" + 
      ( include_tags_in_selection ? selection_end : "" ) ;
  },
  get_attrs = function(ele)
  {
    var attrs = ele.attributes, attr = null, ret = '', i = 0;
    for( ; attr = attrs[i]; i++)
    {
      ret += \
        " <span class='attr-name'>" + attr.name + "</span>=<span class='attr-value'>\"" +
        attr.value.replace(/</g,'&lt;').replace(/\t/g, tab) +
        "\"</span>";
    }
    return ret;
  },
  get_text_node_data = function(ele)
  {
    var text = ele.nodeValue, before_selection = '', _selection = '', after_selection = ''; 
    if (anchor_node && ele == anchor_node)
    {
      selection_start = "<span class='selection'>";
      selection_end = "</span>";
      before_selection = text.slice(0, selection.anchorOffset);
      if(anchor_node == focus_node)
      {
        _selection = text.slice(selection.anchorOffset, selection.focusOffset);
        after_selection = text.slice(selection.focusOffset)
      }
      else
      {
        _selection = text.slice(selection.anchorOffset);
      }
    }
    else if(focus_node && ele == focus_node && focus_node != anchor_node)
    {
      _selection = text.slice(0, selection.focusOffset);
      after_selection = text.slice(selection.focusOffset)
    }
    else
    {
      _selection = text;
    }
    text = \
      encode_text(before_selection) + 
      selection_start + 
      encode_text(_selection) + 
      selection_end + 
      encode_text(after_selection);
    if (focus_node && ele == focus_node)
    {
      selection_start = "";
      selection_end = "";
    }
    return text.replace(/<span class='selection'><\/span>/, '');
  },
  encode_text = function(text)
  {
    return \
      text.
      replace(/[\n\t\r\u00A0]+ */g, '').
      replace(/ +/g, ' ').
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;');
  },
  get_indent = function(deep)
  {
    for(var i = 0, indent = ''; i < deep && ( indent += tab ); i++);
    return indent;
  },
  get_layer = function(ele, deep, is_single_text_node)
  {
    var indent = get_indent(deep++), text = '';
    switch (ele.nodeType)
    {
      case 1:
      {
        var 
        children = ele.childNodes, 
        child = null, 
        i = 0,
        simple = ( children.length == 0 ) || ( children.length == 1 && children[0].nodeType == 3 ),
        xml_empty_element = xml && children.length == 0,
        ret = \
          "<div>" + indent + 
          opening_tag_head(ele.nodeName) + get_attrs(ele) + opening_tag_foot(xml_empty_element) +
          ( !simple && "</div>" || "" );
        
        for( ; child = children[i]; i++)
        {
          ret += get_layer(child, deep, !simple && child.nodeType == 3 );
        }
        if(simple)
        {
          // more carful
          ret += \
            (/textarea/i.test(ele.nodeName) && ele.value || '' ) + 
            closing_tag(ele.nodeName, xml_empty_element) + 
            "</div>";
        }
        else
        {
          ret += "<div>" + indent + closing_tag(ele.nodeName, xml_empty_element) + selection_end + "</div>";
        }
        return ret; 
      }
      case 3:
      {
        if( ( text = get_text_node_data(ele) ) && is_single_text_node ) 
        {
          return "<div>" +indent+ text + '</div>';
        }
        else
        {
          return text;
        }
      }
      case 8:
      {
        text=get_text_node_data(ele);
        return "<div>" +indent+"<span class='comment'>&lt;!--"+text+'--&gt;</span>'+selection_end+'</div>';
      }
      case 4:
      {
        text=get_text_node_data(ele);
        return "<div>" +indent+"<span class='cdata'>&lt;![CDATA[</span>"+text+
          "<span class='cdata'>]]&gt;</span>"+selection_end+"</div>";
      }
    }
    return ele.nodeType
  };

  this.getSource = function()
  {
    xml = /[a-z]/.test(document.documentElement.nodeName);
    selection = null;
    return "<pre>" + get_layer(document.documentElement, 0) + "</pre>";
  };
};

var js_source = new function()
{
  var self = this;
  var source_file = '';
  var GetSource = function(url, org_args)
  {
    this.onload = function()
    {
      source_file = this.responseText;
      org_args.callee.apply(self, org_args);
    }
    this.open('GET', url);
    this.send();
  }
  this.getSource = function(org_args)
  {
    if( source_file.length )
    {
      return source_file;
    }
    GetSource.call(new XMLHttpRequest(), 'application.js', org_args);
    return '';
  }
}

eventHandlers.click['source-view'] = function(event)
{
  export_data.data = utils.sourceView.getSource();
  export_data.type = '';
  if(!topCell.tab.hasTab('export_new'))
  {
    topCell.tab.addTab(new Tab('export_new', views['export_new'].name, true))
  }
  topCell.showView('export_data');
}

eventHandlers.click['js-source-view'] = function(event)
{
  var js_source_file = js_source.getSource(arguments);
  if(js_source_file)
  {
    var script_obj = {};
    script_obj.source = script_obj.source_data = new String(js_source_file);
    script_obj.line_arr = [];
    script_obj.state_arr = [];
    pre_lexer(script_obj);
    export_data.data = simple_js_parser.format(script_obj, 0, script_obj.line_arr.length ).join('');
    export_data.type = 'templates-code';
    if(!topCell.tab.hasTab('export_new'))
    {
      topCell.tab.addTab(new Tab('export_new', views['export_new'].name, true))
    }
    topCell.showView('export_data');
  }
}



document.addEventListener
(
  'keypress',
  function(event)
  {
    if(event.ctrlKey && event.keyCode == 'D'.charCodeAt(0))
    {
      event.preventDefault();
      event.stopPropagation();
      eventHandlers.click['source-view'](event);
    }
    else if(event.ctrlKey && event.keyCode == 'J'.charCodeAt(0))
    {
      event.preventDefault();
      event.stopPropagation();
      eventHandlers.click['js-source-view'](event);
    }
  },
  false
)
