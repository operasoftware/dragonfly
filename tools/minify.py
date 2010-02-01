import types
import sys
import os
import shutil
import codecs
import tempfile

class JSTolkenizer(object):    
    LINETERMINATOR = (u'\u000A',u'\u000D',u'\u2028',u'\u2029')
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
    KEYWORDS = \
    (
        'break', 'else', 'new', 'var', 'case', 'finally',
        'return', 'void', 'catch', 'for', 'switch', 'while',
        'continue', 'function', 'this', 'with', 'default',
        'if', 'throw', 'delete', 'in', 'try', 'do', 'instanceof',
        'typeof', 'abstract', 'enum', 'int', 'short', 'boolean',
        'export', 'interface', 'static', 'byte', 'extends', 'long',
        'super', 'char', 'final', 'native', 'synchronized',
        'class', 'float', 'package', 'throws', 'const', 'goto',
        'private', 'transient', 'debugger', 'implements',
        'protected', 'volatile', 'double', 'import', 'public'
    )
    
    def __init__(self, tolken_handler):
        """ tolken_handler must have an input and an ontolken and onfinish handler """
        self.__str = str
        self.__input = tolken_handler.input
        self.__tolken_handler = tolken_handler
        self.__tolkens = []
        self.__char = ''
        self.__previous_value = ''
        self.__type = ''
        self.__string_delimiter = ''
        self.__buffer = ''
        self.__previous_type = ''
        self.__input.seek(0)
        self.__input_str = self.next_char()
        try:
            self.default_parser()
        except:
            self.__buffer += self.__char
            self.read_buffer('')
            self.__tolken_handler.onfinish()
          
    def next_char(self):
        for char in self.__input.read():
            self.__buffer += self.__char
            self.__char = char
            yield char

        
    def read_buffer(self, next_type):
        if self.__buffer:
            if self.__type == self.STRING_IDENTIFIER and self.__buffer in self.KEYWORDS:
                self.__tolken_handler.ontolken((self.STRING_KEYWORD, self.__buffer))
            else:
                self.__tolken_handler.ontolken((self.__type, self.__buffer))
            if not self.__type == self.STRING_WHITESPACE:
                self.__previous_type = self.__type
            self.__previous_value = ( self.__type == self.STRING_PUNCTUATOR ) and self.__buffer \
                or ( self.__type == self.STRING_WHITESPACE ) and self.__previous_value \
                or ''
        self.__buffer = ''
        self.__type = next_type
        
    def default_parser (self):
        WHITESPACE = (u'\u0009',u'\u000B',u'\u000C',u'\u0020',u'\u00A0')
        LINETERMINATOR = self.LINETERMINATOR
        NUMBER = ('0','1','2','3','4','5','6','7','8','9')
        PUNCTUATOR_2 = ('<=','>=','==','!=','===','!==','++','--',
            '<<','>>','>>>','&&','||','+=','-=','*=','%=','<<=','>>=','>>>=','&=','|=','^=')
        STRING_WHITESPACE = 'WHITESPACE'
        STRING_LINETERMINATOR = self.STRING_LINETERMINATOR
        STRING_IDENTIFIER = self.STRING_IDENTIFIER
        STRING_PUNCTUATOR = self.STRING_PUNCTUATOR
        STRING_DIV_PUNCTUATOR = self.STRING_DIV_PUNCTUATOR
        STRING_NUMBER = self.STRING_NUMBER
        STRING_STRING = self.STRING_STRING
        STRING_REG_EXP = self.STRING_REG_EXP
        STRING_COMMENT = self.STRING_COMMENT
        STRING_KEYWORD = self.STRING_KEYWORD
        next = self.__input_str.next
        read_buffer = self.read_buffer
        char = ''
        while True:
            if char in WHITESPACE:
                read_buffer(STRING_WHITESPACE)
                char = next()
                while char in WHITESPACE:
                    char = next()
                read_buffer(STRING_IDENTIFIER);
            if char in LINETERMINATOR:
                read_buffer(STRING_LINETERMINATOR)
                char = next()
                while char in LINETERMINATOR:
                    char = next()
                read_buffer(STRING_IDENTIFIER)
                continue;
            if char in NUMBER:
                read_buffer(STRING_NUMBER)
                char = next()
                if char == 'x' or char == 'X':
                    char = next()
                    char = self.number_hex_parser(char)
                else:
                  char = self.number_dec_parser(char)
                read_buffer(STRING_IDENTIFIER)
                continue
            if char in ('"', '\''):
                read_buffer(STRING_STRING)
                self.__string_delimiter = char
                char = next()
                char = self.string_parser(char)
                read_buffer(STRING_IDENTIFIER)
                continue
            if char == '.' or char == '+' or char == '-':
                read_buffer(STRING_PUNCTUATOR)
                punct_buffer = char
                char = next()
                punct_buffer += char
                if char in NUMBER:
                    self.__type = STRING_NUMBER
                    char = self.number_dec_parser(char)
                else:
                    while punct_buffer in PUNCTUATOR_2:
                        char = next()
                        punct_buffer += char
                read_buffer(STRING_IDENTIFIER)
                continue
            if char in ('{','}','(',')','[',']',';',',','<','>',
                  '=','!','+','-','*','%','&','|','^','~','?',':','.'):
                read_buffer(STRING_PUNCTUATOR)
                punct_buffer = char
                char = next()
                punct_buffer += char
                while punct_buffer in PUNCTUATOR_2:
                    char = next()
                    punct_buffer += char
                self.__previous_value = self.__buffer
                read_buffer(STRING_IDENTIFIER)
                continue
            if char == '/': 
                read_buffer(STRING_COMMENT)
                char = next()
                if char == '*':
                    char = next()
                    char = self.multiline_comment_parser(char)
                elif char == '/': 
                    char = next()
                    char = self.singleline_comment_parser(char)
                elif self.__previous_type == STRING_IDENTIFIER \
                        or  self.__previous_type == STRING_NUMBER \
                        or ( self.__previous_type == STRING_PUNCTUATOR \
                             and  self.__previous_value in (')',']') ):
                    self.__type = STRING_DIV_PUNCTUATOR
                    if char == '=': 
                        char = next()
                else:
                    self.__type = STRING_REG_EXP
                    char = self.reg_exp_parser(char)
                read_buffer(STRING_IDENTIFIER)
                continue
            char = next()

    def number_hex_parser(self, char):
        next = self.__input_str.next
        while char in ('0','1','2','3','4','5','6','7','8','9',
              'a','b','c','d','e','f','A','B','C','D','E','F'):
            char = next()
        return char
    
    def number_dec_parser(self, char):
        NUMBER = ('0','1','2','3','4','5','6','7','8','9')
        next = self.__input_str.next
        while char in NUMBER or char == '.':
            char = next()
        if char == 'e' or char == 'E':  
            char = next()
            if char =='+' or char == '-':
                char = next()
            while char in NUMBER:
                char = next()
        return char
    
    def string_parser(self, char):
        next = self.__input_str.next
        while True:
            if char == '\\':  #\u005C
                next()
                char = next()
                continue
            if char == self.__string_delimiter:
                char = next()
                return char
            char = next()
      
    def multiline_comment_parser(self, char):
        next = self.__input_str.next
        while True:
            if char == '*':
                char = next()
                if char == '/':
                    char = next()
                    return char
                continue
            char = next()
        
    def singleline_comment_parser(self, char):
        next = self.__input_str.next
        while True:
            if char in self.LINETERMINATOR:
                return char
            char = next()
            
    def reg_exp_parser(self, char):
        next = self.__input_str.next
        is_in_brackets = False
        while True:
            if char == '[':
                is_in_brackets = True
            if is_in_brackets and char == ']':
                is_in_brackets = False
            if char == '\\':
                char = next()
                char = next()
                continue
            if not is_in_brackets and  char == '/': 
                char = next()
                while char in ('g','i','m'):
                    char = next()
                return char
            char = next()


