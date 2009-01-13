import socket, asyncore, os, re, string, sys

CRLF = '\r\n'
BUFFERSIZE = 8192
RE_HEADER = re.compile(": *")
RESPONSE = \
    'HTTP/1.1 %s %s' + CRLF + \
    'Content-Type: %s' + CRLF + \
    'Content-Length: %s' + CRLF + \
    'Cache-Control: max-age=0, must-revalidate' + CRLF + \
    'Connection: close' + 2 * CRLF + \
    '%s'
    
REDIRECT = \
    'HTTP/1.1 301 Moved Permanently' + CRLF + \
    'Location: %s' + 2 * CRLF

MIME = \
{
    '.html': 'text/html',
    '.js': 'apllication/x-javascript',
    '.css': 'text/css',
    '.ico': 'image/x-icon',
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.xml': 'application/xml'
}

DIR_VIEW = \
    """
    <!doctype html>
    <html>
    <head>
    <title> </title>
    <style>
    body 
    {
      font-family:"Lucida Sans Unicode", sans-serif;
      font-size:.8em;
    }
    ul 
    {
      list-style:none;
      margin:0;
      padding:0;
    }
    li 
    {
      padding-left:0;
    }
    a 
    {
      text-decoration:none;
    }
    icon
    {
      display:inline-block;
      background-repeat:no-repeat;
      vertical-align:middle;
      width:-o-skin;
      height:-o-skin;
      margin-right:3px;
    }
    .directory icon
    {
      background-image:-o-skin('Folder');
    }
    .file icon
    {
      background-image:-o-skin('Window Document Icon');
    }   
    </style>
    </head>
    <body>
    <ul>%s</ul>
    </body>
    </html>
    """
    
ITEM_DIR = "<li class='directory'><icon></icon><a href='./%s/'>%s</a></li>"
ITEM_FILE = "<li class='file'><icon></icon><a href='./%s'>%s</a></li>"



UNRESERVED = frozenset([c for s in \
    [
        string.uppercase,
        string.lowercase,
        string.digits,
        ['-', '_', '.', '!', '~', '*', '\'', '(', ')', ';', '/', '?', ':', '@', '&', '=', '+', '$', ',' '#']
    ] for c in s])

def encodeURI(str):
    return "".join([c in UNRESERVED and c or "%s%x" % ( "%", ord(c)) for c in str])
    
def decodeURI(str):
    return re.sub(r"%([0-9a-fA-F]{2})", lambda m: chr(int(m.group(1), 16)), str)

def webURIToSystemPath(path):
    return os.path.sep.join([decodeURI(part) for part in path.split('/')])

def systemPathToWebUri(path):
    return "/".join([encodeURI(part) for part in path.split(os.path.sep)])

class SimpleServer(asyncore.dispatcher):
    
    def __init__(self, host, port, handle_shut_down, tests):
        asyncore.dispatcher.__init__(self)
        self.create_socket(socket.AF_INET, socket.SOCK_STREAM)
        self.bind((host, port))
        self.listen(5)
        self.handle_shut_down = handle_shut_down 
        self.tests = tests
        self.cur_test = None
        self.user_agent_stored = False
        self.results = {}
        
    def handle_accept(self): 
        newSocket, address = self.accept()
        Connection(newSocket, address, self)

    def shut_down(self):
        self.close()
        if self.handle_shut_down:
            self.handle_shut_down(self.results)


