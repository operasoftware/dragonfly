for i, c  in enumerate(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'k']):
    f=open(c +".html", "w")
    f.write("<doctype HTML>\n<h1>iframe no. %s</h1>" % i)
    f.close()