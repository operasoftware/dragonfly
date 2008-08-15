var ui_strings  = {}

/*
 * Level 1 View Tab Headings
 */

/* DESC: View for script debugging. */
ui_strings.VIEW_LABEL_COMPOSITE_SCRIPTS = 'Scripts';
/* DESC: View for DOM debugging. */
ui_strings.VIEW_LABEL_COMPOSITE_DOM = 'DOM';
/* DESC: View for errors. */
ui_strings.VIEW_LABEL_COMPOSITE_ERROR_CONSOLE = 'Error Console';
/* DESC: View for exported code. */
ui_strings.VIEW_LABEL_COMPOSITE_EXPORTS = 'Export';

/*
 * Level 2 View Tab Headings
 */

/* DESC: Scripts contained in runtime. */
ui_strings.VIEW_LABEL_SCRIPTS = 'Scripts';
/* DESC: Information of the runtime environment. */
ui_strings.VIEW_LABEL_ENVIRONMENT = 'Environment';
/* DESC: Source code view. */
ui_strings.VIEW_LABEL_SOURCE = 'Source';
/* DESC: Command line. */
ui_strings.VIEW_LABEL_COMMAND_LINE = 'Command Line';
/* DESC: Call stack overview, a list of function calls. */
ui_strings.VIEW_LABEL_CALLSTACK = 'Call Stack';
/* DESC: Thread log overview, a list of threads. */
ui_strings.VIEW_LABEL_THREAD_LOG = 'Thread Log';
/* DESC: The JS properties of a frame or object. */
ui_strings.VIEW_LABEL_FRAME_INSPECTION = 'Inspection';
/* DESC: The JS properties of an object. */
ui_strings.VIEW_LABEL_OBJECT_INSPECTION = 'Object Inspection';
/* DESC: Documents in the runtime. */
ui_strings.VIEW_LABEL_DOCUMENTS = 'Documents';
/* DESC: Stylesheets in the runtime. */
ui_strings.VIEW_LABEL_STYLESHEETS = 'Stylesheets';
/* DESC: View to see the DOM tree. */
ui_strings.VIEW_LABEL_DOM = 'DOM';
/* DESC: View to see stylesheet rules. */
ui_strings.VIEW_LABEL_STYLESHEET = 'Stylesheet';
/* DESC: List of all applied styles. */
ui_strings.VIEW_LABEL_STYLES = 'Styles';
/* DESC: List of properties of a selected DOM node. */
ui_strings.VIEW_LABEL_DOM_ATTR = 'Properties';
/* DESC: Box model layout display. */
ui_strings.VIEW_LABEL_LAYOUT = 'Layout';
/* DESC: See Opera Error console: Error view filter for showing all errors. */
ui_strings.VIEW_LABEL_ERROR_ALL = 'All';
/* DESC: See Opera Error console: Error view filter for showing all JS errors. */
ui_strings.VIEW_LABEL_ERROR_SCRIPT = 'JavaScript';
/* DESC: See Opera Error console: Error view filter for showing all Java errors. */
ui_strings.VIEW_LABEL_ERROR_JAVA = 'Java';
/* DESC: See Opera Error console: Error view filter for showing all Mail errors. */
ui_strings.VIEW_LABEL_ERROR_M2 = 'Mail';
/* DESC: See Opera Error console: Error view filter for showing all Network errors. */
ui_strings.VIEW_LABEL_ERROR_NETWORK = 'Network';
/* DESC: See Opera Error console: Error view filter for showing all XML errors. */
ui_strings.VIEW_LABEL_ERROR_XML = 'XML';
/* DESC: See Opera Error console: Error view filter for showing all HTML errors. */
ui_strings.VIEW_LABEL_ERROR_HTML = 'HTML';
/* DESC: See Opera Error console: Error view filter for showing all CSS errors. */
ui_strings.VIEW_LABEL_ERROR_CSS = 'CSS';
/* DESC: See Opera Error console: Error view filter for showing all XSLT errors. */
ui_strings.VIEW_LABEL_ERROR_XSLT = 'XSLT';
/* DESC: See Opera Error console: Error view filter for showing all SVG errors. */
ui_strings.VIEW_LABEL_ERROR_SVG = 'SVG';
/* DESC: See Opera Error console: Error view filter for showing all Bittorrent errors. */
ui_strings.VIEW_LABEL_ERROR_BITTORRENT = 'Bittorrent';
/* DESC: See Opera Error console: Error view filter for showing all Voice errors. */
ui_strings.VIEW_LABEL_ERROR_VOICE = 'Voice';
/* DESC: See Opera Error console: Error view filter for showing all Widget errors. */
ui_strings.VIEW_LABEL_ERROR_WIDGET = 'Widget';
/* DESC: See Opera Error console: Error view filter for showing all Dragonfly errors. */
ui_strings.VIEW_LABEL_ERROR_DRAGONFLY = 'Dragonfly';
/* DESC: The styles that the rendering computed from all stylesheets. */
ui_strings.VIEW_LABEL_COMPUTED_STYLE = 'Computed Style';
/* DESC: The styles that got defined in the stylesheets.*/
ui_strings.VIEW_LABEL_STYLES = 'Styles';