class Minify(object):
    """Minify class, handling minification frome one file to another"""
    
    def __init__(self, input, output, encoding="utf_8_sig"):
        """ only new lines and white spaces which are safe to remove are removed 
            input and output must be file like objects """
        self.input = input
        self.output = output
        self.tolkens = [('', ''),('', ''),('', '')]
        self.buffersize = 2
        self.out = []
        JSTolkenizer(self)

    def onfinish(self):
        self.buffersize = 0
        self.tolkens += [('',''),('','')]
        self.ontolken(('',''))

        for token in self.out:
            self.output.write(token)

    def ontolken(self, tolken):
        """
        tolken is a tuple, firts position is the tolken type, second position the tolken
        """
        tolkens = self.tolkens
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
        ENDS = (";", ",","+","=",":")
        CLOSENERS = (')', '}', ']')
        tolkens.append(tolken)
        try:
            while len(tolkens) > self.buffersize:
                if tolkens[2][0] == COMMENT:
                    tolkens = tolkens.pop(2)
                    continue 
                if tolkens[2][0] == WHITESPACE:
                    tolkens[2] = (WHITESPACE, u' ')
                    if tolkens[1][0] == LINETERMINATOR \
                      or tolkens[1][0] == PUNCTUATOR \
                      or tolkens[1][0] == DIV_PUNCTUATOR:
                        tolkens.pop(2)
                        continue
                if tolkens[1][0] == WHITESPACE:
                    if tolkens[2][0] == LINETERMINATOR \
                      or tolkens[2][0] == PUNCTUATOR \
                      or tolkens[2][0] == DIV_PUNCTUATOR:
                        tolkens.pop(1)
                        continue
                if tolkens[1][0] == LINETERMINATOR:
                    tolkens[1] = (LINETERMINATOR, u'\n')
                    if tolkens[2][0] == LINETERMINATOR \
                      or tolkens[2][1] in CLOSENERS:
                        tolkens.pop(1)
                        continue
                    if tolkens[0][1] in CLOSENERS \
                      and ( tolkens[2][1] in CLOSENERS \
                            or tolkens[2][1] in OPENERS ):
                        tolkens.pop(1)
                        continue
                if tolkens[2][0] == LINETERMINATOR:
                    if tolkens[1][0] == PUNCTUATOR \
                        and ( tolkens[1][1] in ENDS \
                              or tolkens[1][1] in OPENERS ):
                        tolkens.pop(2)
                        continue
                self.out.append(tolkens.pop(0)[1])
        except:
            pass

def minify_in_place(path, encoding="utf_8_sig"):
    """Minify path and write it to to the same location. Optionally use encoding
    Note: Uses stringIO so it will use memory for the entire destination file"""
    tmpfd, tmppath = tempfile.mkstemp(".tmp", "minify.")
    os.fdopen(tmpfd).close()
    minify(path, tmppath, encoding=encoding)
    shutil.copyfile(tmppath, path)
    os.unlink(tmppath)

def minify(inpath, outpath, encoding="utf_8_sig"):
    """Minify input path to outputpath, optionally using encoding"""
    input = codecs.open(inpath, "r", encoding=encoding)
    output = codecs.open(outpath, "w", encoding=encoding)
    Minify(input, output)
    input.close()
    output.close()

def main():
    import optparse
    import os    
    parser = optparse.OptionParser("%prog [options] source [destination]")
    parser.add_option("-o", "--overwrite", dest="overwrite",
                      default=False, action="store_true",
                      help="Overwrite target if it exists. WARNING! Includes source if no target is given!")    

    options, args = parser.parse_args()

    if len(args) == 0: # no args, use as filter
        print sys.stdin
        Minify(sys.stdin, sys.stderr)
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

    if src==dst:
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
    
    
