var moodio = moodio || {};

moodio.Expand = function(eId)
{
    console.log("expanding: " + eId);
    //google analytics event if available
   if(typeof(ga)!== 'undefined' && ga!==null){
       ga('send','event','Site','menu-expand');
   }
    var el = document.getElementById(eId);
    if(el!==null){
        if(el.className.indexOf('expanded')!==-1)
        {
            el.className = el.className.replace(' expanded','');
        } else {
            el.className = el.className + " expanded"
        }
        console.dir(el);
    }
}