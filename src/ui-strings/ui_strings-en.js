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

/* DESC: Confirm dialog text for asking if the user wants to redo the search because the context has changed. */
ui_strings.D_REDO_SEARCH = "The searched document no longer exists.\nRepeat search in the current document?";

/* DESC: Confirm dialog text for asking if the user wants to reload and reformat the scripts now. */
ui_strings.D_REFORMAT_SCRIPTS = "Reload the page to reformat the scripts now?";

/* DESC: Confirm dialog text for asking if the user wants to reload all scripts. */
ui_strings.D_RELOAD_SCRIPTS = "Not all scripts are loaded. Do you want to reload the page?";

/* DESC: Alert dialog that updating of the custom shortcuts with new ones has failed. */
ui_strings.D_SHORTCUTS_UPDATE_FAILED = "Failed to sync custom shortcuts. The shortcuts are reset to the default ones.";

/* DESC: Context menu item for adding an attribute in the DOM view. */
ui_strings.M_CONTEXTMENU_ADD_ATTRIBUTE = "Add attribute";

/* DESC: Context menu item for adding a breakpoint. */
ui_strings.M_CONTEXTMENU_ADD_BREAKPOINT = "Add breakpoint";

/* DESC: Context menu item to add a color in the color palette. */
ui_strings.M_CONTEXTMENU_ADD_COLOR = "Add color";

/* DESC: Context menu item for breakpoints to add a condition. */
ui_strings.M_CONTEXTMENU_ADD_CONDITION = "Add condition";

/* DESC: Context menu item for adding a declaration in a rule. */
ui_strings.M_CONTEXTMENU_ADD_DECLARATION = "Add declaration";

/* DESC: Context menu item for adding a something to watches. */
ui_strings.M_CONTEXTMENU_ADD_WATCH = "Watch \"%s\"";

/* DESC: Context menu item for collapsing a node subtree. */
ui_strings.M_CONTEXTMENU_COLLAPSE_SUBTREE = "Collapse subtree";

/* DESC: Context menu item, general "Delete" in a context, e.g. a breakpoint */
ui_strings.M_CONTEXTMENU_DELETE = "Delete";

/* DESC: Context menu item, general "Delete all" in a context, e.g. breakpoints */
ui_strings.M_CONTEXTMENU_DELETE_ALL = "Delete all";

/* DESC: Context menu item for deleting all breakpoints */
ui_strings.M_CONTEXTMENU_DELETE_ALL_BREAKPOINTS = "Delete all breakpoints";

/* DESC: Context menu item for deleting a breakpoint. */
ui_strings.M_CONTEXTMENU_DELETE_BREAKPOINT = "Delete breakpoint";

/* DESC: Context menu item to delete a color in the color palette. */
ui_strings.M_CONTEXTMENU_DELETE_COLOR = "Delete color";

/* DESC: Context menu item for breakpoints to delete a condition. */
ui_strings.M_CONTEXTMENU_DELETE_CONDITION = "Delete condition";

/* DESC: Context menu item, general "Disable all" in a context, e.g. breakpoints */
ui_strings.M_CONTEXTMENU_DISABLE_ALL = "Disable all";

/* DESC: Context menu item for disabling all breakpoints */
ui_strings.M_CONTEXTMENU_DISABLE_ALL_BREAKPOINTS = "Disable all breakpoints";

/* DESC: Context menu item for disabling a breakpoint. */
ui_strings.M_CONTEXTMENU_DISABLE_BREAKPOINT = "Disable breakpoint";

/* DESC: Context menu item for disabling all declarations in a rule. */
ui_strings.M_CONTEXTMENU_DISABLE_DECLARATIONS = "Disable all declarations";

/* DESC: Context menu item for editing an attribute name in the DOM view. */
ui_strings.M_CONTEXTMENU_EDIT_ATTRIBUTE = "Edit attribute";

/* DESC: Context menu item for editing an attribute value in the DOM view. */
ui_strings.M_CONTEXTMENU_EDIT_ATTRIBUTE_VALUE = "Edit attribute value";

/* DESC: Context menu item to edit a color in the color palette. */
ui_strings.M_CONTEXTMENU_EDIT_COLOR = "Edit color";

/* DESC: Context menu item for breakpoints to edit a condition. */
ui_strings.M_CONTEXTMENU_EDIT_CONDITION = "Edit condition";

/* DESC: Context menu item for editiing a declaration in a rule. */
ui_strings.M_CONTEXTMENU_EDIT_DECLARATION = "Edit declaration";

/* DESC: Context menu item for editing some piece of markup in the DOM view. */
ui_strings.M_CONTEXTMENU_EDIT_MARKUP = "Edit markup";

/* DESC: Context menu item for editing text in the DOM view. */
ui_strings.M_CONTEXTMENU_EDIT_TEXT = "Edit text";

/* DESC: Context menu item for enabling a breakpoint. */
ui_strings.M_CONTEXTMENU_ENABLE_BREAKPOINT = "Enable breakpoint";

/* DESC: Context menu item for expanding a node subtree. */
ui_strings.M_CONTEXTMENU_EXPAND_SUBTREE = "Expand subtree";

/* DESC: Context menu item for showing the color picker. */
ui_strings.M_CONTEXTMENU_OPEN_COLOR_PICKER = "Open color picker";

/* DESC: Context menu item for removing a property in a rule. */
ui_strings.M_CONTEXTMENU_REMOVE_DECLARATION = "Delete declaration";

/* DESC: Context menu item for removing a node in the DOM view. */
ui_strings.M_CONTEXTMENU_REMOVE_NODE = "Delete node";

/* DESC: Show resource context menu entry. */
ui_strings.M_CONTEXTMENU_SHOW_RESOURCE = "Show resource";

/* DESC: Context menu item for specification links. */
ui_strings.M_CONTEXTMENU_SPEC_LINK = "Specification for \"%s\"";

/* DESC: Context menu item for adding an item in the storage view. */
ui_strings.M_CONTEXTMENU_STORAGE_ADD = "Add item";

/* DESC: Context menu item for deleting an item in the storage view. */
ui_strings.M_CONTEXTMENU_STORAGE_DELETE = "Delete item";

/* DESC: Context menu item for editing an item in the storage view, where %s is the domain name. */
ui_strings.M_CONTEXTMENU_STORAGE_DELETE_ALL_FROM = "Delete all from %s";

/* DESC: Context menu item for deleting multiple items in the storage view. */
ui_strings.M_CONTEXTMENU_STORAGE_DELETE_PLURAL = "Delete items";

/* DESC: Context menu item for editing an item in the storage view. */
ui_strings.M_CONTEXTMENU_STORAGE_EDIT = "Edit item";

/* DESC: Label for option that clears all errors */
ui_strings.M_LABEL_CLEAR_ALL_ERRORS = "Clear all errors";

/* DESC: Label for user interface language dropdown in settings */
ui_strings.M_LABEL_UI_LANGUAGE = "User interface language";

/* DESC: Label for request body input in network crafter */
ui_strings.M_NETWORK_CRAFTER_REQUEST_BODY = "Request body";

/* DESC: Label for response body input in network crafter */
ui_strings.M_NETWORK_CRAFTER_RESPONSE_BODY = "Response";

/* DESC: Label for send request button in network crafter */
ui_strings.M_NETWORK_CRAFTER_SEND = "Send request";

/* DESC: Label for request duration */
ui_strings.M_NETWORK_REQUEST_DETAIL_DURATION = "Duration";

/* DESC: Label for get response body int network request view */
ui_strings.M_NETWORK_REQUEST_DETAIL_GET_RESPONSE_BODY_LABEL = "Get response body";

/* DESC: Label request status */
ui_strings.M_NETWORK_REQUEST_DETAIL_STATUS = "Status";

/* DESC: General settings label. */
ui_strings.M_SETTING_LABEL_GENERAL = "General";

/* DESC: Context menu entry to selecting to group by %s */
ui_strings.M_SORTABLE_TABLE_CONTEXT_GROUP_BY = "Group by \"%s\"";

/* DESC: Context menu entry to select that there should be no grouping in the table */
ui_strings.M_SORTABLE_TABLE_CONTEXT_NO_GROUPING = "No grouping";

/* DESC: Context menu entry to reset the columns that are shown */
ui_strings.M_SORTABLE_TABLE_CONTEXT_RESET_COLUMNS = "Reset columns";

/* DESC: Context menu entry to reset the sort order */
ui_strings.M_SORTABLE_TABLE_CONTEXT_RESET_SORT = "Reset sorting";

/* DESC: view that shows all resources */
ui_strings.M_VIEW_LABEL_ALL_RESOURCES = "All resources";

/* DESC: view to set and remove breakpoints */
ui_strings.M_VIEW_LABEL_BREAKPOINTS = "Breakpoints";

/* DESC: Tab heading for area for call stack overview, a list of function calls. */
ui_strings.M_VIEW_LABEL_CALLSTACK = "Call Stack";

/* DESC: Label of the pixel magnifier and color picker view */
ui_strings.M_VIEW_LABEL_COLOR_MAGNIFIER_AND_PICKER = "Pixel Magnifier and Color Picker";

/* DESC: View of the palette of the stored colors. */
ui_strings.M_VIEW_LABEL_COLOR_PALETTE = "Color Palette";

/* DESC: View of the palette of the stored colors. */
ui_strings.M_VIEW_LABEL_COLOR_PALETTE_SHORT = "Palette";

/* DESC: View with a screenshot to select a color. */
ui_strings.M_VIEW_LABEL_COLOR_PICKER = "Color Picker";

/* DESC: Label of the section for selecting a color in color picker */
ui_strings.M_VIEW_LABEL_COLOR_SELECT = "Color Select";

/* DESC: Command line. */
ui_strings.M_VIEW_LABEL_COMMAND_LINE = "Console";

/* DESC: View for DOM debugging. */
ui_strings.M_VIEW_LABEL_COMPOSITE_DOM = "Documents";

/* DESC: View for error log. */
ui_strings.M_VIEW_LABEL_COMPOSITE_ERROR_CONSOLE = "Errors";

/* DESC: Tab heading for the view for exported code. */
ui_strings.M_VIEW_LABEL_COMPOSITE_EXPORTS = "Export";

/* DESC: Tab heading for the view for script debuggingand Settings label. */
ui_strings.M_VIEW_LABEL_COMPOSITE_SCRIPTS = "Scripts";

/* DESC: Menu heading, expandable, for displaying the styles that the rendering computed from all stylesheets. */
ui_strings.M_VIEW_LABEL_COMPUTED_STYLE = "Computed Style";

/* DESC: The view on the console. */
ui_strings.M_VIEW_LABEL_CONSOLE = "Error Panels";

/* DESC: view for cookies */
ui_strings.M_VIEW_LABEL_COOKIES = "Cookies";

