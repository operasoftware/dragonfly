
import sys
import os
import time
import string
import re
import time
from mimetypes import types_map
from urllib import quote, unquote
from resources.markup import *

APP_ROOT, file_name = os.path.split(os.path.abspath(__file__))
TESTS = os.path.join(APP_ROOT, "TESTS")
ID_COUNT = os.path.join(APP_ROOT, 'storage', 'ID_COUNT')
IDS = os.path.join(APP_ROOT, 'storage', 'IDS')

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
        for p in ['title', 'url', 'desc', 'label']:
            value = getattr(self, p)
            if value:
                ret.append("%s: %s\n" % (p, "".join(value)))
        for p in ['mode', 'tabs', 'urls', 'repo', 'index', 'file_name']:
            value = getattr(self, p)
            if value:
                ret.append("%s: %s\n" % (p, value))

        return '-----------------\n' + "".join(ret)



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
            
def test():
    entries = get_tests()
    for e in entries: e.normalize()
    entries = filter(lambda e: e.is_empty(), entries)
    cur = Entry()
    """
    mode = ''
    repo = ''
    tabs = ''
    urls = []

    """
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
        if entry.label:
            type = 'label'
            entry.mode = cur.mode
            entry.tabs = cur.tabs
            entry.urls = entry.url or cur.urls
            entry.repo = cur.repo
            entry.index = "%#04i" % index
            entry.file_name = "%s.%s.html" % (entry.index, ''.join(entry.label).strip().replace(' ', '-').lower())
            index += 1
    entries = filter(lambda e: e.label , entries)
    for entry in entries:
        print entry

        
if __name__ == '__main__':
    test()
