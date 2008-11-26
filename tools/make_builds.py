import os
import subprocess
import dfbuild
import shutil

BUILD_NUM_FILE = "buildnum.txt"
HG_BINARY = "/usr/bin/hg"
HG_LOG_COMMAND = """%s --repository %%s log -r %%s:tip --template '{rev};{node};{branches}\\n' """ % HG_BINARY
HG_UPDATE_TO_BRANCH_COMMAND = """%s --repository %%s update -C -r %%s""" % HG_BINARY
BASE_DIR = """/tmp/runeh/dfbase/"""
DIR_NAME_FORMAT = """dragonfly-%(branch)s-%(revision)s"""

RAW_NAME = """dragonfly-%(branch)s-%(revision)s"""
CONCATENATED_NAME = """dragonfly-%(branch)s-%(revision)s-packaged"""

def get_last_build_rev():
    if os.path.isfile(BUILD_NUM_FILE):
        lastrev = int(open(BUILD_NUM_FILE).read().strip())
    else:
        lastrev = 400
    return lastrev

def get_tip_info(repo):
    subprocess.Popen()

def get_rev_log(path, start):
    cmdline = HG_LOG_COMMAND % (path, start)
    proc = subprocess.Popen(cmdline, shell=True, stdout=subprocess.PIPE)
    log = proc.communicate()[0]

    revlog = []
    
    for line in log.split("\n"):
        # this is dumb, but there is a non-printing char in there that
        # isn't detected by isspace()
        if line.isspace() or not ";" in line: continue  
        
        rev, node, branch = line.split(";")
        revlog.append({'revision': rev,
                       'node': node,
                       'branch': branch or 'default'})
            
    return revlog

def update_to_revision(repo, rev, branch):
    cmdline = HG_UPDATE_TO_BRANCH_COMMAND % (repo, rev)
    print cmdline
    ret = subprocess.call(cmdline, shell=True)
    print "return code", ret
    
def main():
    repo = "repo"
    lastrev = get_last_build_rev()
    log = get_rev_log(repo, lastrev)
    exdirs = ["scripts", "ecma-debugger", "ui-style",  "test-scripts"]
    exdirs = []

    for revision in log:
        update_to_revision(repo, revision["revision"], revision["branch"] )
        builddir = os.path.join(BASE_DIR, DIR_NAME_FORMAT % revision)
        keywords = {"$dfversion$": revision["branch"], "$revdate$": revision["revision"]}
        source = os.path.join(repo, "src")

        rawdir = os.path.join(builddir, RAW_NAME % revision)
        os.makedirs(rawdir)
        dfbuild.export(source, rawdir, keywords=keywords,
                       exclude_dirs=exdirs, process_directives=False)
        dfbuild.make_archive(rawdir, (rawdir + ".zip"))


        #processed = os.path.join(builddir, CONCATENATED_NAME % revision)
        #os.makedirs(processed)
        #dfbuild.export(source, rawdir, keywords=keywords,
        #               exclude_dirs=exdirs)
        #
        #dfbuild.localize_buildout(rawdir, "src/ui-strings")

#
#export(src, dst, process_directives=options.concat, exclude_dirs=exdirs,
#               keywords=keywords, directive_vars=dirvars)
#        if options.translate_build:
#            _localize_buildout(dst, "src/ui-strings")



main()