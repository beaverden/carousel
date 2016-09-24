'use strict';
//TODO
// Remove click after drag
// Add object
// Remove object
// Infinite scroll


//Firing events:
//objectClicked -> detail,carouselId, detail.objectId
//carouselDragStart -> detail.carouselId
//carouselDragEnd -> detail.carouselId
//carouselDragged -> detail.carouselId, detail.dragAmount
//carouselMoved -> detail.carouselId, detail.moveAmount, detail.direction
(function(){
    var Carousel = window.Carousel || {};


    Carousel = (function() {
        function Carousel(import_settings) {
            this.settings = {
            //infinite spin
            infiniteSpin: true,

            //autoscroll
            autoscroll: false,
            autoscroll_interval: 3000,

            //direction
            direction: "horizontal",

            id: "carousel1",

            //The amount of time that is passed to the
            //SetInterval function that changes object every iteration
            //When the arrow button is holded (mouse pressed)
            arrowHoldChangeObjectInterval: 100,

            //
            spinOnLessObjects: true,

            //Turn on or off events
            events: true,

            //Global objects
            carousel: null,
            movingWrapper: null,
            moving: null,
            objects: null,


            inertionStartSpeed: 15,

            //local
            totalObjects: 0,
            previousActiveObject: 1,
            currentActiveObject: 1,
        };

            //Override the current this.settings
            for (var key in import_settings) {
                this.settings[key] = import_settings[key];
            }


            var thisCarousel = this;

            var init = function() {

                //Main container
                thisCarousel.settings.carousel = document.getElementById(thisCarousel.settings.id);
                var elem = thisCarousel.settings.carousel;

                if (thisCarousel.settings.carousel == null) {
                    console.log("Wrong carousel id");
                }

                thisCarousel.settings.moving = elem.querySelector(".moving");
                thisCarousel.settings.movingWrapper = elem.querySelector(".moving-wrapper");



                if (thisCarousel.settings.direction === "vertical") {
                    elem.className += " vertical";
                }


                //Arrows
                var toFirst = thisCarousel.settings.carousel.querySelector(".carousel-left");
                var toSecond = thisCarousel.settings.carousel.querySelector(".carousel-right");

                //Total number of objects
                thisCarousel.settings.totalObjects = thisCarousel.settings.carousel.querySelector(".moving").children.length;

                thisCarousel.settings.objects = thisCarousel.settings.carousel.getElementsByClassName("object");

                //Add click events to objects
                this.clickEvents();

                dragEvents();

                clickEventsArrows(toFirst, toSecond);

                holdArrowsEvents(toFirst, toSecond);

                keyBoardArrowsEvent();

                if (thisCarousel.settings.infiniteSpin) {
                    infiniteSpin();
                }
            }

            //Add listeners
            document.addEventListener("DOMContentLoaded", init);


        //PUBLIC API
            /*
        this.next = function(callback) {
            setActiveAndShow(thisCarousel.settings.mainElement, getNextObjectId());

            if (typeof callback !== 'undefined') {
               callback();
            }
        }

        this.previous = function(callback) {
            setActiveAndShow(thisCarousel.settings.mainElement, getPreviousObjectId());

            if (typeof callback !== 'undefined') {
               callback();
            }
        }

        this.setActiveObject = function(newActive, callback) {
            setActive(thisCarousel.settings.mainElement, newActive);

            if (typeof callback !== 'undefined') {
               callback();
            }
        }

        this.getCurrentActiveObject = function() {
            return thisCarousel.settings.currentActiveObject;
        }

        this.showObject = function(objId, callback) {
            showObject(thisCarousel.settings.mainElement, objId);

            if (typeof callback !== 'undefined') {
               callback();
            }
        }


        this.addObject = function(object, place, callback) {

            var main = thisCarousel.settings.mainElement;
            var moving = main.querySelector(".moving");


            if (typeof callback !== 'undefined') {
               callback();
            }
        }
        */
        }

        return Carousel;
    }());

    /* EVENTS */
    //Generate custom events
    Carousel.prototype.genEventAndDispatch = function(name, detail) {
        if (thisCarousel.settings.events) {
            var e = new CustomEvent(name, {
                detail : detail,
                bubbles: true,
                cancelable: true,
            });
            thisCarousel.settings.carousel.dispatchEvent(e);
        }
    }

    //Adds click events to the objects of the carousel
    //Clicking them will also generate an event [objectClicked]
    Carousel.prototype.clickEvents = function() {

        for (var i = 0; i<thisCarousel.settings.objects.length; i++) {
            var obj = thisCarousel.settings.objects[i];

            obj.addEventListener("click", function(e) {

                genEventAndDispatch("objectClicked", {
                        carouselId: thisCarousel.settings.id,
                        objectId: this.id,
                });

                setActiveAndShow(this.id.replace("obj",""));

            });
        }
    }

    //Adds drag functionality to the carousel
    //Drag start will fire and even [carouselDragStart]
    //Dragging will fire the event [carouselDragged]
    //End of dragging will fire [carouselDragEnd]
    Carousel.prototype.dragEvents = function() {
        var elem = thisCarousel.settings.carousel;
        var moving = thisCarousel.settings.moving;
        var movingWrapper = thisCarousel.settings.movingWrapper;
        var lastDiff = 0;

        /**** DRAG ****/
        moving.ondragstart = function(event) {
            return false;
        }

        moving.onclick = function() {
            return false;
        }

        moving.onmousedown = function(event) {

            genEventAndDispatch("carouselDragStart", {
                    carouselId: elem.id
            });

            var currPos = 0;
            var dir = getDirection();

            if (dir == 1) {
                currPos = event.pageX;
            } else if (dir == 2) {
                currPos = event.pageY;
            }

            document.onmousemove = function(e) {
                e.preventDefault();

                var eventPos = 0;
                if (dir == 1) {
                    eventPos = e.pageX;
                } else if (dir == 2) {
                    eventPos = e.pageY;
                }

                var diff = eventPos - currPos;
                currPos = eventPos;
                lastDiff = diff;

                genEventAndDispatch("carouselDragged", {
                    carouselId : elem.id,
                    dragAmout: diff,
                });


                spinObjects(diff);
            }

            document.onmouseup = function(e) {

                document.onmousemove = null;
                document.onmouseup = null;

                //Fire dragEnd event
                genEventAndDispatch("carouselDragEnd", {
                    carouselId: elem.id
                });

                if (Math.abs(lastDiff) > 3) {
                    spinInertion(lastDiff);
                }
                lastDiff = 0;

                event.preventDefault();
                event.stopPropagation();


            }

        }
        /**** /.DRAG ****/
    };

    //Left and right keyboard arrows will do the same
    //What left and right interface arrows do
    Carousel.prototype.keyBoardArrowsEvent = function() {
        thisCarousel.settings.carousel.onkeydown = function(e) {
            var b = e.which;
            if ( b == 37) {
                setActiveAndShow(getPreviousObjectId());
            } else if (b == 39) {
                setActiveAndShow(getNextObjectId());
            }
        }
    }

    //Ads click events on left and right arrows
    //  first - the arrow that moves the carousel to the first item
    //  second - the arrow that moves the carousel to the last item
    Carousel.prototype.clickEventsArrows = function(first, second) {

        first.addEventListener("click", function() {
            setActiveAndShow(getPreviousObjectId());
        });

        second.addEventListener("click", function() {
            setActiveAndShow(getNextObjectId())
        });
    }

    //Events of holding the mouse on the left and right arrows
    Carousel.prototype.holdArrowsEvents = function(toFirst, toSecond) {
        toFirst.onmousedown = function() {

            var timer = setInterval(function() {
                setActiveAndShow(getPreviousObjectId());
            }, thisCarousel.settings.arrowHoldChangeObjectInterval);

            toFirst.onmouseup = function() {
                clearInterval(timer);
            }
            toFirst.onmouseout = function() {
                clearInterval(timer);
            }
        }

        toSecond.onmousedown = function() {

            var timer = setInterval(function() {
                setActiveAndShow(getNextObjectId());
            }, thisCarousel.settings.arrowHoldChangeObjectInterval);

            toSecond.onmouseup = function() {
                clearInterval(timer);
            }
            toSecond.onmouseout = function() {
                clearInterval(timer);
            }

        }
    }
    /* END EVENTS */

    //If the object is out of the view and it should be shown,
    //This function will move the moving part with the needed amount so the object is shown
    Carousel.prototype.showObject = function(objId) {
        var elem = thisCarousel.settings.carousel;

        var object = elem.querySelector("#obj" + objId);
        var movingWrapper = elem.querySelector(".moving-wrapper");
        var moving = elem.querySelector(".moving");

        var movingWrapperRect = movingWrapper.getBoundingClientRect();
        var objectRect = object.getBoundingClientRect();

        var objectFirst,
            objectSecond,
            movingWFirst,
            movingWSecond,
            dir = getDirection();

        objectFirst = (dir == 1) ? objectRect.left : objectRect.top;
        objectSecond = (dir == 1) ? objectRect.right : objectRect.bottom;

        movingWFirst = (dir == 1) ? movingWrapperRect.left : movingWrapperRect.top;
        movingWSecond = (dir == 1) ? movingWrapperRect.right : movingWrapperRect.bottom;


        if (objectFirst < movingWFirst) {
            var currPos = (dir == 1) ?
                parseInt(moving.style.left.replace("px", "")) :
                parseInt(moving.style.top.replace("px", ""));

            var nextPos = currPos + movingWFirst - objectFirst;

            if (dir == 1) {
                moving.style.left = nextPos + "px";
            } else {
                moving.style.top = nextPos + "px";
            }
        }

        if (objectSecond > movingWSecond) {

            var currPos = (dir == 1) ?
                parseInt(moving.style.left.replace("px", "")) :
                parseInt(moving.style.top.replace("px", ""));

            var nextPos = currPos - (objectSecond - movingWSecond);

            if (dir == 1) {
                moving.style.left = nextPos + "px";
            } else {
                moving.style.top = nextPos + "px";
            }
        }
    }




    /* SETTERS */
    //Sets the new object active and the previous one is not active anymore
    Carousel.prototype.setActive = function(newActive) {

        thisCarousel.settings.previousActiveObject = thisCarousel.settings.currentActiveObject;
        thisCarousel.settings.currentActiveObject = newActive;

        var oldObj = thisCarousel.settings.carousel.querySelector("#obj" + thisCarousel.settings.previousActiveObject);

        var newObj = thisCarousel.settings.carousel.querySelector("#obj" + newActive);

        oldObj.className = oldObj.className.replace(" active", "");
        newObj.className += " active";

    }
    //Combines
    //@showObject
    //@setActive
    Carousel.prototype.setActiveAndShow = function(objId) {
        setActive(objId);
        thisCarousel.showObject(objId);
    }
    /* END SETTERS */



    /* GETTERS */
    //Horizontal = 1
    //Vertical = 2
    Carousel.prototype.getDirection = function() {
        return (thisCarousel.settings.direction === "horizontal" ? 1 : 2);
    }

    //Returns the Id the of the object that is previous to the current one
    Carousel.prototype.getPreviousObjectId = function() {
        var currentActive = thisCarousel.settings.currentActiveObject;
        if (currentActive > 1) {
            currentActive--;
        } else {
            currentActive = thisCarousel.settings.totalObjects;
        }
        return currentActive;
    }

    //Returns the Id the of the object that is next to the current one
    Carousel.prototype.getNextObjectId = function() {
        var currentActive = thisCarousel.settings.currentActiveObject;
        if (currentActive < thisCarousel.settings.totalObjects) {
            currentActive++;
        } else {
            currentActive = 1;
        }
        return currentActive;
    }
    /* END GETERS */


    Carousel.prototype.infiniteSpin = function() {
        var _ = this;
        console.log(_);

    }


    //Moves the "moving" element of the structure.
    //It goes to the left in the positive direction or in the negative,
    //Respectively moving left and right
    //If the direction is vertical, it will move into top direction
    //It will fire the [carouselMoved] event
    Carousel.prototype.spinObjects = function(diff) {
        var moving = thisCarousel.settings.moving;
        var movingWrapper = thisCarousel.settings.movingWrapper;
        var elem = thisCarousel.settings.carousel;

        if (checkInterval(diff)) {
            genEventAndDispatch("carouselMoved", {
                carouselId: elem.id,
                moveAmount: diff,
                direction: thisCarousel.settings.direction,
            });

            var dir = getDirection();

            //If horizontal, move left,
            //If vertical, move top
            if (dir == 1) {
                var current = parseInt(moving.style.left.replace("px", ""));
                moving.style.left = (current + diff) + "px";
            } else if (dir == 2) {
                var current = parseInt(moving.style.top.replace("px", ""));
                moving.style.top = (current + diff) + "px";
            }
        }
    }

    //Adds inertion moving after the spin
    Carousel.prototype.spinInertion = function(lastDiff) {
        var diff = (lastDiff < 0) ? -thisCarousel.settings.inertionStartSpeed : thisCarousel.settings.inertionStartSpeed;
        var dir = getDirection();

        var timer = setInterval(function() {
            spinObjects(diff);

            if (diff == 0) {
                clearInterval(timer);
            } else {
                diff += (diff > 0) ? -1 : +1;
            }
        }, 20);

    }

    //Checks is the moving part is actually movable
    Carousel.prototype.checkInterval = function(diff) {
        var moving = thisCarousel.settings.moving;
        var movingWrapper = thisCarousel.settings.movingWrapper;

        var dir = getDirection();

        var objectDimension = (dir == 1) ?  moving.querySelector(".object").offsetWidth :
                                            moving.querySelector(".object").offsetHeight;

        var mFirst = (dir == 1) ?   moving.getBoundingClientRect().left:
                                    moving.getBoundingClientRect().top;

        var mLast  = (dir == 1) ?   moving.getBoundingClientRect().right:
                                    moving.getBoundingClientRect().bottom;

        var wFirst = (dir == 1) ?   movingWrapper.getBoundingClientRect().left:
                                    movingWrapper.getBoundingClientRect().top;

        var wLast  = (dir == 1) ?   movingWrapper.getBoundingClientRect().right:
                                    movingWrapper.getBoundingClientRect().bottom;

        //If the drag or touch direction was to the first element (negative)
        //Or to the last element (positive)
        var toFirst = (diff < 0);
        var toLast = !toFirst;

                        //It worn't go further than first element and further than the last one
        var response =  (toLast && mFirst + diff < wFirst) || (toFirst && mLast + diff > wLast)
                        &&
                        //If the moving part fits totally in the wrapper, it will not move
                        //Except if spinOnLessObjects is set to true
                        (mLast > wLast || mFirst < wFirst || thisCarousel.settings.spinOnLessObjects)
        return response;
    }


})();

var meh = new Carousel({});

