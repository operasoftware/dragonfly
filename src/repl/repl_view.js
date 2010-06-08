window.cls = window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */

cls.ReplView = function(id, name, container_class, html, default_handler) {
  this._resolver = new PropertyFinder();
  this._service = new cls.ReplService(this);
  this._linelist = null;
  this._textarea = null;

  this.createView = function(container)
  {
    container.innerHTML = "<div>Hello world</div><ul id='repl-lines'></ul>";

    var markup = "" +
    "<div class='padding'>" +
      "<div class='console-output'><ul id='repl-lines'></ul></div>" +
      "<div class='console-input' handler='coneesole-focus-input'>" +
        "<span class='commandline-prefix'>&gt;&gt;&gt; </span>" +
        "<div><textarea handler='commrrandline' rows='1' title='hold shift to add a new line'></textarea></div>" +
      "</div>" +
    "</div>";

    container.innerHTML = markup;

    this._linelist = container.querySelector("#repl-lines");
    this._textarea = container.querySelector("textarea");
    this._textarea.addEventListener("keyup", this._handle_input, false);

    this.render_input("1+2");
    this.render_string("3");
  };

  this.render_object = function(rt_id, obj_id)
  {

  };

  this.render_element = function()
  {

  };

  this.render_string = function(str)
  {
    var ele = document.createTextNode(str);
    this._add_line(ele);
  };

  this.render_input = function(str)
  {
    this.render_string(">>> " + str);
  };

  this.set_current_input = function(str)
  {
    this._textarea.textContent = str;
  };

  this.display_completion = function() {

  };

  this._add_line = function(elem)
  {
    var line = document.createElement("li");
    line.appendChild(elem);
    this._linelist.appendChild(line);
  };

  this._handle_input = function(evt)
  {
    if (evt.keyCode == 13)
    {
      var input = this._textarea.value;
      this._textarea.value = "";
      this.render_input(input);
      this._service.handle_input(input);
    }

  }.bind(this);

  this.init(id, name, container_class, html, default_handler);
};
cls.ReplView.prototype = ViewBase;
