function rdAcUpdateLabelsForGaugeNumber(sAcId, bIsNumberGauge) {
    var eleColorPicker = document.getElementById('rowGaugeMax_' + sAcId).querySelector('#colorPicker_rdAcGaugeMaxColor_' + sAcId);
    if (bIsNumberGauge) {
        document.getElementById('rowGaugeMax_' + sAcId).querySelector('#lblMaxValue').innerText = "Goal-3";
        eleColorPicker.alt = "Pick a color for Goal-3.";
        eleColorPicker.title = "Pick a color for Goal-3.";
    } else {
        document.getElementById('rowGaugeMax_' + sAcId).querySelector('#lblMaxValue').innerText = "Max";
        eleColorPicker.alt = "Pick a color for Max";
        eleColorPicker.title = "Pick a color for Max";
    }
    
}
function rdAcUpdateControls(bRefresh, sReport, sAcId, bInit, e) {
    rdAcRefresh(bRefresh, sReport, sAcId, null, bInit, e);
}

function rdAcRefresh(bRefresh, sReport, sAcId, sEditedAdditionalValues, bInit, e ) {
    var eleBatchSelection = document.getElementById('rowBatchSelection_' + sAcId)
    if (!eleBatchSelection && !bInit) {  //When not batch selection, update the visualization with every control change.
        bRefresh = true
    }

    var sCurrChartType = document.getElementById('rdAcChartType_'+sAcId).value
    //var sElementIDs = sAcId + ",cellAcChart_" + sAcId
    var sElementIDs = sAcId + ",divAcControls_" + sAcId + ",cellAcChart_" + sAcId

    var bForecast = false;
    if (document.getElementById('rdAcForecastType_' + sAcId) != null) bForecast = true;

    ShowElement(this.id, 'lblChartXLabelColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'lblChartXAxisColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'lblChartYDataColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'lblChartYAxisColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'lblChartSizeColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartSizeAggrLabel_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowChartXColumn_' + sAcId, 'Hide');
    //ShowElement(this.id, 'rowChartCrosstabColumn_' + sAcId, 'Hide');
    var arrCrosstabRows = rdAcHideShowAdditionalRowGroup(sAcId,'Hide')
    ShowElement(this.id, 'rdAcChartXLabelColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartXDataColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartYColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdChartYShowValues_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartYAggrLabel_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartYAggrList_' + sAcId, 'Hide');
    ShowElement(this.id, 'colLabelSort_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowChartExtraDataColumn_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowChartForecast_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowChartOrientation_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowChartRelevance_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowGaugeType_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowGaugeMin_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowGaugeGoal1_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowGaugeGoal2_' + sAcId, 'Hide');
    ShowElement(this.id, 'rowGaugeMax_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartExtraAggrListCompare_' + sAcId, 'Hide');

    rdAcUpdateLabelsForGaugeNumber(sAcId, false);

    //var eleCrosstab = document.getElementById('rdAcChartCrosstabColumn_' + sAcId)
    //var sCrosstabColumn = ''
    //if (eleCrosstab) {
    //    sCrosstabColumn = eleCrosstab.value
    //}
    var bCrosstabCombo = checkCombo(sAcId,arrCrosstabRows)
	switch (sCurrChartType) {
			case 'Pie':
			case 'Bar':
			    ShowElement(this.id, 'lblChartXLabelColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'lblChartYDataColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rowChartXColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartXLabelColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartYColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdChartYShowValues_' + sAcId, 'Show'); 
				ShowElement(this.id, 'rdAcChartYAggrLabel_'+sAcId,'Show');
				ShowElement(this.id, 'rdAcChartYAggrList_'+sAcId,'Show');

				if (sCurrChartType == "Bar") {
				    ShowElement(this.id, 'rowChartOrientation_' + sAcId, 'Show');
				}

                //Date GroupBy controls.
                rdAcGetGroupByDateOperatorDiv(document.getElementById('rdAcChartXLabelColumn_' + sAcId).value, sAcId);
                if (sCurrChartType == 'Pie' || sCurrChartType == '') {
                    document.getElementById('colGBDO_' + sAcId).style.display = 'none';
                    if (bForecast && document.getElementById('rowChartForecast_' + sAcId) != null) {
                        rdAcHideForecast(sAcId);
                    }
                } else {
                    if (bForecast) {
                        document.getElementById('rdAcForecastType_' + sAcId).style.display = '';
                        document.getElementById('rdAcChartForecastLabel_' + sAcId).style.display = ''
                        rdModifyTimeSeriesCycleLengthOptions(document.getElementById('rdAcChartsDateGroupBy_' + sAcId), sAcId);
                        rdSetForecastOptions(document.getElementById('rdAcChartXLabelColumn_' + sAcId).value, sAcId);
                        rdShowForecast(document.getElementById('rdAcChartXLabelColumn_' + sAcId).value, sAcId, bCrosstabCombo);
                    }
                }

            // Sort sequence control for Text axes for bar and Pie
		    var sLabelColumn = document.getElementById('rdAcChartXLabelColumn_' + sAcId).value
		    var sLabelColumnType = rdAcGetColumnDataType(sLabelColumn, sAcId);
            if (sLabelColumnType == "Text") {
                if (sCurrChartType == 'Bar' || sCurrChartType == 'Pie') {
                    ShowElement(this.id, 'colLabelSort_' + sAcId, 'Show');
                }
            }

		    //Relevance controls.
		    if (sLabelColumnType == "Text") {
		        //if (sCrosstabColumn == '' || sCurrChartType == 'Pie') {  //No relevance filter with crosstabbed bar charts.
                if (arrCrosstabRows.length <=1 || sCurrChartType == 'Pie') {
		            ShowElement(this.id, 'rowChartRelevance_' + sAcId, 'Show');
		            var sRelevanceType = document.getElementById('rdAcRelevanceType_' + sAcId).value
		            if (sRelevanceType == "None") {
		                ShowElement(this.id, 'rdAcRelevanceValue_' + sAcId, 'Hide');
		                ShowElement(this.id, 'lblShowOthers_' + sAcId, 'Hide');
		                ShowElement(this.id, 'rdAcRelevanceOther_' + sAcId, 'Hide');
                    } else {
		                ShowElement(this.id, 'rdAcRelevanceValue_' + sAcId, 'Show');
		                ShowElement(this.id, 'lblShowOthers_' + sAcId, 'Show');
		                ShowElement(this.id, 'rdAcRelevanceOther_' + sAcId, 'Show');
                    }
		        }
		    }

		    break;

	    case 'Line':
	    case 'Spline':
	        ShowElement(this.id, 'lblChartXAxisColumn_' + sAcId, 'Show');
	        ShowElement(this.id, 'lblChartYAxisColumn_' + sAcId, 'Show');
	        ShowElement(this.id, 'rowChartXColumn_' + sAcId, 'Show');
	        ShowElement(this.id, 'rdAcChartXDataColumn_' + sAcId, 'Show');
	        ShowElement(this.id, 'rdAcChartYColumn_' + sAcId, 'Show');
	        ShowElement(this.id, 'rdChartYShowValues_' + sAcId, 'Show');
	        rdAcShowLineAggrOptions(sAcId);

	        var sColumn = document.getElementById('rdAcChartXDataColumn_' + sAcId).value
	        var sDataColumnType = rdAcGetColumnDataType(sColumn, sAcId);

	        if (sDataColumnType.toLowerCase().indexOf("number") != -1 || sDataColumnType.toLowerCase().indexOf("date") != -1) {
	            if (sDataColumnType.toLowerCase().indexOf("date") != -1) {
	                var sDateTimeAggregation = document.getElementById('rdAcChartsDateGroupBy_' + sAcId).value
	                if (sDateTimeAggregation == '') {
	                    var eleYAggregationDropDown = document.getElementById('rdAcChartYAggrList_' + sAcId)
	                    var sYColumn = document.getElementById('rdAcChartYColumn_' + sAcId).value
	                    if (sYColumn != "") {
	                        var sYDataColumnType = rdAcGetColumnDataType(sYColumn, sAcId);
	                        if (eleYAggregationDropDown && sYDataColumnType.toLowerCase().indexOf("number") != -1) {
	                            eleYAggregationDropDown.value = "AVERAGE"
	                            ShowElement(this.id, 'rdAcChartYAggrList_' + sAcId, 'Hide');
	                        }
	                    }
	                }
	            }
	        }
	        
	        ShowElement(this.id, 'rowChartOrientation_' + sAcId, 'Hide');

	        if (bForecast) {
	            //if (document.getElementById('rdAcChartCrosstabColumn_' + sAcId) && document.getElementById('rdAcChartCrosstabColumn_' + sAcId).value != "") {
                if (arrCrosstabRows.length > 1) {
	                rdAcHideForecast(sAcId);
	            }
	            else
	            {
	                document.getElementById('rdAcForecastType_' + sAcId).style.display = '';
	                document.getElementById('rdAcChartForecastLabel_' + sAcId).style.display = ''
	                rdSetForecastOptions(document.getElementById('rdAcChartXDataColumn_' + sAcId).value, sAcId);
	                rdModifyTimeSeriesCycleLengthOptions(document.getElementById('rdAcChartsDateGroupBy_' + sAcId), sAcId);
                    rdShowForecast(sColumn, sAcId, bCrosstabCombo);
	            }	            
	        }
	        rdAcGetGroupByDateOperatorDiv(document.getElementById('rdAcChartXDataColumn_' + sAcId).value, sAcId);
	        break;


	    case 'Scatter':
				ShowElement(this.id, 'lblChartXAxisColumn_'+sAcId,'Show');
				ShowElement(this.id, 'lblChartYAxisColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rowChartXColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartXDataColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rdAcChartYColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rdChartYShowValues_' + sAcId, 'Show');
				ShowElement(this.id, 'rowChartForecast_' + sAcId, 'Show');
                
				var sColumn = document.getElementById('rdAcChartXDataColumn_' + sAcId).value
				var sDataColumnType = rdAcGetColumnDataType(sColumn, sAcId);

				////if(bForecast) rdAcHideForecast(sAcId);
				document.getElementById('colGBDO_'+sAcId).style.display = 'none';

                if (bForecast) {
                    document.getElementById('rdAcForecastType_' + sAcId).style.display = '';
                    document.getElementById('rdAcChartForecastLabel_' + sAcId).style.display = ''
                    var sColumn = document.getElementById('rdAcChartXDataColumn_' + sAcId).value;
                    rdSetForecastOptions(sColumn, sAcId);
                    rdShowForecast(sColumn, sAcId, bCrosstabCombo);
                }
				break;

			case 'Heatmap':
				ShowElement(this.id, 'lblChartXLabelColumn_'+sAcId,'Show');
				ShowElement(this.id, 'lblChartSizeColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rdAcChartSizeAggrLabel_'+sAcId,'Show');
				ShowElement(this.id, 'rowChartXColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartXLabelColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartYColumn_'+sAcId,'Show');
				ShowElement(this.id, 'rdAcChartYAggrList_'+sAcId,'Show');
				ShowElement(this.id, 'rowChartExtraDataColumn_'+sAcId,'Show');

				document.getElementById('colGBDO_'+sAcId).style.display = 'none';
				
				break;

	        case 'Gauge':
	            ShowElement(this.id,'lblChartYDataColumn_' + sAcId, 'Show');
				ShowElement(this.id,'rdAcChartYColumn_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartYAggrLabel_' + sAcId, 'Show');
				ShowElement(this.id, 'rdAcChartYAggrList_' + sAcId, 'Show');
				ShowElement(this.id, 'rowGaugeType_' + sAcId, 'Show');
				ShowElement(this.id, 'rowGaugeMin_' + sAcId, 'Show');
				ShowElement(this.id,'rowGaugeGoal1_' + sAcId, 'Show');
				ShowElement(this.id,'rowGaugeGoal2_' + sAcId, 'Show');
                ShowElement(this.id, 'rowGaugeMax_' + sAcId, 'Show');
                if (document.getElementById('rdAcGaugeType_' + sAcId).value == "Number") {
                    ShowElement(this.id, 'rowGaugeMin_' + sAcId, 'Hide');
                    rdAcUpdateLabelsForGaugeNumber(sAcId, true);
                }
				break;

    }

    //No forecast with Crosstab.
    //if (sCrosstabColumn != '') {
    if (arrCrosstabRows.length > 1) {
        //ShowElement(this.id, 'divMinusAdditional_' + sAcId, 'Show');
        rdAcHideShowAdditionalRowItems(sAcId, arrCrosstabRows, 'divMinusAdditional', 'Show')
        if (sCurrChartType == 'Bar' || sCurrChartType == 'Line') rdAcHideForecast(sAcId);
    }

    //ShowValues Percentage only for Pies.
	var eleShowValuesDropdown = document.getElementById("rdAcShowValues_" + sAcId)
	var eleNameDDOption = Y.one(eleShowValuesDropdown).one("[value=Name]");
	var elePercentDDOption = Y.one(eleShowValuesDropdown).one("[value=Percent]");
	if (sCurrChartType == "Pie") {//Remove 'Name"
	    eleNameDDOption && eleNameDDOption.setStyle("display", "none");
	    elePercentDDOption && elePercentDDOption.setStyle("display", "");
		if (eleShowValuesDropdown.value == "Name") {//REPDEV-29914
	        eleShowValuesDropdown.value = "";//set the value as "", as the Pie chart can't support show "Name"
		}		
	} else {//Remove "Percentage"
	    eleNameDDOption && eleNameDDOption.setStyle("display", "");
	    elePercentDDOption && elePercentDDOption.setStyle("display", "none");
		if (eleShowValuesDropdown.value == "Percent") {//REPDEV-29914
	        eleShowValuesDropdown.value = ""; //set the value as "", as these chart types can't support show "Percentage"
		}
	}

	var y1setting = document.getElementById("rdAcY1MoreSetting_" + sAcId);
	if (y1setting) {
	    //hide the Y1axis setting
	    if (sCurrChartType == "Pie" || sCurrChartType == "Gauge" || sCurrChartType == "Heatmap") {
	        y1setting.style.display = "none";
	    } else {
	        y1setting.style.display = "";
	    }
	}

	rdAcSetButtonStyle(sAcId,sCurrChartType,'Pie')
	rdAcSetButtonStyle(sAcId,sCurrChartType,'Bar')
	rdAcSetButtonStyle(sAcId,sCurrChartType,'Line')
	rdAcSetButtonStyle(sAcId,sCurrChartType,'Spline')
	rdAcSetButtonStyle(sAcId,sCurrChartType,'Scatter')
	rdAcSetButtonStyle(sAcId, sCurrChartType, 'Heatmap')
	rdAcSetButtonStyle(sAcId, sCurrChartType, 'Gauge')

    rdAcLoadDropdowns(sCurrChartType, sAcId, arrCrosstabRows);
    if (rdAcLoadDropdowns_changed) {
        rdAcUpdateControls(bRefresh, sReport, sAcId, bInit, e);
        return;
    }
	
	//fix for extra aggregation and series
    var refreshrows = []
    if (e) {
        var row = getCrosstabColumnRow(e);
        if (row) refreshrows.push(row);
    } else {
        refreshrows = arrCrosstabRows;
    }
    for (var i = 0; i < refreshrows.length; i++) {
        var row = refreshrows[i];
        var sSuffix = sGetCrosstabColumnIdSuffix(sAcId, row);
        if (row.style.display.toLowerCase() == "none") {
            //var crosstabColumnDD = document.getElementById("rdAcChartCrosstabColumn_" + sAcId + sSuffix);
            //crosstabColumnDD.value = '';
            rdAcRemoveAdditinalColumns(sAcId, row, sSuffix);
            continue;
        }

        var extraAggrDD = document.getElementById("rdAcChartExtraAggrListCompare_" + sAcId + sSuffix);
        if (extraAggrDD && extraAggrDD.style.display.toLowerCase() == "none") {
            extraAggrDD.value = "";
        }
        var stackingDD = document.getElementById("rdAcStacking_" + sAcId + sSuffix);
        if (stackingDD && stackingDD.style.display.toLowerCase() == "none") {
            stackingDD.value = "";
        }
        rdAcSetAdditinalColumns(sAcId, row);
    }

    var forecastRow = document.getElementById("rowChartForecast_" + sAcId);
    if (forecastRow && forecastRow.style.display.toLowerCase() == "none") {
        var forecastTypeDD = document.getElementById("rdAcForecastType_" + sAcId);
        forecastTypeDD.value = "none";
    }

    if (bRefresh) {
        //Refresh the aggregation type lists.
        sElementIDs += ',lblHeadingAnalChart_' + sAcId;  //This is the AG's panel heading, when running AG.
        var sAjaxUrl = "rdAjaxCommand=RefreshElement&rdAcRefresh=True&rdRefreshElementID=" + sElementIDs + '&rdReport=' + sReport + '&rdAcId=' + sAcId;
        sAjaxUrl = sAjaxUrl + '&rdAcNewCommand=True';
        if (sEditedAdditionalValues) {
            sAjaxUrl += "&" + "rdAc_EditedAdditionalValues_" + sAcId + "=" + sEditedAdditionalValues;
        }

        //Parse out WaitPage configuration
        var waitCfg = ['', '', '']
        var eleWaitCfg = document.getElementById("rdWaitCfg")
        if (eleWaitCfg) {
            try {
                var sScript = LogiXML.getScriptFromLink(eleWaitCfg.parentElement)
                sScript = sScript.substr(sScript.indexOf("["))
                var waitCfgv = eval(sScript.substr(0, sScript.indexOf("]") + 1))
                if (typeof waitCfgv !== 'undefined') waitCfg = waitCfgv;
            }
            catch (e) { }
        }
        waitCfg.timeout = 1;//REPDEV-28806, show wait panel immediately
        rdAjaxRequestWithFormVars(sAjaxUrl, 'false', '', true, null, null, waitCfg);
	}
}

this.RdAdditionalAxisPopup || (
    this.RdAdditionalAxisPopup =
    {
        showHideElementsMap: {
            Pie: {
                "rdAxisSettingTab": "Hide",
                "rowLabel_FontAngle": "Hide",
                "rowLabel_FontItalic": "Show",
                "rowLabel_FontColor": "Show"
            },
            Heatmap: {
                "rdAxisSettingTab": "Hide",
                "rowLabel_FontAngle": "Hide",
                "rowLabel_FontItalic": "Hide",
                "rowLabel_FontColor": "Hide"
            },
            default: {
                "rdAxisSettingTab": "Show",
                "rowLabel_FontAngle": "Show",
                "rowLabel_FontItalic": "Show",
                "rowLabel_FontColor": "Show"
            }
        },
        axesDataTypeMap: {
            "X": function () {
                var eleDataColumn = Y.one("#rdAcChartXDataColumn_" + this.callerChartId + ":not([style*='display: none;']), #rdAcChartXLabelColumn_" + this.callerChartId + ":not([style*='display: none;'])");
                return rdAcGetColumnDataType(eleDataColumn.get("value"), this.callerChartId);
            },
            "Y1": function () {
                return "Number";
            },
            "Y2": function () {
                /*In case we have non-numeric Y columns
                 * we need to pass pointer to element caused this call
                 * and get row index to get column dropdown
                //more complicated.
                //We need to get input dropdown with ID = rdAcChartCrosstabColumn_{this.callerChartId}_{suffix} in the same row where caller Format link was being pressed
                var row = getCrosstabColumnRow(this.callerElement);
                var sSuffix = sGetCrosstabColumnIdSuffix(this.callerChartId, row);
                return Y.one("#rdAcChartCrosstabColumn_" + this.callerChartId + sSuffix);*/
                return "Number"
            }
        },
        callerChartId: null,
        callerAxisLocation: null,
        callerReportId: null,
        serverValuesElem: null,
        sCurrChartType: null,
        editedValues: null,
        getInputsIdSelector: function (inputId) {
            return "#rdPopupPanelTable_rdAxisSettingPopup input[id ^= '" + inputId + "'],#rdPopupPanelTable_rdAxisSettingPopup select[id ^= '" + inputId + "']"
        },
        getFormatDDSelector: function (axisType) {
            return "#rdAxisSettingPopup input[id ^= 'AxisLabelStyle_Format_" + axisType + "']";
        },
        showSettingsPopup: function (axisLocation, chartId, reportId) {
            this.cleanup();
            this.callerReportId = reportId || document.getElementById("rdAgReportId").value;
            this.callerAxisLocation = axisLocation;
            this.callerChartId = chartId;
            var serverValuesId = "rdAc_ServerAdditionalValues_" + this.callerChartId;
            this.serverValuesElem = document.getElementById(serverValuesId);
            this.sCurrChartType = document.getElementById('rdAcChartType_' + this.callerChartId).value;
            if (!this.serverValuesElem || !this.sCurrChartType) {
                this.cleanup();
                return false;
            }
            this.valuesToInputs();
            this.setPopupCaption();
            this.hideInputsBasedOnType();
            this.hideShowFormatDropDowns();
            ShowElement(null, 'rdAxisSettingPopup', 'Show');
        },
        valuesToInputs: function () {
            if (!this.callerAxisLocation || !this.serverValuesElem || this.serverValuesElem.value == "") return false;
            var valuesObj = JSON.parse(this.serverValuesElem.value);
            var currentAxisValuesObj = valuesObj[this.callerAxisLocation];
            if (!currentAxisValuesObj) return false;
            Object.keys(currentAxisValuesObj).forEach(function (captionOrLabelKey) {
                Object.keys(currentAxisValuesObj[captionOrLabelKey]).forEach(function (propName) {
                    var inputId = captionOrLabelKey + "_" + propName;
                    var inputElements = Y.all(this.RdAdditionalAxisPopup.getInputsIdSelector(inputId));
                    var value = currentAxisValuesObj[captionOrLabelKey][propName];
                    (value !== "") && inputElements && inputElements.each(function (inputElem) {
                            (inputElem.hasClass("colorpicker-element") && LogiXML.AnalysisGrid.rdSetPickerColor(inputElem.get("id"), value)) ||
                            inputElem.set("value", value);
                    });
                })
            });
            return true;
        },
        setPopupCaption: function () {
            var captionHolerElem = document.getElementById("rdPopupAxisCaption_" + this.callerAxisLocation);
            var captionText = (captionHolerElem && captionHolerElem.innerText) || "Format";
            var popupCaptionNode = Y.one("#rdAxisSettingPopup span.rdPopupPanelTitleCaption");
            popupCaptionNode.set('innerText', captionText);
        },
        hideInputsBasedOnType: function () {
            var visibilityMap = this.showHideElementsMap[this.sCurrChartType] || this.showHideElementsMap["default"];
            Object.keys(visibilityMap).forEach(function (key) {
                ShowElement(null, key, visibilityMap[key]);
            });
            LogiXML.AnalysisGrid.selectPropertiesTab(["Pie", "Heatmap"].indexOf(this.sCurrChartType) > -1 ? 'LabelProperties' : 'CaptionProperties');
            return true;
        },
        hideShowFormatDropDowns: function () {
            Y.all(this.getFormatDDSelector("")).each(function (node) {
                ShowElement(null, node.get("id"), "Hide");
                ShowElement(null, node.ancestor("td").get("id"), "Hide");
            });
            var axisDataType = this.axesDataTypeMap[this.callerAxisLocation].call(this);
            var currentFormatDD = Y.one(this.getFormatDDSelector(axisDataType));
            ShowElement(null, currentFormatDD.get("id"), "Show");
            ShowElement(null, currentFormatDD.ancestor("td").get("id"), "Show");
        },
        addEditedValue: function (inputPointer) {
            var inputElem = Y.one(inputPointer) || inputPointer.input || inputPointer._inputNode;//second is for colorPicker, third is for fontfamily
            if (!inputElem) return false;
            this.editedValues = this.editedValues || {};
            var axisSettings = this.editedValues[this.callerAxisLocation] = this.editedValues[this.callerAxisLocation] || {};
            var inputId = inputElem.get("id");
            //var inputValue = inputElem.get("value") || (inputElem.ac && inputElem.ac.get("value"));//for autocompletebox (format)
            //REPDEV-28243 Caption Content of the chart Axis can not empty
            //When the user delete the Input element's value, the inputValue will be undefined.
            var inputValue = (inputElem.ac && inputElem.ac.get("value")) || inputElem.get("value");//for autocompletebox (format)
            var keysArr = inputId.split("_")//not good but...
            axisSettings[keysArr[0]] = axisSettings[keysArr[0]] || {};
            axisSettings[keysArr[0]][keysArr[1]] = inputValue;
        },
        sendEditedValuesAndRefresh: function () {
            if (this.editedValues == null) {
                this.cleanup();
                return;//nothing to change
            }
            var sAcId = this.callerChartId;
            var eleBatchSelection = document.getElementById('rowBatchSelection_' + sAcId);
            var currCfgStr = JSON.stringify(this.editedValues);
            if (eleBatchSelection) {
                //REPDEV-28012 When no chart, the additional column is missed after set the format of the Additional column
                rdAcRefresh(true, this.callerReportId, sAcId, currCfgStr);
                this.cleanup();
                return;
            }
            var sElementIDs = sAcId + ",divAcControls_" + sAcId + ",cellAcChart_" + sAcId
            //Refresh the aggregation type lists.
            sElementIDs += ',lblHeadingAnalChart_' + sAcId;  //This is the AG's panel heading, when running AG.
            var sAjaxUrl = "rdAjaxCommand=RefreshElement&rdAcRefresh=True&rdRefreshElementID=" + sElementIDs + '&rdReport=' + this.callerReportId + '&rdAcId=' + sAcId;
            sAjaxUrl = sAjaxUrl + '&rdAcNewCommand=True';
            var currCfgStr = JSON.stringify(this.editedValues);
            //var eleEditedSettingValues = document.getElementById("rdAc_ServerAdditionalValues_" + sAcId); //don't store it in hiddenInput to prevent passing unintentionaly and support back action.
            //eleEditedSettingValues.value = currCfgStr;
            sAjaxUrl += "&" + "rdAc_EditedAdditionalValues_" + sAcId + "=" + currCfgStr;
            //REPDEV-28307 The format of label column will lost when change relevance of chart
            //REPDEV-28308 AG Chart edit format, then change data column Function for the first time, all format settings are lost
            sAjaxUrl += "&rdAcChartType=" +this.sCurrChartType;
            //sAjaxUrl += rdGetInputValues(eleAxisSettingValues, false);//false means no encoding. Maybe we'll need it.
            this.cleanup();
            //Parse out WaitPage configuration
            var waitCfg = ['', '', '']
            var eleWaitCfg = document.getElementById("rdWaitCfg")
            if (eleWaitCfg) {
                try {
                    var sScript = eleWaitCfg.parentElement.href
                    sScript = sScript.substr(sScript.indexOf("["))
                    waitCfg = eval(sScript.substr(0, sScript.indexOf("]") + 1))
                }
                catch (e) { }
            }
            var inpDefInDataCache = Y.one("#rdDefInDataCache")
            if (inpDefInDataCache && inpDefInDataCache.get('value') == "True") {
                sAjaxUrl += "&rdDefInDataCache=True";
            }
            rdAjaxRequest(sAjaxUrl, 'false', '', null, null, null, waitCfg);//avoid 'withformvars' to have less parameters passing
        },
        cleanup: function () {
            Y.all("#rdPopupPanelTable_rdAxisSettingPopup input,#rdPopupPanelTable_rdAxisSettingPopup select").each(function (node) {
                node.set("value", "");
            });
            this.callerChartId =
                this.callerAxisLocation =
                this.callerReportId =
                this.serverValuesElem =
                this.sCurrChartType =
                this.editedValues = null;
        },
        rdAcShowHiddenY2AxisSetting: function (sAcId, sSuffix, bshow) {
            var rowId = "rowChartCrosstabColumn_" + sAcId + sSuffix;
            var y2Setting = Y.all('#' + rowId + " td#rdAcY2MoreSetting_" + sAcId)._nodes
            if (y2Setting && y2Setting.length > 0) {
                if (bshow) {
                    y2Setting[0].style.display = "";
                } else {
                    y2Setting[0].style.display = "none";
                }
            }
        }
    }
);

function rdHideShowComboAggregationDropDown(bShow, sAcId, sSuffix, majorID)
{
    if (bShow) {
        var stackingType = document.getElementById('rdAcStacking_' + sAcId + sSuffix).value;
        if (stackingType == "") {
            rdAcSetAvailableStacking(sAcId, "rdAcChartCrosstabColumn", "rdAcStacking", null, sSuffix);
            stackingType = document.getElementById('rdAcStacking_' + sAcId + sSuffix).value;
        }
        /*if (stackingType.indexOf("Combo_") == -1) {
            bShow = false;
        }*/
        else
        {
            rdSetOrientationToVerticalIfLine(sAcId);
        }
        var extraStackingType = document.getElementById('rdAcChartYAggrList_' + sAcId);
        if (extraStackingType && extraStackingType.style.display == "none") {
            bShow = false;
        }
    }


    //Get the data type for the selected column
    var eleCrosstabColumn = document.getElementById("rdAcChartCrosstabColumn" + '_' + sAcId + sSuffix)
    if (eleCrosstabColumn.value != "") {
        var sCrosstabColumn = eleCrosstabColumn.value
        var sCrosstabDataType = rdAcGetColumnDataType(eleCrosstabColumn.value, sAcId)
        if (sCrosstabDataType == "Text") {
            //If a Text column has NoAggregates, don't show the Aggregate options.
            var eleNoAggrColumns = document.getElementById("rdAcNoAggregatesColumns_" + sAcId)
            var eleNoAggrColumns = eleNoAggrColumns.value.split(",")
            if (eleNoAggrColumns.indexOf(sCrosstabColumn) != -1) {
                var eleCrosstabAggr = document.getElementById("rdAcChartExtraAggrListCompare" + '_' + sAcId + sSuffix)
                eleCrosstabAggr.value = ""
                bShow = false
            }
        }
    }


    if (bShow) {
        ShowElement(majorID, 'rdAcChartExtraAggrListCompare_' + sAcId + sSuffix, 'Show');
    } else {
        ShowElement(majorID, 'rdAcChartExtraAggrListCompare_' + sAcId + sSuffix, 'Hide');
        document.getElementById('rdAcChartExtraAggrListCompare_' + sAcId + sSuffix).value = ""
    }
}

function rdAcShowAddToDashboard(sAcId) {
    if (typeof LogiXML.AnalysisGrid.rdAgToggleChartPanel === "function") {
        //Under the AnalysisGrid
        var eleAddToDashboard = document.getElementById("colAnalChartAddDashboard_" + sAcId)
        if (eleAddToDashboard) {
            eleAddToDashboard.style.display = ''
        }
    } else {
        //Under the AC.
        var eleAddToDashboard = document.getElementById("divAddToDashboardPanel_" + sAcId)
        if (eleAddToDashboard) {
            eleAddToDashboard.style.display = ''
        }
    }
}

var rdAcLoadDropdowns_changed;
function rdAcLoadDropdowns(sCurrChartType, sAcId, arrCrosstabRows) {
    rdAcLoadDropdowns_changed = false;

    //These column dropdowns are set dynamically, client-side, based on chart type and data type.
    if (sCurrChartType == 'Pie' || sCurrChartType == 'Heatmap') {
        rdAcSetDropdownColumns(sAcId, "rdAcChartXLabelColumn", "Text,Boolean", null , "NoGrouping")
    } else {
        rdAcSetDropdownColumns(sAcId, "rdAcChartXLabelColumn", "Text,Date,DateTime,Boolean", null , "NoGrouping")
    }

    if (sCurrChartType == 'Scatter') {
        rdAcSetDropdownColumns(sAcId, "rdAcChartYColumn", "Number")
    } else if (sCurrChartType == 'Line' || sCurrChartType == 'Spline') {
        var bHaveXAggregation = false;
        var sColumn = document.getElementById('rdAcChartXDataColumn_' + sAcId).value
        var sDataColumnType = rdAcGetColumnDataType(sColumn, sAcId);
        var sDateTimeAggregation = document.getElementById('rdAcChartsDateGroupBy_' + sAcId).value
        if (sDataColumnType.toLowerCase().indexOf("date") != -1 && sDateTimeAggregation != '')
            //There's date grouping, so text columns are allowed as long as don't have NoAggregates.  (Text columns act like numeric when aggregated with "count".)
            rdAcSetDropdownColumns(sAcId, "rdAcChartYColumn", "Text,Number", null, "NoAggregates")
        else
            rdAcSetDropdownColumns(sAcId, "rdAcChartYColumn", "Number")
    } else {
        rdAcSetDropdownColumns(sAcId, "rdAcChartYColumn", "Text,Boolean,Number", null, "NoAggregates")
    }

    //Crosstab Column
    //var eleCrosstabColumn = document.getElementById('rdAcChartCrosstabColumn_' + sAcId)
    //if (eleCrosstabColumn) {
    if (arrCrosstabRows.length > 0) {
        var bXAxisGrouping = false
        if (sCurrChartType == 'Bar') {
            bXAxisGrouping = true
        } else if (sCurrChartType == 'Line' || sCurrChartType == 'Spline') {
            var eleDateGroupByDropdown = document.getElementById('rdAcChartsDateGroupBy_' + sAcId);
            if (eleDateGroupByDropdown.style.display != "none") {
                if (eleDateGroupByDropdown.value != "") {
                    bXAxisGrouping = true
                }
            }
        }
        var eleAcMultiAdditionalColumn = document.getElementById('rdACMultiAdditionColumns');
        var disableMultiAdditionalColumn = false;
        if (eleAcMultiAdditionalColumn && eleAcMultiAdditionalColumn.value == 'False' && arrCrosstabRows.length >= 2) {
            disableMultiAdditionalColumn = true;
        }
        var bShowY2AxisSetting = true;
        var lastIdx = arrCrosstabRows.length - 1;
        for (inext = 0; inext <= lastIdx; inext++) {
            var row = arrCrosstabRows[inext];
            var sSuffix = sGetCrosstabColumnIdSuffix(sAcId, row);
            var eleCrosstabColumn = document.getElementById('rdAcChartCrosstabColumn_' + sAcId + sSuffix);
            if (sCurrChartType == 'Bar' || sCurrChartType == 'Line' || sCurrChartType == 'Spline' || sCurrChartType == 'Scatter') {

                rdAcSetDropdownColumns(sAcId, "rdAcChartCrosstabColumn", "Number,Text,Boolean", true, "NoCompare", sSuffix)
                if (bXAxisGrouping) {
                    //Remove some columns for bar charts and date-grouped line charts.
                    var nlOptions = Y.all('#rdAcChartCrosstabColumn_' + sAcId + sSuffix + " OPTION")._nodes
                    for (var i = nlOptions.length - 1; i >= 0; i--) {
                        var eleOption = nlOptions[i]
                        if (eleOption.value != "") {
                            var sColumn = eleOption.value
                            var sDataType = rdAcGetColumnDataType(eleOption.value, sAcId)
                            if (sDataType == "Text" || sDataType == "Boolean") {
                                //Remove text columns with NoGrouping
                                var eleNoGroupingColumns = document.getElementById("rdAcNoGroupingColumns_" + sAcId)
                                var aNoGroupingColumns = eleNoGroupingColumns.value.split(",")
                                if (aNoGroupingColumns.indexOf(sColumn) != -1) {
                                    eleOption.parentNode.removeChild(eleOption)
                                }
                            } else if (sDataType == "Number") {
                                //Remove number columns with NoAggregates
                                var eleNoAggrColumns = document.getElementById("rdAcNoAggregatesColumns_" + sAcId)
                                var eleNoAggrColumns = eleNoAggrColumns.value.split(",")
                                if (eleNoAggrColumns.indexOf(sColumn) != -1) {
                                    eleOption.parentNode.removeChild(eleOption)
                                }
                            }
                        }
                    }

                }
            }
            else {
                //Show no columns in the dropdown, Crosstab not available.
                rdAcSetDropdownColumns(sAcId, "rdAcChartCrosstabColumn", "(none)", null, null, sSuffix)
            }


            //Show or Hide.
            if (disableMultiAdditionalColumn && inext == lastIdx) {//Only hide the last "blank" row for REPDEV-28119 on/off flag for Charts Additional Columns
                ShowElement(this.id, 'rowChartCrosstabColumn_' + sAcId + sSuffix, 'Hide');
            }else{
            if (eleCrosstabColumn.options.length > 1) {  //Hide when no column options.
                ShowElement(this.id, 'rowChartCrosstabColumn_' + sAcId+sSuffix, 'Show');
                if (eleCrosstabColumn.value == '') {
                    ShowElement(this.id, 'rdAcStacking_' + sAcId + sSuffix, 'Hide');
                    rdHideShowComboAggregationDropDown(false, sAcId, sSuffix, this.id);
                    ShowElement(this.id, 'rdAcAxisType_' + sAcId + sSuffix, 'Hide');
                    ShowElement(this.id, 'divMinusAdditional_' + sAcId + sSuffix, 'Hide');
                    RdAdditionalAxisPopup.rdAcShowHiddenY2AxisSetting(sAcId, sSuffix, false);
                    ShowElement(this.id, 'rdAcCrosstabShowValues_' + sAcId + sSuffix, 'Hide');
                } else {
                    ShowElement(this.id, 'rdAcStacking_' + sAcId + sSuffix, 'Show');
                    rdHideShowComboAggregationDropDown(true, sAcId, sSuffix, this.id);
                    var stackingTypeElem = document.getElementById('rdAcStacking_' + sAcId + sSuffix);
                    var vStacking;
                    if (stackingTypeElem) {
                        vStacking = stackingTypeElem.value;
                    }
                    //ShowElement(this.id, 'rdAcAxisType_' + sAcId, (stackingTypeElem && stackingTypeElem.value && stackingTypeElem.value.indexOf("Combo_") != -1) ? 'Show' : 'Hide');
                    var sshowhide = (vStacking && vStacking.indexOf("Combo_") != -1) ? 'Show' : 'Hide'; 
                    ShowElement(this.id, 'rdAcAxisType_' + sAcId + sSuffix, sshowhide);
                    rdAcHideRowCell('rdAcAxisType_' + sAcId + sSuffix, sshowhide)
                    ShowElement(this.id, 'rdAcCrosstabShowValues_' + sAcId + sSuffix, sshowhide);

                    //change the Y2 more setting disply status according to the dualAxes/singleaxis
                    //only the first dual axes additional column display the setting icon
                    if (bShowY2AxisSetting && sshowhide == "Show") {
                        var axisType = document.getElementById('rdAcAxisType_' + sAcId + sSuffix).value//get the axis type
                        if (axisType == "DualAxes") {
                            RdAdditionalAxisPopup.rdAcShowHiddenY2AxisSetting(sAcId, sSuffix, true);
                            bShowY2AxisSetting = false;
                        } else {
                            RdAdditionalAxisPopup.rdAcShowHiddenY2AxisSetting(sAcId, sSuffix, false);
                        }
                    } else {
                        RdAdditionalAxisPopup.rdAcShowHiddenY2AxisSetting(sAcId, sSuffix, false);
                    }
                }
            }
            if (row.style.display.toLowerCase() == "none") rdAcRemoveAdditinalColumns(sAcId, row, sSuffix);
        }
            rdAcSetDropdownAggrs(sAcId, "rdAcChartExtraAggrListCompare", "rdAcChartCrosstabColumn", sCurrChartType, true, sSuffix)
            rdAcSetAvailableStacking(sAcId, "rdAcChartCrosstabColumn", "rdAcStacking", sCurrChartType, sSuffix);
        }

    }

    //Set the available aggregation types, depending on data types.
    rdAcSetDropdownAggrs(sAcId, "rdAcChartYAggrList", "rdAcChartYColumn", null, false)
    rdAcSetDropdownAggrs(sAcId, "rdAcChartExtraAggrList", "rdAcChartExtraDataColumn", null, false)

    //REPDEV-22549 overwrites the comment below. As a result, the entire block that was initially added has been commented out instead of deleted for future reference.
    //No Crosstab with Y-axis Min nor Max aggregations.  REPDEV-12923
    //var eleAggrSelect = document.getElementById("rdAcChartYAggrList_" + sAcId)
    //var sSelectedAggr = eleAggrSelect.value
    //if (eleAggrSelect.style.display == "none") {sSelectedAggr = ""}
    //if (sSelectedAggr == "MIN" || sSelectedAggr == "MAX") {
    //    var eleCrosstab = document.getElementById('rdAcChartCrosstabColumn_' + sAcId)
    //    eleCrosstab.value = ""
    //    ShowElement(this.id, 'rowChartCrosstabColumn_' + sAcId, 'Hide');
    //} else {
    //} 
}

function rdAcHideRowCell(childid, sHideShow) {
    var cell = getRowCell(document.getElementById(childid))
    if (!cell) return;
    if (sHideShow == 'Hide') cell.style.display = 'none';
    else cell.style.display = '';
}
function getRowCell(oChild) {
    if (!oChild) return null;
    var p = oChild.parentNode
    while (p) {
        if (p.tagName == 'TD') return p;
        p = p.parentNode
    }
    return null;
}
function rdAcSetDropdownColumns(sAcId, sSelectID, sDataTypes, bAddEmptyValue, sExcludeAttribute, sIdSuffix) {
        //Remove all existing columns.
    if (!sIdSuffix) { sIdSuffix = ""; }
    var eleSelect = document.getElementById(sSelectID + '_' + sAcId + sIdSuffix)
        if (!eleSelect) {
            return;
        }
        //Save the selected value.
        var sSelectedValue = eleSelect.value

        //Strip out the exsiting options.  These may be OPTIONs or OPTGROUPs
    var findblank = false;
        for (var i = eleSelect.childNodes.length - 1; i>=0; i--) {
            var eleColumn = eleSelect.childNodes[i]
            if (eleColumn.tagName == "OPTION" || eleColumn.tagName == "OPTGROUP") {
                if (bAddEmptyValue && eleColumn.tagName == "OPTION" && eleColumn.value == "") {
                    findblank = true;
                    continue;  //Leave the empty/blank option.
                }
                eleSelect.removeChild(eleColumn)
            }
        }
    if (bAddEmptyValue && !findblank) {
        var eleColumn = document.createElement("option");
        eleSelect.appendChild(eleColumn);
    }

        //Add all the columns.
        var eleAllColumns = document.getElementById('rdAcAllColumnsHidden_' + sAcId)
        for (var i = 0; i < eleAllColumns.childNodes.length; i++) {
            var eleColumn = eleAllColumns.childNodes[i]
            if (eleColumn.tagName == "OPTION" || eleColumn.tagName == "OPTGROUP") {
                eleSelect.appendChild(eleColumn.cloneNode(true))
            }
        }

        //Remove the OPTIONS that don't belong.
        var aExcludeColumns = "".split(",")
        if (sExcludeAttribute) {
            var eleExcludeColumns = document.getElementById("rdAc" + sExcludeAttribute + "Columns_" + sAcId)
            aExcludeColumns = eleExcludeColumns.value.split(",")
        }

        var nlOptions = Y.all('#' + sSelectID + '_' + sAcId + sIdSuffix + " OPTION")._nodes  
        for (var i = nlOptions.length - 1; i >= 0; i--) {
            var eleOption = nlOptions[i]
            if (eleOption.value != "") {
                var sDataType = rdAcGetColumnDataType(eleOption.value, sAcId)
                if (sDataTypes.indexOf(sDataType) == -1) {
                    eleOption.parentNode.removeChild(eleOption)
                } else if (aExcludeColumns.indexOf(eleOption.value) != -1) {
                    eleOption.parentNode.removeChild(eleOption)
                }
            }
        }

        //Remove any OPTGROUPS without children.
        var nlOptgroups = Y.all('#' + sSelectID + '_' + sAcId + sIdSuffix+ " OPTGROUP")._nodes
        for (var i = nlOptgroups.length - 1; i >= 0; i--) {
            var eleOptgroup= nlOptgroups[i]
            if (eleOptgroup.getElementsByTagName("OPTION").length == 0) {
                eleOptgroup.parentNode.removeChild(eleOptgroup)
            }
        }
        
        //Reselect the previous value, or the first. (need to make sure there is at least one)
        eleSelect.value = sSelectedValue
        if (!bAddEmptyValue && eleSelect.value == "" && eleSelect.options[0]) {
            eleSelect.value = eleSelect.options[0].value 
            rdAcLoadDropdowns_changed = true;
        }
    }


function rdAcSetDropdownAggrs(sAcId, sAggrSelectID, sColumnSelectID, sCurrentChartType, allowBlank, sIdSuffix) {
    //Remove all existing aggrs.
    if (!sIdSuffix) { sIdSuffix = ""}
    var eleAggrSelect = document.getElementById(sAggrSelectID + '_' + sAcId + sIdSuffix)
    if (!eleAggrSelect) {
        return;
    }
    var sSelectedAggr = eleAggrSelect.value
    for (var i = eleAggrSelect.childNodes.length - 1; i >= 0; i--) {
        var eleAggr = eleAggrSelect.childNodes[i]
        if (eleAggr.tagName == "OPTION") {
            eleAggrSelect.removeChild(eleAggr)
        }
    }

    //Get the data type for the selected column
    var eleDataColumn = document.getElementById(sColumnSelectID + '_' + sAcId + sIdSuffix)
    var sDataType = rdAcGetColumnDataType(eleDataColumn.value, sAcId)

    //Add the aggregations that belong.
    var eleAllAggrs = document.getElementById('rdAcAllAggrsHidden_' + sAcId)
    for (var i = 0; i < eleAllAggrs.childNodes.length; i++) {
        var eleAggr = eleAllAggrs.childNodes[i]
        if (eleAggr.tagName == "OPTION") {
            if (sDataType == "Number") {
                if (eleAggr.value != "") {
                    eleAggrSelect.appendChild(eleAggr.cloneNode(true));
                }
            } else {
                if (eleAggr.value.toLowerCase().indexOf("count") != -1 || (eleAggr.value == "" && sCurrentChartType != "Scatter" && allowBlank)) {
                    eleAggrSelect.appendChild(eleAggr.cloneNode(true));

                }
            }
            /*if ((sDataType == "Number" && eleAggr.value != "") || eleAggr.value.toLowerCase().indexOf("count") != -1 || (sDataType != "Number" && eleAggr.value == "")) {
                //All aggregates for Numbers.  Other data types get Count and DistinctCount.
                eleAggrSelect.appendChild(eleAggr.cloneNode(true))
            }*/
        }
    }


    //Reselect the previous value, or the first.
    eleAggrSelect.value = sSelectedAggr
    if (eleAggrSelect.value == "") {
        eleAggrSelect.value = eleAggrSelect.options[0].value
    }

}

function rdAcSetAvailableStacking(sAcId, sCompareColumnDDId, sStackingDDID, sChartType, sSuffix) {
    var eleAggrSelect = document.getElementById(sStackingDDID + '_' + sAcId + sSuffix)
    if (!eleAggrSelect) {
        return;
    }
    var sSelectedAggr = eleAggrSelect.value
    for (var i = eleAggrSelect.childNodes.length - 1; i >= 0; i--) {
        var eleAggr = eleAggrSelect.childNodes[i]
        if (eleAggr.tagName == "OPTION") {
            eleAggrSelect.removeChild(eleAggr)
        }
    }

    //Get the data type for the selected column
    var eleDataColumn = document.getElementById(sCompareColumnDDId + '_' + sAcId + sSuffix)
    if (eleDataColumn.value == "") {
        return;
    }
    var sDataType = rdAcGetColumnDataType(eleDataColumn.value, sAcId)
    var eleAggrDD = document.getElementById("rdAcChartExtraAggrListCompare" + '_' + sAcId + sSuffix)
    var vAgg = eleAggrDD.value;
    //Add the columns that belong.
    var eleAllAggrs = document.getElementById('rdAcAllStackingHidden_' + sAcId + sSuffix)
    for (var i = 0; i < eleAllAggrs.childNodes.length; i++) {
        var eleAggr = eleAllAggrs.childNodes[i]
        if (eleAggr.tagName == "OPTION") {
            if (sDataType == "Number") {                
                if (eleAggr.value.toLowerCase().indexOf("combo") == -1) {
                    continue;
                }
                eleAggrSelect.appendChild(eleAggr.cloneNode(true))
            } else {
                if (vAgg == "" && eleAggr.value.toLowerCase().indexOf("combo") != -1) {
                    continue;
                }
                if (vAgg != "" && eleAggr.value.toLowerCase().indexOf("combo") == -1) {
                    continue;
                }
                eleAggrSelect.appendChild(eleAggr.cloneNode(true))
            }
            
        }
    }
    //Reselect the previous value, or the first.
    eleAggrSelect.value = sSelectedAggr
    if (eleAggrSelect.value == "") {
        eleAggrSelect.value = eleAggrSelect.options[0].value
    }
    if (sChartType && sChartType=="Scatter" && sDataType != "Number") { //go with hierarchical chart
        ShowElement(this.id, 'rdAcStacking_' + sAcId + sSuffix, 'Hide');
        rdAcHideRowCell(this.id, 'rdAcStacking_' + sAcId + sSuffix, 'Hide');
        ShowElement(this.id, 'rowChartForecast_' + sAcId, 'Hide');
    }

    rdSetOrientationToVerticalIfLine(sAcId);
}


function rdAcSetButtonStyle(sAcId,sCurrChartType,sButtonType) {
    var eleButton = document.getElementById('lblChart' + sButtonType + '_' + sAcId)
    if (eleButton) {
        if (sButtonType==sCurrChartType) {
            eleButton.className='rdAcCommandHighlight'
        }else{
            eleButton.className='rdAcCommandIdle'
        }
                
        //Round the first and last buttons.
        var bStyleSet = false
        if (eleButton.parentNode.nextSibling.tagName=="A") {
            if (eleButton.parentNode.previousSibling.id.indexOf('actionShow')!=0) {
                //First button.
                eleButton.className = eleButton.className + " rdAcCommandLeft"
                bStyleSet = true
            }
       }
        if (eleButton.parentNode.previousSibling.tagName=="A") {
            if (eleButton.parentNode.nextSibling.id.indexOf('actionShow')!=0) {
                //Last button.
                eleButton.className = eleButton.className + " rdAcCommandRight"
                bStyleSet = true
            }
        }
        if (!bStyleSet) {  
            //Middle button
            eleButton.className = eleButton.className + " rdAcCommandMiddle"
        }
   
    }
}

function rdShowForecast(sColumn, sAcId, bCrosstabCombo){
    if(document.getElementById('rdAcForecastType_' + sAcId) == null) return;
    var sColumnDataType = rdAcGetColumnDataType(sColumn, sAcId) //#15892.
    if (!sColumnDataType) {
        rdAcHideForecast(sAcId);
        return;
    }
    if (sColumnDataType.toLowerCase() == "text" || sColumnDataType.toLowerCase() == "boolean") {
        rdAcHideForecast(sAcId);
        return;
    }

    //var stackingType = document.getElementById('rdAcStacking_' + sAcId).value;
    //if (stackingType && stackingType.indexOf("Combo_") != -1) {
    //    rdAcHideForecast(sAcId);
    //    return;
    //}
    if (bCrosstabCombo) {
        rdAcHideForecast(sAcId);
        return;
    }

    ShowElement(this.id, 'rowChartForecast_' + sAcId, 'Show');

    var eleForecastType = document.getElementById('rdAcForecastType_' + sAcId);
    if(eleForecastType.value == 'TimeSeriesDecomposition'){       
        if (['FirstDayOfYear','FirstDayOfFiscalYear'].indexOf(document.getElementById('rdAcChartsDateGroupBy_' + sAcId).value) > - 1) {
            document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
            document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
        }else{
            document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = '';
            document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = '';
        }
        document.getElementById('rdAcRegressionType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcRegressionType_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId + '-Caption').style.display = 'none';
        return;
    }
    else if(eleForecastType.value == 'Regression'){
        var eleRegression = document.getElementById('rdAcRegressionType_' + sAcId);
        document.getElementById('rdAcRegressionType_' + sAcId).style.display = '';
        document.getElementById('rdAcRegressionType_' + sAcId + '-Caption').style.display = '';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId + '-Caption').style.display = 'none';
        return;
    }
    else if (eleForecastType.value == 'TrendLine') {
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcRegressionType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcRegressionType_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId).style.display = '';
        document.getElementById('rdAcTrendLineType_' + sAcId + '-Caption').style.display = '';
    }
    else{
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcRegressionType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcRegressionType_' + sAcId + '-Caption').style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTrendLineType_' + sAcId + '-Caption').style.display = 'none';
    }
   
}


