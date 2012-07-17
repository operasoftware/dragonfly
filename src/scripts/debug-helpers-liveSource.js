// helper to debug the client with the built-in proxy
window.debug_helpers || ( window.debug_helpers = {} );

debug_helpers.liveSource = new function()
{
  var ___settingsLiveSource =
  {
    lines: 1,
    lineNumbers: 1,
    tag: '#05F',
    attrTitle: '#E00',
    attrValue: '#C0C',
    attrDoc: '#800080',
    comment: 'green',
    darkLine: '#FAFAFA',
    lineHead: '#999'
  };
  var tab='  ';
  var emptyTags={img:1, br:1, link:1, input:1, hr:1, meta:1};
  var xml=false;
  var counter=0;
  var showLinenumbers=___settingsLiveSource.lineNumbers;
  var showLines=___settingsLiveSource.lines;
  var icon_src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEeklEQVR4Xr1Xb0hbVxS%2FN3lPncZIFMXV%2Bmd0dmjJuipszH8wnCJ%2BEIQh0Y1ULTpFXN1kofjdsbmiUldmmWwuON2H4kdBYU7FL%2BIGw4GFiR2skagMqyb%2By0vifufSF5Yu%2BmJdPHC81%2FPuueeX3zn3vPv48fEx45y%2Fzhh7D%2Fo21MQiK7vQeehDxF7imFyNi4v7cWRkJL24uFhJSkpyw%2BaLUHD99va2YWZmRq6vr3%2Bys7NjIQBdo6OjH9fW1i76fL7vgMoB9UQiOpiWoZf1en3D2NjYm3V1dX0S7O%2BUl5d7FUX5HvqYRVYU6J%2ByLA9XVlbmYf4uATAlJia6IH%2F5%2FX52EeL1ep8YjUYXpkYAEOI7ODjwsIsTJT4%2BXtSZpFoODw9DrhwaGvpkb2%2FPjClnYUhUVNRyaWnpveTkZMVkMmkWswCAojsRgNvtvt7d3X0tNjY2FJVsf3%2BfbWxssLS0NLa2tsb6%2B%2FtfmpiYsJWUlNzlnB%2FGxMSEzCvFDIsBnAwdBd%2Fd3T0tp4zWJCQksI6Ojis9PT3S9PS0DcX2GZjwEghNBlADIRegMHU0Li8vExssPz9f2FvuP2KDbTk0FSyoQiC6uroywRpfWloymM1mF0D4NRnAJicyQGNubi7NVbMIrsrR0ZEYU1JSAnt5PB55dXXVmJqauo9Gp2gyAKeT6A3JwIOmX8XY9OCGSN%2FU1JSaJlpHYPUAJuOZ2PuFGUAKOI05OTkEhv5XAwc2ysrKEv6gmtYIQJOTkxyNjaG%2F6OjZCzNAv4TGlZUV5nA4WFFRkbC3Df7B7rdcZUMtvwWtt9x9VQUuAPxvDGRnZ7PMzMyA41cfZov5ra%2BvB61Hn2c6nU74ITgpC4sBNJtTT8Hi4iJbX19nZWVlwv7RN6tivNd0hf3e1hbkU2C3E3PEAJ0u2luTAc0izMvLo2oP1ED%2FrVdUgOzawMC%2FOyH1BMEAfFlYDEAI5anHcG5uTtRAdXW1sD%2B6fTvk%2BjcGB1U%2FjqPIVQa0UqAJoKCgIIiB1%2Fr6TkqZSjGlgI4kNxgM7DyNiNOI%2Fi5qAJcIYf%2FU7mBfWi9T6%2F2Pz%2Fj4OPmFnwKg0QSASwt1t8Av%2FOKDS2Le29sbtD46OjoyxxC%2FSrz1Ghsbhf3OD04xfv7%2By6yzs%2FN5BlQAOqTtfAxIkiQAVFVVBdmJflXwCg4FnE7Q%2BRlAAXF6lpGRwcIVrA9KgSzL7MyvYzjLsMWhqzkqKiqiaUOq7HBBoF62ACQZ%2Fjvw8wCEcqYLCd5sJoAwbG1tDaAQjaQwy1CdRmw%2F7c859yA4sZHgg%2BCesHGmKxl6%2BlP40SZePHdjw79h5kJPl%2BNn6ofvEWroKdRF%2B4digEN%2FQRMyFhYWWp1Op8IiL%2FTalhYWFuy4qLgkYhvv7Es1NTXpuMs9vggAFoslHamJx9RJAH6enZ0134SApm%2Ftdvva5uamNxKBcWWTrFZrWkNDw01cWin2T%2FTnYXNzc%2FXw8PBb7e3tN2w2mxv58Ufo21CHk2WYn5%2BPam1tdVDs5z%2FPS6AGFllxQ%2BfUz%2FN%2FAGv8CRiMYmtNAAAAAElFTkSuQmCC';

  var openTagNameHead=function(name)
  {
    return "<span class='tag'>&lt;"+name+"";
  }

  var openTagNameFoot=function(xmlemptyTag)
  {
    return (xmlemptyTag?'/':'')+"&gt;</span>";
  }

  var closeTagName=function(name, xmlemptyTag)
  {
    if(xmlemptyTag || emptyTags[name.toLowerCase()]) return '';
    return "<span class='tag'>&lt;/"+name+"&gt;</span>";
  }

  var getDoctype=function()
  {
		var doctype=document.doctype, code='';
		if(doctype)
    {
      code=lineHead()+openTagNameHead('!DOCTYPE')+" <span class='attrDoc'>"+doctype.nodeName+
			(doctype.publicId?' PUBLIC "'+doctype.publicId+'"':'')+
			(doctype.systemId?'</span></span></span></li>'+lineHead()+'<span class=\'tag\'><span class=\'attrDoc\'>'+tab+'"'+doctype.systemId+'"':'')+"</span>"+openTagNameFoot()+'</span></li>';
    }
    return code;
  }

  var getAttrs=function(ele)
  {
    var attrs=ele.attributes, attr=null, realAttr=null, ret='', i=0;
    for( ; attr=attrs[i]; i++)
    {
      realAttr=ele.getAttribute(attr.name);
      if(realAttr &&
        !(ele.nodeName.toLowerCase()=='a' && attr.name=='SHAPE' && realAttr=='rect'))
      {
        realAttr=realAttr.replace(/</g,'&lt;').replace(/</g,'&lt;').replace(/\t/g, tab);
        ret+=" <span class='attrTitle'>"+attr.name+"</span>"
          +"="
          +"<span class='attrValue'>\""+realAttr+"\"</span> ";
      }
    }
    return ret;
  }

  var getTextNodeData=function(ele)
  {
    return text=ele.nodeValue.replace(/[\n\t\r\u00A0]+ */g,'').
      replace(/ +/g,' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var getIndent=function(deep)
  {
    var i=0, ret='';
    while(i<deep)
    {
      ret+=tab;
      i++;
    }
    return ret;
  }

  var lineHead=function()
  {
    var lineNumber=counter.toString();
    while(lineNumber.length<3) lineNumber='0'+lineNumber;
    return "<li class='line"+(showLines&&((counter++)&1)?" dark'":"'")+"><span>";//"<p class='line"+(showLines&&((counter++)&1)?" dark'":"'")+"><span class='lineHead'></span>";
  }

  this.updateNumbers=function(ele)
  {
    if(ele.checked)
    {
      ele.ownerDocument.body.className='';
    }
    else
    {
      ele.ownerDocument.body.className='hideLineNumbers';
    }
  }

  var getLayer=function(ele, deep, singleText)
  {
    var indent=getIndent(deep++);
    var text='';
    switch (ele.nodeType)
    {
      case 1:
      {
        var childs=ele.childNodes, child=null, i=0;
        var simple=(childs.length==0)||(childs.length==1 && childs[0].nodeType==3);
        var xmlemptyTag=xml&&childs.length==0;
        var ret=lineHead()+indent+openTagNameHead(ele.nodeName)+getAttrs(ele)+
          openTagNameFoot(xmlemptyTag);
        if(!simple) ret+='</span></li>';
        for( ; child=childs[i]; i++)
        {
          ret+=getLayer(child, deep, !simple&&child.nodeType==3);
        }
        if(simple)
        {
          // more carful
          ret+=(/textarea/i.test(ele.nodeName)?ele.value:'')+closeTagName(ele.nodeName, xmlemptyTag)+'</span></li>';
        }
        else
        {
          ret+=lineHead()+indent+closeTagName(ele.nodeName, xmlemptyTag)+'</span></li>';
        }
        return ret;
      }

      case 3:
      {
        if((text=getTextNodeData(ele)) && singleText)
        {
          return lineHead()+indent+text+'</span></li>';
        }
        else
        {
          return text;
        }
      }
      case 8:
      {
        text=getTextNodeData(ele);
        return lineHead()+indent+"<span class='comment'>&lt;!--"+text+'--&gt;</span></span></li>';
      }

      case 4:
      {
        text=getTextNodeData(ele);
        return lineHead()+indent+"<span class='cdata'>&lt;![CDATA[</span>"+text+
          "<span class='cdata'>]]&gt;</span></span></li>";
      }
    }

    return ele.nodeType
  }

  var getLiveMarkup=function()
  {
    var markup=getDoctype();
    var ele=document.documentElement;
    markup+=getLayer(ele,0);
    return markup;
  }

  this.open=function()
  {
    xml=/[a-z]/.test(document.documentElement.nodeName);
    var markup='<!DOCTYPE html PUBLIC><html><head><title></title>'
        +'<style type=\'text/css\'>'
        +'body {padding:5px;margin:0;font-family:sans-serif;font-size:.7em;background: #FFF url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAqCAIAAAD9HKYrAAAAOUlEQVQY062MsQ2AQBDDrOw%2F6xc0TxVTHHoxAEXkwnLY%2B0YN8NvEKEEz30MdR03x%2BLav97Tfbq3rAYdRNs%2F1y8dMAAAAAElFTkSuQmCC") scroll repeat-x 0 2px;color:#000;}#logo {height:40px;border:none;padding:1px;margin:0;}#logo a{ content:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAAPCAYAAAA1f%2BslAAAABGdBTUEAAK%2FINwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAALmSURBVFjD7VnRjeQgDE0LtEALtJAW0kJaoAVaoAVaoAX%2B5psWaIElOnP3xmfCjFazl9ENkqUhcRLg2c%2FPu8vyGe8wTLPaLE89b8uim6VmuVklO%2Bb%2B9utFPzG2ZrFZIQvN1osfsqc1%2F8TQBGh9FNAOZCBDcPcXLzbAYhNFYZ%2FvFwVTUeBZmltau7kUoOz6DqC%2BaqEWqETD9R02YC4I6EZr62uubH49QOle6JnL%2FD1kcbwRPdLvu6xuv7fuJ3y%2B0CI34V6ke57VEU%2BAJ5pHgZ41UHgWMj3Dc8d7HGWdh%2FcmyECJVRI9U8H6fhSswwPzxEEpMfTOTBZYcEiAavLre7SPANrByOB7AFkIVE%2B%2FD58VsjoKQbE%2FGXU7EwKaHVqEw8dM1lCLESD8fgWfSoBqqN8eqN9O6BZLRlz%2BBL9maw2DAF5hPQECuQCo0lklCPDwLKCV5r6DBz4GMlUBTSu6X8jUgLbqhNaqsKmViZMKAsUzHyUoRARAMbC4skwTuh1RbmAMg89mxhYcZEfXwgBQBaCrZyi3Z1yiOYqlv4xnJGXtHWULBzbL0DTJaC7pM6NBNMUA4PV5Beqrg%2B8FAWQJ0Dz4RgFfZJ2zPUl7D%2FCs%2B723CaC9JjrItkqZ6phZltVByuhv1NARoCvbfIHnHLMzAFCgOZjXE7r9l4D2oM93DHWich1dL0CfPfvsRGh1ms031gx777dmoZkGajlTuVIdMQLlBha5Zy3PIwBIh7gN1GwRSsF3KNdPKHeUGErqQyNkYmH1UsO9DH1rYn4O3mkZoKVZbeZYJs76UM3UJIoiFBBGEClJEEUc mAhr8GwdZ3S7MCGTTkSRpAFQKzwqihSIqHBXmkC5VgDqANUKQkZqW7q%2FEYTSYZoBapvlZobRXYLoDQJV4aYs%2BXVgjUBZ%2BJcn3i5IdIhtQILWqEzoFtskLqI0BMdoX71sRPDzLNg4BatJm%2FMW4%2FHm%2BjWj96xvd3AfQD%2FjYv9x%2BI%2FHF%2FGwg80geQ5eAAAAAElFTkSuQmCC");display:block;height:18px;xxborder:1px solid blue;margin-left:46px;}#logo img {width:32px;height:32px;float:left;margin-left:5px;}#logo h1{margin:0;padding:0 2px;font-size:1.3em;font-weight:bold;margin-left:43px;}p.title, p.url{margin:0;padding:0;line-height:1.4em;font-weight:bold;margin-left:5px;}p.url{color:#666;margin-bottom:5px;}#content{white-space:pre-wrap}ol {color:#999;}.hideLineNumbers ol{margin:0;padding:0;}span{color:#000}.tag{color:#05F}.attrTitle{color:#E00}.attrValue{color:#C0C}.attrDoc{color:#800080}.comment{color:green}.line{margin:0;padding:0}.dark{background-color:#FAFAFA}h1{font-family: sans-serif;font-size: 14px;margin-top: 20px;}label{float:right;font-weight:normal;font-size:11px;}'
        +'#content{white-space:pre-wrap}'
        +'ol {color:'+___settingsLiveSource.lineHead+'}'
        +'.hideLineNumbers ol{margin:0;padding:0;}'
        +'span{color:#000}'
        +'.tag{color:'+___settingsLiveSource.tag+'}'
        +'.attrTitle{color:'+___settingsLiveSource.attrTitle+'}'
        +'.attrValue{color:'+___settingsLiveSource.attrValue+'}'
        +'.attrDoc{color:'+___settingsLiveSource.attrDoc+'}'
        +'.comment{color:'+___settingsLiveSource.comment+'}'
        +'.line{margin:0;padding:0}'
        +'.dark{background-color:'+___settingsLiveSource.darkLine+'}'
				+'h1{font-family: sans-serif; font-size: 14px; margin-top: 20px;}'
        +'label{float:right;font-weight:normal;font-size:11px;}'
        +'</style></head><body>'
        +'<div id="logo">'
        +'<img src="'+icon_src+'">'
        +'<a href="http://dev.opera.com/tools/" ></a>'
        +'<h1>DOM Snapshot</h1>'
        +'</div>'
        +'<p class="title" >'+document.title+'</p>'
        +'<p class="url" >[ '+location.protocol+'//'+location.host+location.pathname+' ]</p>'
        +'<ol id=\'content\'>'+getLiveMarkup()+'</ol></body></html>';
    window.open('data:text/html,' + encodeURIComponent(markup),'_blank');

  }
}
