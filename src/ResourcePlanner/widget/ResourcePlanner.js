// Custom scripts
Date.prototype.addDays = function(d) {return new Date(this.valueOf() + 864E5 * d);};
Date.prototype.daysBetween = function(d) {return Math.round(Math.abs((this.getTime() - d.getTime()) / 864E5));};
Date.prototype.addMonths = function(d) {return new Date(this.setMonth(this.getMonth() + d));}
Date.prototype.monthsBetween = function(d) {return Math.abs((12 * this.getFullYear() + (this.getMonth() + 1)) - (12 * d.getFullYear() + (d.getMonth() + 1)));};
Date.prototype.formatDate = function () {return (this.getDate() < 10 ? "0" : "") + this.getDate() + "/" + ((this.getMonth() + 1) < 10 ? "0" : "") + (this.getMonth() + 1) + "/" + this.getFullYear();};
// Constants
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",

    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",


], function (declare, _WidgetBase, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent) {
    "use strict";

    return declare("ResourcePlanner.widget.ResourcePlanner", [ _WidgetBase ], {


        // Internal variables
        _handles: null,
        _contextObj: null,
        obj_dateFrom: null,
        obj_dateTo: null, 

        // Search source
        search: null,
        search_dateFrom: null,
        search_dateTo: null,
        search_dynXpath: null,
        search_statXpath: null,

        // Date bar source
        event: null,
        event_startDate: null,
        event_endDate: null,
        event_type: null,
        event_colour: null,

        // Person source
        resource: null,
        resource_name: null,
        resource_category: null,
        resource_title: null,
        resource_description: null,

        // Saved objects
        _domNodes: {},
        _values: {},
        _categories: {},
        _XPath: {
            people: null
        },

        _clear: function() {
            this._domNodes = {};
            this._categories = {};
            this._values = {};
            if (this.domNode) this.domNode.innerHTML = "";
        },

        _scroll: function (int_amount) {
            var context = this;

            var options = {
                left: int_amount,
                top: 0
            }

            Object.keys(context._categories).forEach(function(str_category) {
                var tableContext = context._domNodes[str_category];
                tableContext.heading.right.scrollTo(options);
                tableContext.label.scroller.style.marginLeft = (int_amount * -1) + "px";
                tableContext.list.items.forEach(function(obj_item) {
                    obj_item.right.scrollTo(options);
                });

                // If amount == 0
                // Add shadow to left
                // Else if amount != (scroll.scrollWidth - scroll.offsetWidth)
                // Add shadow to both sides
                // Else
                // Add shadow to right side
            });
        },

        _path: function (str_path, obj_context, func_callback) { 
            if (str_path) {
                obj_context.fetch(str_path, func_callback);
            }
            else func_callback(null);
         },

        _renderDateBars: function (obj_event, list_node, str_event_type, str_event_colour) {
            var context = this;

            // Create datebar settings from data
            var event = {
                startDate: new Date(obj_event.get(context.event_startDate)),
                endDate: new Date(obj_event.get(context.event_endDate)),
                type: str_event_type ? str_event_type : null,
                backgroundColour: str_event_colour ? str_event_colour : "#0595DB"
            };
            
            // Generate datebar style from settings
            var options = {
                "margin-left": event.startDate > context.obj_dateFrom ? ((context.obj_dateFrom.daysBetween(event.startDate) - 1) / context._values.daysBetween * 100) + "%" : "0%",
                "width": calcWidth(),
                "background-color": event.backgroundColour
            };

            function calcWidth() {
                // If event sits between 'From' query
                if (event.startDate <= context.obj_dateFrom && (event.endDate >= context.obj_dateFrom && event.endDate <= context.obj_dateTo)) return ((context.obj_dateFrom.daysBetween(event.endDate)) / context._values.daysBetween * 100) + "%";
                // If event sits between 'To' query
                else if ((event.startDate <= context.obj_dateTo && event.startDate >= context.obj_dateFrom) && event.endDate >= context.obj_dateTo) return ((event.startDate.daysBetween(context.obj_dateTo) + 2) / context._values.daysBetween * 100) + "%";
                // If event sits over the query
                else if (event.startDate <= context.obj_dateFrom && event.endDate >= context.obj_dateTo) return "100%";
                // Standard return
                return ((event.startDate.daysBetween(event.endDate) + 1) / context._values.daysBetween * 100) + "%";
            }

            // Create datebar node
            event.node = dojo.create("div", {
                class: "rp-datebar",
                innerHTML: "<div class=\"rp-datebar-label\">" + (event.type ? event.type + ": " : "") + event.startDate.formatDate() + " - " + event.endDate.formatDate() + "</div>"
            }, list_node.scroller);

            // Set datebar style
            dojoStyle.set(event.node, options);
        },

        _renderPerson: function (obj_person, str_category) {
            var context = this;

            if (!str_category) str_category = context.resource_title ? context.resource_title : "Planner";

            // Check if category exists
            if (!context._categories[str_category]) {
                context._renderSection(str_category);
                context._categories[str_category] = true;
            }

            // Save object context
            var objContext = context._domNodes[str_category];

            // HTML Variables
            var personHTML = obj_person.get(context.resource_name) ? "<div>" + obj_person.get(context.resource_name) + "</div>" : "<div>N/A</div>";
            var descriptionHTML = context.resource_description ? (obj_person.get(context.resource_description) ? "<div>" + obj_person.get(context.resource_description) + "</div>" : "") : "";

            // Render people
            var personNodes = {
                left: dojo.create("div", {
                    class: "rp-row rp-group-left",
                    innerHTML: personHTML +  descriptionHTML
                }, objContext.list.list),
                right: dojo.create("div", {class: "rp-row rp-group-right"}, objContext.list.list)
            };
            personNodes.scroller = dojo.create("div", {class: "rp-scroller", style: "width: " + context._values.scrollWidth + "%"}, personNodes.right);

            // Get datebars
            mx.data.get({
                guid: obj_person.getGuid(),
                path: context._dateBarPath[0],
                callback: function(list_event) {
                    list_event.forEach(function(obj_event) {
                        // Get event type
                        context._path(context.event_type, obj_event, function(str_event_type) {
                            // Get event colour
                            context._path(context.event_colour, obj_event, function(str_event_colour) {
                                // Render datebar
                                context._renderDateBars(obj_event, personNodes, str_event_type, str_event_colour)
                            });
                        });
                    });
                }
            });

            // Save nodes
            objContext.list.items.push(personNodes);
        },

        _renderSection: function (str_title) {
            var context = this;

            // Scrollbar events
            function shiftScrollEvent(e) { if (e.shiftKey) context._domNodes.scroll.scrollLeft = e.deltaY + context._domNodes.scroll.scrollLeft; }

            // Generate date labels
            function gDateLabels() {
                var returnStr = "";
                var loopDate = new Date(context.obj_dateFrom);

                for (var i = 0; i < context._values.daysBetween; i++) {
                    returnStr += "<span class=\"rp-label-date\" style=\"width:" + context._values.daysWidth + "%;\"><div class=\"rp-line\"></div>" + loopDate.getDate() + "</span>";
                    loopDate = loopDate.addDays(1);
                }
                return returnStr;
            }

            // Generate month labels
            function gMonthLabels() {
                var returnStr = "";
                var loopDate = new Date(context.obj_dateFrom);
                var monthsWidth = 0;
                loopDate.setDate(1);

                for (var i = 0; i < context._values.monthsBetween; i++) {
                    var monthEnd = new Date(loopDate.getFullYear(), loopDate.getMonth() + 1, 0);
                    if (context.obj_dateFrom.getMonth() == loopDate.getMonth()) monthsWidth = (context.obj_dateFrom.daysBetween(monthEnd) + 1) / context._values.daysBetween * 100;
                    else if (context.obj_dateTo.getMonth() == loopDate.getMonth()) monthsWidth = (loopDate.daysBetween(context.obj_dateTo) + 1) / context._values.daysBetween * 100;
                    else monthsWidth = (loopDate.daysBetween(monthEnd) + 1) / context._values.daysBetween * 100;
                    returnStr += "<h3 class=\"rp-label-date\" style=\"width:" + monthsWidth + "%;\">" + months[loopDate.getMonth()] + "</h3>";
                    loopDate = loopDate.addMonths(1);
                }
                return returnStr;
            }

            // Render section
            var tableContext = {};

            // Body
            tableContext.wrapper = dojo.create("div", {class: "rp-group-wrapper"}, context.domNode);
            tableContext.wrapper.addEventListener("wheel", shiftScrollEvent);

            // Heading
            tableContext.heading = {
                left: dojo.create("div", {class: "rp-heading rp-group-left"}, tableContext.wrapper),
                right: dojo.create("div", {class: "rp-heading rp-group-right"}, tableContext.wrapper)
            };
            tableContext.heading.title = dojo.create("h3", {class: "rp-group-title", innerHTML: str_title}, tableContext.heading.left);
            tableContext.heading.scroller = dojo.create("div", {class: "rp-scroller", innerHTML: gMonthLabels(tableContext), style: "width: " + context._values.scrollWidth + "%"}, tableContext.heading.right);

            // Label
            tableContext.label = {
                left: dojo.create("div", {
                    class: "rp-label rp-group-left",
                    innerHTML: "<span>Full name: </span>"
                }, tableContext.wrapper),
                right: dojo.create("div", {class: "rp-label rp-group-right"}, tableContext.wrapper)
            };
            tableContext.label.scroller = dojo.create("div", {class: "rp-scroller", innerHTML: gDateLabels(), style: "width: " + context._values.scrollWidth + "%"}, tableContext.label.right);

            // List
            tableContext.list = {
                list: dojo.create("div", {class: "rp-group-list"}, tableContext.wrapper),
                items: []
            };

            this._domNodes[str_title] = tableContext;
        },

        _renderTable: function () {
            var context = this;

            // Generate all values for table
            this._values.daysBetween =  this.obj_dateFrom.daysBetween(this.obj_dateTo) + 1;
            this._values.daysWidth =  100 / this._values.daysBetween;
            this._values.monthsBetween = this.obj_dateFrom.monthsBetween(this.obj_dateTo) + 1;
            this._values.scrollWidth = this._values.monthsBetween * 100;

            // Create scrollbar
            this._domNodes.scroll = dojo.create("div", {class: "rp-scroll-wrapper"}, context.domNode);
            dojo.create("div", {class: "rp-scroll", style: "width: " + context._values.scrollWidth + "%"}, this._domNodes.scroll);
            this._domNodes.scroll.addEventListener("scroll", scrollEvent);

            // Scrollbar events
            function scrollEvent(e) { context._scroll(context._domNodes.scroll.scrollLeft); }

            // Render people
            mx.data.get({
                xpath: context._XPath.people,
                callback: function(list_person) {
                    list_person.forEach(function(obj_person) {
                        // Get person category
                        context._path(context.resource_category, obj_person, function(str_category) { context._renderPerson(obj_person, str_category) });
                    })
                }
            });
        },

        render: function () {
            var context = this;

            var pid = mx.ui.showProgress(); // Show progress dialog

            // Clear table
            this._clear();

            // Instantiate dates
            this.obj_dateFrom = new Date(this._contextObj.get(this.search_dateFrom));
            this.obj_dateTo = new Date(this._contextObj.get(this.search_dateTo));

            var startXpathFilter = "[" + context.event_startDate + " > " + this.obj_dateFrom.valueOf() + " or " + context.event_endDate + " > " + this.obj_dateFrom.valueOf() + "]";
            var endXpathFilter = "[" + context.event_startDate + " < " + this.obj_dateTo.valueOf() + " or " + context.event_endDate + " < " + this.obj_dateTo.valueOf() + "]";

            // Instantiate variables
            this._dateBarPath = this.resource ? this.resource.split("/") : null;
            this._XPath.people = "//" + context.event + startXpathFilter + endXpathFilter + "/" + context.resource;

            // Render inital table
            this._renderTable();

            mx.ui.hideProgress(pid); // Hide progress dialog
        },

        constructor: function () {
            this._handles = [];
        },

        postCreate: function () {
            logger.debug(this.id + ".postCreate");
        },

        update: function (obj, callback) {
            var context = this;

            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._updateRendering(callback);
            
            this.render();

            this.subscribe({
                guid: context._contextObj.getGuid(),
                callback: context.render
            });
        },

        resize: function (box) {
            logger.debug(this.id + ".resize");
        },

        uninitialize: function () {
            logger.debug(this.id + ".uninitialize");
        },

        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");

            // if (this._contextObj !== null) {
            //     dojoStyle.set(this.domNode, "display", "block");
            // } else {
            //     dojoStyle.set(this.domNode, "display", "none");
            // }

            this._executeCallback(callback, "_updateRendering");
        },

        // Shorthand for running a microflow
        _execMf: function (mf, guid, cb) {
            logger.debug(this.id + "._execMf");
            if (mf && guid) {
                mx.ui.action(mf, {
                    params: {
                        applyto: "selection",
                        guids: [guid]
                    },
                    callback: lang.hitch(this, function (objs) {
                        if (cb && typeof cb === "function") {
                            cb(objs);
                        }
                    }),
                    error: function (error) {
                        console.debug(error.description);
                    }
                }, this);
            }
        },

        // Shorthand for executing a callback, adds logging to your inspector
        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["ResourcePlanner/widget/ResourcePlanner"]);
