window.ui_strings || ( window.ui_strings  = {} );
window.ui_strings.lang_code = "en";

/**
 * Capitalization guidelines:
 * http://library.gnome.org/devel/hig-book/stable/design-text-labels.html.en#layout-capitalization
 *
 * Prefix -> use mapping for strings:
 * Prefix   Use
 * D        Dialog titles and components
 * S        General strings
 * M        Menus
 */


/*
 * Level 1 View Tab Headings
 */

/* DESC: View for script debugging. */
ui_strings.M_VIEW_LABEL_COMPOSITE_SCRIPTS = 'Scripts';
/* DESC: View for DOM debugging. */
ui_strings.M_VIEW_LABEL_COMPOSITE_DOM = 'DOM';
/* DESC: View for error log. */
ui_strings.M_VIEW_LABEL_COMPOSITE_ERROR_CONSOLE = 'Error Console';
/* DESC: View for exported code. */
ui_strings.M_VIEW_LABEL_COMPOSITE_EXPORTS = 'Export';
/* DESC: View for network debugging (and http logger) */
ui_strings.M_VIEW_LABEL_NETWORK = 'Network';
/* DESC: View for utilities, e.g. a pixel maginfier and color picker */
ui_strings.M_VIEW_LABEL_UTILITIES = 'Utilities';
/* DESC: View for all types of storage, cookies, localStorage, sessionStorage e.t.c */
ui_strings.M_VIEW_LABEL_STORAGE = 'Storage';

/*
 * Level 2 View Tab Headings
 */

