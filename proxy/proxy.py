from Connection import Connection
from ScopeConnection import ScopeConnection
from SimpleServer import SimpleServer, asyncore
from common import DefaultOptions

def run_proxy(options=DefaultOptions(), count=None): 
    SimpleServer(options.host, options.server_port, Connection, options)
    SimpleServer(options.host, options.proxy_port, ScopeConnection, options)
    print "server on: http://%s:%s/" % ( 
                options.host or "localhost", options.server_port )
    asyncore.loop(timeout = 0.1, count = count)

if __name__ == "__main__":
    import sys
    import os
    from optparse import OptionParser
    default_options = DefaultOptions()
    parser = OptionParser("""%prog [options]
    
Exit: Control-C
    
Settings:  an optional file CONFIG does overwrite the defaults    
   host:
   root: .
   server_port: 8002
   proxy_port: 7001
   debug: False
   format: False""")
    parser.add_option(
        "-d", "--debug",
        action = "store_true", 
        dest = "debug", 
        default = default_options.debug,
        help = "print message flow"
        )
    parser.add_option(
        "-f", "--format",
        action="store_true", 
        dest = "format", 
        default = default_options.format,
        help = "pretty print message flow"
        )
    parser.add_option(
        "-r", "--root", 
        dest = "root", 
        default = default_options.root,
        help = "the root directory of the server; default %s" % (
                    default_options.root)
        )
    parser.add_option(
        "-p", "--proxy-port",
        dest = "proxy_port", 
        type="int",
        default = default_options.proxy_port,
        help = "proxy port; default %s" % default_options.proxy_port
        )
    parser.add_option(
        "-s", "--server-port",
        dest = "server_port", 
        type="int",
        default = default_options.server_port,
        help = "server port; default %s" % default_options.server_port
        )
    parser.add_option(
        "--host",
        dest = "host", 
        default = default_options.host,
        help = "host; default %s" % default_options.host
        )
    options, args = parser.parse_args()
    os.chdir(options.root) 
    try:
        run_proxy(options)
    except KeyboardInterrupt:
        pass
    """
    import cProfile, sys
    p=open("profile", "w")
    sys.stdout = p
    cProfile.run("run_proxy(count = 5000, context = options)")
    p.close()
    """
  