/* DESC: View to see the DOM tree. */
ui_strings.M_VIEW_LABEL_DOM = "DOM Panel";

/* DESC: Tab heading for the list of properties of a selected DOM node and a Settings label. */
ui_strings.M_VIEW_LABEL_DOM_ATTR = "Properties";

/* DESC: Tab heading for area giving information of the runtime environment. */
ui_strings.M_VIEW_LABEL_ENVIRONMENT = "Environment";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing all errors. */
ui_strings.M_VIEW_LABEL_ERROR_ALL = "All";

/* DESC: See Opera Error console: Error view filter for showing all Bittorrent errors. */
ui_strings.M_VIEW_LABEL_ERROR_BITTORRENT = "BitTorrent";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing all CSS errors. */
ui_strings.M_VIEW_LABEL_ERROR_CSS = "CSS";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing all HTML errors. */
ui_strings.M_VIEW_LABEL_ERROR_HTML = "HTML";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing all Java errors. */
ui_strings.M_VIEW_LABEL_ERROR_JAVA = "Java";

/* DESC: Tooltip that explains File:Line notation (e.g. in Error Log) */
ui_strings.M_VIEW_LABEL_ERROR_LOCATION_TITLE = "Line %(LINE)s in %(URI)s";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing all Mail errors. */
ui_strings.M_VIEW_LABEL_ERROR_M2 = "Mail";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing all Network errors. */
ui_strings.M_VIEW_LABEL_ERROR_NETWORK = "Network";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing errors that we don't have a dedicated tab for. */
ui_strings.M_VIEW_LABEL_ERROR_OTHER = "Other";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing all JS errors. */
ui_strings.M_VIEW_LABEL_ERROR_SCRIPT = "JavaScript";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing all Storage errors. */
ui_strings.M_VIEW_LABEL_ERROR_STORAGE = "Storage";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing all SVG errors. */
ui_strings.M_VIEW_LABEL_ERROR_SVG = "SVG";

/* DESC: See Opera Error console: Error view filter for showing all Widget errors. */
ui_strings.M_VIEW_LABEL_ERROR_WIDGET = "Widgets";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing all XML errors. */
ui_strings.M_VIEW_LABEL_ERROR_XML = "XML";

/* DESC: Tab heading, subhead under the Error Console tab for the error view filter for showing all XSLT errors. */
ui_strings.M_VIEW_LABEL_ERROR_XSLT = "XSLT";

/* DESC: view to set and remove event breakpoints */
ui_strings.M_VIEW_LABEL_EVENT_BREAKPOINTS = "Event Breakpoints";

/* DESC: Side panel view with event listeners. */
ui_strings.M_VIEW_LABEL_EVENT_LISTENERS = "Listeners";

/* DESC: View with all event listeners. */
ui_strings.M_VIEW_LABEL_EVENT_LISTENERS_ALL = "All";

/* DESC: View with the event listeners of the selected node. */
ui_strings.M_VIEW_LABEL_EVENT_LISTENERS_SELECTED_NODE = "Selected Node";

/* DESC: Heading for Export button, accessed by clicking the subhead DOM view button. */
ui_strings.M_VIEW_LABEL_EXPORT = "Export";

/* DESC: Tab heading for the area displaying JS properties of a frame or object and a Settings label. */
ui_strings.M_VIEW_LABEL_FRAME_INSPECTION = "Inspection";

/* DESC: Label for a utility window that enables the user to enter a line number, and go to that line. */
ui_strings.M_VIEW_LABEL_GO_TO_LINE = "Go to line";

/* DESC: Tab heading for the box model layout display and a Settings label. */
ui_strings.M_VIEW_LABEL_LAYOUT = "Layout";

/* DESC: view for the local storage */
ui_strings.M_VIEW_LABEL_LOCAL_STORAGE = "Local Storage";

/* DESC: Label for the setting of the monospace font. */
ui_strings.M_VIEW_LABEL_MONOSPACE_FONT = "Monospace Font";

/* DESC: Tab heading for the view for network debugging (and http logger) */
ui_strings.M_VIEW_LABEL_NETWORK = "Network";

/* DESC: view that shows network log */
ui_strings.M_VIEW_LABEL_NETWORK_LOG = "Network log";

/* DESC: view that shows network options */
ui_strings.M_VIEW_LABEL_NETWORK_OPTIONS = "Network options";

/* DESC: Section title for new styles. */
ui_strings.M_VIEW_LABEL_NEW_STYLE = "New Style";

/* DESC: Text to show in call stack when the execution is not stopped. */
ui_strings.M_VIEW_LABEL_NOT_STOPPED = "Not stopped";

/* DESC: Text to show in breakpoins if there is no breakpoint. */
ui_strings.M_VIEW_LABEL_NO_BREAKPOINT = "No breakpoint";

/* DESC: Text to show in inspection if there is no object to inspect. */
ui_strings.M_VIEW_LABEL_NO_INSPECTION = "No inspection";

/* DESC: The content of the return value section when there are not return values. */
ui_strings.M_VIEW_LABEL_NO_RETURN_VALUES = "No return values";

/* DESC: Text to show in watches if there are no watches */
ui_strings.M_VIEW_LABEL_NO_WATCHES = "No watches";

/* DESC: View for DOM debugging. */
ui_strings.M_VIEW_LABEL_PROFILER = "Profiler";

/* DESC: Name of raw request tab */
ui_strings.M_VIEW_LABEL_RAW_REQUEST_INFO = "Raw request";

/* DESC: Name of raw response tab */
ui_strings.M_VIEW_LABEL_RAW_RESPONSE_INFO = "Raw Response";

/* DESC: view that shows request crafter */
ui_strings.M_VIEW_LABEL_REQUEST_CRAFTER = "Make request";

/* DESC: Name of request headers tab */
ui_strings.M_VIEW_LABEL_REQUEST_HEADERS = "Request Headers";

/* DESC: Name of request log tab */
ui_strings.M_VIEW_LABEL_REQUEST_LOG = "Request log";

/* DESC: Name of request summary view */
ui_strings.M_VIEW_LABEL_REQUEST_SUMMARY = "Request Summary";

/* DESC: View for overview of resources contained in a document */
ui_strings.M_VIEW_LABEL_RESOURCES = "Resources";

/* DESC: Name of response body tab */
ui_strings.M_VIEW_LABEL_RESPONSE_BODY = "Response body";

/* DESC: Name of response headers tab */
ui_strings.M_VIEW_LABEL_RESPONSE_HEADERS = "Response Headers";

/* DESC: Section in the script side panel for return values. */
ui_strings.M_VIEW_LABEL_RETURN_VALUES = "Return Values";

/* DESC: side panel in the script view with the callstack and the inspection view. */
ui_strings.M_VIEW_LABEL_RUNTIME_STATE = "State";

/* DESC: Subhead located under the Scripts area, for scripts contained in runtime. */
ui_strings.M_VIEW_LABEL_SCRIPTS = "Scripts";

/* DESC: Tab heading for the search panel. */
ui_strings.M_VIEW_LABEL_SEARCH = "Search";

/* DESC: view for the session storage */
ui_strings.M_VIEW_LABEL_SESSION_STORAGE = "Session Storage";

/* DESC: Tab heading for area giving source code view and Settings label . */
ui_strings.M_VIEW_LABEL_SOURCE = "Source";

/* DESC: View for all types of storage, cookies, localStorage, sessionStorage e.t.c */
ui_strings.M_VIEW_LABEL_STORAGE = "Storage";

/* DESC: Label of the stored colors view */
ui_strings.M_VIEW_LABEL_STORED_COLORS = "Color Palette";

/* DESC: Tab heading for the list of all applied styles and a Settings label; also menu heading, expandable, for displaying the styles that got defined in the style sheets. */
ui_strings.M_VIEW_LABEL_STYLES = "Styles";

/* DESC: Tab heading for the view to see style sheet rules and a Settings label. */
ui_strings.M_VIEW_LABEL_STYLESHEET = "Style Sheet";

/* DESC: Tab heading, a subhead under DOM, for area displaying style sheets in the runtime. */
ui_strings.M_VIEW_LABEL_STYLESHEETS = "Style Sheets";

/* DESC: Tab heading for thread log overview, a list of threads and Settings label. */
ui_strings.M_VIEW_LABEL_THREAD_LOG = "Thread Log";

/* DESC: View for utilities, e.g. a pixel maginfier and color picker */
ui_strings.M_VIEW_LABEL_UTILITIES = "Utilities";

/* DESC: Label of the Views menu. */
ui_strings.M_VIEW_LABEL_VIEWS = "Views";

/* DESC: section in the script side panel for watches. */
ui_strings.M_VIEW_LABEL_WATCHES = "Watches";

/* DESC: view for widget prefernces */
ui_strings.M_VIEW_LABEL_WIDGET_PREFERNCES = "Widget Preferences";

/* DESC: Label for the layout subview showing the box-model metrics of an element. */
ui_strings.M_VIEW_SUB_LABEL_METRICS = "Metrics";

/* DESC: Label for the layout subvie showing offsets of the selected element. */
ui_strings.M_VIEW_SUB_LABEL_OFFSET_VALUES = "Offset Values";

/* DESC: Label for the layout subview showing the parent node chain used to calculate the offset. */
ui_strings.M_VIEW_SUB_LABEL_PARENT_OFFSETS = "Parent Offsets";

/* DESC: Anonymous function label. */
ui_strings.S_ANONYMOUS_FUNCTION_NAME = "(anonymous)";

/* DESC: Info in a tooltip that the according listener was set as attribute. */
ui_strings.S_ATTRIBUTE_LISTENER = "Event handler";

/* DESC: Generic label for a cancel button */
ui_strings.S_BUTTON_CANCEL = "Cancel";

/* DESC: Cancel button while the client is waiting for a host connection. */
ui_strings.S_BUTTON_CANCEL_REMOTE_DEBUG = "Cancel Remote Debug";

/* DESC: Reset all the values to their default state */
ui_strings.S_BUTTON_COLOR_RESTORE_DEFAULTS = "Restore defaults";

/* DESC: Edit custom events */
ui_strings.S_BUTTON_EDIT_CUSTOM_EVENT = "Edit";

/* DESC: Enter anvanced search mode */
ui_strings.S_BUTTON_ENTER_ADVANCED_SEARCH = "More";

/* DESC: Enter anvanced search mode tooltip */
ui_strings.S_BUTTON_ENTER_ADVANCED_SEARCH_TOOLTIP = "Show advanced search";

/* DESC: Expand all sections in the event breakpoints view */
ui_strings.S_BUTTON_EXPAND_ALL_SECTIONS = "Expand all sections";

