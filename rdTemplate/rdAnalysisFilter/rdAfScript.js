var rdAfOperatorListClone

function rdAfUpdateUi(bRefresh, sAfId, sCommand, sFilterID, sAddFilterColumnID, sAddFilterValue, sAddFilterOperator, sPanelInstanceID) {
    if (sCommand == "FilterAdd" || sCommand == "FilterReplace") {
        var sFilterColumnID = document.getElementById("rdAfFilterColumnID_" + sAfId).value;
        if (sFilterColumnID == undefined || sFilterColumnID == "") {
            ShowElement(null, "divFilterError-BlankColumn_" + sAfId, "Show", null)
            return;
        }
    }

    if (!LogiXML || !LogiXML.DOMContentLoaded)
        return setTimeout(function () {
            rdAfUpdateUi(bRefresh, sAfId, sCommand, sFilterID, sAddFilterColumnID, sAddFilterValue, sAddFilterOperator, sPanelInstanceID);
        }, 10);

    if (!rdAfOperatorListClone) {
        //Load all the comparison operators.
        var eleFullOperatorList = document.getElementById("rdAfFilterOperator_" + sAfId)
        if (eleFullOperatorList) {
            rdAfOperatorListClone = eleFullOperatorList.cloneNode(true)
        }
    }
         	
    if (bRefresh) {
        //Refresh the filter element and it's linked elements.
        if (sFilterID == "rdFromSimpleFilterID") {
            var eleSimpleFilterID = document.getElementById("lblSimpleFilterID_" + sAfId)
            sFilterID = eleSimpleFilterID.textContent
        }
        
        var eleUpdateAction = document.getElementById("actAfDesignSave_" + sAfId)
        if (!eleUpdateAction) {
            //Not full-page refresh, get the Ajax RefreshElement href.
            eleUpdateAction = document.getElementById("actAfDesignSaveAjax_" + sAfId)
        }

        var sBookmarkID = LogiXML.getUrlParameter(window.location.href.toString(), "rdBookmarkID");
        var sRefreshScript = LogiXML.getScriptFromLink(eleUpdateAction, false);

        // REPDEV-30323 Add a guid so we can differentiate between a click and a browser refresh
        var sAfCmdReplacement = "rdAfCommand=" + sCommand + "&rdAfCommandID=" + LogiXML.getGuid() + "&";

        if (sBookmarkID && !LogiXML.getUrlParameter(sRefreshScript, "rdBookmarkID")) {
            sAfCmdReplacement += "rdBookmarkID=" + encodeURIComponent(sBookmarkID) + "&";

            var sBookmarkCollection = LogiXML.getUrlParameter(window.location.href.toString(), "rdBookmarkCollection");
            if (sBookmarkCollection && !LogiXML.getUrlParameter(sRefreshScript, "rdBookmarkCollection")) {
                sAfCmdReplacement += "rdBookmarkCollection=" + encodeURIComponent(sBookmarkCollection) + "&";
            }
        }

        sRefreshScript = sRefreshScript.replace("rdAfCommand=&", sAfCmdReplacement);

        //For adding dashboard global filters.
        if (sCommand == "FilterAdd" || sCommand == "FilterSet") {
            if (sAddFilterColumnID) {
                var sAddParams = "&rdAfFilterColumnID_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterColumnID)
                sAddParams += "&rdAfFilterOperator_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterOperator)
                if (sAddFilterOperator == "Range" && sAddFilterValue.indexOf("|") != -1) {
                    sAddParams += "&rdAfFilterValue_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue.split("|")[0])
                    sAddParams += "&rdAfFilterValueMax_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue.split("|")[1])
                } else if (sAddFilterOperator == "Date Range" && sAddFilterValue.indexOf("|") != -1) {
                    sAddParams += "&rdAfFilterValue_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue.split("|")[0])
                    sAddParams += "&rdAfFilterValueMax_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue.split("|")[1])
                } else if (sAddFilterOperator == "In List" || sAddFilterOperator == "Not In List") {
                    sAddParams += "&rdAfFilterValueDelimited_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue)
                } else {
                    sAddParams += "&rdAfFilterValue_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sAddFilterValue)
                }

                if (sPanelInstanceID) {
                    sAddParams += "&rdAfPanelInstanceID_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(sPanelInstanceID)

                    if (document.getElementById("rdFilteredXAxisTimePeriod_" + sPanelInstanceID)) {
                        sAddParams += "&rdFilteredXAxisTimePeriod_" + sAfId + "=" + rdAfEncodeAjaxScriptValue(document.getElementById("rdFilteredXAxisTimePeriod_" + sPanelInstanceID).value)
                    }
                }

            sRefreshScript = sRefreshScript.replace("&rdAfCommand", sAddParams + "&rdAfCommand")
            }
        }

        if (sFilterID)
            sRefreshScript = sRefreshScript.replace("rdAfFilterID=&", "rdAfFilterID=" + sFilterID + "&")

        if (sCommand == "Design" || sCommand == "Simple") {
            //Refresh just the filter controls.
            if (!document.getElementById("rdDashboardPanels")) {
                //Don't do this for Dashboards, when it needs to refresh the entire panel every time.
                sRefreshScript = sRefreshScript.replace("rdRefreshElementID=", "rdRefreshElementID=" + sAfId + "&rdRefreshElementIDnot=")
            }
        }

        var refreshFunction = new Function (sRefreshScript);
        window.setTimeout(refreshFunction, 100);
        return;
    } else {
        var eleAfMode = document.getElementById('rdAfMode_' + sAfId)
        if (!eleAfMode) {
            return
        }

        //Update the UI.
        rdAfUpdateEditControls(sAfId)

        if (document.getElementById('rdAfMode_' + sAfId).value == "Simple") {
            rdAfShowSimpleList(sAfId)
        }
    }
    //for aggregate filter case, don't update the style
    if ("rdAggregateAnalysisFilter" != sAfId) {
        var bFiltersDefined = (document.getElementById("actShowFilter_" + sAfId + "_Row1") || document.getElementById("colSimpleName_" + sAfId + "_Row1")) != null

        //Update the AG's filter tab. If there are filters, it should be bold.
        var eleFilterTab = document.getElementById("colFilter")
        if (eleFilterTab) {
            if (bFiltersDefined) {
                //There is at least one filter.
                eleFilterTab.style.fontWeight = "bold"
            }
        }
    }
   
    //Update the Dashboard panel's filter caption.
    var sCaptionElementID = document.getElementById("rdAfCaptionElementID_" + sAfId).textContent
    if (sCaptionElementID!="") {
        if (sCaptionElementID == "rdPanelFilterCaption" || sAfId.lastIndexOf("_") > 0 ) {
            //Add the panel's InstanceID
            sCaptionElementID += sAfId.substring(sAfId.lastIndexOf("_"))
        }

        rdAfUpdateCaptionElement(sAfId);

        var eleCaptionContainer = document.getElementById(sCaptionElementID + "_Container")
        if (eleCaptionContainer) {
            if (bFiltersDefined) {
                ShowElement(null, eleCaptionContainer.id, "Show")
            }else{
                ShowElement(null, eleCaptionContainer.id, "Hide")
            }
        }
    }

}

