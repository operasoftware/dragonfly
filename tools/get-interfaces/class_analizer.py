import test_server, sys, os

"""
script to retrieve and analize javascript objects
starts a server ( test_server.py ) and loads one test after the other
it writes the results to "js_object_filters.js"
with -i flag it writes a list with all interfaces to "interfaces.txt"
"""

# for abstract interfaces
inheritances = \
{
    "HTMLElement": "Element",
    "Document": "Node",
    "CharacterData": "Node"
}

# list of tests with: test name, mime type, test object, super class, list of additional properties ( optional ) 
def raw_tests():
    return (
    [
        ['window', 'HTML', 'this', "", WINDOW_PROPERTIES],
        ['element', 'XML', "document.createElement('test')", "Node"],
        ['xml-document', 'HTML', "document.implementation.createDocument('', 'test', null)", "Document"],
        ['html-document', 'HTML', "document.implementation.createHTMLDocument('')", "Document"],
        ['createAttribute', 'HTML', "document.createAttribute('foo')", "Node"],
        ['text', 'HTML', "document.createTextNode('')", "CharacterData"],
        ['cdata', 'HTML', "document.createCDATASection('')", "Text"],
        ['comment', 'HTML', "document.createComment('')", "CharacterData"],
        ['document-fragment', 'HTML', "document.createDocumentFragment()", "Node"],
        ['node-list', 'HTML', "document.createElement('div').getElementsByTagName('*')", ""],
        ['named-node-map', 'HTML', "document.createElement('div').attributes", ""],
        ['event', 'HTML', "document.createEvent('Events')", ""],
        ['html', 'HTML', "document.createElement('html')", "HTMLElement"],
        ['head', 'HTML', "document.createElement('head')", "HTMLElement"],
        ['link', 'HTML', "document.createElement('link')", "HTMLElement"],
        ['title', 'HTML', "document.createElement('title')", "HTMLElement"],
        ['meta', 'HTML', "document.createElement('meta')", "HTMLElement"],
        ['base', 'HTML', "document.createElement('base')", "HTMLElement"],
        ['style', 'HTML', "document.createElement('style')", "HTMLElement"],
        ['body', 'HTML', "document.createElement('body')", "HTMLElement"],
        ['unknown', 'HTML', "document.createElement('foo')", "HTMLElement"],
        ['input', 'HTML', "document.createElement('input')", "HTMLElement"],
        ['isindex', 'HTML', "document.createElement('isindex')", "HTMLElement"],
        ['form', 'HTML', "document.createElement('form')", "HTMLElement"],
        ['select', 'HTML', "document.createElement('select')", "HTMLElement"],
        ['optgroup', 'HTML', "document.createElement('optgroup')", "HTMLElement"],
        ['option', 'HTML', "document.createElement('option')", "HTMLElement"],
        ['textarea', 'HTML', "document.createElement('textarea')", "HTMLElement"],
        ['button', 'HTML', "document.createElement('button')", "HTMLElement"],
        ['label', 'HTML', "document.createElement('label')", "HTMLElement"],
        ['fieldset', 'HTML', "document.createElement('fieldset')", "HTMLElement"],
        ['legend', 'HTML', "document.createElement('legend')", "HTMLElement"],
        ['ul', 'HTML', "document.createElement('ul')", "HTMLElement"],
        ['ol', 'HTML', "document.createElement('ol')", "HTMLElement"],
        ['dl', 'HTML', "document.createElement('dl')", "HTMLElement"],
        ['dir', 'HTML', "document.createElement('dir')", "HTMLElement"],
        ['menu', 'HTML', "document.createElement('menu')", "HTMLElement"],
        ['li', 'HTML', "document.createElement('li')", "HTMLElement"],
        ['div', 'HTML', "document.createElement('div')", "HTMLElement"],
        ['p', 'HTML', "document.createElement('p')", "HTMLElement"],
        ['h1', 'HTML', "document.createElement('h1')", "HTMLElement"],
        ['q', 'HTML', "document.createElement('q')", "HTMLElement"],
        ['blockquote', 'HTML', "document.createElement('blockquote')", "HTMLElement"],
        ['pre', 'HTML', "document.createElement('pre')", "HTMLElement"],
        ['br', 'HTML', "document.createElement('br')", "HTMLElement"],
        ['basefont', 'HTML', "document.createElement('basefont')", "HTMLElement"],
        ['font', 'HTML', "document.createElement('font')", "HTMLElement"],
        ['ins', 'HTML', "document.createElement('ins')", "HTMLElement"],
        ['a', 'HTML', "document.createElement('a')", "HTMLElement"],
        ['image', 'HTML', "document.createElement('image')", "HTMLElement"],
        ['object', 'HTML', "document.createElement('object')", "HTMLElement"],
        ['param', 'HTML', "document.createElement('param')", "HTMLElement"],
        ['applet', 'HTML', "document.createElement('applet')", "HTMLElement"],
        ['map', 'HTML', "document.createElement('map')", "HTMLElement"],
        ['area', 'HTML', "document.createElement('area')", "HTMLElement"],
        ['script', 'HTML', "document.createElement('script')", "HTMLElement"],
        ['table', 'HTML', "document.createElement('table')", "HTMLElement"],
        ['caption', 'HTML', "document.createElement('caption')", "HTMLElement"],
        ['col', 'HTML', "document.createElement('col')", "HTMLElement"],
        ['thead', 'HTML', "document.createElement('thead')", "HTMLElement"],
        ['tbody', 'HTML', "document.createElement('tbody')", "HTMLElement"],
        ['tr', 'HTML', "document.createElement('tr')", "HTMLElement"],
        ['td', 'HTML', "document.createElement('td')", "HTMLElement"],
        ['frameset', 'HTML', "document.createElement('frameset')", "HTMLElement"],
        ['frame', 'HTML', "document.createElement('frame')", "HTMLElement"],
        ['iframe', 'HTML', "document.createElement('iframe')", "HTMLElement"],
    ]
    )

