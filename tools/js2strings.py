import re
import sys

tpl="""%(label)s=-1
%(label)s.caption="%(string)s"
%(label)s.scope="dragonfly"
%(label)s.description="%(desc)s"
"""

if len(sys.argv)<2:
    print """usage: js2strings js_string_file.js

Prints strings in english.db format to stdout
"""
    sys.exit()

fname = sys.argv[1]

stringre = re.compile("""^\s*?/\*\s*?DESC:\s*(?P<desc>.*?)\s*\*/\n\s*ui_strings\.(?P<label>\S+)\s*=\s*(?:'(?P<squote>.*)'|"(?P<dquote>.*)");?$""", re.M);
f = open(fname);
s = f.read();
f.close();
matches = stringre.findall(s)

strings = []
for m in matches:
    strings.append({"desc": m[0],
                    "label": m[1],
                    "string": m[2] or m[3]
                    })

for s in strings: print tpl % s


