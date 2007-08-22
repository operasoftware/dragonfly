
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

Element.prototype.___add_inner = function()
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
          content += arg;
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

Element.prototype.renderInner = function(template)
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

Element.prototype.insertAfter = function(node)
{
  var nextElement = this.getNextSiblingElement();
  if( nextElement )
  {
    nextElement.parentElement.insertBefore(node, nextElement);
  }
  else
  {
    this.parentElement.appendChild(node);
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

Node.prototype.getNodeData=function(nodeName)
{
  var node=this.getElementsByTagName(nodeName)[0];
  if(node)
  {
    return node.textContent;
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
}

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
