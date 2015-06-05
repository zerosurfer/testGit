
MPage.namespace("OutPatientTimeline.BaseTimelineComponent");
/**
 * Create BaseTimelineComponent from which all other timeline components in the Patient Timeline would inherit
 * @class
 * @constructor
 */
OutPatientTimeline.BaseTimelineComponent = function(){
	this.m_namespace = "";
	//Set the Id of the component content node.
	this.m_componentContentId = "";
	this.m_componentContentTarget = {};

	//Default widths
	this.m_componentContentWidth = 0;
	this.m_leftLabelContainerWidth = 150;
	this.m_rightLabelContainerWidth = 150;
	this.m_contentContainerWidth = 0;
	
	//Set the width of the timeline and data container
	this.m_timelineContainerWidth = 0;
	this.m_dataContainerWidth = 0;
	
	//Width of each column in timeline, data tables
	this.m_dataColumnWidth = 50;
	//Number of data column widths
	this.m_dateColumnCnt = 0;
	
	//Defaults buffers
	this.m_componentContentPadding = 16;
	this.m_pixelBuffer = 2;
	this.m_defaultHeaderHeight = 34;

	//Label table render templates for each row
	//Improve naming.
	this.m_leftLabelTableRowRenderTemplate = "<span class='outptl-label-column-row' title='${SECONDARY_GROUP_NAME}'>${SECONDARY_GROUP_NAME}</span>";
	this.m_rightLabelTableRowRenderTemplate = "<span class='outptl-label-column-row' title='${SECONDARY_GROUP_NAME}'>${SECONDARY_GROUP_NAME}</span>";
 
 	//Reference to the scroll controller
 	//Single instance reference
 	this.m_scrollController = OutPtlScrollController.getInstance();

 };
OutPatientTimeline.BaseTimelineComponent.prototype = new MPage.Component();
OutPatientTimeline.BaseTimelineComponent.prototype.constructor = MPage.Component;
OutPatientTimeline.BaseTimelineComponent.prototype.base = MPage.Component.prototype;
/**
 * generateComponentContent Returns the html for the whole component
 * @param {String} compId the unique namespace and component identification.
 * @param {Object} recordData JSON object of the data that will be displayed on the table.
 * @returns {String} an HTML string for the whole table container.
 */
OutPatientTimeline.BaseTimelineComponent.prototype.generateComponentContent = function(compId, recordData){
	this.preProcess(compId, recordData);
	var $componentWrapper = $("#" + this.m_namespace + "componentWrapper");

	var timelineHTML = this.generateTimelineTable();
	var leftLabelHTML = this.m_leftLabelTable.render();
	var rightLabelHTML = this.m_rightLabelTable.render();
	//var contentHTML = this.m_contentDataTable.render(); //future dev

	$componentWrapper.find(".outptl-content-timeline-container").html(timelineHTML);
	$componentWrapper.find(".outptl-left-label-container").html(leftLabelHTML);
	$componentWrapper.find(".outptl-right-label-container").html(rightLabelHTML);

	//Add event handlers
	this.finalizeCompTables();
};

/**
 * generateRowGroups
 * Create each of the groups for the table and bind the data.
 * @param {String} compId the unique namespace and component identification.
 * @param {Object} recordData JSON object of the data that will be displayed on the table.
 * @return {undefined} Nothing
 */
OutPatientTimeline.BaseTimelineComponent.prototype.generateRowGroups = function(compId, recordData){
	var	groupCnt = recordData.PG.length;
	var cnt = 0;
	for (cnt = 0; cnt < groupCnt; cnt++) {
		//Example: createTableGroup(groupObj, canCollapseInd, addNameInd, showCountInd);
		this.m_leftLabelTable.addGroup(this.createTableGroup(recordData.PG[cnt], true, true, true));
		this.m_rightLabelTable.addGroup(this.createTableGroup(recordData.PG[cnt], false, false, false));
		//this.m_contentDataTable(this.createTableGroup(recordData.PG[x], false, false, false)); //future dev
	}
};

/**
 * setNavButtonPosition
 * Position the navigation buttons.
 * @param {String} compId the unique namespace and component identification.
 * Improve - events can be attached after creating the outer containers.
 * @return {undefined} Nothing
 */
