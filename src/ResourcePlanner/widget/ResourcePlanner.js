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
        dateFrom: null,
        dateTo: null, 

        // Search source
        searchEntity: null,
        searchDateFrom: null,
        searchDateTo: null,

        // Date bar source
        dateBar: null,
        startDate: null,
        endDate: null,
        barType: null,

        // Person source
        person: null,
        fullname: null,
        category: null,
        description: null,

        // Saved objects
        _domNodes: {},
        _values: {},
        _categories: {},
        _categoryPath: null,
        _XPath: {
            people: null
        },

        _clear: function() {
            this._domNodes = {};
            this._categories = {};
            this._values = {};
            if (this.domNode) this.domNode.innerHTML = "";
        },

        _scroll: function (amount) {
            var context = this;

            var options = {
                left: amount,
                top: 0
            }

            Object.keys(context._categories).forEach(function(text) {
                var tableContext = context._domNodes[text];
                tableContext.heading.right.scrollTo(options);
                tableContext.label.scroller.style.marginLeft = (amount * -1) + "px";
                tableContext.list.items.forEach(function(item) {
                    item.right.scrollTo(options);
                });

                // If amount == 0
                // Add shadow to left
                // Else if amount != (scroll.scrollWidth - scroll.offsetWidth)
                // Add shadow to both sides
                // Else
                // Add shadow to right side
            });
        },
        
        _getCategory: function (guid, callback) {
            var context = this;

            var xpath = this._XPath.people + "[id=\"" + guid + "\"]";
            if (context._categoryPath.length > 1) {
                for (var x = 0; x < context._categoryPath.length - 1; x++) xpath = xpath + "/" + context._categoryPath[x];
            }
            mx.data.get({
                xpath: xpath,
                callback: function(objs) {
                    var value = objs[0].get(context._categoryPath[context._categoryPath.length > 1 ? context._categoryPath.length - 1 : 0]);
                    callback(value);
                }
            });
        },

        _renderDateBars: function (datebar, nodes) {
            var context = this;

            // Create datebar settings from data
            var datebar = {
                startDate: new Date(datebar.get(context.startDate)),
                endDate: new Date(datebar.get(context.endDate)),
                type: context.barType ? (datebar.get(context.barType) ? datebar.get(context.barType) : null) : null,
                backgroundColour: "#0595DB"
            };
            
            // Generate datebar style from settings
            var options = {
                "margin-left": datebar.startDate > context.dateFrom ? ((context.dateFrom.daysBetween(datebar.startDate) - 1) / context._values.daysBetween * 100) + "%" : "0%",
                "width": calcWidth(),
                "background-color": datebar.backgroundColour
            };

            function calcWidth() {
                // If event sits between 'From' query
                if (datebar.startDate <= context.dateFrom && (datebar.endDate >= context.dateFrom && datebar.endDate <= context.dateTo)) return ((context.dateFrom.daysBetween(datebar.endDate)) / context._values.daysBetween * 100) + "%";
                // If event sits between 'To' query
                else if ((datebar.startDate <= context.dateTo && datebar.startDate >= context.dateFrom) && datebar.endDate >= context.dateTo) return ((datebar.startDate.daysBetween(context.dateTo) + 2) / context._values.daysBetween * 100) + "%";
                // If event sits over the query
                else if (datebar.startDate <= context.dateFrom && datebar.endDate >= context.dateTo) return "100%";
                // Standard return
                return ((datebar.startDate.daysBetween(datebar.endDate) + 1) / context._values.daysBetween * 100) + "%";
            }

            // Create datebar node
            datebar.node = dojo.create("div", {
                class: "rp-datebar",
                innerHTML: "<div class=\"rp-datebar-label\">" + (datebar.type ? datebar.type + ": " : "") + datebar.startDate.formatDate() + " - " + datebar.endDate.formatDate() + "</div>"
            }, nodes.scroller);

            // Set datebar style
            dojoStyle.set(datebar.node, options);
        },

        _renderPerson: function (person) {
            var context = this;

            context._getCategory(person, function(value) {               
                // Check if category exists
                if (!context._categories[value]) {
                    context._renderSection(value);
                    context._categories[value] = true;
                }

                // Save object context
                var objContext = context._domNodes[value];

                // HTML Variables
                var personHTML = person.get(context.fullname) ? "<div>" + person.get(context.fullname) + "</div>" : "<div>N/A</div>";
                var descriptionHTML = context.description ? (person.get(context.description) ? "<div>" + person.get(context.description) + "</div>" : "") : "";

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
                    guid: person.getGuid(),
                    path: context._dateBarPath[0],
                    callback: function(objs) {
                        objs.forEach(function(obj) { context._renderDateBars(obj, personNodes); });
                    }
                });

                // Save nodes
                objContext.list.items.push(personNodes);
            });
        },

        _renderSection: function (value) {
            var context = this;

            // Scrollbar events
            function shiftScrollEvent(e) { if (e.shiftKey) context._domNodes.scroll.scrollLeft = e.deltaY + context._domNodes.scroll.scrollLeft; }

            // Generate date labels
            function gDateLabels() {
                var returnStr = "";
                var loopDate = new Date(context.dateFrom);

                for (var i = 0; i < context._values.daysBetween; i++) {
                    returnStr += "<span class=\"rp-label-date\" style=\"width:" + context._values.daysWidth + "%;\"><div class=\"rp-line\"></div>" + loopDate.getDate() + "</span>";
                    loopDate = loopDate.addDays(1);
                }
                return returnStr;
            }

            // Generate month labels
            function gMonthLabels(obj) {
                var returnStr = "";
                var loopDate = new Date(context.dateFrom);
                var monthsWidth = 0;
                loopDate.setDate(1);

                for (var i = 0; i < context._values.monthsBetween; i++) {
                    var monthEnd = new Date(loopDate.getFullYear(), loopDate.getMonth() + 1, 0);
                    if (context.dateFrom.getMonth() == loopDate.getMonth()) monthsWidth = (context.dateFrom.daysBetween(monthEnd) + 1) / context._values.daysBetween * 100;
                    else if (context.dateTo.getMonth() == loopDate.getMonth()) monthsWidth = (loopDate.daysBetween(context.dateTo) + 1) / context._values.daysBetween * 100;
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
            tableContext.heading.title = dojo.create("h3", {class: "rp-group-title", innerHTML: value}, tableContext.heading.left);
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

            this._domNodes[value] = tableContext;
        },

        _renderTable: function () {
            var context = this;

            // Generate all values for table
            this._values.daysBetween =  this.dateFrom.daysBetween(this.dateTo) + 1;
            this._values.daysWidth =  100 / this._values.daysBetween;
            this._values.monthsBetween = this.dateFrom.monthsBetween(this.dateTo) + 1;
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
                callback: function(objs) {
                    objs.forEach(function(obj) { context._renderPerson(obj) })
                }
            });
        },

        render: function () {
            var context = this;

            var pid = mx.ui.showProgress(); // Show progress dialog

            // Clear table
            this._clear();

            // Instantiate dates
            this.dateFrom = new Date(this._contextObj.get(this.searchDateFrom));
            this.dateTo = new Date(this._contextObj.get(this.searchDateTo));

            var startXpathFilter = "[" + context.startDate + " > " + this.dateFrom.valueOf() + " or " + context.endDate + " > " + this.dateFrom.valueOf() + "]";
            var endXpathFilter = "[" + context.startDate + " < " + this.dateTo.valueOf() + " or " + context.endDate + " < " + this.dateTo.valueOf() + "]";

            // Instantiate variables
            this._categoryPath = this.category ? this.category.split("/") : null;
            this._dateBarPath = this.person ? this.person.split("/") : null;
            this._XPath.people = "//" + context.dateBar + startXpathFilter + endXpathFilter + "/" + context.person;

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
