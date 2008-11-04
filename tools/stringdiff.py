import re
import sys

findre = re.compile("""^([A-Z0-9_-]+)[\.=](.*)""")
scopere = re.compile("^[A-Z0-9_-]+?.scope=\"(.*)\"")
def block_reader(path):
    fp = open(path)
    
    curid = None
    curlines = []
    
    for line in fp:
        m = findre.search(line)
        if m:
            id = m.groups()[0]
            if id == curid:
                curlines.append(line)
            else:
                if curlines: yield curlines
                curlines = [line]
                curid = id

    if curlines: yield curlines

def db_parser(path):
    for block in block_reader(path):
        name = findre.search(block[0]).groups()[0]
        scopes=[]
        for line in block:
            m = scopere.search(line)
            if m: scopes.extend(m.groups()[0].split(","))
        yield (name, scopes)
                

def get_js_strings(path):
    stringre = re.compile("""^\s*?/\*\s*?DESC:\s*(?P<desc>.*?)\s*\*/\n\s*ui_strings\.(?P<label>\S+)\s*=\s*(?:'(?P<squote>.*)'|"(?P<dquote>.*)");?$""", re.M);
    f = open(path);
    s = f.read();
    f.close();
    matches = stringre.findall(s)
    return set([m[1] for m in matches])

def get_db_strings(path):
    return set([s[0] for s in db_parser(path) if "dragonfly" in s[1]])

def get_db_version(path):
    fp = open(path)
    for line in fp:
        if line.startswith("@dbversion"): return line.strip()[11:]


if len(sys.argv) != 3:
    print """Prints summary of differences between a dragonfly javascript string
file and english.db to stdout.
Usage: stringdiff path_to_js path_to_english_db"""
    sys.exit(0)

js_path = sys.argv[1]
db_path = sys.argv[2]

js_strings = get_js_strings(js_path)
db_strings = get_db_strings(db_path)
db_version = get_db_version(db_path)
missing = list(js_strings-db_strings)
missing.sort()

print """Comparing %s and %s version %s.\nFound %s missing strings""" % (js_path, db_path, db_version, len(missing) or "no")
if missing:
    for m in missing: print "\t", m
