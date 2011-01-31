window.cls || (window.cls = {});

window.cls.AdvancedJSSerach = function()
{
  this.set_input_and_output = function(input, output){};

  this.get_highlight_next_handler = function(){};

  this.get_highlight_previous_handler = function(){};

  this._onhighlightnext = function()
  {
    this._output.textContent = this._input.value;
  }

  this._onhighlightprevious = function()
  {

  }

  this.set_input_and_output = function(input, output)
  {
    this._input = input;
    this._output = output;

  };

  this.get_highlight_next_handler = function()
  {
    return this._onhighlightnext_bound;
  };

  this.get_highlight_previous_handler = function()
  {
    return this._onhighlightprevious_bound;
  };

  this._init = function()
  {
    this._onhighlightnext_bound = this._onhighlightnext.bind(this);
    this._onhighlightprevious_bound = this._onhighlightprevious.bind(this);
  }

  this._init();
}