OutPatientTimeline.BaseTimelineComponent.prototype.setNavButtonPosition = function(compId){
	var $componentTarget = $("#" + compId).find(".outptl-component-wrapper");
	var $scrollElement = $componentTarget.find(".outptl-content-container");
	//Get the left,right values of the content container
	var clientBoundRect = $scrollElement[0].getBoundingClientRect();
	//18px width, 2px pixelbuffer for borders , 1px border for container.
	var backwardNavPos = clientBoundRect.left - (18 + this.m_pixelBuffer + 1);
	var forwardNavPos = clientBoundRect.right;

	//Set the left value to position the nav buttons to the corners of the timeline
	$componentTarget.find(".outptl-timeline-backwardButton").css("left", backwardNavPos);
	$componentTarget.find(".outptl-timeline-forwardButton").css("left", forwardNavPos);
};

/**
 * finalizeCompTables
 * Add events for various elements in the component.
 * Improve - event creation , container selections.
 * @return {undefined} Nothing
 */
OutPatientTimeline.BaseTimelineComponent.prototype.finalizeCompTables = function(){
	//set the navigation button click events
	$("#" + this.m_namespace + " .outptl-component-wrapper").on("click",".outptl-timeline-navButtons",{self:this}, function(event){
		var namespace = event.data.self.m_namespace;
		var $scrollElement = $("#" + namespace + "contentContainer");
		//Get the current scroll left position
		var currentScrollPos = $scrollElement.scrollLeft();
		//Get the width of container
		var contentContainerWidth = event.data.self.m_contentContainerWidth;
		//Calculate amount of pixels we need to scroll
		var scrollWidthAmount = Math.floor(contentContainerWidth / 2);
		//Calculate exact scroll left position value
		var scrollLeftValue; 
		if($(event.target).hasClass("outptl-timeline-nav-back")){
			scrollLeftValue = currentScrollPos - scrollWidthAmount;
		}
		else{
			scrollLeftValue = currentScrollPos + scrollWidthAmount;
		}
		//Pass in the scroll value to the controller
		//Improve direct call?
		event.data.self.m_scrollController.registerScroll(scrollLeftValue);
	});

	//Call the finalize method to add table, extension events.
	this.m_rightLabelTable.finalize();
	this.m_leftLabelTable.finalize();
	this.m_contentDataTable.finalize();
	this.m_timeLineTable.finalize();
};

/**
 * preProcess Sets the values of namespace ,record data and creates the containers for all tables.
 * Improve - better naming 
 * @param {String} compId the unique namespace and component identification.
 * @param {Object} recordData JSON object of the data that will be displayed on the table.
 * @returns {undefined} Nothing
 */
OutPatientTimeline.BaseTimelineComponent.prototype.preProcess = function(compId, recordData){
	//Set the namespace
	this.m_namespace = compId;
	//Set the Data
	this.m_recordData = recordData;
	//Set the number of date columns to display
	//Improve this will depend on number of timebuckets.
	this.m_dateColumnCnt = recordData["TG"].length
	//Register component to scroll controller
	this.m_scrollController.registerComponent(compId);
	//Get and set the component content id.
	//Improve Utilize this.getTarget or this.options.target which returns the target node
	this.m_componentContentId = $("#" + compId).find(".sec-content").attr("id");

	//Calculate and set the various container widths for the component,each data column.
	this.calculateContentColumnWidths(compId);
	//Initialize the component tables.
	this.initializeComponentTables(compId);
	//Creates the containers with their widths set.
	this.createTableContainers(compId);
	//Position the navigation elements
	this.setNavButtonPosition(compId);
	
	//Create group data for each of the groups for label tables and bind the data.
	this.generateRowGroups(compId, recordData);
};

/**
 * createTableContainers Creates the containers for all tables in the component.
 * @param {String} compId the unique namespace and component identification.
 * @return {undefined} Nothing
 */