/* DESC: Scripts contained in runtime. */
ui_strings.M_VIEW_LABEL_SCRIPTS = 'Scripts';
/* DESC: Information of the runtime environment. */
ui_strings.M_VIEW_LABEL_ENVIRONMENT = 'Environment';
/* DESC: Source code view. */
ui_strings.M_VIEW_LABEL_SOURCE = 'Source';
/* DESC: Command line. */
ui_strings.M_VIEW_LABEL_COMMAND_LINE = 'Command Line';
/* DESC: Call stack overview, a list of function calls. */
ui_strings.M_VIEW_LABEL_CALLSTACK = 'Call Stack';
/* DESC: Thread log overview, a list of threads. */
ui_strings.M_VIEW_LABEL_THREAD_LOG = 'Thread Log';
/* DESC: The JS properties of a frame or object. */
ui_strings.M_VIEW_LABEL_FRAME_INSPECTION = 'Inspection';
/* DESC: The JS properties of an object. */
ui_strings.M_VIEW_LABEL_OBJECT_INSPECTION = 'Object Inspection';
/* DESC: Documents in the runtime. */
ui_strings.M_VIEW_LABEL_DOCUMENTS = 'Documents';
/* DESC: Stylesheets in the runtime. */
ui_strings.M_VIEW_LABEL_STYLESHEETS = 'Stylesheets';
/* DESC: View to see the DOM tree. */
ui_strings.M_VIEW_LABEL_DOM = 'DOM';
/* DESC: View to see stylesheet rules. */
ui_strings.M_VIEW_LABEL_STYLESHEET = 'Stylesheet';
/* DESC: List of all applied styles. */
ui_strings.M_VIEW_LABEL_STYLES = 'Styles';
/* DESC: List of properties of a selected DOM node. */
ui_strings.M_VIEW_LABEL_DOM_ATTR = 'Properties';
/* DESC: Box model layout display. */
ui_strings.M_VIEW_LABEL_LAYOUT = 'Layout';
/* DESC: See Opera Error console: Error view filter for showing all errors. */
ui_strings.M_VIEW_LABEL_ERROR_ALL = 'All';
/* DESC: See Opera Error console: Error view filter for showing all JS errors. */
ui_strings.M_VIEW_LABEL_ERROR_SCRIPT = 'JavaScript';
/* DESC: See Opera Error console: Error view filter for showing all Java errors. */
ui_strings.M_VIEW_LABEL_ERROR_JAVA = 'Java';
/* DESC: See Opera Error console: Error view filter for showing all Mail errors. */
ui_strings.M_VIEW_LABEL_ERROR_M2 = 'Mail';
/* DESC: See Opera Error console: Error view filter for showing all Network errors. */
ui_strings.M_VIEW_LABEL_ERROR_NETWORK = 'Network';
/* DESC: See Opera Error console: Error view filter for showing all XML errors. */
ui_strings.M_VIEW_LABEL_ERROR_XML = 'XML';
/* DESC: See Opera Error console: Error view filter for showing all HTML errors. */
ui_strings.M_VIEW_LABEL_ERROR_HTML = 'HTML';
/* DESC: See Opera Error console: Error view filter for showing all CSS errors. */
ui_strings.M_VIEW_LABEL_ERROR_CSS = 'CSS';
/* DESC: See Opera Error console: Error view filter for showing all XSLT errors. */
ui_strings.M_VIEW_LABEL_ERROR_XSLT = 'XSLT';
/* DESC: See Opera Error console: Error view filter for showing all SVG errors. */
ui_strings.M_VIEW_LABEL_ERROR_SVG = 'SVG';
/* DESC: See Opera Error console: Error view filter for showing all Bittorrent errors. */
ui_strings.M_VIEW_LABEL_ERROR_BITTORRENT = 'Bittorrent';
/* DESC: See Opera Error console: Error view filter for showing all Voice errors. */
ui_strings.M_VIEW_LABEL_ERROR_VOICE = 'Voice';
/* DESC: See Opera Error console: Error view filter for showing all Widget errors. */
ui_strings.M_VIEW_LABEL_ERROR_WIDGET = 'Widget';
/* DESC: See Opera Error console: Error view filter for showing all Opera Dragonfly errors. */
ui_strings.M_VIEW_LABEL_ERROR_DRAGONFLY = 'Opera Dragonfly';
/* DESC: The styles that the rendering computed from all stylesheets. */
ui_strings.M_VIEW_LABEL_COMPUTED_STYLE = 'Computed Style';
/* DESC: The styles that got defined in the stylesheets.*/
ui_strings.M_VIEW_LABEL_STYLES = 'Styles';
/* DESC: The view on the console. */
ui_strings.M_VIEW_LABEL_CONSOLE = 'Console';
/* DESC: One Export view. */
ui_strings.M_VIEW_LABEL_EXPORT = 'Export';
/* DESC: DEPRECATED Name of request log tab */
ui_strings.M_VIEW_LABEL_REQUEST_LOG = 'Request log';
/* DESC: DEPRECATED Name of raw request tab */
ui_strings.M_VIEW_LABEL_RAW_REQUEST_INFO = 'Raw request';
/* DESC: Name of raw response tab */
ui_strings.M_VIEW_LABEL_RAW_RESPONSE_INFO = 'Raw Response';
/* DESC: Name of request headers tab */
ui_strings.M_VIEW_LABEL_REQUEST_HEADERS = 'Request Headers';
/* DESC: Name of response headers tab */
ui_strings.M_VIEW_LABEL_RESPONSE_HEADERS = 'Response Headers';
/* DESC: Name of request info view */
ui_strings.M_VIEW_LABEL_REQUEST_INFO = 'Request Info';
/* DESC: Name of response body view */
ui_strings.M_VIEW_LABEL_RESPONSE_BODY = 'Response Body';
/* DESC: Name of request summary view */
ui_strings.M_VIEW_LABEL_REQUEST_SUMMARY = 'Request Summary';

/* DESC: view for the local storage */
ui_strings.M_VIEW_LABEL_LOCAL_STORAGE = 'Local Storage';
/* DESC: view for the session storage */
ui_strings.M_VIEW_LABEL_SESSION_STORAGE = 'Session Storage';
/* DESC: view for cookies */
ui_strings.M_VIEW_LABEL_COOKIES = 'Cookies';
/* DESC: view for widget prefernces */
ui_strings.M_VIEW_LABEL_WIDGET_PREFERNCES = 'Widget Preferences';
/* DESC: Label of the Views menu */
ui_strings.M_VIEW_LABEL_VIEWS = 'Views';