/* DESC: Execution stops at encountering an abort. */
ui_strings.S_BUTTON_LABEL_AT_ABORT = "Stop when encountering an abort message";

/* DESC: Execution stops when encountering an error. */
ui_strings.S_BUTTON_LABEL_AT_ERROR = "Show parse errors and break on exceptions";

/* DESC: Execution stops when encountering an exception. */
ui_strings.S_BUTTON_LABEL_AT_EXCEPTION = "Break when an exception is thrown";

/* DESC: Empties the log entries. */
ui_strings.S_BUTTON_LABEL_CLEAR_LOG = "Clear visible errors";

/* DESC: Tooltip text for a button on the Thread Log view to clear thread log. */
ui_strings.S_BUTTON_LABEL_CLEAR_THREAD_LOG = "Clear thread log";

/* DESC: Closes the window. */
ui_strings.S_BUTTON_LABEL_CLOSE_WINDOW = "Close window";

/* DESC: Debugger continues debugging. */
ui_strings.S_BUTTON_LABEL_CONTINUE = "Continue (%s)";

/* DESC: Exports the DOM currently shown. */
ui_strings.S_BUTTON_LABEL_EXPORT_DOM = "Export the current DOM panel";

/* DESC: Also Tooltip text for a button on the Thread Log view to export current thread log. */
ui_strings.S_BUTTON_LABEL_EXPORT_LOG = "Export thread log";

/* DESC: Tooltip text for a button under the secondary DOM tab that expands the DOM tree completely. */
ui_strings.S_BUTTON_LABEL_GET_THE_WOHLE_TREE = "Expand the DOM tree";

/* DESC: Opens help. */
ui_strings.S_BUTTON_LABEL_HELP = "Help";

/* DESC: Hides all default properties in the global scope. */
ui_strings.S_BUTTON_LABEL_HIDE_DEFAULT_PROPS_IN_GLOBAL_SCOPE = "Show default properties in global scope";

/* DESC: List item under the Source settings menu to logs all threads when activated. Also Tooltip text for a button on the Source tab. */
ui_strings.S_BUTTON_LABEL_LOG_THREADS = "Log threads";

/* DESC: Refetch the event listeners. */
ui_strings.S_BUTTON_LABEL_REFETCH_EVENT_LISTENERS = "Refetch event listeners";

/* DESC: Enable reformatting of JavaScript. */
ui_strings.S_BUTTON_LABEL_REFORMAT_JAVASCRIPT = "Pretty-print JavaScript";

/* DESC: Tooltip text for a button under the Scripts tab that reloads the browser to receive fresh DOM, etc. */
ui_strings.S_BUTTON_LABEL_RELOAD_HOST = "Reload the selected window in the browser";

/* DESC: For selecting which window to debug. */
ui_strings.S_BUTTON_LABEL_SELECT_WINDOW = "Select the debugging context you want to debug";

/* DESC: Tooltip text for the Settings button that launches the Settings view. */
ui_strings.S_BUTTON_LABEL_SETTINGS = "Settings";

/* DESC: Debugger step into current statement. */
ui_strings.S_BUTTON_LABEL_STEP_INTO = "Step into (%s)";

/* DESC: Debugger step out from current statement. */
ui_strings.S_BUTTON_LABEL_STEP_OUT = "Step out (%s)";

/* DESC: Debugger step over current statement. */
ui_strings.S_BUTTON_LABEL_STEP_OVER = "Step over (%s)";

/* DESC: Execution stops when a new script is encountered. */
ui_strings.S_BUTTON_LABEL_STOP_AT_THREAD = "Break on first statement of a new script";

/* DESC: Leave anvanced search mode */
ui_strings.S_BUTTON_LEAVE_ADVANCED_SEARCH = "Less";

/* DESC: Leave anvanced search mode tooltip */
ui_strings.S_BUTTON_LEAVE_ADVANCED_SEARCH_TOOLTIP = "Show search bar";

/* DESC: Button label to show window for loading a PO file */
ui_strings.S_BUTTON_LOAD_PO_FILE = "Load PO file";

/* DESC: Generic label for an OK button */
ui_strings.S_BUTTON_OK = "OK";

/* DESC: Remove all event breakpoints */
ui_strings.S_BUTTON_REMOVE_ALL_BREAKPOINTS = "Delete all event breakpoints";

/* DESC: Reset all keyboard shortcuts to the default values. */
ui_strings.S_BUTTON_RESET_ALL_TO_DEFAULTS = "Reset all to defaults";

/* DESC: Button label to reset the fon selection to the default values */
ui_strings.S_BUTTON_RESET_TO_DEFAULTS = "Reset default values";

/* DESC: Generic label for a save button */
ui_strings.S_BUTTON_SAVE = "Save";

/* DESC: Search for an event in the event breakpoints view */
ui_strings.S_BUTTON_SEARCH_EVENT = "Search for an event";

/* DESC: Search for a keyboard shortcut in the keyboard configuration view */
ui_strings.S_BUTTON_SEARCH_SHORTCUT = "Search keyboard shortcuts";

/* DESC: Set the default value. */
ui_strings.S_BUTTON_SET_DEFAULT_VALUE = "Reset default value";

/* DESC: Show request headers. */
ui_strings.S_BUTTON_SHOW_REQUEST_HEADERS = "Headers";

/* DESC: Show raw request. */
ui_strings.S_BUTTON_SHOW_REQUEST_RAW = "Raw";

/* DESC: Show request summary. */
ui_strings.S_BUTTON_SHOW_REQUEST_SUMMARY = "Summary";

/* DESC: Button label in settings to reset the element highlight to the default values */
ui_strings.S_BUTTON_SPOTLIGHT_RESET_DEFAULT_COLORS = "Reset default colors";

/* DESC: Button title for starting the profiler */
ui_strings.S_BUTTON_START_PROFILER = "Start profiling";

/* DESC: Button title for stopping the profiler */
ui_strings.S_BUTTON_STOP_PROFILER = "Stop profiling";

/* DESC: Button label to delete all items in a storage, e.g. the local storage */
ui_strings.S_BUTTON_STORAGE_DELETE_ALL = "Delete All";

/* DESC: Button label to store the color */
ui_strings.S_BUTTON_STORE_COLOR = "Store color";

/* DESC: Button to switch to network-profiler mode. */
ui_strings.S_BUTTON_SWITCH_TO_NETWORK_PROFILER = "Improve accuracy of timing information";

/* DESC: Button label to take a screenshot */
ui_strings.S_BUTTON_TAKE_SCREENSHOT = "Take screenshot";

/* DESC: Label for button in Remote Debugging that applies the changes. */
ui_strings.S_BUTTON_TEXT_APPLY = "Apply";

/* DESC: Global console toggle */
ui_strings.S_BUTTON_TOGGLE_CONSOLE = "Toggle console";

/* DESC: Global remote debug toggle */
ui_strings.S_BUTTON_TOGGLE_REMOTE_DEBUG = "Remote debug configuration";

/* DESC: Global settings toggle */
ui_strings.S_BUTTON_TOGGLE_SETTINGS = "Settings";

/* DESC: Button label to update the screenshot */
ui_strings.S_BUTTON_UPDATE_SCREESHOT = "Update screenshot";

/* DESC: Unit string for bytes */
ui_strings.S_BYTES_UNIT = "bytes";

/* DESC: Clears the command line log */
ui_strings.S_CLEAR_COMMAND_LINE_LOG = "Clear console";

/* DESC: Label on button to clear network graph */
ui_strings.S_CLEAR_NETWORK_LOG = "Clear network log";

/* DESC: Close command line window */
ui_strings.S_CLOSE_COMMAND_LINE = "Close console";

/* DESC: Setting for changing the color notation (Hex, RGB, HSL) */
ui_strings.S_COLOR_NOTATION = "Color format";

/* DESC: Average color setting, " x pixels" will be added */
ui_strings.S_COLOR_PICKER_AVERAGE_COLOR_OF = "Average color of";

/* DESC: Table heading for column showing error descriptions */
ui_strings.S_COLUMN_LABEL_ERROR = "Error";

/* DESC: Table heading for "file" column */
ui_strings.S_COLUMN_LABEL_FILE = "File";

/* DESC: Table heading for column showing line number */
ui_strings.S_COLUMN_LABEL_LINE = "Line";

/* DESC: Message about having to load a different version of dragonfly in order to work with the browser bing debugged */
ui_strings.S_CONFIRM_LOAD_COMPATIBLE_VERSION = "The protocol version of Opera does not match the one which Opera Dragonfly is using.\n\nTry to load a compatible version?";

/* DESC: Dialog to confirm switching to network-profiler mode. */
ui_strings.S_CONFIRM_SWITCH_TO_NETWORK_PROFILER = "To improve the accuracy of timing information, other features are turned off. You may lose changes you made.";

/* DESC: Label for the list of function when doing console.trace(). */
ui_strings.S_CONSOLE_TRACE_LABEL = "Stack trace:";

/* DESC: In 1 hour */
ui_strings.S_COOKIE_MANAGER_IN_1_HOUR = "In 1 hour";

/* DESC: In 1 minute */
ui_strings.S_COOKIE_MANAGER_IN_1_MINUTE = "In 1 minute";

/* DESC: In 1 month */
ui_strings.S_COOKIE_MANAGER_IN_1_MONTH = "In 1 month";

/* DESC: In 1 week */
ui_strings.S_COOKIE_MANAGER_IN_1_WEEK = "In 1 week";

/* DESC: In 1 year */
ui_strings.S_COOKIE_MANAGER_IN_1_YEAR = "In 1 year";

/* DESC: In x days */
ui_strings.S_COOKIE_MANAGER_IN_X_DAYS = "In %s days";

/* DESC: In x hours */
ui_strings.S_COOKIE_MANAGER_IN_X_HOURS = "In %s hours";

/* DESC: In x minutes */
ui_strings.S_COOKIE_MANAGER_IN_X_MINUTES = "In %s minutes";

/* DESC: In x months */
ui_strings.S_COOKIE_MANAGER_IN_X_MONTHS = "In %s months";

/* DESC: In x weeks */
ui_strings.S_COOKIE_MANAGER_IN_X_WEEKS = "In %s weeks";

/* DESC: In x years */
ui_strings.S_COOKIE_MANAGER_IN_X_YEARS = "In %s years";

/* DESC: In less then 1 minute */
ui_strings.S_COOKIE_MANAGER_SOONER_THEN_1_MINUTE = "< 1 minute";

/* DESC: Tomorrow */
ui_strings.S_COOKIE_MANAGER_TOMORROW = "Tomorrow";

/* DESC: Tooltip for disabling a declaration */
ui_strings.S_DISABLE_DECLARATION = "Disable";

