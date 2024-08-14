YUI.add("rdLazyImages", function (Y) {

    Y.namespace("LogiXML").rdLazyImages = Y.Base.create("rdLazyImages", Y.Base, [], {
        initializer: function () {
        },
        destructor: function () {
        },
    }, {

        rdLazyLoadImages: function (eleID) {
            var viewportParent = document.getElementById(eleID);
            //29965, void NPE
            if (viewportParent == null) {
                return;
            }
            var parentRect = viewportParent.getBoundingClientRect();
            if (!!!(parentRect.bottom - parentRect.top)) { return; }
            var images = viewportParent.querySelectorAll('img[srcLazy]');
            if (!images || images.length <= 0) return;
            if (!Y.LogiXML.rdLazyImages.lazyLoadImages(viewportParent)) { return; }
            LogiXML.Ajax.AjaxTarget().on('reinitialize', function (e) {
                Y.LogiXML.rdLazyImages.reLazyLoadImages(eleID);
            });
        },

        lazyLoadImages: function (viewportParent) {
            viewportParent.onscroll = function () {
                Y.LogiXML.rdLazyImages.loadImages(viewportParent);
            }
            return Y.LogiXML.rdLazyImages.loadImages(viewportParent);
        },

        reLazyLoadImages: function (eleID) {
            var viewportParent = document.getElementById(eleID);
            //29965, void NPE
            if (viewportParent == null) {
                return;
            }
            var parentRect = viewportParent.getBoundingClientRect();
            if (!!!(parentRect.bottom - parentRect.top)) { return; }
            return Y.LogiXML.rdLazyImages.lazyLoadImages(viewportParent);
        },

        loadImages: function (viewportParent) {
            var ppImages = viewportParent.querySelectorAll('img[srcLazy]');
            if (!ppImages || ppImages.length <= 0) return false;
            function isOnVerticalViewPort(ele, parentRect) {
                var rect = ele.getBoundingClientRect();
                return rect.bottom > parentRect.top && rect.top < parentRect.bottom;
            };
            var parentRect = viewportParent.getBoundingClientRect();
            for (var i = 0; i < ppImages.length; i++) {
                if (ppImages[i].isloaded || ppImages[i].src && ppImages[i].src.length > 0) continue;
                if (isOnVerticalViewPort(ppImages[i], parentRect)) {
                    ppImages[i].src = ppImages[i].getAttribute("srcLazy");
                    ppImages[i].onload = function () {
                        this.isloaded = true;
                        this.removeAttribute("srcLazy");
                    }
                }
            }
            return true;
        },

       
    });

    
}, "1.0.0", { requires: ["base"] });