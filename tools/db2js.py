#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import os.path
import codecs
import dfstrings
import time
import optparse
import re

js_file_template = """window.ui_strings || ( window.ui_strings  = {} );
window.ui_strings.lang_code = "en";

/**
 * Capitalization guidelines:
 * http://library.gnome.org/devel/hig-book/stable/design-text-labels.html.en#layout-capitalization
 *
 * Prefix -> use mapping for strings:
 * Prefix   Use
 * D        Dialog titles and components
 * S        General strings
 * M        Menus
 */
%s
"""

js_string_template = """
/* DESC: %(description)s */
ui_strings.%(name)s = "%(caption)s";
"""

def make_js_from_db(path):
    strings = dfstrings.get_db_strings(path)
    strings = [s for s in strings if "scopes" in s and "dragonfly" in s["scopes"]] 
    strings.sort(key=lambda x: x["name"])
    blocks = []
    for e in strings:
        if not "description" in e:
            e["description"] = "No description"

        e["caption"] = _smart_escape(e["caption"])
        blocks.append(js_string_template % e)

    return js_file_template % "".join(blocks)


def _smart_escape(s):
    return re.sub(r'(?<!\\)"', r'\"', s)


def _parse_options():
    usage = """%prog [options] input [output]"""

    parser = optparse.OptionParser(usage)

    options, args = parser.parse_args()

    if len(args) == 0:
        parser.error("Not enough arguments")

    return options, args


def main():
    options, args = _parse_options()
    print make_js_from_db(args[0])
    return 0


if __name__ == "__main__":
    sys.exit(main())
