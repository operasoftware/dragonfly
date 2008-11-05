import sys
import dfstrings

if len(sys.argv)<2:
    print """usage: js2strings js_string_file.js [ ID_1 ID_2 ID_n ]

Prints strings in english.db format to stdout. By default, entries for all
strings are generated. If string IDs are passed as arguments, only those
IDs are generated
"""
    sys.exit()

path = sys.argv[1]
ids = sys.argv[2:] if len(sys.argv)>2 else []

strings = dfstrings.get_js_strings(path)

if ids:
    strings = [e for e in strings if e["jsname"] in ids]

for s in strings: print dfstrings.make_po_entry(s)
    

