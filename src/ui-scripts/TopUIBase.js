/**
  * @constructor
  */

var TopUIBase = function()
{
  this.changeStyleProperty = function(property, delta)
  {
    var
    sheets = document.styleSheets,
    sheet = null,
    i = 0,
    rules = null,
    rule = null,
    cur_val = 0,
    is_set = false;


    // assumnig that border and padding are set just once

    for( ; ( sheet = sheets[i] ) && !is_set; i++)
    {
      rules = sheet.cssRules;
      for( i = 0; ( rule = rules[i] ) && !is_set; i++)
      {
        if( rule.type == 1 && rule.selectorText == this.type )
        {
          cur_val = parseInt(rule.style.getPropertyValue('padding-right'));

          if( cur_val || cur_val == 0 )
          {
            cur_val += delta;
            rule.style.setProperty(property, cur_val + 'px', '');
            this.constructor.prototype.style[property] = cur_val;
            this.setCSSProperties();
            this.setDimensions();
            if( this.render )
            {
              this.render();
            }
            is_set = true;
          }
        }
      }
    }
  }
}

