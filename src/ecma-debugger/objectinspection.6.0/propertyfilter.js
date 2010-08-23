/**
  * created with cls.EcmascriptDebugger["6.0"].InspectableJSObject.create_filter("js")
  * filters work the same way as the according scope filters:
  * if a property has the same type and optionally the same value
  * as the one in the filter, it will not be displayed.
  * documentation of the scope filters:
  *   http://dragonfly.opera.com/app/scope-interface/services/EcmascriptDebugger/EcmascriptDebugger_6_0.html#setpropertyfilter
  *
  * 1: // null
  * 2: // undefined
  * 3: // boolean
  * 4: // number
  * 5: // string
  * 6: // object
  */


window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});
cls.EcmascriptDebugger["6.0"].inspection_filters = {};

cls.EcmascriptDebugger["6.0"].inspection_filters._Element = new function()
{
  this.className = {type: "string", value: ""};
  this.dir = {type: "string", value: ""};
  this.firstChild = {type: "null"};
  this.firstElementChild = {type: "null"};
  this.id = {type: "string", value: ""};
  this.innerHTML = {type: "string", value: ""};
  this.innerText = {type: "string", value: ""};
  this.lang = {type: "string", value: ""};
  this.lastChild = {type: "null"};
  this.lastElementChild = {type: "null"};
  this.namespaceURI = {type: "null"};
  this.nextElementSibling = {type: "null"};
  this.nextSibling = {type: "null"};
  this.nodeValue = {type: "null"};
  this.offsetParent = {type: "null"};
  this.parentElement = {type: "null"};
  this.parentNode = {type: "null"};
  this.prefix = {type: "null"};
  this.previousElementSibling = {type: "null"};
  this.previousSibling = {type: "null"};
  this.textContent = {type: "string", value: ""};
  this.title = {type: "string", value: ""};
  this.unselectable = {type: "string", value: ""};
  this.onclick = {type: "null"};
  this.onmousedown = {type: "null"};
  this.onmouseup = {type: "null"};
  this.onmouseover = {type: "null"};
  this.onmousemove = {type: "null"};
  this.onmouseout = {type: "null"};
  this.onkeypress = {type: "null"};
  this.onkeydown = {type: "null"};
  this.onkeyup = {type: "null"};
  this.onload = {type: "null"};
  this.onunload = {type: "null"};
  this.onfocus = {type: "null"};
  this.onblur = {type: "null"};
  this.ondblclick = {type: "null"};
  this.oncontextmenu = {type: "null"};
  this.onloadstart = {type: "null"};
  this.onprogress = {type: "null"};
  this.onsuspend = {type: "null"};
  this.onstalled = {type: "null"};
  this.onloadend = {type: "null"};
  this.onemptied = {type: "null"};
  this.onplay = {type: "null"};
  this.onpause = {type: "null"};
  this.onloadedmetadata = {type: "null"};
  this.onloadeddata = {type: "null"};
  this.onwaiting = {type: "null"};
  this.onplaying = {type: "null"};
  this.onseeking = {type: "null"};
  this.onseeked = {type: "null"};
  this.ontimeupdate = {type: "null"};
  this.onended = {type: "null"};
  this.oncanplay = {type: "null"};
  this.oncanplaythrough = {type: "null"};
  this.onratechange = {type: "null"};
  this.ondurationchange = {type: "null"};
  this.onvolumechange = {type: "null"};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.Window = function()
{
  this.defaultStatus = {type: "string", value: ""};
  this.event = {type: "null"};
  this.frameElement = {type: "null"};
  this.name = {type: "string", value: ""};
  this.opener = {type: "null"};
  this.status = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLUnknownElement = function()
{
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLUnknownElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.XMLDocument = function()
{
  this.attributes = {type: "null"};
  this.baseURI = {type: "null"};
  this.cookie = {type: "string", value: ""};
  this.defaultView = {type: "null"};
  this.doctype = {type: "null"};
  this.documentURI = {type: "null"};
  this.localName = {type: "null"};
  this.location = {type: "null"};
  this.namespaceURI = {type: "null"};
  this.nextSibling = {type: "null"};
  this.nodeValue = {type: "null"};
  this.ownerDocument = {type: "null"};
  this.parentNode = {type: "null"};
  this.parentWindow = {type: "null"};
  this.prefix = {type: "null"};
  this.previousSibling = {type: "null"};
  this.referrer = {type: "string", value: ""};
  this.textContent = {type: "null"};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLDocument = function()
{
  this.alinkColor = {type: "string", value: ""};
  this.attributes = {type: "null"};
  this.baseURI = {type: "null"};
  this.bgColor = {type: "string", value: ""};
  this.cookie = {type: "string", value: ""};
  this.defaultView = {type: "null"};
  this.dir = {type: "string", value: ""};
  this.doctype = {type: "null"};
  this.documentURI = {type: "null"};
  this.domain = {type: "string", value: ""};
  this.fgColor = {type: "string", value: ""};
  this.linkColor = {type: "string", value: ""};
  this.localName = {type: "null"};
  this.location = {type: "null"};
  this.namespaceURI = {type: "null"};
  this.nextSibling = {type: "null"};
  this.nodeValue = {type: "null"};
  this.ownerDocument = {type: "null"};
  this.parentNode = {type: "null"};
  this.parentWindow = {type: "null"};
  this.prefix = {type: "null"};
  this.previousSibling = {type: "null"};
  this.referrer = {type: "string", value: ""};
  this.textContent = {type: "null"};
  this.title = {type: "string", value: ""};
  this.vlinkColor = {type: "string", value: ""};
  this.onload = {type: "null"};
  this.onunload = {type: "null"};
  this.onhashchange = {type: "null"};
  this.onstorage = {type: "null"};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.Attr = function()
{
  this.attributes = {type: "null"};
  this.firstChild = {type: "null"};
  this.lastChild = {type: "null"};
  this.localName = {type: "null"};
  this.namespaceURI = {type: "null"};
  this.nextSibling = {type: "null"};
  this.nodeValue = {type: "string", value: ""};
  this.ownerElement = {type: "null"};
  this.parentNode = {type: "null"};
  this.prefix = {type: "null"};
  this.previousSibling = {type: "null"};
  this.text = {type: "string", value: ""};
  this.textContent = {type: "string", value: ""};
  this.value = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.Text = function()
{
  this.attributes = {type: "null"};
  this.data = {type: "string", value: ""};
  this.firstChild = {type: "null"};
  this.lastChild = {type: "null"};
  this.localName = {type: "null"};
  this.namespaceURI = {type: "null"};
  this.nextSibling = {type: "null"};
  this.nodeValue = {type: "string", value: ""};
  this.parentNode = {type: "null"};
  this.prefix = {type: "null"};
  this.previousSibling = {type: "null"};
  this.textContent = {type: "string", value: ""};
  this.wholeText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.CDATASection = function()
{
  this.attributes = {type: "null"};
  this.data = {type: "string", value: ""};
  this.firstChild = {type: "null"};
  this.lastChild = {type: "null"};
  this.localName = {type: "null"};
  this.namespaceURI = {type: "null"};
  this.nextSibling = {type: "null"};
  this.nodeValue = {type: "string", value: ""};
  this.parentNode = {type: "null"};
  this.prefix = {type: "null"};
  this.previousSibling = {type: "null"};
  this.textContent = {type: "string", value: ""};
  this.wholeText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.Comment = function()
{
  this.attributes = {type: "null"};
  this.data = {type: "string", value: ""};
  this.firstChild = {type: "null"};
  this.lastChild = {type: "null"};
  this.localName = {type: "null"};
  this.namespaceURI = {type: "null"};
  this.nextSibling = {type: "null"};
  this.nodeValue = {type: "string", value: ""};
  this.parentNode = {type: "null"};
  this.prefix = {type: "null"};
  this.previousSibling = {type: "null"};
  this.textContent = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.DocumentFragment = function()
{
  this.attributes = {type: "null"};
  this.firstChild = {type: "null"};
  this.lastChild = {type: "null"};
  this.localName = {type: "null"};
  this.namespaceURI = {type: "null"};
  this.nextSibling = {type: "null"};
  this.nodeValue = {type: "null"};
  this.parentNode = {type: "null"};
  this.prefix = {type: "null"};
  this.previousSibling = {type: "null"};
  this.textContent = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.Event = function()
{
  this.currentTarget = {type: "null"};
  this.srcElement = {type: "null"};
  this.target = {type: "null"};
  this.type = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLHtmlElement = function()
{
  this.outerText = {type: "string", value: ""};
  this.version = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLHtmlElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLHeadElement = function()
{
  this.outerText = {type: "string", value: ""};
  this.profile = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLHeadElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLLinkElement = function()
{
  this.charset = {type: "string", value: ""};
  this.href = {type: "string", value: ""};
  this.hreflang = {type: "string", value: ""};
  this.media = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.rel = {type: "string", value: ""};
  this.rev = {type: "string", value: ""};
  this.target = {type: "string", value: ""};
  this.type = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLLinkElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTitleElement = function()
{
  this.outerText = {type: "string", value: ""};
  this.text = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTitleElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLMetaElement = function()
{
  this.content = {type: "string", value: ""};
  this.httpEquiv = {type: "string", value: ""};
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.scheme = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLMetaElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLBaseElement = function()
{
  this.href = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.target = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLBaseElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLStyleElement = function()
{
  this.media = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.type = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLStyleElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLBodyElement = function()
{
  this.aLink = {type: "string", value: ""};
  this.background = {type: "string", value: ""};
  this.bgColor = {type: "string", value: ""};
  this.link = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.text = {type: "string", value: ""};
  this.vLink = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLBodyElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLUnknownElement = function()
{
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLUnknownElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLInputElement = function()
{
  this.accept = {type: "string", value: ""};
  this.accessKey = {type: "string", value: ""};
  this.align = {type: "string", value: ""};
  this.alt = {type: "string", value: ""};
  this.autocomplete = {type: "string", value: ""};
  this.defaultValue = {type: "string", value: ""};
  this.form = {type: "null"};
  this.formAction = {type: "string", value: ""};
  this.formEnctype = {type: "string", value: ""};
  this.formMethod = {type: "string", value: ""};
  this.formTarget = {type: "string", value: ""};
  this.inputmode = {type: "string", value: ""};
  this.list = {type: "null"};
  this.max = {type: "string", value: ""};
  this.min = {type: "string", value: ""};
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.pattern = {type: "string", value: ""};
  this.selectedOption = {type: "null"};
  this.src = {type: "string", value: ""};
  this.step = {type: "string", value: ""};
  this.useMap = {type: "string", value: ""};
  this.validationMessage = {type: "string", value: ""};
  this.value = {type: "string", value: ""};
  this.valueAsDate = {type: "null"};
  this.onselect = {type: "null"};
  this.onchange = {type: "null"};
  this.onsubmit = {type: "null"};
  this.onreset = {type: "null"};
  this.oninput = {type: "null"};
  this.onforminput = {type: "null"};
  this.onformchange = {type: "null"};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLInputElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLIsIndexElement = function()
{
  this.form = {type: "null"};
  this.outerText = {type: "string", value: ""};
  this.prompt = {type: "string", value: ""};
  this.validationMessage = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLIsIndexElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLFormElement = function()
{
  this.acceptCharset = {type: "string", value: ""};
  this.action = {type: "string", value: ""};
  this.encoding = {type: "string", value: ""};
  this.enctype = {type: "string", value: ""};
  this.method = {type: "string", value: ""};
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.target = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLFormElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLSelectElement = function()
{
  this.accessKey = {type: "string", value: ""};
  this.autocomplete = {type: "string", value: ""};
  this.form = {type: "null"};
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.validationMessage = {type: "string", value: ""};
  this.value = {type: "string", value: ""};
  this.onselect = {type: "null"};
  this.onchange = {type: "null"};
  this.onsubmit = {type: "null"};
  this.onreset = {type: "null"};
  this.oninput = {type: "null"};
  this.onforminput = {type: "null"};
  this.onformchange = {type: "null"};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLSelectElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLOptGroupElement = function()
{
  this.label = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLOptGroupElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLOptionElement = function()
{
  this.form = {type: "null"};
  this.label = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.text = {type: "string", value: ""};
  this.validationMessage = {type: "string", value: ""};
  this.value = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLOptionElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTextAreaElement = function()
{
  this.accessKey = {type: "string", value: ""};
  this.defaultValue = {type: "string", value: ""};
  this.form = {type: "null"};
  this.inputmode = {type: "string", value: ""};
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.pattern = {type: "string", value: ""};
  this.validationMessage = {type: "string", value: ""};
  this.value = {type: "string", value: ""};
  this.wrap = {type: "string", value: ""};
  this.onselect = {type: "null"};
  this.onchange = {type: "null"};
  this.onsubmit = {type: "null"};
  this.onreset = {type: "null"};
  this.oninput = {type: "null"};
  this.onforminput = {type: "null"};
  this.onformchange = {type: "null"};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTextAreaElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLButtonElement = function()
{
  this.accessKey = {type: "string", value: ""};
  this.form = {type: "null"};
  this.formAction = {type: "string", value: ""};
  this.formEnctype = {type: "string", value: ""};
  this.formMethod = {type: "string", value: ""};
  this.formTarget = {type: "string", value: ""};
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.validationMessage = {type: "string", value: ""};
  this.value = {type: "string", value: ""};
  this.onselect = {type: "null"};
  this.onchange = {type: "null"};
  this.onsubmit = {type: "null"};
  this.onreset = {type: "null"};
  this.oninput = {type: "null"};
  this.onforminput = {type: "null"};
  this.onformchange = {type: "null"};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLButtonElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLLabelElement = function()
{
  this.accessKey = {type: "string", value: ""};
  this.control = {type: "null"};
  this.form = {type: "null"};
  this.htmlFor = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.validationMessage = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLLabelElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLFieldSetElement = function()
{
  this.form = {type: "null"};
  this.outerText = {type: "string", value: ""};
  this.validationMessage = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLFieldSetElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLLegendElement = function()
{
  this.accessKey = {type: "string", value: ""};
  this.align = {type: "string", value: ""};
  this.form = {type: "null"};
  this.outerText = {type: "string", value: ""};
  this.validationMessage = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLLegendElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLUListElement = function()
{
  this.outerText = {type: "string", value: ""};
  this.type = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLUListElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLOListElement = function()
{
  this.outerText = {type: "string", value: ""};
  this.type = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLOListElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLDListElement = function()
{
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLDListElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLDirectoryElement = function()
{
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLDirectoryElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLMenuElement = function()
{
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLMenuElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLLIElement = function()
{
  this.outerText = {type: "string", value: ""};
  this.type = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLLIElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLDivElement = function()
{
  this.align = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLDivElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLParagraphElement = function()
{
  this.align = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLParagraphElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLHeadingElement = function()
{
  this.align = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLHeadingElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLQuoteElement = function()
{
  this.cite = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLQuoteElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLQuoteElement = function()
{
  this.cite = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLQuoteElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLPreElement = function()
{
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLPreElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLBRElement = function()
{
  this.clear = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLBRElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLBaseFontElement = function()
{
  this.color = {type: "string", value: ""};
  this.face = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.size = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLBaseFontElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLFontElement = function()
{
  this.color = {type: "string", value: ""};
  this.face = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.size = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLFontElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLModElement = function()
{
  this.cite = {type: "string", value: ""};
  this.dateTime = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLModElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLAnchorElement = function()
{
  this.accessKey = {type: "string", value: ""};
  this.charset = {type: "string", value: ""};
  this.coords = {type: "string", value: ""};
  this.href = {type: "string", value: ""};
  this.hreflang = {type: "string", value: ""};
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.rel = {type: "string", value: ""};
  this.rev = {type: "string", value: ""};
  this.shape = {type: "string", value: ""};
  this.target = {type: "string", value: ""};
  this.text = {type: "string", value: ""};
  this.type = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLAnchorElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLImageElement = function()
{
  this.align = {type: "string", value: ""};
  this.alt = {type: "string", value: ""};
  this.border = {type: "string", value: ""};
  this.longDesc = {type: "string", value: ""};
  this.lowsrc = {type: "string", value: ""};
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.src = {type: "string", value: ""};
  this.useMap = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLImageElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLObjectElement = function()
{
  this.align = {type: "string", value: ""};
  this.archive = {type: "string", value: ""};
  this.border = {type: "string", value: ""};
  this.classId = {type: "string", value: ""};
  this.className = {type: "string", value: ""};
  this.code = {type: "string", value: ""};
  this.codeBase = {type: "string", value: ""};
  this.codeType = {type: "string", value: ""};
  this.contentDocument = {type: "null"};
  this.contentWindow = {type: "null"};
  this.data = {type: "string", value: ""};
  this.dir = {type: "string", value: ""};
  this.firstChild = {type: "null"};
  this.firstElementChild = {type: "null"};
  this.form = {type: "null"};
  this.height = {type: "string", value: ""};
  this.id = {type: "string", value: ""};
  this.innerHTML = {type: "string", value: ""};
  this.innerText = {type: "string", value: ""};
  this.lang = {type: "string", value: ""};
  this.lastChild = {type: "null"};
  this.lastElementChild = {type: "null"};
  this.name = {type: "string", value: ""};
  this.namespaceURI = {type: "null"};
  this.nextElementSibling = {type: "null"};
  this.nextSibling = {type: "null"};
  this.nodeValue = {type: "null"};
  this.offsetParent = {type: "null"};
  this.outerText = {type: "string", value: ""};
  this.parentElement = {type: "null"};
  this.parentNode = {type: "null"};
  this.prefix = {type: "null"};
  this.previousElementSibling = {type: "null"};
  this.previousSibling = {type: "null"};
  this.standby = {type: "string", value: ""};
  this.textContent = {type: "string", value: ""};
  this.title = {type: "string", value: ""};
  this.type = {type: "string", value: ""};
  this.unselectable = {type: "string", value: ""};
  this.useMap = {type: "string", value: ""};
  this.width = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLParamElement = function()
{
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.type = {type: "string", value: ""};
  this.value = {type: "string", value: ""};
  this.valueType = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLParamElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLAppletElement = function()
{
  this.align = {type: "string", value: ""};
  this.alt = {type: "string", value: ""};
  this.archive = {type: "string", value: ""};
  this.className = {type: "string", value: ""};
  this.code = {type: "string", value: ""};
  this.codeBase = {type: "string", value: ""};
  this.dir = {type: "string", value: ""};
  this.firstChild = {type: "null"};
  this.firstElementChild = {type: "null"};
  this.height = {type: "string", value: ""};
  this.id = {type: "string", value: ""};
  this.innerHTML = {type: "string", value: ""};
  this.innerText = {type: "string", value: ""};
  this.lang = {type: "string", value: ""};
  this.lastChild = {type: "null"};
  this.lastElementChild = {type: "null"};
  this.name = {type: "string", value: ""};
  this.namespaceURI = {type: "null"};
  this.nextElementSibling = {type: "null"};
  this.nextSibling = {type: "null"};
  this.nodeValue = {type: "null"};
  this.object = {type: "string", value: ""};
  this.offsetParent = {type: "null"};
  this.outerText = {type: "string", value: ""};
  this.parentElement = {type: "null"};
  this.parentNode = {type: "null"};
  this.prefix = {type: "null"};
  this.previousElementSibling = {type: "null"};
  this.previousSibling = {type: "null"};
  this.textContent = {type: "string", value: ""};
  this.title = {type: "string", value: ""};
  this.unselectable = {type: "string", value: ""};
  this.width = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLMapElement = function()
{
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLMapElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLAreaElement = function()
{
  this.accessKey = {type: "string", value: ""};
  this.alt = {type: "string", value: ""};
  this.coords = {type: "string", value: ""};
  this.href = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.shape = {type: "string", value: ""};
  this.target = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLAreaElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLScriptElement = function()
{
  this.charset = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.src = {type: "string", value: ""};
  this.text = {type: "string", value: ""};
  this.type = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLScriptElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableElement = function()
{
  this.align = {type: "string", value: ""};
  this.bgColor = {type: "string", value: ""};
  this.border = {type: "string", value: ""};
  this.caption = {type: "null"};
  this.cellPadding = {type: "string", value: ""};
  this.cellSpacing = {type: "string", value: ""};
  this.frame = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.rules = {type: "string", value: ""};
  this.summary = {type: "string", value: ""};
  this.tFoot = {type: "null"};
  this.tHead = {type: "null"};
  this.width = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableCaptionElement = function()
{
  this.align = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableCaptionElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableColElement = function()
{
  this.align = {type: "string", value: ""};
  this.ch = {type: "string", value: ""};
  this.chOff = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.vAlign = {type: "string", value: ""};
  this.width = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableColElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableSectionElement = function()
{
  this.align = {type: "string", value: ""};
  this.ch = {type: "string", value: ""};
  this.chOff = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.vAlign = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableSectionElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableSectionElement = function()
{
  this.align = {type: "string", value: ""};
  this.ch = {type: "string", value: ""};
  this.chOff = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.vAlign = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableSectionElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableRowElement = function()
{
  this.align = {type: "string", value: ""};
  this.bgColor = {type: "string", value: ""};
  this.ch = {type: "string", value: ""};
  this.chOff = {type: "string", value: ""};
  this.height = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.vAlign = {type: "string", value: ""};
  this.width = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableRowElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableCellElement = function()
{
  this.abbr = {type: "string", value: ""};
  this.align = {type: "string", value: ""};
  this.axis = {type: "string", value: ""};
  this.bgColor = {type: "string", value: ""};
  this.ch = {type: "string", value: ""};
  this.chOff = {type: "string", value: ""};
  this.headers = {type: "string", value: ""};
  this.height = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.scope = {type: "string", value: ""};
  this.vAlign = {type: "string", value: ""};
  this.width = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLTableCellElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLFrameSetElement = function()
{
  this.cols = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.rows = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLFrameSetElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLFrameElement = function()
{
  this.contentDocument = {type: "null"};
  this.contentWindow = {type: "null"};
  this.frameBorder = {type: "string", value: ""};
  this.longDesc = {type: "string", value: ""};
  this.marginHeight = {type: "string", value: ""};
  this.marginWidth = {type: "string", value: ""};
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.scrolling = {type: "string", value: ""};
  this.src = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLFrameElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLIFrameElement = function()
{
  this.align = {type: "string", value: ""};
  this.contentDocument = {type: "null"};
  this.contentWindow = {type: "null"};
  this.frameBorder = {type: "string", value: ""};
  this.height = {type: "string", value: ""};
  this.longDesc = {type: "string", value: ""};
  this.marginHeight = {type: "string", value: ""};
  this.marginWidth = {type: "string", value: ""};
  this.name = {type: "string", value: ""};
  this.outerText = {type: "string", value: ""};
  this.scrolling = {type: "string", value: ""};
  this.src = {type: "string", value: ""};
  this.width = {type: "string", value: ""};
};

cls.EcmascriptDebugger["6.0"].inspection_filters.HTMLIFrameElement.prototype = 
    cls.EcmascriptDebugger["6.0"].inspection_filters._Element;
