YUI.add('rd-inputCheckList-plugin', function (Y) {
    //'use strict;

    //Define querySelectorAll if it's not defined (IE7)
    if (!document.querySelectorAll) {
        (function (d, s) { d = document, s = d.createStyleSheet(); d.querySelectorAll = function (r, c, i, j, a) { a = d.all, c = [], r = r.split(','); for (i = r.length; i--;) { s.addRule(r[i], 'k:v'); for (j = a.length; j--;) a[j].currentStyle.k && c.push(a[j]); s.removeRule(0) } return c } })()
    }
    //create namespaced plugin class
    Y.namespace('LogiXML').rdInputCheckList = Y.Base.create("rdInputCheckList", Y.Plugin.Base, [], {
		_noneSelectedText: 'Select options',
		_selectedText: '# selected',
		_multiple: true,
		_isDropdown: false,
		_isOpen: false,
        _isHierarchical: false,
		_valueDelimiter: ",",
		_saveInLocalStorage: false,
		_columns: 1,
		_checkAllIsVisible: false,
		_maxLevel: 0,
		_leafNodes: 0,
		_listCaptionsElementId: "",
		_onchangeHandlers: [],
		_actions: [],
        //constructor
		initializer: function () {
		    this._container = this.get("host");
		    this._id = this._container.getAttribute("id");
		    if (!Y.Lang.isValue(this._container) || !Y.Lang.isValue(this._id)) {
		        return;
		    }
		    var sIsDropdown = this._container.getAttribute("data-dropdown");
		    if (Y.Lang.isString(sIsDropdown) && sIsDropdown.toLowerCase() === "true") {
		        this._isDropdown = true;
		    }
		    var multiple = this._container.getAttribute("data-multiple");
		    this._multiple = LogiXML.String.isBlank(multiple) ? true : multiple == "False" ? false : true;
		    // is there check-all? 21775
		    this._checkAllBtn = Y.one("#" + this._id + "_check_all");
		    this._inputs = Y.all('input[type="checkbox"][id^="' + this._id + '_rdList"]');

		    if (this._inputs.size() > 0 && this._inputs._nodes[0]) {
		        if (this._inputs._nodes[0].getAttribute("rdLevel")) {
		            this._isHierarchical = true;

		            var leafNodes = document.querySelectorAll('[rdLeaf][id^="' + this._id + '_rdList"]');
		            this._leafNodes = leafNodes.length;
		        }
		    }
		    //IE7
		    if (this._inputs.size() > 0 && this._inputs.item(0).get("id").indexOf("check_all") != -1) {
		        this._inputs = this._inputs.slice(1, this._inputs.size());
		    }	
		    if (this._checkAllBtn) {
		        if (this._multiple == false || this._inputs.size() <= 1) {
		            this._checkAllBtn.get('parentNode').hide();
		        } else {
		            this._checkAllIsVisible = true;
		        }
		    }
		    this._noneSelectedText = this._container.getAttribute("data-noneselected-caption");
		    this._selectedText = this._container.getAttribute("data-selected-caption");
		    if (this._isDropdown === true) {
		        this._dropDownHandler = Y.one("#" + this._id + "_handler");
		        this._caption = this._dropDownHandler.one("span.rd-checkboxlist-caption");
		        this._img = this._dropDownHandler.one("span.rd-checkboxlist-icon");
		        this._spacer = Y.Node.create('<img style="height:1px;" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="""" />');
		        this._container.append(this._spacer);
		        //attach events
		        this._docClickHandle = Y.one("document").on("mousedown", function (e) {this.onDocMouseDown(e); }, this);
				this._dropDownHandle = this._dropDownHandler.on("click", function (e) {this.togglePopup(e); }, this);

				//attach QuickFilter
				var itemCount = this._inputs.size();
				var sIsQuickFilter = this._container.getAttribute("data-rd-filter")
				var bQuickFilter = true
				if (Y.Lang.isString(sIsQuickFilter) && sIsQuickFilter.toLowerCase() === "false") {
					bQuickFilter = false
				} else {
					var upperlimit = parseInt(sIsQuickFilter);
					if (isNaN(upperlimit)){
						upperlimit = -1
					}
					bQuickFilter = itemCount >= upperlimit;
                }
				if (bQuickFilter) {
					//NOTE: Currently, only the 'dropdownlist' is public to users for quick filtering. Once the 'list' is also required to be disclosed, consider moving the following methods into this plugin.
					//refactory on REPDEV-25444
					this._dropdownQFHandler = LogiXML.rdQuickFilterSupport.enableQuickFilterOnCheckBoxList(this._id)
				}
		    }
		    if (this._checkAllIsVisible === true) {
		        this._handleCheckAll = this._checkAllBtn.on("click", function (e) {this.onCheckAllClicked(e); }, this);
		    }
		    this._inputsHandle = this._inputs.on("click", function (e) {this.onCheckboxClicked(e); }, this);
		    //Subscribe for Ajax refreshing?
		    if (Y.Lang.isValue(LogiXML) && Y.Lang.isValue(LogiXML.Ajax)) {
		        var id = this._id;
		        LogiXML.Ajax.AjaxTarget().on('reinitialize', function (e) {var chkList = Y.one("#" + id); if (Y.Lang.isValue(chkList)) {chkList.plug(Y.LogiXML.rdInputCheckList);}});
		    }
			
		    var actAttributes = ["data-action-onclick","data-action-onchange"], i, length = actAttributes.length, action;
		    this._actions = [];
		    for (i = 0; i < length; i++) {
		        action = this._container.getAttribute(actAttributes[i]);
		        if (LogiXML.String.isNotBlank(action)) {
		            if (action.indexOf("javascript:") == 0) {
		                action = action.substring("javascript:".length);
		
		            }
		        }
		        this._actions.push(action.replace(/'/g,"\""));
		    }

		    //ListCaptionsElementId
		    var listCaptionsElementId = this._container.getAttribute("data-list-captions-element-id");
		    if (listCaptionsElementId && listCaptionsElementId.value !== "") {
		        this._listCaptionsElementId = listCaptionsElementId;
		        var inputListElement = Y.one("#" + this._id);
		        var checkAllCaptureId = "#" + this._id + "_check_all";
		        var checkboxSelector = "input[type=\"checkbox\"]:not(" + checkAllCaptureId + ")";
		        var handler = this.populateHiddenCaption;
		        var sID = this._id
		        this._onchangeHandlers.push(inputListElement.delegate("change", function () { handler(sID) }, checkboxSelector));
		        // initialize the list Captions element.
		        this.populateHiddenCaption(this._id);
            }

		    //Hierarchical
		    var changeHistory = document.getElementById(this._id + "_rdExpandedCollapsedHistory").value;
		    if (changeHistory != "")
		        this.restoreCheckboxState(changeHistory);
		    //Hierarchical
		    var parentNodes = document.querySelectorAll('[rdExpanded]');
		    if (this._isHierarchical) {
		        for (i = 0; i < parentNodes.length; i++) {
		            if(parentNodes[i].getAttribute("rdLevel") == "1")
		                this.initializeExpandCollapse(parentNodes[i], false);
		        }
		    }

		    this.onCheckboxClicked(null);
		    //Element was hidden during loading, make it visible now
            document.getElementById(this._id + "_hideWaiting").style.display = "";

			if (this._isDropdown && this._container.ancestor(".rdResponsiveColumn"))
				this._dropDownHandler.setStyle("max-width", "100%");
        },

        //clean up on destruction
        destructor: function () {
			if (this._handleCheckAll) {
				this._handleCheckAll.detach();
				this._handleCheckAll = null;
			}
			if (this._dropDownHandle) {
				this._dropDownHandle.detach();
				this._dropDownHandle = null;
			}
			if (this._inputsHandle) {
				this._inputsHandle.detach();
				this._inputsHandle = null;
			}
			if (this._docClickHandle) {
				this._docClickHandle.detach();
				this._docClickHandle = null;
			}
			if (this._dropdownQFHandler) {
				this._dropdownQFHandler.detach()
				this._dropdownQFHandler = null;
			}
			if (this._onchangeHandlers) {
			    var i = 0; length = this._onchangeHandlers.length;
			    for (; i < length; i++) {
			        this._onchangeHandlers[i].detach();
			    }
			    this._onchangeHandlers = null;
			}
        },
        
        setCheckboxOpacity: function (eleChk, alpha) {
            if(eleChk.getAttribute("rdChecked") == "some")
                Y.one(eleChk).setStyle('opacity', '0.3');
            else
                Y.one(eleChk).setStyle('opacity', '1.0');
        },
		onCheckAllClicked: function (e) {
		    var isChecked = e.currentTarget.get("checked");
		    var isHiddenCaptionPresented = this._listCaptionsElementId !== "";
		    var hiddenCaptionId = this._listCaptionsElementId;

		    if (isHiddenCaptionPresented) {
		        Y.one("#" + this._listCaptionsElementId).set("value", "");
		       
		    }

		    this._inputs.each(function (node) {
		        var rdLevel = node.getAttribute("rdLevel");
		        node.set("checked", isChecked);
		        if (rdLevel != "") {
			        if (isChecked) {
			            node.setAttribute("rdChecked", "all");
			            Y.one(node).setStyle('opacity', '1.0');
			        }
			        else {
			            node.setAttribute("rdChecked", "none");
			            Y.one(node).setStyle('opacity', '1.0');
			        }
			    }
		    });

		    this.populateHiddenCaption(this._id);

			this.onCheckboxClicked({ checkall: true });
            

		},
		open: function () {
			if (this._isOpen === true) {
				return;
			}
			var popupWidth = this._dropDownHandler.get('offsetWidth');
			var popupPosition = this._dropDownHandler.getXY();
			popupPosition[1] += this._dropDownHandler.get('offsetHeight');
		    var positionValue = "";

			var yuiPopupPanel = Y.one(this._container);
			var dashboardPanel = yuiPopupPanel.ancestor('.rdDashboardPanel');
            
		    if (dashboardPanel && dashboardPanel.getDOMNode()) {
		        dashboardPanel.getDOMNode().setAttribute('oldOpacity', dashboardPanel.getDOMNode().style['opacity']);
		        dashboardPanel.getDOMNode().style['opacity'] = null;
		        positionValue = "fixed";
		    }

            // IE - otherwise the fixed !important will prevent changing it
            this._container._node.style.removeProperty("position");

		    this._container.setStyles({
			    position: positionValue || "absolute",
			    display: "block"
			});
			this._container.setXY(popupPosition);
			this.setPopupWidth();
			this._isOpen = true;

			var ancestorResponsiveColumn = this._container.ancestor(".rdResponsiveColumn");
			if (ancestorResponsiveColumn && ancestorResponsiveColumn.ancestor('.rd-gridsystem-scrollbar-horizontalScrollbar'))
				ancestorResponsiveColumn.setStyle("overflow-x", "visible");

            if (window.resizeCurrentIframe)
                resizeCurrentIframe();
		},
		close: function (e) {
			if (this._isOpen) {
			    this._container.hide();
				this._isOpen = false;

			    var yuiPopupPanel = Y.one(this._container);
			    var dashboardPanel = yuiPopupPanel.ancestor('.rdDashboardPanel');

			    if (dashboardPanel && dashboardPanel.getDOMNode()) {
			        dashboardPanel.getDOMNode().style['opacity'] = dashboardPanel.getDOMNode().getAttribute('oldOpacity');
				}
				if ( this._dropdownQFHandler ) LogiXML.rdQuickFilterSupport.forceSetQuickFilterOnCheckBoxList( this._id, "")
			}
		},
		togglePopup: function () {
			if (!this._isOpen) {
				this.open();
			} else {
				this.close();
			}
		},
		setPopupWidth : function () {
			var ddWidth = this._dropDownHandler.get('offsetWidth');
			this._spacer.setStyle('width', ddWidth + 'px');
			var popupWidth = this._container.get('offsetWidth');
			var diff = popupWidth - ddWidth;
			if (diff > 0) {
				this._spacer.setStyle('width', (ddWidth - diff)  + 'px');
			}
		},
		onDocMouseDown: function (e) {
			if (this._isOpen && e.target !== this._dropDownHandler && !this._dropDownHandler.contains(e.target) && !this._container.contains(e.target)) {
				this.close();
			}
		},

		populateHiddenCaption: function (sInputListID) {
		    var inputListElement = Y.one("#" + sInputListID);
		    var hiddenCaptionField = Y.one("#" + inputListElement.getAttribute("data-list-captions-element-id"));

		    if (hiddenCaptionField) {
		        var tempSelectedValues = "";

		        var checkAllCaptureId = "#" + sInputListID + "_check_all";
		        var checkboxSelector = "input[type=\"checkbox\"]:not(" + checkAllCaptureId + ")";

		        var items = inputListElement.all(checkboxSelector);
		        if (items && items.size() > 0) {
		            for (var i = 0; i < items.size() ; i++) {
		                if (items.item(i).get("checked")) {
		                    if (!(items.item(i).hasAttribute("rdExpanded"))) { // ignore non leaf nodes.
		                        var listItem = items.item(i).ancestor();
		                        tempSelectedValues += LogiXML.decodeHtml(listItem.one("span").get("innerHTML"), true).concat(", ")
		                    }
                        }
		            }
		            tempSelectedValues = tempSelectedValues.substring(0, tempSelectedValues.length - 2);
		        }
		        hiddenCaptionField.set("value", tempSelectedValues);
		    }
		},

		populateHiddenInput: function (sInputListID) {
		    var inputListElement = Y.one("#" + sInputListID);
		    var hiddenCaptionField = Y.one("#" + "rdICL-" + sInputListID );

		    var tempSelectedValues = "";
		    var selectedVals = [];

		    var checkAllCaptureId = "#" + sInputListID + "_check_all";
		    var checkboxSelector = "input[type=\"checkbox\"]:not(" + checkAllCaptureId + ")";

		    var items = inputListElement.all(checkboxSelector);
		    if (items && items.size() > 0) {
				for (var i = 0; i < items.size(); i++) {
					if (items.item(i).get("checked")) {
						if (!(items.item(i).hasAttribute("rdExpanded"))) {
							var inp = items.item(i);
							var sVal = inp.get("value");

							if (selectedVals.indexOf(sVal) == -1) {
								selectedVals.push(sVal)
							}
						}
					}
				}

				var inpDelimiter = this._container.getAttribute("data-delimiter"); //RD20193
				if (!inpDelimiter) {
					inpDelimiter = this._container.getAttribute("rdinputvaluedelimiter");
					if (!inpDelimiter) {
						inpDelimiter = ",";
					}
				}

				if (LogiXML.rdInputTextDelimiter) {
					var qualifier = this._container.getAttribute("data-qualifier");
					var escape = this._container.getAttribute("data-escape");

					tempSelectedValues = LogiXML.rdInputTextDelimiter.delimit(selectedVals, inpDelimiter, qualifier, escape);
				}
				else
					tempSelectedValues = selectedVals.join(inpDelimiter);
		    }
		    hiddenCaptionField.set("value", tempSelectedValues);
		},


        //***Hierarchical Checkbox Functions
		uncheckAllChildren: function(currentNode) {
		    var targetLevel = currentNode.getAttribute("rdLevel");
		    currentNode.setAttribute("rdChecked", "none");

		    var currentLevel = targetLevel;

		    var nextSibling = currentNode.parentNode.parentNode.nextSibling;

		    while (nextSibling) {
		        var nextSiblingInput;
		        for (var i = 0; i < nextSibling.childNodes[0].childNodes.length; i++) {
		            if (nextSibling.childNodes[0].childNodes[i].tagName == "INPUT") {
		                nextSiblingInput = nextSibling.childNodes[0].childNodes[i];
		                break;
		            }
		        }
		        //When we find the next element that is either the same level or higher, we're finished
		        if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) <= parseInt(targetLevel, 10)) {
		            break;
		        }
		        //recursively check all children
		        if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) >= parseInt(targetLevel, 10) + 1) {
		            nextSiblingInput.checked = false;
		            nextSiblingInput.setAttribute("rdChecked", "none");
		            this.uncheckAllChildren(nextSiblingInput);

		        }

		        nextSibling = nextSibling.nextSibling;
		    }
		},
		uncheckAllParents: function(currentNode) {

		    var targetLevel = currentNode.getAttribute("rdLevel");
		    //currentNode.setAttribute("rdChecked", "none");
		    var currentLevel = parseInt(targetLevel, 10) - 1;

		    var prevSibling = currentNode.parentNode.parentNode.previousSibling;
		    while (prevSibling) {
		        var prevSiblingInput;
		        for (var i = 0; i < prevSibling.childNodes[0].childNodes.length; i++) {
		            if (prevSibling.childNodes[0].childNodes[i].tagName == "INPUT") {
		                prevSiblingInput = prevSibling.childNodes[0].childNodes[i];
		                break;
		            }
		        }
		        if (parseInt(prevSiblingInput.getAttribute("rdLevel"),10) == currentLevel) {

		            if (this.someChildrenChecked(prevSiblingInput) === true) {
		                prevSiblingInput.setAttribute("rdChecked", "some");
		                prevSiblingInput.checked = true;
		                this.setCheckboxOpacity(prevSiblingInput, "0.3");
		            }
		            else {
		                prevSiblingInput.checked = false;
		                prevSiblingInput.setAttribute("rdChecked", "none");
		                this.setCheckboxOpacity(prevSiblingInput, "0.0");
		                
		            }
		            this.uncheckAllParents(prevSiblingInput);
		            break;
		        }
		        prevSibling = prevSibling.previousSibling;
		    }
		    
		},
		checkAllChildren: function(currentNode) {
		    var targetLevel = currentNode.getAttribute("rdLevel");
		    currentNode.setAttribute("rdChecked", "all");
		    var currentLevel = targetLevel;

		    var nextSibling = currentNode.parentNode.parentNode.nextSibling;

		    while (nextSibling) {
		        var nextSiblingInput;
		        for (var i = 0; i < nextSibling.childNodes[0].childNodes.length; i++) {
		            if (nextSibling.childNodes[0].childNodes[i].tagName == "INPUT") {
		                nextSiblingInput = nextSibling.childNodes[0].childNodes[i];
		                break;
		            }
		        }
                //When we find the next element that is either the same level or higher, we're finished
		        if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) <= parseInt(targetLevel, 10)) {
		            break;
		        }
                //recursively check all children
		        if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) >= parseInt(targetLevel, 10) + 1) {
		            nextSiblingInput.checked = true;
		            nextSiblingInput.setAttribute("rdChecked", "all");
		            this.setCheckboxOpacity(nextSiblingInput, "0.0");
		            this.checkAllChildren(nextSiblingInput);
		        }

		        nextSibling = nextSibling.nextSibling;
		    }
		},
		initializeExpandCollapse: function (currentNode, hiddenChild) {

		    var targetLevel = parseInt(currentNode.getAttribute("rdLevel"), 10);
		    //First parent will be 1 level up
		    var hideLevel = targetLevel + 1;
		    var nextSibling = currentNode.parentNode.parentNode.nextSibling;
		    var showHide;
		    //showing or hiding?
		    if (currentNode.getAttribute("rdExpanded") == "true") {
		        showHide = "";
		    }
		    else {
		        hiddenChild = true;
		        showHide = "none";
		    }
		    while (nextSibling) {
		        var nextSiblingInput;
		        for (var i = 0; i < nextSibling.childNodes[0].childNodes.length; i++) {
		            if (nextSibling.childNodes[0].childNodes[i].tagName == "INPUT") {
		                nextSiblingInput = nextSibling.childNodes[0].childNodes[i];
		                break;
		            }
		        }
		        //When we find the next element that is either the same level or higher, we're finished
		        if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) == hideLevel) {
		            nextSibling.style.display = showHide;
		            this.initializeExpandCollapse(nextSiblingInput, hiddenChild);
		        }
		        else if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) > hideLevel && hiddenChild)
		            nextSibling.style.display = "none";

		        else if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) < hideLevel) {
		            break;
		        }

		        nextSibling = nextSibling.nextSibling;
		    }
		    
		},
		expandCollapseChildren: function (currentNode) {

		    var targetLevel = parseInt(currentNode.getAttribute("rdLevel"), 10);
		    //First parent will be 1 level up
		    var hideLevel = targetLevel + 1;
		    var nextSibling = currentNode.parentNode.parentNode.nextSibling;
		    var showHide;
		    //showing or hiding?
		    if (currentNode.getAttribute("rdExpanded") == "true") {
		        showHide = "";
		    }
		    else {
		        showHide = "none";
		    }
		    while (nextSibling) {
		        var nextSiblingInput;
		        for (var i = 0; i < nextSibling.childNodes[0].childNodes.length; i++) {
		            if (nextSibling.childNodes[0].childNodes[i].tagName == "INPUT") {
		                nextSiblingInput = nextSibling.childNodes[0].childNodes[i];
		                break;
		            }
		        }
		        //When we find the next element that is either the same level or higher, we're finished
		        if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) == hideLevel && showHide == "") {
		            nextSibling.style.display = showHide;
		            if (nextSiblingInput.getAttribute("rdExpanded") == "true")
		                this.expandCollapseChildren(nextSiblingInput);
		        }
		        else if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) >= hideLevel && showHide == "none") {
		            nextSibling.style.display = showHide;
		        }
		        else if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) < hideLevel) {
		            break;
		        }

		        nextSibling = nextSibling.nextSibling;
		    }
		    
		},
		restoreCheckboxState: function (changeHistory) {
		    //Restore expanded/collapsed status
		    var modifiedBranches = document.getElementById(this._id + "_rdExpandedCollapsedHistory").value.split(",");
		    for (var i = 0; i < modifiedBranches.length; i++) {
		        var statusId = modifiedBranches[i].split(":");
		        var checkbox = document.getElementById(statusId[0]);
		        if (checkbox) {
		            if (statusId[1] == "expanded" && checkbox.getAttribute("rdExpanded") == "false") {
		                //Switch to collapsed symbol
		                //This is the location of the on image
		                checkbox.previousSibling.firstChild.firstChild.firstChild.click();
		            }
		            else if (checkbox.getAttribute("rdExpanded") == "true" && statusId[1] == "collapsed") {
		                //Switch to expanded symbol
		                //This is the location of the off image
		                checkbox.previousSibling.firstChild.childNodes[1].firstChild.click();
		            }
               }
		    }
		},
		checkAllParents: function(currentNode) {
		    //Parent li item is 2 levels up
		    var targetLevel = currentNode.getAttribute("rdLevel");
            //First parent will be 1 level up
		    var currentLevel = parseInt(targetLevel, 10) - 1;
		    var prevSibling = currentNode.parentNode.parentNode.previousSibling;
		    while (prevSibling) {
		        var prevSiblingInput;
		        for (var i = 0; i < prevSibling.childNodes[0].childNodes.length; i++) {
		            if (prevSibling.childNodes[0].childNodes[i].tagName == "INPUT") {
		                prevSiblingInput = prevSibling.childNodes[0].childNodes[i];
		                break;
		            }
		        }
		        if (parseInt(prevSiblingInput.getAttribute("rdLevel"),10) == currentLevel) {

		            if (this.allChildrenChecked(prevSiblingInput) === true) {
		                prevSiblingInput.setAttribute("rdChecked", "all");
		                prevSiblingInput.checked = true;
		                this.setCheckboxOpacity(prevSiblingInput, "0.0");
		            }
		            else {
		                prevSiblingInput.checked = true;
		                prevSiblingInput.setAttribute("rdChecked", "some");
		                this.setCheckboxOpacity(prevSiblingInput, "0.3");
		            }
		            this.checkAllParents(prevSiblingInput);
		            break;
		        }
		        prevSibling = prevSibling.previousSibling;
		    }
		},
		allChildrenChecked: function(currentNode) {

		    var targetLevel = currentNode.getAttribute("rdLevel");
		    var currentLevel = targetLevel;
		    //Parent li item is 2 levels up
		    var nextSibling = currentNode.parentNode.parentNode.nextSibling;
		    while (nextSibling) {
		        var nextSiblingInput;
		        for (var i = 0; i < nextSibling.childNodes[0].childNodes.length; i++) {
		            if (nextSibling.childNodes[0].childNodes[i].tagName == "INPUT") {
		                nextSiblingInput = nextSibling.childNodes[0].childNodes[i];
		                break;
		            }
		        }
		        //When we find the next element that is either the same level or higher, we're finished
		        if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) > targetLevel) {
		            if (nextSiblingInput.getAttribute("rdChecked") != "all")
		                return false;
		        }
		        if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) <= targetLevel) {
		            break;
		        }
		        nextSibling = nextSibling.nextSibling;
		    }
		    return true;
		},
		someChildrenChecked: function(currentNode) {

		    var targetLevel = parseInt(currentNode.getAttribute("rdLevel"), 10);
		    var nextSibling = currentNode.parentNode.parentNode.nextSibling;
		    while (nextSibling) {
		        var nextSiblingInput;
		        for (var i = 0; i < nextSibling.childNodes[0].childNodes.length; i++) {
		            if (nextSibling.childNodes[0].childNodes[i].tagName == "INPUT") {
		                nextSiblingInput = nextSibling.childNodes[0].childNodes[i];
		                break;
		            }
		        }
		        
		        if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) > targetLevel) {
		            if (nextSiblingInput.getAttribute("rdChecked") != "none")
		                return true;
		        }
		        //When we find the previous element that is either the same level or lower, we're finished
		        if (parseInt(nextSiblingInput.getAttribute("rdLevel"), 10) <= targetLevel) {
		            break;
		        }

		        nextSibling = nextSibling.nextSibling;
		    }
            /*
		    var prevSibling = currentNode.parentNode.parentNode.previousSibling;
		    while (prevSibling) {
		        var prevSiblingInput;
		        for (var i = 0; i < prevSibling.childNodes[0].childNodes.length; i++) {
		            if (prevSibling.childNodes[0].childNodes[i].tagName == "INPUT") {
		                prevSiblingInput = prevSibling.childNodes[0].childNodes[i];
		                break;
		            }
		        }
		        
		        if (parseInt(prevSiblingInput.getAttribute("rdLevel"), 10) > targetLevel) {
		            if (prevSiblingInput.getAttribute("rdChecked") != "none")
		                return true;
		        }
		        //When we find the next element that is either the same level or higher, we're finished
		        if (parseInt(prevSiblingInput.getAttribute("rdLevel"), 10) <= targetLevel) {
		            break;
		        }
		        prevSibling = prevSibling.previousSibling;
		    }*/
		    return false;
		},
        //***End Hierarchical Functions
		//QuickFilter
		detectIE: function () {
			/*WHY need detectIE?
			There are so many Dom operation when do QF,
			in test result, In IE, 'RemoveChild(_dataTrNode)'is almost 20 times slower than set 'Display:none', 
			But in other browser, 'removechild' is more quick. */

			//MORE INPORTANT:
			//in Dom-operator, old-Edge is same as IE, so we need check if it is Old-Edge
			//Maybe a few years later, no one's using the old-Egde, we can change to LogiXML.isIE directly
			if ( LogiXML.isIE() ) {
				return true;
			} else {
				// var ua = window.navigator.userAgent;
				// IE 10
				// ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
				// IE 11
				// ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';
				// Edge 12 (Spartan) [Old Edge]
				/* ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko)
					Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';*/
				//Edge 83 [New Edge, built since 2020-01]
				/*"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)
					Chrome/83.0.4103.61 Safari/537.36 Edg/83.0.478.37"*/
				return window.navigator.userAgent.indexOf('Edge/') > 0;
			}
		},
		
        onCheckboxClicked: function (e) {
			var checked = [];
			var id = this._id;
            //only hit this code if its a hierarchical list
			if (e && e.currentTarget && this._isHierarchical) {
			    //Have to go forward to see if all nodes are checked
                //and then backwards to check all parent nodes (differentiated by the attribute rdLevel)
			    var targetNode = e.currentTarget._node;
                //It's been checked
			    if (targetNode.checked === true && targetNode.getAttribute("rdChecked") != "some") {
			        targetNode.setAttribute("rdChecked", "all");
			        this.setCheckboxOpacity(targetNode, "0.0");
			        this.checkAllChildren(targetNode);
                    this.checkAllParents(targetNode);
			    }
			    //it was partially checked
			    else if (targetNode.checked === false && targetNode.getAttribute("rdChecked") == "some") {
                    //Have to recheck it
			        targetNode.checked = true;
			        targetNode.setAttribute("rdChecked", "all");
			        this.setCheckboxOpacity(targetNode, "0.0");
			        this.checkAllChildren(targetNode);
			        this.checkAllParents(targetNode);
			    }
                //it was fully check and now unchecked
			    else {
			        targetNode.setAttribute("rdChecked", "none");
			        this.uncheckAllChildren(targetNode);
			        this.uncheckAllParents(targetNode);
			    }

                //Save checkbox state
				var checkboxStateHidden = document.getElementById(id + "_rdCheckboxState");
				if (checkboxStateHidden) {
					var stateString = "";

					if (LogiXML.rdInputTextDelimiter) {
						var stateArray = [];

						this._inputs.each(function (node) {
							var nodeValue = node._node.value;

							stateArray.push(node._node.getAttribute("rdLevel")
								+ ":"
								+ node._node.getAttribute("rdChecked")
								+ ":" + nodeValue);
						});

						stateString = LogiXML.rdInputTextDelimiter.delimit(stateArray, ",", '"', "\\");
					} else {
						//Remove any possible commas from node value so it doesn't mess up string formatting
						this._inputs.each(function (node) {
							stateString += node._node.getAttribute("rdLevel")
								+ ":"
								+ node._node.getAttribute("rdChecked")
								+ ":"
								+ node._node.value.replace(/,/g, "")
								+ ",";
						});
					}

					checkboxStateHidden.value = stateString;
				}
			}

			if (this._isHierarchical) {
			    this._inputs.each(function (node) {
			        if (node.get("checked") === true && node.get("name") === id) {
			            if (node.getAttribute("rdLeaf") == "true") {
			                checked.push(node);
			                node._node.setAttribute("rdChecked", "all");
			            }
			        }
			    });
                //Initialization specific to hierarchical
			    if (e == null) {
			        for (var i = 0; i < checked.length; i++) {
                        //Check parents of all checked nodes
			            this.checkAllParents(checked[i]._node);
			        }
                    
			    }
			}
			else {
			    this._inputs.each(function (node) {
			        if (node.get("checked") === true && node.get("name") === id) {
			            checked.push(node);
			        }
			    });
			}
			var i, caption = "", length = checked.length;
			if (this._multiple == false && e) {
				for (i = 0; i < length; i++) {
					if (checked[i] != e.currentTarget) {
						checked[i].set('checked', false);
					}
				}
				checked = [];
				length = 0;
				if (e.currentTarget.get('checked') == true) {
					checked.push(e.currentTarget);
					length = 1;
				}
			}
			if ( this._checkAllBtn
					&& (this._checkAllIsVisible || (this._sLastDropdownQF && this._sLastDropdownQF.length > 0))) {
				//_checkAllIsVisible false if none all or searching. use _checkAddBtn for none all 
			    var inputSize = this._inputs.size();
			    if (this._isHierarchical) {
			        inputSize = this._leafNodes;
			    }
                    
			    if (checked.length == inputSize) {
					this._checkAllBtn.set('checked', true);
				} else {
					this._checkAllBtn.set('checked', false);
				}
			}
			if (this._isDropdown == true) {
				for (i = 0; i < length; i++) {
					if (i > 0) {
						caption += ", ";
					}
					caption += checked[i].get('parentNode').one('span').get('text');
				}
				this.setCaption(caption, checked);
			}

			this.populateHiddenInput(this._id);

			if (e && this._actions.length > 0) {
			    this.populateHiddenCaption(this._id); //popluate this before any user defined action.
			    for (i = 0; i < this._actions.length; i++) {
					eval(this._actions[i]);
				}
			}
		},
		setCaption: function (caption, checked) {
			if (caption == "") {
				this._caption.set('text', this._noneSelectedText);
				return;
			}
			this._dropDownHandler.setStyle('position', 'absolute');			

			var currWidth = getCustomCssProperty(this._dropDownHandler.getAttribute('style'), "width");        
			if (currWidth && currWidth.indexOf('%') == -1) {
			    //measure caption length
			    this._caption.hide();
			    var mSpan = Y.Node.create('<span style="visibility: hidden;">0</span>');
			    this._dropDownHandler.append(mSpan);
			    var oldHeight = mSpan.get('offsetHeight');
			    mSpan.set('text', caption);
			    var textWidth = mSpan.get('offsetWidth');
			    var newHeight = mSpan.get('offsetHeight');
			    this._dropDownHandler.removeChild(mSpan);
			    mSpan.destroy();
			    //mSpan.get('parentNode').removeChild(mSpan);
			    this._caption.show();
			    //calculate space for caption
			    var allowedWidth = this._dropDownHandler.get('offsetWidth') - this._img.get('offsetWidth');
			    var padding = this._caption.getX() - this._dropDownHandler.getX();
			    allowedWidth -= padding * 2;
			    if (allowedWidth > textWidth && oldHeight == newHeight) {
			        this._caption.set('text', caption);
			    } else {
			        this._caption.set('text', this._selectedText.replace("#", checked.length).replace("#", this._inputs._nodes.length));
			    }			    		    	    
			} else if (currWidth && currWidth.indexOf('%') != -1 && this._container && this._container._node && this._container._node.clientWidth) {
			    if (LogiXML.layout.getTextDimensions(caption, {}).width < this._container._node.clientWidth) {
			        this._caption.set('text', caption);
			    } else {
			        this._caption.set('text', this._selectedText.replace("#", checked.length).replace("#", this._inputs._nodes.length));
			    }			
			} else {
			    if (LogiXML.layout.getTextDimensions(caption, {}).width < LogiXML.layout.getTextDimensions("", {}, this._dropDownHandler.getAttribute("class")).width) {
			        this._caption.set('text', caption);
			    } else {
			        this._caption.set('text', this._selectedText.replace("#", checked.length).replace("#", this._inputs._nodes.length));
			    }
			}
			this._dropDownHandler.setStyle('position', 'relative');
		}
    }, {
		NAME: "rdInputCheckList",
        NS: "rdInputCheckList",
        ATTRS: {}
    });
}, "1.0.0", { requires: ['base', 'plugin', 'json'] });

