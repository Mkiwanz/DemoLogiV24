#!/bin/bash
CURPWD=`dirname $0` 
CLASSPATH=$CURPWD/BookmarkValidator.JavaEE.jar:$CURPWD/BookmarksToDb.jar:$CURPWD/log4j-api-2.13.1.jar:$CURPWD/log4j-core-2.13.1.jar:$CURPWD/LogiCubeEngine.jar:$CURPWD/LogiDataEngine.jar:CURPWD/MetadataProviders.jar:$CURPWD/rdConnector.jar:$CURPWD/rdExcel.jar:$CURPWD/rdExcelTemplate.jar:$CURPWD/rdJavaClassWrappers.jar:$CURPWD/rdSuperScript.jar:$CURPWD/rdJavaPdf.jar:$CURPWD/rdJavaPdf4.jar:$CURPWD/rdMetadata.jar:$CURPWD/rdNativeWord.jar:$CURPWD/rdNewtonsoft.Json.Net20Java.jar:$CURPWD/rdOlap.jar:$CURPWD/rdPdfTemplate.jar:$CURPWD/rdPlugin.jar:$CURPWD/rdSchedulerApiServer.jar:$CURPWD/rdServer.jar:$CURPWD/rdVbScriptTranslator.jar:$CURPWD/rdWordTemplate.jar:$CURPWD/rdXslFoTemplate.jar:$CURPWD/System.Data.jar:$CURPWD/System.Deployment.jar:$CURPWD/System.jar:$CURPWD/System.Configuration.jar:$CURPWD/Mainsoft.Configuration.jar:$CURPWD/System.Xml.jar:$CURPWD/System.Drawing.jar:$CURPWD/System.Runtime.Remoting.jar:$CURPWD/System.Runtime.Serialization.Formatters.Soap.jar:$CURPWD/System.Web.jar:$CURPWD/J2EE.Helpers.jar:$CURPWD/LogiSTUB.jar:$CURPWD/mscorlib.jar:$CURPWD/rhino-1.7.7.1.jar:$CURPWD/Mainsoft.Web.jar:$CURPWD/Microsoft.VisualBasic.jar:$CURPWD/cdata.jdbc.mysql.jar:$CURPWD/mssql-jdbc-6.2.2.jre7.jar:$CURPWD/postgresql-42.2.8.jar:$CURPWD/vmwutils.jar:$CURPWD/System.Windows.Forms.jar:$CURPWD/System.Design.jar:$CURPWD/System.DirectoryServices.jar
java -Dnashorn.args="--no-deprecation-warning" -cp $CLASSPATH BookmarkValidator.JavaEE.BookmarkValidator $1 $2 $3 