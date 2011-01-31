(function()
{
  this.searchbar_content = function(search)
  {
    return (
    [
      this.filters(search.controls),
      ['info'],
    ]);
  };

  this.js_search_window = function()
  {
    return (
    ['div',
      ['h2', 'Search results:'],
      ['div', 'class', 'js-search-results'],
      'class', 'search-window-content'
    ]);
  }
}).apply(window.templates || (window.templates = {}));
