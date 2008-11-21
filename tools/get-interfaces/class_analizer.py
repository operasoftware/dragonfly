import test_server, sys, os

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



raw_tests = \
[
    #[<test-name>, <mime>, <test-object>, <test-object inherits from>]
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

def tests():
    for t in raw_tests:
        test = {'name': t[0], 'test': TEMPLATES[t[1]] % (t[2], t[3]), 'mime': MIME[t[1]] }
        yield test

def print_result(result):
    ret = []
    try:
        ret.append("// depth: %s\n" % result["inheritance-depth"] )
        if "inherits-from" in result:
            ret.append("// inherits from: "+ result["inherits-from"] + "\n") 
        ret.append("filters." + result["interface"] + " =\n{\n")
        is_first = True
        result['properties'].sort(key = lambda s: s[0])
        for name, value in result['properties']:
            try:
              if not ( value.isdigit() or value in ['true', 'false', 'null', 'undefined'] ):
                  value = "\"" + value + "\""
            except:
              print value
            ret.append( ( is_first and "  " or ",\n  " ) + name + ": " + value )
            is_first = False
        ret.append("\n}\n\n")
    except Exception, msg:
        print msg
    return "".join(ret)
        
def store_result(name, result, UA):
    f = open(os.path.join('test-results', name + '.js'), 'wb')
    f.write("/*\nfilters extracted from: " + UA.replace("\r", "") + "\n*/\n\n")
    f.write(print_result(result))
    f.close()

inheritances = \
{
    "HTMLElement": "Element",
    "Document": "Node",
    "CharacterData": "Node"
}

interfaces = {}

depths = {}


def evaluate(results):
    pass

# error_log = open('error', 'wb')

def get_inheritance_depth(interface):
    count = 0
    i = interface
    #error_log.write(str(interfaces[i])) 
    while i in interfaces and "inherits-from" in interfaces[i]:
        i = interfaces[i]["inherits-from"]
        count += 1
    return count

def set_common_keys(interface):
    ret = set()
    if "sub-classes" in interface:
        for sub_class_name in interface["sub-classes"]:
            sub_class = interfaces[sub_class_name]
            if not len(ret):
                ret = set(sub_class["properties-keys"])
            else:
                ret = ret & set(sub_class["properties-keys"])
        interface["properties-keys"] =[key for key in ret]
        interface["properties"] = []
        interface["props"] = {}
        for prop in interface["properties-keys"]:
            value = "not-set"
            for sub_class_name in interface["sub-classes"]:
                if value == "not-set":
                    value = interfaces[sub_class_name]["props"][prop]
                elif not value == interfaces[sub_class_name]["props"][prop]:
                    value = ( value == 'null' or interfaces[sub_class_name]["props"][prop] == 'null' ) and 'null' or ""
                    break
            interface["properties"].append((prop, value))
            interface["props"][prop] = value

            

    
            

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
                """
                if "inherits-from" in result:
                    print r, 'inherits-from: ', result['inherits-from']
                """
                if "inherits-from" in result and not result["inherits-from"] in interfaces:
                    super = interfaces[result["inherits-from"]] = {}
                    super["interface"] = result["inherits-from"]
                    super["properties"] = []
                    if super["interface"] in inheritances:
                        super["inherits-from"] = inheritances[super["interface"]]
                result["properties-keys"] = [prop[0] for prop in result["properties"]]
                result["props"] = {}
                for prop in result["properties"]:
                    result["props"][prop[0]] = prop[1]
         
            


        except Exception, msg:
            print "eval failed", r, msg
            # error_log.write(results[r])

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
                set_common_keys(interfaces[super])
                # print super, interfaces[super]["properties"]
                #print super, interfaces[super]["sub-classes"]
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
        
            
                
            
    """
    check
    for supers in sorted:
        for super in supers:
            if "sub-classes" in interfaces[super]:
                print super, interfaces[super]["sub-classes"]
            else:
                print super, "has no sub classes"
    """
    f = open(os.path.join('filter.js'), 'wb')
    f.write("/*\nfilters extracted from: " + UA.replace("\r", "") + "\n*/\n\n")
    

    for interface in interfaces_sorted:
        f.write(print_result(interface))
        
    f.close()

    # error_log.write(str(interfaces))
    # error_log.close()       
    # var = raw_input("Press enter")



test_server.run_tests(evaluate, tests())