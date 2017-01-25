"use strict";
var Moodieio = Moodieio || {};

/*
 * Basic sticky scroll script V0.1. Simply adds/removes a class when it needs to be sticky
 * 
 * 
*/

//throttle script modified from MDN url: https://developer.mozilla.org/en-US/docs/Web/Events/resize on 20/01/2017
(function() {
    var throttle = function(type, name, obj) {
        obj = obj || window;
        var running = false;
        var func = function() {
            if (running) { return; }
            running = true;
             requestAnimationFrame(function() {
                obj.dispatchEvent(new CustomEvent(name));
                running = false;
            });
        };
        obj.addEventListener(type, func);
    };

    /* init - you can init any event */
    throttle("scroll", "optimizedScroll");
})();

//script for stick scroll elements
(function(sticky)
{
    function stickyCreate(elem, options)
    {
        console.log("creating new stick scroll");
        this.el_container = elem;
        this.el_body = document.getElementsByTagName("body")[0];
        this.isSticky = false;
        this.className = "isSticky";

        //add scroll event
        var that = this;
        window.addEventListener("optimizedScroll", this.update.bind(that));  

    }
    stickyCreate.prototype.update = function()
    {
        console.log("called scroll update");
        var bRect = this.el_container.getBoundingClientRect();
        if(this.isSticky)
        {
            //remove class
            if(bRect.top>0)
            {
                //remove isSticky class
                this.el_container.className = this.el_container.className
                    .replace(this.className,'')
                    .replace(/\s+/g, " ");
                this.isSticky = false;
            }
        } 
        else 
        {
            //add class
            if(bRect.top <=0)
            {
                //add isSticky class
                this.el_container.className += " " + this.className;
                this.isSticky = true;
            }
        }
    }

    //assign the function
    sticky.create = stickyCreate;

})(window.Moodieio.Stickyscroll = window.Moodieio.Stickscroll || {});

(function(){

    var onLoad = function(){
        //foreach slider init a slider
        var els_allStickyscroll = document.querySelectorAll("[data-moodieio-stickyscroll]");

        for (var i=0, len = els_allStickyscroll.length; i<len; i++){
            new Moodieio.Stickyscroll.create(els_allStickyscroll[i]);
        }
    }
    window.addEventListener("load", onLoad);
})();