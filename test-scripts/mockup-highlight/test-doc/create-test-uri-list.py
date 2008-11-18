import os

URI_LIST = "url-list.xml"
XML = "<root>%s</root>"
URL = "<url>%s</url>"

f = open(URI_LIST, 'w')
f.write( XML % "".join([URL % (url) for url in os.listdir('') if url not in [__file__, URI_LIST]]))
f.close()


