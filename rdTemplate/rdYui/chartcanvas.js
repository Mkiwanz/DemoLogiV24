YUI.add('chartCanvas', function (Y) {
    //"use strict";
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (obj, start) {
            for (var i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] === obj) { return i; }
            }
            return -1;
        }
    }
    
    var Lang = Y.Lang,
        TRIGGER = 'rdChartCanvas';

    if (LogiXML.Ajax.AjaxTarget) {
        LogiXML.Ajax.AjaxTarget().on('reinitialize', function () {
            if (LogiXML && LogiXML.Dashboard && LogiXML.Dashboard.pageDashboard && LogiXML.Dashboard.pageDashboard.refreshing)
                return;

            Y.LogiXML.ChartCanvas.createElements(true);
        });
    }

    Y.LogiXML.Node.destroyClassKeys.push(TRIGGER);

    Y.namespace('LogiXML').ChartCanvas = Y.Base.create('ChartCanvas', Y.Base, [], {
        _handlers: {},

        configNode: null,
        id: null,
        chart: null,
        reportName: null,
        renderMode: null,
        jsonUrl: null,
        chartPointer: null,
        refreshAfterResize: false,
        debugUrl: null,
        isUnderSE: null,
        inputElement: null,
        changeFlagElement: null,
        mask: null,
        restoreSelectionForSeriesIndex: null,
        maxVisiblePoints: null,
        refreshTimers: [],
        drillTo: null,
        currentDrillTo: null,

        initializer: function(config) {
            this._parseHTMLConfig();
            this.configNode.setData(TRIGGER, this);

            var chartOptions = this.extractOptionsFromHtmlNode(this.configNode);

            //FIXFOR-V9
            //REPDEV-26534 HC9: Get rid of old HighchartsAdapter
            //NOTE:this method only work for Highcharts JS v9.0.1 (2021-02-15)
            //That is, if upgrade the Highcharts need check whether it work or not. 
            //It can work on Highcharts JS v9.1.2(2021 - 06 - 16) and Highcharts JS v9.3.3(2022 - 02 - 01) with below the commented code (line #61).
            //I only test these two versions.
            this._handlers.chartError = Highcharts.addEvent ? Highcharts.addEvent(Highcharts.Chart, 'displayError', Y.LogiXML.ChartCanvas.handleError) : HighchartsAdapter.addEvent(this.configNode.getDOMNode(), 'error', Y.LogiXML.ChartCanvas.handleError);
            //this._handlers.chartError = (Highcharts.addEvent ? Highcharts : HighchartsAdapter).addEvent(Highcharts, 'displayError', Y.LogiXML.ChartCanvas.handleError);
            this._handlers.setSize = this.configNode.on('setSize', this.resized, this);
            this.initChart(chartOptions);
            if (this.isResponsive()) {
                this.subscribeToWindowResize();
            }
        },

        isResponsive: function () {
            var styleAttribute = this.configNode.getAttribute('style'),
                actualWidth = this.configNode.getStyle('width');
            if (styleAttribute.indexOf('width') > -1) {
                if (actualWidth.indexOf('%') > -1) {
                    return true;
                }
                return false;
            }
            return true;
        },

        subscribeToWindowResize: function () {
            if (!window.LogiXML.chartCanvasWindowResize) {
                window.LogiXML.chartCanvasWindowResize = Y.on('windowresize', function () { Y.LogiXML.ChartCanvas.reflowAllCharts(); });
            }
        },

        responsiveResize: function (self, bForce) {
            if (self.chart && self.chart.container && self.chart.options && self.chart.options.chart) {
                var container = Y.one(self.chart.container);
                container.hide();
                var width = self.configNode.get('offsetWidth');
                container.show();
                if (!LogiXML.ChartCanvas.Highcharts9Adapter.checkNewHC())//FIXFOR-V9, REPDEV26662-part2(HC9, chart doesnot resized if resize frame/window)
                    self.chart.options.chart.width = width;
                self.chart.reflow();
            }
        },

        extractOptionsFromHtmlNode: function (chartNode) {
            var options = chartNode.getAttribute('data-options'),
                chartOptions = this.parseJson(options);
            return chartOptions;
        },

        rdUpdateChartData: function (requestParams) {
            var requestUrl = 'rdAjaxCommand=RefreshElement&rdRefreshElementID=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
            requestUrl += "&rdChartRefreshType=UpdateData";
            requestUrl = this.attachRequestParams(requestUrl, requestParams);
            rdAjaxRequest(requestUrl);
        },

        rdAppendChartData: function (requestParams, maxVisiblePoints) {
            this.maxVisiblePoints = maxVisiblePoints;
            var requestUrl = 'rdAjaxCommand=RefreshElement&rdRefreshElementID=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
            requestUrl += "&rdChartRefreshType=AppendData";
            requestUrl = this.attachRequestParams(requestUrl, requestParams);
            rdAjaxRequest(requestUrl);
        },

        attachRequestParams: function (url, requestParams) {
            if (requestParams) {
                for (var key in requestParams) {
                    url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(requestParams[key]);
                }
            }
            return url;
        },

        setChartDataFromRefreshElement: function (chartNode) {
            var chartOptions = this.extractOptionsFromHtmlNode(chartNode),
               refreshType = chartNode.getAttribute('data-refresh-type');
            if (!refreshType || refreshType == '') {
                refreshType = "UpdateData";
            }
            if (chartNode.getAttribute('bookmark-migration-finished')) {
                this.chart.renderTo.setAttribute('bookmark-migration-finished', chartNode.getAttribute('bookmark-migration-finished'));
            }
            this.rdSetChartData(chartOptions, refreshType);
        },

        rdSetChartData: function (chartOptions, updateType, maxVisiblePoints) {
            this.preProcessChartOptions(chartOptions);
            if (!updateType || updateType == '') {
                updateType = "UpdateData";
            }
            if (!maxVisiblePoints && this.maxVisiblePoints) {
                maxVisiblePoints = this.maxVisiblePoints;
            }
            switch (updateType) {
                case "UpdateData":
                    {
                        var i = 0, length = chartOptions.series.length,
                            j = 0, jLength = this.chart.series.length,
                            seriesId;
                        for (; i < length; i++) {
                            seriesId = chartOptions.series[i].id;
                            for (j = 0; j < jLength; j++) {
                                if (this.chart.series[j].options.id == seriesId) {
                                    if (chartOptions.series[i].data && chartOptions.series[i].data.length) {
                                        this.chart.series[j].setData(chartOptions.series[i].data);
                                    }
                                }
                            }
                        }
                        this.chart.setTitle(chartOptions.title, true)
                        
                    }
                    break;
                case "AppendData":
                    {
                        var i = 0, length = chartOptions.series.length,
                            j = 0, jLength = this.chart.series.length,
                            seriesId;
                        for (; i < length; i++) {
                            seriesId = chartOptions.series[i].id;
                            for (j = 0; j < jLength; j++) {
                                if (this.chart.series[j].options.id == seriesId) {
                                    var timespan = chartOptions.series[i].visibleTimespan,
                                        shiftCount = 0;
                                    if (timespan) {
                                        var timeArr = timespan.split(':'),
                                            dateIndent = timeArr[0] * 3600000 + timeArr[1] * 60000 + timeArr[2] * 1000, //in milliseconds
                                            maxDate = LogiXML.getTimestampWithoutClientOffset(new Date()),
                                            //FIXFOR-V9
                                            //REPDEV-26527 HighChart v9.x: Line Chart with Refresh Series Timer cannot display
                                            minDate = maxDate - dateIndent;
                                        for (var k = this.chart.series[j].data.length; k >= 0; k--) {
                                            if (this.chart.series[j].data[k] && this.chart.series[j].data[k].x < minDate) {
                                                shiftCount++;
                                            }
                                        }
                                        if (chartOptions.series[i].data) {
                                            for (var index = 0; index < chartOptions.series[i].data.length; index++) {
                                                var dataPoint = chartOptions.series[i].data[index];
                                                if (shiftCount > 0) {
                                                    this.chart.series[j].addPoint(dataPoint, false, true);
                                                    shiftCount--;
                                                } else {
                                                    this.chart.series[j].addPoint(dataPoint, false, false);
                                                }
                                            }
                                        }
                                        this.setRefreshTimerPreviousValue();
                                        this.chart.xAxis[0].setExtremes(minDate, maxDate);
                                    } else {

                                        if (maxVisiblePoints && maxVisiblePoints > 0) {
                                            var pointsLength = this.chart.series[j].data.length,
                                                pointsToDeleteCnt = pointsLength - maxVisiblePoints;
                                            if (pointsToDeleteCnt > 0) {
                                                for (var k = 0; k < pointsToDeleteCnt; k++) {
                                                    shiftCount++;
                                                }
                                            }
                                        }

                                        if (chartOptions.series[i].data) {
                                            for (var index = 0; index < chartOptions.series[i].data.length; index++) {
                                                var dataPoint = chartOptions.series[i].data[index];
                                                if (shiftCount > 0) {
                                                    this.chart.series[j].addPoint(dataPoint, false, true);
                                                    shiftCount--;
                                                } else {
                                                    this.chart.series[j].addPoint(dataPoint, false, false);
                                                }
                                            }
                                        }
                                    }
                                    if (this.chart.xAxis && this.chart.xAxis[0]) {
                                        this.chart.xAxis[0].minRange = null;
                                    }
                                    this.chart.redraw();
                                }
                            }
                        }
                    }
                    break;
                default:
                    throw ('Refresh type is undefined');
            }
            this.postProcessChartOptions(chartOptions);
        },

        setRefreshTimerInitialDateRange: function (chartOptions) {
            if (!chartOptions.series || chartOptions.series.length == 0) {
                return;
            }
            var i = 0, length = chartOptions.series.length,
                xAxis, ret = false, isAppend = false;
            for (; i < length; i++) {
                isAppend = false;
                var serie = chartOptions.series[i];
                if (serie.visibleTimespan) {
                    isAppend = true;
                    var timeSpan = serie.visibleTimespan,
                        timeArr = timeSpan.split(':'),
                        dateIndent = timeArr[0] * 3600000 + timeArr[1] * 60000 + timeArr[2] * 1000, //in milliseconds
                        maxDate = LogiXML.getTimestampWithoutClientOffset(new Date()),
                        minDate = new Date(maxDate - dateIndent),
                        axisId = LogiXML.getGuid();
                    if (!chartOptions.xAxis) {
                        chartOptions.xAxis = [];
                    }
                    if (chartOptions.xAxis.length == 0) {
                        chartOptions.xAxis.push({ id: axisId, labels: {}, title: { text: null }, type: 'datetime' });
                        serie.xAxis = axisId;
                    } 
                    chartOptions.xAxis[0].min = minDate.getTime();
                    chartOptions.xAxis[0].max = new Date(maxDate).getTime();
                    ret = true;
                }

                if (serie.refreshInterval) {
                    var prms = "rdAjaxCommand=RefreshElement&rdRefreshElementID=" + this.id +
                                    "&rdRefreshSeriesTimerEvent=True"+
                                    "&rdChartRefreshType=" + (isAppend? "AppendData" : "UpdateData") +
                                    "&rdChartCanvasId=" + this.id +
                                    "&rdChartCanvasSeriesId=" + serie.id +
                                    "&rdReport=" + this.reportName;
                    this.refreshTimers.push(this.createRefreshInterval(prms, serie.refreshInterval));
                }
            }
            return ret;
        },

        createRefreshInterval: function (prms, timeout) {
            return setInterval(function () { rdAjaxRequestWithFormVars(prms); }, timeout);
        },

        setRefreshTimerPreviousValue: function () {
            if (!this.chart || !this.chart.series || !this.chart.series.length > 0) {
                return;
            }
            var i = 0, length = this.chart.series.length,
                serie, maxDataValue;
            for (; i < length; i++) {
                var serie = this.chart.series[i];
                if (serie.userOptions && serie.userOptions.visibleTimespan) {
                    maxDataValue = null;
                    if (serie.xData && serie.xData.length > 0) {
                        maxDataValue = serie.xData[serie.xData.length - 1];
                    }
                    if (maxDataValue) {
                        var inputIdForLastValue = serie.userOptions.inputIdForLastValue;
                        if (inputIdForLastValue) {
                            this.getOrCreateInputElement(inputIdForLastValue).setAttribute('value', new Date(maxDataValue).toISOString());
                        }
                    }
                }
            }
        },

        destructor: function () {
            var configNode = this.configNode;
            this._clearHandlers();
            this.chart.destroy();
            configNode.setData(TRIGGER, null);
            if (this.drillInfoBreadcrumb) {
                this.drillInfoBreadcrumb.destroy();
            }
        },

        _clearHandlers: function() {
            var self = this;
            Y.each(this._handlers, function(item) {
                if (item) {
                    //FIXFOR-V9
                    //REPDEV-26489 : JS error while chart destroying
                    item.detach ? item.detach() : eval(item);
                    item = null;
                }
            });

            Y.each(this.refreshTimers, function (item) {
                if (item) {
                    clearTimeout(item);
                }
            });
        },

        _parseHTMLConfig: function() {

            this.configNode = this.get('configNode');
            this.id = this.configNode.getAttribute('id');
            this.reportName = this.configNode.getAttribute('data-report-name');
            this.renderMode = this.configNode.getAttribute('data-render-mode');
            this.jsonUrl = this.configNode.getAttribute('data-json-url');
            this.chartPointer = this.configNode.getAttribute('data-chart-pointer');
            this.refreshAfterResize = this.configNode.getAttribute('data-refresh-after-resize') == "True";
            this.debugUrl = this.configNode.getAttribute('data-debug-url');
            this.isUnderSE = this.configNode.getAttribute('data-under-se');
        },

        initChart: function(chartOptions) {
            //what about resizer?
            if (this.id) {
                var idForResizer = this.id.replace(/_Row[0-9]+$/g, "").replace(/\./g, "\\.");
                if (Y.one('#rdResizerAttrs_' + idForResizer) && rdInitHighChartsResizer) {
                    rdInitHighChartsResizer(this.configNode.getDOMNode());
                }
            }
            //post processing
            if (this.renderMode != "Skeleton") {
                this.createChart(chartOptions);
            } else {
                this.createChart(chartOptions);
                if (!this.chart) {
                    return;
                }
                if (this.id !="rdMigrationGauge") {
                    //FIXFOR-V9, REPDEV-27295: To resolve the loading animation missing issue,
                    //considering url(instead of file paths) to avoid the XSS vulnerabilities,
                    //as we are using AST class to safely parse the markup,
                    //in showLoading function of highcharts(Highcharts JS v9.0.1(2021 - 02 - 15))
                    this.chart.showLoading('<img src="./rdTemplate/rdWait.gif" alt="loading..."></img>');
                }
                this.requestChartData(null, "createChart", true);
            }

        },

        preProcessChartOptions: function (chartOptions) {
            if (chartOptions.series) {
                this.setActions(chartOptions.series);
            }

            if (chartOptions.tooltip) {
                chartOptions.tooltip.formatter = LogiXML.HighchartsFormatters.tooltipFormatter;
            }

            if (!chartOptions.chart.events) {
                chartOptions.chart.events = {};
            }

            if (chartOptions.title && chartOptions.title.text) {
                chartOptions.title.text = LogiXML.decodeHtml(chartOptions.title.text, chartOptions.title.useHTML);
            }
            //REPDEV-27890
            if (chartOptions.caption && chartOptions.caption.text) {
                chartOptions.caption.text = LogiXML.decodeHtml(chartOptions.caption.text, chartOptions.caption.useHTML);
            }

            if (chartOptions.legend && chartOptions.legend.title && chartOptions.legend.title.text) {
                chartOptions.legend.title.text = LogiXML.decodeHtml(chartOptions.legend.title.text, chartOptions.legend.labelFormat == 'HTML');
            }

            if (chartOptions.legend && chartOptions.legend.title && chartOptions.legend.title.text) {
                chartOptions.legend.title.text = LogiXML.decodeHtml(chartOptions.legend.title.text, chartOptions.legend.labelFormat == 'HTML');
            }

            if (chartOptions.subtitle && chartOptions.subtitle.text) {
                chartOptions.subtitle.text = LogiXML.decodeHtml(chartOptions.subtitle.text, chartOptions.subtitle.useHTML);
            }

            if (chartOptions.series && chartOptions.series.length > 0) {
                for (i = 0; i < chartOptions.series.length; i++) {
                    var series = chartOptions.series[i];
                    if (series.name) {
                        series.name = LogiXML.decodeHtml(series.name, true);
                    }
                    var data = series.data;
                    for (var j = 0; data && j < data.length; j++) {
                        if (data[j].name) {
                            if (series.xAxis) {
                                var xAxis;
                                for (var k = 0; k < chartOptions.xAxis.length; k++) {
                                    if (chartOptions.xAxis[k].id == series.xAxis) {
                                        xAxis = chartOptions.xAxis[k];
                                        break;
                                    }
                                }

                                data[j].name = LogiXML.decodeHtml(data[j].name, xAxis && xAxis.labels && xAxis.labels.format === 'HTML');
                            }
                            else {
                                data[j].name = LogiXML.decodeHtml(data[j].name, chartOptions.xAxis[0] && chartOptions.xAxis[0].labels && chartOptions.xAxis[0].labels.format === 'HTML');
                            }
                        }
                    }
                }
            }

            if (chartOptions.series && chartOptions.series.length > 0) {
                for (i = 0; i < chartOptions.series.length; i++) {
                    var series = chartOptions.series[i];
                    if (series.name) {
                        series.name = LogiXML.decodeHtml(series.name);
                    }
                    var data = series.data;
                    for (var j = 0; data && j < data.length; j++) {
                        if (data[j].name) {
                            data[j].name = LogiXML.decodeHtml(data[j].name/*, series.dataLabels && series.dataLabels.format === 'HTML'*/);
                        }
                    }
                }
            }

            if (chartOptions.chart.type = 'gauge' && chartOptions.yAxis && chartOptions.yAxis.length > 0 && chartOptions.yAxis[0].lineColor && chartOptions.yAxis[0].plotBands && chartOptions.yAxis[0].plotBands.length > 0) {
                var newPlotband = {};
                var axis = chartOptions.yAxis[0];
                newPlotband.color = axis.lineColor;
                newPlotband.from = axis.min;
                newPlotband.to = axis.max;
                newPlotband.thickness = axis.lineWidth;
                axis.lineColor = 'transparent';
                axis.plotBands.unshift(newPlotband);
            }

            if (chartOptions.xAxis && chartOptions.xAxis.length > 0) {
                for (var i = 0; i < chartOptions.xAxis.length; i++) {
                    var axis = chartOptions.xAxis[i];
                    if (axis.title && axis.title.text) {
                        axis.title.text = LogiXML.decodeHtml(axis.title.text);
                    }

                    var plotBands = axis.plotBands;
                    if (plotBands){
                        for (var k = 0; k < plotBands.length; k++) {
                            var plotBand = plotBands[k];
                            if (plotBand && plotBand.label && plotBand.label.text) {
                                plotBand.label.text = LogiXML.decodeHtml(plotBand.label.text, plotBand.label.format == 'HTML');
                            }
                        }
                    }

                    var plotLines = axis.plotLines;
                    if (plotLines) {
                        for (k = 0; k < plotLines.length; k++) {
                            var plotLine = plotLines[k];
                            if (plotLine && plotLine.label && plotLine.label.text) {
                                plotLine.label.text = LogiXML.decodeHtml(plotLine.label.text, plotLine.label.format == 'HTML');
                            }
                        }
                    }
                }
            }

            if (chartOptions.yAxis && chartOptions.yAxis.length > 0) {
                for (i = 0; i < chartOptions.yAxis.length; i++) {
                    var axis = chartOptions.yAxis[i];
                    if (axis.title && axis.title.text) {
                        axis.title.text = LogiXML.decodeHtml(axis.title.text);
                    }

                    var plotBands = axis.plotBands;
                    if (plotBands) {
                        for (var k = 0; k < plotBands.length; k++) {
                            var plotBand = plotBands[k];
                            if (plotBand && plotBand.label && plotBand.label.text) {
                                plotBand.label.text = LogiXML.decodeHtml(plotBand.label.text, plotBand.label.format == 'HTML');
                            }
                        }
                    }

                    var plotLines = axis.plotLines;
                    if (plotLines) {
                        for (k = 0; k < plotLines.length; k++) {
                            var plotLine = plotLines[k];
                            if (plotLine && plotLine.label && plotLine.label.text) {
                                plotLine.label.text = LogiXML.decodeHtml(plotLine.label.text, plotLine.label.format == 'HTML');
                            }
                        }
                    }
                }
            }

            if (chartOptions.quicktips && chartOptions.quicktips.length > 0) {
                for (i = 0; i < chartOptions.quicktips.length; i++) {
                    if (chartOptions.quicktips[i].rows && chartOptions.quicktips[i].rows.length > 0) {
                        for (var j = 0; j < chartOptions.quicktips[i].rows.length; j++) {
                            var row = chartOptions.quicktips[i].rows[j];
                            if (row && row.caption) {
                                row.caption = LogiXML.decodeHtml(row.caption, row.format == 'HTML');
                            }
                        }
                    }
                }
            }

            LogiXML.HighchartsFormatters.setFormatters(chartOptions);

            this.preProcessDrillTo(chartOptions);
        },

        postProcessChartOptions: function (chartOptions) {
            if (chartOptions.quicktips) {
                this.setQuicktipsData(chartOptions.quicktips);
            }
            this.disableSelectionForExcludedPoints();
            this.setCursorForAreaSelection();
            this.disableSelectionForExcludedDrillTo();
            //REPDEV-29427, DrillTo should still be processed when preProcessDrillTo if Layout is free-form.
            if (!(LogiXML.Dashboard.pageDashboard && !!LogiXML.Dashboard.pageDashboard.get("bIsFreeformLayout"))) {
                this.postProcessDrillTo(chartOptions);
            }
        },

        createChart: function (chartOptions, fromPostProcessing) {
            this.configNode.fire('beforeCreateChart', { id: this.id, options: chartOptions, chartCanvas: this, chart: this.chart });
            var viewstates;

            if (this.chart) {
                //REPDEV-28953. Sets "chartOptions.chart.width" and "chartOptions.chart.height"
                //The 'createChart' will be called on 'requestChartData's onSuccess, but 'resized' can be called before it (in Ajax' onSuccess)
                //The size in the chartOptions from requestChartData(from Response) may be default, so the size of the chart ('s content) may not resize if the above occurs
                //And because REPDEV-28947, the size would be lost because exception.
                //REPDEV-28953, JUST occurs above situation
                this.chart.options.chart.width && (chartOptions.chart.width = parseInt(this.chart.options.chart.width));
                this.chart.options.chart.height && (chartOptions.chart.height = parseInt(this.chart.options.chart.height));

                viewstates = this.chart.viewstates;
                //FIXFOR-V9 
                //we neither do have renderer to destroy nor DOM node to create (happens if chart is already destroyed)
                if (!this.chart.renderer && !this.configNode.getDOMNode()) {
                    this.chart = null;
                    return;
                }
                this.chart.destroy();
            }

            //width and height by parent?
            var dataWidth = this.configNode.getAttribute('data-width'),
                dataHeight = this.configNode.getAttribute('data-height');
            if (dataWidth > 0 && dataHeight > 0) {
                chartOptions.chart.width = dataWidth;
                chartOptions.chart.height = dataHeight;
                //cleanup old size
                if (fromPostProcessing) {
                    this.configNode.removeAttribute('data-width');
                    this.configNode.removeAttribute('data-height');
                }
            }

            if (!fromPostProcessing) {
                this.fixupAfChartHeight(this.configNode, chartOptions);
            }


            chartOptions.chart.renderTo = this.configNode.getDOMNode();

            this.preProcessChartOptions(chartOptions);

            this.setSelection(chartOptions);

            var shouldSetPrevValue = this.setRefreshTimerInitialDateRange(chartOptions);

            if (chartOptions.chart.options3d) {
                //Fix for Pie chart depth
                if (chartOptions.series) {
                    var containsPie = false;
                    for (var i = 0; i < chartOptions.series.length; i++) {
                        if (chartOptions.series[i].type=='pie') {
                            containsPie = true;
                            break;
                        }
                    }
                    if (containsPie) {
                        if (!chartOptions.plotOptions) {
                            chartOptions.plotOptions = {};
                        }
                        if (!chartOptions.plotOptions.pie) {
                            chartOptions.plotOptions.pie = {};
                        }
                        chartOptions.plotOptions.pie.depth = chartOptions.chart.options3d.depth;
                    }
                }
            }

            chartOptions.isChartCanvas = true;

            //FIXFOR-V9
            //REPDEV-26752 : High chart export architectural change
            LogiXML.ChartCanvas.Highcharts9Adapter.BeforeChartCreate(chartOptions);
            try {
                this.chart = new Highcharts.Chart(chartOptions);
            } catch (err) {
                //We can not get the error info like as runtime Js error with event format, so, we use the 
                //try catch method to get the info. Maybe it is not the best way.
                var eleOut = document.getElementById("rdCodeErrMessage_" + this.id)

                if (eleOut) {
                    var errorCodeMessage = eleOut.innerHTML;
                    if (errorCodeMessage.length > 0) {
                        errorCodeMessage += "&#xD;&#xA;";
                    }
                    this.showChartErrorAndLog("rdHighChartsErrInfo", errorCodeMessage + err.stack);
                } else { //PROTECTION HERE, Note: PhantomJs DOESNOT SUPPORT console.error()  (REPDEV-28878)
                    console.log(err.stack)
                }
                return;
            }

            LogiXML.ChartCanvas.Highcharts9Adapter.AfterChartCreate(this.chart);

            if (shouldSetPrevValue) {
                this.setRefreshTimerPreviousValue();
            }
            
            this.chart.options3d = chartOptions.chart.options3d;

            if (this.chart.options3d) {
                //mouse dragging rotation
                if (!this.chart.options3d.disableDragging) {
                    addRotationMouseEvents(this.chart);
                    if (saveOptions3DState) {
                        saveRotationStateFunc = saveOptions3DState;
                    }
                }
            }

            if (viewstates) {
                this.chart.viewstates = viewstates;
            }

            this.postProcessChartOptions(chartOptions);

            if (chartOptions.autoQuicktip === false) {
                this.chart.autoQuicktip = false;
            }

            if (this.restoreSelectionForSeriesIndex !== null && this.chart.series.length) {
                this.syncSelectedValues(this.chart.series[this.restoreSelectionForSeriesIndex]);
                this.restoreSelectionForSeriesIndex = null;
            }
            if (typeof setChartStateEventHandlers != 'undefined') {
                setChartStateEventHandlers(this.chart);
            }
            if (fromPostProcessing) {
                
                //23988 restore chart viewstates from bookmark
                if (!this.chart.viewstates) {
                    var viewstateElem = document.getElementById('rdBookmarkReqId_' + this.chart.userOptions.id + '_viewstates');
                    if (viewstateElem) {
                        this.chart.viewstates = viewstateElem.innerHTML;
                    }
                }
            }

            //hide or show buttons on chartcanvas
            if (typeof this.chart.container != 'undefined') {

            
            var customButtons = Y.one(this.chart.container).all("*[id^=customButton_]");
            customButtons.each(function (customButton) {
                customButton.setStyle("display", 'none');
            });


            //REPDEV-28281
            var hasDrillToStates = this.drillTo && this.drillTo.drilledToStates && this.drillTo.drilledToStates.length > 0
            if (hasDrillToStates) {
                this.setDrillToStatesToInputElement();
            }

            var drillBackButton = Y.one(this.chart.container).one('#customButton_DrillBack');
            if (drillBackButton) {
                if (hasDrillToStates) {
                    if (LogiXML.features['touch']) {
                        drillBackButton.setStyle('display', '');
                    }
                    drillBackButton.setAttribute("collapsed-button", "False");
                } else {
                    drillBackButton.setAttribute('collapsed-button', 'True');
                }
            }

            var zoomButton = Y.one(this.chart.container).one('#customButton_ResetZoom');
            if (zoomButton) {
                zoomButton.setAttribute("collapsed-button", "True");
            }

            var chartExportButton = Y.one(this.chart.container).one('#customButton_ChartExport');
            if (chartExportButton && LogiXML.features['touch']) {
                chartExportButton.setStyle('display', '');
            }


            if (typeof restoreChartState != 'undefined') {
                restoreChartState(this.chart);
            }

           
            this.chart.chartCanvas = this;

            if (this.chart.angular &&
                this.chart.panes && this.chart.panes.length > 0 &&
                this.chart.options.series.length > 0 && this.chart.options.series[0].events) {
                var dials = Y.one(this.chart.renderTo).all("path");
                var dialOptions = this.chart.panes[0].options;

                if (dialOptions.background && dialOptions.background.length > 0) {
                    var dialBackgroundOptions = dialOptions.background[0];

                    if (dialBackgroundOptions.backgroundColor)
                        dials = dials.filter(function () {
                            return Y.one(this).getAttribute('fill').toLowerCase() == dialBackgroundOptions.backgroundColor.toLowerCase();
                        });
                    if (dialBackgroundOptions.borderColor)
                        dials = dials.filter(function () {
                            return Y.one(this).getAttribute('stroke').toLowerCase() == dialBackgroundOptions.borderColor.toLowerCase();
                        });
                    if (dialBackgroundOptions.borderWidth)
                        dials = dials.filter("[stroke-width='" + dialBackgroundOptions.borderWidth + "']");

                    if (dials && dials._nodes && dials._nodes.length == 1 &&
                        this.chart.series && this.chart.series.length > 0 &&
                        this.chart.series[0].points && this.chart.series[0].points.length > 0) {
                        var chart = this.chart;
                        var dial = dials._nodes[0];

                        //FIXFOR-V9
                        //REPDEV-26534 HC9: Get rid of old HighchartsAdapter
                        (Highcharts.addEvent ? Highcharts : HighchartsAdapter).addEvent(dial, "click", function (event) {
                            chart.hoverPoint = chart.series[0].points[0];
                            Y.one(chart.series[0].group.element).simulate("click", event);
                            chart.hoverPoint = null;
                        });
                        dial.style.cursor = "pointer";
                    }
                }
            }

            }
            //export 
            var wrapperNode = this.configNode.ancestor('.rdBrowserBorn');
            if (wrapperNode) {
                wrapperNode.setAttribute("data-rdBrowserBornReady", "true");
            }
            //REPDEV-30496, because of REPDEV-30277, Move codes for REPDEV-27185 from offline-exporting to here [with little change] (S)
            if ((this.chart.options.title && !this.chart.options.title.text) &&
                !(this.chart.options.exporting && this.chart.options.exporting.chartOptions && this.chart.options.exporting.chartOptions.title && this.chart.options.exporting.chartOptions.title.text)) {
                //REPDEV-27185 changing the id to child panel id to assign correct chart title text to Image Export
                var parentPanel = Y.one(this.chart.renderTo).ancestor('div[id^="rdDashboardPanel-"], div.rd-report-author-element, div[id^="rdDivAgPanelWrap_"]');
                if (parentPanel) {
                    var panelTitle = parentPanel.one('#rdDashboardCaptionID, span[id^="lblVisualizationTitle_"], span[id^="lblHeadingAnalChart_"]');
                    if (panelTitle) {
                        this.chart.options.exporting.chartOptions = this.chart.options.exporting.chartOptions || {};
                        this.chart.options.exporting.chartOptions.title = this.chart.options.exporting.chartOptions.title || this.chart.options.title;
                        this.chart.options.exporting.chartOptions.title.text = panelTitle.get('innerText');
                    }
                }
            }
            //REPDEV-30496(E)
            this.configNode.fire('afterCreateChart', {id: this.id, options: chartOptions, chartCanvas: this, chart: this.chart});
            
        },

        fixupAfChartHeight: function(configNode, chartOptions){
            var dashboardPanel = this.configNode.ancestor('.rdDashboardPanel');
            if (dashboardPanel) {
                var currentHeight = chartOptions.chart.height;
                //REPDEV-22595 - Removed this block of code - it was removing the height for extra elements to fit and chart was cutoff on X axis.
                //var lstElements = ['.rdDashboardFilterCaption', '.rdDashboardGlobalFilterCaption'], elementToExclude;
                //for (var i = 0; i < lstElements.length; i++) {
                //    elementToExclude = dashboardPanel.one(lstElements[i]);
                //    if (elementToExclude && elementToExclude.one('span').get('innerHTML')) {
                //        currentHeight = currentHeight - elementToExclude.get('offsetHeight') - 2;
                //    }
                //}
                if (chartOptions.chart.height != currentHeight) {
                    var wrapper = dashboardPanel.one('.chartfx-wrapper');
                    if (wrapper) {
                        var isResized = wrapper.getAttribute('afResized')
                        if (!isResized) {
                            chartOptions.chart.height = currentHeight;
                            wrapper.set('offsetHeight', currentHeight);
                            wrapper.setAttribute('afResized', true);
                        }
                    }
                }

            }
        },

        requestChartData: function (url, callbackFunctionName, prm1, prm2, prm3) {
            var chartUrl = url ? url : this.jsonUrl;
            if (this.chart && callbackFunctionName != "createChart") {
                chartUrl += "&rdDynamicChartWidth=" + this.chart.chartWidth;
                chartUrl += "&rdDynamicChartHeight=" + this.chart.chartHeight;
            }
            chartUrl += "&guid=" + LogiXML.getGuid();
            if (!callbackFunctionName) {
                callbackFunctionName = "createChart";
            }

            this.configNode.fire('beforeRequestData', { id: this.id, chartCanvas: this, chart: this.chart, dataUrl: chartUrl });
            Y.io(chartUrl, {
                on: {
                    success: function(tx, r) {
                        var parsedResponse = this.parseJson(r.responseText);
                        this.configNode.fire('afterRequestData', { id: this.id, chartCanvas: this, chart: this.chart, options: parsedResponse });
                        if (parsedResponse) {
                            this[callbackFunctionName](parsedResponse, prm1, prm2, prm3);
                        }
                       
                    },
                    failure: function(id, o, a) {
                        //this.showError("ERROR " + id + " " + a);
                        var message = "Response Status:" + o.status + " statusText:" + o.statusText;
                        this.showChartErrorAndLog("rdResponseErrInfo", message);
                    }
                },
                context: this
            });
        },

        parseJson: function(jsonString) {
            var obj;
            try {
                var reportDevPrefix = "rdChart error;";
                var redirectPrefix = "redirect:";
                
                if (jsonString.startsWith(reportDevPrefix)) {
                    this.debugUrl = jsonString.substring(reportDevPrefix.length);
                    if (this.debugUrl && this.debugUrl.startsWith(redirectPrefix)) {
                        this.debugUrl = this.debugUrl.substring(redirectPrefix.length);
                    }
                    //this.showError();
                    this.showChartErrorAndLog("rdServerErrInfo");
                    return;
                }
                if (document.URL && document.URL.indexOf('file:') != -1) {
                    eval("window.tmp=" + jsonString + ";");
                    obj = window.tmp;
                } else {
                    obj = Y.JSON.parse(jsonString);
                }
                if (LogiXML.EventBus && LogiXML.EventBus.ChartCanvasEvents) {
                    LogiXML.EventBus.ChartCanvasEvents().fire('load', { id: this.id, options: obj });
                }
            } catch (e) {
                //this.showError("JSON parse failed: " + jsonString);
                if (jsonString.length == 0) {
                    jsonString = "There isn't any json value";
                }
                this.showChartErrorAndLog("rdParseJsonErrInfo", e.message + '&#xD;&#xA;' + jsonString);
                return;
            }
            return obj;
        },

        setSelection: function(chartOptions) {
            if (!chartOptions.series || chartOptions.series.length == 0) {
                return;
            }
            var series,
                selection,
                i = 0,
                length = chartOptions.series.length,
                self = this;

            if (!chartOptions.chart.events) {
                chartOptions.chart.events = {};
            }
            for (; i < length; i++) {
                series = chartOptions.series[i];
                if (series.selection) {
                    selection = series.selection;
                    
                    //turn on markers for point selection
                    if (selection.mode != "Range") {
                        series.marker.enabled = true;
                    }

                    if (!series.events) {
                        series.events = {};
                    }
                    var cursor;
                    switch (selection.selectionType) {
                        case "ClickSinglePoint":
                        case "ClickMultiplePoints":
                        case "ClickRangePoints":
                            series.allowPointSelect = selection.isReadOnly !== true;
                            series.accumulate = selection.selectionType != "ClickSinglePoint";
                            this.syncSelectedValues(series);
                            if (series.allowPointSelect) {
                                series.events.pointselection = function (e) {
                                    self.pointsSelected(e.target, true, e);
                                    return false;
                                };
                                //FIXFOR-V9
                                //REPDEV-26493 Cannot display input selection value
                                LogiXML.ChartCanvas.Highcharts9Adapter.attachPointSelectEventHandlers();
                                chartOptions.chart.events.click = function (e) {
                                    //REPDEV-20715: prevent selection destroying after clicking on button
                                    var y_tgt = Y.one(e.target);
                                    if (!(y_tgt && y_tgt.ancestor('.highcharts-button'))) {
                                        self.destroySelection(e, true);
                                    }                                    
                                };
                            }
                            break;
                        case "Area":
                        case "AreaXAxis":
                        case "AreaYAxis":
                            if (selection.isReadOnly !== true) {
                                switch (selection.selectionType) {
                                    case "AreaXAxis":
                                        chartOptions.chart.zoomType = "x";
                                        cursor = 'ew-resize';
                                        break;
                                    case "AreaYAxis":
                                        chartOptions.chart.zoomType = "y";
                                        cursor = 'ns-resize';
                                        break;
                                    default:
                                        chartOptions.chart.zoomType = "xy";
                                        cursor = 'crosshair';
                                        break;
                                }

                                series.accumulate = true;

                                chartOptions.chart.events.selection = function (e) {
                                    self.selectionDrawn(e, true);
                                    return false;
                                };
                                chartOptions.chart.events.redraw = function (e) { self.chartRedrawn(e); };
                                chartOptions.chart.events.selectionStarted = function (e) {
                                    e.selectionMarker.attr({ cursor: cursor });
                                    self.chart.plotBackground.element.style.cursor = cursor;
                                    self.destroySelection();
                                };
                            }
                            if (selection.mode == "Point") {
                                this.syncSelectedValues(series, i);
                            } else {
                                this.restoreSelectionForSeriesIndex = i;
                            }
                            chartOptions.chart.customSelection = true;

                            if (!selection.disableClearSelection) {
                                chartOptions.chart.events.click = function (e) {
                                    //REPDEV-20715: prevent selection destroying after clicking on button
                                    var y_tgt = Y.one(e.target);
                                    if (!(y_tgt && y_tgt.ancestor('.highcharts-button'))) {
                                        self.destroySelection(e, true);
                                    }
                                };
                            }

                            break;
                    }
                }
            }
        },
        setCursorForAreaSelection: function () {
            if (!this.chart.series || this.chart.series.length == 0) {
                return;
            }
            var series,
                i = 0,
                length = this.chart.series.length;

            for (; i < length; i++) {
                series = this.chart.series[i];
                if (series.options.selection && series.options.selection.selectionType.indexOf('Area') != -1 && series.options.cursor) {
                    this.chart.plotBackground.element.style.cursor = series.options.cursor;
                    this.plotBackgroundCursor = series.options.cursor;
                }
            }
        },

        disableSelectionForExcludedPoints: function () {
            if (!this.chart.series || this.chart.series.length == 0) {
                return;
            }
            var series,
                selection,
                i = 0,
                length = this.chart.series.length,
                y = 0, yLength = 0;
            
            for (; i < length; i++) {
                series = this.chart.series[i];
                if (series.options.selection && series.options.selection.excludedPointValues && series.options.selection.excludedPointValues.length > 0) {
                    selection = series.options.selection;
                    y = 0; yLength = series.data.length;
                    for (; y < yLength; y++) {
                        if (series.data[y].graphic && selection.excludedPointValues.indexOf(series.data[y].id) != -1) {
                            series.data[y].graphic.attr({
                                cursor: 'default'
                            });
                        }
                    }
                }
            }
        },

        disableSelectionForExcludedDrillTo: function () {
            if (!this.chart.series || this.chart.series.length == 0 || !this.chart.options.drillTo) {
                return;
            }           
            var series,
                selection,
                i = 0,
                length = this.chart.series.length,
                y = 0, yLength = 0;

            for (; i < length; i++) {
                series = this.chart.series[i];
                if (this.chart.options.drillTo.excludedPointValues && this.chart.options.drillTo.excludedPointValues.length > 0) {                
                    
                    y = 0; yLength = series.data.length;
                    for (; y < yLength; y++) {
                        if (series.data[y].graphic && this.chart.options.drillTo.excludedPointValues.indexOf(series.data[y].name ? series.data[y].name : series.data[y].x) != -1) {
                            series.data[y].graphic.attr({
                                cursor: 'default'
                            });
                        }
                    }
                }
            }
        },

        pointsSelected: function (series, fireEvent, e, force) {
            var selection = series.options.selection,
                valueElement, eleDelimited,
                changeFlagElement,
                oldValue,
                newValue, delimitedValue;

            if (!selection) {
                return;
            }
            if (this.disableNestedEvents) {
                return;
            }

            if (selection.excludedPointValues && selection.excludedPointValues.length > 0)
            {
                if (e && selection.excludedPointValues.indexOf(e.id) != -1) {
                    var selected = !e.selected;
                    e.selected = e.options.selected = selected;
                    e.setState(selected && 'select');
                    return;
                }
            }

            if (fireEvent && selection.deffered && !force && e.options) {
                var selected = !e.selected;
                e.selected = e.options.selected = selected;
                e.setState(selected && 'select');
                this.defferedSelectedPoint = e;
                return;
            } else if (fireEvent && selection.deffered && force && this.defferedSelectedPoint) {
                var selected = !this.defferedSelectedPoint.selected;
                this.defferedSelectedPoint.selected = this.defferedSelectedPoint.options.selected = selected;
                this.defferedSelectedPoint.setState(selected && 'select');
            }

            var isTreemap = series.type === 'treemap';
            var values = isTreemap ? {} : [];
            if (isTreemap) {
                this.getSelectedValuesForTreemap(series, values);
                var valuesCount = values.length;

                for (var valuesString in values) {
                    var valuesArray = values[valuesString];
                    valueElement = this.getOrCreateInputElement(valuesString);
                    oldValue = this.getInputElementValue(valueElement);

                    newValue = valuesArray.join(',');

                    if (oldValue != newValue) {
                        this.setInputElementValue(valueElement, newValue);

                        if (LogiXML.rdInputTextDelimiter) {
                            eleDelimited = this.getOrCreateInputElement("rdCSV_" + valuesString)
                            delimitedValue = LogiXML.rdInputTextDelimiter.delimit(valuesArray, ",", '"', "\\");
                            this.setInputElementValue(eleDelimited, delimitedValue);
                        }

                        if (selection.changeFlagElementId && selection.changeFlagElementId.length > 0) {
                            changeFlagElement = this.getOrCreateInputElement(selection.changeFlagElementId);
                            changeFlagElement.set('value', 'True');
                        }

                        if (fireEvent) {
                            //FIXFOR-V9
                            //REPDEV-26534 HC9: Get rid of old HighchartsAdapter
                            (Highcharts.fireEvent ? Highcharts : HighchartsAdapter).fireEvent(series, 'selectionChange', null);

                            //if (selection.selectionType != "ClickSinglePoint" && selection.selectionType != "ClickMultiplePoints") {
                            if (newValue == '') {
                                (Highcharts.fireEvent ? Highcharts : HighchartsAdapter).fireEvent(series, 'selectionCleared', null);
                            } else {
                                (Highcharts.fireEvent ? Highcharts : HighchartsAdapter).fireEvent(series, 'selectionMade', null);
                            }
                            //}
                        }
                    }
                }
            } else {
                this.getSelectedValues(series, values);
                if (selection.valueElementId && selection.valueElementId.length > 0) {
                    valueElement = this.getOrCreateInputElement(selection.valueElementId);
                    oldValue = this.getInputElementValue(valueElement);

                    newValue = values.join(",");

                    var lastPoint = null;
                    if (oldValue != newValue) {
                        this.setInputElementValue(valueElement, newValue);

                        if (LogiXML.rdInputTextDelimiter) {
                            delimitedValue = LogiXML.rdInputTextDelimiter.delimit(values, ",", '"', "\\");
                            eleDelimited = this.getOrCreateInputElement("rdCSV_" + selection.valueElementId);
                            this.setInputElementValue(eleDelimited, delimitedValue);
                        }

                        if (selection.changeFlagElementId && selection.changeFlagElementId.length > 0) {
                            changeFlagElement = this.getOrCreateInputElement(selection.changeFlagElementId);
                            changeFlagElement.set('value', 'True');
                        }
                       
                        var minPoint = values[0];
                        var maxPoint = values[values.length - 1];

                        if (e && selection.selectionType == "ClickRangePoints" && minPoint != maxPoint) {
                            this.disableNestedEvents = true;

                            // deselect points
                            if (!e.selected &&
                                series.points[e.index - 1] && series.points[e.index - 1].selected &&
                                series.points[e.index + 1] && series.points[e.index + 1].selected) {
                                var lastClickedValue = window.LogiXML['chart_' + this.id + '_clickedValue'];
                                if (lastClickedValue) {
                                    lastPoint = this.getPointById(series, lastClickedValue);
                                } 
                                if (!lastPoint) {
                                     lastPoint = this.getPointById(series, maxPoint);
                                }

                                if (lastPoint.index > e.index) {
                                    this.changeSelection(series, minPoint, e.id, true);
                                } else {
                                    this.changeSelection(series, e.id, maxPoint, true);
                                }

                                values = [];
                                this.getSelectedValues(series, values);
                            }

                            // select points between start and end
                            minPoint = values[0];
                            maxPoint = values[values.length - 1];
                            if (minPoint != maxPoint)
                                this.changeSelection(series, minPoint, maxPoint, true);

                            // update actual values
                            values = [];
                            this.getSelectedValues(series, values);

                            newValue = values.join(',');
                            if (LogiXML.rdTextInputDelimiter)
                                delimitedValue = LogiXML.rdInputTextDelimiter.delimit(values, ",", '"', "\\");

                            this.setInputElementValue(valueElement, newValue);

                            if (eleDelimited)
                                this.setInputElementValue(eleDelimited, delimitedValue);

                            this.disableNestedEvents = false;
                        }
                        if (e) {
                            window.LogiXML['chart_' + this.id + '_clickedValue'] = e.id;
                        }

                        if (fireEvent) {
                            //FIXFOR-V9
                            //REPDEV-26534 HC9: Get rid of old HighchartsAdapter
                            (Highcharts.fireEvent ? Highcharts : HighchartsAdapter).fireEvent(series, 'selectionChange', null);
                            if (newValue == '') {
                                (Highcharts.fireEvent ? Highcharts : HighchartsAdapter).fireEvent(series, 'selectionCleared', null);
                            } else {
                                (Highcharts.fireEvent ? Highcharts : HighchartsAdapter).fireEvent(series, 'selectionMade', null);
                            }
                        }

                    }
                }
            }
        },

        pointSelectedDeffered: function (series) {

        },

        getPointById: function (series, id) {
            for (var i = 0; i < series.points.length; i++) {
                if (series.points[i].id == id)
                    return series.points[i];
            }

            return null;
        },

        changeSelection: function (series, minPoint, maxPoint) {
            var select = false;
            for (var i = 0; i < series.points.length; i++) {
                var point = series.points[i];
                if (point.id == minPoint) {
                    select = true;
                }
                point.selected = select;
                point.setState(select && 'select');

                if (point.id == maxPoint) {
                    select = false;
                }
            }
        },

        getSelectedValues: function (series, values) {
            var point, idx, value, i,
                length = series.points.length,
                selection = series.options.selection,
                excludedPointValues = [];

            if (selection && selection.excludedPointValues && selection.excludedPointValues.length > 0) {
                excludedPointValues = selection.excludedPointValues;
            }

            for (i = 0; i < length; i++) {
                point = series.points[i];
                if (point.selected) {
                    value = point.id || '';
                    idx = values.indexOf(value);
                    if (idx == -1 && excludedPointValues.indexOf(value) == -1) {
                        values.push(value);
                    }
                }
            }
        },

        getSelectedValuesForTreemap: function (series, values) {
            var point, i, level = 0,
                length = series.points.length;
            for (i = 0; i < length; i++) {
                point = series.points[i];
                this.getSelectedValuesForTreemapPoint(point, values);
            }
        },

        getSelectedValuesForTreemapPoint: function (point, values) {
            var idx, value;
            for (var j = 0; j < point.children.length; j++) {
                this.getSelectedValuesForTreemapPoint(point.children[j], values);
            }
            if (point.selectable) {
                if (point.selected) {
                    value = point.id || '';
                    idx = values[point.selectionId];
                    if (idx === undefined || values[point.selectionId][0] === '') {
                        values[point.selectionId] = [value];
                    } else {
                        values[point.selectionId].push(value);
                    }
                } else if (!values[point.selectionId] || !values[point.selectionId].length) {
                    values[point.selectionId] = [''];
                }
            }
        },

        rangeSelected: function (series, xMin, xMax, yMin, yMax, rect, fireEvent) {
            var point,
                i = 0, length = series.points.length,
                selection = series.options.selection,
                valueElement,
                pointValue,
                excludedPointValues = [];

            if (!selection) {
                return;
            }

            if (selection.mode == 'Point') {
                if (selection && selection.excludedPointValues && selection.excludedPointValues.length > 0) {
                    excludedPointValues = selection.excludedPointValues;
                }

                for (; i < length; i++) {
                    point = series.points[i];

                    if ((selection.selectionType == "AreaXAxis" && point.x >= xMin && point.x <= xMax) ||
                        (selection.selectionType == "AreaYAxis" && point.y >= yMin && point.y <= yMax) ||
                        (point.x >= xMin && point.x <= xMax && point.y >= yMin && point.y <= yMax)) {

                        pointValue = point.id || '';
                        if (excludedPointValues.indexOf(pointValue) == -1) {
                            point.selected = true;
                            point.setState(true && 'select');
                        } 
                    } else {
                        point.selected = false;
                        point.setState(false && 'select');
                    }
                }

                this.pointsSelected(series, fireEvent);
                return;
            }

            if (series.xAxis.isDatetimeAxis) {
                xMin = xMin == null ? '' : LogiXML.Formatter.formatDate(xMin, 'U');
                xMax = xMax == null ? '' : LogiXML.Formatter.formatDate(xMax, 'U');
            } else if (series.xAxis.categories && series.xAxis.names.length > 0) {
                if (xMin !== null) {
                    xMin = Math.max(0, Math.round(xMin));
                    if (series.xAxis.names.length > xMin) {
                        xMin = series.xAxis.names[xMin];
                    }
                }
                if (xMax !== null) {
                    xMax = Math.min(series.xAxis.names.length - 1, Math.round(xMax));
                    if (series.xAxis.names.length > xMax) {
                        xMax = series.xAxis.names[xMax];
                    }
                }
            } else if (xMin != null && xMax != null) {
                //Round the value to the nearest 3 significant digits
                xMin = parseFloat(xMin.toPrecision(3));
                xMax = parseFloat(xMax.toPrecision(3));
            }

            if (series.yAxis.isDatetimeAxis) {
                yMin = yMin == null ? '' : LogiXML.Formatter.formatDate(yMin, 'U');
                yMax = yMax == null ? '' : LogiXML.Formatter.formatDate(yMax, 'U');
            } else if (series.yAxis.categories && series.yAxis.names.length > 0) {
                if (yMin !== null) {
                    yMin = Math.max(0, Math.round(yMin));
                    if (series.yAxis.names.length > yMin) {
                        yMin = series.yAxis.names[yMin];
                    }
                }
                if (yMax !== null) {
                    yMax = Math.min(series.yAxis.names.length - 1, Math.round(yMax));
                    if (series.yAxis.names.length > yMax) {
                        yMax = series.yAxis.names[yMax];
                    }
                }
            } else if (yMin != null && yMax != null) {
                //Round the value to the nearest 3 significant digits
                yMin = parseFloat(yMin.toPrecision(3));
                yMax = parseFloat(yMax.toPrecision(3));
            }

            if (xMin === null) {
                xMin = '';
            }
            if (xMax === null) {
                xMax = '';
            }
            if (yMin === null) {
                yMin = '';
            }
            if (yMax === null) {
                yMax = '';
            }

            //range selection 
            if (selection.changeFlagElementId && selection.changeFlagElementId.length > 0) {
                valueElement = this.getOrCreateInputElement(selection.changeFlagElementId);
                valueElement.set('value', 'True');
            }

            if (fireEvent) {
                if (selection.minXElementId && selection.minXElementId.length > 0) {
                    valueElement = this.getOrCreateInputElement(selection.minXElementId);
                    valueElement.set('value', xMin);
                }
                if (selection.maxXElementId && selection.maxXElementId.length > 0) {
                    valueElement = this.getOrCreateInputElement(selection.maxXElementId);
                    valueElement.set('value', xMax);
                }

                if (selection.minYElementId && selection.minYElementId.length > 0) {
                    valueElement = this.getOrCreateInputElement(selection.minYElementId);
                    valueElement.set('value', yMin);
                }

                if (selection.maxYElementId && selection.maxYElementId.length > 0) {
                    valueElement = this.getOrCreateInputElement(selection.maxYElementId);
                    valueElement.set('value', yMax);
                }
                var eventArgs = {
                    rect: rect,
                    xMin: xMin,
                    xMax: xMax,
                    yMin: yMin,
                    yMax: yMax
                };
                //FIXFOR-V9
                //REPDEV-26534 HC9: Get rid of old HighchartsAdapter
                (Highcharts.fireEvent ? Highcharts : HighchartsAdapter).fireEvent(series, 'selectionChange', eventArgs);
                (Highcharts.fireEvent ? Highcharts : HighchartsAdapter).fireEvent(series, 'selectionMade', eventArgs);
            }
        },

        getOrCreateInputElement: function (id) {
            var inputElement = Y.one("input[name='" + id + "'],select[name='" + id + "']");
            if (inputElement === null) {
                inputElement = Y.Node.create('<input type="hidden" name="' + id + '" id="' + id + '" />');
                this.configNode.ancestor().appendChild(inputElement);
            }
            return inputElement;
        },

        setDrillToStatesToInputElement: function () {
            var inpName = this.id + "_drillTo";
            var inp = this.getOrCreateInputElement(inpName);
            inp.set('value', JSON.stringify(this.drillTo.drilledToStates));
        },

        getInputElementValue: function (inputElement) {
            var inputElementType = inputElement.getAttribute('type'),
                selectedValues = [];
            switch (inputElementType) {
                case "checkbox":
                case "radio":
                    Y.all("input[name='" + inputElement.getAttribute('name') + "']").each(function (inputNode) {
                        if (inputNode.get('checked')) {
                            selectedValues.push(inputNode.get('value'));
                        }
                    });

                    if (LogiXML.rdInputTextDelimiter)
                        return LogiXML.rdInputTextDelimiter.delimit(selectedValues, ",", '"', "\\");

                    return selectedValues.join(',');
                    break;
                default:
                    if (inputElement.get('nodeName').toLowerCase() == "select") {
                        inputElement.all('option').each(function (inputNode) {
                            if (inputNode.get('selected')) {
                                selectedValues.push(inputNode.get('value'));
                            }
                        });

                        if (LogiXML.rdInputTextDelimiter)
                            return LogiXML.rdInputTextDelimiter.delimit(selectedValues, ",", '"', "\\");

                        return selectedValues.join(',');
                    } else {
                        return inputElement.get('value');
                    }
                    break;
            }
            return "";
        },

        setInputElementValue: function (inputElement, value) {
            var inputElementType = inputElement.getAttribute('type');
            var selectedValues;
            
            if (LogiXML.rdInputTextDelimiter)
                selectedValues = LogiXML.rdInputTextDelimiter.getEntries(value, ",", '"', "\\", false);
            else
                selectedValues = value.split(',');

            switch (inputElementType) {
                case "checkbox":
                case "radio":
                    Y.all("input[name='" + inputElement.getAttribute('name') + "']").each(function (inputNode) {
                        if (selectedValues.indexOf(inputNode.get('value')) != -1) {
                            inputNode.set('checked', true);
                        } else {
                            inputNode.set('checked', false);
                        }
                    });
                    break;
                default:
                    if (inputElement.get('nodeName').toLowerCase() == "select") {
                        inputElement.all('option').each(function (inputNode) {
                            if (selectedValues.indexOf(inputNode.get('value')) != -1) {
                                inputNode.set('selected', true);
                            } else {
                                inputNode.set('selected', false);
                            }
                        });
                    } else {
                        return inputElement.set('value', value);
                    }
                    break;
            }
            return "";
        },
        
        destroySelection: function (e, fireEvent) {
            var i = 0, y = 0,
                length = this.chart.series.length, dataLength,
                point, series, selection, wasSelected = false, notClearSelection = false;

            if (this.rangeSelection) { 
                wasSelected = true;
            }
            //clear selected points
            for (; i < length; i++) {
                series = this.chart.series[i];
                selection = series.options.selection;

                if (!selection) {
                    continue;
                }
                switch (selection.mode) {
                    case 'Range':
                        if (!notClearSelection && series.options.selection.disableClearSelection === true) {
                            notClearSelection = true;
                        }
                        if (!notClearSelection) {
                            if (wasSelected && fireEvent) {
                                this.rangeSelected(series, null, null, null, null, null, fireEvent);
                                //FIXFOR-V9
                                //REPDEV-26534 HC9: Get rid of old HighchartsAdapter
                                (Highcharts.fireEvent ? Highcharts : HighchartsAdapter).fireEvent(series, 'selectionCleared', null);
                            }
                        }
                        break;

                    default:
                        if (fireEvent) {
                            y = 0; dataLength = series.points.length;
                            for (; y < dataLength; y++) {
                                point = series.points[y];
                                if (point.selected) {
                                    point.selected = false;
                                    point.setState(false && 'select');
                                }
                            }
                            this.pointsSelected(series, fireEvent, e);
                        }
                        break;
                }
            }

            if (wasSelected && !notClearSelection) {
                this.rangeSelection.destroy();
                this.rangeSelection = null;
            }
        },

        selectionDrawn: function (e, fireEvent, skipCreateRange) {
            var self = this,
                zoomType = this.chart.options.chart.zoomType;
            if (this.chart.inverted) {
                zoomType = zoomType == 'x' ? 'y' : zoomType == 'y' ? 'x' : zoomType;
            }
            //FIXFOR-V9
            //REPDEV-26706 click global filter, throw error
            var rect = e.selectionBox;
            if (!skipCreateRange) {
                this.chart.plotBackground.element.style.cursor = this.plotBackgroundCursor;
                //FIXFOR-V9
                //REPDEV-26471 : LOGIFIX21559_ChartCanvas-Input Selection Range: Action Referesh element causing JS error"Cannot read property 'x' of undefined"
                //FIXFOR-V9
                //REPDEV-26810 Highcharts v9-Zoom line chart in Dashboard throw error"Uncaught TypeError: Cannot read property 'min' of undefined"
                //REPDEV-26811 Highcharts v9-Zoom scatter chart in Dashboard throw errorchart"Uncaught TypeError: Cannot read property '0' of undefined"
                //REPDEV-26809 HighChart v9.x: In Dashboard, select line area on line chart, no filter action applied.
                rect = rect || LogiXML.ChartCanvas.Highcharts9Adapter.getSelectionRange(this.chart, e);
                this.rangeSelection = new Y.LogiXML.ChartCanvasRangeSelection(
                {
                    callback: function (rect) { self.selectionChanged(rect, true) },
                    configNode: this.configNode,
                    maskRect: rect,
                    constrainRect: this.chart.plotBox,
                    maskType: zoomType,
                    fillColor: this.chart.options.chart.selectionMarkerFill || 'rgba(69,114,167,0.25)',
                    isReadOnly: e.isReadOnly
                });
            }
            this.selectionChanged(rect, fireEvent);
            return false;
        },

        chartRedrawn: function (e) {

            var chart = e.target,
                oldWidth = chart.oldChartWidth,
                oldHeight = chart.oldChartHeight,
                chartHeight = chart.chartHeight,
                chartWidth = chart.chartWidth,
                diffWidth, diffHeight;

            var zoomType = chart.options.chart.zoomType,
                i = 0, length = chart.series.length, series, selection;

            if (oldWidth && oldWidth != chartWidth) {
                diffWidth = chartWidth - oldWidth;
            }
            if (oldHeight && oldHeight != chartHeight) {
                diffHeight = chartHeight - oldHeight;
            }

            //reset selection
            if (zoomType && this.rangeSelection && (diffWidth || diffHeight)) {
                for (; i < length; i++) {
                    series = this.chart.series[i];
                    selection = series.options.selection;

                    if (!selection) {
                        continue;
                    }

                    if (selection.mode == 'Range') {
                        this.syncSelectedValues(series);
                    } else if (selection.mode == 'Point' &&
                        (selection.selectionType == "ClickSinglePoint" || selection.selectionType == "ClickMultiplePoints" || selection.selectionType == "ClickRangePoints") && this.rangeSelection) {
                        this.destroySelection();
                    }
                }
            }
        },

        selectionChanged: function (rect, fireEvent) {
            var xMin, xMax, yMin, yMax,
                i = 0, y = 0,
                length = this.chart.series.length, dataLength,
                point, series, selection, valueElement;

            for (; i < length; i++) {
                series = this.chart.series[i];
                selection = series.options.selection;

                if (!selection || (selection.selectionType == "ClickSinglePoint" || selection.selectionType == "ClickMultiplePoints")) {
                    continue;
                }

                //turn off zoom if DisableClearSelection
                if (selection.disableClearSelection) {
                    this.chart.pointer.zoomX = false;
                    this.chart.pointer.zoomY = false;
                }

                //TODO: check if series has x/y axis
                if (this.chart.inverted) {
                    switch (selection.selectionType) {
                        case 'AreaXAxis':
                            xMin = series.xAxis.toValue(rect.y + rect.height);
                            xMax = series.xAxis.toValue(rect.y);
                            yMin = null;
                            yMax = null;
                            break;
                        case 'AreaYAxis':
                            xMin = null;
                            xMax = null;
                            yMin = series.yAxis.toValue(rect.x);
                            yMax = series.yAxis.toValue(rect.x + rect.width);
                            break;
                        default:
                            xMin = series.xAxis.toValue(rect.y + rect.height);
                            xMax = series.xAxis.toValue(rect.y);
                            yMin = series.yAxis.toValue(rect.x);
                            yMax = series.yAxis.toValue(rect.x + rect.width);
                    }
                } else {
                    switch (selection.selectionType) {
                        case 'AreaXAxis':
                            xMin = series.xAxis.toValue(rect.x);
                            xMax = series.xAxis.toValue(rect.x + rect.width);
                            yMin = null;
                            yMax = null;
                            break;
                        case 'AreaYAxis':
                            xMin = null;
                            xMax = null;
                            yMin = series.yAxis.toValue(rect.y + rect.height);
                            yMax = series.yAxis.toValue(rect.y);
                            break;
                        default:
                            xMin = series.xAxis.toValue(rect.x);
                            xMax = series.xAxis.toValue(rect.x + rect.width);
                            yMin = series.yAxis.toValue(rect.y + rect.height);
                            yMax = series.yAxis.toValue(rect.y);
                    }
                }
                this.rangeSelected(series, xMin, xMax, yMin, yMax, rect, fireEvent);
            }
        },

        syncSelectedValues: function (series, seriesIndex) {
            var selection = series.options ? series.options.selection : series.selection,
                valueElement, eleDelimited, value, values, id,
                i = 0, length, minX, maxX, minY, maxY, selectionBox, 
                minPointValueElement, maxPointValueElement,
                minPointValue, maxPointValue;
            if (!selection) {
                return;
            }
            if (selection.mode == 'Point') {
                if (!selection.valueElementId || selection.valueElementId.length == 0) {
                    return;
                }

                valueElement = this.getOrCreateInputElement(selection.valueElementId);
                if (!valueElement) {
                    return;
                }

                value = this.getInputElementValue(valueElement);
                if (!value || value.length == 0) {
                    return;
                }

                if (LogiXML.rdInputTextDelimiter) {
                    eleDelimited = this.getOrCreateInputElement("rdCSV_" + selection.valueElementId);
                    delimitedValue = this.getInputElementValue(eleDelimited);
                    //When open an existing chart,the rdCSV hidden element was not built.
                    if (!delimitedValue) {
                        delimitedValue = value;
                    }
                    values = LogiXML.rdInputTextDelimiter.getEntries(delimitedValue, ",", '"', "\\", false);
                }
                else
                    values = value.split(',');

                switch (selection.selectionType) {
                    case "ClickSinglePoint":
                    case "ClickMultiplePoints":
                        length = series.data ? series.data.length : 0;
                        i = 0;
                        for (; i < length; i++) {
                            id = series.data[i].id;
                            if (values.indexOf(id) != -1) {
                                series.data[i].selected = true;
                                if (series.type == "pie") {
                                    series.data[i].sliced = true;
                                }
                            }
                        }
                        break;

                    case "ClickRangePoints":
                        if (values.length > 0) {
                            minX = values[0];
                            maxX = values[values.length - 1];
                            if (minX && minX != '' && maxX && maxX != '') {
                                if (!series.xAxis) {
                                    //chart is not created yes, so we can't restore selection
                                    //lets re-run it when chart created
                                    this.restoreSelectionForSeriesIndex = i;
                                    return;
                                }
                                selectionBox = this.getSelectionBox(series, minX, maxX, null, null);
                            }
                            this.selectionDrawn({ selectionBox: selectionBox, isReadOnly: selection.isReadOnly }, false, true);
                        }
                        break;

                    case "Area":
                    case "AreaXAxis":
                    case "AreaYAxis":
                        if (values.length > 0) {
                            minX = values[0];
                            maxX = values[values.length - 1];
                            if (minX && minX != '' && maxX && maxX != '') {
                                if (!series.xAxis) {
                                    //chart is not created yes, so we can't restore selection
                                    //lets re-run it when chart created
                                    this.restoreSelectionForSeriesIndex = i;
                                    return;
                                }
                                selectionBox = this.getSelectionBox(series, minX, maxX, null, null);
                            }
                            this.selectionDrawn({ selectionBox: selectionBox, isReadOnly: selection.isReadOnly }, false);
                        }
                        break;
                }
            }

            if (selection.mode == 'Range') {
                if (selection.RestoreSelection) {
                    if (selection.SelectedValues[0]) {
                        minX = selection.SelectedValues[0];
                    }
                    if (selection.SelectedValues[1]) {
                        minY = selection.SelectedValues[1];
                    }
                    if (selection.SelectedValues[2]) {
                        maxX = selection.SelectedValues[2];
                    }
                    if (selection.SelectedValues[3]) {
                        maxY = selection.SelectedValues[3];
                    }
                    selectionBox = this.getSelectionBox(series, minX, maxX, minY, maxY);
                    series.chart.renderer.rect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height, 5).attr({ fill: this.chart.options.chart.selectionMarkerFill || 'rgba(69,114,167,0.25)' }).add();
                } else {
                    if (selection.minXElementId && selection.minXElementId.length > 0) {
                        valueElement = this.getOrCreateInputElement(selection.minXElementId);
                        minX = valueElement.get('value');
                    }
                    if (selection.maxXElementId && selection.maxXElementId.length > 0) {
                        valueElement = this.getOrCreateInputElement(selection.maxXElementId);
                        maxX = valueElement.get('value');
                    }
                    //}

                    //if (selection.maskType == 'y' || selection.maskType == 'xy') {
                    if (selection.minYElementId && selection.minYElementId.length > 0) {
                        valueElement = this.getOrCreateInputElement(selection.minYElementId);
                        minY = valueElement.get('value');
                    }

                    if (selection.maxYElementId && selection.maxYElementId.length > 0) {
                        valueElement = this.getOrCreateInputElement(selection.maxYElementId);
                        maxY = valueElement.get('value');
                    }
                    if (selection.mode == 'Range' && selection.selectionType == 'Area' && ((!minX || minX == "") || (!minY || minY == "") || (!maxX || maxX == "") || (!maxY || maxY == ""))) {
                        return;
                    }

                    if ((minX && minX != "") || (minY && minY != "")) {
                        selectionBox = this.getSelectionBox(series, minX, maxX, minY, maxY);
                        if (this.rangeSelection) {
                            this.destroySelection();
                        }
                        this.selectionDrawn({ selectionBox: selectionBox, isReadOnly: selection.isReadOnly }, false);
                    }
                }
            }
        },

        checkDateStringForTimeZone: function (sDate) {
		    if (sDate && sDate.length == 19 && sDate.indexOf('Z') == -1) {
		        sDate = sDate + 'Z'
		    }
		    return sDate;
        },

        getSelectionBox: function(series, minX, maxX, minY, maxY) {
            var selectionBox = {},
                x1, x2, y1, y2, dt, tmp;
            if (series.xAxis.isDatetimeAxis) {
                minX = minX && minX != "" ? new Date(this.checkDateStringForTimeZone(minX)) : null;
                maxX = maxX && maxX != "" ? new Date(this.checkDateStringForTimeZone(maxX)) : null;
            } else if (series.xAxis.categories === true) {
                minX = series.xAxis.names.indexOf(minX);
                minX = minX == -1 ? null : minX;

                maxX = series.xAxis.names.indexOf(maxX);
                maxX = maxX == -1 ? null : maxX;
            }
            if (series.yAxis.isDatetimeAxis) {
                minY = minY && minY != "" ? new Date(minY) : null;
                maxY = maxY && maxY != "" ? new Date(maxY) : null;
            } else if (series.yAxis.categories === true) {
                minY = series.yAxis.names.indexOf(minY);
                minY = minY == -1 ? null : minY;

                maxY = series.yAxis.names.indexOf(maxY);
                maxY = maxY == -1 ? null : maxY;
            }

            x1 = series.xAxis.toPixels(minX != null && minX.toString() != "" ? minX : series.xAxis.getExtremes().min);
            x2 = series.xAxis.toPixels(maxX != null && maxX.toString() != "" ? maxX : series.xAxis.getExtremes().max);
            y1 = series.yAxis.toPixels(minY != null && minY.toString() != "" ? minY : series.yAxis.getExtremes().min);
            y2 = series.yAxis.toPixels(maxY != null && maxY.toString() != "" ? maxY : series.yAxis.getExtremes().max);

            if (series.chart.inverted) {
                if (isNaN(x1) || x1 > series.xAxis.toPixels(series.xAxis.getExtremes().min)) {
                    x1 = series.xAxis.toPixels(series.xAxis.getExtremes().min);
                }
                if (isNaN(x2) || x2 < series.xAxis.toPixels(series.xAxis.getExtremes().max)) {
                    x2 = series.xAxis.toPixels(series.xAxis.getExtremes().max);
                }
                if (isNaN(y1) || y1 < series.yAxis.toPixels(series.yAxis.getExtremes().min)) {
                    y1 = series.yAxis.toPixels(series.yAxis.getExtremes().min);
                }
                if (isNaN(y2) || y2 > series.yAxis.toPixels(series.yAxis.getExtremes().max)) {
                    y2 = series.yAxis.toPixels(series.yAxis.getExtremes().max);
                }
            }
            else {
                if (isNaN(x1) || x1 < series.xAxis.toPixels(series.xAxis.getExtremes().min)) {
                    x1 = series.xAxis.toPixels(series.xAxis.getExtremes().min);
                }
                if (isNaN(x2) || x2 > series.xAxis.toPixels(series.xAxis.getExtremes().max)) {
                    x2 = series.xAxis.toPixels(series.xAxis.getExtremes().max);
                }
                if (isNaN(y1) || y1 > series.yAxis.toPixels(series.yAxis.getExtremes().min)) {
                    y1 = series.yAxis.toPixels(series.yAxis.getExtremes().min);
                }
                if (isNaN(y2) || y2 < series.yAxis.toPixels(series.yAxis.getExtremes().max)) {
                    y2 = series.yAxis.toPixels(series.yAxis.getExtremes().max);
                }
            }

            

            if (this.chart.inverted) {
                selectionBox.x = y1;
                selectionBox.width = y2 - selectionBox.x;
                selectionBox.y = x2;
                selectionBox.height = x1 - selectionBox.y;
            } else {
                selectionBox.x = x1;
                selectionBox.width = x2 - selectionBox.x;
                selectionBox.y = y2;
                selectionBox.height = y1 - selectionBox.y;
            }

            return selectionBox;
        },

        setQuicktipsData: function (quicktips) {
            if (!quicktips && quicktips.length == 0) {
                return;
            }
            //REPDEV-27077, adding filter throw error
            if (!this.chart.series || this.chart.series.length <=0) return;

            var i = 0, length = quicktips.length;
            for (var i = 0; i < length; i++) {
                if (quicktips[i].index < this.chart.series.length) this.chart.series[quicktips[i].index].quicktip = quicktips[i];
            }
        },

        setActions: function(series) {
            var i = 0,
                length = series.length,
                options;

            for (; i < length; i++) {
                options = series[i];
                if (options.events) {
                    for (var event in options.events) {
                        if (Lang.isString(options.events[event])) {
                            options.events[event] = function (e) {
                                // REPDEV-23729
                                // if this is a click event, then the valueElement hasn't been set yet,
                                // because pointsSelected hasn't been triggered yet,
                                // but it will be set before this call stack has completed.
                                // Therefore setting a timeout will ensure that the report defined click event
                                // will not be triggered until after the value has been set.
                                if (e.type == "click")
                                    setTimeout(this.fun, 10, e);
                                else
                                    this.fun(e);
                            }.bind({
                                fun: new Function('e', options.events[event])
                            });
                        }
                    }
                }
            }
        },

        updateChartOptions: function(response,callback,arg){
            this.chart.userOptions = response;
            this[callback](arg);

        },

        resized: function (e) {
            if (this.chart && this.chart.options) {
                //25753 if series undefined, try to request chart data from server
                if (!this.chart.userOptions.series) {
                    this.requestChartData(null, "updateChartOptions", "resized", e);
                }
                else {
                    var heightOnly = e.width == null;
                    var widthOnly = e.height == null;
                    //REPDEV-28947. Adds "hasHeries = (this.chart.userOptions.series.length > 0)"
                    //To Fix REPDEV-27536: the series in chartOptions gets from this.extractOptionsFromHtmlNode(this.configNode) on 'initializer' is changed fron nothing to "series:[]"
                    //and in REPDEV-28947's steps, 'resized'(this API) will be called on Ajax's OnSuccess (before requestChartData's onSuccess), so throw exception
                    //Maybe if hasHeries is false should jump to requestChartData(null, "update ChartOptions", "resized", e) , but for REPDEV-28947 it's not necessary
                    var hasHeries = (this.chart.userOptions.series.length > 0)
                    var width = e.width > 0 ? e.width : this.chart.chartWidth,
                        height = e.height > 0 ? e.height : this.chart.chartHeight;
                    var isGauge = hasHeries && this.chart.userOptions.series[0].type.indexOf("gauge") > -1 && this.chart.userOptions.series[0].type !== "numbergauge";
                    if (hasHeries && this.chart.userOptions.series[0].type.indexOf("bulletgauge") > -1) {
                        this.chart.animation = !this.chart.animation;
                    }

                    width = parseInt(width, 10); //25355
                    height = parseInt(height, 10);

                    if (heightOnly) {
                        this.chart.options.chart.height = height;
                        this.chart.reflow();
                    } else {
                        this.chart.setSize(width, height);
                    }

                    if (e.finished) {
                        if (isGauge) {
                            this.chart.animation = true;
                            var tempUserOptions = this.chart.userOptions;
                            tempUserOptions.chart.width = !heightOnly ? width : null;
                            tempUserOptions.chart.height = height;
                            //tempUserOptions.chart.animation = null;
                            this.createChart(tempUserOptions);

                            if (!this.chart.angular) {
                                if (heightOnly) {
                                    this.chart.options.chart.height = height;
                                    this.chart.reflow();
                                } else {
                                    this.chart.setSize(width, height);
                                }
                            }
                        }
                        var requestUrl = null;
                        if (this.refreshAfterResize == true) {
                            this.requestChartData(this.jsonUrl + '&rdResizerNewWidth=' + width + '&rdResizerNewHeight=' + height + "&rdResizer=True", "createChart");
                            //return;
                            requestUrl = 'rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SetElementSize&rdWidth=' + width + '&rdHeight=' + height + '&rdElementId=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
                        } else if (this.refreshAfterResize) {
                            this.reflowDrillInfoBreadcrumb();
                            requestUrl = 'rdAjaxCommand=RefreshElement&rdRefreshElementID=' + this.id + '&rdWidth=' + width + '&rdHeight=' + height + '&rdReport=' + this.reportName + '&rdResizeRequest=True&rdRequestForwarding=Form';
                        } else if (e.notify === undefined || (e.notify == true)) {
                            this.reflowDrillInfoBreadcrumb();
                            requestUrl = 'rdAjaxCommand=rdAjaxNotify&rdNotifyCommand=SetElementSize&rdWidth=' + width + '&rdHeight=' + height + '&rdElementId=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
                        }
                        if (requestUrl !== null) {
                            if (this.isUnderSE === "True") {
                                requestUrl += "&rdUnderSuperElement=True";
                            }

                            if (document.getElementById("rdFreeformLayout")) {
                                requestUrl += "&rdFreeformLayout=True";
                                console.log("width: " + width);
                                console.log("height: " + height);
                            }
                            rdAjaxRequest(requestUrl);
                        }
                    }
                }
            }
        },

        showChartErrorAndLog: function (sErrorInfoId, details) {
            if (this.chart) {
                this.chart.destroy();
            }
            var errorContainer = document.getElementById("rdCcError_" + this.id);
            errorContainer.style.display = "";
            var eleErrInfoLoc = errorContainer.querySelector("#rdErrorInfoLoc");
            eleErrInfoLoc.innerHTML = errorContainer.querySelector("#"+sErrorInfoId).innerHTML;
            var eleDetails = errorContainer.querySelector('#rdCcErrDetail');
            if (details) {
                eleDetails.innerHTML = details;
            } else {
                var eleDetailContainer = errorContainer.querySelector('#rdCcErrDetailContainer_' + this.id);
                var aLink = document.createElement("A");
                aLink.href = this.debugUrl;
                aLink.target = "_blank";
                aLink.appendChild(eleDetails);
                eleDetailContainer.appendChild(aLink);
            }
            var domNode = this.configNode.getDOMNode();
            domNode.innerHTML = "";//remove the content produced by Highcharts
            this.configNode.append(errorContainer);
        },

        //showError: function (message) {
        //    if (this.chart) {
        //        this.chart.destroy();
        //    }
        //    if (!message && this.debugUrl == "") {
                
        //        message = "<img src='rdTemplate/rdChartError.gif'>";
        //    }
        //    if (message) {
        //        var errorContainer = Y.Node.create("<span style='color:red'></span>");
        //        errorContainer.setHTML(message);
        //        this.configNode.append(errorContainer);
        //    } else {
        //        var aLink, imgError;
        //        aLink = document.createElement("A")
        //        aLink.href = this.debugUrl
        //        //Make a new IMG inside of the anchor that points to the error GIF.
        //        imgError = document.createElement("IMG")
        //        imgError.src = "rdTemplate/rdChartError.gif"

        //        aLink.appendChild(imgError)
        //        this.configNode.append(aLink);
        //    }
        //},

        preProcessDrillTo: function (chartOptions) {
            if (!chartOptions.drillTo) {
                return;
            }
            this.drillTo = chartOptions.drillTo;

            //show drillup button
            //if (this.drillTo.drilledToStates && this.drillTo.drilledToStates.length > 0) {
            //    this.chart.showdrillUpButton();
            //    //chartOptions.exporting.buttons.drillupButton.enabled = true;
            //    //if (!chartOptions.exporting.buttons.drillupButton.onclick) {
            //    //    chartOptions.exporting.buttons.drillupButton.onclick = function () { this.chartCanvas.drillupClick() };
            //    //}
            //} else {
            //    //chartOptions.exporting.buttons.drillupButton.enabled = false;
            //}

            //hide columns in use
            var columnsInUse = [];
            var i;
            if (this.drillTo.usedColumnIndexes.length > 0) {
                for (i = 0; i < this.drillTo.usedColumnIndexes.length; i++) {
                    if (this.drillTo.usedColumnIndexes[i] == -1) {
                        continue;
                    }
                    if (i == 0) {
                        this.addDateGroupingIntoDrilledColumn(this.drillTo.drillToColumns[this.drillTo.usedColumnIndexes[i]].DataColumn, this.drillTo.currentDateGrouping, columnsInUse);
                    } else {
                        this.addDateGroupingIntoDrilledColumn(this.drillTo.drillToColumns[this.drillTo.usedColumnIndexes[i]].DataColumn, null, columnsInUse);
                    }
                }
            }
            
            for (i = 0; i < this.drillTo.drilledToStates.length; i++) {
                this.addDateGroupingIntoDrilledColumn(this.drillTo.drilledToStates[i].DrilledFilterColumn, this.drillTo.drilledToStates[i].DrilledFilterDateGrouping, columnsInUse);
                this.addDateGroupingIntoDrilledColumn(this.drillTo.drilledToStates[i].DrilledColumn, this.drillTo.drilledToStates[i].DrilledColumnDateGrouping, columnsInUse);
            }

            var options = Y.all('#' + this.drillTo.popupId + ' option');
            options.each(function (node) {
                if (columnsInUse.indexOf(node.get('value')) != -1) {
                    node.setAttribute('disabled', "disabled");
                    node.setStyle('color', '#cccccc');
                } else {
                    node.removeAttribute('disabled');
                    node.setStyle('color', '');
                }
            }, this);

            var columnSelect = Y.one('#' + this.drillTo.columnDropDownId);
            if (columnSelect) {
                var existedEvent = columnSelect.getData('drillToAction');
                if (existedEvent) {
                    existedEvent.detach();
                    existedEvent = null;
                    columnSelect.set('value', '');
                }
                columnSelect.setData('drillToAction', columnSelect.on('change', function () { this.doDrillTo(columnSelect.get('value')) }, this));
                this.highlightJoinedColumns();
            }
            //REPDEV-29427, DrillTo should be processed at this time if Layout is free-form.
            if (LogiXML.Dashboard.pageDashboard && !!LogiXML.Dashboard.pageDashboard.get("bIsFreeformLayout")) {
                this.postProcessDrillTo(chartOptions);
            }
        },

        postProcessDrillTo: function (chartOptions) {
            if (!chartOptions.drillTo) {
                return;
            }

            var chartDrillToStatus = this.configNode.getAttribute('chart-drillTo-status');
            if (chartDrillToStatus == '2') {
                this.updateDrillInfoBreadcrumb();
            }
        },

        addDateGroupingIntoDrilledColumn: function (dataColumnName, dateGrouping, columnsInUse) {
            var dataColumn = null;
                i = 0;
            for (; i < this.drillTo.drillToColumns.length; i++) {
                if (this.drillTo.drillToColumns[i].DataColumn == dataColumnName) {
                    dataColumn = this.drillTo.drillToColumns[i];
                    break;
                }
            }

            if (dateGrouping && dateGrouping.length > 0) {
                if (this.drillTo.usedColumnIndexes[0] != -1 && this.drillTo.drillToColumns[this.drillTo.usedColumnIndexes[0]].DataColumn != dataColumnName) {
                    columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                    columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                    columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                    columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                    columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfMonth');
                    columnsInUse.push(dataColumnName);
                } else {
                    switch (dateGrouping) {
                        case 'FirstDayOfYear':
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                            break;
                        case 'FirstDayOfQuarter':
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                            break;
                        case 'FirstDayOfMonth':
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfMonth');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalMonth');
                            break;
                        case 'FirstDayOfFiscalYear':
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfMonth');
                            break;
                        case 'FirstDayOfFiscalQuarter':
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                            columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfMonth');
                            break;
                    }
                }
            } else if (dataColumn.DataType == 'DateTime') {
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfYear');
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfQuarter');
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfMonth');
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalYear');
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalQuarter');
                columnsInUse.push(dataColumnName + '!timeperiod!FirstDayOfFiscalMonth');
                columnsInUse.push(dataColumnName);
            } else {
                columnsInUse.push(dataColumnName);
            }

        },

        drillBackClick: function () {
            var inpName = this.id + '_' + "drillTo";
            var inp = this.getOrCreateInputElement(inpName);
            this.drillTo.drilledToStates.pop();
            inp.set('value', JSON.stringify(this.drillTo.drilledToStates));
            var requestUrl = 'rdAjaxCommand=RefreshElement&rdAction=ChartDrillTo&rdRefreshElementID=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
            if (this.drillTo.sGlobalFilterPopupId) {
                requestUrl += '&rdPopupId=' + this.drillTo.sGlobalFilterPopupId
            }
            rdAjaxRequest(requestUrl);
        },

        pointClick: function (point) {
            if (this.drillTo.excludedPointValues && this.drillTo.excludedPointValues.length > 0) {
                var excludedPointValues = this.drillTo.excludedPointValues;
                var clickedValue = point.name ? point.name : point.x;
                if (excludedPointValues.indexOf(clickedValue) != -1) {
                    return;
                }
            }
            //multiple actions available
            //show associated popup
            ShowElement(this.id, this.drillTo.popupId, '', '');
            if (!this.drillTo.current) {
                this.drillTo.current = {};
            }
            this.drillTo.current.DrilledFilterColumn = this.drillTo.drillToColumns[this.drillTo.usedColumnIndexes[0]].DataColumn;
            this.drillTo.current.DrilledFilterValue = point.originalName;

            var drillDataType = this.drillTo.drillToColumns[this.drillTo.usedColumnIndexes[0]].DataType;

            if (!point.name && drillDataType == 'Text') {
                this.drillTo.current.DrilledFilterValue = '';
            } else if (drillDataType == 'DateTime' || drillDataType == 'Date') {
                var isoDateString = new Date(this.drillTo.current.DrilledFilterValue).toISOString();
                this.drillTo.current.DrilledFilterValue = isoDateString;
                this.drillTo.current.DrilledFilterDateGrouping = this.drillTo.currentDateGrouping;
            }
        },

        doDrillTo: function (dataColumn) {
            var timePeriod = '';
            if (dataColumn.indexOf('!timeperiod!') != -1) {
                var splittedColumn = dataColumn.split('!timeperiod!');
                timePeriod = splittedColumn[1];
                dataColumn = splittedColumn[0];
            }
            if (dataColumn == '') {
                this.drillTo.drilledToStates = [];
            } else {
                this.drillTo.current.DrilledColumn = dataColumn;
                this.drillTo.current.DrilledColumnDateGrouping = timePeriod;
                this.drillTo.drilledToStates.push(this.drillTo.current);
            }

            // persist types
            for (var i = 0; i < this.drillTo.drilledToStates.length; i++) {
                var drilledToState = this.drillTo.drilledToStates[i];

                for (var j = 0; j < this.drillTo.drillToColumns.length; j++) {
                    var drillToColumn = this.drillTo.drillToColumns[j];

                    if (drillToColumn.DataColumn == drilledToState.DrilledFilterColumn) {
                        drilledToState.DrilledFilterColumnType = drillToColumn.DataType;
                        break;
                    }
                }
            }

            this.setDrillToStatesToInputElement();

            //REPDEV-24519 Develop a new breadcrumb menu for SSRM Dashboard Drill To
            //Add new parameter rdAction=ChartDrillTo when do drill to or drill back action.
            var requestUrl = 'rdAjaxCommand=RefreshElement&rdAction=ChartDrillTo&rdRefreshElementID=' + this.id + '&rdReport=' + this.reportName + '&rdRequestForwarding=Form';
            if (this.drillTo.sGlobalFilterPopupId) {
                requestUrl += '&rdPopupId=' + this.drillTo.sGlobalFilterPopupId
            }
            rdAjaxRequest(requestUrl);
            ShowElement(this.id, this.drillTo.popupId, 'False', 'False');
        },
        //REPDEV-24519 Develop a new breadcrumb menu for SSRM Dashboard Drill To
        updateDrillInfoBreadcrumb: function () {
            if (this.drillInfoBreadcrumb) {
                this.drillInfoBreadcrumb.destroy();
            }
            var chart = this;
            Y.use('chartDrillToBreadcrumb', function (Y) {
                chart.drillInfoBreadcrumb = new Y.LogiXML.ChartDrillToBreadcrumb({
                    drillTo: chart.drillTo,             
                    rdChartCanvasId: chart.id,
                    reportName: chart.reportName,
                    isSsrmDashboard: chart.configNode.getAttribute('is-ssrm-dashboard')
                });
            });
        },

        //REPDEV-28394
        reflowDrillInfoBreadcrumb: function () {
            if (this.drillInfoBreadcrumb) {
                this.drillInfoBreadcrumb.reflow();
            }
        },

        highlightJoinedColumns: function () {
            var joinedOptgroups = Y.all('#' + this.drillTo.popupId + '  optgroup');
            if (joinedOptgroups && joinedOptgroups.size() > 1) {
                var i = 0;
                for (; i < joinedOptgroups.size(); i++) {
                    joinedOptgroups.item(i).addClass("rdAgQbColor" + ((i%6)+1))
                }
            }
        },

        showPopupMenu: function (e, ppId) {
            if (e && e.point && e.point.series && e.point.series.options && e.point.series.options.selection
                && e.point.series.options.selection.excludedPointValues && e.point.series.options.selection.excludedPointValues.length > 0
                && e.point.series.options.selection.excludedPointValues.indexOf(e.point.name) != -1) {
                return;
            }

            if (this.id && this.id.indexOf('_Row') != -1) {
                var sRowNum = this.id.substring(this.id.indexOf('_Row'));
                ppId = ppId + sRowNum;
            }
            this.e = e;
           
            var lbl = Y.one('#' + ppId);
            var rdDpDiv = lbl.ancestor('div.rdDashboardPanel'),
                rdDpContainerDiv;
            if (rdDpDiv) {
                var rdDpContainerDiv = rdDpDiv.ancestor();

                if (rdDpDiv && rdDpDiv.getAttribute('style').indexOf('position') > -1) {
                    rdDpDiv.setStyle('position', '');
                }
            }

            lbl.setStyle('position', 'absolute');

            if (rdDpContainerDiv && rdDpContainerDiv.getAttribute("class").indexOf('freeformPanelContainer') > -1) {
                lbl.setStyle('left', (e.chartX + 10) + 'px');
                lbl.setStyle('top', e.chartY  + 'px');
            } else if (lbl.ancestor('div.rdResponsiveColumn')) {
                if (!LogiXML.isIE()) {
                    lbl.setStyle('left', e.offsetX + 'px');
                    lbl.setStyle('top', e.offsetY + 'px');
                } else {
                    lbl.setStyle('left', e.x + 'px');
                    lbl.setStyle('top', e.y + 'px');
                }
            } else {
                lbl.setStyle('left', e.pageX + 'px');
                lbl.setStyle('top', e.pageY + 'px');
            }

            lbl.setStyle('visibility', 'hidden');
            lbl.getData('ppObject').rdShowPopupMenu(ppId, '');
           
        },

        execPopupMnuAction: function (actionIndex) {
            var sAction = this.e.point.series.options.events.popupMenus[actionIndex];
            window.rdActionToFunction = new Function('e', sAction);
            window.rdActionToFunctionArg = this.e;
            window.setTimeout(function () { window.rdActionToFunction(window.rdActionToFunctionArg);}, 100);
        }

    }, {
        // Static Methods and properties
        NAME: 'ChartCanvas',
        ATTRS: {
            configNode: {
                value: null,
                setter: Y.one
            }
        },

        createElements: function (isAjax) {
            if (!isAjax) {
                isAjax = false;
            }

            var chart;

            Y.all('.' + TRIGGER).each(function (node) {
                chart = node.getData(TRIGGER);
                if (!chart) {
                    chart = new Y.LogiXML.ChartCanvas({
                        configNode: node,
                        isAjax: isAjax
                    });
                }
            });
        },

        handleError: function (e) {
            //If it work with the method "this._handlers.chartError = (Highcharts.addEvent ? Highcharts : HighchartsAdapter).addEvent(Highcharts, 'displayError', Y.LogiXML.ChartCanvas.handleError);"
            //the chart is got with e.chart
            //var chart = e.chart,
            var chart = e.target, code = e.code;
            //Note: Maybe need modify the Highcharts source code "es-modules/error-messages.js" when upgrade the Highcharts to let below code work.
            errorText = Highcharts.errorMessages[code]["text"];
            if (errorText == '') {
                return;
            }
            var id = chart.renderTo.id;

            var eleOut = document.getElementById("rdCodeErrMessage_" + id)
            if (eleOut)
                eleOut.innerHTML = errorText;
            else //PROTECTION HERE, Note: PhantomJs DOESNOT SUPPORT console.error() (REPDEV-28878)
                console.log(errorText)
        },

        reflowCharts: function (rootNode) {
            if (rootNode && rootNode.all) {
                var chart;
                rootNode.all('.' + TRIGGER).each(function (node) {
                    chart = node.getData(TRIGGER);
                    if (chart) {
                        chart.chart.reflow();
                    }
                });
            }
        },

        resizeToWidth: function (width, cssSelectorPrefix) {
            var chart, e;
            Y.all(cssSelectorPrefix + ' .' + TRIGGER).each(function (node) {
                chart = node.getData(TRIGGER);
                if (chart) {
                    e = { width: width, finished: true };
                    chart.resized(e);
                }
            });
        },

        reflowAllCharts: function () {
            var allCharts = Y.all('.' + TRIGGER);
            allCharts.each(function (node) {
                chart = node.getData(TRIGGER);
                if (chart && chart.chart && chart.chart.container) {
                    Y.one(chart.chart.container).hide();
                }
            });

            allCharts.each(function (node) {
                chart = node.getData(TRIGGER);
                if (chart) {
                    //console.log('reflow all charts');
                    chart.responsiveResize.call(chart, chart, true);
                }
            });

            allCharts.each(function (node) {
                chart = node.getData(TRIGGER);
                if (chart && chart.chart && chart.chart.container) {
                    Y.one(chart.chart.container).show();
                }
            });
        },

        reflowChart: function (node) {
            if (!node)
                return;

            chart = node.getData(TRIGGER);

            if (chart && chart.chart && chart.chart.container) {
                var containerNode = Y.one(chart.chart.container);
                containerNode.hide();
                chart.responsiveResize.call(chart, chart, true);
                containerNode.show();
            }
        }

        
    });
}, '1.0.0', { requires: ['base', 'node', 'event', 'node-custom-destroy', 'json-parse', 'io-xdr', 'chartCanvasRangeSelection', 'event-resize'] });

