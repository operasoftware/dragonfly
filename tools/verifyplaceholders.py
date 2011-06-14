# TODO
#
# This script is just a quick draft. 
# The functionality should probably be 
# included in existing scripts.
# The purpose is to check if any of the place holders 
# in the master string file also exists in the generated 
# language file and if the place-holders are correct and complete.
#


import os
import re
import codecs

LANGS = [
    "be",
    "bg",
    "cs",
    "da",
    "de",
    "el",
    "en-GB",
    "es-ES",
    "es-LA",
    "et",
    "fi",
    "fr",
    "fr-CA",
    "fy",
    "gd",
    "hi",
    "hr",
    "hu",
    "id",
    "it",
    "ja",
    "ka",
    "ko",
    "lt",
    "mk",
    "nb",
    "nl",
    "nn",
    "pl",
    "pt",
    "pt-BR",
    "ro",
    "ru",
    "sk",
    "sr",
    "sv",
    "ta",
    "te",
    "tr",
    "uk",
    "vi",
    "zh-cn",
    "zh-tw"
]

LANGDIR = "./strings"
MASTER = "./src/ui-strings/ui_strings-en.js"

langfiles = ["ui_strings-%s.js" % l for l in LANGS]
files = os.listdir(LANGDIR)
for f in files:
    if not f in langfiles:
        os.unlink(os.path.join(LANGDIR, f))

reid = re.compile(r"ui_strings\.([A-Z0-9_]+)\s*=")
repl = re.compile(r"(%(?:\([^\)]*\))?s)")

def get_placeholders(path):
    pls = {}
    with codecs.open(path, "r", "utf_8_sig") as f:
        for n, l in enumerate(f, 1):
            m = reid.search(l)
            if m:
                placeholders = repl.findall(l)
                if placeholders:
                    pls[m.groups()[0]] = {'line': l.strip(),
                                          'line-number': n,
                                          'placeholders': placeholders}
    return pls

def check_pls(m_pls, pls):
    missing = []
    error = []
    for pl in m_pls:
        if pl in pls:
            c_pl = pls.pop(pls.index(pl))
            if not pl == c_pl:
                error.append((pl, c_pl))
        else:
            missing.append(pl)

    return missing, error

master_pls = get_placeholders(MASTER)

for l in langfiles:
    pls = get_placeholders(os.path.join(LANGDIR, l))
    print "checking:", l
    for id in master_pls:
        if id in pls:
            missing, error = check_pls(master_pls[id]['placeholders'], pls[id]['placeholders'])
            if missing:
                for m in missing:
                    print "missing placeholder"
                    print "file:", l
                    print "\tid:", id
                    print "\tline number:", pls[id]['line-number']
                    print "\tline master:", master_pls[id]['line']
                    print "\tline check: ", pls[id]['line']
                    print "\tplaceholder:", m
            if error:
                for e in error:
                    print "broken placeholder"
                    print "file:", l
                    print "\tid:", id
                    print "broken placeholder"
                    print "\tline number          :", master_pls[id]['line-number']
                    print "\tline:                ", master_pls[id]['line']
                    print "\tplaceholder expeceted:", e[0]
                    print "\tplaceholder actual   :", e[1]