function rdAcHideForecast(sAcId) {
    if (document.getElementById('rdAcForecastType_' + sAcId) == null) return;
    document.getElementById('rowChartForecast_' + sAcId).style.display = 'none';
    document.getElementById('rdAcForecastType_' + sAcId).style.display = 'none';
    document.getElementById('rdAcChartForecastLabel_' + sAcId).style.display = 'none'
    document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
    document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
    document.getElementById('rdAcRegressionType_' + sAcId).style.display = 'none';
    document.getElementById('rdAcRegressionType_' + sAcId + '-Caption').style.display = 'none';
}

function rdAcShowLineAggrOptions(sAcId) {
    //Called for line and spline charts only.
    // Function shows/Hides the Aggregation dropdown based on the X-axis column picked.
    var sXColumn = document.getElementById('rdAcChartXDataColumn_' + sAcId).value
    var sYColumn = document.getElementById('rdAcChartYColumn_' + sAcId).value

    if (sXColumn == '') {
        document.getElementById('rowChartYAggr_' + sAcId).style.display = 'none';   
        return;
    }
    ShowElement(this.id, 'rdAcChartYAggrLabel_' + sAcId, 'Hide');
    ShowElement(this.id, 'rdAcChartYAggrList_' + sAcId, 'Hide');

    var sXColumnType = rdAcGetColumnDataType(sXColumn, sAcId);
    if (sXColumnType.toLowerCase() == "text" || sXColumnType.toLowerCase() == "boolean" || (sXColumnType.toLowerCase().indexOf("date")!=-1 && document.getElementById('rdAcChartsDateGroupBy_' + sAcId).value!='')) {  
        var eleExcludeColumns = document.getElementById("rdAcNoAggregatesColumns_" + sAcId)
        if (eleExcludeColumns.value.split(",").indexOf(sYColumn) == -1) {
            //Y-column is not allowed for aggregations unless the x-column is getting grouped.  Plus aggregations must be allowed.
            ShowElement(this.id, 'rdAcChartYAggrLabel_' + sAcId, 'Show');
            ShowElement(this.id, 'rdAcChartYAggrList_' + sAcId, 'Show');
        }
    }
}

 
function rdSetForecastOptions(sColumn, sAcId) {
    if (sColumn == '') return;

    var eleDataForecastDropdown = document.getElementById('rdAcForecastType_' + sAcId);
    if (!eleDataForecastDropdown) return;

    var sForecastValue = eleDataForecastDropdown.value;
    var eleDateGroupByDropdown = document.getElementById('rdAcChartsDateGroupBy_' + sAcId);
    var sDataColumnType = rdAcGetColumnDataType(sColumn, sAcId);
    var sCurrChartType = document.getElementById('rdAcChartType_' + sAcId).value;
    
    if (sDataColumnType.toLowerCase() == "text" || sDataColumnType.toLowerCase() == "boolean") {
        rdAcHideForecast(sAcId);
        return;
    }

    var rdShadowForecastDropdown = document.getElementById("rdShadowForecastDropdown_" + sAcId);
    if (!rdShadowForecastDropdown) {
        //Save the forecast dropdown so that items can be removed and restored later.
        rdShadowForecastDropdown = eleDataForecastDropdown.parentNode.appendChild(eleDataForecastDropdown.cloneNode(true));
        rdShadowForecastDropdown.setAttribute("id", "rdShadowForecastDropdown_" + sAcId);
        rdShadowForecastDropdown.setAttribute("name", "rdShadowForecastDropdown_" + sAcId);
        rdShadowForecastDropdown.style.display = "none";
    } else {
        //Restore the forecast dropdown from the shadow options.  This will have all options, including those that may have been removed before.
        eleDataForecastDropdown.parentNode.removeChild(eleDataForecastDropdown)
        eleDataForecastDropdown = rdShadowForecastDropdown.parentNode.appendChild(rdShadowForecastDropdown.cloneNode(true))
        eleDataForecastDropdown.setAttribute("id", "rdAcForecastType_" + sAcId)
        eleDataForecastDropdown.setAttribute("name", "rdAcForecastType_" + sAcId)
        eleDataForecastDropdown.style.display = ""
        eleDataForecastDropdown.value = sForecastValue
    }
    
    if ((sDataColumnType.toLowerCase() != "date" && sDataColumnType.toLowerCase() != "datetime") || sCurrChartType.toLowerCase() == "scatter") {
        var eleRemove = Y.one("#rdAcForecastType_" + sAcId + " OPTION[value=TimeSeriesDecomposition")
        if (eleRemove) {
            eleDataForecastDropdown.removeChild(eleRemove._node)
        }
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
    }

    if (sCurrChartType.toLowerCase() == "scatter") {
        var eleRemove = Y.one("#rdAcForecastType_" + sAcId + " OPTION[value=Regression")
        if (eleRemove) {
            eleDataForecastDropdown.removeChild(eleRemove._node)
        }
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
    }

}

