from common import *


from mimetypes import types_map 

class Connection(asyncore.dispatcher):
    """To handle a http request in the context of providing
    a http interface to the scope protocol. The purpose of this interface
    is mainly to develop Dragonfly, not to used it for actual debugging.

    GET is used to retrieve html and related resources for the client
    and message of scope. The path is used as follow:
         
        /file/<path> to retrieve resources
        /services to get a list of available services
        /enable/<service name> to enable the given service
        /scope-message to get a pending message or to wait for the next one
            the target service is added in 
            a custom header field 'X-Scope-Message-Service' 
        /quite to quit the session, not implemented

    POST is used to send a command to a given service. 
    The path is the target service, 
    the body of the POST is the arguments object.

        /<service name>
    """

    def __init__(self, conn, addr, context):        
        asyncore.dispatcher.__init__(self, sock = conn)
        self.addr = addr
        self.in_buffer = ""
        self.out_buffer = ""
        self.content_length = 0        
        self.check_input = self.read_headers
        self.query = ''
        # Timeout acts also as flag to signal 
        # a connection which still waits for a response 
        self.timeout = 0
        self.debug = context.debug
        self.debug_format = context.format

    def sendScopeEvent(self, msg, sender):
        """ return a message to the client"""
        service, payload = msg
        if self.debug:
            if self.debug_format:
                print "\nsend to client:", service, formatXML(payload)
            else:
                print "send to client:", service, payload
        self.out_buffer += SCOPE_MESSAGE % (
            getTimestamp(), 
            service, 
            len(payload), 
            payload
        )
        self.timeout = 0
        if not sender == self:
            self.handle_write()

    def read_headers(self):
        if 2*CRLF in self.in_buffer:
            headers_raw, self.in_buffer = self.in_buffer.split(2*CRLF, 1)
            first_line, headers_raw = headers_raw.split(CRLF, 1)
            method, path, protocol = first_line.split(BLANK, 2)
            path = path.lstrip("/")
            if "?" in path:
                path, self.query = path.split('?', 1)
            self.headers = dict(( RE_HEADER.split(line, 1) 
                                    for line in headers_raw.split(CRLF) ))
            try: 
                command, path = path.split("/", 1)
            except ValueError: 
                command, path = path, ""
            self.method = method
            self.path = path
            self.command = command
            self.timeout = time() + TIMEOUT
            # POST
            if method == "POST":
                if "Content-Length" in self.headers:
                    self.content_length = int(self.headers["Content-Length"])
                    self.check_input = self.read_content
                    self.check_input()                
            # GET
            elif method == "GET":
                self.content_length = 0
                if command == "file":
                    self.serve(path)
                elif command == "services":
                    if connections_waiting:
                        print ">>> failed, connections_waiting is not empty"
                    content = SERVICE_LIST % "".join (
                        [SERVICE_ITEM % service.encode('utf-8') 
                                for service in scope.serviceList] 
                    )
                    self.out_buffer += RESPONSE_SERVICELIST % ( 
                        getTimestamp(), 
                        len(content), 
                        content
                    )
                    self.timeout = 0
                elif command == "enable":
                    if scope.services_enabled[path]:
                        print ">>> service is already enabled", path
                    else:
                        scope.sendCommand("*enable %s" % path)
                        scope.services_enabled[path] = True
                        while scope.commands_waiting[path]:
                            scope.sendCommand(
                                    scope.commands_waiting[path].pop(0))
                    self.out_buffer += RESPONSE_OK_OK % getTimestamp()
                    self.timeout = 0
                elif command == "scope-message":
                    if scope_messages:
                        self.sendScopeEvent(scope_messages.pop(0), self)
                    else:
                        connections_waiting.append(self)                    
                elif command == "favicon.ico":
                    self.serve(path_join(sys.path[0], "favicon.ico"))
                elif not command:
                    self.out_buffer +=  REDIRECT % ( getTimestamp(), "file/" )
                    self.timeout = 0
                if self.in_buffer:
                    self.check_input()
            # Not implemented method
            else:
                self.out_buffer += NOT_FOUND % getTimestamp()
                self.timeout = 0

    def read_content(self):
        if len(self.in_buffer) >= self.content_length:
            raw_data = self.in_buffer[0:self.content_length] 
            if not raw_data.startswith("<?xml"):
                raw_data = XML_PRELUDE % raw_data  
            msg = "%s %s" % (self.command, raw_data.decode('UTF-8'))
            if scope.services_enabled[self.command]:
                scope.sendCommand(msg)
            else:
                scope.commands_waiting[self.command].append(msg)
            self.out_buffer += RESPONSE_OK_OK % getTimestamp()
            self.timeout = 0
            self.in_buffer = self.in_buffer[self.content_length:]
            self.check_input = self.read_headers
            if self.in_buffer:
                self.check_input()

    def serve(self, path):
        system_path = webURIToSystemPath(path.rstrip("/")) or ""
        if path_exists(system_path) or path == "":
            if isfile(system_path):
                if "If-Modified-Since" in self.headers and \
                   timestampToTime(self.headers["If-Modified-Since"]) >= \
                   int(stat(system_path).st_mtime):
                    self.out_buffer += NOT_MODIFIED % getTimestamp()
                    self.timeout = 0
                else:
                    ending = "." in path and path[path.rfind("."):] or \
                                "no-ending"
                    mime = ending in types_map and types_map[ending] or 'text/plain'
                    try:
                        f = open(system_path, 'rb')
                        content = f.read()
                        f.close()            
                        self.out_buffer += RESPONSE_OK_CONTENT % (
                            getTimestamp(),
                            'Last-Modified: %s%s' %  (
                                getTimestamp(system_path), 
                                CRLF
                            ),
                            mime, 
                            len(content), 
                            content
                        )
                        self.timeout = 0         
                    except:
                        self.out_buffer += NOT_FOUND % getTimestamp()
                        self.timeout = 0
            elif isdir(system_path) or path == "":
                if path and not path.endswith('/'):
                    self.out_buffer +=  REDIRECT % ( 
                                            getTimestamp(), path + '/' )
                    self.timeout = 0
                else:
                    try:
                        items_dir = [item for item in listdir(system_path) 
                                        if isdir(path_join(system_path, item))]
                        items_file = [item for item in listdir(system_path) 
                                        if isfile(path_join(system_path, item))]
                        items_dir.sort()
                        items_file.sort()
                        if path:
                            items_dir.insert(0, '..')
                        markup = [ITEM_DIR % (encodeURI(item), item) 
                                        for item in items_dir]
                        markup.extend([ITEM_FILE % (encodeURI(item), item) 
                                            for item in items_file])
                        content = DIR_VIEW % ( "".join(markup) )
                    except:
                        content = DIR_VIEW % "<li><h1>no access</h1></li>"
                    self.out_buffer += RESPONSE_OK_CONTENT % ( 
                        getTimestamp(), 
                        '', 
                        "text/html", 
                        len(content), 
                        content
                    )
                    self.timeout = 0
        else:
            self.out_buffer += NOT_FOUND % getTimestamp()
            self.timeout = 0

    # Implementations of the asyncore.dispatcher class methods
    def handle_read(self):
        try:
            self.in_buffer += self.recv(BUFFERSIZE)
            self.check_input()
        except Exception, msg:
            print ">>> handle_read in Connection failed: ", msg, self.in_buffer
    
    def writable(self):
        if self.timeout and time() > self.timeout and not self.out_buffer:
            if self in connections_waiting:
                connections_waiting.remove(self)
                if not self.command == "scope-message": 
                    print ">>> failed, wrong connection type in queue" 
                self.out_buffer += RESPONSE_TIMEOUT % getTimestamp()
            else:
                self.out_buffer += NOT_FOUND % getTimestamp()
            self.timeout = 0
        return (len(self.out_buffer) > 0)
        
    def handle_write(self):
        try:
            sent = self.send(self.out_buffer)
            self.out_buffer = self.out_buffer[sent:]
        except Exception, msg:
            print ">>> handle_write failed: ", msg

    def handle_close(self):
        if self in connections_waiting:
            connections_waiting.remove(self)
        self.close()
