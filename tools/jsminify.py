import types
import sys
import os
import shutil
import codecs
import tempfile
import optparse
import string
import StringIO
import collections

# Backward compat for pre 2.6 when namedtuple didn't exist
if hasattr(collections, "namedtuple"):
    Token = collections.namedtuple("Token", "type, value")
else:
    Token = lambda *x: tuple(x)


class JSTokenizer(object):
    LINETERMINATOR = (u'\u000A', u'\u000D', u'\u2028', u'\u2029')
    STRING_WHITESPACE = 'WHITESPACE'
    STRING_LINETERMINATOR = 'LINETERMINATOR'
    STRING_IDENTIFIER = 'IDENTIFIER'
    STRING_PUNCTUATOR = 'PUNCTUATOR'
    STRING_DIV_PUNCTUATOR = 'DIV_PUNCTUATOR'
    STRING_NUMBER = 'NUMBER'
    STRING_STRING = 'STRING'
    STRING_REG_EXP = 'REG_EXP'
    STRING_COMMENT = 'COMMENT'
    STRING_KEYWORD = 'KEYWORD'
    KEYWORDS = (
        'break', 'else', 'new', 'var', 'case', 'finally',
        'return', 'void', 'catch', 'for', 'switch', 'while',
        'continue', 'function', 'this', 'with', 'default',
        'if', 'throw', 'delete', 'in', 'try', 'do', 'instanceof',
        'typeof', 'abstract', 'enum', 'int', 'short', 'boolean',
        'export', 'interface', 'static', 'byte', 'extends', 'long',
        'super', 'char', 'final', 'native', 'synchronized',
        'class', 'float', 'package', 'throws', 'const', 'goto',
        'private', 'transient', 'debugger', 'implements',
        'protected', 'volatile', 'double', 'import', 'public')

    def __init__(self, input):
        """ token_handler must have an input and an ontoken and onfinish handler """
        self._input = input
        self._char = ''
        self._previous_value = ''
        self._type = ''
        self._string_delimiter = ''
        self._buffer = ''
        self._previous_type = ''
        self._input_str = self.next_char()

    def __iter__(self):
        return self.tokeniter()

    def tokeniter(self):
        for token in self.default_parser():
            if token:
                yield token

        # this is a little bit hacky. Makes sure we consume last token
        self._buffer += self._char
        token = self.read_buffer('')
        if token:
            yield token

    def next_char(self):
        for char in self._input.read():
            self._buffer += self._char
            self._char = char
            yield char

    def read_buffer(self, next_type):
        token = None
        if self._buffer:
            if self._type == self.STRING_IDENTIFIER and self._buffer in self.KEYWORDS:
                token = Token(self.STRING_KEYWORD, self._buffer)
            else:
                token = Token(self._type, self._buffer)

            if not self._type == self.STRING_WHITESPACE:
                self._previous_type = self._type

            self._previous_value = (self._type == self.STRING_PUNCTUATOR) and self._buffer \
                or (self._type == self.STRING_WHITESPACE) and self._previous_value \
                or ''
        self._buffer = ''
        self._type = next_type
        return token

    def default_parser(self):
        WHITESPACE = (u'\u0009', u'\u000B', u'\u000C', u'\u0020', u'\u00A0')
        PUNCTUATOR_2 = ('<=', '>=', '==', '!=', '===', '!==', '++', '--',
                        '<<', '>>', '>>>', '&&', '||', '+=', '-=', '*=',
                        '%=', '<<=', '>>=', '>>>=', '&=', '|=', '^=')
        char = ''
        while True:
            if char in WHITESPACE:
                yield self.read_buffer(self.STRING_WHITESPACE)
                char = self._input_str.next()
                while char in WHITESPACE:
                    char = self._input_str.next()
                yield self.read_buffer(self.STRING_IDENTIFIER)
            if char in self.LINETERMINATOR:
                yield self.read_buffer(self.STRING_LINETERMINATOR)
                char = self._input_str.next()
                while char in self.LINETERMINATOR:
                    char = self._input_str.next()
                yield self.read_buffer(self.STRING_IDENTIFIER)
                continue
            if char in string.digits:
                yield self.read_buffer(self.STRING_NUMBER)
                char = self._input_str.next()
                if char == 'x' or char == 'X':
                    char = self._input_str.next()
                    char = self.number_hex_parser(char)
                else:
                    char = self.number_dec_parser(char)
                yield self.read_buffer(self.STRING_IDENTIFIER)
                continue
            if char in ('"', '\''):
                yield self.read_buffer(self.STRING_STRING)
                self._string_delimiter = char
                char = self._input_str.next()
                char = self.string_parser(char)
                yield self.read_buffer(self.STRING_IDENTIFIER)
                continue
            if char == '.' or char == '+' or char == '-':
                yield self.read_buffer(self.STRING_PUNCTUATOR)
                punct_buffer = char
                char = self._input_str.next()
                punct_buffer += char
                if char in string.digits:
                    self._type = self.STRING_NUMBER
                    char = self.number_dec_parser(char)
                else:
                    while punct_buffer in PUNCTUATOR_2:
                        char = self._input_str.next()
                        punct_buffer += char
                yield self.read_buffer(self.STRING_IDENTIFIER)
                continue
            if char in ('{', '}', '(', ')', '[', ']', ';', ',', '<', '>',
                        '=', '!', '+', '-', '*', '%', '&', '|', '^', '~',
                        '?', ':', '.'):
                yield self.read_buffer(self.STRING_PUNCTUATOR)
                punct_buffer = char
                char = self._input_str.next()
                punct_buffer += char
                while punct_buffer in PUNCTUATOR_2:
                    char = self._input_str.next()
                    punct_buffer += char
                self._previous_value = self._buffer
                yield self.read_buffer(self.STRING_IDENTIFIER)
                continue
            if char == '/':
                yield self.read_buffer(self.STRING_COMMENT)
                char = self._input_str.next()
                if char == '*':
                    char = self._input_str.next()
                    char = self.multiline_comment_parser(char)
                elif char == '/':
                    char = self._input_str.next()
                    char = self.singleline_comment_parser(char)
                elif self._previous_type == self.STRING_IDENTIFIER \
                        or  self._previous_type == self.STRING_NUMBER \
                        or (self._previous_type == self.STRING_PUNCTUATOR \
                             and  self._previous_value in (')', ']')):
                    self._type = self.STRING_DIV_PUNCTUATOR
                    if char == '=':
                        char = self._input_str.next()
                else:
                    self._type = self.STRING_REG_EXP
                    char = self.reg_exp_parser(char)
                yield self.read_buffer(self.STRING_IDENTIFIER)
                continue
            char = self._input_str.next()

    def number_hex_parser(self, char):
        while char in string.hexdigits:
            char = self._input_str.next()
        return char

    def number_dec_parser(self, char):
        while char in string.digits or char == '.':
            char = self._input_str.next()
        if char == 'e' or char == 'E':
            char = self._input_str.next()
            if char == '+' or char == '-':
                char = self._input_str.next()
            while char in string.digits:
                char = self._input_str.next()
        return char

    def string_parser(self, char):
        while True:
            if char == '\\':  # \u005C
                self._input_str.next()
                char = self._input_str.next()
                continue
            if char == self._string_delimiter:
                char = self._input_str.next()
                return char
            char = self._input_str.next()

    def multiline_comment_parser(self, char):
        while True:
            if char == '*':
                char = self._input_str.next()
                if char == '/':
                    char = self._input_str.next()
                    return char
                continue
            char = self._input_str.next()

    def singleline_comment_parser(self, char):
        while True:
            if char in self.LINETERMINATOR:
                return char
            char = self._input_str.next()

    def reg_exp_parser(self, char):
        is_in_brackets = False
        while True:
            if char == '[':
                is_in_brackets = True
            if is_in_brackets and char == ']':
                is_in_brackets = False
            if char == '\\':
                char = self._input_str.next()
                char = self._input_str.next()
                continue
            if not is_in_brackets and  char == '/':
                char = self._input_str.next()
                while char in ("gim"):
                    char = self._input_str.next()
                return char
            char = self._input_str.next()