/* DESC: Prefix before debug output */
ui_strings.S_DRAGONFLY_INFO_MESSAGE = "Opera Dragonfly info message:\n";

/* DESC: Tooltip for enabling a declaration */
ui_strings.S_ENABLE_DECLARATION = "Enable";

/* DESC: Info text that explains that only a certain number %(MAX)s of Errors is shown, out of a total of %(COUNT)s */
ui_strings.S_ERRORS_MAXIMUM_REACHED = "Displaying %(MAX)s of %(COUNT)s errors";

/* DESC: List of filters that will be hidden in the Error log */
ui_strings.S_ERROR_LOG_CSS_FILTER = "Use CSS filter";

/* DESC: Link in an event listener tooltip to the source position where the listener is added. */
ui_strings.S_EVENT_LISTENER_ADDED_IN = "Added in %s";

/* DESC: Info in an event listener tooltip that the according listener was added in the markup as element attribute. */
ui_strings.S_EVENT_LISTENER_SET_AS_MARKUP_ATTR = "Set as markup attribute";

/* DESC: Info in a tooltip that the according listener was set by the event target interface. */
ui_strings.S_EVENT_TARGET_LISTENER = "Event listener";

/* DESC: Event type for events in the profiler */
ui_strings.S_EVENT_TYPE_CSS_PARSING = "CSS parsing";

/* DESC: Event type for events in the profiler */
ui_strings.S_EVENT_TYPE_CSS_SELECTOR_MATCHING = "CSS selector matching";

/* DESC: Event type for events in the profiler */
ui_strings.S_EVENT_TYPE_DOCUMENT_PARSING = "Document parsing";

/* DESC: Event type for events in the profiler */
ui_strings.S_EVENT_TYPE_GENERIC = "Generic";

/* DESC: Event type for events in the profiler */
ui_strings.S_EVENT_TYPE_LAYOUT = "Layout";

/* DESC: Event type for events in the profiler */
ui_strings.S_EVENT_TYPE_PAINT = "Paint";

/* DESC: Event type for events in the profiler */
ui_strings.S_EVENT_TYPE_PROCESS = "Process";

/* DESC: Event type for events in the profiler */
ui_strings.S_EVENT_TYPE_REFLOW = "Reflow";

/* DESC: Event type for events in the profiler */
ui_strings.S_EVENT_TYPE_SCRIPT_COMPILATION = "Script compilation";

/* DESC: Event type for events in the profiler */
ui_strings.S_EVENT_TYPE_STYLE_RECALCULATION = "Style recalculation";

/* DESC: Event type for events in the profiler */
ui_strings.S_EVENT_TYPE_THREAD_EVALUATION = "Thread evaluation";

/* DESC: Context menu item for expanding CSS shorthands */
ui_strings.S_EXPAND_SHORTHANDS = "Expand shorthands";

/* DESC: Label for the global keyboard shortcuts section */
ui_strings.S_GLOBAL_KEYBOARD_SHORTCUTS_SECTION_TITLE = "Global";

/* DESC: Global scope label. */
ui_strings.S_GLOBAL_SCOPE_NAME = "(global)";

/* DESC: Show help in command line */
ui_strings.S_HELP_COMMAND_LINE = "Help";

/* DESC: Label for http event sequence when urlfinished follows after some other event, meaning it was aborted */
ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_ABORTING_REQUEST = "Request aborted";

/* DESC: Label for http event sequence when redirecting */
ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_ABORT_RETRYING = "Sequence terminated, retry";

/* DESC: Label for http event sequence when closing response phase */
ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_CLOSING_RESPONSE_PHASE = "Closing response phase";

/* DESC: Label for http event sequence when processing */
ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_PROCESSING = "Processing";

/* DESC: Label for http event sequence when processing response */
ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_PROCESSING_RESPONSE = "Processing response";

/* DESC: Label for http event sequence when reading local data (data-uri, caches, file:// etc) */
ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_READING_LOCAL_DATA = "Reading local data";

/* DESC: Label for http event sequence when redirecting */
ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_REDIRECTING = "Redirecting";

/* DESC: Label for http event sequence when the event was scheduled */
ui_strings.S_HTTP_EVENT_SEQUENCE_INFO_SCHEDULING = "Scheduling request";

/* DESC: Label for http event sequence when reading response body */
ui_strings.S_HTTP_EVENT_SEQUENCE_READING_RESPONSE_BODY = "Reading response body";

/* DESC: Label for http event sequence when reading response header */
ui_strings.S_HTTP_EVENT_SEQUENCE_READING_RESPONSE_HEADER = "Reading response header";

/* DESC: Label for http event sequence when waiting for response from network */
ui_strings.S_HTTP_EVENT_SEQUENCE_WAITING_FOR_RESPONSE = "Waiting for response";

/* DESC: Label for http event sequence when writing request body */
ui_strings.S_HTTP_EVENT_SEQUENCE_WRITING_REQUEST_BODY = "Writing request body";

/* DESC: Label for http event sequence when writing request header */
ui_strings.S_HTTP_EVENT_SEQUENCE_WRITING_REQUEST_HEADER = "Writing request header";

/* DESC: First line of dialog that explains that the loading flow of the context is not shown completely */
ui_strings.S_HTTP_INCOMPLETE_LOADING_GRAPH = "Reload to show all page requests";

/* DESC: tooltip for the network data view button */
ui_strings.S_HTTP_LABEL_DATA_VIEW = "Data view";

/* DESC: label for table header that shows duration (short) */
ui_strings.S_HTTP_LABEL_DURATION = "Duration";

/* DESC: label for the network filter that shows all items */
ui_strings.S_HTTP_LABEL_FILTER_ALL = "All";

/* DESC: label for the network filter that shows image items */
ui_strings.S_HTTP_LABEL_FILTER_IMAGES = "Images";

/* DESC: label for the network filter that shows markup items */
ui_strings.S_HTTP_LABEL_FILTER_MARKUP = "Markup";

/* DESC: label for the network filter that shows items that are not markup, stylesheet, script or image */
ui_strings.S_HTTP_LABEL_FILTER_OTHER = "Other";

/* DESC: label for the network filter that shows script items */
ui_strings.S_HTTP_LABEL_FILTER_SCRIPTS = "Scripts";

/* DESC: label for the network filter that shows stylesheet items */
ui_strings.S_HTTP_LABEL_FILTER_STYLESHEETS = "Stylesheets";

/* DESC: label for the network filter that shows items requested over XMLHttpRequest */
ui_strings.S_HTTP_LABEL_FILTER_XHR = "XHR";

/* DESC: label for table header that shows loading sequence as a graph (short) */
ui_strings.S_HTTP_LABEL_GRAPH = "Graph";

/* DESC: tooltip for the network graph view button */
ui_strings.S_HTTP_LABEL_GRAPH_VIEW = "Graph view";

/* DESC: label for host in http request details */
ui_strings.S_HTTP_LABEL_HOST = "Host";

/* DESC: label for method in http request details */
ui_strings.S_HTTP_LABEL_METHOD = "Method";

/* DESC: label for path in http request details */
ui_strings.S_HTTP_LABEL_PATH = "Path";

/* DESC: label for query arguments in http request details */
ui_strings.S_HTTP_LABEL_QUERY_ARGS = "Query arguments";

/* DESC: label for response in http request details */
ui_strings.S_HTTP_LABEL_RESPONSE = "Response";

/* DESC: label for table header that shows http response code (short) */
ui_strings.S_HTTP_LABEL_RESPONSECODE = "Status";

/* DESC: label for table header that shows starting time (short) */
ui_strings.S_HTTP_LABEL_STARTED = "Started";

/* DESC: label for url in http request details */
ui_strings.S_HTTP_LABEL_URL = "URL";

/* DESC: label for table header that shows waiting time (short) */
ui_strings.S_HTTP_LABEL_WAITING = "Waiting";

/* DESC: tooltip for resources that have not been requested over network (mostly that means cached) */
ui_strings.S_HTTP_NOT_REQUESTED = "Cached";

/* DESC: Headline for network-sequence tooltip that shows the absolute time when the resource was requested internally */
ui_strings.S_HTTP_REQUESTED_HEADLINE = "Requested at %s";

/* DESC: tooltip for resources served over file:// to make it explicit that this didn't touch the network */
ui_strings.S_HTTP_SERVED_OVER_FILE = "Local";

/* DESC: tooltip for table header that shows duration */
ui_strings.S_HTTP_TOOLTIP_DURATION = "Time spent between starting and finishing this request";

/* DESC: tooltip for the network filter that shows all items */
ui_strings.S_HTTP_TOOLTIP_FILTER_ALL = "Show all requests";

/* DESC: tooltip for the network filter that shows image items */
ui_strings.S_HTTP_TOOLTIP_FILTER_IMAGES = "Show only images";

/* DESC: tooltip for the network filter that shows markup items */
ui_strings.S_HTTP_TOOLTIP_FILTER_MARKUP = "Show only markup";

/* DESC: tooltip for the network filter that shows items that are not markup, stylesheet, script or image */
ui_strings.S_HTTP_TOOLTIP_FILTER_OTHER = "Show requests of other types";

/* DESC: tooltip for the network filter that shows script items */
ui_strings.S_HTTP_TOOLTIP_FILTER_SCRIPTS = "Show only scripts";

/* DESC: tooltip for the network filter that shows stylesheet items */
ui_strings.S_HTTP_TOOLTIP_FILTER_STYLESHEETS = "Show only stylesheets";

/* DESC: tooltip for the network filter that shows items requested over XMLHttpRequest */
ui_strings.S_HTTP_TOOLTIP_FILTER_XHR = "Show only XMLHttpRequests";

/* DESC: tooltip for table header that shows loading sequence as a graph */
ui_strings.S_HTTP_TOOLTIP_GRAPH = "Graph of the loading sequence";

/* DESC: tooltip on mime type table header */
ui_strings.S_HTTP_TOOLTIP_MIME = "MIME type";

/* DESC: tooltip on protocol table header */
ui_strings.S_HTTP_TOOLTIP_PROTOCOL = "Protocol";

/* DESC: tooltip on table header that shows http response code */
ui_strings.S_HTTP_TOOLTIP_RESPONSECODE = "HTTP status code";

/* DESC: tooltip on size table header */
ui_strings.S_HTTP_TOOLTIP_SIZE = "Content-length of the response in bytes";

/* DESC: tooltip on prettyprinted size table header */
ui_strings.S_HTTP_TOOLTIP_SIZE_PRETTYPRINTED = "Content-length of the response";

/* DESC: tooltip for table header that shows relative starting time */
ui_strings.S_HTTP_TOOLTIP_STARTED = "Starting time, relative to the main document";

/* DESC: tooltip for table header that shows waiting time */
ui_strings.S_HTTP_TOOLTIP_WAITING = "Time spent requesting this resource";