function rdAfEncodeAjaxScriptValue(sValue) {
    sValue = rdAjaxEncodeValue(sValue);
    sValue = sValue.replace(/'/g, "%27"); //encode single quotes for javascript.
    return sValue;
}

function rdAfUpdateCaptionElement(sAfId, bCalledOnLoad) {
    // Function gets called to update the AF caption element (if specified)
    var sCaptionElementID = document.getElementById("rdAfCaptionElementID_" + sAfId).textContent
    if (sCaptionElementID != "") {
        if (sCaptionElementID == "rdPanelFilterCaption" || sAfId.lastIndexOf("_") > 0 ) {
            //Add the panel's InstanceID
            sCaptionElementID += sAfId.substring(sAfId.lastIndexOf("_"))
        }

        // Dboard globalfilter caption gets updated momentarily with the ajaxonload, giving a flicker effect - this prevents it.
        if (sCaptionElementID == "rdGlobalFilterCaption" && (!bCalledOnLoad)) {
            return;
        }

        eleFilterCaption = document.getElementById(sCaptionElementID)
        if (eleFilterCaption) {
            eleFilterCaption.textContent = document.getElementById("rdAfCaptionLine_" + sAfId).textContent
            eleFilterCaption.title = document.getElementById("rdAfCaptionList_" + sAfId).textContent
        }
    }
}

function rdAfSetMode(sAfId, sMode) {
    document.getElementById("rdAfMode_" + sAfId).value = sMode
    rdAfUpdateUi(true, sAfId, sMode);
}

function rdAfSetGlobalFilter(bRefresh, sAfId, sPanelInstanceID, sColumnID, sValue, sOperator) {
    rdAfUpdateUi(bRefresh, sAfId, "FilterSet", null, sColumnID, sValue, sOperator, sPanelInstanceID)
}

function rdAfSetPickedFilterCompareColumn(sAfId, ele) {
    var td = ele;

    while (td && td.tagName.toLowerCase() != "td") {
        td = td.parentNode;
    }

    if (!td)
        return;

    var sBracketedColumn = null;
    var inputs = td.getElementsByTagName("INPUT");
    for (var i = 0; i < inputs.length; i++) {
        var inp = inputs[i];
        if (!inp.id)
            continue;

        if (inp.id.indexOf("rdAfFilterCompareColumnBracketed_" + sAfId + "_Row") == 0) {
            sBracketedColumn = inp.value;
            break;
        }
    }

    if (!sBracketedColumn)
        return;

    var txt = null;
    
    if (!LogiXML.rdAfColumnTarget)
        txt = document.getElementById("rdAfFilterValue_" + sAfId);
    else if (LogiXML.rdAfColumnTarget == "Start")
        txt = document.getElementById("rdAfFilterStartDateColumn_" + sAfId);
    else if (LogiXML.rdAfColumnTarget == "End")
        txt = document.getElementById("rdAfFilterEndDateColumn_" + sAfId);
    else if (LogiXML.rdAfColumnTarget == "Max")
        txt = document.getElementById("rdAfFilterValueMax_" + sAfId);

    if (!txt)
        return;

    txt.value = sBracketedColumn;
}

function rdAfCompareColumnCount(sAfId) {
    var table = document.getElementById("dtPickCompareColumn_" + sAfId);
    if (!table)
        return -1;

    var cnt = 0;

    for (var i = 0; i < table.rows.length; i++) {
        if (table.rows[i].style.display != "none")
            cnt++;
    }

    return cnt;
}

function rdAfShowCompareColumnButton(sAfId, sColumnID, sColumnDataType) {
    var atLeastOne = false;
    var hideBtn = false;

    if (sColumnDataType == "Boolean") {
        // only show if Compare Column is selected
        if (document.getElementById("rdAfFilterValueBoolean_" + sAfId).value != "Compare Column")
            hideBtn = true;
    }

    var table = document.getElementById("dtPickCompareColumn_" + sAfId);
    if (!table)
        return false;

    for (var i = 0; i < table.rows.length; i++) {
        var row = table.rows[i];

        row.style.display = "";

        var inputs = row.getElementsByTagName("INPUT");
        var show = !hideBtn;
        for (var j = 0; j < inputs.length; j++) {
            var inp = inputs[j];
            if (!inp.id)
                continue;

            if (inp.id.indexOf("rdAfFilterCompareColumnDataType_" + sAfId + "_Row") == 0) {
                var sDataType = inp.value;
                if (sDataType != sColumnDataType) {
                    row.style.display = "none";
                    show = false;
                    continue;
                }
            }

            if (inp.id.indexOf("rdAfFilterCompareColumnID_" + sAfId + "_Row") == 0) {
                if (sColumnID == inp.value) {
                    row.style.display = "none";
                    show = false;
                }
            }
        }

        if (show)
            atLeastOne = true;
    }

    if (atLeastOne) {
        if (sColumnDataType.indexOf("Date") != 0) {
            ShowElement(null, "divPickCompareColumnPopUpButton_" + sAfId, "Show");
            ShowElement(null, "divPickCompareColumnPopUpButtonMax_" + sAfId, "Show");
        }
        
        return true;
    }

    return false;
}

function rdAfUpdateEditControls(sAfId, isRestoreFilter) {
    // Function gets called on the onchange event of the Filter column dropdown.   
    this.rdAfRemoveAllWhiteSpaceNodesFromFilterOperatorDropdown(sAfId);        // Do this to clear the FilterOparator dropdown of all whitespace/text nodes.

    rdAfInitControlVisibility(sAfId);

    var eleFilterColumn = document.getElementById("rdAfFilterColumnID_" + sAfId)
    var sColumnDataType = rdAfGetColumnDetails(eleFilterColumn.value, sAfId, "Types")

    if (rdAfOperatorListClone) {
        //Some operators may have been removed.  Restore them all into the select list by restoring from rdAfOperatorListClone.
        var eleFilterOperator = document.getElementById("rdAfFilterOperator_" + sAfId)
        var sFilterOperator = eleFilterOperator.value
        //Remove all existing operator options.
        while (eleFilterOperator.hasChildNodes()) {
            eleFilterOperator.removeChild(eleFilterOperator.lastChild);
        }
        //Copy all operator options from the saved clone.
        for (var i = 0; i < rdAfOperatorListClone.options.length; i++) {
            eleFilterOperator.appendChild(rdAfOperatorListClone.options[i].cloneNode(true))
        }
    }

    
    if (eleFilterColumn.value == "") {
        //No column is selected.
        ShowElement(this.id, 'divFilterValue_' + sAfId, 'Show')         //Show the Value field even though no filter column is selected yet.

    } else {
        var btnCompColShown = rdAfShowCompareColumnButton(sAfId, eleFilterColumn.value, sColumnDataType);

        var ddlDate1;
        var ddlDate2;

        // Should we show the Compare Column option?
        if (sColumnDataType == "Boolean") {
            var ddlBoolean = document.getElementById("rdAfFilterValueBoolean_" + sAfId);
            if (rdAfCompareColumnCount(sAfId) > 0) {
                // Include the Compare Column option
                if (ddlBoolean.options.length == 2) {
                    var opt = document.createElement("OPTION");
                    opt.value = "Compare Column";
                    opt.text = "Compare Column";
                    ddlBoolean.add(opt);
                }
            } else {
                // Do not include the Compare Column option
                if (ddlBoolean.options.length == 3) {
                    ddlBoolean.remove(2);
                }
            }

            // Update True/False to match Format
            var sFormat = rdAfGetColumnDetails(eleFilterColumn.value, sAfId, "Formats");
            var sTrue = "True";
            var sFalse = "False";

            if (sFormat && sFormat.length >= 3) {
                var i = sFormat.indexOf("/");
                if (i > 0 && i < sFormat.length - 1) {
                    sTrue = sFormat.substr(0, i);
                    sFalse = sFormat.substr(i + 1);
                }
            }

            for (i = 0; i < ddlBoolean.options.length; i++) {
                var opt = ddlBoolean.options[i];
                if (opt.value == "True")
                    opt.text = sTrue;
                else if (opt.value == "False")
                    opt.text = sFalse;
            }
        } else if (sColumnDataType == "Date" || sColumnDataType == "DateTime") {
            ddlDate1 = document.getElementById("rdAfSlidingTimeStartDateFilterOperator_" + sAfId);
            ddlDate2 = document.getElementById("rdAfSlidingTimeEndDateFilterOperator_" + sAfId);

            if (rdAfCompareColumnCount(sAfId) > 0) {
                // Include the Compare Column option
                if (ddlDate1.options.length == 2) {
                    var opt = document.createElement("OPTION");
                    opt.value = "Compare Column";
                    opt.text = "Compare Column";
                    ddlDate1.add(opt);
                }
                if (ddlDate2.options.length == 2) {
                    var opt = document.createElement("OPTION");
                    opt.value = "Compare Column";
                    opt.text = "Compare Column";
                    ddlDate2.add(opt);
                }
            } else {
                // Do not include the Compare Column option
                if (ddlDate1.options.length == 3) {
                    ddlDate1.remove(2);
                }
                if (ddlDate2.options.length == 3) {
                    ddlDate2.remove(2);
                }
            }
        }

        if (sColumnDataType == "Boolean" && !btnCompColShown) {
            // Boolean type selected, and not comparing column.
            // For Boolean DataTypes, hide the FilterOperator dropdown.It's "=" only, so hide the operator control.
            ShowElement(this.id, "rowFilterOperator_" + sAfId, "Hide")
            ShowElement(this.id, "divPickBoolean_" + sAfId, "Show")
            eleFilterOperator.value = "="
        } else {  //Not Boolean - or Boolean and Compare Column
            ShowElement(this.id, "rowFilterOperator_" + sAfId, "Show")

            //Remove operators not approprate for the data type.
            var aAllowedOperators;
            if (sColumnDataType == "Date" || sColumnDataType == "DateTime") {
                if (document.getElementById("rdAfPickDistinctColumns_" + sAfId).textContent.indexOf(eleFilterColumn.value + ",") != -1) {
                    aAllowedOperators = ["=", "<", "<=", ">=", ">", "<>", "Date Range", "In List", "Not In List"];
                } else {
                    aAllowedOperators = ["=", "<", "<=", ">=", ">", "<>", "Date Range"]
                }
            } else if (sColumnDataType == "Number") {
                aAllowedOperators = ["=", "<", "<=", ">=", ">", "<>", "In List", "Not In List", "Range"]
            } else if (sColumnDataType == "Boolean") {
                aAllowedOperators = ["=", "<>"];
                ShowElement(null, "divPickBoolean_" + sAfId, "Show");
            } else {  //Text
                aAllowedOperators = ["=", "<", "<=", ">=", ">", "<>", "In List", "Not In List", "Starts With", "Contains", "Not Starts With", "Not Contains"]
                //REPDEV-24492 Add support for LIKE and NOT LIKE Filters in Analysis Filter
                var eleSqlSyntax = document.getElementById("rdAfDataSourceSyntax_" + sAfId)
                var sqlSyntax = eleSqlSyntax.value
                //only SqlServer, MySql, Oracle, PostgreSQL support "[not] like" operation.
                if (sqlSyntax == "SqlServer" || sqlSyntax == "MySql" || sqlSyntax == "Oracle" || sqlSyntax == "PostgreSQL") {
                    aAllowedOperators.push("Like")
                    aAllowedOperators.push("Not Like")
                }
            }

            for (var i = eleFilterOperator.options.length - 1; i > -1; i--) {
                if (aAllowedOperators.indexOf(eleFilterOperator.options[i].value) == -1) {
                    eleFilterOperator.remove(i)
                }
            }

            eleFilterOperator.value = sFilterOperator
            if (eleFilterOperator.options.selectedIndex == -1) {
                eleFilterOperator.options.selectedIndex = 0
                sFilterOperator = eleFilterOperator.value
            }
            
            //For number range, show the max range value.
            if (sFilterOperator == 'Range') {
                ShowElement(this.id, 'divFilterValueMax_' + sAfId, 'Show')
            }

            var divFilterValueId;
            if (sFilterOperator == "In List" || sFilterOperator == "Not In List") {
                divFilterValueId = "divFilterValueDelimited_";
                LogiXML.rdInputTextDelimiter.init();
            }
            else
                divFilterValueId = "divFilterValue_";

            ////Show the Distinct pick/selection list.
            if (sFilterOperator == 'Date Range' || document.getElementById("rdAfPickDateColumns_" + sAfId).textContent.indexOf(eleFilterColumn.value + ",") != -1) {
                ShowElement(this.id, 'divSlidingTimeStartDateFilterOperator_' + sAfId, 'Show');

                switch (ddlDate1.value) {
                    case "Compare Column":
                        ShowElement(this.id, 'divFilterStartDateColumn_' + sAfId, 'Show');
                        break;
                    case "Specific Date":
                        ShowElement(this.id, 'divFilterStartDateCalendar_' + sAfId, 'Show');
                        break;
                    case "Sliding Date":
                        ShowElement(this.id, 'divSlidingTimeStartDateFilterOperatorValues_' + sAfId, 'Show');
                        rdAfUpdateSlidingDateValue(sAfId, true, isRestoreFilter);
                        break;
                }

                if (sFilterOperator == 'Date Range') {
                    ShowElement(this.id, 'divSlidingTimeEndDateFilterOperator_' + sAfId, 'Show');

                    switch (ddlDate2.value) {
                        case "Compare Column":
                            ShowElement(this.id, 'divFilterEndDateColumn_' + sAfId, 'Show');
                            break;
                        case "Specific Date":
                            ShowElement(this.id, 'divFilterEndDateCalendar_' + sAfId, 'Show');
                            break;
                        case "Sliding Date":
                            ShowElement(this.id, 'divSlidingTimeEndDateFilterOperatorValues_' + sAfId, 'Show');
                            rdAfUpdateSlidingDateValue(sAfId, false, isRestoreFilter);
                            break;
                    }
                }

                //Add Time controls
                if (sColumnDataType == "DateTime") {
                    ShowElement(this.id, 'divFilterStartTime_' + sAfId, 'Show')
                    ShowElement(this.id, 'divFilterEndTime_' + sAfId, 'Show')
                }

                // Distinct values popup.
            } else if (document.getElementById("rdAfPickDistinctColumns_" + sAfId).textContent.indexOf(eleFilterColumn.value + ",") != -1 && sFilterOperator != "Range") {
                ShowElement(this.id, 'divPickDistinctPopUpButton_' + sAfId, 'Show')
                ShowElement(this.id, divFilterValueId + sAfId, 'Show')

            }
            else {
                ShowElement(this.id, divFilterValueId + sAfId, 'Show')
            }

        }
    }
}

function rdSetPickDistinctUrl(sAfId) {

    //Put the picked column details into the URL.
    var eleFilterValues = document.getElementById("rdAfFilterValue_" + sAfId)
    var eleFilterValuesDelimited = document.getElementById("rdAfFilterValueDelimited_" + sAfId)
    var eleFilterColumn = document.getElementById("rdAfFilterColumnID_" + sAfId)
    var sDataColumn = rdAfGetColumnDetails(eleFilterColumn.value, sAfId, "DataColumns")
    var sColumnDataType = rdAfGetColumnDetails(eleFilterColumn.value, sAfId, "Types")
    var eleFilterOperator = document.getElementById("rdAfFilterOperator_" + sAfId)
    var elePopupIFrame = document.getElementById("subPickDistinct_" + sAfId)
    var sSrc = elePopupIFrame.getAttribute("data-hiddensourceOriginal");
    if (!sSrc) {
        sSrc = elePopupIFrame.getAttribute("data-hiddensource")
    }
    elePopupIFrame.setAttribute("data-hiddensourceOriginal", sSrc);  //Preserve this in case it's called again.
    sSrc += "&rdAnalysisFilterID=" + encodeURIComponent(sAfId)

    if (eleFilterOperator.value == "In List" || eleFilterOperator.value == "Not In List")
        sSrc += "&rdAfValues=" + encodeURIComponent(eleFilterValuesDelimited.value);
    else
        sSrc += "&rdAfValues=" + encodeURIComponent(eleFilterValues.value);

    sSrc += "&rdAfDataColumn=" + encodeURIComponent(sDataColumn)
    sSrc += "&rdAfColumnDataType=" + encodeURIComponent(sColumnDataType)
    sSrc += "&rdAfFilterOperator=" + encodeURIComponent(eleFilterOperator.value)
    sSrc += "&rdAfColumnFormat=" + encodeURIComponent(rdAfGetColumnDetails(eleFilterColumn.value, sAfId, "Formats"))
    sSrc += "&rdAfDataColumnID=" + encodeURIComponent(eleFilterColumn.value)
    elePopupIFrame.setAttribute("data-hiddensource", sSrc);
}

function rdAfGetColumnDetails(sColumnID, sAfId, sDetailType) {
    //sDetailType must be "Types" or "Formats".
    //These are spans inside a hidden div now...    
    var eleAfDataColumnDetails = document.getElementById('rdAfDataColumn' + sDetailType + '_' + sAfId);
    if (eleAfDataColumnDetails.textContent != '') {
        var sDataColumnDetails = eleAfDataColumnDetails.textContent;
        var aDataColumnDetails = sDataColumnDetails.split(',')
        if (aDataColumnDetails.length > 0) {
            var i;
            for (i = 0; i < aDataColumnDetails.length; i++) {
                var sDataColumnDetail = aDataColumnDetails[i];
                if (sDataColumnDetail.length > 1 && sDataColumnDetail.indexOf(':') > -1) {
                    var sID = sDataColumnDetail.split(':')[0];
                    if (sID == sColumnID) {
                        return sDataColumnDetail.split(':')[1];
                    }
                }
            }
        }
    }
}

function rdAfRemoveAllWhiteSpaceNodesFromFilterOperatorDropdown(sAfId) {
    // Function removes all the unnecessary text/WhiteSpace nodes from the dropdown which cause issues with different browsers.
    var elerdAfFilterOperator = document.getElementById("rdAfFilterOperator_" + sAfId);
    if(elerdAfFilterOperator){
        for(i=0; i<= elerdAfFilterOperator.childNodes.length; i++){
            if(elerdAfFilterOperator.childNodes[i]) 
                if(elerdAfFilterOperator.childNodes[i].nodeName == '#text')
                    elerdAfFilterOperator.removeChild(elerdAfFilterOperator.childNodes[i]);
        }
    }
}

function rdAfMovePopup(popup) {
    if (!popup || !popup.tagName || !popup.parentNode || popup.parentNode.id == "rdMainBody")
        return;

    var main = popup;

    while (main.id != "rdMainBody") {
        main = main.parentNode;
        if (!main)
            return;
    }

    if (main.id == "rdMainBody") {
        main.appendChild(popup);
    }
}

function rdAfShowColumnPickList(btn, sAfId) {
    LogiXML.rdAfColumnTarget = null;
    rdAfMovePopup(document.getElementById("popupPickCompareColumn_" + sAfId));
    ShowElement(btn.id, 'popupPickCompareColumn_' + sAfId, '', '');
}

function rdAfShowColumnMaxPickList(btn, sAfId) {
    LogiXML.rdAfColumnTarget = "Max";
    rdAfMovePopup(document.getElementById("popupPickCompareColumn_" + sAfId));
    ShowElement(btn.id, 'popupPickCompareColumn_' + sAfId, '', '');
}

function rdAfShowColumnStartPickList(btn, sAfId) {
    LogiXML.rdAfColumnTarget = "Start";
    rdAfMovePopup(document.getElementById("popupPickCompareColumn_" + sAfId));
    ShowElement(btn.id, 'popupPickCompareColumn_' + sAfId, '', '');
}

function rdAfShowColumnEndPickList(btn, sAfId) {
    LogiXML.rdAfColumnTarget = "End";
    rdAfMovePopup(document.getElementById("popupPickCompareColumn_" + sAfId));
    ShowElement(btn.id, 'popupPickCompareColumn_' + sAfId, '', '');
}

function rdAfInitControlVisibility(sAfId) {
    // Function hides all the Divs mentioned below used to seperate elements that are used in specific conditions under the Filters section.
    ShowElement(this.id, "divFilterValue_" + sAfId, "Hide", null, "true")
    ShowElement(this.id, "divFilterValueDelimited_" + sAfId, "Hide", null, "true")
    ShowElement(this.id, "divPickDistinctPopUpButton_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divPickCompareColumnPopUpButton_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divPickCompareColumnPopUpButtonMax_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divSlidingTimeStartDateFilterOperator_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divSlidingTimeEndDateFilterOperator_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divSlidingTimeStartDateFilterOperatorValues_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divSlidingTimeEndDateFilterOperatorValues_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divCustomizeTimeStartDateFilterOperatorValues_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divCustomizeTimeEndDateFilterOperatorValues_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divFilterStartDateCalendar_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divFilterEndDateCalendar_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divFilterStartDateColumn_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, "divFilterEndDateColumn_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, 'divFilterStartTime_' + sAfId, 'Hide', null, "true");
    ShowElement(this.id, 'divFilterEndTime_' + sAfId, 'Hide', null, "true");
    ShowElement(this.id, "divPickBoolean_" + sAfId, "Hide", null, "true");
    ShowElement(this.id, 'divFilterValueMax_' + sAfId, 'Hide');
}

function rdAfShowSimpleList(sAfId) {
    ShowElement(this.id, "divFilterValue_" + sAfId, "Hide")
    ShowElement(this.id, "divFilterValueDelimited_" + sAfId, "Hide")
    ShowElement(this.id, "divAfSimpleEditControls_" + sAfId, "Hide")
    ShowElement(this.id, "rowFilterColumn_" + sAfId, "Hide")
    ShowElement(this.id, "rowAddFilter_" + sAfId, "Hide")
    ShowElement(this.id, "rdAfSlidingTimeStartDateFilterOperator_" + sAfId, "Hide")
    ShowElement(this.id, "rdAfSlidingTimeEndDateFilterOperator_" + sAfId, "Hide")
}
		
function rdAfSetPickedFilterValueByRow(sAfId, nPickListRowNr) {
    var fraPopup = document.getElementById("subPickDistinct_" + sAfId);
    var eleValue = fraPopup.contentWindow.document.getElementById("lblFilter_Row" + nPickListRowNr);
    var sValue;
    if (eleValue.textContent) {
        sValue = eleValue.textContent; //Mozilla
    } else {
        sValue = eleValue.innerText;  //IE
    }
    document.getElementById("rdAfFilterValue_" + sAfId).value = sValue;
}

function rdAfSetPickedFilterValues(sAfId, aValues) {
    var input = document.getElementById("rdAfFilterValueDelimited_" + sAfId);
    LogiXML.rdInputTextDelimiter.setEntries(input, aValues);
}

function rdAfRestoreClickedFilter(sAfId, sFilterColumnID, sFilterOperator, sFilterValue, sDateType, sSlidingDateName, sFormat, sRawValue) {
    // Function gets called when a filter link (with the filter info displayed the table) is clicked. 

   //Set the column name.
    document.getElementById("rdAfFilterColumnID_" + sAfId).value = sFilterColumnID;
    rdAfUpdateEditControls(sAfId)  //Update the Operator dropdown list.

    //Set the comparison operator.
    sFilterOperator = sFilterOperator.replace('&lt;', '<');
    document.getElementById("rdAfFilterOperator_" + sAfId).value = sFilterOperator;

    //Set the value(s)
    var sColumnDataType = rdAfGetColumnDetails(sFilterColumnID, sAfId, "Types")

    sFilterValue = LogiXML.decodeHtml(sFilterValue, true);

     //Text and number columns.
    if (sColumnDataType == "Text" || sColumnDataType == "Number") {
        if (sFilterOperator == "Range" && sFilterValue.indexOf("|") != -1) {
            document.getElementById("rdAfFilterValue_" + sAfId).value = sFilterValue.split("|")[0]
            document.getElementById("rdAfFilterValueMax_" + sAfId).value = sFilterValue.split("|")[1]
        } else if (sFilterOperator == "In List" || sFilterOperator == "Not In List") {
            var input = document.getElementById("rdAfFilterValueDelimited_" + sAfId);
            var delimiter = input.getAttribute("data-delimiter");
            var qualifier = input.getAttribute("data-qualifier");
            var escape = input.getAttribute("data-escape");
            var entries = LogiXML.rdInputTextDelimiter.getEntries(sFilterValue, delimiter, qualifier, escape, false);
            setTimeout(function () {
                var input = document.getElementById(this.inputID);
                LogiXML.rdInputTextDelimiter.setEntries(input, this.entries);
            }.bind({
                inputID: input.id,
                entries: entries.slice()
            }), 100);
        } else {
            document.getElementById("rdAfFilterValue_" + sAfId).value = sFilterValue
        }
    }
    //Boolean columns with checkbox.
    if (sColumnDataType == "Boolean") {
        var sFilterValueLower = sFilterValue.toLowerCase()
        if (sFilterValueLower == "false" || sFilterValueLower == "off" || sFilterValueLower == "no" || sFilterValueLower == "0") {
            document.getElementById("rdAfFilterValueBoolean_" + sAfId).checked = false
        } else if (sFilterValueLower == "true" || sFilterValueLower == "on" || sFilterValueLower == "yes" || sFilterValueLower == "1") {
            document.getElementById("rdAfFilterValueBoolean_" + sAfId).checked = true
        }
    }

    //Dates
    //sColumnDataType maybe undefined
    if (sColumnDataType && sColumnDataType.indexOf("Date")!=-1) {
        if (sFilterOperator == "In List" || sFilterOperator == "Not In List") {
            var input = document.getElementById("rdAfFilterValueDelimited_" + sAfId);
            var delimiter = input.getAttribute("data-delimiter");
            var qualifier = input.getAttribute("data-qualifier");
            var escape = input.getAttribute("data-escape");
            var entries = LogiXML.rdInputTextDelimiter.getEntries(sFilterValue, delimiter, qualifier, escape, false);

            setTimeout(function () {
                var input = document.getElementById(this.inputID);
                LogiXML.rdInputTextDelimiter.setEntries(input, this.entries);
            }.bind({
                inputID: input.id,
                entries: entries.slice()
            }), 100);
        } else {
            var sTimeFormat;
            var eleStartTime = document.getElementById("rdAfFilterStartTime_" + sAfId);
            if (eleStartTime)
                sTimeFormat = eleStartTime.getAttribute("rdFormatValue");

            if (!sTimeFormat)
                sTimeFormat = "Long Time";

            var aRaw = sRawValue.split('|');
            var startDateInfo = rdAfGetDateTimeInfo(aRaw[0], sFormat, sTimeFormat);

            var sInputElementValue = startDateInfo.sDateTime;

            if (startDateInfo.bIsColumn) {
                document.getElementById("rdAfFilterStartDate_" + sAfId).value = '';
                document.getElementById("rdAfFilterStartDateColumn_" + sAfId).value = sInputElementValue;
            } else {
                document.getElementById("rdAfFilterStartDate_" + sAfId).value = sInputElementValue;
            }

            document.getElementById("rdAfFilterValue_" + sAfId).value = sInputElementValue;
            document.getElementById("rdAfFilterEndDate_" + sAfId).value = '';
            document.getElementById("rdAfFilterEndDateColumn_" + sAfId).value = '';

            if (sDateType) {
                var sDateTypeOperator = sDateType.split(',')[0];
                if (sDateTypeOperator)
                    document.getElementById("rdAfSlidingTimeStartDateFilterOperator_" + sAfId).value = sDateTypeOperator;
            }
            else {
                document.getElementById("rdAfSlidingTimeStartDateFilterOperator_" + sAfId).value = "Specific Date";
            }

            if (sSlidingDateName) {
                var sSlidingDateValue = sSlidingDateName.split(',')[0];
                if (sSlidingDateValue) {
                    var optionValue = sSlidingDateValue;
                    if (rdAfIsCustomizeFilterValue(sSlidingDateValue)) {
                        optionValue = "Customize...";
                        rdAfRestoreCustomizeDateFilter(sAfId, sSlidingDateValue, sFormat, true);
                    }
                    document.getElementById("rdAfSlidingTimeStartDateFilterOperatorOptions_" + sAfId).value = optionValue;
                }
            }

            var endDateInfo;

            if (aRaw.length > 1) {
                endDateInfo = rdAfGetDateTimeInfo(aRaw[1], sFormat, sTimeFormat);
                sInputElementValue = endDateInfo.sDateTime;

                if (endDateInfo.bIsColumn) {
                    document.getElementById("rdAfFilterEndDateColumn_" + sAfId).value = sInputElementValue;
                    document.getElementById("rdAfFilterEndDate_" + sAfId).value = "";
                } else {
                    document.getElementById("rdAfFilterEndDate_" + sAfId).value = sInputElementValue;
                    document.getElementById("rdAfFilterEndDateColumn_" + sAfId).value = "";
                }

                if (sDateType) {
                    var sDateTypeOperator = sDateType.split(',')[1];
                    if (sDateTypeOperator)
                        document.getElementById("rdAfSlidingTimeEndDateFilterOperator_" + sAfId).value = sDateTypeOperator;
                }
                else {
                    document.getElementById("rdAfSlidingTimeEndDateFilterOperator_" + sAfId).value = "Specific Date";
                }

                if (sSlidingDateName) {
                    var sSlidingDateValue = sSlidingDateName.split(',')[1];
                    if (sSlidingDateValue) {
                        var optionValue = sSlidingDateValue;
                        if (rdAfIsCustomizeFilterValue(sSlidingDateValue)) {
                            optionValue = "Customize...";
                            rdAfRestoreCustomizeDateFilter(sAfId, sSlidingDateValue, sFormat, false);
                        }
                        document.getElementById("rdAfSlidingTimeEndDateFilterOperatorOptions_" + sAfId).value = optionValue;
                    }
                }
            } else {
                endDateInfo = startDateInfo;
            }

            //Split the start time from the date.
            if (document.getElementById("rdAfSlidingTimeStartDateFilterOperator_" + sAfId).value == "Specific Date") {
                if (startDateInfo.sTime) {
                    document.getElementById("rdAfFilterStartDate_" + sAfId).value = startDateInfo.sDate;
                    document.getElementById("rdAfFilterStartTime_" + sAfId).value = startDateInfo.sTime;
                } else {
                    document.getElementById("rdAfFilterStartTime_" + sAfId).value = "";
                }
            }

            //Split the end time from the date.
            if (document.getElementById("rdAfSlidingTimeEndDateFilterOperator_" + sAfId).value == "Specific Date") {
                if (endDateInfo.sTime) {
                    document.getElementById("rdAfFilterEndDate_" + sAfId).value = endDateInfo.sDate;
                    document.getElementById("rdAfFilterEndTime_" + sAfId).value = endDateInfo.sTime;
                } else {
                    document.getElementById("rdAfFilterEndTime_" + sAfId).value = "";
                }
            }
        }
    }
    
    rdAfUpdateEditControls(sAfId, true);

    //Set focus to the first input element.
    if (document.getElementById('rdAfMode_' + sAfId).value=="Design") {  
        //Focus for Simple mode is in rdAfEditSimple.
       document.getElementById("rdAfFilterColumnID_" + sAfId).focus()
    }
}

function rdAfGetCustomizeDateElementIDs(isStartDate) {
    var ret = {};
    if (isStartDate) {
        ret = {
            number: "rdAfCustomizeStartTimeNumber_",
            section: "rdAfCustomizeStartTimeSectionOptions_",
            agoLater: "rdAfCustomizeStartTimeAgoLaterOptions_",
            startEnd: "rdAfCustomizeStartTimeStartEndOptions_",
            timeOffset: "rdAfCustomizeStartTimeOffset_",
            timeOffsetStatus: "rdAfCustomizeStartTimeOffsetStatus_",
            divTimeOffset: "divAfCustomizeStartTimeOffset_"
        };
    } else {
        ret = {
            number: "rdAfCustomizeEndTimeNumber_",
            section: "rdAfCustomizeEndTimeSectionOptions_",
            agoLater: "rdAfCustomizeEndTimeAgoLaterOptions_",
            startEnd: "rdAfCustomizeEndTimeStartEndOptions_",
            timeOffset: "rdAfCustomizeEndTimeOffset_",
            timeOffsetStatus: "rdAfCustomizeEndTimeOffsetStatus_",
            divTimeOffset: "divAfCustomizeEndTimeOffset_"
        };
    }
    return ret;
}

function rdAfConvertSlidingDateValue(sAfId, isStartDate) {
    var slidingDateValueElementId = isStartDate ? 'rdAfSlidingTimeStartDateFilterOperatorOptions_' : 'rdAfSlidingTimeEndDateFilterOperatorOptions_';
    var vSlidingValue = document.getElementById(slidingDateValueElementId + sAfId).value;
    var vCustomizeValue = "";
    switch (vSlidingValue) {
        case "Today":
            vCustomizeValue = "0DaysAgo";
            break;
        case "Yesterday":
            vCustomizeValue = "1DaysAgo";
            break;
        case "Tomorrow":
            vCustomizeValue = "1DaysLater";
            break;
        case "Last Week Start":
            vCustomizeValue = "1WeeksAgoStart";
            break;
        case "Last Week End":
            vCustomizeValue = "1WeeksAgoEnd";
            break;
        case "This Week Start":
            vCustomizeValue = "0WeeksAgoStart";
            break;
        case "This Week End":
            vCustomizeValue = "0WeeksAgoEnd";
            break;
        case "Next Week Start":
            vCustomizeValue = "1WeeksLaterStart";
            break;
        case "Next Week End":
            vCustomizeValue = "1WeeksLaterEnd";
            break;
        case "Last Month Start":
            vCustomizeValue = "1MonthsAgoStart";
            break;
        case "Last Month End":
            vCustomizeValue = "1MonthsAgoEnd";
            break;
        case "This Month Start":
            vCustomizeValue = "0MonthsAgoStart";
            break;
        case "This Month End":
            vCustomizeValue = "0MonthsAgoEnd";
            break;            
        case "Next Month Start":
            vCustomizeValue = "1MonthsLaterStart";
            break;
        case "Next Month End":
            vCustomizeValue = "1MonthsLaterEnd";
            break;
        case "Last Quarter Start":
            vCustomizeValue = "1QuartersAgoStart";
            break;
        case "Last Quarter End":
            vCustomizeValue = "1QuartersAgoEnd";
            break;
        case "This Quarter Start":
            vCustomizeValue = "0QuartersAgoStart";
            break;
        case "This Quarter End":
            vCustomizeValue = "0QuartersAgoEnd";
            break;
        case "Next Quarter Start":
            vCustomizeValue = "1QuartersLaterStart";
            break;
        case "Next Quarter End":
            vCustomizeValue = "1QuartersLaterEnd";
            break;
        case "Last Year Start":
            vCustomizeValue = "1YearsAgoStart";
            break;
        case "Last Year End":
            vCustomizeValue = "1YearsAgoEnd";
            break;
        case "This Year Start":
            vCustomizeValue = "0YearsAgoStart";
            break;
        case "This Year End":
            vCustomizeValue = "0YearsAgoEnd";
            break;
        case "Next Year Start":
            vCustomizeValue = "1YearsLaterStart";
            break;
        case "Next Year End":
            vCustomizeValue = "1YearsLaterEnd";
            break;
        case "7 Days Ago":
            vCustomizeValue = "7DaysAgo";
            break;
        case "10 Days Ago":
            vCustomizeValue = "10DaysAgo";
            break;
        case "30 Days Ago":
            vCustomizeValue = "30DaysAgo";
            break;
        case "60 Days Ago":
            vCustomizeValue = "60DaysAgo";
            break;
        case "90 Days Ago":
            vCustomizeValue = "90DaysAgo";
            break;
        case "180 Days Ago":
            vCustomizeValue = "180DaysAgo";
            break;
        case "365 Days Ago":
            vCustomizeValue = "365DaysAgo";
            break;
        case "Current hour":
            vCustomizeValue = "0HoursAgo";
            break;
        case "Last hour":
            vCustomizeValue = "1HoursAgo";
            break;
        case "Last Fiscal Year Start":
            vCustomizeValue = "1FiscalYearsAgoStart";
            break;
        case "This Fiscal Year Start":
            vCustomizeValue = "0FiscalYearsAgoStart";
            break;
        case "Next Fiscal Year Start":
            vCustomizeValue = "1FiscalYearsLaterStart";
            break;
        case "Last Fiscal Year End":
            vCustomizeValue = "1FiscalYearsAgoEnd";
            break;
        case "This Fiscal Year End":
            vCustomizeValue = "0FiscalYearsAgoEnd";
            break;
        case "Next Fiscal Year End":
            vCustomizeValue = "1FiscalYearsLaterEnd";
            break;
        case "Last Fiscal Quarter Start":
            vCustomizeValue = "1FiscalQuartersAgoStart";
            break;
        case "Last Fiscal Quarter End":
            vCustomizeValue = "1FiscalQuartersAgoEnd";
            break;
        case "This Fiscal Quarter Start":
            vCustomizeValue = "0FiscalQuartersAgoStart";
            break;
        case "This Fiscal Quarter End":
            vCustomizeValue = "0FiscalQuartersAgoEnd";
            break;
        case "Next Fiscal Quarter Start":
            vCustomizeValue = "1FiscalQuartersLaterStart";
            break;
        case "Next Fiscal Quarter End":
            vCustomizeValue = "1FiscalQuartersLaterEnd";
            break;
        default:
            break;
    }

    if (vCustomizeValue) {
        var eleFilterColumn = document.getElementById("rdAfFilterColumnID_" + sAfId);
        var sFormat = rdAfGetColumnDetails(eleFilterColumn.value, sAfId, "Formats");
        rdAfRestoreCustomizeDateFilter(sAfId, vCustomizeValue, sFormat, isStartDate);
        document.getElementById(slidingDateValueElementId + sAfId).value = "Customize...";
        rdAfUpdateSlidingDateValue(sAfId, isStartDate);
    }
}

function rdAfUpdateSlidingDateValue(sAfId, isStartDate, isRestoreFilter) {
    var changedElementId = isStartDate ? "rdAfSlidingTimeStartDateFilterOperatorOptions_" : "rdAfSlidingTimeEndDateFilterOperatorOptions_";
    var divCustomizeDate = isStartDate ? "divCustomizeTimeStartDateFilterOperatorValues_" : "divCustomizeTimeEndDateFilterOperatorValues_";
    var divConvertSlidingValue = isStartDate ? "divSlidingTimeStartDateFilterConvert_" : "divSlidingTimeEndDateFilterConvert_";
    var vSlidingValue = document.getElementById(changedElementId + sAfId).value;
    if (vSlidingValue == "Customize...") {
        ShowElement(this.id, divConvertSlidingValue + sAfId, 'Hide');
        ShowElement(this.id, divCustomizeDate + sAfId, 'Show');
        rdAfUpdateCustomizeDateFilter(sAfId, isStartDate, isRestoreFilter)
    } else {
        ShowElement(this.id, divConvertSlidingValue + sAfId, 'Show');
        ShowElement(this.id, divCustomizeDate + sAfId, 'Hide');
    }
}

function rdAfUpdateCustomizeDateFilter(sAfId, isStartDate, isRestoreFilter) {
    var elementIds = rdAfGetCustomizeDateElementIDs(isStartDate);
    var eleStartEnd = document.getElementById(elementIds.startEnd + sAfId);
    if (isRestoreFilter) {
        var varTimeOffset = document.getElementById(elementIds.timeOffset + sAfId).value;
        if (varTimeOffset) {
            rdAfEnableCustomizeDateFilterTimeOffset(sAfId, isStartDate, true);
            if (!eleStartEnd.value) {
                eleStartEnd.value = "On";
            }
        } else {
            rdAfEnableCustomizeDateFilterTimeOffset(sAfId, isStartDate, false);
        }
    }

    var eleTimeOffsetStatus = document.getElementById(elementIds.timeOffsetStatus + sAfId);
    var vSection = document.getElementById(elementIds.section + sAfId).value;
    var vStartEnd = eleStartEnd.value;
    if (vSection == "Hour") {
        if (vStartEnd == "On") {
            eleStartEnd.value = "";
        }
        rdAfEnableCustomizeDateFilterTimeOffset(sAfId, isStartDate, false);
        vStartEnd = "";
    } else {
        rdAfEnableCustomizeDateFilterTimeOffset(sAfId, isStartDate, true);
    }

    if (vSection != "Hour" && (vSection == "Day" && vStartEnd == "On" || vSection != "Day" && vStartEnd)) {
        ShowElement(this.id, elementIds.divTimeOffset + sAfId, 'Show');
        eleTimeOffsetStatus.value = "1";
    } else {
        ShowElement(this.id, elementIds.divTimeOffset + sAfId, 'Hide');
        eleTimeOffsetStatus.value = "0";
    }
}

// Enable/Disable "On" option in start/end dropdown list
function rdAfEnableCustomizeDateFilterTimeOffset(sAfId, isStartDate, enable) {
    var optionLength = 4;
    var elementIds = rdAfGetCustomizeDateElementIDs(isStartDate);
    var eleStartEnd = document.getElementById(elementIds.startEnd + sAfId);
    if (enable && eleStartEnd.options.length < optionLength) {
        eleStartEnd.options.add(new Option('On', 'On'));
    } else if (!enable && eleStartEnd.options.length == optionLength) {
        eleStartEnd.options.remove(optionLength - 1);
    }
}

var customizeDateValueReg = /^([1-9]\d*|0)(FiscalYears|FiscalQuarters|Hours|Days|Weeks|Months|Quarters|Years)(Ago|Later)(Start|End|)\s?(\d{1,2}:\d{1,2}(?::\d{1,2})?|)/
function rdAfIsCustomizeFilterValue(value) {
    return customizeDateValueReg.test(value);
}

function rdAfRestoreCustomizeDateFilter(sAfId, sSlidingDateName, sFormat, isStartDate) {
    var elementIds = rdAfGetCustomizeDateElementIDs(isStartDate);
    if (sSlidingDateName) {
        var valueArr = sSlidingDateName.split(customizeDateValueReg);

        document.getElementById(elementIds.number + sAfId).value = valueArr[1];
        var sSection = valueArr[2];
        if (sSection == "FiscalYears") {
            sSection = "Fiscal Year";
        } else if (sSection == "FiscalQuarters") {
            sSection = "Fiscal Quarter";
        } else {
            //Remove "s"
            sSection = sSection.substr(0, sSection.length - 1)
        }
        document.getElementById(elementIds.section + sAfId).value = sSection;
        document.getElementById(elementIds.agoLater + sAfId).value = valueArr[3];
        document.getElementById(elementIds.startEnd + sAfId).value = valueArr[4];
        var eleTimeOffset = document.getElementById(elementIds.timeOffset + sAfId);
        if (valueArr[5]) {
            var sTimeFormat = eleTimeOffset.getAttribute("rdFormatValue");
            if (!sTimeFormat)
                sTimeFormat = "Long Time";
            var datetimeInfo = _rdAfGetDateTimeInfo(null, valueArr[5], sFormat, sTimeFormat);
            eleTimeOffset.value = datetimeInfo.sTime;
        } else {
            eleTimeOffset.value = "";
        }
    }
}

function rdAfGetDateTimeInfo(sRawValue, sFormat, sTimeFormat) {
    var sDate = "";
    var sTime = "";
    var sDateTime = "";
    var bIsColumn = false;

    if (sRawValue) {
        if (sRawValue.indexOf('[') >= 0) {
            // Date Column Reference - Not a date value
            bIsColumn = true;
            sDate = sRawValue;
            sDateTime = sRawValue;
        } else {
            var aDateAndTime = sRawValue.split(' ');
            if (aDateAndTime.length == 1) {
                aDateAndTime = sRawValue.split('T')
            }

            sDate = aDateAndTime[0];

            var date = new Date(sDate);
            var isValid = _isVaildDate(date);

            if (sFormat && isValid) {
                // REPDEV-30323 don't display time in date textbox - time has its own textbox
                if (sFormat == sTimeFormat && sFormat.toLowerCase().indexOf("date") == -1 && sFormat.toLowerCase().indexOf("time") >= 0)
                    sFormat = "Short Date";

                sDate = LogiXML.HighchartsFormatters.format(date, sFormat);
            }

            sDateTime = sDate;

            if (aDateAndTime.length > 1) {
                sTime = aDateAndTime[aDateAndTime.length - 1];
                var tmpDatetimeInfo = _rdAfGetDateTimeInfo(date, sTime, sFormat, sTimeFormat);
                sDateTime = tmpDatetimeInfo.sDateTime;
                sTime = tmpDatetimeInfo.sTime;
            }
        }
    }

    return {
        sDate: sDate,
        sTime: sTime,
        sDateTime: sDateTime,
        bIsColumn: bIsColumn
    };
}

function _rdAfGetDateTimeInfo(inputDate, sInputTime, sFormat, sTimeFormat) {
    var sDate = "";
    var sTime = sInputTime;
    var sDateTime = "";

    var date = inputDate;
    if (!date) {
        date = new Date();
    }

    var isValid = _isVaildDate(date);

    if (sFormat && isValid)
        sDate = LogiXML.HighchartsFormatters.format(date, sFormat);

    sDateTime = sDate;

    if (sTime == "00:00:00")
        sTime = "";

    var i = sTime.indexOf(":");
    if (i > 0 && sFormat && isValid) {
        var hour = sTime.substr(0, i);
        if (!isNaN(hour)) {
            var min = sTime.substr(i + 1);
            var sec = 0;
            var ms = 0;

            i = min.indexOf(":");
            if (i > 0) {
                sec = min.substr(i + 1);
                min = min.substr(0, i);

                i = sec.indexOf(".");
                if (i > 0) {
                    ms = sec.substr(i + 1);
                    sec = sec.substr(0, i);
                }
            }

            date.setUTCHours(Number(hour));
            date.setUTCMinutes(Number(min));
            date.setUTCSeconds(Number(sec));
            date.setUTCMilliseconds(Number(ms));

            if (inputDate) {
                sDateTime = LogiXML.HighchartsFormatters.format(date, sFormat);
            }

            if (sTimeFormat)
                sTime = LogiXML.HighchartsFormatters.format(date, sTimeFormat);

            // REPDEV-30323
            if (sDateTime.indexOf(":") == -1 && sDateTime.indexOf(" ") == -1 && sDateTime.indexOf("T") == -1)
                sDateTime = sDateTime + " " + sTime;
        }
    }

    return {
        sTime: sTime,
        sDateTime: sDateTime
    };
}

function _isVaildDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

function rdAfEditSimple(sAfId, sFilterID, nRowNumber, sFilterColumnID, sFilterOperator, sFilterValue, sDateType, sSlidingDateName, sFormat, sRawValue) {
    
    var eleSimpleFilterID = document.getElementById("lblSimpleFilterID_" + sAfId)
    eleSimpleFilterID.textContent = sFilterID

    rdAfRestoreClickedFilter(sAfId, sFilterColumnID, sFilterOperator, sFilterValue, sDateType, sSlidingDateName, sFormat, sRawValue);

    ShowElement(this.id, "rowFilterOperator_" + sAfId, "Hide")
    ShowElement(this.id, "divAfSimpleEditControls_" + sAfId, "Show", "FadeIn")

    //OK button
    ShowElement(this.id, "divSimpleOkCancel_" + sAfId, "Show", "FadeIn")

    //Move the input controls into the table.
    var eleSimpleControls = document.getElementById("divAfSimpleEditControls_" + sAfId)
    var colSimpleName = document.getElementById("colSimpleName_" + sAfId + "_Row" + nRowNumber)
    colSimpleName.parentNode.appendChild(eleSimpleControls)

    //Ensure all filter captions/names are visible, hide this one.
    for (var i = 1; i < 10000; i++) {
        var eleSimpleName = document.getElementById("colSimpleName_" + sAfId + "_Row" + i)
        if (!eleSimpleName) { break }
        ShowElement(this.id, eleSimpleName.id, "Show", "FadeIn")
    }

    ShowElement(this.id, colSimpleName.id, "Hide")

    //Set the column name as the caption for the input controls.
    var sColumnName = colSimpleName.textContent  //Example: "or [Already Shipped] = True"
    var nColNameStart = sColumnName.indexOf("[")
    sColumnName = sColumnName.substring(nColNameStart + 1)            //Example: "Already Shipped] = True"
    sColumnName = sColumnName.substring(0, sColumnName.indexOf("]"))  //Example: "Already Shipped"
    var eleSimpleControls = document.getElementById("lblFilterValue_" + sAfId)
    eleSimpleControls.textContent = sColumnName + ": "
            

    //Set focus to the first input element.
    if (document.getElementById("divFilterValue_" + sAfId).style.display == "") {
        document.getElementById("rdAfFilterValue_" + sAfId).select()
    } else if (document.getElementById("divFilterValueDelimited_" + sAfId).style.display == "") {
        document.getElementById("rdAfFilterValueDelimited_" + sAfId).select()
    }else if (document.getElementById("divPickBoolean_" + sAfId).style.display == "") {
        document.getElementById("rdAfFilterValueBoolean_" + sAfId).focus()
    }else if (document.getElementById("divFilterStartDateCalendar_" + sAfId).style.display == "") {
        document.getElementById("rdAfFilterStartDate_" + sAfId).select()
    }else if (document.getElementById("divSlidingTimeStartDateFilterOperatorValues_" + sAfId).style.display == "") {
        document.getElementById("rdAfSlidingTimeStartDateFilterOperatorOptions_" + sAfId).focus()
    }


}

function rdAfCancelEditSimple(sAfId) {
    ShowElement(this.id, "divAfSimpleEditControls_" + sAfId, "Hide")
    ShowElement(this.id, "divSimpleOkCancel_" + sAfId, "Hide")
    
    //Ensure all filter captions/names are visible.
    for (var i = 1; i < 10000; i++) {
        var eleSimpleName = document.getElementById("colSimpleName_" + sAfId + "_Row" + i)
        if (!eleSimpleName) { break }
        ShowElement(this.id, eleSimpleName.id, "Show")
    }

    //Hack to make Chrome not show in inserted column before the filter caption.
    document.getElementById("dtFilters_" + sAfId).style.display = "none"
    setTimeout(function () {
        document.getElementById("dtFilters_" + sAfId).style.display = ""
    }, 1);

}