if (this.LogiXML === undefined) {
    this.LogiXML = {};
    this.LogiXML.rd = {};
} else if (this.LogiXML.rd === undefined) {
    this.LogiXML.rd = {};
}

//Temporary. Should be moved somewhere else.
LogiXML.rd.setInputElementListValue = function (elementId, sValue) {
	//'use strict;
	var listContainer = Y.one("#" + elementId);
	if (!Y.Lang.isValue(listContainer)) {
		return;
	}

	var sValueDelimiter = listContainer.getAttribute("rdInputValueDelimiter");
	if (!sValueDelimiter)
		sValueDelimiter = ",";

	var aValues;

	if (LogiXML.rdInputTextDelimiter)
		aValues = LogiXML.rdInputTextDelimiter.getEntries(sValue, sValueDelimiter, '"', "\\", false);
	else {
		sValue = sValue.replace(", ", ",");
		aValues = sValue.split(sValueDelimiter);
	}

	var listItems = listContainer.all('[id^=' + elementId + '_rdList]');
	var i, listLength = listItems.size(), listItemType = "";
	var bOneUnchecked = false;
	var bOneChecked = false;
	var cb;

	for (i = 0; i < listLength; i++) {
	    listItemType = listItems.item(i).getAttribute('type');
		switch (listItemType) {
			case "checkbox":
				cb = listItems.item(i);
				var val;

				var spn = cb._node && cb._node.tagName == "SPAN" ? cb._node.nextElementSibling : null;
				if (spn)
					val = spn.innerText;
				else
					val = cb.get("value");

				if (Y.Array.indexOf(aValues, val) != -1) {
					cb.set('checked', true);
					bOneChecked = true;
				} else {
					cb.set('checked', false);
					bOneUnchecked = true;
				}

				break;
		}
	}

	var checkallItems = listContainer.all('[id^=' + elementId + '_check_all]');
	if (checkallItems) {
		var listLength = checkallItems.size();
		if (listLength > 0) {
			var listItemType = checkallItems.item(0).getAttribute('type');
			if ("checkbox" == listItemType) {
				cb = checkallItems.item(0);
				cb.set('checked', bOneChecked && !bOneUnchecked);
			}
		}
	}

	if (listContainer.rdInputCheckList && listContainer.rdInputCheckList.populateHiddenInput)
		listContainer.rdInputCheckList.populateHiddenInput(elementId);
};

