
import sys
import os
import time
import string
import re
import time
import shutil
from mimetypes import types_map
from urllib import quote, unquote
from resources.markup import *

APP_ROOT, file_name = os.path.split(os.path.abspath(__file__))
TEMPLATES = os.path.join(APP_ROOT, "resources", "TEMPLATES")
TESTS = os.path.join(APP_ROOT, "TESTS")
STYLESHEET = os.path.join(APP_ROOT, "resources", "STYLE")
STYLESHEET_NAME = "style.css"
PAPA = "PAPA"
TESTCASES = 'test-cases'

if sys.platform == "win32":
    import os, msvcrt
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stderr.fileno(), os.O_BINARY)

class Entry(object):
    def __init__(self):
        self.title = []
        self.url = []
        self.desc = []
        self.label = []
        self.id = []
        self.buffer = []
        self.index = 0
        self.mode = ''
        self.tabs = ''
        self.urls = ''
        self.repo = ''
        self.index_count = 0
        self.file_name = ''
        self.deprecated = False

    def __str__(self):
        ret = []
        for p in ['label',
                  'mode',
                  'tabs',
                  'urls',
                  'repo',
                  'index',
                  'file_name',
                  'desc']:
            value = getattr(self, p)
            if value:
                if type(value) == type([]):
                    ret.append("%s: %s" % (p, "".join(value)))
                else:
                    ret.append("%s: %s" % (p, value))
        return '-----------------\n' + "\n".join(ret)

    def normalize(self):
        for prop in ['title', 'url', 'desc', 'label']:
            setattr(self, prop, filter(lambda s: bool(s.strip()), getattr(self, prop)))

    def is_empty(self):
        return bool(self.title or self.url or self.desc or self.label)

def check_test_index():
    """Verify that all tests in the TESTS file have a unique id.
    """
    ID = 1
    LABEL = 2
    DESC = 3
    ERROR = 4
    state = DESC
    in_file = open(TESTS, 'r')
    #
    for line in in_file.readlines():
        if line.startswith('id:'):
            if not state == DESC:
                state = ERROR
                break
            state = ID
        elif line.startswith('label:'):
            if not state == ID:
                state = ERROR
                break
            state = LABEL
        elif line.startswith('desc:'):
            if not state == LABEL:
                state = ERROR
                break
            state = DESC
    in_file.close()
    return not state == ERROR

DEFAULT_ID_DELTA = 100

def get_next_id(id_count, lines, index):
    while True:
        line = lines[index]
        index += 1
        if line.startswith('***') or index >= len(lines):
            return id_count + DEFAULT_ID_DELTA
        elif line.startswith('id:'):
            return int((id_count + int(line[3:])) / 2)

def add_ids_test_index():
    """Add an id to all tests which are missing one.
    """
    import shutil
    import tempfile
    ID = 1
    LABEL = 2
    DESC = 3
    ERROR = 4
    state = DESC
    in_file = open(TESTS, 'rb')
    lines = in_file.readlines()
    in_file.close()
    id_count = 0

    tmpfd, tmppath = tempfile.mkstemp(".tmp", "dftests.")
    tmpfile = os.fdopen(tmpfd, "w")

    # state order: ID, LABEL, DESC
    # title resets the id_count (counting restarts in each repo)
    for index, line in enumerate(lines):
        if line.startswith('***'):
            id_count = 0
        elif line.startswith('id:'):
            if not state == DESC:
                state = ERROR
                break
            state = ID
            id_count = int(line[3:])
        elif line.startswith('label:'):
            if state == DESC:
                id = get_next_id(id_count, lines, index)
                tmpfile.write("id: %#05i\n" % id)
                id_count = id
                state = ID
            if not state == ID:
                state = ERROR
                break
            state = LABEL
        elif line.startswith('desc:'):
            if not state == LABEL:
                state = ERROR
                break
            state = DESC
        tmpfile.write(line)
    tmpfile.close()
    if state == ERROR:
        raise AssertionError("Not well formed entry on line %s!" % index)
    shutil.copy(tmppath, TESTS)
    os.unlink(tmppath)

def get_tests():
    """Parse the TESTS file.

    Parse the TESTS file and return a list of Entry objects
    """
    if not check_test_index():
        add_ids_test_index()
    in_file = open(TESTS, 'rb')
    entries = []
    entry = Entry()
    cur = entry.buffer
    counter = 1
    is_pre = False
    pre_sapces = 0
    for line in in_file.readlines():
        if "@pre" in line:
            pre_sapces = line.find("@pre")
            is_pre = True
            cur.append("@pre")
            continue
        if "@/pre" in line:
            pre_sapces = 0
            is_pre = False
            cur.append("@/pre")
            continue
        if is_pre:
            cur.append(line[pre_sapces:])
            continue
        else:
            line = line.strip()
        if line.startswith('#'):
            continue
        elif not line:
            entries.append(entry)
            entry = Entry()
            cur = entry.buffer
        elif line.startswith('id:'):
            cur = entry.id
            cur.append(line[3:])
        elif line.startswith('label:'):
            cur = entry.label
            cur.append(line[6:])
        elif line.startswith('desc:'):
            cur = entry.desc
            cur.append(line[5:])
        elif line.startswith('url:'):
            cur = entry.url
            cur.append(line[4:])
        elif line.startswith('***'):
            entry.title = entry.buffer
        elif line.startswith('deprecated:'):
            entry.deprecated = "true" in line.lower() and True or False
        else:
            cur.append(line)
    in_file.close()
    return entries

