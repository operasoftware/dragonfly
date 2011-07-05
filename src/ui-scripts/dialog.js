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
    document.addEventListener("click", this._modal_click_handler_bound, false);
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
      document.removeEventListener("click", this._modal_click_handler_bound, false);
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
    }

    if (handler)
    {
      handler(event, event.target);
    }

    event.stopPropagation();
    event.preventDefault();
  };

  this._get_template = function(template, buttons)
  {
    buttons = buttons.map(function(button) {
                           return ["button",
                                     button.label,
                                   "data-handler-id", "" + button.id,
                                   "class", "container-button"];
                         });
    return ["div",
              ["div",
                 ["div",
                    template
                 ],
                 ["div",
                    buttons,
                  "id", "ui-dialog-buttons"
                 ],
               "id", "ui-dialog"
              ],
            "id", "ui-dialog-background"];
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
function ConfirmDialog(template, ok_button, cancel_button) {
  this._init = function(template, ok_button, cancel_button)
  {
    var buttons = [
      {
        label: ok_button.label || ui_strings.S_BUTTON_OK,
        handler: ok_button.handler
      },
      {
        label: cancel_button.label || ui_strings.S_BUTTON_CANCEL,
        handler: cancel_button.handler
      }
    ];
    BaseDialog.prototype._init.call(this, template, buttons);
  };

  this._init(template, ok_button, cancel_button);
}

ConfirmDialog.prototype = new BaseDialog();

