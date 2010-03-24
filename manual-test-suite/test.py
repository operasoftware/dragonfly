#!/usr/bin/env python

import sys
import os
import time
import string
import re
from mimetypes import types_map
from resources.markup import *

APP_ROOT, file_name = os.path.split(os.path.abspath(__file__))
TESTS = os.path.join(APP_ROOT, "TESTS")

if sys.platform == "win32":
    import os, msvcrt
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)

class Entry(object):
    def __init__(self):
        self.title = []
        self.url = []
        self.desc = []
        self.label = []
        self.buffer = []

count = 0
def get_id():
    global count
    count += 1
    return "id_%s" % count

def redirect_home(environ, start_response): 
    status = "301 Moved Permanently"
    # this looks a bit stupid, but to keep relative url's working the path must be a directory ( means i don't know better )
    response_headers = \
    [
        (
            "Location", 
            environ["wsgi.url_scheme"] + "://" + 
            environ["SERVER_NAME"] + 
            ( "SERVER_PORT" in environ and ( ":" + environ["SERVER_PORT"] ) or "" ) +
            environ["REQUEST_URI"] + "/"
        )
     ]
    start_response(status, response_headers)
    return []
    
def write_index(in_file):
    entries = []
    def append_entry(entry):
        if entry.title:
            title = "".join(entry.title)
            entries.append(TR_TD_COLS_4 % title)
        if entry.url:
            url = "".join(entry.url)
            entries.append(TR_TD_URL % (url, url))
        if entry.label:
            id = get_id()
            label = "".join(entry.label)
            desc = [""]
            desc.extend([item.replace("\"", "&quot;") for item in re.split(" ?- *|\* *", " ".join(entry.desc)) if item])
            desc.append("")
            entries.append(TR_TEST % ("\n    ".join(desc), label, id, id))
            
    entry = Entry()
    cur = entry.buffer
    for line in in_file.readlines():
        if not line.strip(' \r\n'):
            append_entry(entry)
            entry = Entry()
            cur = entry.buffer
        elif line.startswith('label:'):
            cur = entry.label
            cur.append(line[6:].strip(' \r\n'))
        elif line.startswith('desc:'):
            cur = entry.desc
            cur.append(line[5:].strip(' \r\n'))
        elif line.startswith('url:'):
            cur = entry.url
            cur.append(line[4:].strip(' \r\n'))
        elif line.startswith('***'):
            entry.title = entry.buffer
        else:
            cur.append(line.strip(' \r\n'))
    return entries
            
def serve_test_form(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    doc = [TEST_FORM]
    in_file = open(TESTS, 'r')
    doc.extend(write_index(in_file))
    doc.append(TEST_FORM_END)
    in_file.close()
    return doc

def serve_resource(environ, start_response, path):
    sys_path = os.path.join(APP_ROOT, os.path.normpath(path))
    content = ""
    mime = "text/plain"
    if path.startswith('resources') and os.path.isfile(sys_path):
        ending = "." in path and path[path.rfind("."):] or "no-ending"
        mime = ending in types_map and types_map[ending] or 'text/plain'
        content = ""
        try:
            f = open(sys_path, 'rb')
            content = f.read()
            f.close()
        except:
            pass
    status = '200 OK'
    response_headers = [('Content-type', mime)]
    start_response(status, response_headers)
    return [content]

def application(environ, start_response):

    if not "PATH_INFO" in environ:
        return redirect_home(environ, start_response)
    path_info = environ['PATH_INFO'].lstrip("/")
    if path_info == "": 
        return serve_test_form(environ, start_response)
    else:
        return serve_resource(environ, start_response, path_info)
        
if __name__ == '__main__':
    print "".join(serve_test_form(None, lambda status, response_headers: 0))