/* DESC: Label of the stored colors view */
ui_strings.M_VIEW_LABEL_STORED_COLORS = 'Stored Colors';
/* DESC: Label of the pixel magnifier and color picker view */
ui_strings.M_VIEW_LABEL_COLOR_MAGNIFIER_AND_PICKER = 'Pixel Magnifier and Color Picker';
/* DESC: Label of the section for selecting a color in color picker */
ui_strings.M_VIEW_LABEL_COLOR_SELECT = 'Color Select';




/*
 * Settings dialogue entries. All the S_SWITCH_<something> strings are
 * used as check box labels and tool tips. Both these use sentence
 * capitalization.
 */

/* DESC: Switch display of 'All' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_ALL = 'Show all messages tab';
/* DESC: Switch display of 'Script' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_SCRIPT = 'Show script tab';
/* DESC: Switch display of 'Java' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_JAVA = 'Show Java tab';
/* DESC: Switch display of 'Mail' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_M2 = 'Show mail tab';
/* DESC: Switch display of 'Network' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_NETWORK = 'Show network tab';
/* DESC: Switch display of 'XML' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_XML = 'Show XML tab';
/* DESC: Switch display of 'HTML' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_HTML = 'Show HTML tab';
/* DESC: Switch display of 'CSS' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_CSS = 'Show CSS tab';
/* DESC: Switch display of 'XSLT' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_XSLT = 'Show XSLT tab';
/* DESC: Switch display of 'SVG' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_SVG = 'Show SVG tab';
/* DESC: Switch display of 'Bittorrent' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_BITTORRENT = 'Show BitTorrent tab';
/* DESC: Switch display of 'Voice' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_VOICE = 'Show voice tab';
/* DESC: Switch display of 'Widget' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_WIDGET = 'Show widget tab';
/* DESC: Switch display of 'Opera Dragonfly' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_DRAGONFLY = 'Show Opera Dragonfly tab';
/* DESC: TODO. */
ui_strings.S_SWITCH_UPDATE_GLOBAL_SCOPE = 'Automatically update global scope';
/* DESC: Show non enumerale properties when inspecting a js object. */
ui_strings.S_SWITCH_SHOW_NON_ENUMERABLES = 'Show non enumerable properties';
/* DESC: Will select the element when clicked. */
ui_strings.S_SWITCH_FIND_ELEMENT_BY_CLICKING = 'Find element by clicking';
/* DESC: Highlights page elements when thet mouse hovers. */
ui_strings.S_SWITCH_HIGHLIGHT_SELECTED_OR_HOVERED_ELEMENT = 'Highlight selected or hovered element';
/* DESC: Highlights page elements when thet mouse hovers. */
ui_strings.S_SWITCH_HIGHLIGHT_BY_MOUSE_OVER = 'Highlight by mouse hover';
/* DESC: Updates the DOM model automatically when a node is being removed. */
ui_strings.S_SWITCH_UPDATE_DOM_ON_NODE_REMOVE = 'Update DOM when a node is removed';
/* DESC: Spell HTML tag names upper or lower case. */
ui_strings.S_SWITCH_USE_LOWER_CASE_TAG_NAMES = 'Use lower case tag names for text/html';
/* DESC: Shows or hides comments in DOM. */
ui_strings.S_SWITCH_SHOW_COMMENT_NODES = 'Show comment nodes';
/* DESC: Shows or hides DOM node attributes. */
ui_strings.S_SWITCH_SHOW_ATTRIBUTES = 'Show attributes';
/* DESC: Shows or hides white space nodes in DOM. */
ui_strings.S_SWITCH_SHOW_WHITE_SPACE_NODES = 'Show white space nodes';
/* DESC: Shows DOM in tree or mark-up mode. */
ui_strings.S_SWITCH_SHOW_DOM_INTREE_VIEW = 'Show DOM in Tree View';
/* DESC: Shows CSS properties as shorthands or in full effect. */
ui_strings.S_SWITCH_USE_SHORTHAND_PROPERTIES = 'Use shorthand for properties';
/* DESC: Show or hide initial values in computed style. */
ui_strings.S_SWITCH_HIDE_INITIAL_VALUES = 'Hide initial values in computed styles';
/* DESC: Shows computed styles as shorthand or in full effect. */
ui_strings.S_SWITCH_HIDE_SHORTHANDS = 'Hide shorthand for computed styles';
/* DESC: Shows or hides empty strings and null values. */
ui_strings.S_SWITCH_HIDE_EMPTY_STRINGS = 'Hide empty strings and null values';
/* DESC: Route debugging traffic trough proxy to enable debugging devices */
ui_strings.S_SWITCH_REMOTE_DEBUG = 'Remote debug';
/* DESC: Show or hide Views menu. */
ui_strings.S_SWITCH_SHOW_VIEWS_MENU = "Show Views menu";
/* DESC: Switch toggeling if the debugger should automatically reload the page when the user changes the window to debug. */
ui_strings.S_SWITCH_RELOAD_SCRIPTS_AUTOMATICALLY = "Reload documents automatically when selecting a window";
/* DESC: Undocks Opera Dragonfly into an own window. */
ui_strings.S_SWITCH_DETACH_WINDOW = "Undock into separate window"  ;
/* DESC: Attaches Opera Dragonfly to the main browser window. */
ui_strings.S_SWITCH_ATTACH_WINDOW = "Dock to main window";
/* DESC: Toggles the display of pre-set values in the computed styles view. */
ui_strings.S_SWITCH_SHOW_INITIAL_VALUES = 'Hide initial values in computed styles';
/* DESC: Toggles the display of shorthands in computed styles view. */
ui_strings.S_SWITCH_SHOW_SHORTHANDS = 'Hide shorthands in computed styles view';
/* DESC: Showing shorthands in style properties on or off. */
ui_strings.S_SWITCH_CREATE_SHORTHANDS = 'Use shorthands for properties';
/* DESC: Showing the siblings in the breadcrumb in the statusbar. */
ui_strings.S_SWITCH_SHOW_SIBLINGS_IN_BREAD_CRUMB = 'Show siblings in breadcrumb';
/* DESC: Showing the id's and class names in the breadcrumb in the statusbar. */
ui_strings.S_SWITCH_SHOW_ID_AND_CLASSES_IN_BREAD_CRUMB = "Show id's and classes in breadcrumb";
/* DESC: There are a lot of window types in Opera. This switch toggles if we show only the useful ones, or all of them. */
ui_strings.S_SWITCH_SHOW_ONLY_NORMAL_AND_GADGETS_TYPE_WINDOWS = "Show only browser windows and widget windows in window list ( uncheck to also show mail and feed windows etc. )";
/* DESC: Scroll an element in the host into view when selecting it in the DOM. */
ui_strings.S_SWITCH_SCROLL_INTO_VIEW_ON_FIRST_SPOTLIGHT = 'Scroll into View on first Spotlight';
/* DESC: Show ECMAScript errors in the command line. */
ui_strings.S_SWITCH_SHOW_ECMA_ERRORS_IN_COMMAND_LINE = "Show ECMAScript errors in the command line view";
/* DESC: Expand all (entries in a list) */
ui_strings.S_SWITCH_EXPAND_ALL = 'Expand all';
/* DESC: Draw a border on to selected DOM elements */
ui_strings.S_SWITCH_LOCK_SELECTED_ELEMENTS = "Draw a border on to selected elements";
/* DESC: Switch for controlling if the request log is cleared whenever a new site is loaded */
ui_strings.S_SWITCH_CLEAR_REQUESTS_ON_NEW_CONTEXT = "Clear request log when loading a new site";
/* DESC: When enabled, the request log always scroll to the bottom on new requests */
ui_strings.S_SWITCH_AUTO_SCROLL_REQUEST_LIST = "Auto scroll request log";


