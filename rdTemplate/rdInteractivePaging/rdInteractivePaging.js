YUI.add("rdInteractivePaging", function (Y) {

    //create namespaced plugin class
    Y.namespace("LogiXML").rdInteractivePaging = Y.Base.create("rdInteractivePaging", Y.Base, [], {
        initializer: function () {
        },
        destructor: function () {
        },
    }, {
            NAME: "rdInteractivePaging",
            NS: "rdInteractivePaging",
            ATTRS: {
            },

            AttachAutoScrolling: function (divID) {
                var divNode = document.getElementById(divID);
                if (!divNode) return;

                divNode.scrollTarget = divNode.querySelector("TABLE#" + divID.replace("_scrolling", ""));
                Y.LogiXML.rdInteractivePaging._recalculateScrollArea(divNode);
                LogiXML.Ajax.AjaxTarget().on('reinitialize', function (e) {
                    var tableNode = document.querySelector("TABLE#" + divID.replace("_scrolling", ""));
                    Y.LogiXML.rdInteractivePaging.OnReinitializeScrollArea(tableNode)
                });
            },

            /**
             * PRIVATE
             */
            //IE not support : _recalculateScrollArea: function (divNode, attachResizeListener = true) {
            _recalculateScrollArea: function (divNode, attachResizeListener) {
                if (attachResizeListener === undefined) attachResizeListener = true;

                var tableNode = divNode.scrollTarget;
                if (!tableNode) return;

                divNode.style.maxHeight = "";//for PROTECTION (such as 'can not caculate', 'Not support', 'Not need')
                var maxRowCount = parseInt(divNode.getAttribute("rdScrollRowsY"));
                var tBody = tableNode.tBodies.item(0) //JUST 1 in this case (Because tableNode = Y.Node.create(tableHTMLText) before.)
                if (maxRowCount <= (tBody ? tBody.childElementCount : 0)) {
                    //Note: Getting size (especially the table-size was set as relative value) MUST SKIP the scroll-DIV, set maxwidth=100% or width=100% to scroll-div is a simplest way.
                    var tableHeader = tableNode.tHead;
                    var sumHeight = tableHeader.offsetHeight;

                    if (sumHeight == 0) {
                        //HEIGHT is 'auto' (or it does not displayed, or error)->can not caculate
                        return;
                    }
                    var tBodyChildren = tBody.children;
                    for (var i = 0; i < maxRowCount; i++) {
                        var e = tBodyChildren.item(i);
                        if (e.tagName == "TR") {
                            sumHeight = sumHeight + e.getBoundingClientRect().height;
                        }
                    }
                    //BorderSpace Fixing
                    var iVerticalBorderSpace = 0
                    if (window.getComputedStyle(tableNode).getPropertyValue("border-collapse") == "separate") {
                        var sVerticalBorderspace = window.getComputedStyle(tableNode).getPropertyValue("-webkit-border-vertical-spacing");
                        if (!sVerticalBorderspace) {
                            var temp = window.getComputedStyle(tableNode).getPropertyValue("border-spacing");
                            if (temp) {
                                temp = temp.split(" ");
                                if (temp.length >= 2) sVerticalBorderspace = temp[1];
                                else sVerticalBorderspace = temp[0];
                            }
                        }
                        if (sVerticalBorderspace) {
                            iVerticalBorderSpace = parseFloat(sVerticalBorderspace);//1. In Edge, it is Float-value; 2. Rightnow, the unit always pixel.
                        }
                    }
                    sumHeight = sumHeight + (maxRowCount + 2) * iVerticalBorderSpace; //+2 : + top of Header+buttom of last TR

                    //Caption Fixing
                    var allCapNodes = tableNode.getElementsByTagName("Caption")
                    for (var i = 0; i < allCapNodes.length; i++) {
                        var capNode = allCapNodes.item(i);
                        sumHeight = sumHeight + capNode.offsetHeight + iVerticalBorderSpace;
                    }

                    //H-ScrollBar Fixing
                    if (tableNode.backupWidth) tableNode.style.width = tableNode.backupWidth;
                    var oScrollBarSize = Y.LogiXML.rdInteractivePaging._GetScrollBarSize();
                    if (detectIE()) {
                        //In some IE version, clientWidth gets 0
                        if (divNode.clientWidth > 0 && divNode.clientWidth < tableNode.offsetWidth) {
                            sumHeight = sumHeight + oScrollBarSize.HSCROLL_H;
                        }
                    } else {
                        if (divNode.clientWidth < tableNode.offsetWidth) {
                            sumHeight = sumHeight + oScrollBarSize.HSCROLL_H;
                        }
                    }
                    //Width Fixing
                    //1) If table's width has been set relative(such as %), 'fit-content' would make scrollbar away from the table
                    //2) Note: IE not support 'Fit-Content', it should be set a directly value.
                    //3) Note: rdResizeabelColumn#rdFixTableWidth may set table.style.width to 1px
                    if (tableNode.style.width && tableNode.style.width.endsWith("%")) {
                        divNode.style.maxWidth = tableNode.style.width;
                        //Should backup tableNode.style.width for possible multiple recalculations(e.g.the iframe keeps changing size)
                        tableNode.backupWidth = tableNode.style.width;
                        tableNode.style.width = "100%";
                    } else {
                        divNode.style.maxWidth = tableNode.offsetWidth + oScrollBarSize.VSCROLL_W + "px";
                        var func = Y.LogiXML.rdInteractivePaging._GetWindowResizeHandler(divNode, tableNode)
                        if (attachResizeListener)
                            window.addEventListener("resize", func);
                        else
                            window.removeEventListener("resize", func);//REMOVE IS PROTECTION.
                    }
                    //add scroll-behavior:soomth?? 
                    divNode.style.maxHeight = Math.ceil(sumHeight) + "px"
                    divNode.style.overflowY = "auto";

                    tableHeader.style.position = "sticky";
                    tableHeader.style.top = "0px";
                    //LOCK POPUPMENU ON THEADER.
                    var popupDivs = tableHeader.querySelectorAll("span>div.rdPopupMenu");//The Class condition please CHECK sSetAction on rdServer
                    for (var i = 0; i < popupDivs.length; i++) {
                        var xNode = document.createElement("div")
                        xNode.setAttribute("style", "position:fixed");
                        var dNode = popupDivs.item(i);
                        dNode.parentNode.replaceChild(xNode, dNode);
                        xNode.appendChild(dNode);
                    }

                    //LAZY-LOADING
                    if (divNode.getAttribute("rdPagination") == "True") {
                        var bHasNext = (divNode.getAttribute("rdHasNextPage") == "True");
                        if (!bHasNext) {
                            //console.log(sTableID + " reached the last page!")
                            return;
                        }
                        if (Math.ceil(sumHeight) >= divNode.clientHeight) {
                            if (detectIE())
                                divNode.style.maxHeight = (divNode.clientHeight - 2) + "px"
                            else
                                divNode.style.maxHeight = (divNode.clientHeight - 1) + "px"
                        }
                        divNode.cancelNextTrigger = false;
                        divNode.onscroll = function () {
                            if ((!divNode.cancelNextTrigger) && (h = Math.ceil(divNode.scrollHeight - divNode.clientHeight)) && Math.ceil(divNode.scrollTop) >= h) {
                                divNode.cancelNextTrigger = true //we use refresh-element-action, the old DIV will be replaced , so need not set it back later.
                                divNode.onscroll = undefined; //we use refresh-element-action, the old DIV will be replaced , so can set it undefined
                                divNode.scrollTop = h; //Fix errors on diff browser.(Some times it is -0.5~0.5)

                                var tableNode = divNode.scrollTarget;
                                var sTableID = tableNode.getAttribute("id")
                                var iNextPageNr = parseInt(divNode.getAttribute("rdNextPageNr"));

                                //if (!bHasNext) {
                                //    return;
                                //}

                                //WAIT
                                var waitTR = Y.Node.create("<tr><td id=\"Waiting\" class=\"rdThemeDataTableCell\"><img src=\"rdTemplate/rdPagingWait.gif\" /></td></tr>");
                                tableNode.tBodies.item(0).appendChild(waitTR._node);//we use refresh-element-action, the old TABLE will be replaced , so need not remove it later.

                                var sRefreshCommand = "rdDataTablePaging=True&rdAjaxCommand=RefreshElement&rdRefreshElementID=" + sTableID
                                    + "&" + sTableID + "-ScrollToPage=" + iNextPageNr
                                    + "&rdReport=" + divNode.getAttribute("rdReport")
                                    + "&rdCancelPreviousPagingRequests=True&rdRequestForwarding=Form";

                                var s = divNode.getAttribute("rdDataCache");
                                if (s && s.length > 0)
                                    sRefreshCommand += "&rdDataCache=" + s;

                                rdAjaxRequest(sRefreshCommand, 'false', '', false, null, null, false);
                            }
                        };
                    }
                }
            },
            /**PRIVATE, Is there any way to get scroll's size?*/
            _GetScrollBarSize: function () {
                var el = document.createElement('div');
                el.style.visibility = 'hidden';
                el.style.overflow = 'scroll';

                document.body.appendChild(el);
                var VSCROLL_W = (el.offsetWidth - el.clientWidth) + 0.5; //0.5 for compute error(by UI-Style of Browser).
                var HSCROLL_H = (el.offsetHeight - el.clientHeight);
                document.body.removeChild(el);
                return {
                    HSCROLL_H: HSCROLL_H,
                    VSCROLL_W: VSCROLL_W
                }
            },
            /**PRIVATE, WindowResizeHandler, 
             * DO NOT FOR IFRAME as we have onIFrameResie(..) see IFrameResize.js 
             * RECOMMAND ONLY 1 TIME FOR Resizeble.fixTableWidth(), as there are toooo many ResizeableColumn.fixTableWidth*/
            _GetWindowResizeHandler: function (divNode, tableNode) {
                divNode.oldWindowSize = document.body.clientWidth;
                var func = function () {//IE does not support "() => {"
                    if (tableNode.style.width && tableNode.style.width.endsWith("%")) {
                        window.removeEventListener("resize", func); //PROTECTION
                    } else {
                        if (document.body.clientWidth > divNode.oldWindowSize) {//ZOOM IN
                            divNode.style.maxWidth = "100%"; //refresh to get new table size
                            //NOTE: '_GetScrollBarSize' has been called before.
                            var oScrollBarSize = Y.LogiXML.rdInteractivePaging._GetScrollBarSize();
                            divNode.style.maxWidth = tableNode.offsetWidth + oScrollBarSize.VSCROLL_W + "px";
                            divNode.oldWindowSize = document.body.clientWidth;
                        }
                    }
                };
                return func;
            },
            /**
             * Adds WindowResizeListener and set Slider's position.
             * ATTENTION: To add a caller or modify the content, please MUST READ the comment where it is called in rdAjax at first , 
             *              and add/update the comment if decided to add/modify
             */
            InitScrollAreaAfterAjaxRefresh: function (divNode, oldScrollTop) {
                if (!divNode) return;
                if (oldScrollTop) divNode.scrollTop = oldScrollTop;
                //All others are put to on 'reinitialize', here just add WindowSizeListener
                var divID = divNode.getAttribute("id");
                var tableNode = divNode.querySelector("TABLE#" + divID.replace("_scrolling", ""));

                var func = Y.LogiXML.rdInteractivePaging._GetWindowResizeHandler( divNode, tableNode )
                window.addEventListener("resize", func);
            },
            RecaculateAllScrollAreasInIFrame: function (iframeNode) {
                var scrollDivs = iframeNode.contentWindow.Y.all("DIV[rdScrollRowsY]");
                for (var i = 0; i < scrollDivs.size(); i++) {
                    var divNode = scrollDivs.item(i)._node;
                    if (!divNode.scrollTarget) {
                        var divID = divNode.getAttribute("id");
                        divNode.scrollTarget = divNode.querySelector("TABLE#" + divID.replace("_scrolling", ""));
                    }
                    Y.LogiXML.rdInteractivePaging._recalculateScrollArea(divNode, false);
                }
            },
            OnReinitializeScrollArea: function (tableNode) {
                if (!(tableNode && tableNode.parentElement.hasAttribute("rdScrollRowsY"))) return;
                var divNode = tableNode.parentElement;
                divNode.scrollTarget = tableNode;
                var scrollTop = divNode.scrollTop;
                Y.LogiXML.rdInteractivePaging._recalculateScrollArea(divNode, false);//The WindowSizeListener had been attached before.
                divNode.scrollTop = scrollTop;
            },
    });

}, "1.0.0", { requires: ["base", "plugin", "json"] });

