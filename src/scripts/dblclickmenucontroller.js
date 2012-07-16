var OperaDBLclickMenuController = function()
{
    var is_selection = false;
    var down_event = null;
    var selection = getSelection();
    var range = null;

    const POW = Math.pow;

    var distance = function(ev1, ev2)
    {
        return POW(POW(ev1.clientX - ev2.clientX, 2) +
                   POW(ev1.clientY - ev2.clientY, 2), .5);
    };

    var mousedown = function(event)
    {
        is_selection = !selection.isCollapsed;
        down_event = event;
    };

    var re_add_range = function()
    {
        if (selection && range)
        {
            selection.addRange(range);
            range = null;
        }
    };

    var mouseup = function(event)
    {
        if (down_event && event.target == down_event.target &&
            distance(down_event, event) < 3 &&
            !is_selection && !selection.isCollapsed)
        {
            range = selection.getRangeAt(0);
            selection.removeAllRanges();
            setTimeout(re_add_range, 0);
        }
    };

    document.addEventListener('mousedown', mousedown, true);
    document.addEventListener('mouseup', mouseup, true);
};