/* DESC: tooltip-prefix for resources that have been marked unloaded, which means they are no longer reference in the document */
ui_strings.S_HTTP_UNREFERENCED = "Unreferenced";

/* DESC: Information shown if the document does not hold any style sheet. */
ui_strings.S_INFO_DOCUMENT_HAS_NO_STYLESHEETS = "This document has no style sheets";

/* DESC: Feedback showing that Opera Dragonfly is loading and the user shall have patience. */
ui_strings.S_INFO_DOCUMNENT_LOADING = "Updating Opera Dragonfly…";

/* DESC: There was an error trying to listen to the specified port */
ui_strings.S_INFO_ERROR_LISTENING = "There was an error. Please check that port %s is not in use.";

/* DESC: A info message that the debugger is currently in HTTP profiler mode. */
ui_strings.S_INFO_HTTP_PROFILER_MODE = "The debugger is in HTTP profiler mode. All other features are disabled.";

/* DESC: Information shown if the user tries to perform a reg exp search with an invalid regular expression. */
ui_strings.S_INFO_INVALID_REGEXP = "Invalid regular expression.";

/* DESC: Info text in the settings to invert the highlight color for elements. */
ui_strings.S_INFO_INVERT_ELEMENT_HIGHLIGHT = "The element highlight color can be inverted with the \"%s\" shortcut.";

/* DESC: The info text to notify the user that the application is performing the search. */
ui_strings.S_INFO_IS_SEARCHING = "Searching…";

/* DESC: Info in an event listener tooltip that the according source file is missing. */
ui_strings.S_INFO_MISSING_JS_SOURCE_FILE = "(Missing source file)";

/* DESC: Info text in the network view when a page starts to load while screen updats are paused */
ui_strings.S_INFO_NETWORK_UPDATES_PAUSED = "Updating of network log is paused.";

/* DESC: Message about there being no version of dragonfly compatible with the browser being debugged */
ui_strings.S_INFO_NO_COMPATIBLE_VERSION = "There is no compatible Opera Dragonfly version.";

/* DESC: Shown when entering something on the command line while there is no javascript running in the window being debugged */
ui_strings.S_INFO_NO_JAVASCRIPT_IN_CONTEXT = "There is no JavaScript environment in the active window";

/* DESC: The info text in an alert box if the user has specified an invalid port number for remote debugging. */
ui_strings.S_INFO_NO_VALID_PORT_NUMBER = "Please select a port number between %s and %s.";

/* DESC: A info message that the debugger is currently in profiler mode. */
ui_strings.S_INFO_PROFILER_MODE = "The debugger is in profiler mode. All other features are disabled.";

/* DESC: Information shown if the user tries to perform a reg exp search which matches the empty string. */
ui_strings.S_INFO_REGEXP_MATCHES_EMPTY_STRING = "RegExp matches empty string. No search was performed.";

/* DESC: Currently no scripts are loaded and a reload of the page will resolve all linked scripts. */
ui_strings.S_INFO_RELOAD_FOR_SCRIPT = "Click the reload button above to fetch the scripts for the selected debugging context";

/* DESC: Info text in when a request in the request crafter failed. */
ui_strings.S_INFO_REQUEST_FAILED = "The request failed.";

/* DESC: Information shown if the document does not hold any scripts. Appears in Scripts view. */
ui_strings.S_INFO_RUNTIME_HAS_NO_SCRIPTS = "This document has no scripts";

/* DESC: the given storage type doesn't exist, e.g. a widget without the w3c widget namespace */
ui_strings.S_INFO_STORAGE_TYPE_DOES_NOT_EXIST = "%s does not exist.";

/* DESC: Information shown if the stylesheet does not hold any style rules. */
ui_strings.S_INFO_STYLESHEET_HAS_NO_RULES = "This style sheet has no rules";

/* DESC: The info text to notify the user that only a part of the search results are displayed. */
ui_strings.S_INFO_TOO_MANY_SEARCH_RESULTS = "Displaying %(MAX)s of %(COUNT)s";

/* DESC: Dragonfly is waiting for host connection */
ui_strings.S_INFO_WAITING_FORHOST_CONNECTION = "Waiting for a host connection on port %s.";

/* DESC: Information shown if the window has no runtime, e.g. speed dial. */
ui_strings.S_INFO_WINDOW_HAS_NO_RUNTIME = "This window has no runtime";

/* DESC: Inhertied from, " <element name>" will be added */
ui_strings.S_INHERITED_FROM = "Inherited from";

/* DESC: For filter fields. */
ui_strings.S_INPUT_DEFAULT_TEXT_FILTER = "Filter";

/* DESC: Label for search fields. */
ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH = "Search";

/* DESC: Heading for the area where the user can configure keyboard shortcuts in settings. */
ui_strings.S_KEYBOARD_SHORTCUTS_CONFIGURATION = "Configuration";

/* DESC: Context menu entry that brings up "Add watch" UI, Label for "Add watch" button */
ui_strings.S_LABEL_ADD_WATCH = "Add watch";

/* DESC: Instruction in settings how to change the user language. The place holder will be replace with an according link to the user setting in opera:config. */
ui_strings.S_LABEL_CHANGE_UI_LANGUAGE_INFO = "Change %s to one of";

/* DESC: A setting to define which prototypes of inspected js objects should be collapsed by default. */
ui_strings.S_LABEL_COLLAPSED_INSPECTED_PROTOTYPES = "Default collapsed prototype objects (a list of prototypes, e.g. Object, Array, etc. * will collapse all): ";

/* DESC: Label for the hue of a color value. */
ui_strings.S_LABEL_COLOR_HUE = "Hue";

/* DESC: Label for the luminosity of a color value. */
ui_strings.S_LABEL_COLOR_LUMINOSITY = "Luminosity";

/* DESC: Label for the opacity of a color value. */
ui_strings.S_LABEL_COLOR_OPACITY = "Opacity";

/* DESC: Setting label to select the sample size of the color picker */
ui_strings.S_LABEL_COLOR_PICKER_SAMPLE_SIZE = "Sample Size";

/* DESC: Setting label to select the zoom level of the color picker */
ui_strings.S_LABEL_COLOR_PICKER_ZOOM = "Zoom";

/* DESC: Label for the saturation of a color value. */
ui_strings.S_LABEL_COLOR_SATURATION = "Saturation";

/* DESC: Context menu entry that brings up "Add cookie" UI, Label for "Add Cookie" button */
ui_strings.S_LABEL_COOKIE_MANAGER_ADD_COOKIE = "Add cookie";

/* DESC: Label for the domain that is set for a cookie */
ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_DOMAIN = "Domain";

/* DESC: Label for the expiry when cookie has already expired */
ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRED = "(expired)";

/* DESC: Label for the expiry value of a cookie */
ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES = "Expires";

/* DESC: Label for the expiry when cookie expires after the session is closed */
ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES_ON_SESSION_CLOSE = "When session ends, e.g. the tab is closed";

/* DESC: Label for the expiry when cookie expires after the session is closed */
ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_EXPIRES_ON_SESSION_CLOSE_SHORT = "Session";

/* DESC: Label for the name (key) of a cookie */
ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_NAME = "Name";

/* DESC: Label for the value of a cookie */
ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_PATH = "Path";

/* DESC: Label for the value of a cookie or storage item */
ui_strings.S_LABEL_COOKIE_MANAGER_COOKIE_VALUE = "Value";

/* DESC: Context menu entry that brings up "Edit cookie" UI */
ui_strings.S_LABEL_COOKIE_MANAGER_EDIT_COOKIE = "Edit cookie";

/* DESC: Label for grouping by runtime (lowercase) */
ui_strings.S_LABEL_COOKIE_MANAGER_GROUPER_RUNTIME = "runtime";

/* DESC: Label for isHTTPOnly flag on a cookie */
ui_strings.S_LABEL_COOKIE_MANAGER_HTTP_ONLY = "HTTPOnly";

/* DESC: Context menu entry that removes cookie */
ui_strings.S_LABEL_COOKIE_MANAGER_REMOVE_COOKIE = "Delete cookie";

/* DESC: Context menu entry that removes cookies (plural) */
ui_strings.S_LABEL_COOKIE_MANAGER_REMOVE_COOKIES = "Delete cookies";

/* DESC: Context menu entry that removes cookies of specific group */
ui_strings.S_LABEL_COOKIE_MANAGER_REMOVE_COOKIES_OF = "Delete cookies from %s";

/* DESC: Label for isSecure flag on a cookie, set if cookie is only transmitted on secure connections */
ui_strings.S_LABEL_COOKIE_MANAGER_SECURE_CONNECTIONS_ONLY = "Secure";

/* DESC: Setting label to switch back to the default setting */
ui_strings.S_LABEL_DEFAULT_SELECTION = "Default";

/* DESC: Context menu entry that removes all watches */
ui_strings.S_LABEL_DELETE_ALL_WATCHES = "Delete all watches";

/* DESC: Context menu entry that removes watch */
ui_strings.S_LABEL_DELETE_WATCH = "Delete watch";

/* DESC: Label for a button in a dialog to dismiss in so it won't be shown again */
ui_strings.S_LABEL_DIALOG_DONT_SHOW_AGAIN = "Do not show again";

/* DESC: Context menu entry that brings up "Edit" UI */
ui_strings.S_LABEL_EDIT_WATCH = "Edit watch";

/* DESC: Button label to enable the default debugger features. */
ui_strings.S_LABEL_ENABLE_DEFAULT_FEATURES = "Enable the default debugger features";

/* DESC: Setting label to select the font face */
ui_strings.S_LABEL_FONT_SELECTION_FACE = "Font face";

/* DESC: Setting label to select the line height */
ui_strings.S_LABEL_FONT_SELECTION_LINE_HEIGHT = "Line height";

/* DESC: Setting label to select the font face */
ui_strings.S_LABEL_FONT_SELECTION_SIZE = "Font size";

/* DESC: Label of a section in the keyboard configuration for a specific view */
ui_strings.S_LABEL_KEYBOARDCONFIG_FOR_VIEW = "Keyboard shortcuts %s";

/* DESC: Label of an invalid keyboard shortcut */
ui_strings.S_LABEL_KEYBOARDCONFIG_INVALID_SHORTCUT = "Invalid keyboard shortcut";

/* DESC: Label of a subsection in the keyboard configuration */
ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_DEFAULT = "Default";

/* DESC: Label of a subsection in the keyboard configuration */
ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_EDIT = "Edit";

/* DESC: Label of a subsection in the keyboard configuration */
ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_EDIT_ATTR_AND_TEXT = "Edit Attributes and Text";

/* DESC: Label of a subsection in the keyboard configuration */
ui_strings.S_LABEL_KEYBOARDCONFIG_MODE_EDIT_MARKUP = "Edit markup";

