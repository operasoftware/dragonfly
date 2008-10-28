import sys
import os.path
import codecs

def block_generator(path):
    """Yield blocks of text from a po file at path. Blocks are delimited by a
    newline"""
    fp = codecs.open(path, "r", encoding="utf-8")
    curblock = []
    for line in fp:
        if line.isspace() and curblock:
            yield curblock
            curblock = []
        else:
            curblock.append(line.strip())
    if curblock: yield curblock
    
def po_parser(path):
    """Generator that yields dicts containing parsed po data from file at
    path."""
    for block in block_generator(path):
        entry = {}
        for line in block:
            if line.startswith("#. "):
                if not "desc" in entry: entry["desc"] = line[3:]
                else: entry["desc"] += line[2:]
            elif line.startswith("#: "):
                cpos = line.rfind(":", 2)
                if cpos != -1: entry["jsname"] = line[3:cpos]
                else: entry["jsname"] = line[3:]
            elif line.startswith("msgid"):
                entry["msgid"] = line[6:]
            elif line.startswith("msgstr"):
                entry["msgstr"] = line[8:-1]
        if "jsname" in entry and "msgstr" in entry:
            yield entry

def make_js_from_po(path):
    strings = []
    for po in po_parser(path):
        strings.append("""ui_strings.%s="%s";""" % (po["jsname"], po["msgstr"]))
    return """window.ui_strings || ( window.ui_strings  = {} ) 
window.ui_strings.lang_code = "?";
%s""" % "\n".join(strings)

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
            
        outfile.write(make_js_from_po(infile))
        return 0

if __name__ == "__main__":
    sys.exit(main())