class Connection(asyncore.dispatcher):

    def __init__(self, conn, addr, server):        
        asyncore.dispatcher.__init__(self, sock=conn)
        self.addr = addr
        self.in_buffer = ""
        self.out_buffer = ""
        self.content_length = 0        
        self.check_input = self.read_headers
        self.on_close = None
        self.server = server
       
    def read_headers(self):
        if 2*CRLF in self.in_buffer:
            headers_raw, self.in_buffer = self.in_buffer.split(2*CRLF, 1)
            first_line, headers_raw = headers_raw.split(CRLF, 1)
            method, path, protocol = first_line.split(' ', 2)
            path = path.lstrip("/")
            self.headers = dict([RE_HEADER.split(line, 1) for line in headers_raw.split(CRLF)])
            self.method = method
            self.path = path

            if not self.server.user_agent_stored:
                self.server.results['UA'] = self.headers['User-Agent']
                self.server.user_agent_stored = True
            
            if method == "POST":
                if "Content-Length" in self.headers:
                    self.content_length = int(self.headers["Content-Length"])
                    self.boundary = self.headers["Content-Type"].split("boundary=")[1].strip("-")
                    self.check_input = self.read_content
                    self.check_input()                
                else:
                    self.onerror("missing Content-length in POST")
               
            elif method == "GET":
                self.content_length = 0
                if self.server.cur_test and self.path == self.server.cur_test['name']:
                    mime = self.server.cur_test['mime']
                    content = self.server.cur_test['test']
                    self.out_buffer = RESPONSE % (200, 'OK', mime, len(content), content)

                elif os.path.exists(webURIToSystemPath(self.path)):
                    self.serve(self.path)

                elif self.path == "start":
                    self.next_test()
                    
                elif self.path == "stop":
                    self.on_close = self.shut_down
                    self.out_buffer = RESPONSE % (200, 'OK', 'text/plain', 0, '') 

                elif self.path == "":
                    if self.server.tests:
                        self.next_test()
                    else:
                        self.serve("")
                else:
                    self.out_buffer = RESPONSE % (404, 'NOT FOUND', 'text/plain', 0, '')

                self.check_input()
                
            else:
                self.onerror("broken\nnot supported method: %s" % method)

    def read_content(self):
        if len(self.in_buffer) >= self.content_length:
            raw_content = self.in_buffer[0:self.content_length]
            self.in_buffer = self.in_buffer[self.content_length:]
            entries = {}
            
            for raw_entry in raw_content.split(self.boundary):
                if 2*CRLF in raw_entry:
                    raw_key, value = raw_entry[0:raw_entry.rfind(CRLF)].split(2*CRLF, 1)
                    
                    if "name=" in raw_key:
                        key = raw_key.split("name=", 1)[1].strip("\"")
                        entries[key] = value
                        
                    else:
                        self.onerror("broken\n'name=' is missing: %s" % raw_key)
            
            if "file" in entries and "file-name" in entries:
                self.server.results[entries["file-name"]] = entries["file"]
                self.next_test()
                self.in_buffer = ''
                
            else:
                self.onerror("not enough keys in content in parsing POST")
            
            self.check_input = self.read_headers
            self.check_input()
            
    def handle_read(self):
        self.in_buffer += self.recv(BUFFERSIZE)
        self.check_input()
        
    def next_test(self):
      if self.server.tests:
          try:
              self.server.cur_test = self.server.tests.next()
              self.out_buffer =  REDIRECT % self.server.cur_test['name']
          except:
              self.on_close = self.shut_down
              self.out_buffer = RESPONSE % (200, 'OK', 'text/plain', 8, 'ok, done')  
        
    def serve(self, path):
        system_path = webURIToSystemPath(path.rstrip("/")) or ""
        if os.path.isfile(system_path):
            ending = "." in path and path[path.rfind("."):] or "no-ending"
            mime = ending in MIME and MIME[ending] or 'text/plain'

            try:
                f = open(system_path, 'rb')
                content = f.read()
                f.close()            
                self.out_buffer = RESPONSE % (200, 'OK', mime, len(content), content)
                            
            except:
                self.out_buffer = RESPONSE % (404, 'NOT FOUND', 'text/plain', 0, '')
            
        elif os.path.isdir(system_path) or path == "":
            if len(path) and not path[-1] == '/':
                self.out_buffer =  REDIRECT % ( path + '/' )
            else:
              try:
                  items_dir = [item for item in os.listdir(system_path) if os.path.isdir(os.path.join(system_path, item))]
                  items_file = [item for item in os.listdir(system_path) if os.path.isfile(os.path.join(system_path, item))]
                  items_dir.sort()
                  items_file.sort()
                  if len(path):
                      items_dir.insert(0, '..')
                  markup = [ITEM_DIR % (encodeURI(item), item) for item in items_dir]
                  markup.extend([ITEM_FILE % (encodeURI(item), item) for item in items_file])
                  content = DIR_VIEW % ( "".join(markup) )
                  self.out_buffer = RESPONSE % (200, 'OK', "text/html", len(content), content)
              except Exception, msg:
                  content = DIR_VIEW % "<li><h1>no access</h1></li>"
                  self.out_buffer = RESPONSE % (200, 'OK', "text/html", len(content), content) 
        
    def onerror(self, msg):
        self.out_buffer = RESPONSE % (200, 'OK', 'text/plain', len(msg), msg)
        
    def writable(self):
        return (len(self.out_buffer) > 0)
        
    def handle_write(self):
        sent = self.send(self.out_buffer)
        self.out_buffer = self.out_buffer[sent:]
        if not len(self.out_buffer):
            self.close()
            if self.on_close:
                self.on_close()
    
    def shut_down(self):
        self.server.shut_down()
        
        
    def handle_close(self):
        self.close()


def run_tests(cb, tests, host = "localhost", port = 8881):
    SimpleServer(host, port, cb, tests)
    print "go to: http://%s:%s/" % ( host, port )
    asyncore.loop()
    
if __name__ == "__main__":
    if "-r" in sys.argv and len(sys.argv) > sys.argv.index("-r"):
        os.chdir(sys.argv[sys.argv.index("-r") + 1])
    
    
    
    run_tests(None, None, host = "localhost", port = 8881)
  