/* DESC: TODO */
ui_strings.VIEW_LABEL_CONSOLE = 'Console';
/* DESC: TODO */
ui_strings.VIEW_LABEL_EXPORT = 'Export';




/*
 * Settings dialogue entries
 */

/* DESC: Switch display of 'All' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_ALL = 'Show Tab All';
/* DESC: Switch display of 'Script' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_SCRIPT = 'Show Tab Script';
/* DESC: Switch display of 'Java' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_JAVA = 'Show Tab Java';
/* DESC: Switch display of 'Mail' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_M2 = 'Show Tab Mail';
/* DESC: Switch display of 'Network' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_NETWORK = 'Show Tab Network';
/* DESC: Switch display of 'XML' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_XML = 'Show Tab XML';
/* DESC: Switch display of 'HTML' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_HTML = 'Show Tab HTML';
/* DESC: Switch display of 'CSS' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_CSS = 'Show Tab CSS';
/* DESC: Switch display of 'XSLT' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_XSLT = 'Show Tab XSLT';
/* DESC: Switch display of 'SVG' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_SVG = 'Show Tab SVG';
/* DESC: Switch display of 'Bittorrent' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_BITTORRENT = 'Show Tab Bittorrent';
/* DESC: Switch display of 'Voice' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_VOICE = 'Show Tab Voice';
/* DESC: Switch display of 'Widget' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_WIDGET = 'Show Tab Widget';
/* DESC: Switch display of 'Dragonfly' tab on or off. */
ui_strings.SWITCH_SHOW_TAB_DRAGONFLY = 'Show Tab Dragonfly';
/* DESC: TODO. */
ui_strings.SWITCH_UPDATE_GLOBAL_SCOPE = 'Automatically update global scope';
/* DESC: Will select the element when clicked. */
ui_strings.SWITCH_FIND_ELEMENT_BY_CLICKING = 'Find element by clicking';
/* DESC: Highlights page elements when thet mouse hovers. */
ui_strings.SWITCH_HIGHLIGHT_BY_MOUSE_OVER = 'Highlight by mouse hover';
/* DESC: Updates the DOM model automatically when a node is being removed. */
ui_strings.SWITCH_UPDATE_DOM_ON_NODE_REMOVE = 'Update DOM when a node is removed';
/* DESC: Spell HTML tag names upper or lower case. */
ui_strings.SWITCH_USE_LOWER_CASE_TAG_NAMES = 'Use lower case tag names';
/* DESC: Shows or hides comments in DOM. */
ui_strings.SWITCH_SHOW_COMMENT_NODES = 'Show comment nodes';
/* DESC: Shows or hides DOM node attributes. */
ui_strings.SWITCH_SHOW_ATTRIBUTES = 'Show attributes';
/* DESC: Shows or hides white space nodes in DOM. */
ui_strings.SWITCH_SHOW_WHITE_SPACE_NODES = 'Show white space nodes';
/* DESC: Shows DOM in tree or mark-up mode. */
ui_strings.SWITCH_SHOW_DOM_INTREE_VIEW = 'Show DOM in tree view';
/* DESC: Shows CSS properties as shorthands or in full effect. */
ui_strings.SWITCH_USE_SHORTHAND_PROPERTIES = 'Use shorthand for properties';
/* DESC: Show or hide initial values in computed style. */
ui_strings.SWITCH_HIDE_INITIAL_VALUES = 'Hide initial values in computed styles';
/* DESC: Shows computed styles as shorthand or in full effect. */
ui_strings.SWITCH_HIDE_SHORTHANDS = 'Hide shorthand for computed styles';
/* DESC: Shows or hides empty strings and null values. */
ui_strings.SWITCH_HIDE_EMPTY_STRINGS = 'Hide empty strings and null values';
/* DESC: Route debugging traffic trough proxy to enable debugging devices */
ui_strings.SWITCH_REMOTE_DEBUG = 'Remote Debug';
/* DESC: Show or hide Views menu. */
ui_strings.SWITCH_SHOW_VIEWS_MENU = "Show Views menu";
/* DESC: TODO. */
ui_strings.SWITCH_RELOAD_SCRIPTS_AUTOMATICALLY = "Reload documents automatically on selecting a window"
/* DESC: TODO. */
ui_strings.SWITCH_DETACH_WINDOW = "Undock into separate window"  ;
/* DESC: TODO. */
ui_strings.SWITCH_ATTACH_WINDOW = "Dock to main window";