/*
 * Button tool-tips.
 */

/* DESC: Debugger continues debugging. */
ui_strings.S_BUTTON_LABEL_CONTINUE = 'Continue (F8)';
/* DESC: Debugger step over current statement. */
ui_strings.S_BUTTON_LABEL_STEP_OVER = 'Step over (F10)';
/* DESC: Debugger step into current statement. */
ui_strings.S_BUTTON_LABEL_STEP_INTO = 'Step into (F11)';
/* DESC: Debugger step out from current statement. */
ui_strings.S_BUTTON_LABEL_STEP_OUT = 'Step out (Shift F11)';
/* DESC: Execution stops when a new script is encountered. */
ui_strings.S_BUTTON_LABEL_STOP_AT_THREAD = 'Stop at new script';
/* DESC: Execution stops when encountering an exception. */
ui_strings.S_BUTTON_LABEL_AT_EXCEPTION = 'Stop at exception';
/* DESC: Execution stops when encountering an error. */
ui_strings.S_BUTTON_LABEL_AT_ERROR = 'Stop at error';
/* DESC: Execution stops at encountering an abort. */
ui_strings.S_BUTTON_LABEL_AT_ABORT = 'Stop at abort';
/* DESC: Reloads the browser to receive fresh DOM, etc.  */
ui_strings.S_BUTTON_LABEL_RELOAD_HOST = 'Reload the selected window in the browser';
/* DESC: For selecting which window to debug. */
ui_strings.S_BUTTON_LABEL_SELECT_WINDOW = "Select the window you'd like to debug";
/* DESC: Expands the DOM tree completely. */
ui_strings.S_BUTTON_LABEL_GET_THE_WOHLE_TREE = 'Expand the DOM tree';
/* DESC: Exports the DOM currently shown. */
ui_strings.S_BUTTON_LABEL_EXPORT_DOM = 'Export current DOM view';
/* DESC: Hides all default properties in the global scope. */
ui_strings.S_BUTTON_LABEL_HIDE_DEFAULT_PROPS_IN_GLOBAL_SCOPE = 'Hide default properties in global scope';
/* DESC: Logs all threads when activated. */
ui_strings.S_BUTTON_LABEL_LOG_THREADS = 'Log threads';
/* DESC: Clears thread log. */
ui_strings.S_BUTTON_LABEL_CLEAR_LOG = 'Clear thread log';
/* DESC: Exports current thread log. */
ui_strings.S_BUTTON_LABEL_EXPORT_LOG = 'Export thread log';
/* DESC: Launches the Settings view. */
ui_strings.S_BUTTON_LABEL_SETTINGS = 'Settings';
/* DESC: Empties the log entries. */
ui_strings.S_BUTTON_LABEL_CLEAR_LOG = 'Clear log';
/* DESC: Closes the window. */
ui_strings.S_BUTTON_LABEL_CLOSE_WINDOW = 'Close window';
/* DESC: Applies the changes. */
ui_strings.S_BUTTON_TEXT_APPLY = 'Apply';
/* DESC: DEPRECATED Clear request log. */
ui_strings.S_BUTTON_CLEAR_REQUEST_LOG = 'Clear request log';
/* DESC: */
ui_strings.S_BUTTON_OK = "Ok";
/* DESC: */
ui_strings.S_BUTTON_SAVE = "Save";
/* DESC: */
ui_strings.S_BUTTON_CANCEL = "Cancel";
/* DESC: Show request summary. */
ui_strings.S_BUTTON_SHOW_REQUEST_SUMMARY = 'Summary';
/* DESC: Show request headers. */
ui_strings.S_BUTTON_SHOW_REQUEST_HEADERS = 'Headers';
/* DESC: Show raw request. */
ui_strings.S_BUTTON_SHOW_REQUEST_RAW = 'Raw';
/* DESC: Cancel button while the client is waiting for a host connection. */
ui_strings.S_BUTTON_CANCEL_REMOTE_DEBUG = "Cancel Remote Debug";
/* DESC: */
ui_strings.S_BUTTON_STORAGE_DELETE_ALL = "Delete All";

