window.cls || (window.cls = {});

cls.InlineExpander = function(callback)
{

  const
  VALUE_LIST = 2,
  OBJECT_VALUE = 1,
  OBJECT_ID = 0,
  CLASS_NAME = 4,
  FUNCTION_NAME = 5,
  MAX_ARGS = 60,
  RE_DOM_OBJECT = cls.InlineExpander.RE_DOM_OBJECT,
  INLINE_MODEL = cls.ReplService.INLINE_MODEL,
  INLINE_MODEL_TMPL = cls.ReplService.INLINE_MODEL_TMPL,
  INLINE_MODEL_TMPL_JS = cls.ReplService.INLINE_MODEL_TMPL_JS,
  INLINE_MODEL_TMPL_DOM = cls.ReplService.INLINE_MODEL_TMPL_DOM,
  FRIENDLY_PRINTED = cls.ReplService.FRIENDLY_PRINTED,
  IS_EXPANDABLE = cls.ReplService.IS_EXPANDABLE;

  this.expand = function(ctx)
  {
    ctx.is_inline_expanded = true;
    
    var value_list = ctx.value_list;
    var dom_obj_list = [];
    var has_dom_objects = false;
    var cb = null;

    // split JS and DOM objects
    for (var i = 0, value, object; value = value_list[i]; i++)
    {
      if ((object = value[OBJECT_VALUE]) &&
          (!object[FRIENDLY_PRINTED] || object[FRIENDLY_PRINTED][IS_EXPANDABLE]))
      {
        if (RE_DOM_OBJECT.test(value[OBJECT_VALUE][CLASS_NAME]))
        {
          object[INLINE_MODEL] = new cls.InspectableDOMNode(ctx.rt_id, object[OBJECT_ID]);
          object[INLINE_MODEL_TMPL] = INLINE_MODEL_TMPL_DOM;
          dom_obj_list.push(object[INLINE_MODEL]);

          if (!cb)
          {
            cb = this._onexpand_dom_object.bind(this, dom_obj_list, ctx);
          }

          object[INLINE_MODEL].expand(cb, object[OBJECT_ID], "node");
        }
        else
        {
          var prop_name = object[CLASS_NAME] || object[FUNCTION_NAME];
          if (object[FRIENDLY_PRINTED])
          {
            prop_name = this._friendly_printer.friendly_string(object[FRIENDLY_PRINTED]);
          }
          object[INLINE_MODEL] = new cls.InspectableJSObject(ctx.rt_id, 
                                                             object[OBJECT_ID],
                                                             prop_name);
          object[INLINE_MODEL_TMPL] = INLINE_MODEL_TMPL_JS;
        }
      }
    }

    if (!dom_obj_list.length)
    {
      this._callback(ctx);
    }

  };

  this._onexpand_dom_object = function(dom_obj_list, ctx)
  {
    if (dom_obj_list.every(function(model) { return model.has_data(); }))
    {
      this._callback(ctx);
    }
  };

  this.init = function(callback)
  {
    this._callback = callback;
    this._tagman = window.tagManager;
    this._service = window.services['ecmascript-debugger'];
    this._friendly_printer = cls.FriendlyPrinter.get_instance();
  };

  this.init(callback);

};

cls.InlineExpander.RE_DOM_OBJECT = /Element$/;
