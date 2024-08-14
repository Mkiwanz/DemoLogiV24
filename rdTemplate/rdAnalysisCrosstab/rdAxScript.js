if (window.LogiXML === undefined) {
    window.LogiXML = {};
}

LogiXML.rdAnalysisCrosstab = {
    getBasicElementIDs: function (sType) {
        var ret = {};
        if (sType == "SecLabelColumn") {
            ret = {
                row: "rowAxSecLabelColumn",
                column: "rdAxSecLabelColumn",
                groupingDate: "rdAxSecLabelDateGroupBy",
                divGroupingDate: "divAxSecLabelGroupByDateOperator",
                divMinus: "divMinusSecLabelColumn",
                columns: "rdAxSecLabelColumns"
            }
        } else if (sType == "ExtraLabelColumn"){
            ret = {
                row: "rowAxExtraLabelColumn",
                column: "rdAxExtraLabelColumn",
                groupingDate: "",
                divGroupingDate: "",
                divMinus: "divMinusExtra",
                columns: "rdAxExtraLabelColumns"
            }
        }
        return ret;
    },

    sGetDynamicColumnIdSuffix: function (sType, sAxId, row) {
        if (!row) { return ""; };
        var sRowId = row.getAttribute("ID");
        var elementIds = LogiXML.rdAnalysisCrosstab.getBasicElementIDs(sType);
        var index = sRowId.indexOf(elementIds.row + "_" + sAxId);
        var sSuffix = sRowId.substr(index + (elementIds.row + "_" + sAxId).length)
        return sSuffix
    },

    getCrosstabColumnRow: function (oChild) {
        if (!oChild) return null;
        var p = oChild.parentNode
        while (p) {
            if (p.tagName == 'TR') return p;
            p = p.parentNode
        }
        return null;
    },

    rdAxRemoveDynamicColumn: function (sType, sAxId, row, sSuffix) {
        var elementIds = LogiXML.rdAnalysisCrosstab.getBasicElementIDs(sType);
        var eleExtraColumn = document.getElementById(elementIds.column + '_' + sAxId + sSuffix);
        if (!eleExtraColumn) {
            return
        }

        var rows = LogiXML.rdAnalysisCrosstab.rdAxGetDynamicRows(sType, sAxId);
        if (!row || rows.length <= 1 || rows.indexOf(row) < 0) {
            return
        }
        if (row.nextSibling && rows.indexOf(row) == 0) {
            var lele = Y.one('#' + row.id + " label")._node
            if (lele) {
                if (row.nextSibling.cells.length > 0) {
                    row.nextSibling.cells[0].appendChild(lele)
                }
            }
        }
        row.parentElement.removeChild(row);
    },

    rdAxGetDynamicRows: function (sType, sAxId) {
        // We can not add sAxId as a suffix after ID = "rowsAxControls" for the Theme reason.
        // So, here we first find the "rdAxHeaderColumn_" + sAxId, then get its ancestor which id is "rowsAxControls".
        var axControl = Y.one("#rdAxHeaderColumn_" + sAxId).ancestor("#rowsAxControls");
        if (!axControl) {
            return null;
        }
        var rowtable = axControl._node;
        var rows = rowtable.getElementsByTagName("tr")
        var arrCrosstabRows = [];
        var sId;
        var elementIds = LogiXML.rdAnalysisCrosstab.getBasicElementIDs(sType);
        for (i = 0; i < rows.length; i++) {
            if (!rows[i] || rows[i] == null) continue;
            sId = rows[i].id;
            if (sId == null) { continue; }
            if (sId.indexOf(elementIds.row + "_" + sAxId) < 0) continue;
            arrCrosstabRows.push(rows[i])
        }
        return arrCrosstabRows;
    },

    bNewRow: function (sType, sAxId, row, bAdded) {
        if (!row) return -1;
        var rows = LogiXML.rdAnalysisCrosstab.rdAxGetDynamicRows(sType, sAxId);
        var index = rows.indexOf(row);        
        return index == -1 || index == rows.length - 1;
    },

    rdAxAddDynamicColumnRow: function (sType, sAxId, refrow, actionElement, sSuffix) {
        if (!refrow) { return; }
        var ele = refrow.cloneNode(true)
        refrow.parentNode.insertBefore(ele, refrow.nextSibling)
        var inumber = 0;
        if (!sSuffix) {
            sSuffix = LogiXML.rdAnalysisCrosstab.sGetDynamicColumnIdSuffix(sType, sAxId, refrow)
        }
        inumber = parseInt(sSuffix.substr(sSuffix.indexOf('_') + 1)) + 1;

        var newSuffix = '_' + inumber;
        if (sSuffix == '') {
            LogiXML.rdAnalysisCrosstab.rdAxSetDynamicRowId(sType, sAxId, refrow, newSuffix);
        } else {
            LogiXML.rdAnalysisCrosstab.rdAxSetDynamicRowId(sType, sAxId, ele, newSuffix);
        }
        var leles = Y.all('#' + ele.id + " label")._nodes
        if (leles.length > 0) {
            leles[0].parentNode.removeChild(leles[0]);
        }
        //show "delete" button of action row
        var elementIds = LogiXML.rdAnalysisCrosstab.getBasicElementIDs(sType);
        if (elementIds.divMinus) {
            var sId = actionElement.getAttribute("ID");
            if (elementIds.column) {
                var index = sId.indexOf(elementIds.column + "_" + sAxId);
                var actionSuffix = sId.substr(index + (elementIds.column + "_" + sAxId).length);
                var eleDivDelete = Y.one('#' + elementIds.divMinus + '_' + sAxId + actionSuffix);
                eleDivDelete && eleDivDelete.show();
            }
        }
    },

    rdAxSetDynamicRowId: function (sType, sAxId, elerow, sSuffix) {
        var elementIds = LogiXML.rdAnalysisCrosstab.getBasicElementIDs(sType);
        elerow.id = elementIds.row + '_' + sAxId + sSuffix;
        var leles = Y.all('#' + elerow.id + " select")._nodes;
        var lkeys = [];
        var ids = [elementIds.row, elementIds.column, elementIds.divGroupingDate, elementIds.divMinus];
        for (var i = 0; i < ids.length; i++) {
            if (ids[i]) {
                lkeys.push(ids[i] + "_" + sAxId);
            }
        }
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
            }
        }
    },

    rdAxSetDynamicColumn: function (sType, sAxId, e, sReport, sRemove) {
        if (!e) return;
        var row = LogiXML.rdAnalysisCrosstab.getCrosstabColumnRow(e);
        var sSuffix = LogiXML.rdAnalysisCrosstab.sGetDynamicColumnIdSuffix(sType, sAxId, row)
        if (sRemove) {
            LogiXML.rdAnalysisCrosstab.rdAxRemoveDynamicColumn(sType, sAxId, row, sSuffix)
        } else {
            LogiXML.rdAnalysisCrosstab.rdAxProcessDynamicColumnGroupByDate(sType, sAxId, e);
            if (LogiXML.rdAnalysisCrosstab.bNewRow(sType, sAxId, row, false)) {
                LogiXML.rdAnalysisCrosstab.rdAxAddDynamicColumnRow(sType, sAxId, row, e, sSuffix);
            }
        }
        LogiXML.rdAnalysisCrosstab.updateControls(false, sReport, sAxId, false, e);
        return true;
    },

    rdAxProcessDynamicColumnGroupByDate: function (sType, sAxId, e) {
        if (sType !== 'SecLabelColumn' || !e) return;
        var row = LogiXML.rdAnalysisCrosstab.getCrosstabColumnRow(e);
        var sSuffix = LogiXML.rdAnalysisCrosstab.sGetDynamicColumnIdSuffix(sType, sAxId, row)

        var selectColumn = Y.one('#rdAxSecLabelColumn_' + sAxId + sSuffix);
        var divGrouping = Y.one('#divAxSecLabelGroupByDateOperator_' + sAxId + sSuffix);
        var selectGrouping = Y.one('#rdAxSecLabelDateGroupBy_' + sAxId + sSuffix);
        var sColumn = selectColumn.get('value');
        LogiXML.rdAnalysisCrosstab.setVisibilityForGroupByDateDiv(sColumn, sAxId, divGrouping, selectGrouping);

        return true;
    },

    rdAxSetDynamicColumns: function (sAxId) {
        var sTypes = ["SecLabelColumn", "ExtraLabelColumn"];
        for (var i = 0; i < sTypes.length; i++) {
            var sType = sTypes[i];
            var value = "";
            var rows = LogiXML.rdAnalysisCrosstab.rdAxGetDynamicRows(sType, sAxId);
            var elementIds = LogiXML.rdAnalysisCrosstab.getBasicElementIDs(sType);
            for (var j = 0; j < rows.length; j++) {
                var ssuffix = LogiXML.rdAnalysisCrosstab.sGetDynamicColumnIdSuffix(sType, sAxId, rows[j]);
                var ele = document.getElementById(elementIds.column + '_' + sAxId + ssuffix);
                
                if (ele != null && ele.value != null && ele.value != "") {
                    if (value == "") {
                        value = ele.value;
                    } else {
                        value = value + "," + ele.value;
                    }
                    var eleDivGroupingDate = document.getElementById(elementIds.divGroupingDate + '_' + sAxId + ssuffix);
                    var eleGroupingDate = document.getElementById(elementIds.groupingDate + '_' + sAxId + ssuffix);
                    if (eleGroupingDate != null && eleDivGroupingDate != null && (!eleDivGroupingDate.style || !eleDivGroupingDate.style.display || eleDivGroupingDate.style.display != "none")) {
                        value = value + ":";
                        if (eleGroupingDate.value != null && eleGroupingDate.value != "") {
                            value = value + eleGroupingDate.value;
                        }
                    }
                }
            }
            var eleList = document.getElementById(elementIds.columns + '_' + sAxId);
            if (eleList) { eleList.value = value;}
            //(eleList) && eleList.value = value;
        }
    },

    updateControls: function (bRefresh, sReport, sAxId, bInit, e /*, associatedControlId, valueControlID, groupDropdownId*/) {
        !bInit && LogiXML.rdAnalysisCrosstab.rdAxSetDynamicColumns(sAxId);

        var eleBatchSelection = document.getElementById('lblBatchSelection_' + sAxId)
        if (!eleBatchSelection && !bInit) {  //When not batch selection, update the visualization with every control change.
            bRefresh = true
        }

        var sElementIDs = sAxId + ",divAxControls_" + sAxId + ",cellAxCrosstab_" + sAxId
        sElementIDs += ',lblHeadingAnalCrosstab_' + sAxId;  //This is the AG's panel heading, when running AG.
        var selectHeaderColumn = Y.one('#rdAxHeaderColumn_' + sAxId),
            selectLabelColumn = Y.one('#rdAxLabelColumn_' + sAxId),
            //selectExtraLabelColumn = Y.one('#rdAxExtraLabelColumn_' + sAxId),
            selectValueColumn = Y.one('#rdAxAggrColumn_' + sAxId),
            divHeaderGrouping = Y.one('#divAxHeaderGroupByDateOperator_' + sAxId),
            selectHeaderGrouping = Y.one('#rdAxHeaderDateGroupBy_' + sAxId),
            divLabelGrouping = Y.one('#divAxLabelGroupByDateOperator_' + sAxId),
            selectLabelGrouping = Y.one('#rdAxLabelDateGroupBy_' + sAxId),
            selectAggregate = Y.one('#rdAxAggrFunction_' + sAxId),
            sAggregate = selectAggregate.get('value'),
            sHeaderColumn = selectHeaderColumn.get('value'),
            sLabelColumn = selectLabelColumn.get('value'),
            sValueColumn = selectValueColumn.get('value'),
            isValid = true;

        LogiXML.rdAnalysisCrosstab.setVisibilityForGroupByDateDiv(sHeaderColumn, sAxId, divHeaderGrouping, selectHeaderGrouping);
        LogiXML.rdAnalysisCrosstab.setVisibilityForGroupByDateDiv(sLabelColumn, sAxId, divLabelGrouping, selectLabelGrouping);
        LogiXML.rdAnalysisCrosstab.setVisibilityForAggregateOptions(sAxId, sValueColumn, selectAggregate);
        LogiXML.rdAnalysisCrosstab.setVisibilityForSummaryOptions(sAxId, sAggregate);
        LogiXML.rdAnalysisCrosstab.setVisibilityToReverseColors(sAxId);

        //isValid = LogiXML.rdAnalysisCrosstab.validateForUniqueColumns(sAxId, sHeaderColumn, sLabelColumn, sValueColumn);
        isValid = LogiXML.rdAnalysisCrosstab.validateForUniqueColumns(sAxId);

        var eleBatchSelection = document.getElementById('lblBatchSelection_' + sAxId);
        var eleRefreshDataCache = document.getElementById('rdRefreshDataCache_' + sAxId)
    
        if (bRefresh && isValid) {  //When not batch selection, update the visualization with every control change.
            var sAjaxUrl = 'rdAjaxCommand=RefreshElement&rdAxRefresh=True&rdRefreshElementID=' + sElementIDs + '&rdReport=' + sReport + '&rdAxId=' + sAxId;
            sAjaxUrl = sAjaxUrl + '&rdAxNewCommand=True';
            if (eleRefreshDataCache && eleRefreshDataCache.value) {
                sAjaxUrl = sAjaxUrl + '&rdRefreshDataCache=' + eleRefreshDataCache.value;
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
    },

    setVisibilityForGroupByDateDiv: function (sDataColumn, sAxId, divContainer, selectControl) {
        var eleDateColumnsForGrouping = Y.one('#rdAxPickDateColumnsForGrouping_' + sAxId);
        if (eleDateColumnsForGrouping && (sDataColumn && sDataColumn != '')) {
            var columnsForGrouping = eleDateColumnsForGrouping.get('value');
            var cArray = columnsForGrouping.split(",");
            for (i = 0; i < cArray.length; i++) {
                if (sDataColumn == cArray[i]) {
                    divContainer.show();
                    return;
                }
            }
        }
        divContainer.hide();
    },

    validateForUniqueColumns: function (sAxId) {
        var selectedValues = [];
        selectedValues.push(LogiXML.rdAnalysisCrosstab.rdAxGetSelectedColumnAndGrouping(sAxId, 'rdAxHeaderColumn', 'divAxHeaderGroupByDateOperator', 'rdAxHeaderDateGroupBy'));
        selectedValues.push(LogiXML.rdAnalysisCrosstab.rdAxGetSelectedColumnAndGrouping(sAxId, 'rdAxLabelColumn', 'divAxLabelGroupByDateOperator', 'rdAxLabelDateGroupBy'));
        selectedValues.push(LogiXML.rdAnalysisCrosstab.rdAxGetSelectedColumnAndGrouping(sAxId, 'rdAxAggrColumn'));
        selectedValues = selectedValues.concat(LogiXML.rdAnalysisCrosstab.rdAxGetDynamicSelectedColumnAndGrouping(sAxId, 'rdAxSecLabelColumns'))

        var isValid = true;
        var columns = [];
        for (var i = 0; i < selectedValues.length; i++) {
            if (columns.indexOf(selectedValues[i]) == -1) {
                columns.push(selectedValues[i]);
            } else {
                isValid = false;
                break;
            }
        }

        var errorDiv = Y.one('#divAxError-DuplicateColumn_' + sAxId);
        if (isValid) {
            errorDiv.hide();
        } else {
            errorDiv.show();
        }
        return isValid;
    },

    rdAxGetSelectedColumnAndGrouping: function (sAxId, sColumn, sDivGrouping, sGrouping) {
        var value = Y.one('#' + sColumn + '_' + sAxId).get('value');
        if (sGrouping) {
            var divGrouping = Y.one('#' + sDivGrouping + '_' + sAxId);
            if (divGrouping.getStyle('display') != "none") {
                var tmpValue = Y.one('#' + sGrouping + '_' + sAxId).get('value');
                if (tmpValue) {
                    value = value + ":" + tmpValue;
                }
            }
        }
        return value;
    },

    rdAxGetDynamicSelectedColumnAndGrouping: function (sAxId, sColumns) {
        var values = [];
        var tmpValues = Y.one('#' + sColumns + '_' + sAxId).get('value');
        if (tmpValues) {
            var columnGroupingValues = tmpValues.split(",");
            if (columnGroupingValues && columnGroupingValues.length > 1) {
                for (var j = 0; j < columnGroupingValues.length; j++) {
                    if (columnGroupingValues[j].indexOf(':', columnGroupingValues[j].length - 1) !== -1) {
                        //"orderDate:" -> "orderDate"
                        columnGroupingValues[j] = columnGroupingValues[j].substr(0, columnGroupingValues[j].length - 1);
                    }
                    values.push(columnGroupingValues[j]);
                }
            }
        }
        return values;
    },

     setVisibilityForAggregateOptions: function (sAxId, sDataColumn, selectControl) {
        var dataColumnDetailsArray = Y.one("#rdAxDataColumnDetails_" + sAxId).get('value').split(","),
            dataColumnDetailsDictionary = {},
            selectedValue = selectControl.get('value'),
            allOptions = selectControl.getAttribute('data-all-options');

        //save all options if empty
        if (!allOptions || allOptions == '') {
            allOptions = '';
            selectControl.get('children').each(function (node) {
                allOptions += node.get('outerHTML');
            });
            selectControl.setAttribute('data-all-options', allOptions);
        }

        //restore dictionary
        for (var i = 1; i < dataColumnDetailsArray.length; i++) {
            var splitedKeyValuePair = dataColumnDetailsArray[i].split(":");
            dataColumnDetailsDictionary[splitedKeyValuePair[0]] = splitedKeyValuePair[1];
        }

        if (dataColumnDetailsDictionary[sDataColumn] != "Number") {
            var extraOptionsEnabled = document.getElementById('rdEnableAnyForTextCrosstabs'); //RD21323
            if (extraOptionsEnabled) {
                selectControl.get('children').each(function (node) {
                    if ((node.get('value').indexOf('Count') == -1) && (node.get('value').indexOf('Max') == -1) && (node.get('value').indexOf('Min') == -1)) {
                        node.remove();
                    }
                });
            } else {
                selectControl.get('children').each(function (node) {
                    if (node.get('value').indexOf('Count') == -1) {
                        node.remove();
                    }
                });

                if (selectedValue.indexOf('Count') == -1) {
                    selectControl.set('value', 'Count');
                }
            }           
        } else if (selectControl.get('children').size() < 3) {
            selectControl.get('childNodes').remove();
            selectControl.set('innerHTML', allOptions);
            selectControl.set('value', selectedValue);
        }
    },

    setVisibilityForSummaryOptions: function (sAxId, sAggrFunction) {
        var selectSummary = Y.one('#rdAxSummaryFunction_' + sAxId)
        var selectSummaryAvg = Y.one('#rdAxSummaryFunctionAvg_' + sAxId)
        if (sAggrFunction == "Average") {
            selectSummary._node.style.display = "none"
            selectSummaryAvg._node.style.display = ""
        } else {
            selectSummary._node.style.display = ""
            selectSummaryAvg._node.style.display = "none"
        }

        var selectSummaryOptions = Y.one('#rowCrosstabSummaryFunction_' + sAxId)
        if (document.getElementById('rdAxActiveSqlMode_' + sAxId)) {
            //Using ActiveSQL
            if (sAggrFunction == "Sum" || sAggrFunction == "Count" || sAggrFunction == "DistinctCount") {
                selectSummaryOptions._node.style.display = ""
            } else {
                //Hide all summary options.
                selectSummaryOptions._node.style.display = "none"
                selectSummary._node.options[0].selected = true
                selectSummaryAvg._node.options[0].selected = true
            }
        } else {
            if (sAggrFunction == "Stdev") {
                //Hide all summary options.
                selectSummaryOptions._node.style.display = "none"
                selectSummary._node.options[0].selected = true
                selectSummaryAvg._node.options[0].selected = true
            } else {
                selectSummaryOptions._node.style.display = ""
            }
        }
        
     },

    setVisibilityToReverseColors: function (sAxId) {
        var checked = document.getElementById('rdAxComparisionCheckbox_' + sAxId).checked;
        var row = document.getElementById('rowAxComparisonColors_' + sAxId);
        if (!row) {
            return;
        }
        if (!checked) {
            row.style.display = 'none';
        } else {
            row.style.display = 'table-row';
        }
    },

    showAddToDashboard: function (sAxId) {
    if (typeof LogiXML.AnalysisGrid.rdAgToggleChartPanel === "function") {
        var eleAddToDashboard = document.getElementById("colAnalCrosstabAddDashboard_" + sAxId)
        if (eleAddToDashboard) {
            eleAddToDashboard.style.display = ''
        }
        var eleExportLinks = document.getElementById("colCrosstabExportControls_" + sAxId)
        if (eleExportLinks) {
            eleExportLinks.style.display = ''
        }
    }
}
};