/* DESC:  Reset all the values to their default state */
ui_strings.S_BUTTON_COLOR_RESTORE_DEFAULTS = "Restore defaults";
/* DESC: */
ui_strings.S_BUTTON_COLOR_MANAGE_STORED = "Manage stored colors";
/* DESC: */
ui_strings.S_BUTTON_COLOR_STORE_COLOR = "Store color";


/*
  * Menus
  */

/* DESC: Select the active window as debugger context. */
ui_strings.S_MENU_SELECT_ACTIVE_WINDOW = 'Select Active Window';
/* DESC: Reload the debug context. */
ui_strings.S_MENU_RELOAD_DEBUG_CONTEXT = 'Reload Debug Context';


/*
 * Labels. Many of these are tool tips, not button labels.
 * FIXME: The DESCs needs to reflect this
 */

/* DESC: Tooltip for a status indicator in the bottom left corner showing is the debugger is connected, busy, etc.. */
ui_strings.S_LABEL_STATUS_INDICATOR = 'Status indicator for the browser and the debugger';
/* DESC: The network port to connect to. */
ui_strings.S_LABEL_PORT = 'Port';
/* DESC: For choosing a context (e.g. tab, window, widget) to be inspected. */
ui_strings.S_SELECT_WINDOW_EMPTY = 'Select a window';
/* DESC: For search fields. */
ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH = 'Search';
/* DESC: For filter fields. */
ui_strings.S_INPUT_DEFAULT_TEXT_FILTER = 'Quick find';
/* DESC: Table heading for "file" column */
ui_strings.S_COLUMN_LABEL_FILE = "File";
/* DESC: Table heading for column showing line number */
ui_strings.S_COLUMN_LABEL_LINE = "Line";
/* DESC: Table heading for column showing error descriptions */
ui_strings.S_COLUMN_LABEL_ERROR = "Error";
/* DESC: label for link to the specification for something */
ui_strings.S_SPEC_LINK_LABEL = "Spec";
/* DESC: label for url in http request details */
ui_strings.S_HTTP_LABEL_URL = "URL";
/* DESC: label for response in http request details */
ui_strings.S_HTTP_LABEL_RESPONSE = "Response";
/* DESC: label for method in http request details */
ui_strings.S_HTTP_LABEL_METHOD = "Method";
/* DESC: label for host in http request details */
ui_strings.S_HTTP_LABEL_HOST = "Host";
/* DESC: label for path in http request details */
ui_strings.S_HTTP_LABEL_PATH = "Path";
/* DESC: label for query arguments in http request details */
ui_strings.S_HTTP_LABEL_QUERY_ARGS = "Query arguments";
/* DESC: Toolbar text telling how many requests are in http the log */
ui_strings.S_HTTP_TOOLBAR_REQUEST_COUNT = "%s requests";
/* DESC: Toolbar text telling how many messages are in the error console */
ui_strings.S_CONSOLE_TOOLBAR_MESSAGES_COUNT = "%s messages";

