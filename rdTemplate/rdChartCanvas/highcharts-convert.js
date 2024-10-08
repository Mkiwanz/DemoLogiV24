
(function () {
    //"use strict";
    var fs = require('fs');

    var config = {
        libs: {
            /* define locations of mandatory javascript files */
            //JQUERY: 'jquery.min.js',
            YUI: '..' + fs.separator + 'rdYui.min.js',
            GLOBAL_JS: '..' + fs.separator + 'rdYui' + fs.separator + 'global.js',
            CHARTCANVAS: '..' + fs.separator + 'rdChartCanvas.min.js',
            RDAJAX: '..' + fs.separator + 'rdAjax' + fs.separator + 'rdAjax2.js'
            /*HIGHCHARTS: 'highcharts.src.js',
            HIGHCHARTS_MORE: 'highcharts-more.js',
            YUI: '..' + fs.separator + 'rdYui' + fs.separator + 'yui-preload-min.js',
            GLOBAL_JS: '..' + fs.separator + 'rdYui' + fs.separator + 'global.js',
            LOGIXML_FORMATTERS: '..' + fs.separator + 'rdYui' + fs.separator + 'formatters.js',
            LOCALIZATION: 'rdHighchartsLocalization.js',
            H_FORMATTERS: 'rdHighchartsFormatters.js',
            H_TRENDLINE: fs.separator + 'modules' + fs.separator + 'rdTrendlineSeries.js',
            H_HEATMAP: fs.separator + 'modules' + fs.separator + 'rdTreemapSeries.js',
            H_FUNNEL: fs.separator + 'modules' + fs.separator + 'funnel.src.js',
            H_NODATA: 'rdNoDataForHighcharts.js',
            H_VIEWSTATE: 'rdViewState.js',
            H_3D: 'highcharts-3d.js',
            H_3D_EXTENSIONS: 'rd3Dcharts.js',
            H_SEGMENTED: 'segmented_series.js',
            H_GAUGES: fs.separator + 'modules' + fs.separator + 'rdHighchartsGauges.js'
            */
        },
            TIMEOUT: 2000 /* 2 seconds timout for loading images */
        },
		mapCLArguments,
		render,
		startServer = false,
		args,
		pick,
		SVG_DOCTYPE = '<?xml version=\"1.0" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">',
		dpiCorrection = 1.4,
		system = require('system'),
		fs = require('fs'),
		serverMode = false;

	pick = function () {
		var args = arguments, i, arg, length = args.length;
		for (i = 0; i < length; i += 1) {
			arg = args[i];
			if (arg !== undefined && arg !== null && arg !== 'null' && arg != '0') {
				return arg;
			}
		}
	};

	mapCLArguments = function () {
		var map = {},
			i,
			key;

		if (system.args.length < 1) {
			console.log('Commandline Usage: highcharts-convert.js -infile URL -outfile filename -scale 2.5 -width 300 -constr Chart -callback callback.js');
			console.log(', or run PhantomJS as server: highcharts-convert.js -host 127.0.0.1 -port 1234');
		}

		for (i = 0; i < system.args.length; i += 1) {
			if (system.args[i].charAt(0) === '-') {
				key = system.args[i].substr(1, i.length);
				if (key === 'infile' || key === 'callback' || key === 'dataoptions' || key === 'globaloptions' || key === 'customcode') {
					// get string from file
					try {
						map[key] = fs.read(system.args[i + 1]);
					} catch (e) {
						console.log('Error: cannot find file, ' + system.args[i + 1]);
						phantom.exit();
					}
				} else {
					map[key] = system.args[i + 1];
				}
			}
		}
		return map;
	};

	render = function (params, exitCallback) {

		var page = require('webpage').create(),
			system = require('system'),
			messages = {},
			scaleAndClipPage,
			loadChart,
			createChart,
			input,
			constr,
			callback,
			width,
			output,
			outType,
			timer,
			renderSVG,
			convert,
			exit,
			interval,
			customEval;

	    customEval = function evaluate(page, func) {
	        var args = [].slice.call(arguments, 2);
	        var fn = "function() { return (" + func.toString() + ").apply(this, " + JSON.stringify(args) + ");}";
	        return page.evaluate(fn);
	    };

		messages.imagesLoaded = 'Highcharts.images.loaded';
		messages.optionsParsed = 'Highcharts.options.parsed';
		messages.callbackParsed = 'Highcharts.cb.parsed';
		window.imagesLoaded = false;
		window.optionsParsed = false;
		window.callbackParsed = false;

		page.onConsoleMessage = function (msg) {
			//console.log(msg);
            // uncomment this line for debugging
		    //system.stderr.writeLine('console: ' + msg);
			/*
			 * Ugly hack, but only way to get messages out of the 'page.evaluate()'
			 * sandbox. If any, please contribute with improvements on this!
			 */

			if (msg === messages.imagesLoaded) {
				window.imagesLoaded = true;
			}
			/* more ugly hacks, to check options or callback are properly parsed */
			if (msg === messages.optionsParsed) {
				window.optionsParsed = true;
			}

			if (msg === messages.callbackParsed) {
				window.callbackParsed = true;
			}
		};

		page.onAlert = function (msg) {
			console.log(msg);
		};

		/* scale and clip the page */
		scaleAndClipPage = function (svg) {
			/*	param: svg: The scg configuration object
			*/

			var zoom = 1,
				pageWidth = pick(params.width, svg.width),
				clipwidth,
				clipheight;

			if (parseInt(pageWidth, 10) == pageWidth) {
				zoom = pageWidth / svg.width;
			}

			/* set this line when scale factor has a higher precedence
			scale has precedence : page.zoomFactor = params.scale  ? zoom * params.scale : zoom;*/

			/* params.width has a higher precedence over scaling, to not break backover compatibility */
			page.zoomFactor = params.scale && params.width == undefined ? zoom * params.scale : zoom;


			clipwidth = svg.width * page.zoomFactor;
			clipheight = svg.height * page.zoomFactor;

			/* define the clip-rectangle */
			/* ignored for PDF, see https://github.com/ariya/phantomjs/issues/10465 */
			page.clipRect = {
				top: 0,
				left: 0,
				width: clipwidth,
				height: clipheight
			};

			/* for pdf we need a bit more paperspace in some cases for example (w:600,h:400), I don't know why.*/
			if (outType === 'pdf') {
				// changed to a multiplication with 1.333 to correct systems dpi setting
				clipwidth = clipwidth * dpiCorrection;
				clipheight = clipheight * dpiCorrection;
				// redefine the viewport
				page.viewportSize = { width: clipwidth, height: clipheight};
				// make the paper a bit larger than the viewport
				page.paperSize = { width: clipwidth + 2 , height: clipheight + 2 };
			}
			else { //FIXFOR-V9
				page.viewportSize = { width: clipwidth, height: clipheight }; //REPDEV-26554 Highcharts v9-Chart has been cut off when export it to Excel/Word
			}	
		};

		exit = function (result) {
			if (serverMode) {
				//Calling page.close(), may stop the increasing heap allocation
				page.close();
			}
			exitCallback(result);
		};

		convert = function (svg) {
			var base64;
			scaleAndClipPage(svg);
			if (outType === 'pdf' || output !== undefined || !serverMode) {
				if (output === undefined) {
					// in case of pdf files
					output = config.tmpDir + '/chart.' + outType;
				}
				page.render(output);
				exit(output);
			} else {
				base64 = page.renderBase64(outType);
				exit(base64);
			}
		};

		renderSVG = function (svg) {
			var svgFile;
			// From this point we have loaded/or created a SVG
			try {
				if (outType.toLowerCase() === 'svg') {
					// output svg
					//svg = svg.html.replace(/<svg /, '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ').replace(/ href=/g, ' xlink:href=').replace(/<\/svg>.*?$/, '</svg>');
					// add xml doc type
				    //svg = SVG_DOCTYPE + svg;
				    svg = svg.html;

					if (output !== undefined) {
						// write the file
						svgFile = fs.open(output, "w");
						svgFile.write(svg);
						svgFile.close();
						exit(output);
					} else {
						// return the svg as a string
						exit(svg);
					}

				} else {
					// output binary images or pdf
					if (!window.imagesLoaded) {
						// render with interval, waiting for all images loaded
						interval = window.setInterval(function () {
							console.log('waiting');
							if (window.imagesLoaded) {
								clearTimeout(timer);
								clearInterval(interval);
								convert(svg);
							}
						}, 50);

						// we have a 3 second timeframe..
						timer = window.setTimeout(function () {
							clearInterval(interval);
							exitCallback('ERROR: While rendering, there\'s is a timeout reached');
						}, config.TIMEOUT);
					} else {
						// images are loaded, render rightaway
						convert(svg);
					}
				}
			} catch (e) {
				console.log('ERROR: While rendering, ' + e);
			}
		};

		loadChart = function (input, outputType, messages) {
			var nodeIter, nodes, elem, opacity, counter, svgElem;
			
			document.body.style.margin = '0px';
			document.body.innerHTML = input;

			function loadingImage() {
				console.log('Loading image ' + counter);
				counter -= 1;
				if (counter < 1) {
					console.log(messages.imagesLoaded);
				}
			}

			function loadImages() {
				var images = document.getElementsByTagName('image'), i, img;

				if (images.length > 0) {

					counter = images.length;

					for (i = 0; i < images.length; i += 1) {
						img = new Image();
						img.onload = loadingImage;
						/* force loading of images by setting the src attr.*/
						img.src = images[i].href.baseVal;
					}
				} else {
					// no images set property to:imagesLoaded = true
					console.log(messages.imagesLoaded);
				}
			}

			if (outputType === 'jpeg') {
				document.body.style.backgroundColor = 'white';
			}

			nodes = document.querySelectorAll('*[stroke-opacity]');

			for (nodeIter = 0; nodeIter < nodes.length; nodeIter += 1) {
				elem = nodes[nodeIter];
				opacity = elem.getAttribute('stroke-opacity');
				elem.removeAttribute('stroke-opacity');
				elem.setAttribute('opacity', opacity);
			}

			// ensure all image are loaded
			loadImages();

			svgElem = document.getElementsByTagName('svg')[0];

			return {
			    html: document.body.innerHTML,
			    width: svgElem.getAttribute("width"),
			    height: svgElem.getAttribute("height")
			};
		};

		createChart = function (width, constr, input, globalOptionsArg, dataOptionsArg, customCodeArg, outputType, callback, messages) {
			var container, chart, nodes, nodeIter, elem, opacity, counter;

			// dynamic script insertion
			function loadScript(varStr, codeStr) {
				var script = document.createElement("script");
				script.setAttribute('type', 'text/javascript');
				script.innerHTML = 'var ' + varStr + ' = ' + codeStr;
				document.getElementsByTagName("head")[0].appendChild(script);
				if (window[varStr] !== undefined) {
					console.log('Highcharts.' + varStr + '.parsed');
				}
			}

			// are all images loaded in time?
			function loadingImage() {
				console.log('loading image ' + counter);
				counter -= 1;
				if (counter < 1) {
					console.log(messages.imagesLoaded);
				}
			}

			function loadImages() {
				// are images loaded?
				var images = document.querySelectorAll('svg image'), i, img;

				if (images.length > 0) {

					counter = images.length;

					for (i = 0; i < images.length; i += 1) {
						img = new Image();
						img.onload = loadingImage;
						/* force loading of images by setting the src attr.*/
						img.src = images[i].getAttribute('href');
					}
				} else {
					// no images set property to all images
					// loaded
					console.log(messages.imagesLoaded);
				}
			}

			function parseData(completeHandler, chartOptions, dataConfig) {
				try {
					dataConfig.complete = completeHandler;
					Highcharts.data(dataConfig, chartOptions);
				} catch (error) {
					completeHandler(undefined);
				}
			}

			if (input !== 'undefined') {
				loadScript('options', input);
			}

			if (callback !== 'undefined') {
				loadScript('cb', callback);
			}

			if (globalOptionsArg !== 'undefined') {
				loadScript('globalOptions', globalOptionsArg);
			}

			if (dataOptionsArg !== 'undefined') {
				loadScript('dataOptions', dataOptionsArg);
			}

			if (customCodeArg !== 'undefined') {
				loadScript('customCode', customCodeArg);
			}

			document.body.style.margin = '0px';

			if (outputType === 'jpeg') {
				document.body.style.backgroundColor = 'white';
			}

			container = document.createElement("div");
			container.setAttribute('id', 'container');
			document.body.appendChild(container);
			// disable animations
			Highcharts.SVGRenderer.prototype.Element.prototype.animate = Highcharts.SVGRenderer.prototype.Element.prototype.attr;

			if (!options.chart) {
				options.chart = {};
			}

			options.chart.renderTo = container;

			// check if witdh is set. Order of precedence:
			// args.width, options.chart.width and 600px

			// OLD. options.chart.width = width || options.chart.width || 600;
			// Notice we don't use commandline parameter width here. Commandline parameter width is used for scaling.

			options.chart.width = (options.exporting && options.exporting.sourceWidth) || options.chart.width || 600;
			options.chart.height = (options.exporting && options.exporting.sourceHeight) || options.chart.height || 400;
			options.isChartCanvas = true;

			// Load globalOptions
			if (globalOptions) {
				Highcharts.setOptions(globalOptions);
			}

			// Load data
			LogiXML.HighchartsFormatters.setFormatters(options);
			if (dataOptions) {
				
				parseData(function completeHandler(opts) {

					// Merge series configs
					if (options.series) {
						Highcharts.each(options.series, function (series, i) {
							options.series[i] = Highcharts.merge(series, opts.series[i]);
						});
					}

					var mergedOptions = Highcharts.merge(opts, options);

					// Run customCode
					if (customCode) {
						customCode(mergedOptions);
					}
					//FIXFOR-V9
					//REPDEV-26752 : High chart export architectural change
					LogiXML.Highcharts9Adapter.beforeChartCreate(mergedOptions);
					//FIXFOR-V9
					//REPDEV-26801 Highcharts v9 - The bar chart result is wrong when Click Download as Excel in Author Report
					Highcharts.each(mergedOptions.series, function (series) {
						series.animation = false;
					})
					chart = new Highcharts[constr](mergedOptions, cb);
					LogiXML.Highcharts9Adapter.afterChartCreate(chart);
					// ensure images are all loaded
					loadImages();
				}, options, dataOptions);
			} else {
				//FIXFOR-V9
				//REPDEV-26752 : High chart export architectural change
				LogiXML.ChartCanvas.Highcharts9Adapter.BeforeChartCreate(options);
				//FIXFOR-V9
				//REPDEV-26801 Highcharts v9 - The bar chart result is wrong when Click Download as Excel in Author Report
				Highcharts.each(options.series, function (series) {
					series.animation = false;
				})
				chart = new Highcharts[constr](options, cb);
				LogiXML.ChartCanvas.Highcharts9Adapter.AfterChartCreate(chart);
				// ensure images are all loaded
				loadImages();
			}
		    chart.viewstates = options.chart.viewstates;
			restoreChartState(chart);
			/* remove stroke-opacity paths, used by mouse-trackers, they turn up as
			*  as fully opaque in the PDF
			*/
			nodes = document.querySelectorAll('*[stroke-opacity]');

			for (nodeIter = 0; nodeIter < nodes.length; nodeIter += 1) {
				elem = nodes[nodeIter];
				opacity = elem.getAttribute('stroke-opacity');
				elem.removeAttribute('stroke-opacity');
				elem.setAttribute('opacity', opacity);
			}
			
			return {
				//html: $container[0].firstChild.innerHTML,
				html: document.querySelector('div.highcharts-container').outerHTML,
				width: chart.chartWidth,
				height: chart.chartHeight
			};
		};

		if (params.length < 1) {
			exit("Error: Insufficient parameters");
		} else {
			input = params.infile;
			output = params.outfile;

			if (output !== undefined) {
				outType = pick(output.split('.').pop(),'png');
			} else {
				outType = pick(params.type,'png');
			}

			constr = pick(params.constr, 'Chart');
			callback = params.callback;
			width = params.width;

			if (input === undefined || input.length === 0) {
				exit('Error: Insuficient or wrong parameters for rendering');
			}

			var pagefile = params.pagefile;
			if (pagefile === undefined || pagefile.length === 0) {
				pagefile = 'about:blank';
			}
			page.open(pagefile, function (status) {
				var svg,
					globalOptions = params.globaloptions,
					dataOptions = params.dataoptions,
					customCode = 'function customCode(options) {\n' + params.customcode + '}\n';

				/* Decide if we have to generate a svg first before rendering */
				if (input.substring(0, 4).toLowerCase() === "<svg") {
					//render page directly from svg file
					svg = customEval(page, loadChart, input, outType, messages);
					page.viewportSize = { width: svg.width, height: svg.height };
					renderSVG(svg);
				} else {
					// We have a js file, let highcharts create the chart first and grab the svg

				    if (params.localization) {
				        page.injectJs(params.localization);
				    }

				    // load necessary libraries
				    for(var propertyName in config.libs) {
				        var result = page.injectJs(config.libs[propertyName]);
				        console.log('lib ' + config.libs[propertyName] + ' load ' + (result ? 'successful' : 'failed'));
				    }
				    
					// load chart in page and return svg height and width
					svg = customEval(page, createChart, width, constr, input, globalOptions, dataOptions, customCode, outType, callback, messages);

					if (!window.optionsParsed) {
						exit('ERROR: the options variable was not available, contains the infile an syntax error? see' + input);
					}

					if (callback !== undefined && !window.callbackParsed) {
						exit('ERROR: the callback variable was not available, contains the callbackfile an syntax error? see' + callback);
					}
					renderSVG(svg);
				}
			});
		}
	};

	startServer = function (host, port) {
		var server = require('webserver').create();

		server.listen(host + ':' + port,
			function (request, response) {
				var jsonStr = request.post,
					params,
					msg;
				try {
					params = JSON.parse(jsonStr);
					if (params.status) {
						// for server health validation
						response.statusCode = 200;
						response.write('OK');
						response.close();
					} else {
						render(params, function (result) {
							response.statusCode = 200;
							response.write(result);
							response.close();
						});
					}
				} catch (e) {
					msg = "Failed rendering: \n" + e;
					response.statusCode = 500;
					response.setHeader('Content-Type', 'text/plain');
					response.setHeader('Content-Length', msg.length);
					response.write(msg);
					response.close();
				}
			}); // end server.listen

		// switch to serverMode
		serverMode = true;

		console.log("OK, PhantomJS is ready.");
	};

	args = mapCLArguments();

	// set tmpDir, for output temporary files.
	if (args.tmpdir === undefined) {
		config.tmpDir = fs.workingDirectory + '/tmp';
	} else {
		config.tmpDir = args.tmpdir;
	}

	// exists tmpDir and is it writable?
	if (!fs.exists(config.tmpDir)) {
		try{
			fs.makeDirectory(config.tmpDir);
		} catch (e) {
			console.log('ERROR: Cannot make temp directory');
		}
	}


	if (args.host !== undefined && args.port !== undefined) {
		startServer(args.host, args.port);
	} else {
		// presume commandline usage
		render(args, function (msg) {
			console.log(msg);
			phantom.exit();
		});
	}
}());
