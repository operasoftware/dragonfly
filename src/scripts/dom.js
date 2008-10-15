/**
 * @fileoverview
 * Helper function prototypes related to DOM objects and the DOM
 * templating system.
 */

Element.prototype.___add=Document.prototype.___add=function()
{
  if(arguments.length)
  {
    if(arguments[0])
    {
      var doc=this.nodeType==9?this:this.ownerDocument;
      var i=0, ele=(typeof arguments[0])=='string'?doc.createElement(arguments[i++]):this; 
      var prop='', is_array=false, arg=arguments[i];
      while((is_array=arg instanceof  Array) ||
       (((typeof arg=='string') || (typeof arg=='number')) && (((arguments.length-i)%2)|| arguments[i+1] instanceof  Array ))
      )
      {
        if(is_array) 
        {
          ele.___add.apply(ele, arg); 
        }
        else if(arg) 
        {
          ele.appendChild(doc.createTextNode(arg));
        }
        arg=arguments[++i];
      }
      for( ;arguments[i] ; i+=2)
      {
        if(/string/.test(typeof arguments[i+1]))
        {
          ele.setAttribute(arguments[i], arguments[i+1]);
        }
        else
        {
          ele[arguments[i]]=arguments[i+1];
        }
      }
      if(this.nodeType==1 && (this!=ele))
      {
        this.appendChild(ele);
      }
      return ele;
    }
    else
    {
      return this.appendChild(doc.createTextNode(arguments[1]));
    }
  }
  return null;
}