/* DESC: TODO. */
ui_strings.SWITCH_SHOW_INITIAL_VALUES = 'Hide initial values in computed styles';
/* DESC: TODO. */
ui_strings.SWITCH_SHOW_SHORTHANDS = 'Hide shorthands in computed styles';
/* DESC: TODO. */
ui_strings.SWITCH_CREATE_SHORTHANDS = 'Use shorthands for properties';




/*
 * Button tool-tips.
 */ 

/* DESC: Opens help. */
ui_strings.BUTTON_LABEL_HELP = 'Help';
/* DESC: Debugger continues debugging. */
ui_strings.BUTTON_LABEL_CONTINUE = 'Continue (F8)';
/* DESC: Debugger step over current statement. */
ui_strings.BUTTON_LABEL_STEP_OVER = 'Step Over (F10)';
/* DESC: Debugger step into current statement. */
ui_strings.BUTTON_LABEL_STEP_INTO = 'Step Into (F11)';
/* DESC: Debugger step out from current statement. */
ui_strings.BUTTON_LABEL_STEP_OUT = 'Step Out (Shift F11)';
/* DESC: Execution stops when a new script is encountered. */
ui_strings.BUTTON_LABEL_STOP_AT_THREAD = 'Stop at new script';
/* DESC: Execution stops when encountering an exception. */
ui_strings.BUTTON_LABEL_AT_EXCEPTION = 'Stop at exception';
/* DESC: Execution stops when encountering an error. */
ui_strings.BUTTON_LABEL_AT_ERROR = 'Stop at error';
/* DESC: TODO. */
ui_strings.BUTTON_LABEL_AT_ABORT = 'Stop at abort';
/* DESC: Reloads the browser to receive fresh DOM, etc.  */
ui_strings.BUTTON_LABEL_RELOAD_HOST = 'Reload the selected window in the browser';
/* DESC: For selecting which window to debug. */
ui_strings.BUTTON_LABEL_SELECT_WINDOW = "Select the window you'd like to debug";
/* DESC: Expands the DOM tree completely. */
ui_strings.BUTTON_LABEL_GET_THE_WOHLE_TREE = 'Expand the DOM tree';
/* DESC: Exports the DOM currently shown. */
ui_strings.BUTTON_LABEL_EXPORT_DOM = 'Export current DOM view';
/* DESC: Hides all default properties in the global scope. */
ui_strings.BUTTON_LABEL_HIDE_DEFAULT_PROPS_IN_GLOBAL_SCOPE = 'Hide default properties in global scope';
/* DESC: Logs all threads when activated. */
ui_strings.BUTTON_LABEL_LOG_THREADS = 'Log threads';
/* DESC: Clears thread log. */
ui_strings.BUTTON_LABEL_CLEAR_LOG = 'Clear thread log';
/* DESC: Exports current thread log. */
ui_strings.BUTTON_LABEL_EXPORT_LOG = 'Export thread log';

/* DESC: TODO. */
ui_strings.BUTTON_LABEL_STATUS_INDICATOR = 'Status indicator for the browser and the debugger';
/* DESC: TODO. */
ui_strings.BUTTON_LABEL_CONFIGURATIONS = 'Configurations';

