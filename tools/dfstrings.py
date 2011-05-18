import re
import codecs
import polib
# polib is easy_installable from pypi!

_db_findre = re.compile("""^([A-Z0-9_-]+)[\.=](.*)""")
_db_scopere = re.compile("^[A-Z0-9_-]+?\.scope=\"(.*)\"")
_db_detailre = re.compile("^[A-Z0-9_-]+?\.(.+?)=\"(.*)\"")
_js_findre = re.compile("""^ui_strings.(\w*?)\s*=\s*['"](.*)['"]""")
_js_concatere = re.compile("""\s*?['"](.*)['"]""")
_po_tpl="""%(jsname)s=-1
%(jsname)s.caption="%(msgstr)s"
%(jsname)s.scope="dragonfly"
%(jsname)s.description="%(desc)s"
"""

def _db_block_reader(path):
    fp = open(path)
    curid = None
    curlines = []
    
    for line in fp:
        m = _db_findre.search(line)
        if m:
            id = m.groups()[0]
            if id == curid:
                curlines.append(line)
            else:
                if curlines: yield curlines
                curlines = [line]
                curid = id

    if curlines: yield curlines

def _db_parser(path):
    for block in _db_block_reader(path):
        scopes=[]
        ret = {"name": _db_findre.search(block[0]).groups()[0]}
        for line in block:
            d = _db_detailre.search(line)
            if d:
                name, value = d.groups()
                if name == "scope": scopes.extend(value.split(","))
                else: ret[name] = value
        ret["scopes"] = scopes
        yield ret

def _js_block_reader(path):
    fp = open(path)
    curblock = []
    for line in fp:
        if line.startswith("/* DESC: "):
            if curblock: yield curblock
            curblock=[line.strip()]
        elif not line.strip() and curblock:
            yield curblock
            curblock=[]
            
        elif curblock:
            curblock.append(line.strip())
    if curblock: yield curblock

def _js_parser(path):
    for block in _js_block_reader(path):
        desc = ""
        jsname = ""
        msgstr = []
        for line in block:
            if line.startswith("/* DESC:"):
                desc = line.strip()[8:-2].strip()
            elif line.startswith("ui_strings."):
                m = _js_findre.search(line)
                if m:
                    jsname = m.groups()[0]
                    msgstr.append(m.groups()[1])
            else:
                m = _js_concatere.search(line)
                if m: msgstr.append(m.groups()[0])

        if jsname:
            yield { "msgstr": "".join(msgstr), "jsname": jsname, "desc": desc or "Missing description!"}
            desc = ""
            jsname = ""
            msgstr = []

    if jsname:
        yield { "msgstr": "".join(msgstr), "jsname": jsname, "desc": desc or "Missing description!"}

def make_po_entry(str):
    return _po_tpl % str

def get_db_strings(path):
    "return a list of string dicts taken from db file at path"
    return list(_db_parser(path))

def get_po_strings(path):
    """polib does the heavy lifting in parsing, but we need to extract stuff
    from comments etc."""
    pofile = polib.pofile(path)
    ret = []
    for e in pofile:
        if not e.occurrences: continue
        cur = {
            "desc": u"",
            "jsname": e.occurrences[0][0].decode(e.encoding),
            "msgstr": (e.msgstr or e.msgid).replace("\n", "\\n"),
            "msgid": e.msgid.replace("\n", "\\n"),
            "scope": []
        }
        if e.comment:
            lines = set([l for l in e.comment.split("\n")])
            commentlines = set([l[7:] for l in lines if l.startswith("Scope: ")])
            cur["scope"] = ",".join(commentlines).split(",")
            lines = lines - commentlines
            cur["desc"] = u"\\n".join(lines)
        ret.append(cur)
    return ret


def get_js_strings(path):
    "return a list of string dicts taken from js file at path"
    return list(_js_parser(path))

def __version(path):
    "return db file version as string from db files at path"
    fp = open(path)
    for line in fp:
        if line.startswith("@dbversion"): return line.strip()[11:]
    return "unknown"

def get_strings_with_bad_escaping(strings):
    """Find strings that contain quotes that are not escaped
    The string 'hello "world"' is not allowed, the string
    'hello \\"world\\"' is fine, since the string will remain properly
    escaped when stuck into a js file
    """
    quotere = re.compile(r"[^\\]\"")
    return [e for e in strings if quotere.findall(e)]

def get_strings_with_bad_format(strings):
    """Finds strings where the "s" is missing in replacement tokens, such
    as "%(foo)s" has been changed to "%(foo)" """
    formatre = re.compile(r"%\(.*?\)[^s]")
    return [e for e in strings if formatre.findall(e)]

def get_strings_with_bad_markers(entries):
    ret = []
    replacement_re = re.compile(r"(%(?:\([^\)]*\))?s)")

    for entry in entries:
        orig = "".join(sorted(replacement_re.findall(entry["msgid"])))
        trans = "".join(sorted(replacement_re.findall(entry["msgstr"])))

        if orig != trans:
            ret.append(entry)
    return ret
