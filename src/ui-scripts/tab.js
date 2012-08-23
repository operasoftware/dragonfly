/**
  * @constructor
  */

var TabBase = new function()
{
  var self = this;
  var id_count = 1;
  var ids = {};

  this._ref_ids = {};

  var getId = function()
  {
    return 'tab-' + (id_count++).toString();
  }

  this.init = function(ref_id, name, has_close_button)
  {
    this.name = name;
    this.ref_id = ref_id;
    this.has_close_button = has_close_button;
    this._ref_ids[ref_id] = this;
    ids [ this.id = getId() ] = this;
  }

  this.getTabById = function(id)
  {
    return ids[id];
  }

  this.get_tab_by_ref_id = function(ref_id)
  {
    return this._ref_ids[ref_id] || null;
  };

  this._delete = function(id)
  {
    delete ids[id];
  }

  // These methods really belong to TopTabs, should make a TopTab class
  this._get_top_tab_element = function()
  {
    return document.querySelector("tab[ref-id='" + this.ref_id + "']");
  };

  this.set_badge = function(type, content)
  {
    var tab = this._get_top_tab_element();
    var badge = tab ? tab.querySelector(".badge") : null;
    if (badge)
    {
      badge.addClass(type || "");
      badge.textContent = content != null ? content : "";
    }
  };

  this.set_legend_info = function(text)
  {
    var tab = this._get_top_tab_element();
    var legends = tab && tab.getElementsByClassName("block-content");
    if (!legends)
      return;

    var legend = legends[1];
    if (text)
    {
      if (!legend)
      {
        tab.addClass("two-rows");
        legend = legends[0].parentNode.render(["span", "class", "block-content"]);
      }

      if (legend)
        legend.textContent = text;
    }
    else
    {
      if (legend)
      {
        legend.parentNode.removeChild(legend);
        tab.removeClass("two-rows");
      }
    }
  };

  this.clear_badge = function()
  {
    this.set_badge("", null);
  };

  this.set_state = function(state)
  {
    var tab = this._get_top_tab_element();
    if (tab)
    {
      tab.setAttribute("data-state", state);
    }
  };

  this.clear_state = function()
  {
    var tab = this._get_top_tab_element();
    if (tab)
    {
      tab.removeAttribute("data-state");
    }
  };
}

/**
  * @constructor
  * @extends TabBase
  */

var Tab = function(ref_id, name, has_close_button)
{
  // at some point all tabs will have a close button
  this.init(ref_id, name, has_close_button)
};

/**
  * @constructor
  * @extends Tab
  */
var JavaScriptTab = function(ref_id, name, has_close_button)
{
  this.init(ref_id, name, has_close_button)

  window.messages.addListener("host-state", function(msg) {
    switch (msg.state)
    {
      case "waiting":
        this.set_badge("paused", "paused");
        break;
      default:
        this.clear_badge();
    }
  }.bind(this));
};

/**
  * @constructor
  * @extends Tab
  */
var ErrorConsoleTab = function(ref_id, name, has_close_button)
{
  this.init(ref_id, name, has_close_button)

  window.messages.addListener("error-count-update", function(msg) {
    var text = msg.current_error_count == 0 ?
              "" :
              "(" + msg.current_error_count + ")";
    this.set_legend_info(text);
  }.bind(this));
};

Tab.prototype = TabBase;
JavaScriptTab.prototype = TabBase;
ErrorConsoleTab.prototype = TabBase;

