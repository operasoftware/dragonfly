import os
import os.path
import re
import itertools

stringidre = re.compile(r"""ui_strings\.([A-Z_0-9]+)""")
stringdatare = re.compile(r"""ui_strings\.([A-Z_0-9]+)\s*=\s*(.*?);""")

def collect_used_string_ids(basedir):
	found = set()
	for dirpath, dirnames, filenames in os.walk(basedir):
		if dirpath.endswith("/ui-strings"): continue

		for filepath in [os.path.join(dirpath, e) for e in filenames if e.endswith(".js")]:
			data = open(filepath).read()
			used_strings = stringidre.findall(data)
			found = found | set(used_strings)

	return found


def get_strings_in_lang_file(basedir, lang="en"):
	filepath = os.path.join(basedir, "ui_strings-%s.js" % lang)
	data = open(filepath).read()
	used_strings = stringdatare.findall(data)
	used_strings = [(sid, sval.strip().strip("'\"")) for sid, sval in used_strings]
	return used_strings

def get_string_ids_in_lang_file(basedir, lang="en"):
	return [e[0] for e in get_strings_in_lang_file(basedir, lang)]

def get_string_values_in_lang_file(basedir, lang="en"):
	return [e[1] for e in get_strings_in_lang_file(basedir, lang)]
			

used = set(collect_used_string_ids("."))
defined = set(get_string_ids_in_lang_file("./ui-strings"))
strings = get_string_values_in_lang_file("./ui-strings")

print "Strings in ui-strings file:\t%d" % len(defined)
print "Strings used in source:\t\t%d" % len(used)
print
print "Strings in ui-strings file not used in code:"
for e in sorted(list(defined - used)): print e
print
print "Strings in code not in ui-strings:"
for e in sorted(list(used - defined)): print e
print
print "Strings that are duplicated in the strings file:"

strings.sort()
groups = itertools.groupby(strings)
for val, items in groups: 
	if len(list(items)) > 1:
		print val


