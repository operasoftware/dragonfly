#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import os.path
import codecs
import dfstrings
import time

def make_js_from_po(path):
    strings = []
    for po in [p for p in dfstrings.get_po_strings(path) if "scope" in p and "dragonfly" in p["scope"] ]:
        strings.append(u"""ui_strings.%s="%s";""" % (po["jsname"], po["msgstr"]))
    return """/* Generated from %s at %s */
window.ui_strings || ( window.ui_strings  = {} ) 
window.ui_strings.lang_code = "?";
%s""" % (unicode(os.path.basename(path)), unicode(time.asctime()), u"\n".join(strings))

def main():
    if len(sys.argv)==1:
        print "Usage: po2js.py infile [outfile]. If no outfile, write to stdout"
        return(1)
    else:
        infile = sys.argv[1]
        if len(sys.argv)==3:
            outfile = codecs.open(sys.argv[2], "w", encoding="utf_8_sig")
        else:
            outfile = sys.stdout
         
	data = make_js_from_po(infile)
        outfile.write(data)
        return 0

if __name__ == "__main__":
    sys.exit(main())