//Temporary. Should be moved somewhere else.
LogiXML.rdQuickFilterSupport = LogiXML.rdQuickFilterSupport || {
	detectIE: function () {
		/*WHY need detectIE?
		There are so many Dom operation when do QF,
		in test result, In IE, 'RemoveChild(_dataTrNode)'is almost 20 times slower than set 'Display:none', 
		But in other browser, 'removechild' is more quick. */

		//MORE INPORTANT:
		//in Dom-operator, old-Edge is same as IE, so we need check if it is Old-Edge
		//Maybe a few years later, no one's using the old-Egde, we can change to LogiXML.isIE directly
		if (LogiXML.isIE()) {
			return true;
		} else {
			// var ua = window.navigator.userAgent;
			// IE 10
			// ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
			// IE 11
			// ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';
			// Edge 12 (Spartan) [Old Edge]
			/* ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko)
				Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';*/
			//Edge 83 [New Edge, built since 2020-01]
			/*"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)
				Chrome/83.0.4103.61 Safari/537.36 Edg/83.0.478.37"*/
			return window.navigator.userAgent.indexOf('Edge/') > 0;
		}
	},
	//NOTE[1]: Currently, only the 'dropdownlist' is public to users for quick filtering.[REPDEV-24090]
	//NOTE[2]: REPDEV-25444 requires do quick filtering on AnalysisFilterDistinctValues--that is a 'list'
	//SO CODE is put here because [1], and Once the 'list' is also required to be disclosed, consider moving the follows into plugin.
	enableQuickFilterOnCheckBoxList: function (sID) {
		var container = document.getElementById(sID);
		//NOTE:  NOT FORGET "EnableSearch" attribute on InputCheckBoxList-component. Now it is checked in plugin#initilizer.
		//Why Enter(keycode=13)  pressed, return false (DO NOTHING), see REPDEV-29580
		var yInput = Y.Node.create('<input type="text" id="' + sID + '_QF" class="rdThemeInput" placeholder="Quick Filter" onkeydown="if(event.keyCode==13){return false;}"/>');
		container.insertBefore(yInput._node, container.firstElementChild) //Now container only has 1 child.(IE does not support 'prepend')
		//Note: We may need to check the input status (for example, the user is using Microsoft Pinyin to input Chinese).
		//But now(20200526),on my test(, oncompositionstart and oncompositionend is no effect.
		return yInput.on("keyup", function (e) { LogiXML.rdQuickFilterSupport._doQuickFilterOnInputCheckBoxList(yInput._node.value, sID); });
		//RETURN NOTHING if FAILED(or say CANNOT ENABLE).
	},
	forceSetQuickFilterOnCheckBoxList: function (sID, sInputValue) {
		var container = document.getElementById(sID);
		var yInput = Y.one("#" + sID + " input[type='text']#" + sID + "_QF");
		if (yInput) {
			if (yInput.get("value") == sInputValue) {
				return;
			}
			yInput.set("value", sInputValue);
			LogiXML.rdQuickFilterSupport._doQuickFilterOnInputCheckBoxList(sInputValue, sID)
		}
	},
	_doQuickFilterOnInputCheckBoxList: function (sInputValue, sContainerID) {
		var container = document.getElementById(sContainerID);
		var sqText = sInputValue ? sInputValue.toLowerCase() : '';

		var allInputs_Y = Y.all('input[type="checkbox"][id^="' + sContainerID + '_rdList"]'); //Not include CheckAll
		var inputSize = allInputs_Y.size();
		if (inputSize == 0) return;

		var isDoFilter = (sqText.length > 0); //FALSE->CLEAR QF

		var dataTRNode = Y.one("#" + sContainerID + "_container>tbody>tr")._node;
		var chkAllBtn_Y = Y.one("#" + sContainerID + "_check_all");

		//note1: following will many SHOW/HIDEs, remove then append back is faster
		//note2: In IE, set display:none is faster than removechild. (about 20 times)
		var isIE = LogiXML.rdQuickFilterSupport.detectIE()
		if (isIE) {
			trFlagValue = dataTRNode.getAttribute('display');
			dataTRNode.setAttribute('display', 'none');
		} else {
			trFlagValue = dataTRNode.parentNode;
			trFlagValue.removeChild(dataTRNode);
		}

		try {
			if (chkAllBtn_Y) {
				if (isDoFilter) {
					chkAllBtn_Y.get('parentNode').hide();//Label yNode
				} else if (inputSize > 1) {
					chkAllBtn_Y.get('parentNode').show();
				}
			}//[check all]

			var nColumnCount = container.getAttribute("data-columns");
			if (nColumnCount == 1) {
				for (var iIdx = 0; iIdx < inputSize; iIdx++) {
					var curInput_Y = allInputs_Y.item(iIdx);
					var curInputParent_Y = curInput_Y.get('parentNode');//Label yNode (NOT need to get LI node for SHOW/HIDE)
					if (isDoFilter) {
						var valueNode = curInput_Y._node.nextElementSibling; //SPAN Node
						if (!valueNode) valueNode = curInputParent_Y._node
						orgValue = valueNode.textContent ? valueNode.textContent : valueNode.innerText //Mozilla or IE

						if (orgValue.toLowerCase().indexOf(sqText) >= 0) {
							if (curInputParent_Y._isHidden()) curInputParent_Y.show();
						} else {
							if (!curInputParent_Y._isHidden()) curInputParent_Y.hide();
						}
					} else {
						if (curInputParent_Y._isHidden()) curInputParent_Y.show();
					}
				}
			} else {
				//[1] Build an index for the first search and use it for future searches
				//[2] Actual search and HIDE unmatched.
				//[3] redisplay matching in columns (refer to rdServerHtmlFixup)
				//Because of the moving in [3], [1] is necessary to build an index at the first search 
				var arrayIndexedInputParents_Y = new Array(inputSize);//Label yNode List 
				var nVisibleInputParentCount = 0
				for (var iIdx = 0; iIdx < inputSize; iIdx++) {
					var curInput_Y = allInputs_Y.item(iIdx);
					var curInputParent_Y = curInput_Y.get('parentNode');//Label yNode(NOT need to get LI node for SHOW/HIDE)

					var pIdx = iIdx;
					if (!curInputParent_Y.hasAttribute("rdQFIndex")) {
						isDoFilter && curInputParent_Y.setAttribute("rdQFIndex", iIdx);
					} else {
						pIdx = curInputParent_Y.getAttribute("rdQFIndex");
						(!isDoFilter) && curInputParent_Y.removeAttribute("rdQFIndex")
					}
					arrayIndexedInputParents_Y[pIdx] = curInputParent_Y //[1]

					if (isDoFilter) {
						var valueNode = curInput_Y._node.nextElementSibling; //SPAN Node
						if (!valueNode) valueNode = curInputParent_Y._node
						orgValue = valueNode.textContent ? valueNode.textContent : valueNode.innerText //Mozilla or IE

						if (orgValue.toLowerCase().indexOf(sqText) >= 0) {
							curInputParent_Y._isHidden() && curInputParent_Y.show();
							nVisibleInputParentCount++;
						} else {
							 (!curInputParent_Y._isHidden()) && curInputParent_Y.hide();
						}//[2]
					} else {
						nVisibleInputParentCount++;
						curInputParent_Y._isHidden() && curInputParent_Y.show(); //[2]
					}
				}
				//[3]
				var nRowsPerCol = Math.ceil(nVisibleInputParentCount / nColumnCount);
				var targetTDNode = dataTRNode.firstElementChild;
				var targetULNode = targetTDNode.firstElementChild
				var rowCount = (!isDoFilter && chkAllBtn_Y && !chkAllBtn_Y._isHidden()) ? 1 : 0; //Check-all is in first column.
				for (var iIdx = 0; iIdx < inputSize; iIdx++) {
					var curInputParent_Y = arrayIndexedInputParents_Y[iIdx];
					if (curInputParent_Y._isHidden()) continue;

					targetULNode.appendChild(curInputParent_Y._node.parentNode);//MOVE CHILD

					rowCount++;
					if (rowCount == nRowsPerCol) {
						targetTDNode = targetTDNode.nextElementSibling
						if (!targetTDNode) break;//ERROR PROTECTION.

						targetULNode = targetTDNode.firstElementChild
						rowCount = 0;
					}
				}
			}
		} finally {
			isIE ?
				trFlagValue ? dataTRNode.setAttribute('display', trFlagValue) : dataTRNode.removeAttribute('display')
				: trFlagValue.appendChild(dataTRNode);
		}
	},

	//For REPDEV-25444
	enableQuickFilterOnAFDistinctValueTable: function (sID) {
		var container = document.getElementById(sID);
		//Why Enter(keycode=13)  pressed, return false (DO NOTHING), see REPDEV-29580
		var yInput = Y.Node.create('<input type="text" id="' + sID + '_QF" class="rdThemeInput" placeholder="Quick Filter" onkeydown="if(event.keyCode==13){return false;}"/>');

		//NOTE: AFDistinctValueTable(AFDVTable) only has 1 column.
		var searchTR = Y.Node.create('<tr><td></td></tr>');
		searchTR._node.firstChild.appendChild(yInput._node);
		var tBody0 = container.tBodies[0];
		var ntBody = document.createElement("tbody");
		ntBody.appendChild(searchTR._node);
		container.insertBefore(ntBody, tBody0);

		return yInput.on("keyup", function (e) { LogiXML.rdQuickFilterSupport._doQuickFilterOnAFDVTable(yInput._node.value, sID); });
    },
	_doQuickFilterOnAFDVTable : function(sInputValue, sContainerID) {
		var sqText = sInputValue ? sInputValue.toLowerCase() : ''
		//note1: following will many SHOW/HIDEs, remove then append back is faster
		//note2: In IE, set display:none is faster than removechild.
		var allDataTRs_Y = Y.all("#" + sContainerID + ">tbody>tr[row]")

		var dataTRSize = allDataTRs_Y.size();
		if (dataTRSize == 0) return;

		var tBody = allDataTRs_Y.item(0).get("parentNode")._node;

		//note1: following will many SHOW/HIDEs, remove then append back is faster
		//note2: In IE, set display:none is faster than removechild. (about 20 times)
		var isIE = LogiXML.rdQuickFilterSupport.detectIE()
		if (isIE) {
			trFlagValue = tBody.getAttribute('display');
			tBody.setAttribute('display', 'none');
		} else {
			trFlagValue = tBody.parentNode;
			trFlagValue.removeChild(tBody);//NOTE:ONLY 1 TBODY(except BODY for Find-Input-text) in AFDistinctValueTable(AFDVTable)
		}
		try {
			var isDoFilter = sqText.length > 0;
			for (var iIdx = 0; iIdx < dataTRSize; iIdx++) {
				var curDataTR_Y = allDataTRs_Y.item(iIdx)
				if (isDoFilter) {
					var valueNode = curDataTR_Y._node.querySelector("span[id^=\"lblFilter_Row\"]")
					var orgValue = valueNode.textContent ? valueNode.textContent : valueNode.innerText; //Mozilla or IE			
					if (orgValue.toLowerCase().indexOf(sqText) >= 0) {
						curDataTR_Y._isHidden() && curDataTR_Y.show();
					} else {
						(!curDataTR_Y._isHidden()) && curDataTR_Y.hide();
					}
				} else {
					curDataTR_Y._isHidden() && curDataTR_Y.show();
				}
			}
		} finally {
			isIE ?
				trFlagValue ? tBody.setAttribute("display", trFlagValue) : tBody.removeAttribute("display")
				: trFlagValue.appendChild(tBody)
        }
	},
}