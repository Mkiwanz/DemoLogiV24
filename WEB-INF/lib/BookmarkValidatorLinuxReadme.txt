BookmarkValidator Linux version 4/10/2021
1. Please sure the pathes of folowing jars have been added to classpath (you can get the jar-file from YourApp/WEB-INF/lib) 
  > Must:
	J2EE.Helpers.jar		J2SE.Helpers.jar.jar	Microsoft.VisualBasic.jar	mscorlib.jar
 	System.Configuration.jar	System.jar		System.Xml.jar 			rdNewtonsoft.Json.Net20Java.jar
	System.Data.jar
  > Optional : 
	LogiDataEngine.jar , LogiSTUB.jar, and Jars for DB driver includes MySQL, PostgreSQL and SQL Server(such as cdata.jdbc.mysql.jar for MySQL)

Notice1: the jars listed in optional are ONLY required If using FileToDatabaseMapping.
Notice2: If you wish to use Oracle then the LogiSTUB.jar needs to be replaced by ojdbc8.jar. Logi does not provide this. This have to be downloaded from Oracle(https://www.oracle.com/database/technologies/jdbc-ucp-122-downloads.html). The reference to LogiSTUB.jar in the BookmarkValidator.sh needs to be updated as well.


2. this tool is designed to run in command line/console, ‘-s:<folder>’ is used to set ‘appPhysicalPath’, ‘-m:all’ or ‘-m:basic’ is to set ‘model’(default is 'all'), ‘-f:<file>” is to set ‘outputfile’ , '-ol:[all|error]' is used to set the output includes 'PASSED'(if -ol:all) or not(default is 'all')
	Example : ./BookmarkValidator.sh -s:/opt/tomcat/YourApp -m:all -f:/myfolder/result.txt

Notice 1: Please sure "_settings.lgx' is exist in "<appPhicalPath>\_Definitions\" and can be read.
Notice 2: 'basic' only validate the column be used as/in :
		(AG) Filter
		Dashboard Panel Filter
		Dashboard Global Filter
		Data Table Column
		Data Table's Sort 
		Data Table's Group
		Data Table's Aggregate(and Custom Aggregate)
		Crosstab's Header Values column
		Crosstab's Label Values column
		Crosstab's Aggreate Values column
		Crosstab's Extra Label column
		Chart's Label column, Data Column, Addtional Column(s) (and X-Axis Column, Y-Axis Column)
		Heatmap's Label column, Size column, Color Column
		Gauge's Value column
		(Dashboard) Chart's Drill Column
		Formula and if this formula is used as/in above.
		LinkURL and if it owner is used as/in above		
Notice 3: It is recommended to quote the parameter value with quotation marks, like this : -s:"/opt/tomcat/YourApp"

3. The output content
3.1. the connent format:
	The output content is plain text, The first three(or four) lines are the value of  'appPhysicalPath' , 'model' and start time, like this:
		line1: appPhysicalPath: <appPhysicalPath> 
		line2: model: <model>
		line3: output level: Skip PASSED --- ONLY exist if set "-ol:error"
		line4: start at: <start time>
the next lines are for all verification result of all bookmarks and grouped by folder and username, the format is like this:
		“user: <username>
			<folder>
				<validation result of bookmark>*”
		*<folder> is a path combined by the name of folder element in bookmark collection document.

The output of <validation result of a bookmark> is:
	Bookmark Name: <bookmark description>
	Bookmark Type: <bookmark type>
	Bookmark Owner: <bookmark owner>
	Bookmark File: <bookmark file>
	Validation Result: one of “PASSED”, “Total <Count> error(s)” , "IGNORED(<reason>)", "<Metadata error>"

If Validation result is "Total <Count> error(s)", the next lines are error detail. the format is like this
a) If more than one metadata-container has error
	<Caption> : Total <X> error(s) 
		Error-<I>(<T>) : "<metadata error>" or "<caption of column> <error message>"
			<Normal Usage>
			<Formula Usage>
b) else
	Error-<T> : <caption of column> <error message>
		<Normal Usage>
		<Formula Usage>

	*<metadata error> : "Metadata does not loaded because <reason>"
	*<caption of column>, it includes the caption and qualify-name in Metadata, the format is \“\caption\\” \( \<metadataID\.tableName\.ColumnName \), for example : “Order ID”(OrdersTable.Order_ID)
	*<Caption> : the simple caption of metadata-container, it can be 'Caption of Panel' or "Element name", for example : "Tab1>>Panel1", "DataTable"
	*<X>: The number of errors that are only under this panel
	*<I>: the index-number in <X>
	*<T>: the index-number in <Count>
	*<Normal usage> : 
		"Used as [standing by]" or "Used as <Type of element> in <Element name>"		
	*<Formula usage> :
		Used in <Formula name>

3.2 just an example
	appPhysicalPath: /opt/tomcatYourApp 
	model: all
	start at: 2021-02-07 14:00:27
	user: John
		My Items
			Bookmark Name: TestAG
			Bookmark Type: AnalysisGrid
			Bookmark Owner: John
			Bookmark File: file_123456.xml
			Validation Result:IGNORED(File can not load)
		My Items>Folder1
			Bookmark Name: TestAG1
			Bookmark Type: AnalysisGrid
			Bookmark Owner: John
			Bookmark File: ag_123456.xml
			Validation Result: Total 1 error(s)
				Error-1: "Order Name"(table1.OrderName) cannot be Group, can not be Sort
					Used as "Group" in 'DataTable'
					Used as "Sort" in 'DataTable'

			Bookmark Name: TestDSH1
			Bookmark Type: Dashboard
			Bookmark Owner: John
			Bookmark File: dash_123456.xml
			Validation Result: Total 2 error(s)
				"MyTab >> My Panel1" : total 1 error(s)
					Error-1(1): "Order Name"(table1.OrderName) cannot be Group, can not be Sort
						Used as "Group" in 'DataTable'
						Used as "Sort" in 'DataTable'
				"MyTab >> My Panel2" : total 1 error(s)
					Error-1(2): Metadata does not loaded because its URL is not responding

4. KNOWN ISSUES
4.1 It doesnot check Security settings.
4.2 Not suppport 'Anonymous formula' usage.


5. Update History
5.1 version 3/31/2021
	a. Because of some reason, disabled security parsing
	b. fix bugs
5.2 version 3/11/2021
	a. Add an option -ol:[all|error] 
	b. Change the output content format
	c. Append REPDEV-26212(multiple addtional-column on chart) support
	d. Remove 'Not support Security on Element' Issue
	e. fix bugs
5.3 version 3/4/2021
	a. Remove not support 'Bookmark on DB' issue
	b. fix bugs
5.4 version 2/21/2021
	First version.
		

              