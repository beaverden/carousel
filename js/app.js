document.addEventListener("DOMContentLoaded", function() {
    document.addEventListener("objectClicked", function(e) {
        console.log("clicked on object ", e.detail.objectId);
    })

    document.addEventListener("carouselDragStart", function(e) {
        console.log("drag start on carousel ",e.detail.carouselId);
    })

    document.addEventListener("carouselDragEnd", function(e) {
        console.log("drag end on carousel ",e.detail.carouselId);
        console.log("drag end on carousel ",e.detail.carouselId);
    })

    document.addEventListener("carouselMoved", function(e) {
        console.log("moved ", e.detail.carouselId + " by ",e.detail.moveAmount, "in ", e.detail.direction);
    })


});



function start() {
    this.num = 0;
    this.output = function() {
        console.log(this.num);
    }
    this.change = function() {
        this.num++;
    }
}



