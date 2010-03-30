import sys
import os
import time
import string
import re
from mimetypes import types_map
from resources.markup import *

APP_ROOT, file_name = os.path.split(os.path.abspath(__file__))
TESTS = os.path.join(APP_ROOT, "TESTS")

debug_log = open('debug.log', 'a')

if sys.platform == "win32":
    import os, msvcrt
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)

class Entry(object):
    def __init__(self):
        self.title = []
        self.url = []
        self.desc = []
        self.label = []
        self.id = []
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

def check_test_index():
    ID = 1
    LABEL = 2
    DESC = 3
    ERROR = 4
    state = DESC
    in_file = open(TESTS, 'r')
    
    # Any entry with a label: must be followed by an id: and a desc:
    
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
    return state != ERROR

def add_ids_test_index():
    import shutil
    import tempfile
    ID = 1
    LABEL = 2
    DESC = 3
    ERROR = 4
    state = DESC
    in_file = open(TESTS, 'r')
    f_id_count = open(os.path.join(APP_ROOT, 'storage', 'ID_COUNT'), 'r')
    id_count = int(f_id_count.readline().strip())
    f_id_count.close()
    tmpfd, tmppath = tempfile.mkstemp(".tmp", "dftests.")
    tmpfile = os.fdopen(tmpfd, "w")
    for line in in_file.readlines():
        if line.startswith('id:'):
            if not state == DESC:
                state = ERROR
                break
            state = ID
        elif line.startswith('label:'):
            if state == DESC:
                tmpfile.write("id: %s\n" % id_count)
                id_count += 1
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
    shutil.copy(tmppath, 'test-id')
    os.unlink(tmppath)
    f_id_count = open(os.path.join(APP_ROOT, 'storage', 'ID_COUNT'), 'w')
    f_id_count.write(str(id_count))
    f_id_count.close()
    in_file.close()
    
def write_index():
    in_file = open(TESTS, 'r')
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
        if line.startswith('#'):
            continue
        elif not line.strip():
            append_entry(entry)
            entry = Entry()
            cur = entry.buffer
        elif line.startswith('id:'):
            cur = entry.id
            cur.append(line[3:].strip())
        elif line.startswith('label:'):
            cur = entry.label
            cur.append(line[6:].strip())
        elif line.startswith('desc:'):
            cur = entry.desc
            cur.append(line[5:].strip())
        elif line.startswith('url:'):
            cur = entry.url
            cur.append(line[4:].strip())
        elif line.startswith('***'):
            entry.title = entry.buffer
        else:
            cur.append(line.strip())
    in_file.close()
    return entries
            
def serve_test_form(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    if not check_test_index():
        add_ids_test_index()
    doc = [TEST_FORM]
    doc.extend(write_index())
    doc.append(TEST_FORM_END)

    return doc

def submit_form(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/plain')]
    start_response(status, response_headers)
    raw_conten = environ["wsgi.input"].read()
    doc = [raw_conten]
    return doc

def serve_index(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    doc = [INDEX]
    return doc

def serve_resource(environ, start_response):
    path = environ['PATH_INFO']
    sys_path = os.path.join(APP_ROOT, os.path.normpath(path.lstrip('/')))
    content = ""
    mime = "text/plain"
    if os.path.isfile(sys_path):
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

def not_supported(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/plain')]
    start_response(status, response_headers)
    return ['not a supported method: %s' % environ['PATH_INFO']]

handlers = {
    "/": serve_index,
    "/test-form": serve_test_form,
    "/submit-form": submit_form
}

def application(environ, start_response):

    if not "PATH_INFO" in environ:
        return redirect_home(environ, start_response)

    if environ['PATH_INFO'] in handlers: 
        return handlers[environ['PATH_INFO']](environ, start_response)

    if '/resources/' in environ['PATH_INFO']:
        return serve_resource(environ, start_response)

    return not_supported(environ, start_response)
        
if __name__ == '__main__':
    print "".join(serve_test_form(None, lambda status, response_headers: 0))