/* DESC: Tab size in source view. */
ui_strings.S_LABEL_TAB_SIZE = 'Tab Size';
/* DESC: Label for the hue of a color value. */
ui_strings.S_LABEL_COLOR_HUE = "Hue";
/* DESC: Label for the saturation of a color value.  */
ui_strings.S_LABEL_COLOR_SATURATION = "Saturation";
/* DESC: Label for the luminosity of a color value. */
ui_strings.S_LABEL_COLOR_LUMINOSITY = "Luminosity";
/* DESC: Label for the opacity of a color value. */
ui_strings.S_LABEL_COLOR_OPACITY = "Opacity";

/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_TITLE = "Spotlight";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_COLOR_THEME = "Color Theme";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_FILL = "Fill";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_FRAME = "Frame";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_PROPERTY_GRID = "Grid";
/* DESC: */
ui_strings.S_BUTTON_SPOTLIGHT_RESET_DEFAULT_COLORS = "Reset Default Colors";
/* DESC: */
ui_strings.S_BUTTON_SPOTLIGHT_ADVANCED = "Advanced";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_TITLE_DEFAULT = "Default Spotlight";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_DIMENSION = "Dimension";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_PADDING = "Padding";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_BORDER = "Border";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_MARGIN = "Margin";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_TITLE_METRICS = "Spotlight Metrics";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_INNER_ANY = "hover inner any";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_INNER = "hover inner";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_BOX_TYPE_HOVER = "hover";
/* DESC: */
ui_strings.S_LABEL_SPOTLIGHT_TITLE_LOCKED_ELEMENTS = "Spotlight Locked Elements";
/* DESC: */
ui_strings.S_LABEL_STORAGE_ADD = "Add";
/* DESC: */
ui_strings.S_LABEL_STORAGE_UPDATE = "Update";
/* DESC: */
ui_strings.S_LABEL_STORAGE_DELETE = "Delete";
/* DESC: */
ui_strings.S_LABEL_STORAGE_DOUBLE_CLICK_TO_EDIT = "Double click to edit";
/* DESC: Area as in size. choices are 10 x 10, and so on. */
ui_strings.S_LABEL_UTIL_AREA = 'Area';
/* DESC: Scale */
ui_strings.S_LABEL_UTIL_SCALE = 'Scale';
/* DESC: A setting to define which prototypes of inspected js objects should be collapsed by default. */
ui_strings.S_LABEL_COLLAPSED_INSPECTED_PROTOTYPES ="Default collapsed prototype objects (a list of prototypes, e.g. Object, Array, etc. * will collapse all): ";