class Minify(object):
    """Minify class, handling minification frome one file to another"""

    def __init__(self, input, output, encoding="utf_8"):
        """ only new lines and white spaces which are safe to remove are removed
            input and output must be file like objects """
        self.input = input
        self.output = output
        self.tokens = [('', ''), ('', ''), ('', '')]
        self.buffersize = 2
        self.out = []

        for token in JSTokenizer(input):
            self.ontoken(token)
        self.onfinish()

    def onfinish(self):
        self.buffersize = 0
        self.tokens += [('', ''), ('', '')]
        self.ontoken(('', ''))

        for token in self.out:
            self.output.write(token)

    def ontoken(self, token):
        """
        token is a tuple, firts position is the token type, second position the token
        """
        tokens = self.tokens
        WHITESPACE = 'WHITESPACE'
        LINETERMINATOR = 'LINETERMINATOR'
        IDENTIFIER = 'IDENTIFIER'
        PUNCTUATOR = 'PUNCTUATOR'
        DIV_PUNCTUATOR = 'DIV_PUNCTUATOR'
        NUMBER = 'NUMBER'
        STRING = 'STRING'
        REG_EXP = 'REG_EXP'
        COMMENT = 'COMMENT'
        KEYWORD = 'KEYWORD'
        OPENERS = ('(', '{', '[')
        ENDS = (";", ",", "+", "=", ":")
        CLOSENERS = (')', '}', ']')
        tokens.append(token)
        try:
            while len(tokens) > self.buffersize:
                if tokens[2][0] == COMMENT:
                    tokens = tokens.pop(2)
                    continue
                if tokens[2][0] == WHITESPACE:
                    tokens[2] = (WHITESPACE, u' ')
                    if tokens[1][0] == LINETERMINATOR \
                      or tokens[1][0] == PUNCTUATOR \
                      or tokens[1][0] == DIV_PUNCTUATOR:
                        tokens.pop(2)
                        continue
                if tokens[1][0] == WHITESPACE:
                    if tokens[2][0] == LINETERMINATOR \
                      or tokens[2][0] == PUNCTUATOR \
                      or tokens[2][0] == DIV_PUNCTUATOR:
                        tokens.pop(1)
                        continue
                if tokens[1][0] == LINETERMINATOR:
                    tokens[1] = (LINETERMINATOR, u'\n')
                    if tokens[2][0] == LINETERMINATOR \
                      or tokens[2][1] in CLOSENERS:
                        tokens.pop(1)
                        continue
                    if tokens[0][1] in CLOSENERS \
                      and (tokens[2][1] in CLOSENERS
                            or tokens[2][1] in OPENERS):
                        tokens.pop(1)
                        continue
                if tokens[2][0] == LINETERMINATOR:
                    if tokens[1][0] == PUNCTUATOR \
                        and (tokens[1][1] in ENDS
                              or tokens[1][1] in OPENERS):
                        tokens.pop(2)
                        continue
                self.out.append(tokens.pop(0)[1])
        except:
            pass