MIME = \
{
    'HTML': 'text/html',
    'XML': 'application/xml'
}

f = open("get-interface.js", "rb")
JS_ONLOAD = f.read()
f.close()

TEMPLATES = \
{
    "HTML": \
        """
        <!doctype html>
        <html>
        <head>
        <title> </title>
        <style>
        </style>
        <script>
        addEventListener('load', %s, false)
        </script>
        </head>
        <body>
        </body>
        </html>
        """ % JS_ONLOAD,
    "XML": \
        """
        <r>
        <script xmlns="http://www.w3.org/1999/xhtml"><![CDATA[
        addEventListener('load', %s, false)
        ]]></script>
        <t/>
        </r>
        """ % JS_ONLOAD
}

WINDOW_PROPERTIES = """[
    'Array',
    'Attr',
    'Audio',
    'Boolean',
    'CDATASection',
    'CSSMediaRule',
    'CSSPrimitiveValue',
    'CSSRule',
    'CSSRuleList',
    'CSSStyleDeclaration',
    'CSSStyleSheet',
    'CanvasGradient',
    'CanvasPattern',
    'CanvasRenderingContext2D',
    'CanvasRenderingContext2DGame',
    'CanvasRenderingContext3D',
    'Comment',
    'DOMError',
    'DOMException',
    'DOMImplementationLS',
    'DOMParser',
    'Date',
    'Document',
    'DocumentFragment',
    'DocumentType',
    'Element',
    'Entity',
    'EntityReference',
    'Error',
    'EvalError',
    'Event',
    'Function',
    'HTMLAnchorElement',
    'HTMLAppletElement',
    'HTMLAreaElement',
    'HTMLBRElement',
    'HTMLBaseElement',
    'HTMLBaseFontElement',
    'HTMLBodyElement',
    'HTMLButtonElement',
    'HTMLCanvasElement',
    'HTMLCollection',
    'HTMLDListElement',
    'HTMLDataListElement',
    'HTMLDirectoryElement',
    'HTMLDivElement',
    'HTMLDocument',
    'HTMLElement',
    'HTMLEmbedElement',
    'HTMLFieldSetElement',
    'HTMLFontElement',
    'HTMLFormElement',
    'HTMLFrameElement',
    'HTMLFrameSetElement',
    'HTMLHRElement',
    'HTMLHeadElement',
    'HTMLHeadingElement',
    'HTMLHtmlElement',
    'HTMLIFrameElement',
    'HTMLImageElement',
    'HTMLInputElement',
    'HTMLIsIndexElement',
    'HTMLLIElement',
    'HTMLLabelElement',
    'HTMLLegendElement',
    'HTMLLinkElement',
    'HTMLMapElement',
    'HTMLMarqueeElement',
    'HTMLMenuElement',
    'HTMLMetaElement',
    'HTMLModElement',
    'HTMLOListElement',
    'HTMLObjectElement',
    'HTMLOptGroupElement',
    'HTMLOptionElement',
    'HTMLOptionsCollection',
    'HTMLOutputElement',
    'HTMLParagraphElement',
    'HTMLParamElement',
    'HTMLPreElement',
    'HTMLQuoteElement',
    'HTMLScriptElement',
    'HTMLSelectElement',
    'HTMLStyleElement',
    'HTMLTableCaptionElement',
    'HTMLTableCellElement',
    'HTMLTableColElement',
    'HTMLTableElement',
    'HTMLTableRowElement',
    'HTMLTableSectionElement',
    'HTMLTextAreaElement',
    'HTMLTitleElement',
    'HTMLUListElement',
    'HTMLUnknownElement',
    'Image',
    'ImageData',
    'Infinity',
    'LSException',
    'LSParser',
    'LSParserFilter',
    'Math',
    'MediaList',
    'MemoryError',
    'MutationEvent',
    'NaN',
    'NamedNodeMap',
    'Node',
    'NodeFilter',
    'NodeList',
    'Notation',
    'Number',
    'Object',
    'Option',
    'Packages',
    'ProcessingInstruction',
    'RGBColor',
    'Range',
    'RangeError',
    'RangeException',
    'ReferenceError',
    'RegExp',
    'RepetitionElement',
    'RepetitionEvent',
    'SVGAElement',
    'SVGAngle',
    'SVGAnimateColorElement',
    'SVGAnimateElement',
    'SVGAnimateMotionElement',
    'SVGAnimateTransformElement',
    'SVGAnimationElement',
    'SVGAudioElement',
    'SVGCircleElement',
    'SVGClipPathElement',
    'SVGDefsElement',
    'SVGDescElement',
    'SVGDocument',
    'SVGEllipseElement',
    'SVGException',
    'SVGFEBlendElement',
    'SVGFEColorMatrixElement',
    'SVGFEComponentTransferElement',
    'SVGFECompositeElement',
    'SVGFEConvolveMatrixElement',
    'SVGFEDiffuseLightingElement',
    'SVGFEDisplacementMapElement',
    'SVGFEDistantLightElement',
    'SVGFEFloodElement',
    'SVGFEFuncAElement',
    'SVGFEFuncBElement',
    'SVGFEFuncGElement',
    'SVGFEFuncRElement',
    'SVGFEGaussianBlurElement',
    'SVGFEImageElement',
    'SVGFEMergeElement',
    'SVGFEMergeNodeElement',
    'SVGFEMorphologyElement',
    'SVGFEOffsetElement',
    'SVGFEPointLightElement',
    'SVGFESpecularLightingElement',
    'SVGFESpotLightElement',
    'SVGFETileElement',
    'SVGFETurbulenceElement',
    'SVGFilterElement',
    'SVGFontElement',
    'SVGForeignObjectElement',
    'SVGGElement',
    'SVGGlyphElement',
    'SVGImageElement',
    'SVGLength',
    'SVGLineElement',
    'SVGLinearGradientElement',
    'SVGMPathElement',
    'SVGMarkerElement',
    'SVGMaskElement',
    'SVGMatrix',
    'SVGMissingGlyphElement',
    'SVGNumber',
    'SVGPaint',
    'SVGPathElement',
    'SVGPathSeg',
    'SVGPatternElement',
    'SVGPoint',
    'SVGPolygonElement',
    'SVGPolylineElement',
    'SVGPreserveAspectRatio',
    'SVGRGBColor',
    'SVGRadialGradientElement',
    'SVGRect',
    'SVGRectElement',
    'SVGSVGElement',
    'SVGScriptElement',
    'SVGSetElement',
    'SVGStopElement',
    'SVGStyleElement',
    'SVGSwitchElement',
    'SVGSymbolElement',
    'SVGTRefElement',
    'SVGTSpanElement',
    'SVGTextAreaElement',
    'SVGTextContentElement',
    'SVGTextElement',
    'SVGTextPathElement',
    'SVGTitleElement',
    'SVGTransform',
    'SVGUnitTypes',
    'SVGUseElement',
    'SVGVideoElement',
    'SVGViewElement',
    'SVGZoomAndPan',
    'String',
    'StyleSheetList',
    'SyntaxError',
    'Text',
    'TypeError',
    'URIError',
    'XMLDocument',
    'XMLHttpRequest',
    'XMLSerializer',
    'XPathEvaluator',
    'XPathException',
    'XPathExpression',
    'XPathNSResolver',
    'XPathNamespace',
    'XPathResult',
    'XSLTProcessor',
    '__Opera_Internal_OHVBS',
    'addEventListener',
    'addEventStream',
    'alert',
    'attachEvent',
    'back',
    'captureEvents',
    'clearInterval',
    'clearTimeout',
    'closed',
    'confirm',
    'decodeURI',
    'decodeURIComponent',
    'defaultStatus',
    'detachEvent',
    'dispatchEvent',
    'document',
    'encodeURI',
    'encodeURIComponent',
    'escape',
    'eval',
    'event',
    'forward',
    'frameElement',
    'frames',
    'getComputedStyle',
    'getSelection',
    'history',
    'innerHeight',
    'innerWidth',
    'isFinite',
    'isNaN',
    'java',
    'length',
    'location',
    'name',
    'navigate',
    'navigator',
    'netscape',
    'open',
    'opener',
    'opera',
    'outerHeight',
    'outerWidth',
    'pageXOffset',
    'pageYOffset',
    'parent',
    'parseFloat',
    'parseInt',
    'print',
    'prompt',
    'releaseEvents',
    'removeEventListener',
    'removeEventStream',
    'screen',
    'screenLeft',
    'screenTop',
    'screenX',
    'screenY',
    'self',
    'setDocument',
    'setInterval',
    'setTimeout',
    'status',
    'stop',
    'sun',
    'top',
    'undefined',
    'unescape',
    'window',
    /* added in core 2.2 */
    'ByteArray',
    'CanvasRenderingContext3D',
    'ClientRect',
    'ClientRectList',
    'SVGPath',
]"""


