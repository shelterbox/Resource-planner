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

        _clear: function() {
            this._domNodes = {};
            this._categories = {};
            this._values = {};
            if (this.domNode) this.domNode.innerHTML = "";
        },

        _scroll: function (int_amount) {
            var context = this;
            var options = { left: int_amount, top: 0 }
            Object.keys(context._domNodes.sections).forEach(string_section => {
                var section = context._domNodes.sections[string_section];
                section.node.heading.right.scrollTo(options);
                section.node.label.scroller.style.marginLeft = (int_amount * -1) + "px";
                Object.keys(section.resources).forEach(string_resource => {
                    var resource = section.resources[string_resource];
                    resource.node.right.scrollTo(options);
                });

                // If amount == 0
                // Add shadow to left
                // Else if amount != (scroll.scrollWidth - scroll.offsetWidth)
                // Add shadow to both sides
                // Else
                // Add shadow to right side
            });
        },

        renderEvent: function (mxObject_event, string_eventColour, string_eventType, object_nodes) {
            var context = this;

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

            // Gather event data
            var event                   = new Object;
            event.startDate             = new Date(mxObject_event.get(context.event_startDate));
            event.endDate               = new Date(mxObject_event.get(context.event_endDate));
            event.type                  = string_eventType ? string_eventType : null;

            // Gather event options
            var options                 = new Object;
            options["margin-left"]      = event.startDate > context.obj_dateFrom ? ((context.obj_dateFrom.daysBetween(event.startDate) - 1) / context._values.daysBetween * 100) + "%" : "0%";
            options["width"]            = calcWidth();
            options["background-color"] = string_eventColour ? string_eventColour : "#0595DB";

            var html = `<div class="rp-datebar-label">${(event.type ? event.type + ":" : "")} ${event.startDate.formatDate()} - ${event.endDate.formatDate()}</div>`;
            event.node = dojo.create("div", {class: "rp-datebar", innerHTML: html}, object_nodes.list.scroller);
            dojoStyle.set(event.node, options);
        },

        renderResource: function (mxObject_person, object_nodes) {
            var context = this;

            // HTML Variables
            var personHTML = `<div>${mxObject_person.get(context.resource_name)}</div>`;
            var descriptionHTML = context.resource_description ? `<div>${mxObject_person.get(context.resource_description)}</div>` : "";

            // Render people
            var personNodes             = new Object;
            personNodes.left            = dojo.create("div", {class: "rp-row rp-group-left", innerHTML: personHTML +  descriptionHTML}, object_nodes.list.scroller);
            personNodes.right           = dojo.create("div", {class: "rp-row rp-group-right"}, object_nodes.list.scroller);
            
            // Render scroller list
            personNodes.list            = new Object;
            personNodes.list.scroller   = dojo.create("div", {class: "rp-scroller", style: `width: ${context._values.scrollWidth}%`}, personNodes.right);
            personNodes.list.items      = new Array;

            return personNodes;
        },

        renderSection: function (string_title) {
            var context = this;

            function shiftScrollEvent(e) { if (e.shiftKey) context._domNodes.scroller.scrollLeft = e.deltaY + context._domNodes.scroller.scrollLeft; }

            function gDateLabels() {
                var returnStr = "";
                var loopDate = new Date(context.obj_dateFrom);

                for (var i = 0; i < context._values.daysBetween; i++) {
                    returnStr += `<span class="rp-label-date" style="width: ${context._values.daysWidth}%;"><div class="rp-line"></div>${loopDate.getDate()}</span>`;
                    loopDate = loopDate.addDays(1);
                }
                return returnStr;
            }

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
                    returnStr += `<h3 class="rp-label-date" style="width: ${monthsWidth}%;">${months[loopDate.getMonth()]}</h3>`;
                    loopDate = loopDate.addMonths(1);
                }
                return returnStr;
            }

            string_title = string_title ? string_title : context.resource_title ? context.resource_title : "Planner";

            // Render section
            var section = new Object;

            // Body
            section.wrapper             = dojo.create("div", {class: "rp-group-wrapper"}, context.domNode);
            section.wrapper.addEventListener("wheel", shiftScrollEvent);

            // Heading
            section.heading             = new Object;
            section.heading.left        = dojo.create("div", {class: "rp-heading rp-group-left"}, section.wrapper);
            section.heading.right       = dojo.create("div", {class: "rp-heading rp-group-right"}, section.wrapper);
            section.heading.title       = dojo.create("h3", {class: "rp-group-title", innerHTML: string_title}, section.heading.left);
            section.heading.scroller    = dojo.create("div", {class: "rp-scroller", innerHTML: gMonthLabels(section), style: "width: " + context._values.scrollWidth + "%"}, section.heading.right);

            // Label
            section.label               = new Object;
            section.label.left          = dojo.create("div", {class: "rp-label rp-group-left", innerHTML: "<span>Full name: </span>" }, section.wrapper);
            section.label.right         = dojo.create("div", {class: "rp-label rp-group-right"}, section.wrapper);
            section.label.scroller      = dojo.create("div", {class: "rp-scroller", innerHTML: gDateLabels(), style: "width: " + context._values.scrollWidth + "%"}, section.label.right);

            // List
            section.list                = new Object;
            section.list.scroller       = dojo.create("div", {class: "rp-group-list"}, section.wrapper);
            section.list.items          = new Array;

            return section;
        },

        renderEvents: function(list_data) {
            var context = this;
            this._domNodes.sections = new Object;

            list_data.forEach(data => {
                context._domNodes.sections[data.categoryString] = context._domNodes.sections[data.categoryString] ? context._domNodes.sections[data.categoryString] : new Object;

                // Process section
                var section         = context._domNodes.sections[data.categoryString];
                section.node        = section.node ? section.node : context.renderSection(data.categoryString);
                section.resources   = section.resources ? section.resources : new Object;

                // Process resource
                var resource        = section.resources[data.resourceObj.getGuid()] ? section.resources[data.resourceObj.getGuid()] : new Object;
                resource.node       = resource.node ? resource.node : context.renderResource(data.resourceObj, section.node);
                resource.events     = resource.events ? resource.events : new Object;
                section.resources[data.resourceObj.getGuid()] = resource;

                // Process event
                var event           = resource.events[data.obj.getGuid()] ? resource.events[data.obj.getGuid()] : new Object;
                event.node          = event.node ? event.node : context.renderEvent(data.obj, data.colourString, data.typeString, resource.node);
                resource.events[data.obj.getGuid()] = event;

                context._domNodes.sections[data.categoryString] = section;
            });
        },

        _renderTable: function (list_data) {
            var context = this;

            // Generate all values for table
            this._values.daysBetween =  this.obj_dateFrom.daysBetween(this.obj_dateTo) + 1;
            this._values.daysWidth =  100 / this._values.daysBetween;
            this._values.monthsBetween = this.obj_dateFrom.monthsBetween(this.obj_dateTo) + 1;
            this._values.scrollWidth = this._values.monthsBetween * 100;

            // Create scrollbar
            this._domNodes.scroller = dojo.create("div", {class: "rp-scroll-wrapper"}, context.domNode);
            dojo.create("div", {class: "rp-scroll", style: "width: " + context._values.scrollWidth + "%"}, this._domNodes.scroller);
            this._domNodes.scroller.addEventListener("scroll", scrollEvent);

            // Scrollbar events
            function scrollEvent(e) { context._scroll(context._domNodes.scroller.scrollLeft); }

            // Loop through the events and render them
            this.renderEvents(list_data);
        },

        fetchData: function (mxObject_event) {
            var context = this;
            return new Promise((resolve, reject) => {
                var event = { obj: mxObject_event };
                try {
                    mxObject_event.fetch(context.resource, mxObject_resource => {
                        event.resourceObj = mxObject_resource;
                        mxObject_event.fetch(context.event_colour, string_eventColour => {
                            event.colourString = string_eventColour instanceof Object ? null : string_eventColour;
                            mxObject_event.fetch(context.event_type, string_eventType => {
                                event.typeString = string_eventType instanceof Object ? null : string_eventType;
                                mxObject_resource.fetch(context.resource_category, function(string_category) {
                                    if (string_category instanceof Object) event.categoryString = context.resource_title ? context.resource_title : "Planner";
                                    else event.categoryString = string_category;
                                    resolve(event);
                                });
                            });
                        });
                    });
                }
                catch {
                    reject("Could not fetch data");
                }
            });
        },

        fetchAllData: function() {
            var context = this;
            var xpathStart = "[" + context.event_startDate + " > " + context.obj_dateFrom.valueOf() + " or " + context.event_endDate + " > " + context.obj_dateFrom.valueOf() + "]";
            var xpathEnd = "[" + context.event_startDate + " < " + context.obj_dateTo.valueOf() + " or " + context.event_endDate + " < " + context.obj_dateTo.valueOf() + "]";
            var xpath = "//" + context.event + xpathStart + xpathEnd + context.search_statXpath;
            return new Promise((resolve, reject) => {
                try {
                    mx.data.get({
                        xpath: xpath,
                        callback: mxList_event => {
                            var returnList = new Array;
                            var listCount = mxList_event.length;
                            if (listCount == 0) resolve(new Array);
                            mxList_event.forEach(function(mxObject_event) {
                                var fetchEventData = context.fetchData(mxObject_event);
                                fetchEventData.then(function(data) {
                                    returnList.push(data);
                                    if (--listCount <= 0) resolve(returnList);
                                });
                            });
                        }
                    });
                }
                catch(e) {
                    console.log(e);
                    reject("Could not fetch data")
                }
            });
        },
        
        render: function () {
            var context = this;

            // Clear table
            this._clear();

            // Instantiate dates
            this.obj_dateFrom = new Date(this._contextObj.get(this.search_dateFrom));
            this.obj_dateTo = new Date(this._contextObj.get(this.search_dateTo));

            // Instantiate variables
            this._dateBarPath = this.resource ? this.resource.split("/") : null;
            
            // Render inital table
            var pid = mx.ui.showProgress();
            var data = context.fetchAllData();
            data.then(function(list_data) {
                context._renderTable(list_data);
                mx.ui.hideProgress(pid);
            });
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
