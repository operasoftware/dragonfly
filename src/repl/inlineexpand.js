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
    var obj_list = [];
    var cb = this._onexpand_object.bind(this, obj_list, ctx);

    // split JS and DOM objects
    for (var i = 0, value, object; value = value_list[i]; i++)
    {
      if ((object = value[OBJECT_VALUE]) &&
          (!object[FRIENDLY_PRINTED] || object[FRIENDLY_PRINTED][IS_EXPANDABLE]))
      {
        if (!ctx.is_dir && (RE_DOM_OBJECT.test(value[OBJECT_VALUE][CLASS_NAME]) || 
                            ctx.traversal))
        {
          object[INLINE_MODEL] = new cls.InspectableDOMNode(ctx.rt_id, 
                                                            object[OBJECT_ID]);
          object[INLINE_MODEL_TMPL] = INLINE_MODEL_TMPL_DOM;
          obj_list.push(object[INLINE_MODEL]);
          object[INLINE_MODEL].expand(cb,
                                      object[OBJECT_ID], 
                                      ctx.traversal || "node");
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
          object[INLINE_MODEL].show_root = true;
          if (ctx.expand)
          {
            obj_list.push(object[INLINE_MODEL]);
            object[INLINE_MODEL].show_root = false;
            object[INLINE_MODEL].expand(cb);
          }
        }
      }
    }

    if (!obj_list.length)
    {
      this._callback(ctx);
    }

  };

  this._onexpand_object = function(obj_list, ctx)
  {
    if (obj_list.every(function(model) { return model.has_data(); }))
    {
      this._callback(ctx);
    }
  };

  this.init = function(callback)
  {
    this._callback = callback;
    this._tagman = window.tagManager;
    this._service = window.services['ecmascript-debugger'];
    this._friendly_printer = new cls.FriendlyPrinter();
  };

  this.init(callback);

};

cls.InlineExpander.RE_DOM_OBJECT = /Element$/;