/* DESC: Settings label for the maximum number of search hits in the search panel. */
ui_strings.S_LABEL_MAX_SEARCH_HITS = "Maximum number of search results";

/* DESC: Button tooltip */
ui_strings.S_LABEL_MOVE_HIGHLIGHT_DOWN = "Find next";

/* DESC: Button tooltip */
ui_strings.S_LABEL_MOVE_HIGHLIGHT_UP = "Find previous";

/* DESC: Label for the name column header of a form field in a POST */
ui_strings.S_LABEL_NETWORK_POST_DATA_NAME = "Name";

/* DESC: Label for the value column header of a form value in a POST */
ui_strings.S_LABEL_NETWORK_POST_DATA_VALUE = "Value";

/* DESC: Label for the network port to connect to. */
ui_strings.S_LABEL_PORT = "Port";

/* DESC: In the command line, choose the size of the typed history */
ui_strings.S_LABEL_REPL_BACKLOG_LENGTH = "Number of lines of stored history";

/* DESC: Label of a subsection in the keyboard configuration */
ui_strings.S_LABEL_REPL_MODE_AUTOCOMPLETE = "Autocomplete";

/* DESC: Label of a subsection in the keyboard configuration */
ui_strings.S_LABEL_REPL_MODE_DEFAULT = "Default";

/* DESC: Label of a subsection in the keyboard configuration */
ui_strings.S_LABEL_REPL_MODE_MULTILINE = "Multi-line edit";

/* DESC: Label of a subsection in the keyboard configuration */
ui_strings.S_LABEL_REPL_MODE_SINGLELINE = "Single-line edit";

/* DESC: Label of the section with the scope chain in the Inspection view */
ui_strings.S_LABEL_SCOPE_CHAIN = "Scope Chain";

/* DESC: Checkbox label to search in all files in the JS search pane. */
ui_strings.S_LABEL_SEARCH_ALL_FILES = "All files";

/* DESC: Checkbox label to set the 'ignore case' flag search panel. */
ui_strings.S_LABEL_SEARCH_FLAG_IGNORE_CASE = "Ignore case";

/* DESC: Checkbox label to search in injected scripts in the JS search pane. */
ui_strings.S_LABEL_SEARCH_INJECTED_SCRIPTS = "Injected";

/* DESC: Tooltip for the injected scripts search settings label. */
ui_strings.S_LABEL_SEARCH_INJECTED_SCRIPTS_TOOLTIP = "Search in all injected scripts, including Browser JS, Extension JS and User JS";

/* DESC: Radio label for the search type 'Selector' (as in CSS Selector) in the DOM search panel. */
ui_strings.S_LABEL_SEARCH_TYPE_CSS = "Selector";

/* DESC: RRadio label for the search type 'RegExp' in the DOM search panel. */
ui_strings.S_LABEL_SEARCH_TYPE_REGEXP = "RegExp";

/* DESC: Radio label for the search type 'Text' in the DOM search panel. */
ui_strings.S_LABEL_SEARCH_TYPE_TEXT = "Text";

/* DESC: Radio label for the search type 'XPath' in the DOM search panel. */
ui_strings.S_LABEL_SEARCH_TYPE_XPATH = "XPath";

/* DESC: Settings label to show a tooltip for the hovered identifier in the source view. */
ui_strings.S_LABEL_SHOW_JS_TOOLTIP = "Show inspection tooltip";

/* DESC: Enable smart reformatting of JavaScript. */
ui_strings.S_LABEL_SMART_REFORMAT_JAVASCRIPT = "Smart JavaScript pretty-printing";

/* DESC: Settings label to configure the element highlight color */
ui_strings.S_LABEL_SPOTLIGHT_TITLE = "Element Highlight";

/* DESC: Button label to add an item in a storage, e.g. in the local storage */
ui_strings.S_LABEL_STORAGE_ADD = "Add";

/* DESC: Label for "Add storage_type" button */
ui_strings.S_LABEL_STORAGE_ADD_STORAGE_TYPE = "Add %s";

/* DESC: Button label to delete an item in a storage, e.g. in the local storage */
ui_strings.S_LABEL_STORAGE_DELETE = "Delete";

/* DESC: Tool tip in a storage view to inform the user how to edit an item */
ui_strings.S_LABEL_STORAGE_DOUBLE_CLICK_TO_EDIT = "Double-click to edit";

/* DESC: Label for the key (identifier) of a storage item */
ui_strings.S_LABEL_STORAGE_KEY = "Key";

/* DESC: Button label to update a view with all items of a storage, e.g. of the local storage */
ui_strings.S_LABEL_STORAGE_UPDATE = "Update";

/* DESC: Tab size in source view. */
ui_strings.S_LABEL_TAB_SIZE = "Tab Size";

/* DESC: Area as in size. choices are 10 x 10, and so on. */
ui_strings.S_LABEL_UTIL_AREA = "Area";

/* DESC: Scale */
ui_strings.S_LABEL_UTIL_SCALE = "Scale";

/* DESC: Info in an event listener tooltip that the according listener listens in the bubbling phase. */
ui_strings.S_LISTENER_BUBBLING_PHASE = "bubbling";

/* DESC: Info in an event listener tooltip that the according listener listens in the capturing phase. */
ui_strings.S_LISTENER_CAPTURING_PHASE = "capturing";

/* DESC: Debug context menu */
ui_strings.S_MENU_DEBUG_CONTEXT = "Select the debugging context";

/* DESC: Reload the debug context. */
ui_strings.S_MENU_RELOAD_DEBUG_CONTEXT = "Reload Debugging Context";

/* DESC: Reload the debug context (shorter than S_MENU_RELOAD_DEBUG_CONTEXT). */
ui_strings.S_MENU_RELOAD_DEBUG_CONTEXT_SHORT = "Reload";

/* DESC: Select the active window as debugger context. */
ui_strings.S_MENU_SELECT_ACTIVE_WINDOW = "Select Active Window";

/* DESC: String used when the user has clicked to get a resource body, but dragonfly wasn't able to do so. */
ui_strings.S_NETWORK_BODY_NOT_AVAILABLE = "Request body not available. Enable resource tracking and reload the page to view the resource.";

/* DESC: Name of network caching setting for default browser caching policy */
ui_strings.S_NETWORK_CACHING_SETTING_DEFAULT_LABEL = "Standard browser caching behavior";

/* DESC: Help text for explaining caching setting in global network options */
ui_strings.S_NETWORK_CACHING_SETTING_DESC = "This setting controls how caching works when Opera Dragonfly is running. When caching is disabled, Opera always reloads the page.";

/* DESC: Name of network caching setting for disabling browser caching policy */
ui_strings.S_NETWORK_CACHING_SETTING_DISABLED_LABEL = "Disable all caching";

/* DESC: Title for caching settings section in global network options */
ui_strings.S_NETWORK_CACHING_SETTING_TITLE = "Caching behavior";

/* DESC: Can't show request data, as we don't know the type of it. */
ui_strings.S_NETWORK_CANT_DISPLAY_TYPE = "Cannot display content of type %s";

/* DESC: Name of content tracking setting for tracking content */
ui_strings.S_NETWORK_CONTENT_TRACKING_SETTING_TRACK_LABEL = "Track content (affects speed/memory)";

/* DESC: Explanation of how to enable content tracking. */
ui_strings.S_NETWORK_ENABLE_CONTENT_TRACKING_FOR_REQUEST = "Enable content tracking in the \"network options\" panel to see request bodies";

/* DESC: Example value to show what header formats look like. Header-name */
ui_strings.S_NETWORK_HEADER_EXAMPLE_VAL_NAME = "Header-name";

/* DESC: Example value to show what header formats look like. Header-value */
ui_strings.S_NETWORK_HEADER_EXAMPLE_VAL_VALUE = "Header-value";

/* DESC: Description of network header overrides feature. */
ui_strings.S_NETWORK_HEADER_OVERRIDES_DESC = "Headers in the override box will be used for all requests in the debugged browser. They will override normal headers.";

/* DESC: Label for checkbox to enable global header overrides */
ui_strings.S_NETWORK_HEADER_OVERRIDES_LABEL = "Enable global header overrides";

/* DESC: Label for presets */
ui_strings.S_NETWORK_HEADER_OVERRIDES_PRESETS_LABEL = "Presets";

/* DESC: Label for save nbutton */
ui_strings.S_NETWORK_HEADER_OVERRIDES_PRESETS_SAVE = "Save";

/* DESC: Label for selecting an empty preset */
ui_strings.S_NETWORK_HEADER_OVERRIDES_PRESET_NONE = "None";

/* DESC: Title of global header overrides section in global network settings */
ui_strings.S_NETWORK_HEADER_OVERRIDES_TITLE = "Global header overrides";

/* DESC: Title of request body section when the body is multipart-encoded */
ui_strings.S_NETWORK_MULTIPART_REQUEST_TITLE = "Request - multipart";

/* DESC: Explanation about why a network entry doesn't have request data: General */
ui_strings.S_NETWORK_NOT_REQUESTED = "No request made.";

/* DESC: String used when there is a request body we can't show the contents of directly. */
ui_strings.S_NETWORK_N_BYTE_BODY = "Request body of %s bytes";

/* DESC: Name of networks raw-view setting, shows requests and responses raw instead of parsed */
ui_strings.S_NETWORK_RAW_VIEW_LABEL = "Show raw requests and responses";

/* DESC: Name of entry in Network Log, used in summary at the end */
ui_strings.S_NETWORK_REQUEST = "Request";

/* DESC: Name of entry in Network Log, plural, used in summary at the end */
ui_strings.S_NETWORK_REQUESTS = "Requests";

/* DESC: Help text about how to always track resources in request view */
ui_strings.S_NETWORK_REQUEST_DETAIL_BODY_DESC = "Response body not tracked. To always fetch response bodies, toggle the \"Track content\" option in Settings. To retrieve only this body, click the button.";

/* DESC: Message about not yet available response body */
ui_strings.S_NETWORK_REQUEST_DETAIL_BODY_UNFINISHED = "Response body not available until the request is finished.";

/* DESC: Help text about how a request body could not be show because it's no longer available. */
ui_strings.S_NETWORK_REQUEST_DETAIL_NO_RESPONSE_BODY = "Response body not available. Enable the \"Track content\" option in Settings and reload the page to view the resource.";

/* DESC: Title for request details section */
ui_strings.S_NETWORK_REQUEST_DETAIL_REQUEST_TITLE = "Request";

/* DESC: Title for response details section */
ui_strings.S_NETWORK_REQUEST_DETAIL_RESPONSE_TITLE = "Response";

/* DESC: Message about file types we have no good way of showing. */
ui_strings.S_NETWORK_REQUEST_DETAIL_UNDISPLAYABLE_BODY_LABEL = "Unable to show data of type %s";

