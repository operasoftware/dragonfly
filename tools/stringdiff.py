import sys
import dfstrings
import optparse
import time

def main():
    usage = """%prog [options] jspath dbpath
    
Find strings that are in the js file but missing in the db file"""
    parser = optparse.OptionParser(usage)
    parser.add_option("-b", "--bare", dest="bare",
                      default=False, action="store_true",
                      help="just emit the missing string IDs")
    parser.add_option("-p", "--po", dest="po",
                      default=False, action="store_true",
                      help="emit missing strings in english.db format")

    options, args = parser.parse_args()
    if len(args) != 2:
        parser.error("Need both jspath and dbpath")
    elif options.bare and options.po:
        parser.error("-p and -b are mutually exclusive")
        
    js_strings = dfstrings.get_js_strings(args[0])
    db_strings = [e for e in dfstrings.get_db_strings(args[1]) if "dragonfly" in e["scope"]]
    db_version = dfstrings.get_db_version(args[1])

    # the following would be nicer if we could put dictionaries in sets,
    # but they're not hashable.

    db_stringids = [e["jsname"] for e in db_strings]
    missing = [ e for e in js_strings if not e["jsname"] in db_stringids ]
    
    if options.bare:
        print " ".join([e["jsname"] for e in missing])
    elif options.po:
        print """# .db entries for strings in %s
# that are missing from %s version %s.
# this file generated %s.\n""" % (args[0], args[1], db_version, time.asctime())
        for s in missing: print dfstrings.make_po_entry(s)
    else:
        print """Comparing %s and %s version %s.\nFound %s missing strings""" % (args[0], args[1], db_version, len(missing) or "no")
        if missing:
            for m in missing: print "\t", m["jsname"]

if __name__ == "__main__":
    sys.exit(main())