Element.prototype.___add_inner = Document.prototype.___add_inner = function()
{
  if(arguments.length)
  {
    if(arguments[0])
    {
      var i=1; 
      var prop='', is_array=false, arg=arguments[i];
      var head = "<" + arguments[0];
      var content = '';
      var attrs = ' ';
      while((is_array=arg instanceof  Array) ||
       (((typeof arg=='string') || (typeof arg=='number')) && (((arguments.length-i)%2)|| arguments[i+1] instanceof  Array ))
      )
      {
        if(is_array) 
        {
          content += Element.prototype.___add_inner.apply(null, arg); 
        }
        else if(arg) 
        {
          content += arg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        arg=arguments[++i];
      }
      for( ;arguments[i] ; i+=2)
      {
        attrs += arguments[i] + "=\u0022" + arguments[i+1] + "\u0022";
      }
      head += attrs + ">" + content + "</" + arguments[0] +">";
      if(this && this.nodeType == 1 )
      {
        this.innerHTML += head;
      }
      return head;
    }
  }
  return '';
}

Element.prototype.render=Document.prototype.render=function(template)
{
  return this.___add.apply(this, template);
}

Element.prototype.renderInner = Document.prototype.renderInner = function(template)
{
  return this.___add_inner.apply(this, template);
}



Element.prototype.clearAndRender=function(template)
{
  this.innerHTML='';
  return this.___add.apply(this, template);
}

Element.prototype.addClass=function(name)
{
  if(!(new RegExp('\\b'+name+'\\b')).test(this.className))
  {
    this.className=(this.className?this.className+' ':'')+name;
  }
  return this;
}

Element.prototype.removeClass=function(name)
{
  var re=new RegExp(name+' ?| ?'+name);
  if(re.test(this.className)) 
  {
    this.className=this.className.replace(re, '');
  }
  return this;
}

Element.prototype.hasClass=function(name)
{
  return (new RegExp('(?:^| +)'+name+'(?: +|$)')).test(this.className)
}

Element.prototype.getNextSiblingElement = function()
{
  var next = this.nextSibling;
  while( next && next.nodeType != 1 )
  {
    next = next.nextSibling;
  }
  return next;
}

Element.prototype.getTop = function()
{
  var c = this, o_p = null, top = c.offsetTop;
  while( o_p = c.offsetParent )
  {
    top += o_p.offsetTop;
    c = o_p;
  }
  return top;
}

Element.prototype.insertAfter = function(node, target)
{
  var nextElement = target.nextSibling;
  while( nextElement && nextElement.nodeType != 1 )
  {
    nextElement = nextElement.nextSibling;
  }
  if( nextElement )
  {
    this.insertBefore(node, nextElement);
  }
  else
  {
    this.appendChild(node);
  }
}

Element.prototype.getChildElements = function()
{
  var children = this.childNodes, ret = [], c = null, i=0;
  for( ; c = children[i]; i++)
  {
    if(c.nodeType == 1) 
    {
      ret[ret.length] = c;
    }
  }
  return ret;
}

Element.prototype.releaseEvent =  function(name)
{
  var event=document.createEvent('Events');
  event.initEvent(name, true, true);
  this.dispatchEvent(event);
}
/* currently broken in Opera */
Element.prototype.getWidth=function(e)
{
  var style = window.getComputedStyle(this, null);
  return this.offsetWidth 
    - parseInt(style['paddingLeft'])
    - parseInt(style['paddingRight'])
    - parseInt(style['borderLeftWidth'])
    - parseInt(style['borderRightWidth']);
}

Element.prototype.spliceInnerHTML = function(str)
{
  var
  temp = this.ownerDocument.createElement('div-parser'),
  range = this.ownerDocument.createRange();
  temp.innerHTML = str;
  if(this.nextSibling)
  {
    range.selectNodeContents(this.parentNode.insertBefore(temp, this.nextSibling));
  }
  else
  {
    range.selectNodeContents(this.parentNode.appendChild(temp));
  }
  this.parentNode.replaceChild(range.extractContents(), temp);
}

Element.prototype.getFirst = function(nodeName)
{
  return this.getElementsByTagName(nodeName)[0];
}

Element.prototype.getLast = function(nodeName)
{
  var all = this.getElementsByTagName(nodeName);
  return all[all.length - 1];
}

Element.prototype.getPreviousSameNamed = function(current)
{
  var 
  nodeName = current && current.nodeName;
  all = this.getElementsByTagName(nodeName), 
  cur = null, 
  i = 0;

  for( ; ( cur = all[i] ) && cur != current; i++);
  return cur && all[i-1] || null;
  
}

Element.prototype.getNextSameNamed = function(current)
{
  var 
  nodeName = current && current.nodeName;
  all = this.getElementsByTagName(nodeName), 
  cur = null, 
  i = 0;

  for( ; ( cur = all[i] ) && cur != current; i++);
  return cur && all[i+1] || null;
}

Element.prototype.getNextSameNamedSibling = function(target, next_name, next_type )
{
  var 
  next = this.nextSibling,
  name = this.nodeName;

  while( next && next.nodeName != name )
  {
    next = next.nextSibling;
  }
  
  return next;
}

Element.prototype.getPreviousSameNamedSibling = function(target, next_name, next_type )
{
  var 
  previous = this.previousSibling,
  name = this.nodeName;

  while( previous && previous.nodeName != name )
  {
    previous = previous.previousSibling;
  }
  
  return previous;
}

Element.prototype.getNextWithFilter = function(root_context, filter)
{
  var 
  ret = this.__getNextWithFilter(true, filter),
  parent = this.parentElement;

  if( !ret )
  {
    while(parent && root_context.contains(parent) && !root_context.isSameNode(parent) )
    {
      if( parent.nextElementSibling 
          && ( ret = parent.nextElementSibling.__getNextWithFilter(false, filter) ) )
      {
        break;
      }
      parent = parent.parentElement;
    }
  }
  return ret; 
}


Element.prototype.__getNextWithFilter = function(is_start_node, filter)
{
  var next = is_start_node ? this.nextElementSibling : this, ret = null, i = 0;

  while(next)
  {
    if( next.firstElementChild 
        && ( ret = next.firstElementChild.__getNextWithFilter(false, filter) ) )
    {
      break;
    }
    if( filter(next) )
    {
      break;
    }
    next = next.nextElementSibling;
  }
  return ret || next;
}

Element.prototype.getPreviousWithFilter = function(root_context, filter)
{
  var 
  ret = this.__getPreviousWithFilter(true, filter),
  parent = this.parentElement;

  if( !ret )
  {
    while(parent && root_context.contains(parent) && !root_context.isSameNode(parent) )
    {
      if( parent.previousElementSibling 
          && ( ret = parent.previousElementSibling.__getPreviousWithFilter(false, filter) ) )
      {
        break;
      }
      parent = parent.parentElement;
    }
  }
  return ret; 
}


Element.prototype.__getPreviousWithFilter = function(is_start_node, filter)
{
  var next = is_start_node ? this.previousElementSibling : this, ret = null, i = 0;

  while(next)
  {
    if( next.lastElementChild 
        && ( ret = next.lastElementChild.__getPreviousWithFilter(false, filter) ) )
    {
      break;
    }
    if( filter(next) )
    {
      break;
    }
    next = next.previousElementSibling;
  }
  return ret || next;
}



Element.prototype.scrollSoftIntoView = function()
{
  // just checking the first offsetParent to keep it simple
  var scrollContainer = this.offsetParent;
  var min_top = 20;
  if( scrollContainer && scrollContainer.offsetHeight < scrollContainer.scrollHeight )
  {
    if( this.offsetTop < scrollContainer.scrollTop + min_top )
    {
      scrollContainer.scrollTop = this.offsetTop - min_top;
    }
    else if( this.offsetTop + this.offsetHeight > scrollContainer.scrollTop + scrollContainer.offsetHeight - min_top )
    {
      scrollContainer.scrollTop = 
        this.offsetTop + this.offsetHeight - scrollContainer.offsetHeight + min_top;
    }
  }
}

Node.prototype.getNodeData=function(nodeName)
{
  var node=this.getElementsByTagName(nodeName)[0];
  if(node)
  {
    return node.textContent.replace(/</g, '&lt;');
  }
  return null;
}

Node.prototype.getAttributeFromNode=function(nodeName, attr)
{
  var node=this.getElementsByTagName(nodeName)[0];
  if(node)
  {
    return node.getAttribute(attr);
  }
  return null;
};

StyleSheetList.prototype.getPropertyValue = function(selector, property)
{
  var sheet = null, i = 0, j = 0, rules = null, rule = null;
  for( ; sheet = this[i]; i++ )
  {
    rules = sheet.cssRules;
    // does not take into account import rules
    for( j = 0; ( rule = rules[j] ) && !( rule.type == 1 && rule.selectorText == selector ); j++);
    if( rule )
    {
      return rule.style.getPropertyValue(property);
    }
  }
  return '';
};

(function(){
  if( !document.getElementsByClassName )
  {
    Document.prototype.getElementsByClassName=Element.prototype.getElementsByClassName=function()
    {
      var eles = this.getElementsByTagName("*"), 
        ele = null, ret =[], c_n = '', cursor = null, i = 0, j = 0;
      for( ; c_n = arguments[i]; i++) 
      {
        arguments[i] = new RegExp('(?:^| +)' + c_n + '(?: +|$)');
      }
      for (i=0; ele=eles[i]; i++)
      { 
        c_n = ele.className;
        for ( j=0; ( cursor = arguments[j] ) && cursor.test(c_n); j++);
        if( !cursor )
        {
          ret[ret.length] = ele;
        }
      }
      return ret;
    } 
  }
})();