OutPatientTimeline.BaseTimelineComponent.prototype.createTableContainers = function(compId){
	//Improve -Use document.fragment to create the nodes.
	//Timeline Navigation buttons html
	this.m_leftNavButton = "<div class='outptl-timeline-navButtons outptl-timeline-backwardButton outptl-timeline-nav-back'>" +
      						"<div class='outptl-timeline-imgBackButtons outptl-timeline-nav-back'></div>" +
    				 	   "</div>";
    this.m_rightNavButton = "<div class='outptl-timeline-navButtons outptl-timeline-forwardButton outptl-timeline-nav-forward'>" +
		    					"<div class='outptl-timeline-imgForwardButtons outptl-timeline-nav-forward'></div>" +
		    				"</div>";
	var componentHTML = "<div class='outptl-component-wrapper' id='" + this.m_namespace + "componentWrapper' style='width:" + this.m_componentWrapperWidth + "px'>" +
							"<div class='outptl-left-label-container outptl-label-container' id='" + this.m_namespace + "leftLabelContainer' style='width:" + this.m_leftLabelContainerWidth + "px'></div>" +
							"<div class='outptl-content-container' id='" + this.m_namespace + "contentContainer' style='width:" + this.m_contentContainerWidth + "px'>" +
								"<div class='outptl-content-container-wrapper' id='" + this.m_namespace + "contentContainerWrapper' style='width:" + this.m_timelineContainerWidth + "px'>" +
									"<div class='outptl-content-timeline-container' id='" + this.m_namespace + "timelineContainer' style='width:" + this.m_timelineContainerWidth + "px'></div>" +
									"<div class='outptl-content-data-container' id='" + this.m_namespace + "dataContainer' style='width:" + this.m_dataContainerWidth + "px'></div>" +
								"</div>" +
							"</div>" +
							"<div class='outptl-right-label-container outptl-label-container' id='" + this.m_namespace + "rightLabelContainer' style='width:" + this.m_rightLabelContainerWidth + "px'></div>" +
							this.m_leftNavButton + this.m_rightNavButton +
						"</div>";
	//Append to component section content
	$("#" + compId).find(".sec-content").html(componentHTML);
};

/**
 * checkForToday
 * Checks if the date values passed in is current date.
 * @param {Object} dateTime - This parameter contains the date object.
 * @return {Boolean} True if it's Today, False if not.
*/
OutPatientTimeline.BaseTimelineComponent.prototype.checkForToday = function(dateTime){
	// Caching todays date, time and year variables
	var todaysDate = new Date();
	var todaysYearValue = todaysDate.getFullYear();
	var todaysMonthValue = todaysDate.getMonth();
	var todaysDateValue = todaysDate.getDate();

	if((dateTime.getDate() === todaysDateValue) && (dateTime.getMonth() === todaysMonthValue) && (dateTime.getFullYear() === todaysYearValue)) {
		return true;
	}
	else{
		return false;
	}
};

/**
 * createTimelineColumn
 * Creates and adds the columns into the timeline component table.
 * @param {Object} timeBucket This parameter contains the date object.
 * @return {undefined} Nothing
*/
OutPatientTimeline.BaseTimelineComponent.prototype.createTimelineColumn = function(timeBucket){
	var column = new TableColumn();
	column.setColumnId(timeBucket.TIME_DISP_FORMATTED)
		  .setColumnDisplay(timeBucket.COLUMN_DISPLAY)
		  .setCustomClass('outptl-timeline-column ' + timeBucket.NEW_YEAR_CLASS)
		  .setWidth(this.m_dataColumnWidth);
	this.m_timeLineTable.addColumn(column);
}

/**
 * formatDate 
 * This function is used to format the date/time by setting it to ISO standard
 * Improve research better date format.
 * @param {string} dateTime - This parameter contains the date/time of the result that needs to be formatted.
 * @return The formatted date/time according to the ISO standards.
 */
OutPatientTimeline.BaseTimelineComponent.prototype.formatDate = function(dateTime) {
	var date = new Date();
	date.setISO8601(dateTime);
	return date.format("longDateTime3");
};

/**
 * generateTimelineTable
 * Generate the html for timeline container.
 * @return {String} Timeline table html.
 */
