from common import *


class SimpleServer(asyncore.dispatcher):
    
    def __init__(self, host, port, connection_class, context):
        asyncore.dispatcher.__init__(self)
        self.create_socket(socket.AF_INET, socket.SOCK_STREAM)
        self.bind((host, port))
        self.listen(5)
        self.connection_class = connection_class
        self.context = context
        
    def handle_accept(self): 
        newSocket, address = self.accept()
        self.connection_class(newSocket, address, self.context)