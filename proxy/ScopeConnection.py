from common import *

"""Initialisation, command and message flow for STP 0 

            Opera              proxy                 client

*services     ---------------->
                                    ----------------->   *services
                                    <-----------------   *enable
*enable       <----------------
data          <--------------------------------------->  data
                                ....
                                    <------------------  *quit
*disable      <----------------
*quit         ---------------->
                                    ------------------>  *hostquit
                                    ------------------>  *quit
"""

class ScopeConnection(asyncore.dispatcher):
    """To handle the socket connection to scope.
    """

    def __init__(self, conn, addr, context):        
        asyncore.dispatcher.__init__(self, sock=conn)
        self.addr = addr
        self.debug = context.debug
        self.debug_format = context.format
        # setup to handle STP 0 meassages
        self.in_buffer = u""
        self.out_buffer = ""
        self.handle_read = self.handle_read_STP_0
        self.check_input = self.read_int_STP_0
        self.msg_length = 0
        self.stream = codecs.lookup('UTF-16BE').streamreader(self)
        scope.setConnection(self)



        self.varint = 0
        self.varint_cursor = 0
        self.binary_buffer = ""
        self.msg_buffer = []
        self.parse_msg_states_cursor = 0
        self.parse_msg_state = ""
        self.parse_msg_states = [
            "service_id", 
            "command_id", 
            "type_field", 
            "client_mask", 
            "tag", 
            "chunksize"
            ]
        
    def send_command_STP_0(self, msg):
        """ to send a message to scope"""
        if self.debug:
            if self.debug_format:
                service, payload = msg.split(BLANK, 1)
                print "\nsend to scope:", service, formatXML(payload)
            else:
                print "send to scope:", msg
        self.out_buffer += ("%s %s" % (len(msg), msg)).encode("UTF-16BE")
        self.handle_write()
        
    def read_int_STP_0(self):
        if BLANK in self.in_buffer:
            raw_int, self.in_buffer = self.in_buffer.split(BLANK, 1)
            self.msg_length = int(raw_int)
            self.check_input = self.read_msg_STP_0
            self.check_input()

    def read_msg_STP_0(self):
        if len(self.in_buffer) >= self.msg_length:
            command, msg = self.in_buffer[0:self.msg_length].split(BLANK, 1)
            msg = msg.encode("UTF-8")
            command = command.encode("UTF-8")
            if command == "*services":
                services = msg.split(',')
                print "services available:\n ", "\n  ".join(services)
                scope.setServiceList(services)
                for service in services:
                    scope.commands_waiting[service] = []
                    scope.services_enabled[service] = False
            elif command in scope.services_enabled:
                if connections_waiting:
                    connections_waiting.pop(0).sendScopeEvent(
                            (command, msg), self)
                else:
                    scope_messages.append((command, msg))
            self.in_buffer = self.in_buffer[self.msg_length:]
            self.msg_length = 0
            self.check_input = self.read_int_STP_0
            self.check_input()

    def read(self, max_length):
        """to let the codec stramreader class treat 
        the class itself like a file object"""
        try: 
            return self.recv(max_length)
        except socket.error: 
            return ''

    def handle_read_STP_0(self):
        self.in_buffer += self.stream.read(BUFFERSIZE)
        self.check_input()

    def handle_read_STP_1(self):
        self.in_buffer += self.recv(BUFFERSIZE)
        self.check_input()

    def setInitializerSTP_1(self):
        if self.in_buffer or self.out_buffer:
            raise Exception("read or write buffer is not empty in setInitializerSTP_1")
        self.in_buffer = ""
        self.out_buffer = ""
        self.handle_read = self.read_stp_1_initializer
        self.check_input = None
        self.msg_length = 0
        delattr(self, 'stream')

    def read_stp_1_initializer(self):
        self.in_buffer += self.recv(BUFFERSIZE)
        if self.in_buffer.startswith("STP/1\n"):
            print self.in_buffer[0:6]
            self.in_buffer = self.in_buffer[6:]
            self.setup_stp_1()
            
    
    def setup_stp_1(self):
        self.handle_read = self.handle_read_STP_1
        self.check_input = self.read_varint
        if self.in_buffer:
            self.check_input()


    def read_varint(self):
        while self.in_buffer:
            byte, self.in_buffer = ord(self.in_buffer[0]), self.in_buffer[1:]
            self.varint += ( byte & 0x7f ) << self.varint_cursor * 7
            self.varint_cursor += 1
            if not byte & 0x80:
                # print 'varint', self.parse_msg_state, self.varint
                if self.parse_msg_state == "chunksize":
                    if self.varint:
                        self.check_input = self.read_binary
                    else:
                        self.msg_buffer.append(self.binary_buffer)
                        # handle msg
                        if self.debug: 
                            print ( "service: %s\n" 
                                    "command: %s\n"
                                    "status: %s\n"
                                    "type: %s\n"
                                    "cid: %s\n"
                                    "tag: %s\n"
                                    "data: %s" ) % tuple(self.msg_buffer)
                        self.varint = 0
                        self.varint_cursor = 0
                        self.binary_buffer = ""
                        self.msg_buffer = []
                        self.parse_msg_states_cursor = 0
                        self.parse_msg_state = ""
                else:
                    if self.parse_msg_state == "type_field":
                        self.msg_buffer.extend([self.varint >> 2, self.varint & 0x3])
                    else:
                        self.msg_buffer.append(self.varint)
                    self.parse_msg_states_cursor += 1
                    self.parse_msg_state = self.parse_msg_states[self.parse_msg_states_cursor]
                    self.varint = 0
                    self.varint_cursor = 0

                if self.in_buffer:
                    self.check_input()
                break
            if self.varint_cursor > 4:
                raise Exception("broken varint")

    def read_binary(self):
        if len(self.in_buffer) >= self.varint:
            self.binary_buffer += self.in_buffer[0:self.varint]
            self.in_buffer = self.in_buffer[self.varint:]
            # print 'read_binary varint', self.varint, '\nread_binary in_buffer', self.in_buffer, '\nbinary_buffer', self.binary_buffer
            self.varint = 0
            self.varint_cursor = 0
            self.check_input = self.read_varint
            if self.in_buffer:
                self.check_input()
        


    # Implementations of the asyncore.dispatcher class methods
    def handle_read(self):
        pass
                
    def writable(self):
        return (len(self.out_buffer) > 0)
        
    def handle_write(self):
        sent = self.send(self.out_buffer)
        self.out_buffer = self.out_buffer[sent:]

    def handle_close(self):
        scope.reset()
        self.close()
