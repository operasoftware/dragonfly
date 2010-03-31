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

# debug_log = open('debug.log', 'a')

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

def get_ids():
    f_ids = open(IDS, 'r')
    ids = [id.strip() for id in f_ids.readlines()]
    f_ids.close()
    return ids
    

def parse_tests():
    in_file = open(TESTS, 'r')
    entries = []
    entry = Entry()
    cur = entry.buffer
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

def write_tester_changeset(missing, submitted):
    ret = []
    for key in ["tester", "changeset"]:
        if key in submitted and submitted[key]:
            ret.append(TR_VALUE_CHECK % (
                "submitted",
                key, 
                key, 
                VALUE_DISABLED % submitted[key],
                INPUT_HIDDEN % (key, submitted[key])
            ))
        else:
            ret.append(TR_VALUE_CHECK % ("missing", key, key, "", ""))

    return "".join(ret)
    

def write_index_missing(missing, submitted):
    entries = []
    tests = parse_tests()
    for entry in tests:
        if entry.title:
            title = "".join(entry.title)
            entries.append(TR_TD_COLS_4 % title)
        if entry.url:
            url = "".join(entry.url)
            entries.append(TR_TD_URL % (url, url))
        if entry.label:
            id = "id-%s" % entry.id[0].strip()
            label = "".join(entry.label)
            desc = "\n    ".join(
                [""] + 
                [item.strip(' -*').replace("\"", "&quot;") 
                            for item in entry.desc if item] +
                [""]
            )
            if id in missing:
                tr = TR_TEST_CHECK % ("missing", desc, label, id, "", id, "", "")
            else:
                tr = TR_TEST_CHECK % ("submitted", desc, label,
                    id,
                    (submitted[id] == "PASS" and " checked" or "") + " disabled",
                    id,
                    (submitted[id] == "FAIL" and " checked" or "") + " disabled",
                    INPUT_HIDDEN % (id, submitted[id])
                )
            entries.append(tr)
    return entries

def write_index():
    entries = []
    for entry in parse_tests():
        if entry.title:
            title = "".join(entry.title)
            entries.append(TR_TD_COLS_4 % title)
        if entry.url:
            url = "".join(entry.url)
            entries.append(TR_TD_URL % (url, url))
        if entry.label:
            id = "id-%s" % entry.id[0].strip()
            label = "".join(entry.label)
            desc = "\n    ".join(
                [""] + 
                [item.strip(' -*').replace("\"", "&quot;") 
                            for item in entry.desc if item] +
                [""]
            )   
            entries.append(TR_TEST % (desc, label, id, id))
    return entries

def parse_protocol(path):
    f = open(path, 'r')
    lines = f.readlines()
    f.close
    return dict((line.strip().split(': ') for line in lines if line.strip()))


def write_protocol(protocol):
    entries = []
    for entry in parse_tests():
        if entry.title:
            title = "".join(entry.title)
            entries.append(TR_TD_COLS_4 % title)
        if entry.url:
            url = "".join(entry.url)
            entries.append(TR_TD_URL % (url, url))
        if entry.label:
            id = "id-%s" % entry.id[0].strip()
            label = "".join(entry.label)
            class_name = protocol[id] == "PASS" and "pass" or "fail"
            desc = "\n    ".join(
                [""] + 
                [item.strip(' -*').replace("\"", "&quot;") 
                            for item in entry.desc if item] +
                [""]
            )   
            entries.append(TR_TEST_PROTOCOL % (desc, class_name, label, protocol[id]))
    return entries


def redirect_with_trilling_slash(environ, start_response):  
    status = "301 Moved Permanently"
    url = "".join([
        environ["wsgi.url_scheme"],
        "://",
        environ["SERVER_NAME"], 
        ("SERVER_PORT" in environ and ":" + environ["SERVER_PORT"] or ""),
        environ["REQUEST_URI"],
        "/"])
    start_response(status, [("Location", url)])
    return []
            
