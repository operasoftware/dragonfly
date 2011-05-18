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
        strings.append(u"""ui_strings.%s="%s";""" % (po["jsname"], _escape_quotes(po["msgstr"])))
    return """/* Generated from %s at %s */
window.ui_strings || ( window.ui_strings  = {} )
window.ui_strings.lang_code = "%s";
%s""" % (unicode(os.path.basename(path)),
        unicode(time.asctime()),
        unicode(os.path.splitext(os.path.basename(path))[0]),
        u"\n".join(strings))

def _escape_quotes(s):
    return s.replace('"', '\\"')

def _process_file(inpath, outfd):
    entries = [e for e in dfstrings.get_po_strings(inpath) if "scope" in e and "dragonfly" in e["scope"]]
    lines = [e["msgstr"] for e in entries]

    bad_markers = dfstrings.get_strings_with_bad_markers(entries)
    if bad_markers:
        print "error: Some interpolation markers are missing, or different from originals:\n"
        for e in bad_markers: 
            print e["msgid"]
            print e["msgstr"]
            print "---"
        return 1

    data = make_js_from_po(inpath)
    outfd.write(data)

def _process_dir(dirpath, destpath):
    files = _find_pofiles(dirpath)
    files.sort()

    for i, path in enumerate(files):
        out = os.path.join(destpath, "ui_strings-%s.js" % os.path.basename(path)[:-3])
        print "writing %s. (%s of %s)" % (out, i+1, len(files))
        outfd = codecs.open(out, "w", encoding="utf_8_sig")
        _process_file(path, outfd)
        outfd.close()



def _find_pofiles(top):
    """Make a list of all po files in dirctory top, or any subdir"""
    matches = []
    for dirpath, dirnames, filenames in os.walk(top):
        # only add files that are named <something>.po and that is in
        # a dir named <something>. As in, dirname and filename must match.
        matches.extend([os.path.join(dirpath, e)
                        for e in filenames
                        if os.path.basename(dirpath)+".po" == e])
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