function rdResetOrientation(sAcId) {
    var eleOrientation = document.getElementById('rdAcOrientation_' + sAcId)
    if (eleOrientation == null) return;
    var eleLabelColumn = document.getElementById('rdAcChartXLabelColumn_' + sAcId)
    if (eleLabelColumn == null) return;
    var sLabelColumnType = rdAcGetColumnDataType(eleLabelColumn.value, sAcId);
    if (sLabelColumnType.toLowerCase() == "date" || sLabelColumnType.toLowerCase() == "datetime") {
        eleOrientation.value = "Vertical"
    }else{
        eleOrientation.value = "Horizontal"    
    }
}

function rdSetOrientationToVerticalIfLine(sAcId) {
    var eleStacking = document.getElementById('rdAcStacking_' + sAcId);
    if (!eleStacking)
        return;

    var value = eleStacking.value;
    if (value == "Combo_Line" || value == "Combo_Spline") {
        var eleOrientation = document.getElementById('rdAcOrientation_' + sAcId);
        if (eleOrientation == null)
            return;

        eleOrientation.value = "Vertical";
        
        ShowElement(this.id, 'rowChartOrientation_' + sAcId, 'Hide');
    }    
}

function rdSetStackingUserFlag(sAcId) {
    var eleUserValueIsSet = document.getElementById('rdExplicitlyUserSetComboChartType_' + sAcId)
    if (eleUserValueIsSet) {
        eleUserValueIsSet.value = "true";
    }
}

