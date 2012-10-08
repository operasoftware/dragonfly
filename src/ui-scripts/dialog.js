function BaseDialog() {};

BaseDialog.is_visible = false;

BaseDialog.prototype = new function()
{
  /**
   * Show the dialog
   */
  this.show = function()
  {
    if (BaseDialog.is_visible)
    {
      return;
    }
    this._dialog_ele = document.documentElement.render(this._dialog_template);
    this._dialog = this._dialog_ele.firstChild;
    var dialog_style = window.getComputedStyle(this._dialog, null);
    this._dialog.style.width = dialog_style.width;
    this._dialog.style.height = dialog_style.height;
    this._dialog.className = "visible";
    document.addEventListener("click", this._modal_click_handler_bound, true);
    BaseDialog.is_visible = true;
  };

  /**
   * Dismiss the dialog
   */
  this.dismiss = function()
  {
    if (this._dialog_ele)
    {
      this._dialog_ele.parentNode.removeChild(this._dialog_ele);
      document.removeEventListener("click", this._modal_click_handler_bound, true);
    }
    BaseDialog.is_visible = false;
  };

  this._modal_click_handler = function(event)
  {
    var target = event.target;
    var handler_id = target.get_attr("parent-node-chain", "data-handler-id");
    var handler = this._handler_map[handler_id];

    if (handler_id)
    {
      this.dismiss();

      if (handler)
      {
        handler(event, event.target);
      }
    }

    event.stopPropagation();
    event.preventDefault();
  };

  this._get_template = function(template, buttons)
  {
    return ["div",
              ["div",
                 ["div",
                    template,
                    'id', 'ui-dialog-message'
                 ],
                 ["div",
                    buttons.map(this._get_button_template),
                  "id", "ui-dialog-buttons"
                 ],
               "id", "ui-dialog"
              ],
            "id", "ui-dialog-background",
            "class", "overlay"
           ];
  };

  this._get_button_template = function(button)
  {
    return ["span",
              button.label,
            "data-handler-id", "" + button.id,
            "class", "ui-button",
            "tabindex", "1"
           ];
  };

  this._init = function(template, buttons)
  {
    this._modal_click_handler_bound = this._modal_click_handler.bind(this);
    this._handler_map = {};
    buttons = buttons.length ? buttons : [{label: ui_strings.S_BUTTON_CANCEL}];
    buttons.forEach(function(button, idx) {
      button.id = idx;
      this._handler_map[idx] = button.handler;
    }, this);
    this._dialog_template = this._get_template(template, buttons);
  };
};

/**
 * @constructor
 */
function ConfirmDialog(template, ok_callback_or_callback_list, cancel_callback_or_type, type) {
  this._init(template, ok_callback_or_callback_list, cancel_callback_or_type, type);
};

function ConfirmDialogPrototype()
{
  this._init = function(template, ok_callback_or_callback_list, cancel_callback_or_type, type)
  {
    var ACCEPT = 0;
    var REJECT = 1;
    var accept_cb = ok_callback_or_callback_list;
    var reject_cb = cancel_callback_or_type;
    if (Array.isArray(ok_callback_or_callback_list))
    {
      accept_cb = ok_callback_or_callback_list[0];
      reject_cb = ok_callback_or_callback_list[1];
      type = cancel_callback_or_type;
    }

    if (!type)
      type = ConfirmDialog.OK_CANCEL;

    if (!ConfirmDialog.labels[type])
      throw "Not a valid type in ConfirmDialog";

    var buttons = [
      {
        label: ConfirmDialog.labels[type][ACCEPT],
        handler: accept_cb,
      },
      {
        label: ConfirmDialog.labels[type][REJECT],
        handler: reject_cb,
      }
    ];
    BaseDialog.prototype._init.call(this, template, buttons);
  };
};

ConfirmDialogPrototype.prototype = new BaseDialog();
ConfirmDialog.prototype = new ConfirmDialogPrototype();
ConfirmDialog.YES_NO = 1;
ConfirmDialog.OK_CANCEL = 2;
ConfirmDialog.labels = {};
ConfirmDialog.labels[ConfirmDialog.YES_NO] = [ui_strings.S_BUTTON_YES, ui_strings.S_BUTTON_NO];
ConfirmDialog.labels[ConfirmDialog.OK_CANCEL] = [ui_strings.S_BUTTON_OK, ui_strings.S_BUTTON_CANCEL];

/**
 * @constructor
 */
function AlertDialog(template, ok_callback) {
  this._init(template, ok_callback || function() {});
};

function AlertDialogPrototype()
{
  this._init = function(template, ok_callback)
  {
    var buttons = [
      {
        label: ui_strings.S_BUTTON_OK,
        handler: ok_callback,
      }
    ];
    BaseDialog.prototype._init.call(this, template, buttons);
  };
};

AlertDialogPrototype.prototype = new BaseDialog();
AlertDialog.prototype = new AlertDialogPrototype();

