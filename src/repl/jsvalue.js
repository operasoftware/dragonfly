window.cls || (window.cls = {});

cls.JSValue =  function(value, rt_id)
{
  const VALUE = 0;
  const OBJECT_VALUE = 1;
  const OBJECT_ID = 0;
  const TYPE = 2;
  const CLASS_NAME = 4;
  const FUNCTION_NAME = 5;

  this.df_intern_type = value[cls.ReplService.DF_INTERN_TYPE] || "";
  this.type = value[VALUE] === null ? "object" : "native";
  this.rt_id = rt_id;

  var object = value[OBJECT_VALUE];
  if (object)
  {
    this.obj_id = object[OBJECT_ID];
    this.type = object[TYPE];
    this.name = object[CLASS_NAME] || object[FUNCTION_NAME];
    this.friendly_printed = object[cls.ReplService.FRIENDLY_PRINTED];
    this.model = object[cls.ReplService.INLINE_MODEL];
    this.model_template = object[cls.ReplService.INLINE_MODEL_TMPL];
  }
  else
  {
    this.value = value[VALUE];
  }

};
