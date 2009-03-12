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
        scope.setSendCommand(self.send_command_STP_0)
        
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
