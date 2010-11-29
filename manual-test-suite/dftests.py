
import sys
import os
import time
import string
import re
import time
import webbrowser
from mimetypes import guess_type
from urllib import quote, unquote
from urllib2 import urlopen, URLError
from resources.markup import *

APP_ROOT, file_name = os.path.split(os.path.abspath(__file__))
TESTS = os.path.join(APP_ROOT, "TESTS")
ID_COUNT = os.path.join(APP_ROOT, 'storage', 'ID_COUNT')
ID_COUNT_URL = "http://bitbucket.org/scope/dragonfly-stp-1/raw/tip/manual-test-suite/storage/ID_COUNT"
ID_COUNT_URL_TIMEOUT  = 5
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
        self.deprecated = False

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
    is_pre = False
    pre_sapces = 0
    for line in in_file.readlines():
        if "@pre" in line:
            pre_sapces = line.find("@pre")
            is_pre = True
            line = line.rstrip()
        if "@/pre" in line:
            pre_sapces = 0
            is_pre = False
        if is_pre:
            line = line[pre_sapces:].rstrip() + '\\n'
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

def get_protocol(path):
    """Parse the given protocol.

    Parse the given protocol and return a dictonary with all test ids 
    and there 'PASS' 'FAIL' values.
    """
    f = open(path, 'r')
    lines = f.readlines()
    f.close
    return dict((line.strip().split(': ') for line in lines if line.strip()))

def write_tester_changeset(missing, submitted):
    """Create markup for incomplete form submit response 
    for the 'tester' and 'cangeset' inputs.
    """
    ret = []
    for key in ["tester", "changeset", "browser"]:
        if key in submitted and submitted[key]:
            ret.append(TR_VALUE_CHECK % (
                "submitted",
                key, 
                key, 
                VALUE_DISABLED % submitted[key],
                INPUT_HIDDEN % (key, submitted[key])
                )
            )
        else:
            ret.append(TR_VALUE_CHECK % ("missing", key, key, "", ""))

    return "".join(ret)
    
def write_index_missing(missing, submitted):
    """Create markup for incomplete form submit response with all tests.
    """
    entries = []
    tests = get_tests()
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
    """Create markup for a new form submit with all tests.
    """
    entries = []
    for entry in get_tests():
        if entry.title:
            title = "".join(entry.title)
            entries.append(TR_TD_COLS_4 % title)
        if entry.url:
            url = "".join(entry.url)
            entries.append(TR_TD_URL % (url, url))
        if entry.label:
            id = "id-%s" % entry.id[0].strip()
            label = "".join(entry.label)
            raw_items = [item.replace('"', '&quot;') for item in entry.desc if item]
            string = ""
            items = []
            for item in raw_items:
                if item.startswith('-') or item.startswith('*'):
                    if string:
                        items.append(string)
                    string = item.lstrip('-* ')
                else:
                    string += item
            if string:
                items.append(string)
            desc = "\n    ".join([""] + items + [""]) 
            is_deprecated = entry.deprecated and "class=\"deprecated\" " or ""
            entries.append(TR_TEST % (is_deprecated, desc, label, id, id))
    return entries


def write_protocol(protocol):
    """Create markup for a given protocol with all tests.
    """
    entries = []
    for entry in get_tests():
        if entry.title:
            title = "".join(entry.title)
            entries.append(TR_TD_COLS_4 % title)
        if entry.url:
            url = "".join(entry.url)
            entries.append(TR_TD_URL % (url, url))
        if entry.label:
            id = "id-%s" % entry.id[0].strip()
            if id in protocol:
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

def write_protocols(protocols):
    """Create markup with a list of all protocols.
    """
    ret = []
    for f_name in protocols:
        ret.append(LIST_LINK % ("./show_protocol/" + f_name, f_name))
    return "".join(ret)

def store_protocol(submitted): 
    """Store a complete protocol.

    The file of the stored protocol is <dd>.<mm>.<yy>.<changeset-id>.protocol.
    """
    dd_mm_yy = time.strftime("%d.%m.%y", time.gmtime(time.time()))
    f_name = "%s.%s.%s.protocol" % (dd_mm_yy, submitted["changeset"], submitted["browser"])
    path = os.path.join(APP_ROOT, 'storage', f_name)
    f = open(path, 'w')
    for key in get_ids():
        f.write("%s: %s\n" % (key, submitted[key]))
    f.close()
    return path

def check_test_index():
    """Verify that all tests in the TESTS file have a unique id.
    """
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
    """Add an id to all tests which ware missing one.
    """
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
    # try to get the id count from the bitbucket master repo 
    try:
        resource = urlopen(ID_COUNT_URL, None, ID_COUNT_URL_TIMEOUT)
        master_id_count = int(resource.readline().strip())
        if master_id_count > id_count:
            id_count = master_id_count
    except URLError:
        pass
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

