
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
        self.index = ''
        self.file_name = ''

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
        
def get_ids():
    """Parse the IDS file.
    
    Parse the IDS file and return a list of the id's. 
    Includes all tests and other attributes 
    of a protocol like tester and changeset 
    to check if a new submitted protocol is complete.
    """
    f_ids = open(IDS, 'r')
    ids = [id.strip() for id in f_ids.readlines()]
    f_ids.close()
    return ids
    
def get_tests():
    """Parse the TESTS file.

    Parse the TESTS file and return a list of Entry objects
    """
    in_file = open(TESTS, 'r')
    entries = []
    entry = Entry()
    cur = entry.buffer
    counter = 1
    for line in in_file.readlines():
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
            
def tests2singledocs():
    entries = get_tests()
    for e in entries: 
      e.normalize()
    entries = filter(lambda e: e.is_empty(), entries)
    cur = Entry()
    type = ''
    index = 0
    for entry in entries:
        if entry.title:
            cur.mode, ts = parse_title(''.join(entry.title))
            cur.repo = cur.mode.lower()
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
            entry.repo = cur.repo
            entry.index = "%#04i" % index
            file_name = ''.join(entry.label).strip().replace(' ', '-').replace(',', '').lower()
            entry.file_name = "%s.%s.html" % (entry.index, file_name)
            index += 1
    return filter(lambda e: e.label , entries)
    
def print_index(index):
    content = [HTML_HEAD, HTML_MAIN_TITLE]
    sections = []
    links = None
    cur_mode = ''
    for mode, label, path in index:
        if not mode == cur_mode:
            cur_mode = mode
            links = []
            sections.append((mode, links))
        links.append(HTML_URL % (path, label)) 
    for title, links in sections:
      content.append(HTML_SECTION % (title, "".join(links)))
    with open(os.path.join(PAPA, 'index.html'), 'w') as f:
        f.write("".join(content))
    
        
    
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
        content = [HTML_HEAD]
        urls = []
        for u in e.urls:
            u = u.replace('./', '../')
            urls.append(HTML_URL % (u, u))
        raw_items = [item.strip().replace('"', '&quot;') for item in e.desc if item]
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
                                     e.mode,
                                     e.tabs,
                                     "".join(urls),
                                     e.index,
                                     "".join([HTML_ITEM % item for item in items])))
        repo = os.path.join(PAPA, e.repo)
        if not os.path.exists(repo):
          os.makedirs(repo)
        
        with open(os.path.join(repo, e.file_name), 'w') as f:
            f.write("".join(content))
        index.append((e.mode, "".join(e.label), "./%s/%s" % (e.repo, e.file_name)))
    print_index(index)
    if not os.path.exists(os.path.join(PAPA, TESTCASES)):
        shutil.copytree(TESTCASES, os.path.join(PAPA, TESTCASES))
        
        
if __name__ == '__main__':
    test()
