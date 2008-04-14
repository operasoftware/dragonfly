(function()
{

  var View = function(id, name, container_class)
  {
    this.ishidden_in_menu = true;
    this.hidden_in_settings = true;

    this.createView = function(container)
    {
    }
    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;

  new View('dom_general', 'General DOM Settings', 'scroll');

  
  new Settings
  (
    // id
    'dom_general',
    // key-value map
    {
      'find-with-click': true,
      'highlight-on-hover': false,
      'update-on-dom-node-inserted': false
    },
    // key-label map
    {
      'find-with-click': ' find element with click',
      'highlight-on-hover': ' highlight element on mouseover',
      'update-on-dom-node-inserted': ' update DOM when a node is removed'
    }
  );

  
})();