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
function ConfirmDialog(template, ok_callback, cancel_callback) {
  this._init(template, ok_callback, cancel_callback);
};

function ConfirmDialogPrototype()
{
  this._init = function(template, ok_callback, cancel_callback)
  {
    var buttons = [
      {
        label: ui_strings.S_BUTTON_OK,
        handler: ok_callback,
      },
      {
        label: ui_strings.S_BUTTON_CANCEL,
        handler: cancel_callback,
      }
    ];
    BaseDialog.prototype._init.call(this, template, buttons);
  };
};

ConfirmDialogPrototype.prototype = new BaseDialog();
ConfirmDialog.prototype = new ConfirmDialogPrototype();

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