def tests():
    for t in raw_tests():
        test = {'name': t[0], 'test': TEMPLATES[t[1]] % (t[2], t[3], len(t) > 4 and t[4] or 'null' ), 'mime': MIME[t[1]] }
        yield test

def print_result(result):
    ret = []
    if result["interface"]:
        try:
            ret.append("dom_interfaces." + result["interface"] + " = function()\n{\n")
            result['properties'].sort(key = lambda s: s[0])
            for name, value in result['properties']:
                ret.append( "  this." + name + " = \"" + value +"\";\n" )
            ret.append("}\n")
            if "inherits-from" in result:
                ret.append("dom_interfaces." + result["interface"] + ".prototype = " + \
                                "js_object_filters." + result["inherits-from"] + ";\n")
            ret.append("js_object_filters." + result["interface"] + " = " + \
                            "new dom_interfaces." + result["interface"] + "();\n\n") 
        except Exception, msg:
            print msg
    else:
        print 'result["interface"] is not defined'
    return "".join(ret)
        
interfaces = {}

depths = {}

def get_inheritance_depth(interface):
    count = 0
    i = interface
    while i in interfaces and "inherits-from" in interfaces[i]:
        i = interfaces[i]["inherits-from"]
        count += 1
    return count

def set_keys(interface):
    ret = set()
    default_values = ['null', '-1']
    if "sub-classes" in interface:
        for sub_class_name in interface["sub-classes"]:
            sub_class = interfaces[sub_class_name]
            if not len(ret):
                ret = set(sub_class["props-dict"].keys())
            else:
                ret = ret & set(sub_class["props-dict"].keys())
        interface["properties"] = []
        interface["props-dict"] = {}
        for prop in ret:
            value = "not-set"
            for sub_class_name in interface["sub-classes"]:
                if value == "not-set":
                    value = interfaces[sub_class_name]["props-dict"][prop]
                elif not value == interfaces[sub_class_name]["props-dict"][prop]:
                    value = value in default_values and value \
                            or interfaces[sub_class_name]["props-dict"][prop] in default_values and  interfaces[sub_class_name]["props-dict"][prop] \
                            or ""
                    break
            interface["properties"].append((prop, value))
            interface["props-dict"][prop] = value

