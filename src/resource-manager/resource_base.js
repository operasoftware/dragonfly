window.cls = window.cls || {};


cls.GenericResourceDetail = function(res)
{
  this.resource = res;
  this.filename = cls.ResourceUtil.url_filename(res.urlload.url) || "<no name>";
  this.drawer = new MetadataDrawer(res);
  this.drawer.expanded = true;

  this.createView = function(container)
  {
    container.clearAndRender(this.drawer.render());
  };
  this.init(this.filename);
};

cls.GenericResourceDetail.prototype = new TempView();