/* DESC: Message about there being no headers attached to a specific request or response */
ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL = "No headers";

/* DESC: Explanation about why a network entry doesn't have request data: Came from Cache */
ui_strings.S_NETWORK_SERVED_FROM_CACHE = "No request made. All data was retrieved from cache without accessing the network.";

/* DESC: Unknown mime type for content */
ui_strings.S_NETWORK_UNKNOWN_MIME_TYPE = "MIME type not known for request data";

/* DESC: The string "None" used wherever there's an absence of something */
ui_strings.S_NONE = "None";

/* DESC: Info in the DOM side panel that the selected node has no event listeners attached. */
ui_strings.S_NO_EVENT_LISTENER = "No event listeners";

/* DESC: Label in a tooltip */
ui_strings.S_PROFILER_AREA_DIMENSION = "Area";

/* DESC: Label in a tooltip */
ui_strings.S_PROFILER_AREA_LOCATION = "Location";

/* DESC: Message in the profiler when the profiler is calculating */
ui_strings.S_PROFILER_CALCULATING = "Calculating…";

/* DESC: Label in a tooltip */
ui_strings.S_PROFILER_DURATION = "Duration";

/* DESC: Message in the profiler when no data was "captured" by the profiler */
ui_strings.S_PROFILER_NO_DATA = "No data";

/* DESC: Message when an event in the profiler has no details */
ui_strings.S_PROFILER_NO_DETAILS = "No details";

/* DESC: Message in the profiler when the profiler is active */
ui_strings.S_PROFILER_PROFILING = "Profiling…";

/* DESC: Message in the profiler when the profiler failed */
ui_strings.S_PROFILER_PROFILING_FAILED = "Profiling failed";

/* DESC: Message before activating the profiler profile */
ui_strings.S_PROFILER_RELOAD = "To get accurate data from the profiler, all other features have to be disabled and the document has to be reloaded.";

/* DESC: Label in a tooltip */
ui_strings.S_PROFILER_SELF_TIME = "Self time";

/* DESC: Message before starting the profiler */
ui_strings.S_PROFILER_START_MESSAGE = "Press the Record button to start profiling";

/* DESC: Label in a tooltip */
ui_strings.S_PROFILER_START_TIME = "Start";

/* DESC: Label in a tooltip */
ui_strings.S_PROFILER_TOTAL_SELF_TIME = "Total self time";

/* DESC: Label in a tooltip */
ui_strings.S_PROFILER_TYPE_EVENT = "Event name";

/* DESC: Label in a tooltip */
ui_strings.S_PROFILER_TYPE_SCRIPT = "Script type";

/* DESC: Label in a tooltip */
ui_strings.S_PROFILER_TYPE_SELECTOR = "Selector";

/* DESC: Label in a tooltip */
ui_strings.S_PROFILER_TYPE_THREAD = "Thread type";

/* DESC: Remote debug guide, connection setup */
ui_strings.S_REMOTE_DEBUG_GUIDE_PRECONNECT_HEADER = "Steps to enable remote debugging:";

/* DESC: Remote debug guide, connection setup */
ui_strings.S_REMOTE_DEBUG_GUIDE_PRECONNECT_STEP_1 = "Specify the port number you wish to connect to, or leave as the default";

/* DESC: Remote debug guide, connection setup */
ui_strings.S_REMOTE_DEBUG_GUIDE_PRECONNECT_STEP_2 = "Click \"Apply\"";

/* DESC: Remote debug guide, waiting for connection */
ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_HEADER = "On the remote device:";

/* DESC: Remote debug guide, waiting for connection */
ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_1 = "Enter opera:debug in the URL field";

/* DESC: Remote debug guide, waiting for connection */
ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_2 = "Enter the IP address of the machine running Opera Dragonfly";

/* DESC: Remote debug guide, waiting for connection */
ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_3 = "Enter the port number %s";

/* DESC: Remote debug guide, waiting for connection */
ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_4 = "Click \"Connect\"";

/* DESC: Remote debug guide, waiting for connection */
ui_strings.S_REMOTE_DEBUG_GUIDE_WAITING_STEP_5 = "Once connected navigate to the page you wish to debug";

/* DESC: Description of the "help" command in the repl */
ui_strings.S_REPL_HELP_COMMAND_DESC = "Show a list of all available commands";

/* DESC: Description of the "jquery" command in the repl */
ui_strings.S_REPL_JQUERY_COMMAND_DESC = "Load jQuery in the active tab";

/* DESC: Printed in the command line view when it is shown for the first time. */
ui_strings.S_REPL_WELCOME_TEXT = "Type %(CLEAR_COMMAND)s to clear the console.\nType %(HELP_COMMAND)s for more information.";

/* DESC: "Not applicable" abbreviation */
ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE = "n/a";

/* DESC: Name of host column */
ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_HOST = "Host";

/* DESC: Name of mime column */
ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_MIME = "MIME";

/* DESC: Name of path column */
ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PATH = "Path";

/* DESC: Name of pretty printed size column */
ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PPSIZE = "Size (pretty printed)";

/* DESC: Name of protocol column */
ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PROTOCOL = "Protocol";

/* DESC: Name of size column */
ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_SIZE = "Size";

/* DESC: Name of type column */
ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_TYPE = "Type";

/* DESC: Name of types size group */
ui_strings.S_RESOURCE_ALL_TABLE_GROUP_GROUPS = "Groups";

/* DESC: Name of hosts size group */
ui_strings.S_RESOURCE_ALL_TABLE_GROUP_HOSTS = "Hosts";

/* DESC: Fallback text for no filename, used as tab label */
ui_strings.S_RESOURCE_ALL_TABLE_NO_FILENAME = "(no name)";

/* DESC: Fallback text for no host */
ui_strings.S_RESOURCE_ALL_TABLE_NO_HOST = "No host";

/* DESC: Fallback text for unknown groups */
ui_strings.S_RESOURCE_ALL_TABLE_UNKNOWN_GROUP = "Unknown";

/* DESC: Click reload button to fetch resources */
ui_strings.S_RESOURCE_CLICK_BUTTON_TO_FETCH_RESOURCES = "Click the reload button above to reload the debugged window and fetch its resources";

/* DESC: Tooltip displayed when hovering the arrow going back in Return Values. The first variable is a file name, the second a line number  */
ui_strings.S_RETURN_VALUES_FUNCTION_FROM = "Returned from %s:%s";

/* DESC: Tooltip displayed when hovering the arrow going forward in Return Values. The first variable is a file name, the second a line number  */
ui_strings.S_RETURN_VALUES_FUNCTION_TO = "Returned to %s:%s";

/* DESC: Label for the global scope in the Scope Chain. */
ui_strings.S_SCOPE_GLOBAL = "Global";

/* DESC: Label for the scopes other than local and global in the Scope Chain. */
ui_strings.S_SCOPE_INNER = "Scope %s";

/* DESC: Section header in the script drop-down select for Browser and User JS. */
ui_strings.S_SCRIPT_SELECT_SECTION_BROWSER_AND_USER_JS = "Browser JS and User JS";

/* DESC: Section header in the script drop-down select for inline, eval, timeout and event handler scripts. */
ui_strings.S_SCRIPT_SELECT_SECTION_INLINE_AND_EVALS = "Inline, eval, timeout and event-handler scripts";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_BROWSERJS = "BrowserJS";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_DEBUGGER = "Debugger";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_EVAL = "Eval";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_EVENT_HANDLER = "Event";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_EXTENSIONJS = "Extension";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_GENERATED = "document.write()";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_INLINE = "Inline";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_LINKED = "External";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_TIMEOUT = "Timeout or interval";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_UNKNOWN = "Unknown";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_URI = "javascript: URL";

/* DESC: Script type for events in the profiler */
ui_strings.S_SCRIPT_TYPE_USERJS = "UserJS";

/* DESC: Tooltip for filtering text-input boxes */
ui_strings.S_SEARCH_INPUT_TOOLTIP = "text search";

/* DESC: Header for settings group "About" */
ui_strings.S_SETTINGS_HEADER_ABOUT = "About";

/* DESC: Header for settings group "Console" */
ui_strings.S_SETTINGS_HEADER_CONSOLE = "Error Log";

/* DESC: Header for settings group "Document" */
ui_strings.S_SETTINGS_HEADER_DOCUMENT = "Documents";

/* DESC: Header for settings group "General" */
ui_strings.S_SETTINGS_HEADER_GENERAL = "General";

/* DESC: Header for settings group "Keyboard shortcuts" */
ui_strings.S_SETTINGS_HEADER_KEYBOARD_SHORTCUTS = "Keyboard shortcuts";

/* DESC: Header for settings group "Network" */
ui_strings.S_SETTINGS_HEADER_NETWORK = "Network";

/* DESC: Header for settings group "Script" */
ui_strings.S_SETTINGS_HEADER_SCRIPT = "Scripts";

/* DESC: Description for CSS rules with the origin being the user */
ui_strings.S_STYLE_ORIGIN_LOCAL = "user stylesheet";

/* DESC: Description for CSS rules with the origin being the SVG presentation attributes */
ui_strings.S_STYLE_ORIGIN_SVG = "presentation attributes";

/* DESC: Description for CSS rules with the origin being the UA */
ui_strings.S_STYLE_ORIGIN_USER_AGENT = "user agent stylesheet";

/* DESC: Tooltip text for a button that attaches Opera Dragonfly to the main browser window. */
ui_strings.S_SWITCH_ATTACH_WINDOW = "Dock to main window";

/* DESC: When enabled, the request log always scroll to the bottom on new requests */
ui_strings.S_SWITCH_AUTO_SCROLL_REQUEST_LIST = "Auto-scroll request log";

/* DESC: Button title for stopping the profiler */
ui_strings.S_SWITCH_CHANGE_START_TO_FIRST_EVENT = "Change start time to first event";

/* DESC: Checkbox: undocks Opera Dragonfly into a separate window. */
ui_strings.S_SWITCH_DETACH_WINDOW = "Undock into separate window";

/* DESC: Expand all (entries in a list) */
ui_strings.S_SWITCH_EXPAND_ALL = "Expand all";

/* DESC: If enabled objects can be expanded inline in the console. */
ui_strings.S_SWITCH_EXPAND_OBJECTS_INLINE = "Expand objects inline in the console";

/* DESC: Will select the element when clicked. */
ui_strings.S_SWITCH_FIND_ELEMENT_BY_CLICKING = "Select an element in the page to inspect it";

/* DESC: When enabled, objects of type element will be friendly printed */
ui_strings.S_SWITCH_FRIENDLY_PRINT = "Enable smart-printing for Element objects in the console";