def evaluate(results):
    UA = results.pop('UA')
    results_evaled = {}
    for r in results:
        try:
            result = eval(results[r])
            results_evaled[r] = result
            # interface, properties, inherits-from
            if result['interface'] in interfaces:
                print "interface already set: ", result['interface']
            else:
                interfaces[result['interface']] = result
                if "inherits-from" in result and not result["inherits-from"] in interfaces:
                    super = interfaces[result["inherits-from"]] = {}
                    super["interface"] = result["inherits-from"]
                    super["properties"] = []
                    if super["interface"] in inheritances:
                        super["inherits-from"] = inheritances[super["interface"]]
                result["props-dict"] = dict(result["properties"])
        except Exception, msg:
            print "eval failed", msg, r, results[r]

    for i in interfaces: 
        depth = interfaces[i]["inheritance-depth"] = get_inheritance_depth(i)
        if "inherits-from" in interfaces[i]:
            super = interfaces[interfaces[i]["inherits-from"]]
            if not "sub-classes" in super:
                super["sub-classes"] = []
            super["sub-classes"].append(i)

        if not depth in depths:
            depths[depth] = []
        depths[depth].append(i)

    temp = [{'k': key, 'v': depths[key]} for key in depths]
    temp.sort( key = lambda d: d['k'] )
    sorted = [d['v'] for d in temp[::-1]]
     
    for supers in sorted[1:]:
        for super in supers:
            if "sub-classes" in interfaces[super]:
                set_keys(interfaces[super])
            else:
                print super, "has no sub classes"
                
    interfaces_sorted = [ interfaces[i] for i in interfaces]
    interfaces_sorted.sort( key = lambda d: d["inheritance-depth"] )
    for interface in interfaces_sorted:
        cur = interface
        ret = set(cur["properties"])
        while "inherits-from" in cur:
            cur = interfaces[cur["inherits-from"]]
            ret = ret - set(cur["properties"])
        interface["properties"] = [prop for prop in ret]
        
             
    if '-i' in sys.argv:
        f = open('interfaces.txt', 'wb')
        f.write("/*\nfilters extracted from: " + UA.replace("\r", "") + "\n*/\n\n")
        for interface in interfaces_sorted:
            f.write(interface["interface"] + '\n')
        f.close()

    else:
        f = open(os.path.join('js_object_filters.js'), 'wb')
        f.write("/*\nfilters extracted from: " + UA.replace("\r", "") + "\n*/\n\n")
        f.write("window.js_object_filters || ( window.js_object_filters = {} )\n")
        f.write("window.dom_interfaces || ( window.dom_interfaces = {} )\n\n")
        for interface in interfaces_sorted:
            f.write(print_result(interface))
        f.close()

test_server.run_tests(evaluate, tests())