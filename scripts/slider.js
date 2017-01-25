"use strict";
var Moodieio = Moodieio || {};

/*
 * SIMPLE SLIDER SCRIPT V0.1
 * How to use:
 * add the attribute data-moodieio-slider="[type]" to the main slide container div
 * slider types are: [slide, class].
 * slide = basic sliding operation. Requires an inner container with the data attribute data-moodieio-slider-container.
 * class = class names for the slides are selected based on their position
 * default values used for classes are:
 *  - current for current class
 *  - next for next slide
 *  - previous for previous slide
*/

//throttle script directly copied from MDN url: https://developer.mozilla.org/en-US/docs/Web/Events/resize on 20/01/2017
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
    throttle("resize", "optimizedResize");
})();

(function(slider)
{

    function sliderCreate(elem,options)
    {
        //get slide type, default=class

        //init settings
        this.slideWidth = 0;
        this.currentSlide = 0;

        // console.log("slider create called for: " + elem.id);
        this.options = (typeof(options) !== 'undefined') ? options : {default:true, 
            type: ((elem.dataset.moodieioSlider) ? elem.dataset.moodieioSlider : 'class'),
            slideTime: 10000,
            classNames:{previous:'previous',current: 'current', next:'next'}};


        // store container object
        this.el_container = elem;
        this.el_innerContainer = this.el_container.querySelector('[data-moodieio-slider-container]');
        this.el_status = this.el_container.querySelector('[data-moodieio-slider-status]');

        //store classname for current status
        this.options.classNames.currentStatus = this.el_status.dataset.moodieioSliderStatus;
        //check if inner container is set for status items
        this.options.classNames.statusInner = (typeof(this.el_status.dataset.moodieioSliderStatusInner) !== 'undefined') ? 
                                                this.el_status.dataset.moodieioSliderStatusInner : null;

         if(this.el_innerContainer===null)
        {
            console.error("Moodieio.slider: Inner container not found.");
            return;
        }

        this.els_slides = this.el_container.querySelectorAll("[data-moodieio-slide]");
        //store the length to be number of slides
        this.length = this.els_slides.length;

        //initiate the status items
        initStatus.bind(this)();

        //init based on type
        if(this.options.type === "slide")
        {
            initAsSlide.bind(this)();

        } else if(this.options.type === "class")
        {
            initAsClass.bind(this)();
        } else {
            console.error("Moodieio.Slider: invalid slide type for " + elem.id);
        }

        //call the common initialization function
        this.init();

    }
    function initAsClass()
    {
        this.changeSlide = this.changeSlide_Class;
        //set slide contianer as relative
        this.el_innerContainer.style.position = "relative";
        this.selectSlide();

    }
    function initAsSlide()
    { 
        //set functins
        this.changeSlide = this.changeSlide_Slide;

        this.el_innerContainer.style.position = "relative";

        //resize and add resize event
        this.resize();
        var that = this;
        window.addEventListener("optimizedResize", this.resize.bind(that));     
    }

    function initStatus()
    {
        this.els_statusItems = [];

        for(var i=0; i<this.length; i++){
            var el_li = document.createElement("li");
            
            //create within a function for scoping
            (function(bind, c)
            {
                el_li.addEventListener("click", function(){bind.selectSlide(c);}.bind(bind))
                console.log(el_li);
            })(this, i);

            //add inner element if required
            if(this.options.classNames.statusInner !== null){
                var el_inner = document.createElement("div");
                el_inner.className = this.options.classNames.statusInner;
                el_li.appendChild(el_inner);
            }
            this.el_status.appendChild(el_li);
            this.els_statusItems.push(el_li);
        }
    }

    //common initialization
    sliderCreate.prototype.init = function()
    {
        //set timer
        var that = this;
        this.slideTimer = window.setInterval(this.nextSlide.bind(that),this.options.slideTime);
    }

    sliderCreate.prototype.elementsInit = function()
    {
        // console.dir(this);
        //this.el_innerContainer.style.position = "relative";
    }

    // resize innercontainer based on number of elements.
    // for now assume all child elements same width
    // TODO: Restudy other options 
    sliderCreate.prototype.resize = function()
    {
        // console.log(this.el_container.offsetWidth);
        
        //get width of main slider div
        this.slideWidth = this.el_container.offsetWidth;
        
        //calculate correct width to fit all slides
        var conWidth = this.slideWidth*this.length;

        //set width of inner container
        this.el_innerContainer.style.width = conWidth + "px";

        //set the size of the slide elements
        // console.dir(this.els_slides.length);
        for(var i = 0, len = this.els_slides.length; i<len; i++)
        {
            //TODO: Add future check to see if slide has override for width
            this.els_slides[i].style.width = this.slideWidth + "px";

        }
        //reselect slide to get position correct
        this.selectSlide();
    }
    
    sliderCreate.prototype.selectSlide = function(num)
    {
        console.log("selecting: " + num);
        if(typeof(num)==='number')
        {
            this.currentSlide = num;
        }

        //keep both checks seperate as this can return 4, which requires it to be reset to 0
        this.currentSlide = this.getSlideNumber(this.currentSlide);

        this.changeSlide();
        this.updateStatus();
        
    }

    sliderCreate.prototype.updateStatus = function()
    {
        for(var i=0, len = this.els_statusItems.length; i<len; i++)
        {
            this.els_statusItems[i].className = this.els_statusItems[i].className
                 .replace(this.options.classNames.currentStatus,'')
                 .replace(/\s+/g, " ");
            
            if(i===this.currentSlide){
                this.els_statusItems[i].className = this.options.classNames.currentStatus;
            }

        }

        
    }

    //change slide for a class type slider
    sliderCreate.prototype.changeSlide_Class = function()
    {
        //loop slides and remove class from all but previous
        for(var i=0, len = this.els_slides.length; i<len; i++)
        {
            //remove classnames
            this.els_slides[i].className = this.els_slides[i].className
                .replace(this.options.classNames.previous,'')
                .replace(this.options.classNames.current,'')
                .replace(this.options.classNames.next,'')
                .replace(/\s+/g, " ");

            if(i==this.getSlideNumber(this.currentSlide-1))
            {
                this.els_slides[i].className = this.els_slides[i].className + " " + this.options.classNames.previous;
            } 
            else if (i==this.currentSlide)
            {
                this.els_slides[i].className = this.els_slides[i].className + " " + this.options.classNames.current;
            } 
            else if( i === this.getSlideNumber(this.currentSlide+1))
            {
                this.els_slides[i].className = this.els_slides[i].className + " " + this.options.classNames.next;
            }

        }

    }
    //change slide for a slide type slider
    sliderCreate.prototype.changeSlide_Slide = function()
    {
        this.el_innerContainer.style.left = (this.currentSlide * this.slideWidth * -1) + "px";
    }

    sliderCreate.prototype.nextSlide = function()
    {
        this.selectSlide(++this.currentSlide);
    }

    //helper functions
    sliderCreate.prototype.getSlideNumber = function(number)
    {
        var rtn = number;
        //keep both checks seperate as this can return 4, which requires it to be reset to 0
        if (rtn < 0)
        {
            rtn = this.length + (rtn%this.length)

        }
        if(rtn>=this.length)
        {
            rtn = rtn%this.length;
        }

        return rtn;

    }

    slider.create = sliderCreate;

})(window.Moodieio.Slider = window.Moodieio.Slider || {});


(function(){

    var onLoad = function(){
        //foreach slider init a slider
        var els_allSliders = document.querySelectorAll("[data-moodieio-slider]");
        //console.dir(els_allSliders);
        var allSliders = [];
        for(var i = 0, len = els_allSliders.length; i<len; i++){
            allSliders.push(new Moodieio.Slider.create(els_allSliders[i]));
        }
    }

    window.addEventListener("load", onLoad);

})();