/* DESC: TODO. */
ui_strings.BUTTON_LABEL_PORT = 'Port';
/* DESC: TODO. */
ui_strings.BUTTON_LABEL_APPLY = 'Apply';
/* DESC: TODO. */
ui_strings.BUTTON_LABEL_CLEAR_LOG = 'Clear Log';
/* DESC: TODO. */
ui_strings.BUTTON_LABEL_CLOSE_WINDOW = 'Close Window';



/*
 * Information strings in the UI
 */

/* DESC: Currently no scripts are loaded and a reload of the page will resolve all linked scripts.*/
ui_strings.INFO_NO_SCRIPTS_PLEASE_RELOAD = 'Click the reload button above to fetch the scripts for the selected window';
/* DESC: TODO. */
ui_strings.RUNTIME_HAS_NO_SCRIPTS = 'This document has no scripts';
/* DESC: TODO. */
ui_strings.INFO_DOCUMNENT_LOADING = 'The document is loading ...';
/* DESC: For choosing a context (e.g. tab, window, widget) to be inspected. */
ui_strings.SELECT_WINDOW_EMPTY = 'Select a window'; 
/* DESC: For search fields. */
ui_strings.INPUT_DEFAULT_TEXT_SEARCH = 'Search';
/* DESC: For filter fields. */
ui_strings.INPUT_DEFAULT_TEXT_FILTER = 'Quick find';
/* DESC: General. */
ui_strings.SETTING_LABEL_GENERAL = 'General';

/*
 * Alerts
 */

/* DESC: Error when people use the Drafgonfly URL right in the browser */
ui_strings.ALERT_WRONG_START = "Dragonfly cannot be used in this way.\n" +
  "Either set the current url in\n\n" +
  "   opera:config > Developer Tools > Developer Tools URL\n\n" +
  "or setup a debugger environment with a proxy and server."
/* DESC: TODO. */
ui_strings.ALERT_WAITING_FOR_CONNECTION = 
  "Opera Dragonfly is waiting for a connection on port %s.\n" +
  "Please enter opera:debug in your device's URL field to connect.";
/* DESC: TODO. */
ui_strings.ALERT_SERVICE_NOT_AVAILABLE =  "Service is not available: %s";
/* DESC: TODO. */
ui_strings.ALERT_NO_RUNTIME_SELECTED =  "Select a runtime";



/*
 * other strings 
 */

/* DESC: TODO. */
ui_strings.CALL_STACK_FRAME_LINE =  "%(function name)s line %(line number)s script id %(script id)s";
/* DESC: TODO. */
ui_strings.VIEW_SUB_HEADER_METRICS =  "Metrics";
/* DESC: TODO. */
/* not sure if that makes sense: the according property on a node is offsetParent; chrisk */
ui_strings.VIEW_SUB_PARENT_OFFSETS =  "Parent Offsets";
/* DESC: TODO. */
/* the same not sure if that makes sense: it's offsetTop, offsetLeft, etc; chrisk */
ui_strings.VIEW_SUB_OFFSET_VALUES =  "Offset Values";

/* DESC: TODO. */
ui_strings.ENVIRONMENT_PROTOCOL_VERSION = "Protocol Version";
/* DESC: TODO. */
ui_strings.ENVIRONMENT_OPERATING_SYSTEM = "Operating System";
/* DESC: TODO. */
ui_strings.ENVIRONMENT_PLATFORM = "Platform";
/* DESC: TODO. */
ui_strings.ENVIRONMENT_USER_AGENT = "User Agent";
/* DESC: TODO. */
ui_strings.ENVIRONMENT_DRAGONFLY_VERSION = "Dragonfly Version";
/* DESC: TODO. */
ui_strings.ENVIRONMENT_REVISION_NUMBER = "Revision Number";
/* DESC: TODO. */
ui_strings.ECMA_SCRIPT_TYPE_INLINE = "Inline";
/* DESC: TODO. */
ui_strings.ECMA_SCRIPT_TYPE_LINKED = "Linked";
/* DESC: TODO. */
ui_strings.ECMA_SCRIPT_TYPE_UNKNOWN = "Unknown";
/* DESC: TODO. */
ui_strings.ECMA_SCRIPT_SCRIPT_ID = "script id";














 
