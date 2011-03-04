/**
 * Registry that maintains a mapping between object IDs and objects.
 * Mostly used by the template system and UI framework to avoid
 * storing objects in the DOM and to reduce the coupling between
 * ui component objects and dom
 */
function ObjectRegistry()
{
  if (ObjectRegistry.instance)
  {
    return ObjectRegistry.instance;
  }
  ObjectRegistry.instance = this;

  this._objects = {};

  this._make_id = function() {
    return "oid_" + (new Date().getTime());
  }

  /**
   * Save object in registry, with the key id. If id is not given,
   * a new unique id string is created.
   * The id is returned.
   */
  this.set_object = function(obj) {
    var id = this._make_id();
    this._objects[id] = obj;
    return id;
  }

  /**
   * Return object with id. If not found, return undefined
   */
  this.get_object = function(id) {
    return this._objects[id];
  }

  this.del_object = function(id) {
    //del this._objects[id];
  }
}

ObjectRegistry.get_instance = function()
{
  return this.instance || new ObjectRegistry();
}