function rdGetChartCanvasObject(chartId) {
    if (!chartId || chartId == '') {
        return null;
    }
    var div = Y.one('#' + chartId);
    if (!div) {
        return null;
    }
    return div.getData('rdChartCanvas');
}


LogiXML.ChartCanvas = LogiXML.ChartCanvas || {};
LogiXML.ChartCanvas.Highcharts9Adapter ||
    (LogiXML.ChartCanvas.Highcharts9Adapter =
    //FIXFOR-V9
    /**
        *
        * Holder for fixes needed for HC9
        * Global to be accesible from anywhere via LogiXML.ChartCanvas.Highcharts9Adapter
        * */
    //Highcharts9Adapter:
    {
        /**
            * Chartcanvas -scope global variable
            * Keep flag is it new HC version (in this case we need to apply fixes)
            * */
        isNewHC: null,
        /**
            * Force - checking is it new HC
            * Updating internal flag 
            * @return {boolean}
            *          checking result
            * */
        setIsNewHC: function () {
            this.isNewHC = parseInt(Highcharts.version.split(".")[0] || 0) >= 9;
        },
        /**
            * Checking is it new HC
            * Initializing flag if needed
            * @return {boolean}
            *          is it new HC - internal flag
            * */
        checkNewHC: function () {
            if (this.isNewHC == null) {
                this.setIsNewHC();
            }
            return this.isNewHC;
        },

        /**
         * variable for holding arrays of already executed functions
         * used by once()
         * */
        onceHolder: [],
        /**
         * boolean function to execute wrapping only once
         * testing was this function already executed
         * 
         * @param {string} fName
         *          function name to check
         * @return {boolean}
         *          true if not wrapped yet
         *          
         */
        once: function (fName) {
            return (this.onceHolder.indexOf(fName) == -1) && (this.onceHolder.push(fName) || true);
        },

        /**
         * EntryPoint for calling all tweaks before chart creation
         * Also will be called while exporting
         * @param {options} chartOptions
         *                  HC's chart options (user options)*/
        BeforeChartCreate: function(chartOptions) {
            if (!this.checkNewHC()) return false;
            //FIXFOR-V9
            //REPDEV-26510 HighChart v9.x font get different appearance on chart bar
            this.overrideDefaultHCOptions(chartOptions);

            //FIXFOR-V9
            //REPDEV-26470 X- axis data value got mess
            this.attachStaggerLinesHandler(chartOptions);

            //FIXFOR-V9
            //REPDEV-26610 Zoom Control for Chart Canvas Charts (Zoom to specific month)
            //REPDEV-26529 HighChart v9.x: A bubble chart, Y-Axis starts from -50
            this.adjustForMinRange();

            //FIXFOR-V9
            //REPDEV-26531 Highcharts v9- The line color of Series.Area Range display wrong
            this.getZonesWithLineColor();

            //FIXFOR-V9
            //REPDEV-26601-Maximum Label Length of canvas chart doesn't work.
            this.wrapLabelFormatterForMaxLength(chartOptions);
            //REPDEV-26461 Not display Show All link.
            this.wrapLegendAllItems(chartOptions);

            this.wrapLegendColorizeItem(chartOptions);

            //FIXFOR-V9
            //REPDEV-26803: Highcharts v9-Set Forecast as Regresstion for Line chart on SSRM throw error"Array.prototype.forEach called on null or undefined"
            this.wrapSegmented_series();

            //FIXFOR-V9
            //REPDEV-26701, REPDEV-26702(Pie/Donut datalabels count reduced), Code 2/2
            this.wrapPieDrawDataLabels(chartOptions);
            //FIXFOR-V9
            //REPDEV-26684,HighChart v9.x: the lower bound of Pyramid Y-Axis is not same as v4
            this.wrapChartGetAxisMargins();
            //FIXFOR-V9
            //REPDEV-26746,HighChart v9.x: some labels did not display values in the heatmap, Code 2/3
            this.wrapRendererfontMetrics();
            //FIXFOR-V9
            //REPDEV-26723 The position of SubCaption for AreaRange chart is not same in V4 highchart
            this.wrapChartLayOutTitles(chartOptions);

            //FIXFOR-V9
            //REPDEV-26780 Highcharts v9-The chart result is wrong on SSRM when add two string columns to additional
            this.changeStackSeriesType(chartOptions);

            //FIXFOR-V9
            //REPDEV-26814 different legend display
            //Commented out by REPDEV-26940 Highcharts v9 - Long quicktips of chart has been cut off
            //this.wrapSVGLabelCSS();
            //FIXFOR-V9
            //REPDEV-26830 Axis does not change after clicking legend
            this.wrapAxisGetOffset();
            //FIXFOR-V9
            //REPDEV-26832 Bubble chart can not display.
            this.wrapBubbleGetRadius(chartOptions);
            //FIXFOR-V9
            //REPDEV-26713 Highcharts v9-The cell boarder color will missing when hovering on heatmap chart
            //REPDEV-26714 Highcharts v9-The boarder color of heatmap chart is not same with in V4
            this.wrapTreemappointAttribs();
            //REPDEV-26859 The font of datalabel is not same as v4
            this.wrapSVGRendererGetStyle();
            //FIXFOR-V9
            //REPDEV-26845 Highcharts v9-The polar waterfull chart result is not same with in V4
            this.wrapWaterfallSeriesTranslate();
            //FIXFOR-V9
            //REPDEV-26861 Highcharts v9- The position of gauge label is not same with in HC4
            //Grabbed from HC4 (it's own custom implementation there)
            this.setLabelsRendering(chartOptions);
            //FIXFOR-V9
            //REPDEV-26902: HighChart v9.x: X-axis label display different from v4
            //REPDEV-26904: HighChart v9.x: Bar overlapped
            this.wrapSeriesGetProcessedData();
            //FIXFOR-V9
            //REPDEV-26938: Highcharts v9-No data to display when export the zoomed chart to PDF/Word/Excel
            this.wrapChartZoom();
            //FIXFOR-V9
            //REPDEV-26907 tick label of Gauge overlapped 
            this.wrapTickHandleOverflow();
            //FIXFOR-V9
            //REPDEV-26855 Axis ticks are less than V4.
            this.wrapAxisUnsquish();
            //FIXFOR-V9
            //REPDEV-26910: Highcharts v9-Area Spline polar chart won't display when the values are negative
            this.modifyStackedPolarSeriesValue(chartOptions);
            //FIXFOR-V9
            //REPDEV-27080 Charts/ ActiveSQL - Legends are overlapped
            this.attachLabelsCollisionEvent();

            //FIXFOR-V9
            //REPDEV-28194 Polar Bubble / Scatter xAxis max value is different than in HC4
            //Caused by REPDEV-27984
            this.setPolarNoSharedTooltipFlag(chartOptions);

            //FIXFOR-V9
            //REPDEV-28122 remove console errors by added the allowed tags and attributes 
            Highcharts.AST.allowedTags.push('abbr');
            Highcharts.AST.allowedAttributes.push('alt');
            Highcharts.AST.allowedAttributes.push('title');
            //FIXFOR-V9
            //REPDEV-27310 upgrade for GetImage
            Highcharts.AST.allowedAttributes.push('pointer-events');


            //FIXFOR-V9
            //REPDEV-28884 Chart Quicktip HTML format not working V14
            if (this.once('bypassHTMLFiltering') && chartOptions.bypassHTMLFiltering) {
                Highcharts.AST.bypassHTMLFiltering = chartOptions.bypassHTMLFiltering;
                //#upgrade alter point
                //2 lines below are very dirty but efficient.
                //They should be removed after updating to HC 10+
                Highcharts.AST.allowedTags.indexOf = function () { return 1; }
                Highcharts.AST.filterUserAttributes = function (inp) { return inp; }
            }

            //FIXFOR-V9
            //REPDEV-27891 Add option for Color Axis on Chart
            this.wrapColorAxisGetSeriesExtremes(chartOptions);
            this.wrapColorAxisDrawLegendSymbol(chartOptions);
            this.preProcessColorAxes(chartOptions);
            //FIXFOR-V9
            //REPDEV-27310
            //HighChart v9.x, upgrade for GetImage
            if (chartOptions.exporting &&
                chartOptions.exporting.buttons) {

                var toFix = false;
                Highcharts.objectEach(chartOptions.exporting.buttons, function (btnOptions) {
                    if (btnOptions.enabled) {
                        toFix = true;
                    }
                });
                if (toFix) {
                    this.wrapAddButton();
                    this.fixGetChartHTML();
                    this.wrapSanitizeSVG();
                }
            }
            //FIXFOR-V9
            //REPDEV-30030, resizing waterfall, the total bar moved to be first bar
            this.wrapWaterfallGeneratePoints();
        },

        /**
         * EntryPoint for calling all tweaks before chart creation
         * Also will be called while exporting
         * @param {Highcharts.Chart} chart
         *                          created chart instance*/
        AfterChartCreate: function (chart) {
            if (!this.checkNewHC()) return false;
            //FIXFOR-V9
            //Includes: 
            //1. REPDEV-26500 Chart title doesn't show in quick tip when hovering over chart
            //2. Issue 23756 Section 508 Accessibility for Canvas Charts, BUG 24681 'AltText' attribute lost.
            this.resetTitleAndDescElement(chart);

            //FIXFOR-V9 
            //REPDEV-26706 click global filter, throw error
            this.setDateTimeAxisFlag(chart);

            //REPDEV-29791: SOLUTION: clear after creating (Because HC didn't supply option), please check SPIKE of 29789
            if (chart.options.legend.rdDisableLegendFiltering) {
                var useHTML = chart.legend.options.useHTML
                //DO NOT Set 'e.element.onclick = undefined': it will be Error on touching actions.
                chart.legend.allItems.forEach(function (element) {
                    element &&
                        (useHTML ? [element.legendItem, element.legendSymbol] : [element.legendGroup]).forEach(function (e) {
                            e && e.on("click", function () { })
                        })
                });
            }
        },
        /**
            * Wrapping Highcharts.Point.prototype.select
            * To fire 'pointselection' event
            * @fires Highcharts.Series.event:pointselection
            */
        attachPointSelectEventHandlers: function () {
            if (!this.checkNewHC() || !this.once('attachPointSelectEventHandlers')) return false;
            if (!Highcharts || !Highcharts.Point || !Highcharts.Point.prototype || !Highcharts.wrap) return false;
            Highcharts.wrap(Highcharts.Point.prototype, 'select', function (base, selected, accumulate) {
                base.call(this, selected,//calling base point.select
                    this.series.options.accumulate);//REPDEV-26464 Bar selected status disappear after select other bar
                if (this.series.options.allowPointSelect) {
                    Highcharts.fireEvent(this.series, 'pointselection', this);
                }
            })
        },

        //FIXFOR-V9
        //REPDEV-26610 Zoom Control for Chart Canvas Charts (Zoom to specific month)
        //REPDEV-26529 HighChart v9.x: A bubble chart, Y-Axis starts from -50
        /**
         * copy it from highcharts-all.js
         * only change the line [axis.minRange = Math.min(closestDataRange*5, axis.dataMax - axis.dataMin);] to fix the bug 26610.
         * 'adjustForMinRange' was borrowed to add code to fix the bug 26529
         * TODO: investigate better way to fix this.
         * */
        adjustForMinRange: function () {
            if (!this.checkNewHC() || !this.once('adjustForMinRange')) return false;

            Highcharts.Axis.prototype.adjustForMinRange = function () {
                var axis = this,
                    options = axis.options,
                    min = axis.min,
                    max = axis.max,
                    log = axis.logarithmic,
                    zoomOffset,
                    spaceAvailable,
                    closestDataRange = 0,
                    i,
                    distance,
                    xData,
                    loopLength,
                    minArgs,
                    maxArgs,
                    minRange;
                // Set the automatic minimum range based on the closest point distance
                if (axis.isXAxis &&
                    typeof axis.minRange === 'undefined' &&
                    !log) {
                    if (Highcharts.defined(options.min) || Highcharts.defined(options.max)) {
                        axis.minRange = null; // don't do this again
                    }
                    else {
                        // Find the closest distance between raw data points, as opposed
                        // to closestPointRange that applies to processed points
                        // (cropped and grouped)
                        axis.series.forEach(function (series) {
                            xData = series.xData;
                            loopLength = series.xIncrement ? 1 : xData.length - 1;
                            if (xData.length > 1) {
                                for (i = loopLength; i > 0; i--) {
                                    distance = xData[i] - xData[i - 1];
                                    if (!closestDataRange || distance < closestDataRange) {
                                        closestDataRange = distance;
                                    }
                                }
                            }
                        });
                        //change the line to support the Zoom to specific month request
                        //axis.minRange = Math.min(closestDataRange*5, axis.dataMax - axis.dataMin);
                        axis.minRange = Math.min(closestDataRange, axis.dataMax - axis.dataMin);
                    }
                }
                // if minRange is exceeded, adjust
                if (max - min < axis.minRange) {
                    spaceAvailable =
                        axis.dataMax - axis.dataMin >=
                        axis.minRange;
                    minRange = axis.minRange;
                    zoomOffset = (minRange - max + min) / 2;
                    // if min and max options have been set, don't go beyond it
                    minArgs = [
                        min - zoomOffset,
                        Highcharts.pick(options.min, min - zoomOffset)
                    ];
                    // If space is available, stay within the data range
                    if (spaceAvailable) {
                        minArgs[2] = axis.logarithmic ?
                            axis.logarithmic.log2lin(axis.dataMin) :
                            axis.dataMin;
                    }
                    min = Highcharts.arrayMax(minArgs);
                    maxArgs = [
                        min + minRange,
                        Highcharts.pick(options.max, min + minRange)
                    ];
                    // If space is availabe, stay within the data range
                    if (spaceAvailable) {
                        maxArgs[2] = log ?
                            log.log2lin(axis.dataMax) :
                            axis.dataMax;
                    }
                    max = Highcharts.arrayMin(maxArgs);
                    // now if the max is adjusted, adjust the min back
                    if (max - min < minRange) {
                        minArgs[0] = max - minRange;
                        minArgs[1] = Highcharts.pick(options.min, max - minRange);
                        min = Highcharts.arrayMax(minArgs);
                    }
                }
                // Record modified extremes
                axis.min = min;
                axis.max = max;
                //CODES for REPDEV-26610 END.
                //CODES For 
                //  REPDEV-26529, HighChart v9.x: A bubble chart, Y-Axis starts from - 50
                //  REPDEV-26854, HighChart v9.x: A bubble chart, Y-Axis starts from -0.25
                //  REPDEV-26916, HighChart v9.x: Area Spline chart display wrong when the value is negative
                //SOLUTION: if axis.min - TotalMinOfPadding < 0, let the final used > 0(same as LogiFix in HC4)
                //NOTE: in bubble, axis.min/axis.min will be reset because padding. the algorithm is diff in HC4 and HC9
                //NOTE: 'axis.isDatetimeAxis' is for before HC8.1, just keep it.
                if (!axis.categories &&
                    !axis.axisPointRange &&
                    !(axis.stacking && axis.stacking.usePercentage) &&
                    !axis.isLinked &&
                    (axis.dataMin >= 0 && !(axis.isDatetimeAxis || axis.dateTime) && !axis.isXAxis) &&
                    Highcharts.defined(axis.min) &&
                    Highcharts.defined(axis.max) && (axis.max > axis.min) &&
                    axis.options.minPadding &&
                    !Highcharts.defined(Highcharts.pick(axis.userMin, options.min)) &&
                    !axis.isLog) { //REPDEV-26916
                    var length = axis.max - axis.min;
                    if ((length && axis.min < length * axis.options.minPadding) &&
                        (//REPDEV-26916
                            //1) Remove axis.dataMin<0: IF dataMin <0 will not go here.(this will be done in Highchart.src.js)
                            //2) HC4's  !axis.ignoreMinPadding
                            // in HC4's workflow, simpply speaking, ignoreMinPadding is set null at frist , then set True if series.options.threshold is defiend AND NOT(axis.isLog AND series.options.threshold <= 0)
                            // in HC9, the relavtive (about 'ignoreMinPadding') were removed
                            // HERE: axis.isLog must be false, so only check series.options.threshold is defiend
                            !axis.series.some(function (series) { return Highcharts.defined(series.options.threshold) })
                        )
                    ) {
                        //REPDEV-29942
                        //Line before fix (axis.options.min=0) fixed issues mentioned above but force set axis extreme.
                        //Due to that axis extreme hasn't been updated after turning series on/off. Using .floor now for "soft" axis min.
                        axis.options.floor = 0;
                    }
                }
                //CODES for REPDEV-26529/REPDEV-26854/REPDEV-26916 END.
            };
        },

        //FIXFOR-V9
        //TODO: investigate better way to fix this
        //REPDEV-26803: Highcharts v9-Set Forecast as Regresstion for Line chart on SSRM throw error"Array.prototype.forEach called on null or undefined"
        wrapSegmented_series: function () {
            if (!this.checkNewHC() || !this.once('wrapSegmented_series')) return false;
            if (!Highcharts.wrap) return false;
            Highcharts.wrap(Highcharts.seriesTypes.linesegmented.prototype, 'translate', function (base) {
                base.call(this);
                this.getSegments();
            });

            Highcharts.wrap(Highcharts.seriesTypes.splinesegmented.prototype, 'translate', function (base) {
                base.call(this);
                this.getSegments();
            });
        },

        //FIXFOR-V9
        //REPDEV-26601-Maximum Label Length of canvas chart doesn't work.
        wrapLabelFormatterForMaxLength: function (chartOptions) {
            if (!this.checkNewHC()) return false;
            if (!Highcharts || !Highcharts.wrap) return false;
            var axisWithMaxLength;
            if (chartOptions) {
                axisWithMaxLength = (chartOptions.xAxis ? chartOptions.xAxis.concat(chartOptions.yAxis ? chartOptions.yAxis : []) :
                    chartOptions.yAxis ? chartOptions.yAxis : [])
                        .some(
                            function (axis) {
                                return axis.labels.maxLabelLength;
                            }
                        )
            }
            if (!axisWithMaxLength) return false;
            if (!this.once('wrapLabelFormatterForMaxLength')) return false;
            Highcharts.wrap(Highcharts.Axis.prototype, 'init', function (base, chart, userOptions) { //wrapping constructor of axis to wrap formatter as soon as possible
                base.call(this, chart, userOptions)//creating instanse if Axis
                if (userOptions.labels && userOptions.labels.maxLabelLength !== undefined) {
                    Highcharts.wrap(this, 'labelFormatter', function (base, tickFormatCtx, thisFormatCtx) {//wrapping formatter function (it may be user-defined) with trimming function
                        var currStr = base.call(this, tickFormatCtx, thisFormatCtx);//calling main formatter, getting string
                        return LogiXML.ChartCanvas.trimLabelToLength(currStr, this.axis.userOptions.labels.maxLabelLength); //trimming label
                    });
                }
            });
        },

        //FIXFOR-V9 
        //REPDEV-26706 click global filter, throw error
        setDateTimeAxisFlag: function (chart) {
            if (!this.checkNewHC()) return false;
            chart.axes.forEach(function (axis) {
                axis.isDatetimeAxis = axis.userOptions && axis.userOptions.type === 'datetime';
            });
        },

        //FIXFOR-V9
        //REPDEV-26780 Highcharts v9-The chart result is wrong on SSRM when add two string columns to additional
        changeStackSeriesType: function (chartOptions) {
            if (chartOptions.series && chartOptions.series.length > 0) {
                if (chartOptions.series.some(function (serie) { return serie.stacking == 'percent'; })) {
                    for (i = 0; i < chartOptions.series.length; i++) {
                        var series = chartOptions.series[i];
                        if (series.stacking) {
                            series.stacking = 'percent';
                        }
                    }
                }
            }
        },

        //FIXFOR-V9
        //REPDEV-26470 X- axis data value got mess
        attachStaggerLinesHandler: function () {
            if (!this.checkNewHC() || !this.once('attachStaggerLinesHandler')) return false;
            if (!Highcharts.wrap) return false;

            //worker function
            this.calculateStaggerLines = function (axis) { //from old HC4
                var tickPositions = axis.tickPositions;
                var ticks = axis.ticks;

                var sortedPositions = axis.reversed ? [].concat(tickPositions).reverse() : tickPositions,
                    maxStaggerLines = 5, //HighChartsV4 default
                    autoStaggerLines = 1;
                while (autoStaggerLines < maxStaggerLines) {
                    var lastRight = [];
                    var overlap = false;
                    for (var i = 0; i < sortedPositions.length; i++) {
                        var pos = sortedPositions[i];
                        var bBox = ticks[pos].label && ticks[pos].label.getBBox();
                        var w = bBox ? bBox.width : 0;
                        var lineNo = i % autoStaggerLines;

                        if (w) {
                            var x = axis.translate(pos); // don't handle log
                            if (lastRight[lineNo] !== undefined && x < lastRight[lineNo]) {
                                overlap = true;
                            }
                            lastRight[lineNo] = x + w;
                        }
                    }
                    if (overlap) {
                        autoStaggerLines++;
                    } else {
                        break;
                    }
                }

                if (autoStaggerLines > 1) {
                    axis.staggerLines = autoStaggerLines;
                }
            }

            //actual binding
            var self = this;
            Highcharts.wrap(Highcharts.Axis.prototype, 'renderUnsquish', function (base) {
                base.call(this);//call base method
                if (this.horiz && !this.staggerLines && !this.autoRotation && !this.labelRotation) {//calculate autoStaggerLines afterwards
                    self.calculateStaggerLines(this);
                }
            });
        },
        //FIXFOR-V9
        //REPDEV-26461 Not display Show All link.
        //TODO: investigate better way to fix this
        wrapLegendAllItems: function (chartOptions) {
            if (!this.checkNewHC()) return false;
            if (!Highcharts || !Highcharts.wrap || !chartOptions.legend) return false;
            if (!chartOptions.legend.showAllCaption || chartOptions.legend.showAllCaption == '') return false;
            if (!this.once('wrapLegendAllItems')) return false;
            Highcharts.wrap(Highcharts.Legend.prototype, 'getAllItems', function (base) {
                var legend = this,
                    chart = legend.chart;
                var allItems = base.call(this);
                if (allItems.length <= 0 || !legend.options.showAllCaption) return allItems;

                if (allItems.filter(function (item) { return !(item instanceof Highcharts.Axis); }).length == 0) {
                    //There is no series, showAllCaption won't be drawn.
                    return allItems;
                }

                if (legend.selectAllItem) {
                    return allItems.concat(legend.selectAllItem);
                }

                //Here we can make sure the allItems include one seriece at once
                allItems.filter(function (item) {
                    return item instanceof Highcharts.Axis;
                }).forEach(function (colorAxisItem) {
                    colorAxisItem.options = colorAxisItem.options || {};
                    //Makes sure this axis is on the leftmost side of legend.
                    //Because the later code will set options.legendIdex of selectAllItem as -1, so set legendIndex as -10 (less than -1)'
                    colorAxisItem.options.legendIndex = -10;
                });

                //At the very beginning, show all legends. So the default visible of 'Show All' be false.
                //FIXFOR-V9
                //REPDEV-26777 ShowAll symbol does not change with clicking legend
                //Set color insteade of legendColor.
                var selectAllItem = { name: legend.options.showAllCaption, id: "selectAllItemsLegendItem", visible: false, color: chart.options.chart.plotBackgroundColor };
                selectAllItem.symbol = allItems[allItems.length - 1].symbol || (allItems[allItems.length - 1].series && allItems[allItems.length - 1].series.symbol);
                selectAllItem.drawLegendSymbol = allItems[allItems.length - 1].drawLegendSymbol || (allItems[allItems.length - 1].series && allItems[allItems.length - 1].series.drawLegendSymbol);
                //FIXFOR-V9
                //REPDEV-26751 LegendSymbol is wrong for scatter
                //In v4, the drawLegendSymbol of bubble series is drawLegendSymbol, but it is drawLineMarker in v9.
                if (selectAllItem.drawLegendSymbol == Highcharts.LegendSymbolMixin.drawLineMarker && allItems[allItems.length - 1].type != 'bubble') {
                    selectAllItem.drawLegendSymbol = Highcharts.LegendSymbolMixin.drawRectangle;
                }
                selectAllItem.pointAttribs = function () {
                    return {
                        stroke: chart.xAxis[0].options.lineColor || "#C0C0C0",
                        fill: legend.options.showAllInvertedMarkerColor || '#FFFFFF'
                    }
                }
                selectAllItem.chart = allItems[allItems.length - 1].chart || allItems[allItems.length - 1].series.chart;
                selectAllItem.options = {
                    legendIndex: -1,
                    invertedCaption: legend.options.showAllInvertedCaption,
                    defaultCaption: legend.options.showAllCaption,
                    caption : legend.options.showAllCaption
                };
                selectAllItem.options.marker = {
                    stroke: chart.xAxis[0].options.lineColor || "#C0C0C0",
                    'stroke-width': 1,
                    fill: legend.options.showAllMarkerColor,
                    defaultFill: legend.options.showAllMarkerColor,
                    invertedFill: legend.options.showAllInvertedMarkerColor
                };
                selectAllItem.setState = function () {
                    return;
                }
                legend.selectAllItem = selectAllItem;
                return allItems.concat(selectAllItem);
            });

            Highcharts.wrap(Highcharts.Legend.prototype, 'setItemEvents', function (base, item, legendItem, useHTML) {
                if (item.id && item.id == "selectAllItemsLegendItem") {
                    (useHTML ? legendItem : item.legendGroup).on('click', function (event) {
                        var allItemsSelected = true;
                        var allItems = item.chart.series[0].options.legendType === 'point' ?
                            item.chart.series[0].data :
                            item.chart.series;

                        allItems.forEach(function (item) {
                            if (item.id && item.id == "selectAllItemsLegendItem") {
                                return;
                            }
                            allItemsSelected = allItemsSelected && item.visible;
                        })
                        //FIXFOR-V9
                        //REPDEV-27398 Chart Legend - Show All labels - not clickable when going to hide all data
                        //hide all legends when click on show all.
                        allItems.forEach(function (item) {
                           if (item.id && item.id == "selectAllItemsLegendItem") {
                              return;
                           } else {
                              item.setVisible && item.setVisible(!allItemsSelected, false, false);
                           }
                        })
                        var allItem = item.chart.legend.selectAllItem;
                        if (allItem) allItem.visible = allItemsSelected;
                        item.chart.legend.colorizeItem(item, allItemsSelected);
                        item.chart.redraw();
                        return;
                    });
                    return;
                }
                base.call(this, item, legendItem, useHTML);

            });

            function setVisibleWrapper(base, vis, redraw, extend) {
                base.call(this, vis, redraw);
                if (extend === false) return;
                var item = this;
                var allItemsSelected = true;
                var chart = item.chart || item.series.chart;
                var allItems = chart.series[0].options.legendType === 'point' ?
                    chart.series[0].data :
                    chart.series;

                allItems.forEach(function (item) {
                    if (item.id && item.id == "selectAllItemsLegendItem") {
                        return;
                    } else {
                        allItemsSelected = allItemsSelected && item.visible;
                    }
                })
                var showAllLegend;
                var allLegend = chart.legend.allItems;
                allLegend.forEach(function (le) {
                    if (le.id && le.id == "selectAllItemsLegendItem") {
                        showAllLegend = le;
                    }
                })
                if (showAllLegend) {
                    showAllLegend.visible = !allItemsSelected;
                    chart.legend.colorizeItem(showAllLegend, !allItemsSelected);
                }
                chart.redraw();
            }

            Highcharts.wrap(Highcharts.Series.prototype, 'setVisible', setVisibleWrapper);
            Highcharts.wrap(Highcharts.seriesTypes.pie.prototype.pointClass.prototype, 'setVisible', setVisibleWrapper);

        },

        wrapLegendColorizeItem: function (chartOptions) {
            if (!this.checkNewHC()) return false;
            if (!Highcharts || !Highcharts.wrap || !chartOptions.legend) return false;
            if (!this.once('wrapLegendColorizeItem')) return false;
            Highcharts.wrap(Highcharts.Legend.prototype, 'colorizeItem', function (base, item, visible) {
                //FIXFOR-V9
                //REPDEV-26901 : HighChart-v9.x-a-spline-chart-displays-different-from-v4
                //REPDEV-26966 Highcharts v9-Add additional column to chart throw error"Cannot read property 'fillColor' of undefined"
                var colorByPoint = item.options.colorByPoint;
                var baseColor;
                if (colorByPoint) {
                    //REPDEV-26974 Highcharts v9-Chart doesn't display and throw error"Cannot read property 'fillColor' of undefined"
                    if (item.options.type == "line" || item.options.type == "spline") {
                        baseColor = item.options.marker.fillColor;
                    }
                    var scrap = LogiXML.getRandomElements(item.userOptions.data, item.userOptions.data.length);
                    if (!item.color && scrap.some(function (dataPoint) { return LogiXML.hasValue(dataPoint) && dataPoint.color; })) {
                        scrap.some(function(dataPoint) { dataPoint.color && (item.color = dataPoint.color);})
                    }
                    //REPDEV-26977 Highcharts v9-The color of chart legend icon doesn't work
                    if (!item.color) {
                        var colorArray = item.options.colors || item.chart.options.colors;
                        item.color = LogiXML.getRandomElements(colorArray, 1)[0];
                    }
                };
                colorByPoint &&
                    (item.options.marker && (item.options.marker.fillColor || (item.options.marker.fillColor = "#CCC")))
                base.call(this, item, visible);
                colorByPoint && (item.options.marker && (item.options.marker.fillColor = baseColor));
                if (item.id == "selectAllItemsLegendItem") {
                    //set props. item.visible means all series are hidden (show all button is visible) and vice versa.
                    if (item.legendSymbol) {
                        item.options.marker.fill = item.visible ? item.options.marker.invertedFill : item.options.marker.defaultFill;
                        item.legendSymbol.attr(item.options.marker);
                    }
                    item.options.caption = item.name = item.visible ? item.options.invertedCaption || item.options.defaultCaption : item.options.defaultCaption;
                    item.legendItem.attr(
                        {
                            text: item.options.caption
                        });
                } else {
                    //FIXFOR-V9
                    //REPDEV-26777 ShowAll symbol does not change with clicking legend
                    //for legend symbol of bubble except for ShowAll.
                    if (item.legendSymbol && item.type == 'bubble' && !visible) {
                        var markerOptions = item.options && item.options.marker
                        if (markerOptions && item.legendSymbol.isMarker) {
                            item.legendSymbol.attr(item.pointAttribs());
                        }
                    }
                }
            });
        },

        //FIXFOR-V9
        //REPDEV-26701, REPDEV-26702(Pie/Donut datalabels count reduced), Code 2/2
        wrapPieDrawDataLabels: function (chartOptions) {
            if (!this.checkNewHC()) return false;
            if (!Highcharts.wrap) return false;
            if (!chartOptions.series || !chartOptions.series.some(function (serie) {
                return serie.type == 'pie';
            })) return false;

            //this should be executed on second step because on 1st step there is no series and we won't go there again on 2nd step.
            if (!this.once('PieDrawDataLabels')) return false;

            //IMPORTANT:
            //Maybe ONLY OK for HC9, Please check all usage of 'distribute'. In worst case we probably wrap drawdatalabels.
            Highcharts.wrap(Highcharts, 'distribute', function (base, boxes, len, maxDistance) {
                //Now, ONLY be called in Pie.DrawDataLabels, maxDistance is 1/5 of len.
                maxDistance == len / 5 ? base.call(this, boxes, len, len) : base.call(this, boxes, len, maxDistance)
            });
        },

        //FIXFOR-V9
        //REPDEV-26684,HighChart v9.x: the lower bound of Pyramid Y-Axis is not same as v4
        //REPDEV-26853,The X Axis tick mark number of Scatter polar chart is not same with in HC4
        //SOLUTION: As long as the chart.plot changes, recalculate the tickInteval(and tickPositions) 
        //  of the axis(instead of recalculating after changing to a certain extent, same as HC4) on render.
        //Note0: Since src cannot be modified, 'getAxisMargins' was borrowed to add code.
        //Note1: getAxisMargins() only called once in render.
        //Note2: call setTickInterval(true) twice would not affect the final result.
        //Note3: getMargins() will call 'getAxisMargins', these is no condition to avoid loop-calling if wrap 'getAxisMargins'
        //Note4: '(!axis.isRadial) || axis.beforeSetTickPositions' is used to skip FunctionNotFoundException on action 'initialAxisTranslation'
        //  >In fact it is (axis.isRadial && axis.beforeSetTickPositions) || (!axis.isRadial)
        //      >>Polar & gauge's 'axis.isRadial' are true, but gauge does not have 'beforeSetTickPositions' now(HC9.0.1).
        //      >>Others' 'axis.isRadial' is false
        wrapChartGetAxisMargins: function () {
            if (!this.checkNewHC()) return false;
            if (!Highcharts || !Highcharts.wrap || !this.once('wrapChartGetAxisMargins')) return false;

            Highcharts.wrap(Highcharts.Chart.prototype, 'getAxisMargins', function (base) {
                base.call(this);
                if (this.tickIntervalSet) return;
                this.tickIntervalSet = true;
                this.axes.forEach(function (axis) {
                    ((!axis.isRadial) || axis.beforeSetTickPositions) && axis.setTickInterval(true);
                });
                this.getMargins();
            });
        },
        //FIXFOR-V9
        //REPDEV-26746: (codes 2/3)
        //Bug reason: the line-hight was changed. 
        //note0.the line-hight was caculated in 'fontMeterics(fontSize, elem)'
        //note1. We copied and used the implementation of HC4(logi) instead of HC9
        //note2. I personally think fontsize + 3 is better for line height, so that the text does not overlap the border
        wrapRendererfontMetrics: function () {
            if (!this.checkNewHC() || !this.once('RendererfontMetrics')) return false;

            Highcharts.SVGRenderer.prototype.fontMetrics = function (fontSize, elem) {
                //NOTE: they are copied from HC4(logi)
                fontSize = fontSize || this.style.fontSize;
                if (elem && Highcharts.win.getComputedStyle) {
                    elem = elem.element || elem; // SVGElement
                    //LOGIFIX
                    var computedStyle = Highcharts.win.getComputedStyle(elem, "");
                    if (computedStyle) {
                        fontSize = computedStyle.fontSize;
                    }
                }
                fontSize = /px/.test(fontSize) ? Highcharts.pInt(fontSize) : /em/.test(fontSize) ? parseFloat(fontSize) * 12 : 12;

                // Empirical values found by comparing font size and bounding box height.
                // Applies to the default font family. http://jsfiddle.net/highcharts/7xvn7/
                var oldlinehight = fontSize; //FIXFOR-V9, REPDEV-26855 Axis ticks are less than V4.
                var lineHeight = fontSize < 24 ? fontSize + 4 : Math.round(fontSize * 1.2),//see:note2
                    baseline = Math.round(lineHeight * 0.8);

                return {
                    h: lineHeight,
                    b: baseline,
                    f: fontSize,
                    o: oldlinehight
                };
            };

        },
        //FIXFOR-V9
        //REPDEV-26723 The position of SubCaption for AreaRange chart is not same in V4 highchart
        //TODO: investigate better way to fix this
        wrapChartLayOutTitles: function (chartOptions) {
            if (!this.checkNewHC()) return false;
            if (!this.once('wrapChartLayOutTitles') || !chartOptions.subtitle || !chartOptions.subtitle.text) return false;
            Highcharts.Chart.prototype.layOutTitles = function (redraw) {
                var titleOffset = [0, 0, 0],
                    requiresDirtyBox,
                    renderer = this.renderer,
                    spacingBox = this.spacingBox;
                // Lay out the title and the subtitle respectively
                ['title', 'subtitle', 'caption'].forEach(function (key) {
                    var title = this[key], titleOptions = this.options[key], verticalAlign = titleOptions.verticalAlign || 'top', offset = key === 'title' ? -3 :
                        // Floating subtitle (#6574)
                        verticalAlign === 'top' ? titleOffset[0] + 2 : 0, titleSize, height;
                    if (title) {
                        if (!this.styledMode) {
                            titleSize = titleOptions.style.fontSize;
                        }
                        titleSize = renderer.fontMetrics(titleSize, title).b;
                        title
                            .css({
                                width: (titleOptions.width ||
                                    spacingBox.width + (titleOptions.widthAdjust || 0)) + 'px'
                            });
                        // Skip the cache for HTML (#3481, #11666)
                        height = Math.round(title.getBBox(titleOptions.useHTML).height);

                        //REPDEV-26723  modification 0/2
                        if (key == 'subtitle') {
                            if (titleOptions.floating && !titleOptions.verticalAlign) {
                                offset += height * 2 - 2;
                            }
                            else offset = height + titleOffset[0];
                        }


                        title.align(Highcharts.extend({
                            y: verticalAlign === 'bottom' ?
                                titleSize :
                                key == 'subtitle' ? offset : offset + titleSize, //REPDEV-26723  modification 1/2
                            height: height
                        }, titleOptions), false, 'spacingBox');
                        if (!titleOptions.floating) {
                            if (verticalAlign === 'top') {
                                titleOffset[0] = Math.ceil(titleOffset[0] +
                                    height);
                            }
                            else if (verticalAlign === 'bottom') {
                                titleOffset[2] = Math.ceil(titleOffset[2] +
                                    height);
                            }
                        }
                    }
                }, this);
                // Handle title.margin and caption.margin
                if (titleOffset[0] &&
                    (this.options.title.verticalAlign || 'top') === 'top') {
                    titleOffset[0] += this.options.title.margin;
                }
                if (titleOffset[2] &&
                    this.options.caption.verticalAlign === 'bottom') {
                    titleOffset[2] += this.options.caption.margin;
                }
                requiresDirtyBox = (!this.titleOffset ||
                    this.titleOffset.join(',') !== titleOffset.join(','));
                // Used in getMargins
                this.titleOffset = titleOffset;
                Highcharts.fireEvent(this, 'afterLayOutTitles');
                if (!this.isDirtyBox && requiresDirtyBox) {
                    this.isDirtyBox = this.isDirtyLegend = requiresDirtyBox;
                    // Redraw if necessary (#2719, #2744)
                    if (this.hasRendered && pick(redraw, true) && this.isDirtyBox) {
                        this.redraw();
                    }
                }
            }
        },
        //FIXFOR-V9
        //REPDEV-26830 Axis does not change after clicking legend
        wrapAxisGetOffset: function () {
            if (!this.checkNewHC()) return false;
            if (!this.once('wrapAxisGetOffset') || !Highcharts.wrap) return false;
            Highcharts.wrap(Highcharts.Axis.prototype, 'getOffset', function (base) {
                base.call(this);
                //FIXFOR-V9
                //REPDEV-26862 : Highcharts v9 - The Tick Axis Line Thickness of gauge chart is not same with in HC4
                this.series.some(function (serie) {
                    return serie.type == 'gauge';
                }) && (this.offset = 0);
            })
            Highcharts.Axis.prototype.hasData = function () {
                return this.hasVisibleSeries && this.series.some(function (s) {//REPDEV-26830, modification, add condition this.hasVisibleSeries.
                    return s.hasData();
                }) ||
                    (this.options.showEmpty &&
                        Highcharts.defined(this.min) &&
                        Highcharts.defined(this.max));
            }
        },

        //FIXFOR-V9
        //REPDEV-26814 different legend display
        wrapSVGLabelCSS: function () {
            if (!this.checkNewHC()) return false;
            if (!Highcharts || !Highcharts.wrap || !this.once('wrapSVGLabelCSS')) return false;
            Highcharts.wrap(Highcharts.SVGRenderer.prototype, 'label', function (base, str, x, y, shape, anchorX, anchorY, useHTML, baseline, className) {
                var label = base.call(this, str, x, y, shape, anchorX, anchorY, useHTML, baseline, className);
                label.css = function (styles) {
                    if (styles) {
                        var textStyles = {},
                            isWidth,
                            isFontStyle;
                        // Create a copy to avoid altering the original object
                        // (#537)
                        styles = Highcharts.merge(styles);
                        var extendTextProps = [
                            'color', 'direction', 'fontFamily', 'fontSize', 'fontStyle',
                            'fontWeight', 'lineHeight', 'textAlign', 'textDecoration',
                            'textOutline', 'textOverflow', 'width', 'whiteSpace'  //REPDEV-26814, 0/2 added 'whiteSpace'
                        ];
                        //SVGLabel.textProps.forEach(function (prop) {
                        extendTextProps.forEach(function (prop) { //REPDEV-26814, modification 1/2
                            if (typeof styles[prop] !== 'undefined') {
                                textStyles[prop] = styles[prop];
                                delete styles[prop];
                            }
                        });
                        this.text.css(textStyles);
                        isWidth = 'width' in textStyles;
                        isFontStyle = 'fontSize' in textStyles ||
                            'fontWeight' in textStyles;
                        // Update existing text, box (#9400, #12163)
                        if (isFontStyle) {
                            this.updateTextPadding();
                        }
                        else if (isWidth) {
                            this.updateBoxSize();
                        }
                    }
                    return Highcharts.SVGElement.prototype.css.call(this, styles);
                };
                return label;
            });
        },
        //FIXFOR-V9
        //REPDEV-26713 Highcharts v9-The cell boarder color will missing when hovering on heatmap chart
        //REPDEV-26714 Highcharts v9-The boarder color of heatmap chart is not same with in V4
        wrapTreemappointAttribs: function () {
            if (!this.checkNewHC()) return false;
            if (!Highcharts || !Highcharts.wrap || !this.once('wrapTreemappointAttribs')) return false;

            Highcharts.wrap(Highcharts.seriesTypes.treemap.prototype, 'pointAttribs', function (base, point, state) {
                //REPDEV-29790 the CellBorderColor did not take effect
                if (!state) { state = ''; }//NORMAL_STATE
                //REPDEV-27173 the color of area becames grey when click on any heatmap plot area
                point && point.pointAttr && point.pointAttr[state] &&
                    (
                        (point.borderColor = point.pointAttr[state]['stroke']) &&
                        (point.borderWidth = point.pointAttr[state]['stroke-width']) &&
                        (point.color = point.pointAttr[state]['fill'])
                    )
                return base.call(this, point, state);
            })
        },
        //FIXFOR-V9
        //REPDEV-26832 Bubble chart can not display.
        wrapBubbleGetRadius: function () {
            if (!this.checkNewHC()) return false;
            if (!Highcharts.wrap || !this.once('wrapBubbleGetRadius')) return false;
            Highcharts.wrap(Highcharts.seriesTypes.bubble.prototype, 'getRadius', function (base, zMin, zMax, minSize, maxSize, value, yValue) {
                return base.call(this, zMin, zMax, minSize, maxSize, value == null ? undefined : value, yValue)
            })
        },
        //FIXFOR-V9
        //REPDEV-26859 The font of datalabel is not same as v4
        wrapSVGRendererGetStyle: function () {
            if (!this.checkNewHC()) return false;
            if (!Highcharts || !this.once('wrapSVGRendererGetStyle')) return false;
            Highcharts.SVGRenderer.prototype.getStyle = function (style) {
                this.style = Highcharts.extend({
                    //fontFamily: '"Lucida Grande", "Lucida Sans Unicode", ' +
                    //    'Arial, Helvetica, sans-serif',
                    fontFamily: 'Arial, Helvetica, sans-serif',// default font  //LOGIFIX - Lucida Grande not supported by our pdf engine
                    fontSize: '12px'
                }, style);
                return this.style;
            }
        },
        //FIXFOR-V9
        //REPDEV-26845: Highcharts v9-The polar waterfull chart result is not same with in V4
        wrapWaterfallSeriesTranslate: function () {
            if (!this.checkNewHC() || !this.once('WaterfallSeriesTranslate')) return false;
            if (!Highcharts.wrap) return false;
            //NOTICE1: waterfallSeries is extends from columnSeries
            //NOTICE2: 'translate' on waterfallSeries will reset point.shapeArgs.y
            //NOTICE3: The shape-coordinates, in HC4 is 'point.shapeArgs.d', and HC9 is 'point.shapeArgs'
            //NOTICE4: 
            //  HC4, the shape-coordinates not changed in 'translate', [they are calculated/reset before 'drawPoints'(point.shapeType changed from 'path' to 'arc')].
            //  HC9, On POLAR-waterfall, before 'translate', the shape-coordinates(also point.shapeType) has been calculated/reset as same value as in HC4 that after caculated/reset
            //NOTICE5: It just makes HC9 look like HC4.
            //  BUT, I don't think the results of hc4 or hc9 is right, because every shape touches the Pole [It's just my opinion, see my comment on REPDEV-26845 if interested]
            Highcharts.wrap(Highcharts.seriesTypes.waterfall.prototype, 'translate', function (base) {
                this.chart.polar ? Highcharts.seriesTypes.column.prototype.translate.call(this) : base.call(this);
            });
        },
        //FIXFOR-V9
        //REPDEV-30030,resizing waterfall, the total bar moved to be first bar
        wrapWaterfallGeneratePoints: function () {
            if (!this.checkNewHC() || !this.once('WaterfallGeneratePoints')) return false;
            if (!Highcharts.wrap) return false;
            Highcharts.wrap(Highcharts.seriesTypes.waterfall.prototype, 'generatePoints', function (base) {
                base.call(this);
                this.points && this.points.forEach(function (point) { point.options && point.x && (point.options.x = point.x) })
            });
        },
        //FIXFOR-V9
        //REPDEV-26902: HighChart v9.x: X-axis label display different from v4
        //REPDEV-26904: HighChart v9.x: Bar overlapped
        wrapSeriesGetProcessedData: function () {
            if (!this.checkNewHC() || !this.once('SeriesGetProcessedData')) return false;
            if (!Highcharts.wrap) return false;
            Highcharts.wrap(Highcharts.Series.prototype, 'getProcessedData', function (base, forceExtremesFromAll) {
                var processedData = base.call(this, forceExtremesFromAll);
                //FIXFOR-V9
                //REPDEV-26902: HighChart v9.x: X-axis label display different from v4
                //REPDEV-26904: HighChart v9.x: Bar overlapped
                //Notice 1: It JUST reset closestPointRange.
                //Notice 2: Codes (not all) copied from REPDEV-24454
                //Notice 3: Reset does not break the existed logi in HC9
                //TODO: investigate feasibility to use HC9 own sorting.
                if (this.requireSorting) {
                    var closestPointRange;
                    var processedXDataSorted = processedData.xData.slice().sort(function (a, b) { return a - b });//See TODO
                    var xAxis = this.xAxis,
                        val2lin = xAxis && xAxis.val2lin,
                        isLog = !!(xAxis && xAxis.logarithmic);
                    // Find/Reset the closest distance between processed points
                    for (i = processedXDataSorted.length - 1; i >= 0; i--) {
                        var distance = (isLog ?
                            (val2lin(processedXDataSorted[i]) - val2lin(processedXDataSorted[i - 1])) :
                            (processedXDataSorted[i] - processedXDataSorted[i - 1]));
                        if (distance > 0 && (closestPointRange === undefined || distance < closestPointRange)) {
                            closestPointRange = distance;
                            // Unsorted data is not supported by the line tooltip, as well as data grouping and
                            // navigation in Stock charts (#725) and width calculation of columns (#1900)
                        }/* else if (distance < 0) {
                                error(15, false, series.chart);
                            }*/
                    }
                    //REPDEV-26902 : processedData.closestPointRange === undefined
                    //REPDEV-26904 : processedData.closestPointRange  > closestPointRange
                    if (processedData.closestPointRange === undefined || processedData.closestPointRange > closestPointRange)
                        processedData.closestPointRange = closestPointRange;
                }
                //REPDEV-26902,REPDEV-26904 End
                return processedData;
            });
        },
        //FIXFOR-V9
        //REPDEV-26938: Highcharts v9-No data to display when export the zoomed chart to PDF/Word/Excel
        wrapChartZoom: function () {
            if (!this.checkNewHC() || !this.once('ChartZoom')) return false;
            if (!Highcharts.wrap) return false;
            //always store/update zoom-state if 'zoom' triggled.
            Highcharts.wrap(Highcharts.Chart.prototype, 'zoom', function (base, event) {
                base.call(this, event);
                var chart = this;
                var viewstateObj = JSON.parse(getInputViewStateElement(chart, 'zoom').value);
                if (viewstateObj && chart.xAxis && chart.yAxis) {
                    viewstateObj.xZoom[0] = viewstateObj.xZoom[0] ? viewstateObj.xZoom[0] : {};
                    viewstateObj.yZoom[0] = viewstateObj.yZoom[0] ? viewstateObj.yZoom[0] : {};

                    viewstateObj.xZoom[0].min = chart.xAxis[0].min;
                    viewstateObj.xZoom[0].max = chart.xAxis[0].max;

                    viewstateObj.yZoom[0].min = chart.yAxis[0].min;
                    viewstateObj.yZoom[0].max = chart.yAxis[0].max;
                    getInputViewStateElement(chart, 'zoom').value = JSON.stringify(viewstateObj);
                    if (mergeHandlers) 
                        mergeHandlers(chart);
                }
            });
        },
        //FIXFOR-V9
        //REPDEV-26907 tick label of Gauge overlapped 
        wrapTickHandleOverflow: function () {
            if (!this.checkNewHC() || !Highcharts.wrap || !this.once('wrapTickHandleOverflow')) return false;
            Highcharts.wrap(Highcharts.Tick.prototype, 'handleOverflow', function (base, xy) {
                axis = this.axis;
                if (axis.options.showAllTicksWithOverlap) { // LOGIFIX SVG gauges tick fixes and Arc gauge font size fixes.
                    return true;
                }
                base.call(this, xy);
            })
        },
        //FIXFOR-V9
        //REPDEV-26855 Axis ticks are less than V4.
        wrapAxisUnsquish: function () {
            if (!this.checkNewHC() || !Highcharts.wrap || !this.once('wrapAxisUnsquish')) return false;
            Highcharts.wrap(Highcharts.Axis.prototype, 'unsquish', function (base) {
                if (this.horiz) {
                    this.getOldLineHeight = true;
                }
                var ret = base.call(this);
                delete this.getOldLineHeight
                return ret;
            })
            Highcharts.wrap(Highcharts.Axis.prototype, 'labelMetrics', function (base) {
                var metrics = base.call(this);
                if (this.getOldLineHeight) {
                    return {
                        h: metrics.o,
                        b: metrics.b,
                        f: metrics.f
                    }; 
                }
                return metrics;
            })
        },
        //FIXFOR-V9
        //REPDEV-26910: Highcharts v9-Area Spline polar chart won't display when the values are negative
        //looks like this is HC own issue
        modifyStackedPolarSeriesValue: function (chartOptions) {
            if (!this.checkNewHC() || !Highcharts.wrap || !this.once('modifyStackedPolarSeriesValue')) return false;
            if (!chartOptions.chart.polar) return false;
            Highcharts.seriesTypes.areaspline.prototype.modifyValue =
                Highcharts.seriesTypes.area.prototype.modifyValue =
                function (yValue, point) {
                    point.series.options.stacking &&
                    point.series.options.stacking.length > 0 &&
                    (point.y = yValue);
                    return yValue;
                };
        },

        //FIXFOR-V9
        //REPDEV-27080 Charts/ ActiveSQL - Legends are overlapped
        //probably need to be marked as feature and redone with custom code for edge cases (I.E. hunderts of labels)
        //REPDEV-27661 The Axis label only displays one after click the legend filter on AG chart
        //Reason: the non-horiz axis should be obey the default of HC9
        //REPDEV-28051 Some rotated axis labels missed when resizing chart
        //Reason: in 'hideOverlappingLabels()', The circumscribed rectangle of the label is used to determine whether there is overlap, rather than the real space of the label
        attachLabelsCollisionEvent: function () {
            if (!this.checkNewHC() || !this.once('attachLabelsCollisionEvent')) return false;
            Highcharts.addEvent(Highcharts.Chart, 'load', function () {
                this.labelCollectors = this.labelCollectors || [];
                var chartAxes = this.xAxis;
                this.labelCollectors.push(function () {//labelCollectors will be used afterwards in HC9 own collision removal code.
                    var tickLabels = []
                    chartAxes.forEach(function (axis) {
                        !(axis.options && axis.options.showAllTicksWithOverlap) && //special case for gauges
                            axis.horiz && !axis.autoRotation && !axis.labelRotation && //REPDEV-27661 & REPDEV-28051
                        axis.tickPositions &&
                            (tickLabels = tickLabels.concat(
                                axis.tickPositions
                                    .map(function (pos) {
                                        return axis.ticks[pos] && axis.ticks[pos].label;
                                    })
                                    .filter(function (label) {
                                        return Boolean(label);
                                    })));
                    });
                    return tickLabels;
                })
            })
        },

        //FIXFOR-V9
        setPolarNoSharedTooltipFlag: function (chartOptions) {
            //We will alter behavior only for polar scatter or bubble
            if (!chartOptions.series || !chartOptions.series.length) return false;
            if (!this.checkNewHC() || !this.once('setPolarNoSharedTooltipFlag')) return false;
            const typesToWrap = ["scatter", "bubble"];
            if (!chartOptions.chart.polar ||
                (chartOptions.series &&
                !chartOptions.series.some(function (serie) { return typesToWrap.indexOf(serie.type) > -1; })
                )) return false;
            //Solution#1: hooking to afterInit and set the flag. We didn't populate defaultoptions before that (so they'll override anything being set before that point)
            Highcharts.addEvent(Highcharts.Series, 'afterInit', function (event) {
                var serieObj = event.target;
                serieObj.chart.polar && typesToWrap.indexOf(serieObj.type) > -1 &&
                    (serieObj.noSharedTooltip = true);
            });
            /*Solution#2
             * Check if something will go wrong with #1
             * Double-wrap: set flag in wrapped init function <- wrap init function in wrapped constructor function <- wrap constructor function only for needed types
             * /
            
            /*typesToWrap.forEach(function (currType) {
                Highcharts.wrap(Highcharts.seriesTypes, currType, function (base) {
                    var serieObj = new base();
                    serieObj.noSharedTooltip = true;
                    Highcharts.wrap(serieObj, "init", function (base, chart, options) {
                        base.call(this, chart, options);
                        chart.polar && (this.noSharedTooltip = true);
                    });
                    return serieObj;
                });
            });*/
        },

        //FIXFOR-V9
        //REPDEV-27891 Add option for Color Axis on Chart
        wrapColorAxisGetSeriesExtremes: function (chartOptions) {
            if (!chartOptions.colorAxis || !chartOptions.colorAxis.length) return false;
            if (!this.checkNewHC() || !this.once('ColorAxisGetSeriesExtremes')) return false;
            if (!Highcharts.wrap) return false;
            Highcharts.wrap(Highcharts.ColorAxis.prototype, 'getSeriesExtremes', function (base) {
                var series = this.series;
                var visibleSeries = series.filter(function (serie) { return serie.visible });

                var seriesToCalculateExtremes = visibleSeries.filter(function (serie) {
                    var colorKey = Highcharts.pick(serie.options.colorKey, serie.colorKey, serie.pointValKey, serie.zoneAxis, 'y');
                    if (colorKey && ["y", "low", "high", "z"].indexOf(colorKey) > -1) return false;//processed by HC
                    if (!serie.userOptions || !serie.userOptions.data) return false;//no data to process
                    var extremesExisted = false;
                    ['Min', 'Max'].forEach(function (extr) { extremesExisted = extremesExisted || Highcharts.isNumber(serie[colorKey + extr]) });
                    if (extremesExisted) return false;//already calculated
                    return true;
                });

                seriesToCalculateExtremes.forEach(function (serie) {
                    var colorKey = Highcharts.pick(serie.options.colorKey, serie.colorKey, serie.pointValKey, serie.zoneAxis, 'y');//duplication. IDK how to make this prettier.
                    var dataArr = serie.userOptions.data.map(function (dataObject) { return dataObject[colorKey]; });
                    //From HC SRC:
                    /* `Math.min` raises
                      * a maximum call stack size exceeded error in Chrome when trying to apply more
                      * than 150.000 points. This method is slightly slower, but safe.*/
                    serie[colorKey + 'Min'] = Highcharts.arrayMin(dataArr);
                    serie[colorKey + 'Max'] = Highcharts.arrayMax(dataArr);
                });

                this.series = visibleSeries;//using only visible series to calculate color axis scale

                base.call(this);

                this.series = series;
            });
        },

        //FIXFOR-V9
        //REPDEV-27891 Add option for Color Axis on Chart
        wrapColorAxisDrawLegendSymbol: function (chartOptions) {
            if (!chartOptions.colorAxis || !chartOptions.colorAxis.length) return false;
            if (!this.checkNewHC() || !this.once('ColorAxisDrawLegendSymbol')) return false;
            if (!Highcharts.wrap) return false;
            Highcharts.wrap(Highcharts.ColorAxis.prototype, 'drawLegendSymbol', function (base, legend, item) {
                var symbolWidth = legend.options.symbolWidth;
                if (legend.options.hasOwnProperty('symbolWidth')) {
                    delete legend.options.symbolWidth;
                }

                //REPDEV-29325 The chartColorAxis is very short the chart legend is vertical
                var symbolHeight = legend.options.symbolHeight;
                if (legend.options.hasOwnProperty('symbolHeight')) {
                    delete legend.options.symbolHeight;
                }

                base.call(this, legend, item);

                legend.options.symbolWidth = symbolWidth;
                legend.options.symbolHeight = symbolHeight;
            });
        },

        //REPDEV-27891 Add option for Color Axis on Chart
        preProcessColorAxes: function (chartOptions) {
            if (chartOptions.colorAxis && chartOptions.colorAxis.length && chartOptions.series && chartOptions.series.length > 0) {
                //REPDEV-29326 : No arrow appears on the Color Axis when the legend has next page
                //HC issue: https://github.com/highcharts/highcharts/issues/17723
                //we are overriding draw symbol function to bring it upper
                Highcharts.ColorAxis.prototype.drawCrosshair = function (e, point) {
                    var axis = this;
                    var plotX = point && point.plotX;
                    var plotY = point && point.plotY;
                    var axisPos = axis.pos;
                    var axisLen = axis.len;
                    var crossPos;
                    if (point) {
                        crossPos = axis.toPixels(point.getNestedProperty(point.series.colorKey));
                        if (crossPos < axisPos) {
                            crossPos = axisPos - 2;
                        } else if (crossPos > axisPos + axisLen) {
                            crossPos = axisPos + axisLen + 2;
                        }
                        point.plotX = crossPos;
                        point.plotY = axis.len - crossPos;
                        Highcharts.Axis.prototype.drawCrosshair.call(this, e, point);
                        point.plotX = plotX;
                        point.plotY = plotY;
                        if (axis.cross &&
                            !axis.cross.addedToColorAxis &&
                            axis.legendGroup) {
                            axis.cross
                                .addClass('highcharts-coloraxis-marker')
                                .add(axis.legendGroup.parentGroup.parentGroup.parentGroup);
                            axis.cross.addedToColorAxis = true;
                            if (!axis.chart.styledMode &&
                                typeof axis.crosshair === 'object') {
                                axis.cross.attr({
                                    fill: axis.crosshair.color
                                });
                            }
                        }
                    }
                };
                chartOptions.series.forEach(function (series) {
                    for (var i = 0; i < series.data.length; i++) {
                        var dataEntry = series.data[i];
                        if (!dataEntry.colorAxisValue) break;
                        dataEntry[series.colorKey] = dataEntry.colorAxisValue;
                        delete dataEntry.colorAxisValue;
                    }
                })
            }
        },

        //FIXFOR-V9
        overrideDefaultHCOptions: function (chartOptions) {
            if (!this.checkNewHC()) return false;

            if (this.once('overrideDefaultHCOptions')) {
                //REPDEV-29815. HighChart v9.x: label in x-Axis is different from v4
                Highcharts.timeUnits["month"] = 31 * 24 * 3600000;//31days, Same as  HC4
                Highcharts.timeUnits["year"] = 31556952000;//365.2425days, Same as  HC4

                //REPDEV-26338. HighChart v9.x: value tip does not include comma
                //From Highchart 4.1, the default had been changed to a single space character which is recommended in ISO 31-0 and works across Anglo-American and continental European languages.
                Highcharts.defaultOptions.lang.thousandsSep = ","

                //REPDEV-26552 Highcharts v9 - The chart result is wrong when x - axis values are the same
                Highcharts.Axis.defaultOptions.uniqueNames = false;

                //REPDEV-26667 HighChart v9.x: no tick line display
                Highcharts.Axis.defaultOptions.tickWidth = 1;
                Highcharts.Axis.defaultYAxisOptions.tickWidth = 0;

                //REPDEV-26499 Run waterfall chart throw error
                Highcharts.seriesTypes.waterfall.prototype.hasData = Highcharts.Series.prototype.hasData;
                Highcharts.seriesTypes.waterfall.defaultOptions.stacking = "normal";

                //FIXFOR-V9, REPDEV-26701, REPDEV-26702 (Pie/Donut datalabels count reduced), Code 1/2
                //In Highchart 9, the default value of pandding for datalabel was 5(px), Maybe we should reset to all series' datalabel
                //commented, fiexed with REPDEV-26900 together
                //Highcharts.seriesTypes.pie.defaultOptions.dataLabels.padding = 3;

                //FIXFOR-V9, REPDEV-26824 Highcharts v9-Data label size of chart is not same with in V4
                //In Highchart 9, the default value of pandding for datalabel was 5(px), Maybe we should reset to all series' datalabel
                //commented, fiexed with REPDEV-26900 together
                //Highcharts.seriesTypes.line.defaultOptions.dataLabels.padding = 3;

                //FIXFOR-V9, REPDEV-26639 HighChart v9.x: font get different appearance on Heatmap
                Highcharts.defaultOptions.plotOptions.treemap.dataLabels.style.fontWeight = "normal";
                //REPDEV-30774, otherwise, it will cause an additional line to be drawn when there is no data available
                Highcharts.defaultOptions.plotOptions.treemap.borderWidth = 0;

                //FIXFOR-V9, REPDEV-26825 Highcharts v9-The defualt font color of data label for chart is not same with in V4
                Highcharts.defaultOptions.plotOptions.arearange.dataLabels.style.color = '#606060';
                Highcharts.defaultOptions.plotOptions.areasplinerange.dataLabels.style.color = '#606060'

                //FIXFOR-V9
                //REPDEV-26511 HighChart v9.x mouse hover on series bar
                //REPDEV-26596 HighChart v9.x mouse hover on Pie series
                //REPDEV-26682 HighChart v9.x mouse hover on Pyramid
                //REPDEV-26686 HighChart v9.x mouse hover on multiple series line
                //FIXFOR-V9
                //REPDEV-26733 HighChart v9.x: when mouse hover on heatmap plot, other plot area is changed to gray
                Object.keys(Highcharts.defaultOptions.plotOptions).map(function (e) {
                    return Highcharts.defaultOptions.plotOptions[e];
                }).forEach(function (probablySerieDefOptions) {
                    //FIXFOR-V9
                    /*//REPDEV-26510 HighChart v9.x font get different appearance on chart bar
                    Highcharts.seriesTypes.column.defaultOptions.dataLabels.style.textOutline = "none";
                    //REPDEV-26594 HighChart v9.x font get different appearance on Pie chart
                    Highcharts.seriesTypes.pie.defaultOptions.dataLabels.style.textOutline = "none";*/
                    //set style of all series types default options
                    //REPDEV-26800 Info Studio: get error in Chart Wizard
                    probablySerieDefOptions.dataLabels.style.textOutline = "none";
                    //FIXFOR-V9
                    //REPDEV-26888 HC9 Balloon Bar Gauge Label Font is bold when it shouldn't be
                    //REPDEV-26750: Label Font Bold doesn't work when set it as False for Gauge Arc chart
                    //REPDEV-26746: some labels did not display values in the heatmap (codes 1/3)
                    //From VBcodes,our default-value is 'normal', but HC9 is 'bold'.
                    //note: arcGauge does not have defaultoptions now.(so put codes for these 2 here)
                    probablySerieDefOptions.dataLabels.style.fontWeight = 'normal';
                    probablySerieDefOptions.states &&
                        (probablySerieDefOptions.states.inactive.opacity = 1) &&
                        (probablySerieDefOptions.states.hover.opacity = 0.75);
                    //FIXFOR-V9,
                    //REPDEV-26900, different datalabel size from V4
                    probablySerieDefOptions.dataLabels.padding = 3;
                })

                //REPDEV - 26566 legend of bar
                //There is same prlblem in arearange
                //def: legend.itemStyle["fontWeight"]
                Highcharts.defaultOptions.legend.itemStyle.fontWeight = "normal";
                //FIXFOR-V9
                //REPDEV-26814 different legend display
                //FIXFOR-V9
                //commented, fixed with REPDEV-26909 together
                //Highcharts.defaultOptions.legend.itemStyle.textOverflow = "clip";
                Highcharts.defaultOptions.legend.title.style.whiteSpace = 'nowrap';
                //FIXFOR-V9
                //REPDEV-26776 Legend items positioning
                Highcharts.defaultOptions.legend.alignColumns = false;
                //REPDEV-26469, Gauge angular: when a value is lower than the Min Value Needle should Stop at the lowerBound
                Highcharts.seriesTypes.gauge.defaultOptions.overshoot = 0;

                //FIXFOR-V9
                //REPDEV-26705 HighChart v9.x: some side label in Funnel chart did not display all characters
                Highcharts.seriesTypes.funnel.defaultOptions.dataLabels.style.textOverflow = "clip";

                //FIXFOR-V9
                //REPDEV-27886 Sentences on Labels in Bar Charts are not wrapped in version 14
                //Reverting (commenting out)
                //REPDEV-26602 X axis label will word wrap.
                //Highcharts.Axis.defaultOptions.labels.style.whiteSpace = 'nowrap';

                //FIXFOR-V9
                //REPDEV-26958 X Axis label is cut off
                //REPDEV-27983, REPDEV-27886 reverting all Axis-labels, but should keep the one put Bottom/Top, such as X-axis.
                ["defaultBottomAxisOptions", "defaultTopAxisOptions"].forEach(function (name) {
                    var defLbls = Highcharts.Axis[name].labels;
                    delete defLbls.autoRotation; //REPDEV-26958. X Axis label is cut off
                    defLbls.style = defLbls.style || {};
                    defLbls.style.whiteSpace = "nowrap"; //REPDEV-27983
                });

                //FIXFOR-V9
                //REPDEV - 26662 HighChart v9.x: CLONE - Canvas Chart Axis don't unwrap when window is enlarged
                Highcharts.Axis.defaultOptions.labels.style.textOverflow = 'none';

                //REPDEV-26670
                //HighChart v9.x: another Reset Zoom button displayed after zoom
                this.fixZoomButton();

                //FIXFOR-V9
                //REPDEV-26653 Highcharts v9 - The margin of quicktip in V9 highchart is not same with in V4
                Highcharts.defaultOptions.tooltip.padding = 0;
                //FIXFOR-V9
                //REPDEV-30763, tooltip misalignment
                Highcharts.defaultOptions.tooltip.style.display = 'none';//LOGIFIX REPDEV-17577

                //FIXFOR-V9
                //REPDEV-26665 HighChart v9.x: bubble size has great difference between values
                Highcharts.seriesTypes.bubble.defaultOptions.sizeByAbsoluteValue = true;
                //FIXFOR-V9
                //REPDEV-26611 Chart Zoom cause blank chart
                Highcharts.seriesTypes.column.defaultOptions.cropThreshold = Highcharts.noop;
                //FIXFOR-V9
                //REPDEV-26498 Gauge bullet bar can not display.
                Highcharts.defaultOptions.title.style = {
                    color: '#274b6d', //LOGIFIX 22191 ChartCanvas: Reverting of an upgrade to v4 framework and reverting of formatters changes
                    fontSize: '16px'
                };
                //FIXFOR-V9
                //REPDEV-26863 font color of SubCaption for gauge chart is not same with in HC4
                Highcharts.defaultOptions.subtitle.style = {
                    color: '#4d759e' //LOGIFIX 22191
                };
                //FIXFOR-V9
                //REPDEV-26663 HighChart v9.x: the number of Day of Month in X - Axis is not same as v4
                //commented for REPDEV-26958
                //Highcharts.Axis.defaultOptions.labels.step = 1;
                //FIXFOR-V9
                //REPDEV- 27984
                //LOGIFIX 24604 in HC4. HC9 appends new condition 'axis.series.some(function (s) { return s.noSharedTooltip; })' in setTickInterval()
                //'scatter' and 'pie' 's default are true, but now 'pie' dosesnot have datetime-axis
                //Caused REPDEV-28194 Polar Bubble / Scatter xAxis max value is different than in HC4
                Highcharts.seriesTypes.scatter.prototype.noSharedTooltip = false;
                //REPDEV-27310
                //HighChart v9.x, upgrade for GetImage
                Highcharts.defaultOptions.navigation.buttonOptions.theme = {
                    zIndex: 20,
                    //LOGIFIX
                    // 21379 Zoom Chart pointer
                    states: {
                        hover: {
                            style: {
                                cursor: "pointer"
                            }
                        }
                    }
                };
                Highcharts.defaultOptions.exporting.buttons.contextButton.enabled = false;
                Highcharts._modules['Core/Renderer/SVG/SVGRenderer.js'].prototype.inlineToAttributes = [
                    //'fill',
                    'stroke',
                    'strokeLinecap',
                    'strokeLinejoin',
                    'strokeWidth',
                    'textAnchor',
                    'x',
                    'y'
                ];
            }
            //FIXFOR-V9
            //REPDEV-26497 Bubble chart can not display
            if (chartOptions) {
                if (chartOptions.series) {
                    chartOptions.series.forEach(function (series) {
                        if (series.type == 'bubble' && series.marker) {
                            series.marker.enabled = true;
                        }

                        //FIXFOR-V9
                        //REPDEV-26683 HighChart v9.x: some label of pyramid chart displays only part of text or blank
                        //REPDEV - 26973 Highcharts v9 - The side label of Funnel chart will word wrap
                        //Set the flag only for the SideLayout case to reduce the impact. 
                        if (series.type == 'pyramid' || series.type == 'funnel') {
                            if (!series.showInLegend && series.dataLabels.showPointName) {
                                if (typeof series.dataLabels.crop == 'undefined') {
                                    series.dataLabels.crop = false
                                }
                            }
                            //FIXFOR-V9
                            //REPDEV-26512 Java, the pdf result is wrong.
                            //Web page results are also different
                            if (series.dataLabels) {
                                series.dataLabels.style.textOverflow = 'clip';
                                delete series.dataLabels.style.textOutline;
                            }
                        }

                        //FIXFOR-V9
                        //REPDEV-26808 HighChart v9.x: some of bar did not display value when Horizontal
                        if (series.dataLabels) {
                            series.dataLabels.allowOverlap = true;
                        }
                        /** FIXFOR-V9
                         * This code is commented due to REPDEV-26704
                         * Highcharts v9-There is no Get Image button of GaugeBulletBar chart
                         * It may need to be restored back when bringing new exporting
                        //FIXFOR-V9
                        //REPDEV-26498 Gauge bullet bar can not display.
                        if ((series.type == 'bulletgauge') &&
                            chartOptions.exporting &&
                            chartOptions.exporting.buttons &&
                            chartOptions.exporting.buttons.exportButton) {
                            chartOptions.exporting.buttons.exportButton.enabled = false;
                        }*/

                        //FIXFOR-V9
                        //REPDEV-26707 HighChart v9.x: waterfall bar color is different with v4
                        if (series.type == 'waterfall' && series.upColor) {
                            series.color = series.upColor;
                        }

                        //FIXFOR-V9
                        //REPDEV-26721 Highcharts v9-The legend icon of Pyramid chart is not same with in V9 highchart
                        if (series.showInLegend && !chartOptions.legend) {
                            chartOptions.legend = Highcharts.defaultOptions.legend;
                            chartOptions.legend.squareSymbol = false;
                        }

                        //FIXFOR-V9
                        //REPDEV-26562 :HC DataLabels - check alignment property sync between server and highcharts
                        //REPDEV-26827 : Highcharts v9 - The alignment horizontal of data label for chart works wrong when set it as left
                        series.dataLabels && series.dataLabels.align && (["column", "bubble"].indexOf(series.type) < 0) &&
                            ((series.dataLabels.align == 'left' && (series.dataLabels.align = 'right')) ||
                                (series.dataLabels.align == 'right' && (series.dataLabels.align = 'left')));

                        //FIXFOR-V9
                        //REPDEV-26620 Highcharts v9-The X axis label of chart only display week1
                        if (series.dataInfo && series.dataInfo.columnMap.some(function (mapElement) {
                            return mapElement.name == "x" && mapElement.dataType == "DateTime";
                        })) {
                            for (var i = 0; i < series.data.length; i++) {
                                //FIXFOR-V9
                                //REPDEV-26725 Highcharts v9-No data to display when chart label column is Order Date by Year
                                if (Array.isArray(series.data[i])) {
                                    series.data[i][0] == null && (delete series.data[i])
                                } else {
                                    typeof (series.data[i].x) == "undefined" && (delete series.data[i]);
                                }
                            };
                        }
                        //FIXFOR-V9
                        //REPDEV-26901 : HighChart-v9.x-a-spline-chart-displays-different-from-v4
                        series.colorByPoint && !series.lineColor && (series.lineColor = "transparent");
                    });
                }

                //FIXFOR-V9
                //REPDEV-26651 HighCharts v9.x: Y-Axis Grid color is lighter than v4.
                if (chartOptions.yAxis) {
                    chartOptions.yAxis.forEach(function (yAxis) {
                        !yAxis.gridLineColor && (yAxis.gridLineColor = '#C0C0C0');
                    })
                }

                //FIXFOR-V9
                //REPDEV-26530 Highcharts v9-The legend icon is not same with in Version14.
                //in order to cover the presentation of v4, set the default value of v4 to chartOptions.legend.
                if (chartOptions.legend) {
                    var optLegend = chartOptions.legend;
                    !optLegend.squareSymbol && (optLegend.squareSymbol = false);
                    !optLegend.symbolHeight && (optLegend.symbolHeight = 12);
                    !optLegend.symbolWidth && (optLegend.symbolWidth = 16);
                    !optLegend.symbolRadius && (optLegend.symbolRadius = 0);
                    //FIXFOR-V9
                    //REPDEV-26909 long legend label is overlapped
                    //removed by
                    //REPDEV-26814 HighChart v9.x: Legend is different from v4
                    //REPDEV-26815 HighChart v9.x: label in x - Axis is different from v4
                    //delete chartOptions.legend.width;
                }
                //REPDEV-27316
                chartOptions.customSymbol && chartOptions.customSymbol.forEach(function (customSymbol) {
                    Highcharts.SVGRenderer.prototype.symbols[customSymbol.symbolKey] = function (x, y, w, h) { return eval(customSymbol.symbolPath); };
                });
            }
        },

        //FIXFOR-V9
        //Includes: 
        //1. REPDEV-26500 Chart title doesn't show in quick tip when hovering over chart
        //2. Issue 23756 Section 508 Accessibility for Canvas Charts, BUG 24681 'AltText' attribute lost.
        resetTitleAndDescElement: function (chart) {
            if (!this.checkNewHC()) return false;
            if (!chart || !chart.renderer) return false;

            //at any case remove HC's desc
            var descByHC = chart.renderer.box &&
                Highcharts.find(
                    [].slice.call(chart.renderer.box.childNodes),
                    function (elem) {
                        return elem.tagName == 'desc';
                    });
            descByHC && descByHC.parentNode.removeChild(descByHC);

            var descText = chart.userOptions.chart.altText;
            var titleText = (chart.userOptions.title && chart.userOptions.title.text) || descText;

            //REPDEV-26500 Chart title doesn't show in quick tip when hovering over chart
            titleText && chart.renderer.createElement('title')
                .add().element.appendChild(
                    document.createTextNode(titleText)
                );

            //REPDEV-26481 AltText Attribute doesn't work for chart canvas
            descText && chart.renderer.createElement('desc')
                .add().element.appendChild(
                    document.createTextNode(descText)
                );
        },

        //FIXFOR-V9
        //REPDEV-26471 : LOGIFIX21559_ChartCanvas-Input Selection Range: Action Referesh element causing JS error"Cannot read property 'x' of undefined"
        getSelectionRange: function (chart, e) {
            if (!this.checkNewHC()) {
                return e.selectionBox;
            }
            //FIXFOR-V9
            //REPDEV-26810 Highcharts v9-Zoom line chart in Dashboard throw error"Uncaught TypeError: Cannot read property 'min' of undefined"
            //REPDEV-26811 Highcharts v9-Zoom scatter chart in Dashboard throw errorchart"Uncaught TypeError: Cannot read property '0' of undefined"
            //REPDEV-26809 HighChart v9.x: In Dashboard, select line area on line chart, no filter action applied.
            var xMin = e.xAxis[0] && chart.xAxis[0].toPixels(e.xAxis[0].min),
                xMax = e.xAxis[0] && chart.xAxis[0].toPixels(e.xAxis[0].max),
                width = Math.abs(xMax - xMin),
                yMin = e.yAxis[0] && chart.yAxis[0].toPixels(e.yAxis[0].min),
                yMax = e.yAxis[0] && chart.yAxis[0].toPixels(e.yAxis[0].max),
                height = Math.abs(yMax - yMin),
                rect = { x: Math.min(xMin, xMax), y: Math.min(yMin, yMax), width: width, height: height };
            return rect;
        },

        //FIXFOR-V9
        //REPDEV-26531 Highcharts v9- The line color of Series.Area Range display wrong
        getZonesWithLineColor: function () {
            if (!this.checkNewHC()) return false;
            //overriding default HC function due to wrong behavior when lineColor and negativeColor is set.
            Highcharts.seriesTypes.line.prototype.getZonesGraphs = function (props) {
                this.zones.forEach(function (zone, i) {
                    var propset = [
                        'zone-graph-' + i,
                        'highcharts-graph highcharts-zone-graph-' + i + ' ' +
                        (zone.className || '')
                    ];
                    if (!this.chart.styledMode) {
                        propset.push((zone.color || this.options.lineColor || this.color), (zone.dashStyle || this.options.dashStyle));
                    }
                    props.push(propset);
                }, this);
                return props;
            }
        },

        //REPDEV-26670
        //HighChart v9.x: another Reset Zoom button displayed after zoom
        fixZoomButton: function () {
            Highcharts.Chart.prototype.showResetZoom = function () {
                var btn = Y.one(this.container).one('#customButton_ResetZoom');
                btn.setStyle("display", "");
                btn.setAttribute("collapsed-button", "False");
                if (LogiXML.features['touch']) {
                    btn.setStyle('display', '');
                }
                Highcharts.wrap(btn, 'destroy', function (base) {
                    this.setStyle("display", "none");
                    this.setAttribute("collapsed-button", "True");
                    base.call(this);
                })
                this.resetZoomButton = btn;
                //REPDEV-30031, throws error.
                btn.element = btn._node;
                Highcharts.fireEvent(this, 'afterShowResetZoom');
            }
        },
        //REPDEV-27310
        //HighChart v9.x, upgrade for GetImage
        wrapAddButton: function () {
            if (!this.checkNewHC() || !Highcharts.wrap || !this.once('wrapAddButton')) return false;
            Highcharts.wrap(Highcharts.Chart.prototype, 'addButton', function (base, btnOptions) {
                if (btnOptions.enabled === false || !this.renderer) { return; }
                var chart = this;
                var onclick = btnOptions.onclick,
                    attr = btnOptions.theme,
                    states = attr && attr.states,
                    hover = states && states.hover;
                //LOGIFIX, move the changes out of Highcharts.Chart.prototype.addButton
                if (onclick && typeof (onclick) == "string") {
                    var fBodyCopy = onclick.toString();
                    onclick = function () { eval(fBodyCopy); }
                    btnOptions.onclick = onclick;
                }
                if (attr) {
                    //REPDEV-20608 fix Border Thickness
                    if (attr.strokeWidth) { attr['stroke-width'] = attr.strokeWidth; }
                    //LOGIFIX , move the changes out of Highcharts.Chart.prototype.addButton
                    attr['stroke-linecap'] = 'round';
                    attr['pointer-events'] = 'auto';
                    //REPDEV-27310, compare to previous version, set the stroke value
                    attr['stroke'] = '#cccccc';
                }

                if (hover && hover.strokeWidth) {
                    hover['stroke-width'] = hover.strokeWidth;
                }
                 
                var allBtnOptions = chart.options.navigation.buttonOptions;
                if (!allBtnOptions.prevAlignState) {
                    allBtnOptions.prevAlignState = btnOptions.align;
                }
                if (!allBtnOptions.prevVerticalAlignState) {
                    allBtnOptions.prevVerticalAlignState = btnOptions.verticalAlign;
                }
                if (chart.buttonOffset === undefined || btnOptions.align !== allBtnOptions.prevAlignState ||
                    btnOptions.verticalAlign !== allBtnOptions.prevVerticalAlignState) {
                    chart.buttonOffset = 0;
                }

                base.call(this, btnOptions);

                var button = chart.exportSVGElements[chart.exportSVGElements.length - 2];
                var titleString = btnOptions.title || '';
                if (titleString !== "") {
                    var titleNode = button && button.element && button.element.getElementsByTagName('title')[0];
                    if (!titleNode) {
                        titleNode = Highcharts.doc.createElementNS('http://www.w3.org/2000/svg', 'title');
                        button.element.appendChild(titleNode);
                    }
                    var titleLines = titleString.split(/\/r\/n/gi)
                    for (var i = 0; i < titleLines.length; i++) {
                        titleNode.appendChild(Highcharts.doc.createTextNode(titleLines[i]));
                        if (i !== titleLines.length - 1) {
                            titleNode.appendChild(Highcharts.doc.createElement("br"))
                        }
                    }
                }
                button.element.id = btnOptions.id;
            })
        },
        fixGetChartHTML: function () {
            Highcharts.Chart.prototype.getChartHTML = function () {
                //REPDEV-27310, canceled this condition
                //if (this.styledMode) {
                //REPDEV-30287, for Studio's old IE CC Get Image button, not support CSS style
                if (!detectIE || !detectIE()) {
                    this.inlineStyles();
                }
                //}
                return this.container.innerHTML;
            }
        },
        //FIXFOR-V9
        //REPDEV-29842
        wrapSanitizeSVG: function () {
            if (!this.checkNewHC() || !Highcharts.wrap || !this.once('wrapSanitizeSVG')) return false;
            Highcharts.wrap(Highcharts.Chart.prototype, 'sanitizeSVG', function (base, svg, options) {
                //REPDEV-29909, refer to REPDEV-20694(REPDEV-20677), comments out .replace(/url\([^#]+#/g, 'url(#')
                //case: "cursor:url(rdTemplate/rdDashboard/rdCrossFilter.cur),auto;;cursor:url(http://localhost/rdWebbug/rdTemplate/rdDashboard/rdCrossFilter.cur), auto;transform:matrix(1, 0, 0, 1, 254, 71);webkit-transform:matrix(1, 0, 0, 1, 254, 71);" transform="translate(254,71)">
                //<text x="3" data-z-index="1" style="color:#363B42;" will be replaced by "cursor:url(#363B42;"
                //there are errors in such cases. prevent HC from modifying such urls.
                svg = svg.replace(/url(\([^#\(\)]+\))/g, 'rdNoReplaceUrl$1');
                svg = base.call(this, svg, options);
                //REPDEV-29842, comments out this line, same as what Logi did in HC4
                //.replace(/(fill|stroke)="rgba\(([ 0-9]+,[ 0-9]+,[ 0-9]+),([ 0-9\.]+)\)"/g, // eslint-disable-line max-len
                //    '$1="rgb($2)" $1-opacity="$3"')
                //replace back
                svg = svg.replace(/(fill)="rgb\(([0-9]+,[0-9]+,[0-9]+)\)" \1-opacity="([0-9\.]+)"/g,
                    '$1="rgba($2,$3)"')
                    //REPDEV-20694, replace back
                    .replace(/rdNoReplaceUrl(\([^#\(\)]+\))/g, 'url$1');
                return svg;
            })
        },
        //FIXFOR-V9
        //REPDEV-26861 Highcharts v9- The position of gauge label is not same with in HC4
        //Grabbed from HC4 (it's own custom implementation there)
        setLabelsRendering: function (chartOptions) {
            if (!this.checkNewHC() || !Highcharts.wrap) return false;
            if (!chartOptions ||
                !chartOptions.series ||
                !chartOptions.series[0] ||
                !chartOptions.labels ||
                !chartOptions.labels.items ||
                !chartOptions.labels.items.length ||
                !chartOptions.series[0].type == 'gauge') {
                return false;
            }
            //REPDEV - 26976
            //Highcharts v9 - The label of Gauge.Angular missing and throw error
            this.once('wrapPaneInit') && Highcharts.wrap(Highcharts.Pane.prototype, "init", function (base, options, chart) {
                base.call(this, options, chart);
                var pane = this,
                    each = Highcharts.each,
                    splat = Highcharts.splat,
                    merge = Highcharts.merge,
                    options = this.options;//getting default options from pane instance because explicit could be undefined.
                //Set default plotBand
                //Grabbed from HC4
                backgroundOption = options.background;

                // To avoid having weighty logic to place, update and remove the backgrounds,
                // push them to the first axis' plot bands and borrow the existing logic there.
                if (backgroundOption) {
                    each([].concat(splat(backgroundOption)).reverse(), function (config) {
                        var backgroundColor = config.backgroundColor; // if defined, replace the old one (specific for gradients)
                        config = merge(pane.defaultBackgroundOptions, config);
                        if (backgroundColor) {
                            config.backgroundColor = backgroundColor;
                        }
                        config.color = config.backgroundColor; // due to naming in plotBands
                        chart.options.yAxis[0].plotBands = chart.options.yAxis[0].plotBands || [];
                        chart.options.yAxis[0].plotBands.unshift(config);
                    });
                }

                if (options.scale) {
                    var scaleNum,
                        percentIndex = options.scale.indexOf("%");
                    if (percentIndex > -1) {
                        scaleNum = parseInt(options.scale.substring(0, percentIndex));
                        scaleNum = scaleNum / 100.0;
                    } else {
                        scaleNum = parseFloat(options.scale);
                    }
                    pane.options.scale = scaleNum;
                }
                return pane;
            });
            Highcharts.Chart.prototype.renderLabels = function () {
                var chart = this,
                    labels = chart.options.labels;
                var pInt = Highcharts.pInt,
                    pick = Highcharts.pick;
                if (labels.items) {
                    labels.items.forEach(function (label) {

                        var style = Highcharts.extend(labels.style, label.style);
                        var svgelemfont = chart.container.getElementsByTagName('svg')[0].style['font-family'];
                        if (!style.fontFamily) {
                            style.fontFamily = svgelemfont;
                        }
                        var x, y;

                        if (style.left.indexOf('%') > -1) {
                            x = chart.chartWidth * (pInt(style.left) / 100) - (LogiXML.layout.getTextDimensions(label.html, style).width / 2) + chart.plotLeft;
                        } else {
                            x = pInt(style.left) + chart.plotLeft;
                        }

                        if (style.top.indexOf('%') > -1) {
                            y = chart.plotHeight * (pInt(style.top) / 100) + (LogiXML.layout.getTextDimensions(label.html, style).height / 2) + chart.plotTop;
                        } else {
                            y = pInt(style.top) + chart.plotTop + 12;
                        }

                        if (chart.angular && chart.series[0].points[0]) {
                            var pointXCoord = chart.series[0].points[0].plotX;
                            var space = ((pInt(pick(chart.yAxis[0].options.plotBands[0].outerRadius, '100%'), 10) * chart.yAxis[0].center[2]) / 100) * 0.7;
                            var labelWidth = LogiXML.layout.getTextDimensions(label.html, style, 'chart-canvas-label').width;
                            if (labelWidth > space) {
                                var newText = label.html;
                                do {
                                    newText = newText.slice(0, -1);
                                    labelWidth = LogiXML.layout.getTextDimensions(newText + "...", style, 'chart-canvas-label').width;
                                } while (labelWidth >= space);
                                label.html = newText + "...";
                            }
                            x = pointXCoord - (LogiXML.layout.getTextDimensions(label.html, style, 'chart-canvas-label').width / 2) + chart.plotLeft;
                            y = chart.series[0].points[0].plotY - 8;
                            if (y < LogiXML.layout.getTextDimensions(label.html, style, 'chart-canvas-label').height) {
                                y = chart.series[0].points[0].plotY + LogiXML.layout.getTextDimensions(label.html, style, 'chart-canvas-label').height + 8
                            }
                            y += pInt(style.top);
                        }

                        // delete to prevent rewriting in IE
                        delete style.left;
                        delete style.top;
                        var attrs;
                        if (!chart.angular) {
                            attrs = { zIndex: 2 };
                        } else {
                            attrs = { zIndex: 2, class: 'chart-canvas-label' };
                        }

                        chart.renderer.text(
                            label.html,
                            x,
                            y
                        )
                            .attr(attrs)
                            .css(style)
                            .add();

                    });
                }
            }
        }

    });
LogiXML.ChartCanvas.trimLabelToLength ||
    (LogiXML.ChartCanvas.trimLabelToLength =
        //V4 comments,
        //LOGIFIX 21378 Max label length for pie / line series
        //FIXFOR-V9
        //REPDEV-26601-Maximum Label Length of canvas chart doesn't work.
        //trimLabelToLength: 
        function (str, length) {
            if (!str) {
                return null;
            } else if (!(typeof str == 'string' || str instanceof String)) {
                str = str.toString();
            }

            if (str.length <= length) {
                return str;
            }

            //is wrapped by 'div' tag?
            var patt = /<div[^>]*>(.*?)<\/div>/,
                inDiv = patt.test(str),
                brIndex, tmp;
            if (inDiv) {
                var matches = patt.exec(str);
                if (matches && matches.length >= 1) {
                    if (matches[1].length <= length) {
                        return str;
                    }
                    tmp = matches[1];
                    //br inside complex label
                    brIndex = tmp.indexOf("<br />");
                    if (brIndex != -1) {
                        tmp = tmp.replace("<br />", "");
                    }
                    if (tmp.length <= length) {
                        return str;
                    }
                    str = tmp;
                }
            }

            str = str.substring(0, length);
            // removing nbsp and space before the ellipsis
            while (str.endsWith(String.fromCharCode(160)) || str.endsWith(String.fromCharCode(" "))) {
                str = str.substring(0, str.length - 1);
            }

            //restore br
            if (inDiv && brIndex != -1 && (length > brIndex)) {
                str = str.substring(0, brIndex) + "<br />" + str.substring(brIndex);
            }

            if (inDiv) {
                return "<div>" + str + "...</div>";
            } else {
                return str + "...";
            }
        });
