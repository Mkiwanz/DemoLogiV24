YUI.add('resizable-columns', function (Y) {
    
    var ResizableColumns = Y.namespace('LogiXML.ResizableColumns');

    ResizableColumns.initialize = function () {
        //Initilize Resizable columns
        ResizableColumns.rdInitResizableColumns();

        //Wire up for re-init after refreshelement
        //REPDEV-29682, reinitializing the column size, pass the status in
        //need not to call rdInitResizableColumns when adding event
        //LogiXML.Ajax.AjaxTarget().on('reinitialize', this.rdInitResizableColumns(true));
        LogiXML.Ajax.AjaxTarget().on('reinitialize', function () { this.rdInitResizableColumns(true); }.bind(this));
    };

    ResizableColumns.plug = function(j, headers) {
      
            var header = Y.one(headers[j]);

            //Get the resize handle
            var node = Y.one(header.one('td.rdResizeHeaderRow'));

            var yFail = null;
        
            if (!Y.Lang.isValue(node)) {
                var yuiFail = header._node.getElementsByClassName("rdResizeHeaderRow");
                for (var i = 0; i < yuiFail.length; i++) {
                    yFail = yuiFail[i];
                    if (yFail.tagName.toLowerCase() === "td") {
                        node = Y.one(yFail);
                        break;
                    }
                }
            }

            if (Y.Lang.isValue(node)) {

                var headerHTML = header._stateProxy.outerHTML;

                if (Y.Lang.isValue(header.getDOMNode().style.width) && header.getDOMNode().style.width != "" && parseInt(header.getStyle('width'), 10) > 0) {
                    //19263
                    if (headerHTML.indexOf("rdcondelement") > 0 && header.getAttribute('conditionalProcessed') == "") {
                        header.setAttribute('conditionalProcessed', 'true');
                    }
                } else if (parseInt(header.getStyle('width'), 10) > 0) {
                    //19263
                    if (headerHTML.indexOf("rdcondelement") > 0) {
                        header.setAttribute('conditionalProcessed', 'true');
                        header.getDOMNode().style.width = (header.get('offsetWidth') + 4) + 'px';
                    } else
                        header.getDOMNode().style.width = (header.get('offsetWidth') - 8) + 'px';
                } else { //19600 20413
                    header.getDOMNode().style.width = '100px';
                }

                //Only show handle when inside the cell. For touch always show.
                if (LogiXML.features['touch']) {
                    LogiXML.getElementByIdEnding(node, "-ResizeHandle", "img").setStyle('visibility', 'visible');
                } else {
                    var th = LogiXML.getAncestorByTagName(node, "TH", true);
                    th.on('mouseover', function(e) {
                        LogiXML.getElementByIdEnding(e.currentTarget, "-ResizeHandle", "img").setStyle('visibility', 'visible');
                    });
                    th.on('mouseout', function(e) {
                        LogiXML.getElementByIdEnding(e.currentTarget, "-ResizeHandle", "img").setStyle('visibility', 'hidden');
                    });
                }

                //In case of AJAX refresh, we don't want to create an extra drag node
                if (!Y.Lang.isValue(node.dd)) {
                    //Plug drag node to allow us to drag resize handle
                    node.plug(Y.Plugin.Drag);
                    var dd = node.dd;
                    //Plug proxy node to maintain position of resize handle
                    dd.plug(Y.Plugin.DDProxy, {
                        positionProxy: true,
                        resizeFrame: false,
                        moveOnEnd: false
                    });

                    var hndNode = LogiXML.getElementByIdEnding(node, "-ResizeHandle", "img");
                    if (!LogiXML.features['touch'])
                        hndNode.setStyle('visibility', 'hidden');

                    dd.addHandle('#' + LogiXML.escapeSelector(hndNode.get('id'))).plug(Y.Plugin.DDWinScroll, { vertical: false, scrollDelay: 5 });;
                    hndNode.setStyle('cursor', 'col-resize');

                    LogiXML.fixYuiTest(hndNode);

                    dd.on('drag:start', ResizableColumns._onResizeStart);
                    //This event occurs on all drag events, needed to make sure that we don't make the column too small or go in the wrong direction
                    dd.on('drag:drag', ResizableColumns._onResize, node);
                    dd.on('drag:end', ResizableColumns._onResizeEnd, node);
                }
            }
    };

    ResizableColumns.rdFixTableWidth = function (tableDOM) {
        if (!tableDOM)
            return;

        var tableNode = Y.one(tableDOM);
        tableDOM = tableNode.getDOMNode();

        var tableWidth = 0;
        var iCellSpacing = 0;

        // REPDEV-26797 cellSpacing is deprecated, use border-spacing
        var tblStyle = window.getComputedStyle(tableDOM);
        if (tblStyle) {
            if (tblStyle.getPropertyValue("border-collapse") == "separate") {
                var borderSpacing = tblStyle.getPropertyValue("border-spacing");
                var iSpace = borderSpacing.indexOf(" ");
                if (iSpace > 0) {
                    // horizontal then vertical
                    iCellSpacing = parseInt(borderSpacing.substr(0, iSpace), 10);
                } else {
                    iCellSpacing = parseInt(borderSpacing, 10);
                }
            }
        }

        if (!iCellSpacing || isNaN(iCellSpacing))
            iCellSpacing = 0;

        var i = -1;
        var handlesAreVisible = LogiXML.features["touch"];
        //19277
        tableNode.one("TR").all("TH").each(function (thNode) {
            i++;

            thDOM = thNode.getDOMNode();
            //REPDEV-28940,add a flag to distinguash whether got correct coloumn width.
            tableDOM.refixed = ResizableColumns._enforceMinimumWidth(thNode);
            //REPDEV-29399, add condition, if false, need not caculate table width
            if (tableDOM.refixed) {
                var compStyle = window.getComputedStyle(thDOM, null);

                // determine table width needed for all column widths
                var colWidth = parseFloat(thDOM.style.width);
                if (isNaN(colWidth)) {
                    colWidth = ResizableColumns._calcStyleWidth(thNode);
                    thDOM.style.width = colWidth + "px";
                }

                var iAdd;

                // border is not included in scrollWidth
                if (compStyle.getPropertyValue("box-sizing") != "border-box") {
                    // style width does not include padding or borders
                    // add them

                    iAdd = parseInt(compStyle.getPropertyValue('border-left-width'), 10);
                    if (iAdd && !isNaN(iAdd))
                        colWidth += iAdd;

                    iAdd = parseInt(compStyle.getPropertyValue('border-right-width'), 10);
                    if (iAdd && !isNaN(iAdd))
                        colWidth += iAdd;

                    iAdd = parseInt(compStyle.getPropertyValue('padding-left'), 10);
                    if (iAdd && !isNaN(iAdd))
                        colWidth += iAdd;

                    iAdd = parseInt(compStyle.getPropertyValue('padding-right'), 10);
                    if (iAdd && !isNaN(iAdd))
                        colWidth += iAdd;
                }

                // include right cell space
                colWidth += iCellSpacing

                // include left cell space for first column only
                if (i == 0)
                    colWidth += iCellSpacing;

                tableWidth += colWidth;
            }
        });

        //Set table style to fixed so that table will leave viewport if necessary
        if (typeof tableWidth === 'number' && !isNaN(tableWidth) && tableWidth != 0) { //21231
            if (handlesAreVisible)
                tableWidth -= 40;

            if (tblStyle.getPropertyValue("box-sizing") == "border-box") {
                // style width includes padding and border - so add them
                var iAdd = tblStyle.getPropertyValue("border-right-width");
                if (iAdd && !isNaN(iAdd))
                    tableWidth += iAdd;

                iAdd = tblStyle.getPropertyValue("border-left-width");
                if (iAdd && !isNaN(iAdd))
                    tableWidth += iAdd;

                iAdd = tblStyle.getPropertyValue("padding-right");
                if (iAdd && !isNaN(iAdd))
                    tableWidth += iAdd;

                iAdd = tblStyle.getPropertyValue("padding-left");
                if (iAdd && !isNaN(iAdd))
                    tableWidth += iAdd;
            }

            tableWidth += "px";
            if (tableDOM.style.width != tableWidth) {
                tableDOM.style.width = tableWidth;
                //REPDEV-29600, added by REPDEV-29399
                //tableDOM.style.tableLayout = "fixed";
            }
        }
    };

    ResizableColumns.rdInitResizableColumns = function (reinit) {
        var htmlTables = Y.all('table[rdResizableColumnsID]');
        var tablesSize = htmlTables.size();
        for (var i = 0; i < tablesSize; i++) {
            var tableDOM = htmlTables.item(i).getDOMNode();
            if (reinit) {
                if (tableDOM.refixed) continue;
            }

            if (!tableDOM.tHead) {
                var theads = tableDOM.getElementsByTagName("THEAD");
                if (theads && theads.length)
                    tableDOM.tHead = theads[0];
            }

            //REPDEV-17734
            if (!tableDOM.tHead) {
                continue;
            }

            var headers = tableDOM.tHead.rows[0].cells;
            for (var j = 0; j < headers.length; j++) {
                ResizableColumns.plug(j, headers);
            }

            ResizableColumns.rdFixTableWidth(tableDOM);
        }
    };

    ResizableColumns.getWidths = function () {
        var htmlTables = Y.all("table[rdResizableColumnsID]");
        var tableSize = htmlTables.size();
        var table, headers, header;
        var widths = {};

        for (var i = 0; i < tableSize; i++) {
            table = htmlTables.item(i).getDOMNode();

            if (table.tHead == null) {
                //REPDEV-17734
                //table.tHead = table.getElementById("thead")[0];
                var theads = table.getElementsByTagName("THEAD");
                if (theads && theads.length)
                    table.tHead = theads[0];

                if (table.tHead == null) {
                    continue;
                }
            }

            headers = table.tHead.rows[0].cells;

            for (var j = 0; j < headers.length; j++) {
                header = headers[j];

                if (header && header.id && header.style && header.style.width)
                    widths[header.id] = header.style.width;
            }
        }

        return widths;
    };

    // Calculates the style width in pixels needed to match the scrollWidth
    ResizableColumns._calcStyleWidth = function (thNode) {
        var compStyle = window.getComputedStyle(thNode.getDOMNode());

        var width = thNode.get("scrollWidth");

        if (compStyle.getPropertyValue("box-sizing") == "border-box") {
            // due to box-sizing, css "width" includes padding and border
            // scrollWidth always includes padding, so we just need to add the border to get the width
            var iBorder = parseInt(compStyle.getPropertyValue("border-left-width"), 10);
            if (iBorder && !isNaN(iBorder))
                width += iBorder;

            iBorder = parseInt(compStyle.getPropertyValue("border-right-width"), 10);
            if (iBorder && !isNaN(iBorder))
                width += iBorder;
        } else {
            // due to box-sizing, css "width" does not include padding or border
            // scrollWidth always includes padding, so we need to remove it to get the width
            var iPadding = parseInt(compStyle.getPropertyValue("padding-left"), 10);
            if (iPadding && !isNaN(iPadding))
                width -= iPadding;

            iPadding = parseInt(compStyle.getPropertyValue("padding-right"), 10);
            if (iPadding && !isNaN(iPadding))
                width -= iPadding;
        }

        return width;
    };

    /* -----Events----- */

    ResizableColumns._onResizeStart = function (e) {

        var drag = e.target;
        var dragNode = drag.get('dragNode');
        var node = drag.get('node');

        //Make sure node and source table exist
        if (!node) {
            e.halt();
            return;
        }

        var header = node.ancestor("th");
        if (!header) {
            e.halt();
            return;
        }

        var sourceTableNode = header.ancestor("table");
        if (!sourceTableNode) {
            e.halt();
            return;
        }

        // Save starting width
        header._node.setAttribute("data-rdResizeStartWidth", header._node.style.width);
        sourceTableNode._node.setAttribute("data-rdResizeStartWidth", sourceTableNode._node.style.width);

        //Set style of dragnode --  column resize cursor as the mouse and make sure nothing else is visible
        dragNode.setStyles({
            opacity: '.00',
            borderLeft: '0px solid',
            borderTop: '0px',
            borderBottom: '0px',
            cursor: 'col-resize',
            backgroundColor: 'transparent'
        });
    };

    ResizableColumns._enforceMinimumWidth = function (thNode) {
        if (!thNode || !thNode._node || !thNode._node.offsetParent)
            return false;

        // We need to increase width to get rid of scrollbar - or px is not set yet
        var oldWidth = parseFloat(thNode._node.style.width);
        var newWidth = ResizableColumns._calcStyleWidth(thNode);
        var diff = newWidth - oldWidth;

        if (diff != 0) {
            // enforcing min width by changing header width
            thNode._node.style.width = newWidth + "px";

            // changing a column width changes the table width
            // REPDEV-29399, not set table width here. it will be caculated after all column width are set. Otherwise, if width scale is %, it causes a wrong table width
            //var tbl = thNode.ancestor("table");
            //oldWidth = parseFloat(tbl._node.style.width);
            //newWidth = oldWidth + diff;
            //tbl._node.style.width = newWidth + "px";
        }
        return true;
    };

    ResizableColumns._onResize = function (e) {
        var drag = e.target;
        var tdNode = drag.get('node');
        var thNode = tdNode.ancestor("th");

        //20 px is the minimum
        if (drag.mouseXY[0] <= (thNode.getX() + 20) ) {
            e.halt();
            return;
        }

        var sourceTableNode = thNode.ancestor("table");
        if (!sourceTableNode) {
            e.halt();
            return;
        }

        // data width attributes set in _onResizeStart
        var startThWidth = parseFloat(thNode._node.getAttribute("data-rdResizeStartWidth"));
        var startTableWidth = parseFloat(sourceTableNode._node.getAttribute("data-rdResizeStartWidth"));
        var resizeDifference = drag.mouseXY[0] - drag.startXY[0]; //  the diff from where x was on mousedown
        var newThWidth = startThWidth + resizeDifference;
        var newTableWidth = startTableWidth + resizeDifference;

        if (newThWidth < 20) {
            var diff = 20 - newThWidth;
            resizeDifference + diff;
            newThWidth = startThWidth + resizeDifference;
            newTableWidth = startTableWidth + resizeDifference;
        }

        newThWidth += "px";
        newTableWidth += "px";

        var styleWidthBefore = parseFloat(thNode._node.style.width);
        var styleWidthAfter = parseFloat(newThWidth);
        var styleWidthDiff = styleWidthAfter - styleWidthBefore;

        if (styleWidthDiff == 0)
            return;

        thNode._node.style.width = newThWidth;
        sourceTableNode._node.style.width = newTableWidth;

        ResizableColumns._enforceMinimumWidth(thNode);
    };

    ResizableColumns._onResizeEnd = function (e) {
        //Set node width
        ResizableColumns._onResize(e);

        var drag = e.target;
        var tdNode = drag.get('node');
        var thNode = tdNode.ancestor("th");

        var sourceTableNode = thNode.ancestor("table");
        if (!sourceTableNode) {
            e.halt();
            return;
        }

        var sourceTableDOM = sourceTableNode.getDOMNode();
        ResizableColumns.rdFixTableWidth(sourceTableDOM);

        //Build AJAX post string
        var sResize = "";

        var headers = sourceTableDOM.tHead.rows[0].cells;
        var header, headerNode;
        for (var j = 0; j < headers.length; j++) {
            header = headers[j];
            headerNode = Y.one(header);
            var sResizeColId = sourceTableDOM.tHead.rows[0].cells[j].id.replace("-TH", "");
            if (Y.Lang.isValue(headerNode.getAttribute('rdctcolnr')) && parseInt(headerNode.getAttribute('rdctcolnr'),10) >= 0)
                sResize += "," + sResizeColId + "_rdctcolnr" + ":" + parseInt(headerNode.getDOMNode().style.width, 10) + "_" + headerNode.getAttribute('rdctcolnr');
            else
                sResize += "," + sResizeColId + ":" + parseInt(headerNode.getDOMNode().style.width,10);
        }

        var tableWidth = parseInt(sourceTableDOM.style.width, 10);
        sResize += "," + sourceTableNode.getAttribute('ID') + ":" + tableWidth;
        var sResizableColumnsID = sourceTableDOM.getAttribute("rdResizableColumnsID");
        var sReportID = sourceTableDOM.getAttribute("rdReportID");

        var sDefInDataCache = sourceTableDOM.getAttribute("rdDefInDataCache");
        if (sDefInDataCache == "True")
            sDefInDataCache = "&rdDefInDataCache=True";
        else
            sDefInDataCache = "";

        // REPDEV-23732
        sResize = encodeURIComponent(sResize);

        //For Logi: Save the new column sizes back to the server
        var url;
        if (sourceTableDOM.id == "dtAnalysisGrid") {
            var hiddenNoCache = document.createElement("INPUT"); 
            hiddenNoCache.type = "HIDDEN";
            hiddenNoCache.id = "rdNoXslCache";
            hiddenNoCache.name = "rdNoXslCache";
            hiddenNoCache.value = "True";
            sourceTableDOM.tHead.rows[0].cells[0].appendChild(hiddenNoCache);

            url = 'rdAjaxCommand=rdAjaxNotify'
                + '&rdNotifyCommand=SaveResizableColumns'
                + '&rdReport=' + sReportID + sDefInDataCache
                + '&rdResizableColumnsID=' + sResizableColumnsID
                + '&rdResize=' + sResize
                + '&rdIsAg=True'
                + '&rdAgID=' + document.rdForm.rdAgId.value;
        } else {
            var sSuperElementParam = "";
            if (Y.one('.rd-report-author-element')) {
                sSuperElementParam = '&rdIsReportAuthor=True';
            } else if (document.getElementById('rdDashboardPanelContainer')) {
                sSuperElementParam = '&rdIsDashboard=True';
            } else if (sourceTableNode.ancestor('.rdVizContent')) {
                sSuperElementParam = '&rdVizContent=True';
            }

            url = 'rdAjaxCommand=rdAjaxNotify'
                + '&rdNotifyCommand=SaveResizableColumns'
                + '&rdReport=' + sReportID + sDefInDataCache
                + '&rdResizableColumnsID=' + sResizableColumnsID
                + '&rdResize=' + sResize
                + sSuperElementParam;
        }
        
        rdAjaxRequest(url);
    };

    LogiXML.ResizableColumns = ResizableColumns;

}, '1.0.0', { requires: ['dd-constrain', 'dd-proxy', 'dd-drop-plugin', 'dd-plugin', 'dd-scroll'] });

