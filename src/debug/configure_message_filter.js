window.cls || (window.cls = {});
cls.debug || (cls.debug = {});

cls.debug.ConfigureMessgeFilters = function(id, name, container_class)
{

  /* interface */
  this.createView = function(container){};
  this.show_configuration = function(container, service){};
  this.set_unfold = function(service, bool){};

  /* private */
  this.show_in_views_menu = true;
  this.window_width = 250;
  this._event_map = cls.ServiceBase.get_event_map();
  this._unfolded = {};

  this._filter_command = function(msg)
  {
    return /^handle/.test(msg);
  }

  this._filter_event = function(msg, index)
  {
    return /^on/.test(msg);
  }

  this._markup_message = function(msg)
  {
    msg = msg.replace(/^handle/, "").replace(/^on/, "On");
    return "<li><label>" +
      "<input type='checkbox' " +
        "data-filter-target='" + msg + "' " + 
        (this.all ? "disabled" : "") + 
        (this[msg] ? " checked='checked' " : "") +
        " handler='config-filter-msg'>" +
      msg + "</label></li>";
  }

  this._markup_checkbox_all = function(service, msg_type, label, checked)
  {
    return (
    "<ul>" +
      "<li><label>" +
        "<input type='checkbox' " +
          (checked ? "checked='checked'" : "") +
          "data-filter-target='" + service + "' " +
          "data-filter-type='" + msg_type + "' " +
          "handler='config-filter-msg-all'>" +
        " " + label + "</label></li>" +
    "</ul>");
  }

  this._markup_service_config = function(service)
  {
    var 
    markup = "",
    msgs = null,
    filter = window.debug.get_filter()[service];

    if ((msgs = this._event_map[service].filter(this._filter_command)).length)
    {
      markup +=
        "<h3>Commands</h3>" +
        this._markup_checkbox_all(service, 'commands', 'log all commands', filter.commands.all) +
        "<ul" + (filter.commands.all ? " class='disabled'" : "") + 
          " data-filter-type='commands' " +
          " data-service-name='" + service + "'>" +
          msgs.map(this._markup_message, filter.commands).join('') + 
        "</ul>";
    }
    if ((msgs = this._event_map[service].filter(this._filter_event)).length)
    {
      markup +=
        "<h3>Events</h3>" +
        this._markup_checkbox_all(service, 'events', 'log all events', filter.events.all) +
        "<ul" + (filter.events.all ? " class='disabled'" : "") + 
          " data-filter-type='events' " +
          " data-service-name='" + service + "'>" +
          msgs.map(this._markup_message, filter.events).join('') + 
        "</ul>";
    }
    return markup;
  }

  /*
  this._template = function()
  {
    var 
    ret = [],
    service = null,
    filter = window.debug.get_filter();

    for(service in window.services)
    {
      if(window.services[service].is_implemented)
      {
        ret.push(
        ["li", 
          ["input",
            "type", 'button',
            'handler', 'toggle-filter-messages',
            'data-service-name', service
          ].concat(filter.all.all.all ? ['disabled', 'disabled'] : []), 
          ["h3", window.helpers.service_class_name(service)],
        /* (this._unfolded[service] ?
        ("<div>" + this._markup_service_config(service) + "</div>") :
        "") *//*
          
        ].concat(this._unfolded[service] ? ['class', 'open']: []));

      }
    }
    return (
    ["div",
      ["h2", 'Services'],
      //this._markup_checkbox_all('all', 'all', 'log all messages', filter.all.all.all) +
      ["ul", ret].concat(filter.all.all.all ? ['class', 'disabled'] : []),
    'class', 'padding'
    ]);
  }
  */

  /* implementation */

  this.createView = function(container)
  {
    //container.clearAndRender(this._template());
    //return;

    var 
    markup = "",
    service = null,
    filter = window.debug.get_filter();

    for(service in window.services)
    {
      if(window.services[service].is_implemented)
      {
        markup += "<li" + (this._unfolded[service] ? " class='open' " : "") + ">" +
          "<input " +
              "type='button' handler='toggle-filter-messages' " +
              "data-service-name='" + service + "' " +
              (filter.all.all.all ? "disabled" : "") + 
              " >" +
          "<h3>" + window.helpers.service_class_name(service) + "</h3>" +
          (this._unfolded[service] ?
            ("<div>" + this._markup_service_config(service) + "</div>") :
            "") +
          "</li>";
      }
    }
    container.innerHTML = 
      "<div class='padding'>" +
        "<h2>Services</h2>" +
        this._markup_checkbox_all('all', 'all', 'log all messages', filter.all.all.all) +
        "<ul" + (filter.all.all.all ? " class='disabled'" : "") + ">" + markup + "</ul>" +
      "</div>";
  }

  this.show_configuration = function(container, service)
  {
    container.appendChild(document.createElement('div')).innerHTML = 
      this._markup_service_config(service);
  }

  this.set_unfold = function(service, bool)
  {
    this._unfolded[service] = bool;
  }

  this.init(id, name, container_class);

}
cls.debug.ConfigureMessgeFilters.prototype = ViewBase;