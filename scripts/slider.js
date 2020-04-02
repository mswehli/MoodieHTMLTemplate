"use strict";
var moodio = moodio || {};

/*
 * SIMPLE SLIDER SCRIPT V0.1
 * How to use:
 * add the attribute data-moodio-slider="[type]" to the main slide container div
 * add the attibute data-moodio-slider-container to the inner container where required
 * add the attribute data-timer="[####]" to select the timing in milliseconds. a time of 0 will prevent the slide from auto moving to next slide
 * add the attribute data-slide to each individual slide
 * slider types are: [slide, center, class].
 * slide = basic sliding operation. Requires an inner container with the data attribute data-moodio-slider-container.
 * center = slide elements are not resized, but element is instead moved to be centered. useful for when sliding is only required for mobile and smaller screens
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
        this.statusEnabled = false; //flag for if status indication items are included
        this.autoplay = false; //flag for if slide is to autoplay
        this.paused = false; //flag for if slider autoplay is paused

        var slideTime = (typeof(elem.dataset.timer)==='undefined') ? 5000 : parseInt(elem.dataset.timer);
        var loop = (typeof(elem.dataset.loop)==='undefined') ? true : !(elem.dataset.loop === 'false');
        console.log("loop: " + loop);

        if(isNaN(slideTime)){
            slideTime = 5000;
        }
        if(slideTime === 0){
            this.autoplay = false;
        } else {
            this.autoplay = true;
        }
        console.log("slide time: " + slideTime);
        // console.log("slider create called for: " + elem.id);
        this.options = (typeof(options) !== 'undefined') ? options : {default:true, 
            type: ((elem.dataset.moodioSlider) ? elem.dataset.moodioSlider : 'class'),
            slideTime: slideTime,
            loop: loop,
            classNames:{previous:'previous',current: 'current', next:'next'}};


        // store container object
        //main container of slider. used for framing slider in page.
        this.el_container = elem;

        //inner container for slider. movement occurs on this
        this.el_innerContainer = this.el_container.querySelector('[data-moodio-slider-container]');
        
        //container for status items
        this.el_status = this.el_container.querySelector('[data-moodio-slider-status]');

        //array to store sizes of slides to avoid reflow performance issues with calling offsetWidth
        this.slideOffsets = [];
        
        

         if(this.el_innerContainer===null)
        {
            console.error("moodio.slider: Inner container not found.");
            return;
        }

        this.els_slides = this.el_container.querySelectorAll("[data-slide]");
        if(this.els_slides.length == 0){
            console.error("moodio.slider: No slides found. please include correct data attribute to slides");
            return;
        }

        //store the length to be number of slides
        this.length = this.els_slides.length;

        //initiate the status items
        if(this.el_status !== null){
            this.statusEnabled = true;   
            //first store class name
            this.options.classNames.currentStatus = this.el_status.dataset.moodioSliderStatus;

            //check if a inner container is set for status items and get class
            this.options.classNames.statusInner = (typeof(this.el_status.dataset.moodioSliderStatusInner) !== 'undefined') ? 
                                                this.el_status.dataset.moodioSliderStatusInner : null;
            //call function to init
            initStatus.bind(this)();
        }
        

        //init based on type
        if(this.options.type === "slide")
        {
            initAsSlide.bind(this)();

        } else if(this.options.type === "class")
        {
            initAsClass.bind(this)();
        } else if(this.options.type === "center"){
            initAsCenter.bind(this)();
        }else {
            console.error("moodio.Slider: invalid slide type for " + elem.id);
        }

        //call the common initialization function
        this.init();

    }
    function initAsCenter()
    {
    
        this.el_innerContainer.style.position = "absolute";
        
        //set the functions
        this.changeSlide = this.changeSlideAsCenter;
        this.resize = this.resizeAsCenter;

        this.resize();
        //this.getSlideOffsets();

        var that = this;
        window.addEventListener("optimizedResize", this.resize.bind(that));   


    }
    function initAsClass()
    {
        //set the functions
        this.changeSlide = this.changeSlideAsClass;
        //set slide contianer as relative
        this.el_innerContainer.style.position = "relative";
        this.selectSlide();
        this.resetTimer();

    }
    function initAsSlide()
    { 
        //set the functions
        this.changeSlide = this.changeSlideAsSlide;
        this.resize = this.resizeAsSlide;

        this.el_innerContainer.style.position = "relative";

        //resize and add resize event
       
        this.resize();
        var that = this;
        window.addEventListener("optimizedResize", this.resize.bind(that));

        this.resetTimer(); 
    }

    function initStatus()
    {
        this.els_statusItems = [];

        for(var i=0; i<this.length; i++){
            var el_li = document.createElement("li");
            
            //create click event listener within a function for scoping
            (function(bind, c)
            {
                el_li.addEventListener("click", function(){bind.selectSlide(c);}.bind(bind))
                // console.log(el_li);
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
        this.getSlideOffsets();
        this.attachControls();
        //if hammerjs is available, add swipe events
        if(typeof(Hammer)!=='undefined')
        {
            var that = this;
            this.hammer = new Hammer(this.el_container);
            this.hammer.on('swipeleft',this.swipeLeft.bind(that));
            this.hammer.on('swiperight',this.swipeRight.bind(that));
            this.hammer.on('panstart',this.panStart.bind(that));
            this.hammer.on('pan', this.pan.bind(that));
            this.hammer.on('panend', this.panEnd.bind(that));
        }
    }

    sliderCreate.prototype.attachControls = function()
    {
        var btns_n = this.el_container.querySelectorAll('[data-next]');
        var btns_p = this.el_container.querySelectorAll('[data-previous]');

        console.dir(btns_n);
        
        var that = this;
        for(var i=0, len=btns_n.length; i<len;i++)
        {
            btns_n[i].addEventListener('click',this.nextSlide.bind(that));
            console.log("adding to: " + btns_n[i]);

        }

        for(var i=0, len=btns_p.length; i<len;i++){
            btns_p[i].addEventListener('click',this.previousSlide.bind(that));
        }
    }

    sliderCreate.prototype.elementsInit = function()
    {
        // console.dir(this);
        //this.el_innerContainer.style.position = "relative";
    }

    // resize innercontainer based on number of elements.
    // for now assume all child elements same width
    // TODO: Restudy other options 
    sliderCreate.prototype.resizeAsSlide = function()
    {
        
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

    //resize elements for center type slider
    sliderCreate.prototype.resizeAsCenter = function()
    {
        var conWidth = 0;
        for(var i=0, len=this.els_slides.length; i<len; i++)
        {
            var curStyle = window.getComputedStyle(this.els_slides[i]);
            conWidth += this.els_slides[i].offsetWidth + parseFloat(curStyle.marginRight);
        }

        this.el_innerContainer.style.width = conWidth + "px";

        //save sizes for later use
        this.containerWidth = this.el_container.offsetWidth;
        this.innerContainerWidth = conWidth;

        this.getSlideOffsets();
        
        if(this.containerWidth<this.innerContainerWidth)
        {
            this.paused = false;
            if(this.el_container.className.indexOf(' small')===-1){
                this.el_container.className += " small";
            }
        } else{
            this.paused = true;
            //remove class name
            this.el_container.className = this.el_container.className
                .replace(' small','')
                .replace(/\s+/g, " ");
        }

        this.selectSlide();

    }
    
    sliderCreate.prototype.selectSlide = function(num)
    {
        if(typeof(num)==='number')
        {
            this.currentSlide = num;
        }
        // console.log("selecting: " + this.currentSlide);

        //keep both checks seperate as this can return 4, which requires it to be reset to 0
        this.currentSlide = this.getSlideNumber(this.currentSlide);

        this.changeSlide();
        if(this.statusEnabled){
            this.updateStatus();
        }
        this.resetTimer();
        
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

    //change slide for a center type slider
    sliderCreate.prototype.changeSlideAsCenter = function()
    {
        if(this.containerWidth >= this.innerContainerWidth){
            //center inner container in outer container.
            this.el_innerContainer.style.left = ((this.containerWidth-this.innerContainerWidth)/2) + "px";

        } else {
            //ensure its centered;
            this.el_innerContainer.style.left = this.slideOffsets[this.currentSlide] + "px";
            // console.log("left moving to: " + this.el_innerContainer.style.left);
        }

    }

    //change slide for a class type slider
    sliderCreate.prototype.changeSlideAsClass = function()
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

            if (i==this.currentSlide)
            {
                this.els_slides[i].className = this.els_slides[i].className + " " + this.options.classNames.current;
            } 
            else if(i==this.getSlideNumber(this.currentSlide-1))
            {
                this.els_slides[i].className = this.els_slides[i].className + " " + this.options.classNames.previous;
            }            
            else if( i === this.getSlideNumber(this.currentSlide+1))
            {
                this.els_slides[i].className = this.els_slides[i].className + " " + this.options.classNames.next;
            }

        }

    }
    //change slide for a slide type slider
    sliderCreate.prototype.changeSlideAsSlide = function()
    {
        this.el_innerContainer.style.left = (this.currentSlide * this.slideWidth * -1) + "px";
    }

    // get the next slide
    sliderCreate.prototype.nextSlide = function()
    {
        this.selectSlide(++this.currentSlide);
    }
    //go back to the previous slide
    sliderCreate.prototype.previousSlide = function()
    {
        this.selectSlide(--this.currentSlide);
    }

    //helper functions
    sliderCreate.prototype.getSlideNumber = function(number)
    {
        var rtn = number;
        //keep both checks seperate as this can return 4, which requires it to be reset to 0
        if (rtn < 0)
        {
            if(this.options.loop){
                rtn = this.length + (rtn%this.length)
            } else
            {
                rtn = 0;

            }
        }
        if(rtn>=this.length)
        {
            if(this.options.loop){
                rtn = rtn%this.length;
            } else {
                rtn = this.length-1;
            }
        }

        return rtn;

    }

    sliderCreate.prototype.getSlideOffsets = function()
    {
        this.slideOffsets = [];

        
        for(var i=0, len=this.els_slides.length; i< len; i++)
        {
            this.slideOffsets[i] = (this.containerWidth/2) - this.els_slides[i].offsetLeft - (this.els_slides[i].offsetWidth/2);
        }
    }

    //function to check if slider is in view, so as to pause when not.
    sliderCreate.prototype.checkIfInView = function(){
        // TODO: IMPLEMENT!!!
    }

    sliderCreate.prototype.resetTimer = function()
    {
        if(!this.paused && this.autoplay){
            var that = this;
            //reset the timer to change the slides
            window.clearInterval(this.slideTimer);
            this.slideTimer = window.setInterval(this.nextSlide.bind(that),this.options.slideTime);
        } else {
            window.clearInterval(this.slideTimer);
        }
    }

    // find the slide closest to the center.
    sliderCreate.prototype.findCenteredSlide = function()
    {
        //use simple loop search to find closest. 
        // as limited number of slides, more efficent then split search
        var curPos = parseInt(this.el_innerContainer.style.left);
        for(var i = 0; i<this.length; i++)
        {
            if(this.slideOffsets[i]==curPos)
            {
                this.currentSlide = i;
                break;
            } 
            else if(this.slideOffsets[i] < curPos )
            {
                // if its the first slide then just go straight to that.
                if(i===0){
                    this.currentSlide = 0;
                    break;
                } 
                else 
                {
                    // if not, find the closest of the 2 slides it is between
                    var p = (this.slideOffsets[i-1] - this.slideOffsets[i])/2;
                    console.log("p: " + p);
                    console.log("curPos: " + curPos);
                    console.log("offset: " + this.slideOffsets[i]);
                    if(curPos < (this.slideOffsets[i]+p))
                    {
                        this.currentSlide = i;
                        break;

                    } else {
                        this.currentSlide = i-1;
                         break;
                    }
                }
            }
        }
        //select the slide
        this.selectSlide();

    }

    //functions for hammerjs and mobile interaction
    sliderCreate.prototype.swipeLeft = function(ev)
    {
        this.lastSwipeTime = (new Date).getTime();
        this.nextSlide();

    }

    sliderCreate.prototype.swipeRight = function(ev)
    {
        this.lastSwipeTime = (new Date).getTime();
        this.previousSlide();
    }

    sliderCreate.prototype.panStart = function(ev)
    {
        //add class
        this.el_innerContainer.className += " panning";
        this.panStartY = parseFloat(this.el_innerContainer.style.left);
    }
    sliderCreate.prototype.pan = function(ev)
    {
        // if a panstart event store position and exit
        if(ev.isFirst)
        {
            this.panStartY = parseFloat(this.el_innerContainer.style.left);
            return;
        } else if(!ev.isFinal){
            //limit the panning by the first and last offset
            this.el_innerContainer.style.left = Math.min(Math.max(this.panStartY + ev.deltaX,this.slideOffsets[this.length-1]-100),(this.slideOffsets[0]+100))+"px";
        }
        // get difference between last position and current
        // ensure not a panstart event
        

    }
    //
    sliderCreate.prototype.panEnd = function(ev)
    {
        var curTime = (new Date).getTime();

        //remove class
        this.el_innerContainer.className = this.el_innerContainer.className
                .replace(' panning','')
                .replace(/\s+/g, " ");

        //if last swipe event was less then 100ms, ignore as it would have changed
        if(curTime-this.lastSwipeTime < 100){
            return;
        } else {
            this.findCenteredSlide();
        }
    }

    slider.create = sliderCreate;

})(window.moodio.Slider = window.moodio.Slider || {});


(function(){

    var onLoad = function(){
        //foreach slider init a slider
        var els_allSliders = document.querySelectorAll("[data-moodio-slider]");
        //console.dir(els_allSliders);
        var allSliders = [];
        for(var i = 0, len = els_allSliders.length; i<len; i++){
            allSliders.push(new moodio.Slider.create(els_allSliders[i]));
        }
    }

    window.addEventListener("load", onLoad);

})();