def minify_in_place(path, encoding="utf_8"):
    """Minify path and write it to to the same location. Optionally use
    encoding"""
    tmpfd, tmppath = tempfile.mkstemp(".tmp", "minify.")
    os.fdopen(tmpfd).close()
    minify(path, tmppath, encoding=encoding)
    shutil.copyfile(tmppath, path)
    os.unlink(tmppath)


def minify(inpath, outpath, encoding="utf_8"):
    """Minify input path to outputpath, optionally using encoding"""
    input = codecs.open(inpath, "r", encoding=encoding)
    output = codecs.open(outpath, "w", encoding=encoding)
    Minify(input, output)
    input.close()
    output.close()


def minify_str(data):
    """Return minified version of the argument. Argument should be a string"""
    input = StringIO.StringIO(data)
    output = StringIO.StringIO()
    Minify(input, output)
    return output.getvalue()


def main():
    parser = optparse.OptionParser("%prog [options] source [destination]")
    parser.add_option("-o", "--overwrite", dest="overwrite",
                      default=False, action="store_true",
                      help="Overwrite target if it exists. WARNING! Includes source if no target is given!")

    options, args = parser.parse_args()

    if len(args) == 0:  # no args, use as filter
        Minify(sys.stdin, sys.stdout)
        return 1
    if len(args) == 1:
        src = args[0]
        dst = args[0]
    elif len(args) == 2:
        src = args[0]
        dst = args[1]
    else:
        parser.error("Invalid number of arguments")

    if not os.path.isfile(src):
        parser.error("Source file not found: " + src)
    elif not options.overwrite and os.path.isfile(dst):
        parser.error("Destination file exists. Use -o to overwrite")

    if src == dst:
        minify_in_place(src)
    else:
        minify(src, dst)
    return 1

if __name__ == "__main__":
    sys.exit(main())
    """
    import cProfile
    p=open("profile", "w")
    sys.stdout = p
    cProfile.run("sys.exit(main())")
    p.close()
    """