def serve_test_form(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    if not check_test_index():
        add_ids_test_index()
    script_repo = environ['SCRIPT_NAME'][0:environ['SCRIPT_NAME'].rfind("/")]
    doc = [TEST_FORM % (script_repo, script_repo, "", FORM), TR_TESTER_AND_CHANGESET_FORM]
    doc.extend(write_index())
    doc.append(TEST_FORM_END)
    return doc

def submit_form(environ, start_response):
    raw_content = environ["wsgi.input"].read()
    submitted = dict([item.split('=') for item in raw_content.split('&')])
    missing = filter(lambda id: not id in submitted or not submitted[id], get_ids())
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    script_repo = environ['SCRIPT_NAME'][0:environ['SCRIPT_NAME'].rfind("/")]
    if missing:
        doc = [TEST_FORM % (script_repo, script_repo, LEGEND_MISSING, FORM), 
                    write_tester_changeset(missing, submitted)]
        doc.extend(write_index_missing(missing, submitted))
        doc.append(TEST_FORM_END)
    else:
        protocol = parse_protocol(store_protocol(submitted))
        doc = [
            TEST_FORM % (script_repo, script_repo, "", ""), 
            TR_TESTER_AND_CHANGESET % (submitted["tester"], submitted["changeset"])
            ]
        doc.extend(write_protocol(protocol))
        doc.append(TEST_END)
    return doc

def serve_index(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    return [INDEX]

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

def list_protocols(protocols):
    ret = []
    for f_name in protocols:
        ret.append(LIST_LINK % ("./show_protocol/" + f_name, f_name))
    return "".join(ret)

def serve_protocols(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    repo = os.path.join(APP_ROOT, 'storage')
    protocols = [f_name for f_name in os.listdir(repo) if f_name.endswith('.protocol')]

    if not check_test_index():
        add_ids_test_index()
    doc = [PROTOCOL_LIST % list_protocols(protocols)]
    return doc

def serve_protocol(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    protocol_path = os.path.join(APP_ROOT, 'storage', environ['PATH_INFO'].split("/")[2])
    protocol = parse_protocol(protocol_path)
    script_repo = environ['SCRIPT_NAME'][0:environ['SCRIPT_NAME'].rfind("/")]
    doc = [
        TEST_FORM % (script_repo, script_repo, "", ""), 
        TR_TESTER_AND_CHANGESET % (protocol["tester"], protocol["changeset"])
        ]
    doc.extend(write_protocol(protocol))
    doc.append(TEST_END)
    return doc


def not_supported(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/plain')]
    start_response(status, response_headers)
    return ['not a supported method: %s' % environ['PATH_INFO']]

handlers = {
    "/": serve_index,
    "/test-form": serve_test_form,
    "/submit-form": submit_form,
    "/protocols": serve_protocols,
    "/show_protocol": serve_protocol
}

def application(environ, start_response):
    if not "PATH_INFO" in environ:
        return redirect_with_trilling_slash(environ, start_response)
    handler = environ['PATH_INFO']
    if handler.count("/") > 1:
        handler = handler[0: handler.find("/", 1)]
    if handler in handlers: 
        return handlers[handler](environ, start_response)
    if '/resources/' in environ['PATH_INFO']:
        return serve_resource(environ, start_response)
    return not_supported(environ, start_response)

def store_protocol(submitted): 
    dd_mm_yy = time.strftime("%d.%m.%y", time.gmtime(time.time()))
    f_name = "%s.%s.protocol" % (dd_mm_yy, submitted["changeset"])
    path = os.path.join(APP_ROOT, 'storage', f_name)
    f = open(path, 'w')
    for key in get_ids():
        f.write("%s: %s\n" % (key, submitted[key]))
    f.close()
    return path

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
    return not state == ERROR


def add_ids_test_index():
    import shutil
    import tempfile
    ID = 1
    LABEL = 2
    DESC = 3
    ERROR = 4
    state = DESC
    in_file = open(TESTS, 'r')
    f_id_count = open(ID_COUNT, 'r')
    id_count = int(f_id_count.readline().strip())
    f_id_count.close()
    f_ids = open(IDS, 'a')
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
                f_ids.write("id-%s\n" % id_count)
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
    in_file.close()
    f_ids.close()
    if state == ERROR:
        raise AssertionError("Not well formed entry!")
    shutil.copy(tmppath, TESTS)
    os.unlink(tmppath)
    f_id_count = open(ID_COUNT, 'w')
    f_id_count.write(str(id_count))
    f_id_count.close()
        
if __name__ == '__main__':
    print "".join(serve_test_form(None, lambda status, response_headers: 0))
