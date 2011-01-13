import os
import sys

MAC_CHECK = """<script><![CDATA[
if( navigator.userAgent.indexOf('Macintosh') != -1 && Number(opera.buildNumber()) <= 4789  )
{
  location.href = "https://dragonfly.opera.com/error.html";
}
]]></script>
"""

def remove_mac_check(target):
    os.chdir(target)
    for root, dirs, files in os.walk('.'):
        for fn in files:
            if fn.startswith('client-') and fn.endswith('.xml'):
                path = os.path.join(root, fn)
                f = open(path, 'rb')
                c = f.read()
                f.close()
                if MAC_CHECK in c:
                    print path
                    f = open(path, 'wb')
                    f.write(c.replace(MAC_CHECK, ""))
                    f.close()
    return 0
                    
if __name__ == '__main__':
    if len(sys.argv) == 2:
        sys.exit(remove_mac_check(sys.argv[1]))
    else:
        sys.exit("use with a target path.")