/*
 * Information strings in the UI
 */

/* DESC: Currently no scripts are loaded and a reload of the page will resolve all linked scripts.*/
ui_strings.S_INFO_RELOAD_FOR_SCRIPT = 'Click the reload button above to fetch the scripts for the selected window';

/* DESC: Information shown if the window has no runtime, e.g. speed dial. */
ui_strings.S_INFO_WINDOW_HAS_NO_RUNTIME = 'This window has no runtime';
/* DESC: Information shown if the document does not hold any scripts. */
ui_strings.S_INFO_RUNTIME_HAS_NO_SCRIPTS = 'This document has no scripts';
/* DESC: Information shown if the document does not hold any style sheet. */
ui_strings.S_INFO_DOCUMENT_HAS_NO_STYLESHEETS = 'This document has no stylesheet';
/* DESC: Information shown if the stylesheet does not hold any style rules. */
ui_strings.S_INFO_STYLESHEET_HAS_NO_RULES = 'This stylesheet has no rules';
/* DESC: Feedback showing that Opera Dragonfly is loading and the user shall have patience. */
ui_strings.S_INFO_DOCUMNENT_LOADING = 'Opera Dragonfly is loading ...';
/* DESC: General. */
ui_strings.M_SETTING_LABEL_GENERAL = 'General';
/* DESC: Dragonfly is waiting for host connection */
ui_strings.S_INFO_WAITING_FORHOST_CONNECTION = "Waiting for a host connection on port %s.";
/* DESC: the given storage type doesn't exist, e.g. a widget without the w3 widget namespace
 * will not have a widget.preferences storage object.
 */
ui_strings.S_INFO_STORAGE_TYPE_DOES_NOT_EXIST = "%s does not exist.";

/*
 * Alerts
 */

/* DESC: Error when people use the Drafgonfly URL right in the browser */
ui_strings.S_INFO_WRONG_START = "Opera Dragonfly cannot be used in this way.\n" +
  "Either set the current url in\n\n" +
  "   opera:config > Developer Tools > Developer Tools URL\n\n" +
  "or setup a debugger environment with a proxy and server.";
/* DESC: Information shown when the user enables remote debug and still has to connect the client. */
ui_strings.S_INFO_WAITING_FOR_CONNECTION =
  "Opera Dragonfly is waiting for a connection on port %s.\n" +
  "Please enter opera:debug in your device's URL field to connect.";
/* DESC: Information shown if the service is not available. */
ui_strings.S_INFO_SERVICE_NOT_AVAILABLE =  "Service is not available: %s";
/* DESC: DEPRECATED Information shown when the user needs to select a runtime. */
ui_strings.S_INFO_NO_RUNTIME_SELECTED =  "Select a runtime";
/* DESC: Shown when entering something on the command line while there is no javascript running in the window being debugged */
ui_strings.S_INFO_NO_JAVASCRIPT_IN_CONTEXT =  "There is no JavaScript environment in the active window";