/* DESC: Shows or hides empty strings and null values. */
ui_strings.S_SWITCH_HIDE_EMPTY_STRINGS = "Show empty strings and null values";

/* DESC: Highlights page elements when thet mouse hovers. */
ui_strings.S_SWITCH_HIGHLIGHT_SELECTED_OR_HOVERED_ELEMENT = "Highlight selected element";

/* DESC: When enabled, objects of type element in the command line will be displayed in the DOM view */
ui_strings.S_SWITCH_IS_ELEMENT_SENSITIVE = "Display Element objects in the DOM panel when selected in the console";

/* DESC: Draw a border on to selected DOM elements */
ui_strings.S_SWITCH_LOCK_SELECTED_ELEMENTS = "Keep elements highlighted";

/* DESC: Switch toggeling if the debugger should automatically reload the page when the user changes the window to debug. */
ui_strings.S_SWITCH_RELOAD_SCRIPTS_AUTOMATICALLY = "Reload new debugging contexts automatically";

/* DESC: Route debugging traffic trough proxy to enable debugging devices */
ui_strings.S_SWITCH_REMOTE_DEBUG = "Remote debug";

/* DESC: Scroll an element in the host into view when selecting it in the DOM. */
ui_strings.S_SWITCH_SCROLL_INTO_VIEW_ON_FIRST_SPOTLIGHT = "Scroll into view on first highlight";

/* DESC: List item in the DOM settings menu to shows or hide comments in DOM. Also Tooltip text for button in the secondary DOM menu. */
ui_strings.S_SWITCH_SHOW_COMMENT_NODES = "Show comment nodes";

/* DESC: Shows DOM in tree or mark-up mode. */
ui_strings.S_SWITCH_SHOW_DOM_INTREE_VIEW = "Represent the DOM as a node tree";

/* DESC: Show ECMAScript errors in the command line. */
ui_strings.S_SWITCH_SHOW_ECMA_ERRORS_IN_COMMAND_LINE = "Show JavaScript errors in the console";

/* DESC: Show default null and empty string values when inspecting a js object. */
ui_strings.S_SWITCH_SHOW_FEFAULT_NULLS_AND_EMPTY_STRINGS = "Show default values if they are null or empty strings";

/* DESC: Showing the id's and class names in the breadcrumb in the statusbar. */
ui_strings.S_SWITCH_SHOW_ID_AND_CLASSES_IN_BREAD_CRUMB = "Show id's and classes in breadcrumb trail";

/* DESC: Toggles the display of pre-set values in the computed styles view. */
ui_strings.S_SWITCH_SHOW_INITIAL_VALUES = "Show initial values";

/* DESC: Show non enumerale properties when inspecting a js object. */
ui_strings.S_SWITCH_SHOW_NON_ENUMERABLES = "Show non-enumerable properties";

/* DESC: There are a lot of window types in Opera. This switch toggles if we show only the useful ones, or all of them. */
ui_strings.S_SWITCH_SHOW_ONLY_NORMAL_AND_GADGETS_TYPE_WINDOWS = "Hide browser-specific contexts, such as mail and feed windows";

/* DESC: Show prototpe objects when inspecting a js object. */
ui_strings.S_SWITCH_SHOW_PROTOTYPES = "Show prototypes";

/* DESC: Show pseudo elements in the DOM view */
ui_strings.S_SWITCH_SHOW_PSEUDO_ELEMENTS = "Show pseudo-elements";

/* DESC: Showing the siblings in the breadcrumb in the statusbar. */
ui_strings.S_SWITCH_SHOW_SIBLINGS_IN_BREAD_CRUMB = "Show siblings in breadcrumb trail";

/* DESC: Switch display of 'All' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_ALL = "All";

/* DESC: Switch display of 'Bittorrent' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_BITTORRENT = "BitTorrent";

/* DESC: Switch display of 'CSS' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_CSS = "CSS";

/* DESC: Switch display of 'HTML' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_HTML = "HTML";

/* DESC: Switch display of 'Java' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_JAVA = "Java";

/* DESC: Switch display of 'Mail' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_M2 = "Mail";

/* DESC: Switch display of 'Network' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_NETWORK = "Network";

/* DESC: Switch display of 'Script' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_SCRIPT = "JavaScript";

/* DESC: Switch display of 'SVG' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_SVG = "SVG";

/* DESC: Switch display of 'Voice' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_VOICE = "Voice";

/* DESC: Switch display of 'Widget' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_WIDGET = "Widgets";

/* DESC: Switch display of 'XML' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_XML = "XML";

/* DESC: Switch display of 'XSLT' tab on or off. */
ui_strings.S_SWITCH_SHOW_TAB_XSLT = "XSLT";

/* DESC: List item in General settings menu to show or hide Views menu. */
ui_strings.S_SWITCH_SHOW_VIEWS_MENU = "Show Views menu";

/* DESC: Shows or hides white space nodes in DOM. */
ui_strings.S_SWITCH_SHOW_WHITE_SPACE_NODES = "Show whitespace nodes";

/* DESC: When enabled, a screenshot is taken automatically on showing utilities */
ui_strings.S_SWITCH_TAKE_SCREENSHOT_AUTOMATICALLY = "Take a screenshot automatically when opening Utilities";

/* DESC: Settings checkbox label for toggling usage tracking. Add one to a running total each time the user starts Dragonfly. */
ui_strings.S_SWITCH_TRACK_USAGE = "Track usage. Sends a randomly-generated user ID to the Opera Dragonfly servers each time Opera Dragonfly is started.";

/* DESC: When enabled, list alike objects will be unpacked in the command line */
ui_strings.S_SWITCH_UNPACK_LIST_ALIKES = "Unpack objects which have list-like behavior in the console";

/* DESC: List item in the DOM settings menu to update the DOM model automatically when a node is being removed. Also Tooltip text for button in the secondary DOM menu. */
ui_strings.S_SWITCH_UPDATE_DOM_ON_NODE_REMOVE = "Update DOM when a node is removed";

/* DESC: List item in the DOM settings menu. */
ui_strings.S_SWITCH_UPDATE_GLOBAL_SCOPE = "Automatically update global scope";

/* DESC: Spell HTML tag names upper or lower case. */
ui_strings.S_SWITCH_USE_LOWER_CASE_TAG_NAMES = "Use lower case tag names for text/html";

/* DESC: Table header in the profiler */
ui_strings.S_TABLE_HEADER_HITS = "Hits";

/* DESC: Table header in the profiler */
ui_strings.S_TABLE_HEADER_TIME = "Time";

/* DESC: Entry format in the call stack view showing the function name, line number and script ID. Please do not modify the %(VARIABLE)s . */
ui_strings.S_TEXT_CALL_STACK_FRAME_LINE = "%(FUNCTION_NAME)s: %(SCRIPT_ID)s:%(LINE_NUMBER)s";

/* DESC: Badge for the script ID in Scripts view. */
ui_strings.S_TEXT_ECMA_SCRIPT_SCRIPT_ID = "Script id";

/* DESC: Badge for inline scripts. */
ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_INLINE = "Inline";

/* DESC: Badge for linked scripts. */
ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_LINKED = "Linked";

/* DESC: Badge for unknown script types. */
ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_UNKNOWN = "Unknown";

/* DESC: Information on the Opera Dragonfly version number that appears in the Environment view. */
ui_strings.S_TEXT_ENVIRONMENT_DRAGONFLY_VERSION = "Opera Dragonfly Version";

/* DESC: Information on the operating system used that appears in the Environment view. */
ui_strings.S_TEXT_ENVIRONMENT_OPERATING_SYSTEM = "Operating System";

/* DESC: Information on the platform in use that appears in the Environment view. */
ui_strings.S_TEXT_ENVIRONMENT_PLATFORM = "Platform";

/* DESC: Information on the Scope protocol version used that appears in the Environment view. */
ui_strings.S_TEXT_ENVIRONMENT_PROTOCOL_VERSION = "Protocol Version";

/* DESC: Information on the Opera Dragonfly revision number that appears in the Environment view. */
ui_strings.S_TEXT_ENVIRONMENT_REVISION_NUMBER = "Revision Number";

/* DESC: Information on the user-agent submitted that appears in the Environment view. */
ui_strings.S_TEXT_ENVIRONMENT_USER_AGENT = "User Agent";

/* DESC: Result text for a search when there were search results. The %(VARIABLE)s should not be translated, but its position in the text can be rearranged. Python syntax: %(VARIABLE)type_identifier, so %(FOO)s in its entirety is replaced. */
ui_strings.S_TEXT_STATUS_SEARCH = "Matches for \"%(SEARCH_TERM)s\": Match %(SEARCH_COUNT_INDEX)s out of %(SEARCH_COUNT_TOTAL)s";

/* DESC: Result text for the search. Please do not modify the %(VARIABLE)s . */
ui_strings.S_TEXT_STATUS_SEARCH_NO_MATCH = "No match for \"%(SEARCH_TERM)s\"";

/* DESC: Thread type for events in the profiler */
ui_strings.S_THREAD_TYPE_COMMON = "Common";

/* DESC: Thread type for events in the profiler */
ui_strings.S_THREAD_TYPE_DEBUGGER_EVAL = "Debugger";

/* DESC: Thread type for events in the profiler */
ui_strings.S_THREAD_TYPE_EVENT = "Event";

/* DESC: Thread type for events in the profiler */
ui_strings.S_THREAD_TYPE_HISTORY_NAVIGATION = "History navigation";

/* DESC: Thread type for events in the profiler */
ui_strings.S_THREAD_TYPE_INLINE_SCRIPT = "Inline script";

/* DESC: Thread type for events in the profiler */
ui_strings.S_THREAD_TYPE_JAVASCRIPT_URL = "javascript: URL";

/* DESC: Thread type for events in the profiler. This should not be translated. */
ui_strings.S_THREAD_TYPE_JAVA_EVAL = "Java (LiveConnect)";

/* DESC: Thread type for events in the profiler */
ui_strings.S_THREAD_TYPE_TIMEOUT = "Timeout or interval";

/* DESC: Thread type for events in the profiler */
ui_strings.S_THREAD_TYPE_UNKNOWN = "Unknown";

/* DESC: Enabling/disabling DOM modebar */
ui_strings.S_TOGGLE_DOM_MODEBAR = "Show breadcrumb trail";

/* DESC: Heading for the setting that toggles the breadcrumb trail */
ui_strings.S_TOGGLE_DOM_MODEBAR_HEADER = "Breadcrumb Trail";

/* DESC: Label on button to pause/unpause updates of the network graph view */
ui_strings.S_TOGGLE_PAUSED_UPDATING_NETWORK_VIEW = "Pause updating network activity";

/* DESC: String shown instead of filename when file name is missing  */
ui_strings.S_UNKNOWN_SCRIPT = "(Unknown script)";

