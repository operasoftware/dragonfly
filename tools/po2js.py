#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import os.path
import codecs
import dfstrings
import time
import optparse

def make_js_from_po(path):
    strings = []
    for po in [p for p in dfstrings.get_po_strings(path) if "scope" in p and "dragonfly" in p["scope"] ]:
        strings.append(u"""ui_strings.%s="%s";""" % (po["jsname"], po["msgstr"]))
    return """/* Generated from %s at %s */
window.ui_strings || ( window.ui_strings  = {} )
window.ui_strings.lang_code = "%s";
%s""" % (unicode(os.path.basename(path)),
        unicode(time.asctime()),
        unicode(os.path.splitext(os.path.basename(path))[0]),
        u"\n".join(strings))


def _process_file(inpath, outfd):
    lines = [p["msgstr"] for p in dfstrings.get_po_strings(inpath)
        if "scope" in p and "dragonfly" in p["scope"] ]

    bad_escaped = dfstrings.get_strings_with_bad_escaping(lines)
    if bad_escaped:
        print "error: %s contains strings with bad escaping: %s" % (inpath, bad_escaped)
        return 1

    bad_format = dfstrings.get_strings_with_bad_format(lines)
    if bad_format:
        print "error: %s contains strings with bad formatting: %s" % (inpath, bad_format)
        return 1

    data = make_js_from_po(inpath)
    print "WRITING TO", outfd
    outfd.write(data)


def _process_dir(dirpath, destpath):
    files = _find_pofiles(dirpath)
    for path in files:
        out = os.path.join(destpath, "ui_strings-%s.js" % os.path.basename(path)[:-3])
        outfd = codecs.open(out, "w", encoding="utf_8_sig")
        _process_file(path, outfd)
        outfd.close()



def _find_pofiles(top):
    """Make a list of all po files in dirctory top, or any subdir"""
    matches = []
    for dirpath, dirnames, filenames in os.walk(top):
        # only add files that are 5 chars long (<countrycode>.po)
        # and that ends in .po
        # and that does not already exist in the matches list
        # Search is top down, so most shallow match will remain
        matches.extend([os.path.join(dirpath, e)
                        for e in filenames
                        if len(e) == 5
                        and e.endswith(".po")
                        and e not in [os.path.basename(x) for x in matches]])
    return matches


def _parse_options():
    usage = """%prog [options] input [output]"""

    parser = optparse.OptionParser(usage)
    parser.add_option("-d", "--directory", dest="directory",
                      default=False, action="store_true",
                      help="Operate on directories rather than single files")

    options, args = parser.parse_args()

    if len(args) == 0:
        parser.error("Not enough arguments")

    if options.directory and len(args) != 2:
        parser.error("Need both source and target directory")

    return options, args


def main():
    options, args = _parse_options()

    if options.directory:
        _process_dir(args[0], args[1])
    else:
        outfd = sys.stdout
        if len(args) > 1:
            outfd = codecs.open(sys.argv[1], "w", encoding="utf_8_sig")

        _process_file(args[0], outfd)

        if not outfd is sys.stdout:
            outfd.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())