ui_strings.S_INFO_NO_COMPATIBLE_VERSION =  "There is no compatible Opera Dragonfly version.";

ui_strings.S_CONFIRM_LOAD_COMPATIBLE_VERSION = "The protocol version of Opera does not match the one which Opera Dragonfly is using.\n\nTry to load a compatible version?";
/* DESC: The info text in an alert box if the user has specified an invalid port number for remote debugging. */
ui_strings.S_INFO_NO_VALID_PORT_NUMBER = "Please select a port number between 1 and 65535.";

/*
 * other strings
 */

/* DESC: Entry format in the call stack view showing the function name, line number and script ID. Please do not modify the %(VARIABLE)s . */
ui_strings.S_TEXT_CALL_STACK_FRAME_LINE =  "%(FUNCTION_NAME)s: Line %(LINE_NUMBER)s (Script ID %(SCRIPT_ID)s)";
/* DESC: The layout subview showing the box-model metrics of an element. */
ui_strings.M_VIEW_SUB_LABEL_METRICS =  "Metrics";
/* DESC: The layout subview showing the parent node chain used to calculøate the offset. */
ui_strings.M_VIEW_SUB_LABEL_PARENT_OFFSETS =  "Parent Offsets";
/* DESC: The layout subvie showing offsets of the selected element. */
ui_strings.M_VIEW_SUB_LABEL_OFFSET_VALUES =  "Offset Values";
/* DESC: Information on the Scope protocol version used. */
ui_strings.S_TEXT_ENVIRONMENT_PROTOCOL_VERSION = "Protocol Version";
/* DESC: Information on the operating system used. */
ui_strings.S_TEXT_ENVIRONMENT_OPERATING_SYSTEM = "Operating System";
/* DESC: Information on the platform in use. */
ui_strings.S_TEXT_ENVIRONMENT_PLATFORM = "Platform";
/* DESC: Information on the user-agent submitted. */
ui_strings.S_TEXT_ENVIRONMENT_USER_AGENT = "User Agent";
/* DESC: Information on the Opera Dragonfly version number. */
ui_strings.S_TEXT_ENVIRONMENT_DRAGONFLY_VERSION = "Opera Dragonfly Version";
/* DESC: Information on the Opera Dragonfly revision number. */
ui_strings.S_TEXT_ENVIRONMENT_REVISION_NUMBER = "Revision Number";
/* DESC: Badge for inline scripts. */
ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_INLINE = "Inline";
/* DESC: Badge for linked scripts. */
ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_LINKED = "Linked";
/* DESC: Badge for unknown script types. */
ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_UNKNOWN = "Unknown";
/* DESC: The script ID. */
ui_strings.S_TEXT_ECMA_SCRIPT_SCRIPT_ID = "Script id";
/* DESC: Result text for the search. Please do not modify the %(VARIABLE)s . */
ui_strings.S_TEXT_STATUS_SEARCH = "Matches for \"%(SEARCH_TERM)s\": Match %(SEARCH_COUNT_INDEX)s out of %(SEARCH_COUNT_TOTAL)s";
/*  */
ui_strings.S_TEXT_STATUS_SEARCH_NO_MATCH = "No match for \"%(SEARCH_TERM)s\"";
/* DESC: DEPRECATED Message in detail view of http logger when no request/response is selected */
ui_strings.S_TEXT_NO_REQUEST_SELECTED = "No request selected.";
/* DESC: Prefix before debug output */
ui_strings.DRAGONFLY_INFO_MESSAGE = "Opera Dragonfly info message:\n";
/* DESC: shown in response view of http logger when request isn't finished */
ui_strings.S_HTTP_REQUEST_IN_PROGRESS = "Request in progress";
/* DESC: The string "None" used wherever there's an abscense of something */
ui_strings.S_NONE = "None";