function rdSetAdditionalColumnAxisType(sAcId) {
    var eleAxisType = document.getElementById('rdAcAxisType_' + sAcId);
    ShowElement(this.id, 'rdAcAxisType_' + sAcId, 'Show');
}

function rdAcGetColumnDataType(sColumn, sAcId){
    var eleAcDataColumnDetails = document.getElementById('rdAcDataColumnDetails_' + sAcId);
    if(eleAcDataColumnDetails.value != ''){
        var sDataColumnDetails = eleAcDataColumnDetails.value;
        var aDataColumnDetails = sDataColumnDetails.split(',')
        if(aDataColumnDetails.length > 0){
            var i;
            for(i=0;i<aDataColumnDetails.length;i++){
                var sDataColumnDetail = aDataColumnDetails[i];
                if(sDataColumnDetail.length > 1 && sDataColumnDetail.indexOf(':') > -1){
                    var sDataColumn = sDataColumnDetail.split(':')[0];
                    if(sDataColumn == sColumn){
                        return sDataColumnDetail.split(':')[1];
                    }
                }
            }
        }
    }
}

function rdChangeGroupByDate(sColumnGroupByDropdown, sAcId) {
    document.getElementById('rdAc_ChangeGroupByDate_' + sAcId).value = "True";
    rdModifyTimeSeriesCycleLengthOptions(sColumnGroupByDropdown, sAcId);
}

