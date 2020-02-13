// Custom scripts
Date.prototype.addDays = function(d) {return new Date(this.setDate(this.getDate() + d));};
Date.prototype.daysBetween = function(d) {return Math.round(Math.abs((this.getTime() - d.getTime()) / 864E5));};
Date.prototype.addMonths = function(d) {return new Date(this.setMonth(this.getMonth() + d));};
Date.prototype.monthsBetween = function(d) {return Math.abs((12 * this.getFullYear() + (this.getMonth() + 1)) - (12 * d.getFullYear() + (d.getMonth() + 1)));};
Date.prototype.flatten = function() {return new Date(this.toDateString());};
// Constants
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

define([
    'dojo/_base/declare',
    'mxui/widget/_WidgetBase',
    'mendix/lib/MxContext',
    'mxui/dom',
    'dojo/dom',
    'dojo/dom-prop',
    'dojo/dom-geometry',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/text',
    'dojo/html',
    'dojo/_base/event',


], function (declare, _WidgetBase, MxContext, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent) {
    'use strict';

    return declare('ResourcePlanner.widget.ResourcePlanner', [ _WidgetBase ], {


        // Internal variables
        _handles: null,
        _contextObj: null,
        obj_dateFrom: null,
        obj_dateTo: null, 

        // Search source
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
        resource_name: null,
        resource_description: null,
        resource_category: null,
        resource_category_description: null,
        resource_title: null,
        resource_sortBy: null,
        resource_form: null,
        resource_form_location: null,

        // Saved objects
        _domNodes: {},
        _values: {},
        _categories: {},

        _getString: function(mxObject, attribute) {
            var string = null;
            if (mxObject instanceof Object) {
                string = mxObject.get(attribute);
                string = mxObject.isEnum(attribute) ? mxObject.getEnumCaption(attribute, string) : string;
            }
            return string;
        },

        _fetchString: function(mxObject, path) {
            var context = this;
            return new Promise((resolve, reject) => {
                context._fetch(mxObject, path).then(returnObj => { resolve(context._getString(returnObj, path.attribute)) });
            });
        },

        _fetch: function(mxObject, path) {
            return new Promise((resolve, reject) => {
                if (path.attribute == null || path.attribute == '') resolve(null);
                else {
                    if (path.path == null || path.path == '') resolve(mxObject);
                    else mxObject.fetch(path.path, result => { resolve(result) });
                }
            });
        },

        _splitPath: function(string_path) {
            if (string_path == '' || string_path == null) return { path: null, attribute: null };
            var obj = new Object;
            obj.path = string_path.split('/');
            obj.attribute = obj.path.pop();
            obj.path = obj.path.join('/');
            return obj;
        },

        _clear: function(callback) {
            this._domNodes = {};
            this._categories = {};
            this._values = {};
            if (this.domNode) this.domNode.innerHTML = '';
            callback();
        },

        _scroll: function (int_amount) {
            var context = this;
            var options = { left: int_amount, top: 0 }
            var shadowNodes = context.domNode.querySelectorAll('.rp-group-right:not(.rp-heading)');
            Object.keys(context._domNodes.sections).forEach(string_section => {
                var section = context._domNodes.sections[string_section];
                section.node.heading.right.scrollTo(options);
                section.node.label.scroller.style.marginLeft = (int_amount * -1) + 'px';
                Object.keys(section.resources).forEach(string_resource => {
                    var resource = section.resources[string_resource];
                    resource.node.right.scrollTo(options);
                });
            });
            // if (int_amount <= 0) {
            //     shadowNodes.forEach(node => { node.style.boxShadow = 'rgb(215, 215, 215) -15px 0px 10px -10px inset, rgb(215, 215, 215) 1px 0px 0px inset'; });
            // }
            // else if (int_amount >= (context._domNodes.scroller.scrollWidth - context._domNodes.scroller.offsetWidth)) {
            //     shadowNodes.forEach(node => { node.style.boxShadow = 'rgb(215, 215, 215) -1px 0px 0px inset, rgb(215, 215, 215) 15px 0px 10px -10px inset'; });
            // }
            // else {
            //     shadowNodes.forEach(node => { node.style.boxShadow = 'rgb(215, 215, 215) -15px 0px 10px -10px inset, rgb(215, 215, 215) 15px 0px 10px -10px inset'; });
            // } 
        },

        _alignEvents: function(list_data) {
            var context = this;
            var endDates = new Array;
            var previousData = null;
            for (var dataIndex = 0; dataIndex < list_data.length; dataIndex++) {
                var data = list_data[dataIndex];
                data.level = 0
                if (previousData != null && previousData.nameString === data.nameString && previousData.categoryString === data.categoryString) {
                    endDates[previousData.level] = new Date(previousData.obj.get(context.event_endDate)).flatten();
                }
                else endDates = [];
                for (var level = 0; level < endDates.length; level++) {
                    var endDate = endDates[level];
                    var startDate = new Date(data.obj.get(context.event_startDate)).flatten();
                    if (endDate < startDate) {
                        data.level = level;
                        break;
                    }
                    else data.level++
                }
                previousData = data;
            }
            return list_data;
        },

        renderEvent: function (mxObject_event, string_eventColour, string_eventType, int_level, object_nodes) {
            var context = this;
            function calcWidth() {
                // If event sits between 'From' query
                if (event.startDate <= context.obj_dateFrom && (event.endDate >= context.obj_dateFrom && event.endDate <= context.obj_dateTo)) return ((context.obj_dateFrom.daysBetween(event.endDate) + 1) / context._values.daysBetween * 100) + '%';
                // If event sits between 'To' query
                else if ((event.startDate <= context.obj_dateTo && event.startDate >= context.obj_dateFrom) && event.endDate >= context.obj_dateTo) return ((event.startDate.daysBetween(context.obj_dateTo) + 1) / context._values.daysBetween * 100) + '%';
                // If event sits over the query
                else if (event.startDate <= context.obj_dateFrom && event.endDate >= context.obj_dateTo) return '100%';
                // Standard return
                return ((event.startDate.daysBetween(event.endDate) + 1) / context._values.daysBetween * 100) + '%';
            }
            // Gather event data
            var event                   = new Object;
            event.startDate             = new Date(mxObject_event.get(context.event_startDate)).flatten();
            event.endDate               = new Date(mxObject_event.get(context.event_endDate)).flatten();
            event.type                  = string_eventType ? string_eventType : null;
            // Gather event options
            var options                 = new Object;
            options['margin-left']      = event.startDate > context.obj_dateFrom ? (context.obj_dateFrom.daysBetween(event.startDate) / context._values.daysBetween * 100) + '%' : '0%';
            options['width']            = calcWidth();
            options['background-color'] = string_eventColour ? string_eventColour : '#0595DB';
            options['margin-top']       = int_level != 0 ? `${int_level * 32}px` : '0px';

            var html = event.type ? `<div class='rp-datebar-label'>${event.type}</div>` : ''; // ${(event.type ? event.type + ':' : '')}
            html += `<div class='rp-datebar-label rp-date'>${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}</div>`;
            event.node = dojo.create('div', {class: 'rp-datebar', innerHTML: html}, object_nodes.list.scroller);
            dojoStyle.set(event.node, options);
        },

        renderResource: function (string_name, string_description, mxObject_resource, object_nodes) {
            var context = this;
            // HTML Variables
            console.log(context.resource_form);
            var personNode = context.resource_form ? 'a' : 'div';
            var personHTML = `<${personNode} class='rp-resource-name'><span class='glyphicon glyphicon-user spacing-outer-right'></span>${string_name}</${personNode}>`;
            var descriptionHTML = context.resource_description ? `<div class='rp-resource-description'>${string_description}</div>` : '';
            var HTML = `<div class='rp-resource'>${personHTML}${descriptionHTML}</div>`;
            // Render people
            var personNodes             = new Object;
            personNodes.row             = dojo.create('div', {class: 'rp-row'}, object_nodes.list.scroller);
            personNodes.left            = dojo.create('div', {class: 'rp-group-left', innerHTML: HTML}, personNodes.row);
            personNodes.right           = dojo.create('div', {class: 'rp-group-right'}, personNodes.row);
            if (context.resource_form) {
                var resourceTitle = personNodes.left.querySelector('a.rp-resource-name');
                var resourceEntity = context._splitPath(context.resource_name).path.split('/').pop();
                var resourceContext = new MxContext();
                resourceContext.setContext(resourceEntity, mxObject_resource.getGuid());
                console.log(resourceEntity, context);
                resourceTitle.addEventListener('click', event => { mx.ui.openForm(context.resource_form, { location: context.resource_form_location, context: resourceContext }); });
            }
            // Render scroller list
            personNodes.list            = new Object;
            personNodes.list.scroller   = dojo.create('div', {class: 'rp-scroller', style: `width: ${context._values.scrollWidth}%`}, personNodes.right);
            personNodes.list.items      = new Array;

            return personNodes;
        },

        renderSection: function (string_title, string_description) {
            var context = this;
            function shiftScrollEvent(e) { if (e.shiftKey) context._domNodes.scroller.scrollLeft = e.deltaY + context._domNodes.scroller.scrollLeft; }
            function gDateLabels() {
                var returnStr = '';
                var loopDate = new Date(context.obj_dateFrom);

                for (var i = 0; i < context._values.daysBetween; i++) {
                    returnStr += `<span class='rp-label-date' style='width: ${context._values.daysWidth}%;'><div class='rp-line'></div>${loopDate.getDate()}</span>`;
                    loopDate = loopDate.addDays(1);
                }
                return returnStr;
            }
            function gMonthLabels() {
                var returnStr = '';
                var loopDate = new Date(context.obj_dateFrom);
                var monthsWidth = 0;
                loopDate.setDate(1);

                for (var i = 0; i < context._values.monthsBetween; i++) {
                    var monthEnd = new Date(loopDate.getFullYear(), loopDate.getMonth() + 1, 0);
                    if (context.obj_dateFrom.getMonth() == loopDate.getMonth()) monthsWidth = (context.obj_dateFrom.daysBetween(monthEnd) + 1) / context._values.daysBetween * 100;
                    else if (context.obj_dateTo.getMonth() == loopDate.getMonth()) monthsWidth = (loopDate.daysBetween(context.obj_dateTo) + 1) / context._values.daysBetween * 100;
                    else monthsWidth = (loopDate.daysBetween(monthEnd) + 1) / context._values.daysBetween * 100;
                    returnStr += `<div class='rp-label-date' style='width: ${monthsWidth}%;'><h3>${months[loopDate.getMonth()]}</h3><span class='rp-label-year'>${loopDate.getFullYear()}</span></div>`;
                    loopDate = loopDate.addMonths(1);
                }               
                return returnStr;
            }
            string_title = string_title ? string_title : context.resource_title ? context.resource_title : 'Planner';
            // Render section
            var section = new Object;
            // Body
            section.wrapper             = dojo.create('div', {class: 'rp-group-wrapper'}, context.domNode);
            section.wrapper.addEventListener('wheel', shiftScrollEvent);
            // Heading
            section.heading             = new Object;
            section.heading.row         = dojo.create('div', {class: 'rp-row rp-heading'}, section.wrapper);
            section.heading.left        = dojo.create('div', {class: 'rp-group-left'}, section.heading.row);
            section.heading.right       = dojo.create('div', {class: 'rp-group-right'}, section.heading.row);
            section.heading.title       = dojo.create('h3', {class: 'rp-group-title', innerHTML: string_title}, section.heading.left);
            section.heading.description = dojo.create('span', {class: 'rp-group-description', innerHTML: string_description}, section.heading.left);
            section.heading.scroller    = dojo.create('div', {class: 'rp-scroller', innerHTML: gMonthLabels(section), style: 'width: ' + context._values.scrollWidth + '%'}, section.heading.right);
            // Label
            section.label               = new Object;
            section.label.row           = dojo.create('div', {class: 'rp-row rp-label'}, section.wrapper);
            section.label.left          = dojo.create('div', {class: 'rp-group-left', innerHTML: '<span>Full name: </span>' }, section.label.row);
            section.label.right         = dojo.create('div', {class: 'rp-group-right'}, section.label.row);
            section.label.scroller      = dojo.create('div', {class: 'rp-scroller', innerHTML: gDateLabels(), style: 'width: ' + context._values.scrollWidth + '%'}, section.label.right);
            // List
            section.list                = new Object;
            section.list.scroller       = dojo.create('div', {class: 'rp-group-list'}, section.wrapper);
            section.list.items          = new Array;
            return section;
        },

        renderEvents: function(list_data) {
            var context = this;
            this._domNodes.sections = new Object;
            return new Promise((resolve, reject) => {
                for (var index = 0; index < list_data.length; index++) {
                    var data = list_data[index];
                    context._domNodes.sections[data.categoryString] = context._domNodes.sections[data.categoryString] ? context._domNodes.sections[data.categoryString] : new Object;
                    // Process section
                    var section         = context._domNodes.sections[data.categoryString];
                    section.node        = section.node ? section.node : context.renderSection(data.categoryString, data.catDescString);
                    section.resources   = section.resources ? section.resources : new Object;
                    // Process resource
                    var resource        = section.resources[data.nameString] ? section.resources[data.nameString] : new Object;
                    resource.node       = resource.node ? resource.node : context.renderResource(data.nameString, data.descriptionString, data.resourceObject, section.node);
                    resource.events     = resource.events ? resource.events : new Object;
                    resource.size       = resource.size ? resource.size : 1;
                    resource.size       = data.level + 1 > resource.size ? data.level + 1 : resource.size;
                    resource.node.list.scroller.style.height = `${resource.size * 32}px`;
                    section.resources[data.nameString] = resource;
                    // Process event
                    var event           = resource.events[data.obj.getGuid()] ? resource.events[data.obj.getGuid()] : new Object;
                    event.node          = event.node ? event.node : context.renderEvent(data.obj, data.colourString, data.typeString, data.level, resource.node);
                    resource.events[data.obj.getGuid()] = event;
                    context._domNodes.sections[data.categoryString] = section;
                }
                resolve();
            })
        },

        _renderTable: function (list_data) {
            var context = this;
            return new Promise((resolve, reject) => {
                if (list_data.length != 0) {
                    // Generate all values for table
                    this._values.daysBetween =  this.obj_dateFrom.daysBetween(this.obj_dateTo) + 1;
                    this._values.daysWidth =  100 / this._values.daysBetween;
                    this._values.monthsBetween = this.obj_dateFrom.monthsBetween(this.obj_dateTo) + 1;
                    this._values.scrollWidth = this._values.monthsBetween * 100;
                    // Create scrollbar
                    this._domNodes.scroller = dojo.create('div', {class: 'rp-scroll-wrapper'}, context.domNode);
                    dojo.create('div', {class: 'rp-scroll', style: 'width: ' + context._values.scrollWidth + '%'}, this._domNodes.scroller);
                    this._domNodes.scroller.addEventListener('scroll', scrollEvent);
                    // Scrollbar events
                    function scrollEvent(e) { context._scroll(context._domNodes.scroller.scrollLeft); }
                    // Loop through the events and render them
                    this.renderEvents(list_data).then(() => { resolve(); });
                }
                else reject('No data found');
            })
        },

        fetchData: function (mxObject_event) {
            var context = this;
            return new Promise((resolve, reject) => {
                var event = { obj: mxObject_event };
                try {
                    // Name
                    var namePath = context._splitPath(context.resource_name);
                    var namePromise = context._fetch(mxObject_event, namePath);
                    // Description
                    var descriptionPath = context._splitPath(context.resource_description);
                    var descriptionPromise = context._fetchString(mxObject_event, descriptionPath);
                    // Category
                    var categoryPath = context._splitPath(context.resource_category);
                    var categoryPromise = context._fetchString(mxObject_event, categoryPath);
                    // Colour
                    var colourPath = context._splitPath(context.event_colour);
                    var colourPromise = context._fetchString(mxObject_event, colourPath);
                    // Type
                    var typePath = context._splitPath(context.event_type);
                    var typePromise = context._fetchString(mxObject_event, typePath);
                    // Category description
                    var catDescPath = context._splitPath(context.resource_category_description);
                    var catDescPromise = context._fetchString(mxObject_event, catDescPath);
                    // Retreived data
                    namePromise.then(resourceObject => {
                        event.nameString = context._getString(resourceObject, namePath.attribute);
                        event.resourceObject = resourceObject;
                        descriptionPromise.then(descriptionString =>            { event.descriptionString = descriptionString;
                            categoryPromise.then(categoryString =>              { event.categoryString = categoryString;
                                colourPromise.then(colourString =>              { event.colourString = colourString;
                                    typePromise.then(typeString =>              { event.typeString = typeString;
                                        catDescPromise.then(catDescString =>    { event.catDescString = catDescString;
                                            resolve(event);
                                        })
                                    })
                                })
                            })
                        })
                    })
                }
                catch(e) {
                    console.log(e);
                    reject('Could not fetch data');
                }
            });
        },

        fetchAllData: function() {
            var context = this;
            var xpathStart = '[' + context.event_startDate + ' >= ' + context.obj_dateFrom.valueOf() + ' or ' + context.event_endDate + ' >= ' + context.obj_dateFrom.valueOf() + ']';
            var xpathEnd = '[' + context.event_startDate + ' <= ' + (context.obj_dateTo.valueOf() + 1000*60*60*23) + ' or ' + context.event_endDate + ' <= ' + (context.obj_dateTo.valueOf() + 1000*60*60*23) + ']';
            var xpath = '//' + context.event + xpathStart + xpathEnd + context.search_statXpath + (context.search_dynXpath ? context._contextObj.get(context.search_dynXpath) : '');
            var sortOrder = context.resource_sortBy ? context.resource_sortBy : context.resource_name;
            return new Promise((resolve, reject) => {
                try {
                    mx.data.get({
                        xpath: xpath,
                        filter: { sort: [[sortOrder, 'asc'], [context.event_startDate, 'asc']] },
                        callback: mxList_event => {
                            var returnList = new Array;
                            var listCount = mxList_event.length;
                            if (listCount == 0) resolve(new Array);
                            mxList_event.forEach((mxObject_event, event_index) => {
                                var fetchEventData = context.fetchData(mxObject_event);
                                fetchEventData.then(data => {
                                    returnList[event_index] = data;
                                    if (--listCount <= 0) resolve(returnList);
                                });
                            });
                        }
                    });
                }
                catch(e) {
                    console.log(e);
                    reject('Could not fetch data')
                }
            });
        },
        
        render: function () {
            var context = this;
            // Clear table
            this._clear(() => {
                // Instantiate dates
                this.obj_dateFrom = new Date(this._contextObj.get(this.search_dateFrom)).flatten();
                this.obj_dateTo = new Date(this._contextObj.get(this.search_dateTo)).flatten();
                // Render inital table
                if (this.obj_dateFrom.monthsBetween(this.obj_dateTo) < 9) {
                    var pid = mx.ui.showProgress();
                    var data = context.fetchAllData();
                    data.then(function(list_data) {
                        list_data = context._alignEvents(list_data);
                        context._renderTable(list_data).then(() => {
                            mx.ui.hideProgress(pid);
                        }, message => {
                            mx.ui.hideProgress(pid);
                            context._domMessage(message);
                        });
                    });
                }
                else context._domMessage('Date range > 8 months');
            });
        },

        constructor: function () {
            this._handles = [];
        },

        postCreate: function () {
            logger.debug(this.id + '.postCreate');
        },

        update: function (obj, callback) {
            var context = this;

            logger.debug(this.id + '.update');

            this._contextObj = obj;
            this._updateRendering(callback);
            
            this.render();

            this.subscribe({
                guid: context._contextObj.getGuid(),
                callback: context.render
            });
        },

        resize: function (box) {
            logger.debug(this.id + '.resize');
        },

        uninitialize: function () {
            logger.debug(this.id + '.uninitialize');
        },

        _domMessage: function(message) {
            this.domNode.innerHTML = '';
            var element = document.createElement('p');
            var text = document.createTextNode(message);
            element.appendChild(text);
            this.domNode.appendChild(element);
            element.setAttribute('class', 'text-center');
        },

        _updateRendering: function (callback) {
            logger.debug(this.id + '._updateRendering');

            // if (this._contextObj !== null) {
            //     dojoStyle.set(this.domNode, 'display', 'block');
            // } else {
            //     dojoStyle.set(this.domNode, 'display', 'none');
            // }

            this._executeCallback(callback, '_updateRendering');
        },

        // Shorthand for running a microflow
        _execMf: function (mf, guid, cb) {
            logger.debug(this.id + '._execMf');
            if (mf && guid) {
                mx.ui.action(mf, {
                    params: {
                        applyto: 'selection',
                        guids: [guid]
                    },
                    callback: lang.hitch(this, function (objs) {
                        if (cb && typeof cb === 'function') {
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
            logger.debug(this.id + '._executeCallback' + (from ? ' from ' + from : ''));
            if (cb && typeof cb === 'function') {
                cb();
            }
        }
    });
});

require(['ResourcePlanner/widget/ResourcePlanner']);