OutPatientTimeline.BaseTimelineComponent.prototype.generateTimelineTable = function(){
	this.createTimelineTimeBuckets();
     //Add dummy values to active rows
    this.m_timeLineTable.setActiveRows(["dummy"]);
    var customClass = this.m_timeLineTable.getCustomClass() ? " " + this.m_timeLineTable.getCustomClass() : "";
    var cssTemplate = this.m_timeLineTable.getCSSTemplate() ? " " + this.m_timeLineTable.getCSSTemplate() : "";
    var timelineHTML =  "<div id='" + this.m_timeLineTable.namespace + "table' class='component-table" + cssTemplate + customClass + "'>" +
    				 this.m_timeLineTable.renderHeader() + "</div>";
    return timelineHTML;
};

/**
 * createTimelineTimeBuckets
 * Creates the timeline display data.
 * Improve - separate out bucket object creation,better naming
 * @return {undefined} Nothing
*/
OutPatientTimeline.BaseTimelineComponent.prototype.createTimelineTimeBuckets = function(){
	var timeData = this.m_recordData["TG"];
	var timeDatalength = timeData.length;
	var timeArr = this.timeBucketArr;
	//store timebucket globally
	var timeBucket = {};
	var cnt = 0;
	var dateTime,nextDate;
	var curDate = new Date(9999, 1, 1);
	//Contains html for displaying year section in timeline header.
	var tempYearDispHTML = "";
	var dateTime = new Date();
	var nextDate = new Date();

	//Iterate through the date list.
	for(cnt = 0; cnt < timeDatalength ; cnt++){
		//create a time bucket for each date object.
		timeBucket = timeData[cnt];
		//Improve is time needed?
		timeBucket.TIME_DISP_FORMATTED = this.formatDate(timeBucket.TIME_DISP);
		dateTime.setISO8601(timeBucket.TIME_DISP);
		nextDate.setISO8601(timeBucket.TIME_DISP);
		// Check to see if this is the first time for this year
		if(nextDate.getFullYear() !== curDate.getFullYear()){
			//Assign next date to current to check if next date has year in the next iteration.
			curDate = new Date(nextDate);
			timeBucket.NEW_YEAR_CLASS = "outptl-timeline-new-year";
			tempColumnYearDisp = "<div class='outptl-timeline-year-content'>" + dateTime.getFullYear() + "</div>";
			if (cnt === 0) {
				timeBucket.NEW_YEAR_CLASS = "outptl-timeline-first-content-col";
				// If we are dealing with the first result we might need to
				// override the display to say Today instead of the date
				if (this.checkForToday(dateTime)){
					//TODO i18n,Question -If new year , should year be displayed?
					tempColumnYearDisp = "<div class='outptl-timeline-year-content'>" + "TODAY" +"</div>";
				}
			}
		}
		else {
			// Create just the time display
			timeBucket.NEW_YEAR_CLASS = "";
			tempColumnYearDisp = "";
		}

		timeBucket.COLUMN_DISPLAY = "<div class='outptl-timeline-grey-background'>"
									+ tempColumnYearDisp +
									 "</div>" +
									 "<div class='outptl-timeline-date-content'>" +
									  dateTime.format("mm/dd") + "</div>";
		this.createTimelineColumn(timeBucket);
	}
};

/**
 * initializeComponentTables 
 * Initializes all the component tables.Sets the custom class and zebra striping.
 * @param {String} compId the unique namespace and component identification.
 * @return {undefined} Nothing
 */
OutPatientTimeline.BaseTimelineComponent.prototype.initializeComponentTables = function(compId){
	//Initialize different tables
	this.m_timeLineTable = new ComponentTable();
	this.m_leftLabelTable = new ComponentTable();
	this.m_rightLabelTable = new ComponentTable();
	this.m_contentDataTable = new ComponentTable();

	//Improve separate each section to their own instance, use setters/getters.
	this.m_timeLineTable.setNamespace(compId + "timeline").setCustomClass("outptl-content-timeline-table");
	this.m_contentDataTable.setNamespace(compId + "content")
						   .setCustomClass("outptl-content-data-table")
						   .setZebraStripe(true)
						   .setIsHeaderEnabled(false);
	this.generateLabelTable(compId,"left");
	this.generateLabelTable(compId,"right");
}