function rdModifyTimeSeriesCycleLengthOptions(sColumnGroupByDropdown, sAcId){
    if(document.getElementById('rdAcForecastType_' + sAcId) == null) return;
    var eleTimeSeriesCycleLengthDropdown = document.getElementById('rdAcTimeSeriesCycle_' + sAcId);
    var sTimeSeriesCycleLength = eleTimeSeriesCycleLengthDropdown.value;
    var sColumnGroupByValue = sColumnGroupByDropdown.value
    var i; var j = 0;
    //var aColumnGroupByOptions = ['Year', 'Quarter', 'Month', 'Week', 'Day', 'Hour']; 
    
    rdResetTimeSeriesCycleLenthDropdown(sAcId, sColumnGroupByValue, sTimeSeriesCycleLength);

    if (sColumnGroupByValue == 'FirstDayOfYear') {
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = 'none';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = 'none';
    } else if (document.getElementById('rdAcForecastType_' + sAcId).value == 'TimeSeriesDecomposition') {
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId).style.display = '';
        document.getElementById('rdAcTimeSeriesCycle_' + sAcId + '-Caption').style.display = '';
    }

    if (eleTimeSeriesCycleLengthDropdown.value == '') {
		if (eleTimeSeriesCycleLengthDropdown.options.length > 0) {
			var tempValue = eleTimeSeriesCycleLengthDropdown.options[eleTimeSeriesCycleLengthDropdown.options.length - 1].value;
			if (tempValue != 'Hour') eleTimeSeriesCycleLengthDropdown.value = tempValue;
		}
    }
}

function rdResetTimeSeriesCycleLenthDropdown(sAcId) {
    if (document.getElementById('rdAcForecastType_' + sAcId) == null) return;
    var eleTimeSeriesCycleLengthDropdown = document.getElementById('rdAcTimeSeriesCycle_' + sAcId);
    var i; var aColumnGroupByOptions = ['', 'Year', 'Quarter', 'Month', 'Week', 'Day'];
    if (eleTimeSeriesCycleLengthDropdown.options.length > 5) return;
    for (i = 0; i < 7; i++) {
        if (eleTimeSeriesCycleLengthDropdown.options.length > 0) {
            eleTimeSeriesCycleLengthDropdown.remove(0);
        } else {
            break;
        }
    }
    for (i = 0; i < aColumnGroupByOptions.length; i++) {
        var eleTimeSeriesOption = document.createElement('option');
        eleTimeSeriesOption.text = aColumnGroupByOptions[i];
        eleTimeSeriesOption.value = aColumnGroupByOptions[i];
        eleTimeSeriesCycleLengthDropdown.add(eleTimeSeriesOption);
    }
}
function rdResetTimeSeriesCycleLenthDropdown(sAcId, sColumnGroupByValue, sCurSelectedValue) {
    if (document.getElementById('rdAcForecastType_' + sAcId) == null) return;
    var eleTimeSeriesCycleLengthDropdown = document.getElementById('rdAcTimeSeriesCycle_' + sAcId);
    var aColumnGroupByOptions = ['', 'Year', 'Quarter', 'Month', 'Week', 'Day', 'Hour']; //HOUR IS FOR 24500

    while (eleTimeSeriesCycleLengthDropdown.options.length > 0)
        eleTimeSeriesCycleLengthDropdown.options.remove(0);

    var nNewOptCount = 0;
    switch (sColumnGroupByValue) {
        case 'FirstDayOfYear':
            nNewOptCount = 1;// ''
            break;
        case 'FirstDayOfQuarter':
        case 'FirstDayOfFiscalQuarter':
            nNewOptCount = 2;//'' & Year
            break;
        case 'FirstDayOfMonth':
            nNewOptCount = 3;//'' & Year & Quarter
            break;
        case 'FirstDayOfWeek':
            nNewOptCount = 4;//'' & Year & Quarter & Month
            break;
        case 'Date':
        case 'DateTime':
            nNewOptCount = 5;//'' & Year & Quarter & Month & Week
            break;
        case "FirstMinuteOfHour":
            nNewOptCount = 6;//'' & Year & Quarter & Month & Week & Day
            break;
        case "FirstSecondOfMinute":
            nNewOptCount = 7;//'' & Year & Quarter & Month & Week & Day & Hour
            break;
        default: //No By, SHOW ALL
            nNewOptCount = aColumnGroupByOptions.length;
    }
    for (var i = 0; i < nNewOptCount; i++) {
        var eleTimeSeriesOption = document.createElement('option');
        eleTimeSeriesOption.text = aColumnGroupByOptions[i];
        eleTimeSeriesOption.value = aColumnGroupByOptions[i];
        eleTimeSeriesCycleLengthDropdown.add(eleTimeSeriesOption);

        if (eleTimeSeriesOption.value == sCurSelectedValue)
            eleTimeSeriesCycleLengthDropdown.value = sCurSelectedValue;
    }
}

