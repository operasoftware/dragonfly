Dragonfly

Directories:

src: source code for dragonfly client
docs: documentation that is not auto-generated
tools: tools needed for building/distributing/testing


Building Dragonfly:

Building dragonfly means concatenating resources together (js and css),
adding a license preamble to files, generating a preloader script for
graphics (not yet implemented) and doing keyword substitution on the source
files to insert version number and so on. It will eventually also do some
stripping of comments to save space.

The build is done using the dfbuild.py tool. This requires python. Currently
it will only work in python2.5, but minimal changes are required to fix this
iff neccessary. There are no module dependencies outside what ships with
python. dfbuild lives in the tools directory in the repository.

This is the command line help for dfbuild:

Usage: dfbuild.py [options] source destination

Destination can be either a directory or a zip file

Options:
  -h, --help            show this help message and exit
  -c, --no-concat       don't concatenate script and css
  -l LICENSE, --license=LICENSE
                        append license file to js and css
  -k key=value, --keyword=key=value
                        A key/value pair. All instances of key will be
                        replaced by value in all files. More than one
                        key/value is allowed by adding more -k switches
  -d, --delete          Delete the destination before copying to it. Makes
                        sure that there are no files left over from previous
                        builds. Is destructive!


Some common command lines:

pyhton tools/dfbuild.py -l license.txt -k "$dfversion$=Dragonfly testversion" -k "$revdate$=<todays datetime>" src build

Build from directory "src" to directory "dst", use license.txt as copyright
header. The $dfversion$ and $revdate$ variables will be used for
interpolation. This is probably what should go out as releases.

pyhton tools/dfbuild.py -l license.txt -k "$dfversion$=Dragonfly testversion" -k "$revdate$=<todays datetime>" src dfpackage.zip

Same as above, but target is a zip file


Running test builds of dragonfly:

Open opera:config#DeveloperTools|DeveloperToolsURL and set the url to the
path to the dragonfly build to use.