def redirect_with_trailing_slash(environ, start_response):
    """Response if the trilling slash is missing 
    after the cgi script file name.
    """
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

def serve_index(environ, start_response):
    """Serve the entry point of the application.
    """
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    return [INDEX]

def serve_test_form(environ, start_response):
    """Serve a new test form to submit test results.
    """
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    if not check_test_index():
        add_ids_test_index()
    
    script_repo = environ['SCRIPT_NAME'] 
    doc = [TEST_FORM % (script_repo, script_repo, "", FORM), TR_TESTER_AND_CHANGESET_FORM]
    doc.extend(write_index())
    doc.append(TEST_FORM_END)
    return doc

def serve_protocols(environ, start_response):
    """Serve a list of all protocols.
    """
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    repo = os.path.join(APP_ROOT, 'storage')
    protocols = [f_name for f_name in os.listdir(repo) if f_name.endswith('.protocol')]

    if not check_test_index():
        add_ids_test_index()
    doc = [PROTOCOL_LIST % write_protocols(protocols)]
    return doc

def serve_protocol(environ, start_response):
    """Serve a stored protocol with all test results of a previous test.
    """
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    protocol_path = os.path.join(APP_ROOT, 'storage', environ['PATH_INFO'].split("/")[2])
    protocol = get_protocol(protocol_path)
    script_repo = environ['SCRIPT_NAME']
    doc = [
        TEST_FORM % (script_repo, script_repo, "", ""), 
        TR_TESTER_AND_CHANGESET % (protocol["tester"], protocol["changeset"], protocol.get("browser", "-"))
    ]
    doc.extend(write_protocol(protocol))
    doc.append(TEST_END)
    return doc

def check_submitted_form(environ, start_response):
    """Check if the submitted test results are complete.
    """
    request_body_size = int(environ['CONTENT_LENGTH'])
    raw_content = environ["wsgi.input"].read(request_body_size)
    submitted = dict([item.split('=') for item in raw_content.split('&')])
    missing = filter(lambda id: not id in submitted or not submitted[id], get_ids())
    status = '200 OK'
    response_headers = [('Content-type', 'text/html')]
    start_response(status, response_headers)
    script_repo = environ['SCRIPT_NAME']

    if missing:
        doc = [
            TEST_FORM % (script_repo, script_repo, LEGEND_MISSING, FORM), 
            write_tester_changeset(missing, submitted)
        ]
        doc.extend(write_index_missing(missing, submitted))
        doc.append(TEST_FORM_END)
    else:
        protocol = get_protocol(store_protocol(submitted))
        doc = [
            TEST_FORM % (script_repo, script_repo, "", ""), 
            TR_TESTER_AND_CHANGESET % (submitted["tester"], submitted["changeset"], submitted["browser"])
        ]
        doc.extend(write_protocol(protocol))
        doc.append(TEST_END)
    return doc

def serve_static(environ, start_response):
    path_info = environ.get("PATH_INFO", "")
    localpath = os.path.join(APP_ROOT, os.path.normpath(path_info.lstrip('/')))

    if not os.path.isfile(localpath):
        return not_found(environ, start_response)

    mime = guess_type(localpath)[0] or 'text/plain'
    fp = open(localpath, "rb")
    size = os.fstat(fp.fileno())[6]
    response_headers = [
        ('Content-Type', mime),
        ('Content-Length', str(size)),
    ]
    start_response('200 OK', response_headers)
    return [fp.read()]


def not_found(environ, start_response, msg=None):
    status = '404 Not Found'
    response_headers = [('Content-Type', 'text/plain')]
    start_response(status, response_headers)
    return [msg or 'File not found: %s' % environ['PATH_INFO']]


def application(environ, start_response):
    """The main function of the cgi application.
    """
    path_info = environ.get("PATH_INFO", "")
    pos = path_info.find("/", 1)
    handler = pos > -1 and path_info[0:pos] or path_info

    return {
        "": redirect_with_trailing_slash,
        "/": serve_index,
        "/test-form": serve_test_form,
        "/protocols": serve_protocols,
        "/show_protocol": serve_protocol,
        "/resources": serve_static,
        "/submit-form": check_submitted_form, 
        "/test-cases": serve_static,
    }.get(handler, not_found)(environ, start_response)
        
if __name__ == '__main__':
    try:
        from wsgiref.simple_server import make_server
        host = 'localhost'
        port = 8002
        httpd = make_server(host, port, application)
        print "Serving on %s:%s..." % (host, port)
        webbrowser.open("http://%s:%s/" % (host, port))
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass 
    