function rdAcGetGroupByDateOperatorDiv(sDataColumn,sAcId){
    if(typeof(sDataColumn) == 'undefined'){
        document.getElementById('colGBDO_'+sAcId).style.display = 'none';
    }
    var eleDateColumnsForGrouping = document.getElementById('rdAcPickDateColumnsForGrouping_' + sAcId);
    if(eleDateColumnsForGrouping != null){
        if (eleDateColumnsForGrouping.value.length > 0) {
			var sEleDateColumnsForGrouping = eleDateColumnsForGrouping.value.replace(",","");
            sEleDateColumnsForGrouping = sEleDateColumnsForGrouping.replace(",,", ",");
            aDateColumns = sEleDateColumnsForGrouping.split(",");
            for (i = 0; i < aDateColumns.length; i++) {
                if ((aDateColumns[i] == sDataColumn)) {
                    document.getElementById('colGBDO_' + sAcId).style.display = '';
                    break;
                }
                else {
                    document.getElementById('colGBDO_' + sAcId).style.display = 'none';
                }
            }
        }
        else {
            document.getElementById('colGBDO_' + sAcId).style.display = 'none';
        }
    }
    else {
        document.getElementById('colGBDO_'+sAcId).style.display = 'none';
    }
}
function rdAcSetComboType(sAcId, e) {
    if (!e) return;
    var row = getCrosstabColumnRow(e);
    var sSuffix = sGetCrosstabColumnIdSuffix(sAcId, row);
    var sCurrChartType = document.getElementById('rdAcChartType_' + sAcId).value
    var eleAggrDD = document.getElementById("rdAcChartExtraAggrListCompare" + '_' + sAcId + sSuffix)
    var eleAggrSelect = document.getElementById("rdAcStacking" + '_' + sAcId + sSuffix)
    if (!eleAggrSelect || !eleAggrDD) 
        return;
    var userValue = eleAggrSelect.value;
    rdAcSetAvailableStacking(sAcId, "rdAcChartCrosstabColumn", "rdAcStacking", sCurrChartType, sSuffix)
    var bUserValueIsSet = false;
    var eleUserValueIsSet = document.getElementById('rdExplicitlyUserSetComboChartType_' + sAcId)
    if (eleUserValueIsSet) {
        bUserValueIsSet = eleUserValueIsSet.value.toLowerCase() == "true";
    }
    if (bUserValueIsSet && userValue != "") {
        eleAggrSelect.value = userValue;
    }
    else {
        if (eleAggrDD.value == "") {
            eleAggrSelect.value = "stacked";
        } else if (eleAggrDD.value.toLowerCase().indexOf("count") != -1) {
            eleAggrSelect.value = "Combo_" + sCurrChartType;
        }
    }
}

function rdAcSetStackingType(sAcId, e, sRemove) {
    if (!e) return;
    var row = getCrosstabColumnRow(e);
    var sSuffix = sGetCrosstabColumnIdSuffix(sAcId, row)
    var eleExtraColumnDD = document.getElementById("rdAcChartCrosstabColumn" + '_' + sAcId+sSuffix);
    var eleAggrSelect = document.getElementById("rdAcChartExtraAggrListCompare" + '_' + sAcId+sSuffix);
    if (!eleAggrSelect || !eleExtraColumnDD || eleExtraColumnDD.value == "") {
        sRemove = true;
    }
    if (sRemove) {
        rdAcRemoveAdditinalColumns(sAcId, row, sSuffix)
        return;
    }

    if (bNewRow(sAcId,row, false) ){
        rdAcAddAdditinalColumnRow(sAcId, row, sSuffix);
        sSuffix = sGetCrosstabColumnIdSuffix(sAcId, row)
        eleExtraColumnDD = document.getElementById("rdAcChartCrosstabColumn" + '_' + sAcId + sSuffix);
    }

    var columnType = rdAcGetColumnDataType(eleExtraColumnDD.value, sAcId);
    if (columnType.toLowerCase() == "text") {
        eleAggrSelect.value = "";
    }
    rdAcSetComboType(sAcId,e);
    return true;
}

function rdAcGetCrosstabRowIndex(sAcId, row) {
    if (!row) return -1;
    var rows = rdAcGetAdditionalRowGroup(sAcId);
    return rows.indexOf(row);
}
function bNewRow(sAcId, row, bAdded) {
    if (!row) return -1;
    var rows = rdAcGetAdditionalRowGroup(sAcId);
    var index = rows.indexOf(row);
    if (!bAdded) {
        return index == -1 || index == rows.length - 1;
    } else {
        var arr = rdAcGetEntries(document.getElementById("rdAcChartCrosstabColumns" + '_' + sAcId).value)
        if (arr.length <= 0) return true;
        else if (arr[0] == '' && index + 1 >= arr.length) return true;
        else if (arr[0] != '' && index >= arr.length) return true;
        return false;
    }
}
function rdAcGetCurAdditValue(sAcId, sListEleId, iValueIndex) {
    var eleLists = document.getElementById(sListEleId + '_' + sAcId);
    var aList = rdAcGetEntries(eleLists.value, ",", "\"", "\\") //eleLists.value.split(',');
    if (iValueIndex < 0 || iValueIndex >= aList.length) return "";
    return aList[iValueIndex];
}

function rdAcUpdateAdditinalColumns(sAcId, row) {
    if (!row) return;
    var i = rdAcGetCrosstabRowIndex(sAcId, row);
    if (i < 0) { return; }
    var ssuffix = sGetCrosstabColumnIdSuffix(sAcId, row);
    var eleList = document.getElementById("rdAcChartCrosstabColumns" + '_' + sAcId);
    var arrvalues = rdAcGetEntries(eleList.value);
    if (arrvalues.length > 0 && arrvalues[0] == '') i++;
    rdAcUpdateAdditinalColumnsValue(sAcId, "rdAcChartCrosstabColumns", i, "rdAcChartCrosstabColumn", ssuffix);
    rdAcUpdateAdditinalColumnsValue(sAcId, "rdAcChartExtraAggrListCompares", i, "rdAcChartExtraAggrListCompare", ssuffix);
    rdAcUpdateAdditinalColumnsValue(sAcId, "rdAcStackings", i, "rdAcStacking", ssuffix);
    rdAcUpdateAdditinalColumnsValue(sAcId, "rdAcAxisTypes", i, "rdAcAxisType", ssuffix);
    rdAcUpdateAdditinalColumnsValue(sAcId, "rdAcCrosstabShowValues", i, "rdAcCrosstabShowValue", ssuffix);

}
function rdAcUpdateAdditinalColumnsValue(sAcId, sListEleId, iIndex, sNewValueId, sSuffix) {
    var eleList = document.getElementById(sListEleId + '_' + sAcId );
    var colvalues = rdAcGetEntries(eleList.value);
    if (iIndex >= colvalues.length) return; //err
    var newVlEle = document.getElementById(sNewValueId + '_' + sAcId + sSuffix);
    colvalues[iIndex] = newVlEle.value
    eleList.value = LogiXML.rdInputTextDelimiter.delimit(colvalues, ",", "\"", "\\")
}
function rdAcGetEntries(sValue) {
    var avalue = LogiXML.rdInputTextDelimiter.getEntries(sValue, ",", "\"", "\\")
    if (sValue.charAt(sValue.length -1)==",") {
        avalue.push("");
    }
    return avalue;
}
function rdAcRemoveAdditinalColumns(sAcId, row, sSuffix) {
    var eleExtraColumn = document.getElementById("rdAcChartCrosstabColumn" + '_' + sAcId + sSuffix);
    if (!eleExtraColumn) {
        return
    }

    var i = rdAcGetCrosstabRowIndex(sAcId, row);//rdAcGetCurAdditIndex(sAcId, eleExtraColumn.value)
    if (i < 0) { return; }
    var eleList = document.getElementById("rdAcChartCrosstabColumns" + '_' + sAcId);
    var arrvalues = rdAcGetEntries(eleList.value);
    if (arrvalues.length > 0 && arrvalues[0] == '') i++;
    rdAcRemoveAdditinalColumnsValue(sAcId, "rdAcChartCrosstabColumns", i)

    rdAcRemoveAdditinalColumnsValue(sAcId, "rdAcChartExtraAggrListCompares", i)
    rdAcRemoveAdditinalColumnsValue(sAcId, "rdAcStackings", i)
    rdAcRemoveAdditinalColumnsValue(sAcId, "rdAcAxisTypes", i)
    rdAcRemoveAdditinalColumnsValue(sAcId, "rdAcCrosstabShowValues", i)
    var rows = rdAcGetAdditionalRowGroup(sAcId);
    if (rows.length <= 1) return;
    if (row.nextSibling) {
        var rowindex = rdAcGetAdditionalRowGroup(sAcId).indexOf(row)
        if (rowindex == 0) {
            var leles = Y.all('#' + row.id + " label")._nodes
            if (leles.length > 0) {
                if (row.nextSibling.cells.length > 0) {
                    row.nextSibling.cells[0].appendChild(leles[0])
                }
            }
        }
    }
    row.parentElement.removeChild(row);
}
function rdAcAddAdditinalColumnRow(sAcId, refrow, sSuffix) {
    if (!refrow) { return; }
    var ele = refrow.cloneNode(true)
    refrow.parentNode.insertBefore(ele, refrow.nextSibling)
    var inumber = 0;
    if (!sSuffix) {
        sSuffix = sGetCrosstabColumnIdSuffix(sAcId, refrow)
    }
    inumber = parseInt(sSuffix.substr(sSuffix.indexOf('_') + 1)) + 1;

    var newSuffix = '_' + inumber;
    if (sSuffix == '') {
        rdAcSetCrosstabRowId(sAcId, refrow, newSuffix);
        rdAcSetCrosstabRowId(sAcId, ele, '','');
    } else {
        rdAcSetCrosstabRowId(sAcId, ele, newSuffix,'');
    }
    var leles = Y.all('#' + ele.id + " label")._nodes
    if (leles.length > 0) {
        leles[0].parentNode.removeChild(leles[0]);
    }

}
function rdAcSetCrosstabRowId(sAcId, elerow, sSuffix, sDefaultColumnValue) {
    elerow.id = 'rowChartCrosstabColumn_' + sAcId + sSuffix
    leles = Y.all('#' + elerow.id + " select")._nodes
    eleminus = Y.all('#' + elerow.id + " td#colChartCrosstabColumnCell6")._nodes
    if (eleminus.length > 0 && eleminus[0].childNodes.length > 0) {
        leles.push(eleminus[0].childNodes[0])
    }
    var lkeys = []
    lkeys.push("rdAcChartCrosstabColumn_" + sAcId)
    lkeys.push("rdAcChartExtraAggrListCompare_" + sAcId)
    lkeys.push("rdAcStacking_" + sAcId)
    lkeys.push("rdAcAxisType_" + sAcId)
    lkeys.push("rdAcCrosstabShowValue_" + sAcId)
    lkeys.push("divMinusAdditional_" + sAcId)
    lkeys.push("rdAcAllStackingHidden_" + sAcId)
    for (var i = 0; i < leles.length; i++) {
        var prefix = null;
        for (j = 0; j < lkeys.length; j++) {
            if (leles[i].id.indexOf(lkeys[j]) >= 0) {
                prefix = lkeys[j];
                break;
            }
        }
        if (prefix) {
            leles[i].id = prefix + sSuffix;
            if (sDefaultColumnValue && leles[i].id.indexOf("rdAcChartCrosstabColumn_") >= 0) {
                leles[i].value = sDefaultColumnValue;
            }
        }
    }
}
function rdAcRemoveAdditinalColumnsValue(sAcId, sListEleId, iIndex) {
    var eleList = document.getElementById(sListEleId + '_' + sAcId);
    var colvalues = rdAcGetEntries(eleList.value, ",", "\"", "\\")
    colvalues.splice(iIndex,1)
    eleList.value = LogiXML.rdInputTextDelimiter.delimit(colvalues, ",", "\"", "\\")
} 