/**
 * generateLabelTables
 * This function will add the columns for left or right label table.
 * @param {String} compId the unique namespace and component identification.
 * @param {String} tableIndicator a string indicator for Left (left) or Right (right) label table.
 * @returns {undefined} Nothing
 */
OutPatientTimeline.BaseTimelineComponent.prototype.generateLabelTable = function(compId, tableIndicator){
 	var labelTable = {};
 	var labelColumn = {};
 	var columnRowRenderTemplate = "";
 	var self = this;
 	var columnHeaderDisplay = "";
	
	//Todo: i18n Most Recent
 	if(tableIndicator === "right"){
 		labelTable = this.m_rightLabelTable;
 		columnRowRenderTemplate = this.m_rightLabelTableRowRenderTemplate;
 		columnHeaderDisplay = "<div class='outptl-label-column-grey-background'>" +
									"<div class='outptl-label-column-header-content'>" + "Most Recent" + "</div>" +
							  "</div>";
 	}
 	else{
 		labelTable = this.m_leftLabelTable;
 		columnRowRenderTemplate = this.m_leftLabelTableRowRenderTemplate;
 	}
 	var tableNamespace = compId + tableIndicator + "Label"
 	var tableCustomClass = "outptl-" + tableIndicator + "-label-table";
 	var columnId = labelTable.getNamespace() + "Col";
 	var customClass = "outptl-label-column outptl-" + tableIndicator + "label-column";
 	//Future right label column has most recent items.
 	var renderTemplate = "<div class='outptl-" + tableIndicator +"-label-column-row-wrapper'>" +
 							columnRowRenderTemplate +
 						 "</div>";
 	var grpToggleExtension = new TableGroupToggleCallbackExtension().setGroupToggleCallback(function(event,data){
 		//To maintain context.
 		//toggle the group in all tables.
 		self.tableGroupToggle(event, data);
 	})

 	labelColumn = new TableColumn()
 	labelColumn.setColumnId(columnId)
			.setColumnDisplay(columnHeaderDisplay)
			.setCustomClass(customClass)
			.setRenderTemplate(renderTemplate);
	
	labelTable.setNamespace(tableNamespace)
			.setCustomClass(tableCustomClass)
			.addExtension(grpToggleExtension)
			.setZebraStripe(true)
			.addColumn(labelColumn);
 };

 /**
 * toggleLabelTableExtension 
 * This function expands or collapses the labelTable group based on whether the passed in parameter
 * is open or collapsed.
 * @param {jQuery.Event}
 *                event - The DOM event that occurred.
 * @param {Object}
 *                data - The data used for the check for expanded/collapsed.
 * @return {undefined} Nothing
 */ 
OutPatientTimeline.BaseTimelineComponent.prototype.tableGroupToggle = function(event, data) {
	//if it is expaned, then expand the other group label table too
	if(data.GROUP_DATA.EXPANDED){
		this.m_leftLabelTable.openGroup(data.GROUP_DATA.GROUP_ID);
		this.m_rightLabelTable.openGroup(data.GROUP_DATA.GROUP_ID);
		//this.m_contentDataTable.openGroup(data.GROUP_DATA.GROUP_ID); //future
	}
	else{
		//if it is collapsed, then collapse the other group label table too
		this.m_leftLabelTable.collapseGroup(data.GROUP_DATA.GROUP_ID);
		this.m_rightLabelTable.collapseGroup(data.GROUP_DATA.GROUP_ID);
		//this.m_contentDataTable.collapseGroup(data.GROUP_DATA.GROUP_ID); //future
	}
};

/**
 * calculateContentColumnWidths Calculate the width size for timeline,data containers,each data column.
 * @param {void}
 * @returns {undefined} Nothing
 */
