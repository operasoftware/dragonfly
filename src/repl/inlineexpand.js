window.cls || (window.cls = {});

window.cls.InlineExpand = function()
{


  const
  VALUE_LIST = 2,
  OBJECT_VALUE = 1,
  OBJECT_ID = 0,
  CLASS_NAME = 4,
  FUNCTION_NAME = 5,
  MAX_ARGS = 60,
  RE_DOM_OBJECT = /Element$/,
  // TODO one place for custom fields
  INLINE_MODEL = 7,
  INLINE_MODEL_TMPL = 8,
  INLINE_MODEL_TMPL_JS = "inspected_js_object",
  INLINE_MODEL_TMPL_DOM = "inspected_dom_node";


  /*

  */

  this.expand = function(obj_list, rt_id, successcb, errorcb)
  {

    var value_list = obj_list[VALUE_LIST];
    var dom_obj_list = [];
    var has_dom_objects = false;
    var cb = null;

    // split JS and DOM objects
    for (var i = 0, value, object; value = value_list[i]; i++)
    {
      if (object = value[OBJECT_VALUE])
      {
        if (RE_DOM_OBJECT.test(value[OBJECT_VALUE][CLASS_NAME]))
        {
          object[INLINE_MODEL] = new cls.InspectableDOMNode(rt_id, object[OBJECT_ID]);
          object[INLINE_MODEL_TMPL] = INLINE_MODEL_TMPL_DOM;
          dom_obj_list.push({model: object[INLINE_MODEL], model_expanded: false});

          if (!cb)
          {
            cb = this._onexpand_dom_object.bind(this, dom_obj_list, successcb, errorcb);
          }

          object[INLINE_MODEL].expand(cb, object[OBJECT_ID], "node");
        }
        else
        {
          object[INLINE_MODEL] = 
            new cls.InspectableJSObject(rt_id,
                                        object[OBJECT_ID],
                                        //object[FRIENDLY_PRINTED] ||
                                        object[CLASS_NAME] || 
                                        object[FUNCTION_NAME]);
          object[INLINE_MODEL_TMPL] = INLINE_MODEL_TMPL_JS;
        }
      }
    }

    if (!dom_obj_list.length)
    {
      successcb();
    }


  };

  this._onexpand_dom_object = function(dom_obj_list, successcb, errorcb)
  {
    for (var i = 0, value; (value = dom_obj_list[i]) && value.model.has_data(); i++);

    if (i == dom_obj_list.length)
    {
      successcb();
    }
  };

  this.init = function()
  {
    this._tagman = window.tagManager;
    this._service = window.services['ecmascript-debugger'];
  };

  this.init();

}