def parse_title(title):
    # Error Console.All Console.JavaScript Console.CSS
    top_tab = ''
    sub_tabs = []
    t = title.strip().split('.')
    if len(t):
        top_tab = t.pop(0)
    if len(t) == 1:
        sub_tabs.append(t[0])
    elif len(t) > 1:
        for s in t:
            st = map(lambda x: x.strip(), s.split(' '))
            while st[len(st) - 1] in top_tab:
                st.pop()
            sub_tabs.append(' '.join(st))
    return top_tab, sub_tabs

def load_templates():
    with open(TEMPLATES, 'rb') as f:
        cur_key = ""
        cur_value = []
        for line in f.readlines():
            if line.startswith('HTML_'):
                if cur_value:
                    globals()[cur_key] = "".join(cur_value)
                    cur_value = []
                cur_key = line.strip()
            elif not line.startswith('#'):
                cur_value.append(line)
        if cur_value:
            globals()[cur_key] = "".join(cur_value)

def label2filename(label):
    label = ''.join(label)
    for char in ["|", "\\", "?", "*", "<", "\"", ":",
                 ">", "+", "[", "]", "/", "%", " ", ","]:
        label = label.replace(char, '-')
    for pattern, repl in [[r"^-+", ""], [r"--+", "-"]]:
        label = re.sub(pattern, repl, label)
    return ''.join(label).strip().lower()

def tests2singledocs():
    entries = get_tests()
    for e in entries:
      e.normalize()
    entries = filter(lambda e: e.is_empty(), entries)
    cur = Entry()
    type = ''
    for entry in entries:
        if entry.title:
            cur.mode, ts = parse_title(''.join(entry.title))
            cur.repo = [label2filename(cur.mode)]
            if ts:
              cur.repo.append(label2filename(ts[0]))
            cur.tabs = ', '.join(ts)
            type = 'title'
            index = 1
        elif entry.url:
            if type == 'url':
                cur.urls.extend(entry.url)
            else:
                cur.urls = entry.url[:]
            type = 'url'
        if entry.label:
            type = 'label'
            entry.mode = cur.mode
            entry.tabs = cur.tabs
            entry.urls = entry.url or cur.urls
            entry.repo = cur.repo[0:]
            entry.index = ''.join(entry.id).strip()
            file_name = label2filename(entry.label)
            entry.file_name = "%s.%s.html" % (entry.index, file_name)
            index += 1
    return filter(lambda e: e.label , entries)

def print_index(index):
    content = [HTML_HEAD % STYLESHEET_NAME, HTML_MAIN_TITLE]
    sections = []
    links = None
    cur_mode = ''
    cur_tab = ''
    for mode, tab, label, path in index:
        if not mode == cur_mode:
            cur_mode = mode
            sections.append((mode, None))
            cur_tab = None
        if not tab == cur_tab:
            cur_tab = tab
            links = []
            sections.append((tab, links))
        links.append(HTML_URL % (path, label))
    for title, links in sections:
      if links == None:
        content.append(HTML_MODE_SECTION % title)
      else:
        content.append(HTML_SECTION % (title, "".join(links)))
    with open(os.path.join(PAPA, 'index.html'), 'wb') as f:
        f.write("".join(content))

def print_stylesheet():
    content = ""
    with open(STYLESHEET, 'rb') as f:
        content = f.read()
    with open(os.path.join(PAPA, STYLESHEET_NAME), 'wb') as f:
        f.write(content)

def item2html(item):
    ret = item.replace('<', '&lt;').replace('"', '&quot;').replace('@pre', '<pre>').replace('@/pre', '</pre>')
    if "@line-through" in ret:
        ret = HTML_LINE_THROUGH.strip() % ret.replace("@line-through", "")
    return ret

def test():
    load_templates()
    entries = tests2singledocs()

    """
    label:  Export
    mode: DOM
    tabs: DOM
    urls: http://dev.opera.com
    repo: dom
    index: 0002
    file_name: 0002.export.html
    desc: - Press the Export button.- Verify that the current view is displayed in a new tab.
    """
    if not os.path.exists(PAPA):
        os.makedirs(PAPA)
    index = []
    for e in entries:
        content = [HTML_HEAD % (("../" * len(e.repo)) + STYLESHEET_NAME)]
        urls = []
        for u in e.urls:
            u = u.replace('./', '../' * len(e.repo))
            urls.append(HTML_URL % (u, u))
        raw_items = [item2html(item) for item in e.desc if item]
        string = ""
        items = []
        for item in raw_items:
            if item.startswith('-') or item.startswith('*'):
                if string:
                    items.append(string)
                string = item.lstrip('-* ')
            else:
                string += ' ' + item
        if string:
            items.append(string)

        content.append(HTML_TITLE % ("".join(e.label),
                                     e.deprecated and HTML_DEPRECATED or "",
                                     e.mode,
                                     e.tabs,
                                     "".join(urls),
                                     e.index,
                                     "".join([HTML_ITEM % item for item in items])))
        repo = PAPA
        for dir in e.repo:
          repo = os.path.join(repo, dir)
          if not os.path.exists(repo):
            os.makedirs(repo)
        with open(os.path.join(repo, e.file_name), 'wb') as f:
            f.write("".join(content))
        index.append((e.mode, e.tabs, "".join(e.label), "./%s/%s" % ('/'.join(e.repo), e.file_name)))
    print_index(index)
    print_stylesheet()
    if not os.path.exists(os.path.join(PAPA, TESTCASES)):
        shutil.copytree(TESTCASES, os.path.join(PAPA, TESTCASES))


if __name__ == '__main__':
    test()