OutPatientTimeline.BaseTimelineComponent.prototype.calculateContentColumnWidths = function(){
	//Get the available width from the component content node.
	var $componentContentNode = $("#" + this.m_componentContentId);
	//Contains width value of each data column in timeline and data container.
	var dataColumnWidth = 0;
	//Contains the width of full timeline container
	var timelineWidth = 0;
	//Count of dates object in record data
	var dateCount = this.m_dateColumnCnt;
	//Set the available width of component content
	this.m_componentContentWidth = Math.floor($componentContentNode.width()) - this.m_componentContentPadding;

	//Assumption - all widths of others containers are box sized.
	//Calculate the width available for the content container
	this.m_contentContainerWidth = this.m_componentContentWidth - (this.m_leftLabelContainerWidth + this.m_rightLabelContainerWidth);

	//Calculate the width of timeline and data container based on the length of date array in record data.
	//Default value is set to 70px
	//Improve - date array numbers can be inconsistent since few will not be displayed if none of groups have data on those dates.
	dataColumnWidth = Math.ceil(this.m_contentContainerWidth/dateCount);
	if(dataColumnWidth > this.m_dataColumnWidth){
		this.m_dataColumnWidth = dataColumnWidth;
	}
	else{
		//Local variable not needed
		//Set the width to default value
		dataColumnWidth = this.m_dataColumnWidth;
	}

	timelineWidth = dataColumnWidth * dateCount + this.m_pixelBuffer;
	//Improve use setters
	//Set the width of the timeline and data containers
	this.m_timelineContainerWidth = timelineWidth;
	//Set the width of the data container i.e data table
	this.m_dataContainerWidth = timelineWidth;
	//Set the component wrapper width
	//Ensures right label container is on same row.
	this.m_componentWrapperWidth = this.m_leftLabelContainerWidth + this.m_contentContainerWidth + this.m_rightLabelContainerWidth;
}

/** Getters to retrieve table objects ***/
/**
 * Returns the right label table object.
 * @return {Object} Right label table object.
 */
OutPatientTimeline.BaseTimelineComponent.prototype.getRightLabelComponentTable = function(){
	return this.m_rightLabelTable;
};

/**
 * Returns the left label table object.
 * @return {Object} left label table object.
 */
OutPatientTimeline.BaseTimelineComponent.prototype.getLeftLabelComponentTable = function(){
	return this.m_leftLabelTable;
};

/**
 * getTimelineComponentTable
 * Returns the timeline table object.
 * @return {Object} timeline table object.
 */
OutPatientTimeline.BaseTimelineComponent.prototype.getTimelineComponentTable = function(){
	return this.m_timeLineTable;
};

/**
 * getContentDataComponentTable 
 * Returns the Content table object.
 * @return {Object} Content table object.
 */
OutPatientTimeline.BaseTimelineComponent.prototype.getContentDataComponentTable = function(){
	return this.m_contentDataTable;
};

/**
 * setLabelColumnRowRenderTemplate
 * Sets the label table row templates for a given render template and table indicator (left or right).
 * @return {undefined} Nothing
 */
OutPatientTimeline.BaseTimelineComponent.prototype.setLabelColumnRowRenderTemplate = function(renderTemplate, tableIndicator){
	if(tableIndicator === "right"){
		this.m_rightLabelTableRowRenderTemplate = renderTemplate;
	}
	else{
		this.m_leftLabelTableRowRenderTemplate = renderTemplate;
	}
}

/**
 * createTableGroup
 * Dynamically create a ComponentTable TableGroup for a particular group of results
 * This function will generate component table for the content.
 * @returns {Object} groupObj component table group object
 * @param {Boolean} canCollapseInd Indication to display expand/collapse icon on group header.
 * @param {Boolean} addNameInd Indication to display content on group header.
 * @param {Boolean} showCountInd Indication to display row count on group header.
 */
OutPatientTimeline.BaseTimelineComponent.prototype.createTableGroup = function(groupObj, canCollapseInd, addNameInd, showCountInd) {
	var grpHeaderDisplay = (addNameInd) ? "<span title='" + groupObj.SUBSEC_LABEL + "'>" + groupObj.SUBSEC_LABEL + "</span>" : "&nbsp;";
	//Improve groupId,ability to set custom objects values as Id, datgroupObj binding.
	return new TableGroup().setGroupId("ESCode" + groupObj.EVENT_SET_CD)
						   .bindData(groupObj.RG)
						   .setDisplay(grpHeaderDisplay)
						   .setCanCollapse(canCollapseInd)
						   .setShowCount(showCountInd);
};