function rdAcSetAdditinalColumns(sAcId, row) {
    if (!row) return;
    var ssuffix = sGetCrosstabColumnIdSuffix(sAcId, row);
    var eleExtraColumn = document.getElementById("rdAcChartCrosstabColumn" + '_' + sAcId + ssuffix);
    if (!eleExtraColumn || eleExtraColumn.value == "") { return; }
    if (!bNewRow(sAcId, row, true)) {
        rdAcUpdateAdditinalColumns(sAcId, row);
        return;
    }


    rdAddValue(sAcId, "rdAcChartCrosstabColumn", "rdAcChartCrosstabColumns", ssuffix);
    rdAddValue(sAcId, "rdAcChartExtraAggrListCompare", "rdAcChartExtraAggrListCompares", ssuffix);
    rdAddValue(sAcId, "rdAcStacking", "rdAcStackings", ssuffix);
    rdAddValue(sAcId, "rdAcAxisType", "rdAcAxisTypes", ssuffix);
    rdAddValue(sAcId, "rdAcCrosstabShowValue", "rdAcCrosstabShowValues", ssuffix);
}
function rdAddValue(sAcId, sEleId, sListEleId, ssuffix){
    var ele = document.getElementById(sEleId + '_' + sAcId + ssuffix);
    var eleList = document.getElementById(sListEleId + '_' + sAcId);
    //var colvalues = rdAcGetEntries(eleList.value)
    //colvalues.push(ele.value)
    //eleList.value = LogiXML.rdInputTextDelimiter.delimit(colvalues, ",", "\"", "\\")
    var colvalues = [ele.value];
    eleList.value = eleList.value + "," + LogiXML.rdInputTextDelimiter.delimit(colvalues, ",", "\"", "\\")
}
function rdAcClearAdditinalColumns(sAcId) {
    var arrrows = rdAcGetAdditionalRowGroup(sAcId)
    for (i = 0; i < arrrows.length - 1; i++) {
        arrrows[i].parentElement.removeChild(arrrows[i]);
    }
    var eleExtraColumns = document.getElementById("rdAcChartCrosstabColumns" + '_' + sAcId);
    eleExtraColumns.value = '';

    var eleExtraAggLists = document.getElementById("rdAcChartExtraAggrListCompares" + '_' + sAcId);
    eleExtraAggLists.value = '';

    var eleAcStackings = document.getElementById("rdAcStackings" + '_' + sAcId);
    eleAcStackings.value = '';

    var eleAcAxisTypes = document.getElementById("rdAcAxisTypes" + '_' + sAcId);
    eleAcAxisTypes.value = '';
    var eleAcShowValues = document.getElementById("rdAcCrosstabShowValues" + '_' + sAcId);
    eleAcShowValues.value = '';
}
function rdAcGetAdditionalRowGroup(sAcId) {
    var rowtable = document.getElementById("rowsChartLists_" + sAcId)
    var rows = rowtable.getElementsByTagName("tr")
    var arrCrosstabRows = [];
    var sId;
    for (i = 0; i < rows.length; i++) {
        if (!rows[i] || rows[i] == null) continue;
        sId = rows[i].id;
        if (sId == null) { continue; }
        if (sId.indexOf("rowChartCrosstabColumn_" + sAcId) < 0) continue;
        arrCrosstabRows.push(rows[i])
    }
    return arrCrosstabRows;
}
function rdAcHideShowAdditionalRowGroup(sAcId, sHideShow) {
    var arrCrosstabRows = rdAcGetAdditionalRowGroup(sAcId);
    for (i = 0; i < arrCrosstabRows.length; i++) {
        ShowElement(this.id, arrCrosstabRows[i].getAttribute("ID"), sHideShow);
    }
    return arrCrosstabRows;
}
function rdAcHideShowAdditionalRowItems(sAcId, arrRows, sItemId, sHideShow) {
    for (i = 0; i< arrRows.length; i++) {
        rdAcHideShowAdditionalRowItem(sAcId, arrRows[i], sItemId, sHideShow);
    }
}
function rdAcHideShowAdditionalRowItem(sAcId, row, sItemId, sHideShow) {
    var sSuffix = sGetCrosstabColumnIdSuffix(sAcId, row);
    var sId = sItemId +'_' +sAcId + sSuffix;
    ShowElement(this.id, sId, sHideShow);
}
function sGetCrosstabColumnIdSuffix(sAcId, row) {
    if (!row) { return "";}
    var sRowId = row.getAttribute("ID")
    var index = sRowId.indexOf("rowChartCrosstabColumn_" + sAcId)
    var sSuffix = sRowId.substr(index + ("rowChartCrosstabColumn_" + sAcId).length)
    return sSuffix
}
function getCrosstabColumnRow(oChild) {
    if (!oChild) return null;
    var p = oChild.parentNode
    while (p) {
        if (p.tagName == 'TR') return p;
        p = p.parentNode
    }
    return null;
}
function getCrosstabColumnRowByIndex(sAcId, rowindex) {
    var rows = rdAcGetAdditionalRowGroup(sAcId);
    if (rowindex < 0 || rowindex >= rows.length) return null;
    return rows[rowindex];
}
//
function checkCombo(sAcId, arrCrosstabRows) {
    var suffix
    for (var i = 0; i < arrCrosstabRows.length; i++) {
        suffix = sGetCrosstabColumnIdSuffix(sAcId, arrCrosstabRows[i])
        var stackingType = document.getElementById('rdAcStacking_' + sAcId + suffix).value;
        if (stackingType && stackingType.indexOf("Combo_") != -1) {
            return true;
        }
    }
    return false;
}
//rdShowCustomColorDialog_xxxx are belong to REPDEV-30594 (S)
function rdShowCustomColorDialog(sReport, sAcId) {
    rdAcUpdateControls(false, sReport, sAcId, true)
    var dlg = document.getElementById('rdCustomColorDialog_' + sAcId)
    if (dlg.style.display == "none") {//TO SHOW
        //Collect Current SUPPORTTED SeriesInfo 
        var curSeriesInfoArray = rdShowCustomColorDialog_CollectSeriesInformation(sAcId),
            dataCenter = document.querySelector('#rdAcCustomColorDataCenter_' + sAcId),
            allExistCCKeys = dataCenter.querySelectorAll("input[type='HIDDEN'][id^='rdAcConditionColorKey'][value]"),
            findKeyByInfo = function (allExistCCKeys, seriesInfo) {
                if (Highcharts && Highcharts.find)
                    return Highcharts.find([].slice.call(allExistCCKeys), function (elem) { return elem.value.toLowerCase() == seriesInfo.asStringKey(); });
                else {
                    for (var i = 0; i < allExistCCKeys.length; i++) {
                        if (allExistCCKeys[i].value.toLowerCase() === seriesInfo.asStringKey())
                            return allExistCCKeys[i];
                    }
                    return undefined;
                }
            };
        //NOTE: Conclusion on the meeting : Even if there is only one Series, use the tab-Nav UI
        var eleContentDiv = dlg.querySelector('#PopupPanelContentBody_rdCustomColorDialog_' + sAcId);
        eleContentDiv.innerHTML = "";//Clear, one of reason: There is no reInit function for Tabs to reuse it.

        //Tab-Nav start
        var elsUsedTabs = dlg.parentElement.querySelector("#MultiSeriesTabsTemplate").cloneNode(true);
        //reset ID
        var newTabsID = 'MultiSeriesTabs_' + sAcId;
        elsUsedTabs.id = newTabsID;
        elsUsedTabs.querySelector("#rdTabs-MultiSeriesTabsTemplate").id = "rdTabs-" + newTabsID;

        var eleNavUL = elsUsedTabs.querySelector("#rdTabs").firstElementChild, eleTabContainer = elsUsedTabs.querySelector("#rdTabs").nextSibling;
        eleNavUL.style.display = "flex", eleNavUL.style.flexWrap = "wrap", eleNavUL.style.width = "";//Auto warp if more than 3 series [flex is CSS3]
        eleTabContainer.innerHTML = ""; //Remove all existing Tabs (such as blank-image tab).

        var eleSeriesPanelTemplate = dlg.parentElement.querySelector("#ContentTemplate");
        for (var i = 0; i < curSeriesInfoArray.length; i++) {
            var existKey,
                eleSeriesPanel = (existKey = findKeyByInfo(allExistCCKeys, curSeriesInfoArray[i])) ?
                    rdShowCustomColorDialog_CreateSeriesPanel(eleSeriesPanelTemplate, sAcId, i, curSeriesInfoArray[i],
                        existKey._base = existKey._base || dataCenter.querySelector("input[type='HIDDEN']#" + existKey.id.replace("Key", "Base")).value,
                        existKey._value = existKey._value || dataCenter.querySelector("input[type='HIDDEN']#" + existKey.id.replace("Key", "Value")).value) :
                    rdShowCustomColorDialog_CreateSeriesPanel(eleSeriesPanelTemplate, sAcId, i, curSeriesInfoArray[i]);

            var liEle = (i == 0) ? eleNavUL.firstElementChild : eleNavUL.appendChild(document.createElement("LI"));
            liEle.id = eleSeriesPanel.id;
            liEle.innerHTML = "<A href=\"#" + eleSeriesPanel.id + "\"><EM><SPAN id=\"Caption_Series" + i + "\" title=\"" + eleSeriesPanel.getAttribute("rdData-Tooltip") + "\">Series" + (i + 1) + "</SPAN></EM></A>"
            eleTabContainer.appendChild(eleSeriesPanel);
            if (i == 0) eleSeriesPanel.style.display = "";//SHOW FIRST
        }
        eleContentDiv.appendChild(elsUsedTabs);
        var tempEle = eleContentDiv.appendChild(document.createElement("INPUT"));
        tempEle.setAttribute("TYPE", "HIDDEN"); tempEle.setAttribute("ID", 'rdActiveTabIndex_' + newTabsID); tempEle.setAttribute("NAME", 'rdActiveTabIndex_' + newTabsID);
        tempEle = eleContentDiv.appendChild(document.createElement("INPUT"));
        tempEle.setAttribute("TYPE", "HIDDEN"); tempEle.setAttribute("ID", 'rdActiveTabId_' + newTabsID); tempEle.setAttribute("NAME", 'rdActiveTabId_' + newTabsID);

        Y.use('rdInputColorPicker', "tabs", function (Y) { new Y.LogiXML.Tabs({ id: newTabsID, reportid: sReport, orientation: 'top', isMobile: 'false' }); Y.LogiXML.rdInputColorPicker.createElements(); });
        //Tab-Nav end.
    } else {//TO HIDE
        dlg.querySelector('#PopupPanelContentBody_rdCustomColorDialog_' + sAcId).innerHTML = ""; //clear all
    }
    ShowElement(sAcId, 'rdCustomColorDialog_' + sAcId, '', '');
}
function rdShowCustomColorDialog_CollectSeriesInformation(sAcId) {

    var root = document.getElementById(sAcId), tempEle,
        sChartType = root.querySelector('#rdAcChartType_' + sAcId).value;

    var xColumn = root.querySelector('#rdAcChartXLabelColumn_' + sAcId).value,
        xColumnDataType = rdAcGetColumnDataType(xColumn, sAcId),
        xColumnFunction = (xColumnDataType && ["datetime", "date", "time"].indexOf(xColumnDataType.toLowerCase()) >= 0 ? root.querySelector('#rdAcChartsDateGroupBy_' + sAcId).value : ""),
        xColumnDisp = (tempEle = root.querySelector('#rdAcChartXLabelColumn_' + sAcId), tempEle.options[tempEle.selectedIndex]).text + (!!xColumnFunction ? " by " + (tempEle = root.querySelector('#rdAcChartsDateGroupBy_' + sAcId), tempEle.options[tempEle.selectedIndex]).text : "");
        //note: IE does not support 'selectedOptions'

    var yColumn = root.querySelector('#rdAcChartYColumn_' + sAcId).value,
        yColumnFunc = root.querySelector('#rdAcChartYAggrList_' + sAcId).value,
        yColumnDisp = (tempEle = root.querySelector('#rdAcChartYAggrList_' + sAcId), tempEle.options[tempEle.selectedIndex]).text + " of " + (tempEle = root.querySelector('#rdAcChartYColumn_' + sAcId), tempEle.options[tempEle.selectedIndex]).text;
    //note: IE does not support 'selectedOptions'

    var crosstabColumnNames = rdAcGetEntries(root.querySelector('#rdAcChartCrosstabColumns_' + sAcId).value),
        crosstabColumnFuncs = rdAcGetEntries(root.querySelector('#rdAcChartExtraAggrListCompares_' + sAcId).value),
        crosstabStacks = rdAcGetEntries(root.querySelector('#rdAcStackings_' + sAcId).value);

    function SeriesInfo(sType, sLabel, sLabelDataType, sLabelBy, sLabelDisplay) {
        this.sType = sType;
        this.sLabelName = sLabel;
        this.isDateTimeLabel = ["datetime", "date", "time"].indexOf(sLabelDataType.toLowerCase())>=0;
        this.sLabelBy = this.isDateTimeLabel ? sLabelBy : "";
        this.sLabelDisplay = sLabelDisplay;
    };
    SeriesInfo.prototype.setData = function (sData, sDataFunction, sDataDisp) {
        this.sDataName = sData;
        this.sDataFunc = sDataFunction;
        this.sDataDisp = sDataDisp;
    };
    SeriesInfo.prototype.setAdditional = function (iIndex, sColumn, sFunction, sAddiDisp) {
        this.iAIndex = iIndex;
        this.sAColumn = sColumn;
        this.sAFunc = sFunction;
        this.sADisplay = sAddiDisp;
    };

    SeriesInfo.prototype.asStringKey = function () {
        var tempArray = [this.sType, this.sLabelName, this.sLabelBy];
        (!!this.sDataName) ? (tempArray.push(this.sDataName), tempArray.push(this.sDataFunc)) : (tempArray.push(''), tempArray.push(''));
        (!!this.sAColumn) ? (tempArray.push(this.iAIndex.toString()), tempArray.push(this.sAColumn), tempArray.push( (!!this.sAFunc) ? this.sAFunc : '' ) ) : (tempArray.push(''), tempArray.push(''), tempArray.push('') );

        return LogiXML.rdInputTextDelimiter.delimit( tempArray, ",", "\"", "\\").toLowerCase();
    };
    SeriesInfo.prototype.toDisplayString = function () {
        return "the series-" + (this.sLabelDisplay ? this.sLabelDisplay : this.sLabelName + (!!this.sLabelBy ? " by " + this.sLabelBy : "") )+
            (!!this.sDataName ? ", " + (this.sLabelDisplay ? this.sDataDisp : this.sDataFunc + " of " + this.sDataName) : "") +
            (!!this.sAColumn ? ", " + (this.sADisplay ? this.sADisplay: (!!this.sAFunc ? this.sAFunc + " of " : "") + this.sAColumn ) : "");
    }
    SeriesInfo.prototype.getLabelText = function () {
        return this.sLabelDisplay ? this.sLabelDisplay : this.sLabelName + (this.sLabelBy !== "" ? " by " + this.sLabelBy : "");
    }
    SeriesInfo.prototype.getDataText = function () {
        return this.sDataName ? this.sLabelDisplay ? this.sDataDisp : this.sDataFunc + " of " + this.sDataName : ""
    }
    SeriesInfo.prototype.getAddtionalText = function () {
        return this.sAColumn ? this.sADisplay ? this.sADisplay : (this.sAFunc ? this.sAFunc + " of " : "") + this.sAColumn : "";
    }
    SeriesInfo.prototype.isSupported = function () { return this.sType === "Bar"; } //NO ONLY Bar has this feature (REPDEV-30594)

    var retSeriesInfoArray = [];
    var seriesInfo = new SeriesInfo(sChartType, xColumn, xColumnDataType, xColumnFunction, xColumnDisp);
    seriesInfo.setData(yColumn, yColumnFunc, yColumnDisp);
    seriesInfo.isSupported() && retSeriesInfoArray.push(seriesInfo);

    if (crosstabColumnNames.length > 1) {
        var tIdx = 1;
        if (crosstabStacks[1].indexOf("Combo") < 0) {
            tempEle = root.querySelector("select[id^='rdAcChartCrosstabColumn_" + sAcId + "'] option[value='" + crosstabColumnNames[1] + "']");
            var sDispText = undefined;
            if (tempEle) {
                sDispText = tempEle.text
                if (!!crosstabColumnFuncs[1]) {
                    tempEle = root.querySelector("select[id^='rdAcChartExtraAggrListCompare_" + sAcId + "'] option[value='" + crosstabColumnFuncs[1] + "']");
                    sDispText = (tempEle) ? tempEle.text + ' of ' + sDispText : undefined;
                }
            }
            seriesInfo.setAdditional(0, crosstabColumnNames[1], crosstabColumnFuncs[1], sDispText);
            tIdx = 2;
        }

        for (; tIdx < crosstabColumnNames.length; tIdx++) {
            if (crosstabStacks[tIdx].indexOf("Combo") < 0) {
                seriesInfo = new SeriesInfo(sChartType, xColumn, xColumnDataType, xColumnFunction, xColumnDisp);
                seriesInfo.setData(yColumn, yColumnFunc, yColumnDisp);
            } else {
                seriesInfo = new SeriesInfo(crosstabStacks[tIdx].substring(6), xColumn, xColumnDataType, xColumnFunction, xColumnDisp);
            }
            tempEle = root.querySelector("select[id^='rdAcChartCrosstabColumn_" + sAcId + "'] option[value='" + crosstabColumnNames[tIdx] + "']");
            var sDispText = undefined;
            if (tempEle) {
                sDispText = tempEle.text
                if (!!crosstabColumnFuncs[tIdx]) {
                    tempEle = root.querySelector("select[id^='rdAcChartExtraAggrListCompare_" + sAcId + "'] option[value='" + crosstabColumnFuncs[tIdx] + "']");
                    sDispText = (tempEle) ? tempEle.text + ' of ' + sDispText : undefined;
                }
            }
            seriesInfo.setAdditional(tIdx - 1, crosstabColumnNames[tIdx], crosstabColumnFuncs[tIdx], sDispText);
            seriesInfo.isSupported() && retSeriesInfoArray.push(seriesInfo);
        }
    }

    return retSeriesInfoArray;
}
function rdShowCustomColorDialog_CreateSeriesPanel(eleSeriesPanelTemplate, sAcId, iIndex, seriesInfo, initBaseOn, initClrString) {
    var retPanel = eleSeriesPanelTemplate.cloneNode(true);
    retPanel.style.display = "none";
    retPanel.setAttribute("id", "SPL" + iIndex);
    retPanel.setAttribute("rdData-Serieskey", seriesInfo.asStringKey());
    retPanel.setAttribute("rdData-Tooltip", "For " + seriesInfo.toDisplayString());

    var replaceAll = function (str, a, b) { return str.replaceAll ? str.replaceAll(a, b) : str.replace(eval("/" + a + "/g"), b); }

    var eleTitle = retPanel.querySelector("#lblTabPanelHeader");
    eleTitle.textContent = replaceAll(eleTitle.textContent, "_SeriesText_", seriesInfo.toDisplayString())

    var eleSelect = retPanel.querySelector("#BaseOnSelect_" + sAcId),
        eleTemplate = retPanel.querySelector("#_InputPanelID_");
    var optCount = eleSelect.options.length;
    for (var optIdx = 0; optIdx < optCount;) {
        var curOpt = eleSelect.options[optIdx];
        if ((curOpt.value === 'LabelColumn' && !seriesInfo.isDateTimeLabel)
            || (curOpt.value === 'DataColumn' && !!seriesInfo.sDataName)
            || (curOpt.value === 'AdditionCol' && !!seriesInfo.sAColumn)) {
            //reset Text
            curOpt.value === 'LabelColumn' && (curOpt.textContent = replaceAll(curOpt.textContent, "_LabelColumnText_", seriesInfo.getLabelText()))
            curOpt.value === 'DataColumn' && (curOpt.textContent = replaceAll(curOpt.textContent, "_DataColumnText_", seriesInfo.getDataText()))
            curOpt.value === 'AdditionCol' && (curOpt.textContent = replaceAll(curOpt.textContent, "_AddtionalColumnText_", seriesInfo.getAddtionalText()))

            //NOTE: IF USE Clone eleTemplate and then change attribute, then dont forget change all attribute value whose value CONTAINS(<B>NOT startsWith</B>) '_InputPanelID_'
            //SEEMS replate innerText be simpler.
            var inputPanel = rdShowCustomColorDialog_CreateInputPanel(eleTemplate.innerHTML, retPanel.id + "II" + curOpt.value,
                (curOpt.value === 'LabelColumn' ? "TEXT" : curOpt.value === 'DataColumn' ? "NUMBERIC" : !seriesInfo.sAFunc ? "TEXT" : "NUMBERIC"),
                (initBaseOn === curOpt.value) ? initClrString : undefined);
            eleTemplate.parentElement.insertBefore(inputPanel, eleTemplate)

            curOpt._editPanel = inputPanel;
            initBaseOn ? (initBaseOn === curOpt.value ? (curOpt.selected = true, curOpt._editPanel.style.display = "") : (curOpt.selected = false, curOpt._editPanel.style.display = "none"))
                : (optIdx != 0 && (inputPanel.style.display = "none"));
            optIdx++;
        } else {
            curOpt.parentElement.removeChild(curOpt);
            optCount--;
        }
    }
    eleSelect.onchange = function () {
        for (var i = 0; i < this.options.length; i++) {
            this.options[i]._editPanel.style.display = this.options[i].selected ? "" : "none";
        }
    };
    eleTemplate.parentElement.removeChild(eleTemplate);

    return retPanel;
}
function rdShowCustomColorDialog_CreateInputPanel(sInputPanelTemplate, sInputPanelId, sDataType, sInitColors) {
    var retPanel = document.createElement("DIV");
    retPanel.setAttribute("id", sInputPanelId);
    retPanel.innerHTML = sInputPanelTemplate.replaceAll ? sInputPanelTemplate.replaceAll("_InputPanelID_", sInputPanelId) : sSeriesPanelTemplate.replace(/_InputPanelID_/g, sInputPanelId);

    var tempEle;
    if (sDataType === "NUMBERIC") {
        tempEle = retPanel.querySelector("#lblStringTypeHelp"); tempEle.parentElement.removeChild(tempEle);
        tempEle = retPanel.querySelector("#lblStringTypeHeader"); tempEle.parentElement.removeChild(tempEle);
    } else {
        tempEle = retPanel.querySelector("#lblNumberTypeHelp"); tempEle.parentElement.removeChild(tempEle);
        tempEle = retPanel.querySelector("#lblNumberTypeHeader"); tempEle.parentElement.removeChild(tempEle);
    }

    var initClrItems = sInitColors ? sInitColors.split("|") : [];
    for (var i = 0; i < initClrItems.length; i++) {
        initClrItems[i] && (
            retPanel.querySelector("input#" + sInputPanelId + "RangeValue" + i).value = initClrItems[i].split(":")[0],
            //NOT USE "input#" + sInputPanelId + "RangeColor" + i for colorpicker NOW:
            //Because 26424, these IDs are reset if there are more then 1 chart in report. Maybe Best solution is let 'ContentTemplate' be shared
            retPanel.querySelector("input[ID^=" + sInputPanelId + "RangeColor" + i + "]").value = initClrItems[i].split(":")[1]);
    }

    return retPanel;
}
function rdShowCustomColorDialog_OK(sReport, sAcId) {
    var dlg = document.getElementById('rdCustomColorDialog_' + sAcId);
    if (dlg.style.display == "none") return;

    var dataCenter = document.getElementById('rdAcCustomColorDataCenter_' + sAcId);
    dataCenter.innerHTML = "";//remove all
    var allSeriesPanels = dlg.querySelectorAll("div[id^='SPL'][rdData-Serieskey]");
    var sIdx = 0;
    for (var i = 0; i < allSeriesPanels.length; i++) {
        var curSeriesPanel = allSeriesPanels[i],
            seriesKey = curSeriesPanel.getAttribute("rdData-Serieskey"),
            sBasedOn = curSeriesPanel.querySelector("#BaseOnSelect_" + sAcId).value,
            allValueInput = curSeriesPanel.querySelectorAll("input[id^='" + curSeriesPanel.id + "II" + sBasedOn + "RangeValue']"),
            allColorInput = curSeriesPanel.querySelectorAll("input[id^='" + curSeriesPanel.id + "II" + sBasedOn + "RangeColor']");

        var sRangeColorString = "";
        for (var j = 0; j < allValueInput.length; j++) {
            if (allColorInput[j].value == "") continue;
            sRangeColorString += allValueInput[j].value + ":" + allColorInput[j].value + "|"
        }
        if (sRangeColorString === "") continue;

        var tmpSuffix = sIdx + '_' + sAcId;
        var eleVar = dataCenter.appendChild(document.createElement("input"));
        eleVar.setAttribute("type", "HIDDEN");
        eleVar.setAttribute("id", "rdAcConditionColorKey" + tmpSuffix);
        eleVar.setAttribute("name", "rdAcConditionColorKey" + tmpSuffix);
        eleVar.setAttribute("value", seriesKey);

        eleVar = dataCenter.appendChild(document.createElement("input"));
        eleVar.setAttribute("type", "HIDDEN");
        eleVar.setAttribute("id", "rdAcConditionColorBase" + tmpSuffix);
        eleVar.setAttribute("name", "rdAcConditionColorBase" + tmpSuffix);
        eleVar.setAttribute("value", sBasedOn);

        eleVar = dataCenter.appendChild(document.createElement("input"));
        eleVar.setAttribute("type", "HIDDEN");
        eleVar.setAttribute("id", "rdAcConditionColorValue" + tmpSuffix);
        eleVar.setAttribute("name", "rdAcConditionColorValue" + tmpSuffix);
        eleVar.setAttribute("value", sRangeColorString);

        sIdx++;
    }

    var eleVar = dataCenter.appendChild(document.createElement("input"));
    eleVar.setAttribute("type", "HIDDEN");
    eleVar.setAttribute("id", "rdAcConditionColorCount_" + sAcId);
    eleVar.setAttribute("name", "rdAcConditionColorCount_" + sAcId);
    eleVar.setAttribute("value", sIdx);

    dlg.querySelector('#PopupPanelContentBody_rdCustomColorDialog_' + sAcId).innerHTML = ""; //Clear all FOR HIDE
    ShowElement(sAcId, 'rdCustomColorDialog_' + sAcId, '', ''); //HIDE

    rdAcUpdateControls(false, sReport, sAcId, false); //Send ACTION.
}