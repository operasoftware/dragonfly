import sys
import stringparsers


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

js_strings = stringparsers.get_js_strings(js_path)
db_strings = [e for e in stringparsers.get_db_strings(db_path) if "dragonfly" in e["scope"]]

db_version = get_db_version(db_path)
missing = list(set([e["jsname"] for e in js_strings]) - set([e["jsname"] for e in db_strings]))
missing.sort()

print """Comparing %s and %s version %s.\nFound %s missing strings""" % (js_path, db_path, db_version, len(missing) or "no")
if missing:
    for m in missing: print "\t", m
