var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Date.prototype.addDays = function (days) {
        return new Date(this.setDate(this.getDate() + days));
    };
    Date.prototype.daysBetween = function (date) {
        return Math.round(Math.abs((this.getTime() - date.getTime()) / 864E5));
    };
    Date.prototype.addMonths = function (months) {
        return new Date(this.setMonth(this.getMonth() + months));
    };
    Date.prototype.monthsBetween = function (date) {
        return Math.abs((12 * this.getFullYear() + (this.getMonth() + 1)) - (12 * date.getFullYear() + (date.getMonth() + 1)));
    };
    Date.prototype.flatten = function () {
        return new Date(this.toDateString());
    };
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var PlannerButton = /** @class */ (function () {
        function PlannerButton(options, parent, context) {
            var _a, _b;
            var _this = this;
            this._name = '';
            this._tooltip = '';
            this._node = document.createElement('button');
            this._textNode = document.createElement('span');
            this._iconNode = document.createElement('span');
            this._node.append(this._iconNode, this._textNode);
            this._id = options.id;
            this.name = options.name;
            if (options.tooltip)
                this.tooltip = options.tooltip;
            else
                this.tooltip = this.name;
            if (options.class)
                (_a = this._node.classList).add.apply(_a, options.class);
            if (options.iconClass)
                (_b = this._iconNode.classList).add.apply(_b, options.iconClass);
            if (options.hideText)
                this.name = '';
            this._onClick = options.onClick;
            this._node.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                _this._onClick(context);
            });
            parent.append(this._node);
        }
        Object.defineProperty(PlannerButton.prototype, "id", {
            get: function () { return this._id; },
            set: function (newId) {
                this._id = newId ? newId : this._id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerButton.prototype, "name", {
            get: function () { return this._name; },
            set: function (newName) {
                this._name = newName ? newName : '';
                this._textNode.innerText = this._name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerButton.prototype, "tooltip", {
            get: function () { return this._tooltip; },
            set: function (newTooltip) {
                this._tooltip = newTooltip ? newTooltip : '';
                this._node.setAttribute('title', this._tooltip);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerButton.prototype, "node", {
            get: function () { return this._node; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerButton.prototype, "onClick", {
            get: function () { return this._onClick; },
            enumerable: true,
            configurable: true
        });
        return PlannerButton;
    }());
    var PlannerResource = /** @class */ (function () {
        function PlannerResource(id, name, parent, description) {
            this._colour = null;
            // Relationships
            this._events = new Array;
            this._buttons = new Array;
            // Render node
            this._renderResource();
            // Properties
            this._id = id;
            this._parent = parent;
            this.name = name;
            this.description = description;
            this.height = PlannerEvent.height;
        }
        PlannerResource.prototype._renderResource = function () {
            this._resourceRow = document.createElement('div');
            this._resourceRow.classList.add('rp-row', 'rp-row-spaced');
            this._resourceRow.innerHTML = "\n    <div>\n        <div class='rp-controls'></div>\n        <div id='name' class='rp-label rp-label-subtitle'></div>\n        <div id='description' class='rp-label'></div>\n    </div>\n    ";
            this._buttonGroup = this._resourceRow.querySelector('div.rp-controls');
            this._eventRow = document.createElement('div');
            this._eventRow.classList.add('rp-row');
            this._eventRow.innerHTML = '<div></div>';
        };
        PlannerResource.prototype.setPositions = function () {
            var validEvents = this._events.filter(function (event) { return event.startDate || event.endDate; });
            var sortedEvents = validEvents.sort(function (a, b) { return a.visualStartDate.valueOf() - b.visualStartDate.valueOf(); });
            var endDates = new Array;
            sortedEvents.forEach(function (event) {
                event.position = 0;
                for (var index = 0; index < endDates.length; index++) {
                    var endDate = endDates[index];
                    if (endDate < event.startDate) {
                        event.position = index;
                        break;
                    }
                    else
                        event.position++;
                }
                endDates[event.position] = event.visualEndDate;
            });
            this.height = PlannerEvent.height * endDates.length;
            return sortedEvents;
        };
        PlannerResource.prototype.addEvent = function (id, startDate, endDate, type, colour) {
            var event = this.event(id);
            if (!event) {
                event = new PlannerEvent(id, startDate, endDate, this, type, colour);
                this._events.push(event);
            }
            event.setDates(startDate, endDate);
            event.type = type;
            event.colour = colour;
            return event;
        };
        PlannerResource.prototype.removeEvent = function (id) {
            var event = this.event(id);
            if (event) {
                event.node.remove();
                this._events = this.events.filter(function (obj) { return obj.id != event.id; });
            }
        };
        PlannerResource.prototype.event = function (id) { return this._events.filter(function (event) { return event.id == id; })[0]; };
        PlannerResource.prototype.findButton = function (id) {
            return this._buttons.filter(function (btn) { return btn.id === id; })[0];
        };
        PlannerResource.prototype.addButton = function (options, context) {
            if (context === void 0) { context = this; }
            var exists = this.findButton(options.id);
            if (!exists) {
                exists = new PlannerButton(options, this._buttonGroup, context);
                this._buttons.push(exists);
                if (this._buttons.length > 1)
                    this._buttonGroup.classList.add('rp-btn-group');
            }
            return exists;
        };
        PlannerResource.prototype.removeButton = function (id) {
            var exists = this.findButton(id);
            if (exists) {
                this._buttons = this._buttons.filter(function (btn) { return btn != exists; });
                if (exists.node)
                    exists.node.remove();
                if (this._buttons.length < 2)
                    this._buttonGroup.classList.remove('rp-btn-group');
            }
        };
        Object.defineProperty(PlannerResource.prototype, "id", {
            get: function () { return this._id; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerResource.prototype, "name", {
            get: function () { return this._name; },
            set: function (name) {
                this._name = name;
                this._resourceRow.querySelector('#name').innerHTML = this._name;
                this._resourceRow.querySelector('#name').setAttribute('title', this._name);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerResource.prototype, "planner", {
            get: function () { return this._parent instanceof ResourcePlanner ? this._parent : this._parent.planner; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerResource.prototype, "parent", {
            get: function () { return this._parent; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerResource.prototype, "description", {
            get: function () { return this._description; },
            set: function (description) {
                this._description = description;
                this._resourceRow.querySelector('#description').innerHTML = this._description;
                this._resourceRow.querySelector('#description').setAttribute('title', this._description);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerResource.prototype, "colour", {
            get: function () { return this._colour; },
            set: function (colour) {
                if (colour != null || colour != '') {
                    this._colour = colour;
                    this._resourceRow.style['background'] = this._colour;
                    this._eventRow.style['background'] = this._colour;
                }
                else {
                    this._colour = null;
                    this._resourceRow.style['background'] = null;
                    this._eventRow.style['background'] = null;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerResource.prototype, "height", {
            get: function () { return this._height; },
            set: function (height) {
                height = height >= PlannerEvent.height ? height : PlannerEvent.height;
                this._height = height;
                var leftNode = this._resourceRow.querySelector('div:first-child');
                var rightNode = this._eventRow.querySelector('div:first-child');
                leftNode.style['height'] = this._height + "px";
                rightNode.style['height'] = this._height + "px";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerResource.prototype, "order", {
            get: function () { return Array.prototype.indexOf.call(this._resourceRow.parentElement.children, this._resourceRow); },
            set: function (index) {
                var pos = index + 1;
                var refResource = this.parent.resources()[index];
                var refResourceRow = refResource ? refResource.resourceRow : null;
                var refEventRow = refResource ? refResource.eventRow : null;
                if (this.parent.resources().length === pos) {
                    refResourceRow = null;
                    refEventRow = null;
                }
                this.resourceRow.parentNode.insertBefore(this.resourceRow, refResourceRow);
                this.eventRow.parentNode.insertBefore(this.eventRow, refEventRow);
                this.parent.reorder();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerResource.prototype, "events", {
            get: function () { return this._events; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerResource.prototype, "resourceRow", {
            get: function () { return this._resourceRow; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerResource.prototype, "eventRow", {
            get: function () { return this._eventRow; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerResource.prototype, "buttons", {
            get: function () { return this._buttons; },
            enumerable: true,
            configurable: true
        });
        return PlannerResource;
    }());
    var PlannerGroup = /** @class */ (function (_super) {
        __extends(PlannerGroup, _super);
        function PlannerGroup(id, name, parent, description, type, colour) {
            var _this = 
            // Instantiate inherited class
            _super.call(this, id, name, parent, description) || this;
            // Properties
            _this._toggled = false;
            // Relationships
            _this._resources = new Array;
            _this._previousGroups = new Array;
            _this.generatedEvent = true;
            // Render node
            _this._renderGroup();
            // Properties
            _this._event = new PlannerEvent('Group event', null, null, _this, type, colour);
            return _this;
        }
        PlannerGroup.prototype._renderGroup = function () {
            var _this = this;
            this._resourceColumn = document.createElement('div');
            this._resourceColumn.classList.add('rp-content-resource');
            this._resourceRow.appendChild(this._resourceColumn);
            this._eventColumn = document.createElement('div');
            this._eventColumn.classList.add('rp-content-event');
            this._eventRow.appendChild(this._eventColumn);
            var leftNode = this._resourceRow.querySelector('div:first-child');
            leftNode.insertAdjacentHTML('afterbegin', '<div class=\'rp-group-icon\'></div>');
            leftNode.style['cursor'] = 'pointer';
            leftNode.addEventListener('click', function (e) { return _this.toggle(); });
            leftNode.setAttribute('title', 'Expand');
        };
        PlannerGroup.prototype.toggle = function (state) {
            state = state != null ? state : !this._resourceRow.classList.contains('rp-show');
            this._toggled = state;
            this._resourceRow.classList.toggle('rp-show', state);
            this._eventRow.classList.toggle('rp-show', state);
            this._resourceRow.querySelector('div:first-child').setAttribute('title', (state ? 'Collapse' : 'Expand'));
        };
        PlannerGroup.toggleAll = function (groups, state) {
            for (var _i = 0, groups_1 = groups; _i < groups_1.length; _i++) {
                var group = groups_1[_i];
                group.toggle(state);
            }
        };
        PlannerGroup.prototype.generateEvent = function () {
            // Find smallest and largest events
            var events = new Array;
            this.resources().forEach(function (resource) { return events = events.concat(resource.events); });
            this.groups().forEach(function (group) { return events = events.concat(group.groupEvent); });
            events = events.filter(function (event) { return event.startDate || event.endDate; });
            var startEvent = events.sort(function (a, b) { return a.visualStartDate.valueOf() - b.visualStartDate.valueOf(); })[0];
            var endEvent = events.sort(function (a, b) { return b.visualEndDate.valueOf() - a.visualEndDate.valueOf(); })[0];
            // Set dates
            if (startEvent && endEvent) {
                this._event.setDates(startEvent.visualStartDate, endEvent.visualEndDate);
                if (!startEvent.startDate)
                    this._event.node.classList.add('rp-datebar-nostart');
                if (!endEvent.endDate)
                    this._event.node.classList.add('rp-datebar-noend');
                if (this.parent instanceof PlannerGroup)
                    this.parent.generateEvent();
            }
            return this._event;
        };
        PlannerGroup.prototype.resources = function () { return this._resources.filter(function (obj) { return obj instanceof PlannerResource; }); };
        PlannerGroup.prototype.searchResource = function (id) { return this.resources().filter(function (obj) { return obj.id === id; })[0]; };
        PlannerGroup.prototype.addResource = function (id, name, description) {
            var exists = this.searchResource(id);
            if (!exists) {
                exists = new PlannerResource(id, name, this, description);
                this._resourceColumn.appendChild(exists.resourceRow);
                this._eventColumn.appendChild(exists.eventRow);
                this._resources.push(exists);
            }
            exists.name = name ? name : exists.name;
            exists.description = description ? description : exists.description;
            return exists;
        };
        PlannerGroup.prototype.removeResource = function (id) {
            var resource = this.searchResource(id);
            if (resource) {
                resource.eventRow.remove();
                resource.resourceRow.remove();
                this._resources = this._resources.filter(function (obj) { return obj.id != id && obj instanceof PlannerResource; });
            }
        };
        PlannerGroup.prototype.groups = function () { return this._resources.filter(function (obj) { return obj instanceof PlannerGroup; }); };
        PlannerGroup.prototype.searchGroup = function (id) { return this.groups().filter(function (obj) { return obj.id === id; })[0]; };
        PlannerGroup.prototype.addGroup = function (id, name, description, type, colour) {
            var exists = this.searchGroup(id);
            if (!exists) {
                exists = new PlannerGroup(id, name, this, description, type, colour);
                var previousGroup = this._previousGroups.filter(function (group) { return group.id == exists.id; })[0];
                if (previousGroup) {
                    exists.previousGroups = previousGroup.groups();
                    exists.toggle(previousGroup.toggled);
                }
                this._resourceColumn.appendChild(exists.resourceRow);
                this._eventColumn.appendChild(exists.eventRow);
                this._resources.push(exists);
            }
            exists.name = name ? name : exists.name;
            exists.description = description ? description : exists.description;
            exists.groupEvent.type = type ? type : exists.groupEvent.type;
            exists.groupEvent.colour = colour ? colour : exists.groupEvent.colour;
            return exists;
        };
        PlannerGroup.prototype.removeGroup = function (id) {
            var group = this.searchGroup(id);
            if (group) {
                group.eventRow.remove();
                group.resourceRow.remove();
                this._resources = this._resources.filter(function (obj) { return obj.id != id && obj instanceof PlannerGroup; });
            }
        };
        PlannerGroup.prototype.reorder = function () {
            this._resources = this._resources.sort(function (a, b) { return a.order - b.order; });
        };
        Object.defineProperty(PlannerGroup.prototype, "toggled", {
            get: function () { return this._toggled; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerGroup.prototype, "groupEvent", {
            get: function () { return this._event; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerGroup.prototype, "previousGroups", {
            set: function (groups) { this._previousGroups = groups; },
            enumerable: true,
            configurable: true
        });
        return PlannerGroup;
    }(PlannerResource));
    var PlannerEvent = /** @class */ (function () {
        function PlannerEvent(id, startDate, endDate, resource, type, colour) {
            this._position = 0;
            this.eventListeners = new Array;
            // Render node
            this._renderEvent();
            // Properties
            this._id = id;
            this._resource = resource;
            this.colour = colour;
            this.type = type;
            this.setDates(startDate, endDate);
            // Append to resource node
            this._resource.eventRow.firstElementChild.appendChild(this._node);
        }
        PlannerEvent.prototype.addEventListener = function (type, callback) {
            var exists = this.eventListeners.filter(function (event) { return event.type == type && event.callback == callback; })[0];
            if (!exists) {
                exists = { type: type, callback: callback };
                this.eventListeners.push(exists);
                this._node.addEventListener(type, callback);
            }
            return exists;
        };
        PlannerEvent.prototype.removeEventListeners = function () {
            var _this = this;
            this.eventListeners.forEach(function (listener, index) {
                _this._node.removeEventListener(listener.type, listener.callback);
            });
        };
        PlannerEvent.prototype._renderEvent = function () {
            this._node = document.createElement('div');
            this._node.classList.add('rp-datebar');
            this._node.style['marginTop'] = this._position * PlannerEvent.height + "px";
            this._node.style['height'] = PlannerEvent.height + "px";
            this._node.innerHTML = "\n            <div id='title' class='rp-datebar-label'></div>\n        ";
        };
        PlannerEvent.prototype.render = function () {
            if ((this._resource.planner.dateFrom.valueOf() > this.visualEndDate.valueOf() && this._resource.planner.dateFrom.valueOf() > this.visualStartDate.valueOf()) ||
                (this._resource.planner.dateTo.valueOf() < this.visualStartDate.valueOf() && this._resource.planner.dateTo.valueOf() < this.visualEndDate.valueOf()) ||
                (this.visualStartDate.valueOf() > this.visualEndDate.valueOf())) {
                this._node.style['display'] = 'none';
            }
            else {
                this._node.style['display'] = 'flex';
                var node = this._node.querySelector('#title');
                node.innerText = this.title;
                this._node.setAttribute('title', this.title);
                this._node.style['marginLeft'] = this._generateMargin();
                this._node.style['width'] = this._generateWidth();
                this._node.classList.remove('rp-datebar-nostart', 'rp-datebar-noend');
                if (!this._startDate)
                    this._node.classList.add('rp-datebar-nostart');
                if (!this._endDate)
                    this._node.classList.add('rp-datebar-noend');
            }
        };
        PlannerEvent.prototype._generateWidth = function () {
            // If event sits between 'From' query
            if (this.visualStartDate <= this._resource.planner.dateFrom && (this.visualEndDate >= this._resource.planner.dateFrom && this.visualEndDate <= this._resource.planner.dateTo))
                return ((this._resource.planner.dateFrom.daysBetween(this.visualEndDate) + 1) / this._resource.planner.daysBetween * 100) + '%';
            // If event sits between 'To' query
            else if ((this.visualStartDate <= this._resource.planner.dateTo && this.visualStartDate >= this._resource.planner.dateFrom) && this.visualEndDate >= this._resource.planner.dateTo)
                return ((this.visualStartDate.daysBetween(this._resource.planner.dateTo) + 1) / this._resource.planner.daysBetween * 100) + '%';
            // If event sits over the query
            else if (this.visualStartDate <= this._resource.planner.dateFrom && this.visualEndDate >= this._resource.planner.dateTo)
                return '100%';
            // Standard return
            return ((this.visualStartDate.daysBetween(this.visualEndDate) + 1) / this._resource.planner.daysBetween * 100) + '%';
        };
        PlannerEvent.prototype._generateMargin = function () {
            return this.visualStartDate > this._resource.planner.dateFrom ? (this._resource.planner.dateFrom.daysBetween(this.visualStartDate) / this._resource.planner.daysBetween * 100) + '%' : '0%';
        };
        Object.defineProperty(PlannerEvent.prototype, "id", {
            get: function () { return this._id; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerEvent.prototype, "startDate", {
            get: function () { return this._startDate ? new Date(this._startDate.valueOf()) : null; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerEvent.prototype, "endDate", {
            get: function () { return this._endDate ? new Date(this._endDate.valueOf()) : null; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerEvent.prototype, "resource", {
            get: function () { return this._resource; },
            set: function (resource) { this._resource = resource; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerEvent.prototype, "type", {
            get: function () { return this._type; },
            set: function (type) {
                // Properties
                this._type = type != '' ? type : null;
                // HTML node
                var node = this._node.querySelector('#title');
                if (node) {
                    node.innerText = this.title;
                    this._node.setAttribute('title', this.title);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerEvent.prototype, "position", {
            get: function () { return this._position; },
            set: function (position) {
                this._position = position;
                this._node.style['marginTop'] = this._position * PlannerEvent.height + "px";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerEvent.prototype, "node", {
            get: function () { return this._node; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerEvent.prototype, "label", {
            get: function () {
                if (!this._startDate && !this._endDate)
                    return '';
                return "(" + (this._startDate != null ? this._startDate.toLocaleDateString('en-GB') : this.visualStartDate.toLocaleDateString('en-GB') + "?") + " - " + (this._endDate != null ? this._endDate.toLocaleDateString('en-GB') : this.visualEndDate.toLocaleDateString('en-GB') + "?") + ")";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerEvent.prototype, "title", {
            get: function () { return "" + (this.type ? this.type + " " : '') + this.label; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerEvent.prototype, "visualStartDate", {
            get: function () {
                var today = new Date().flatten();
                var noStart = !this._startDate;
                var noEnd = !this._endDate;
                if (noStart && noEnd)
                    return null;
                return !noStart ? this._startDate : this._endDate.valueOf() > today.valueOf() ? today : this._endDate;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlannerEvent.prototype, "visualEndDate", {
            get: function () {
                var today = new Date().flatten();
                var noStart = !this._startDate;
                var noEnd = !this._endDate;
                if (noStart && noEnd)
                    return null;
                return !noEnd ? this._endDate : this._startDate.valueOf() < today.valueOf() ? today : this._startDate;
            },
            enumerable: true,
            configurable: true
        });
        PlannerEvent.prototype.setDates = function (startDate, endDate) {
            if ((startDate instanceof Date || startDate == null) && (endDate instanceof Date || endDate == null)) {
                // Properties
                this._startDate = startDate ? startDate.flatten() : null;
                this._endDate = endDate ? endDate.flatten() : null;
                // Date management
                var today = new Date().flatten();
                var startDate = (this._startDate ? this._startDate : (this._endDate ? (this._endDate.valueOf() > today.valueOf() ? today : this._endDate) : null));
                var endDate = (this._endDate ? this._endDate : (this._startDate ? (this._startDate.valueOf() < today.valueOf() ? today : this._startDate) : null));
                // HTML node
                if (startDate && endDate) {
                    this.render();
                }
                else {
                    this._node.style['display'] = 'none';
                }
            }
            this._resource.setPositions();
            if (this._resource.parent instanceof PlannerGroup && this._resource.parent.generatedEvent)
                this._resource.parent.generateEvent();
            return this;
        };
        Object.defineProperty(PlannerEvent.prototype, "colour", {
            set: function (colour) {
                if (colour != null) {
                    this._colour = colour;
                    this._node.style['backgroundColor'] = this._colour;
                }
            },
            enumerable: true,
            configurable: true
        });
        PlannerEvent.height = 42;
        PlannerEvent.defaultColour = '#34B78F';
        return PlannerEvent;
    }());
    var ResourcePlanner = /** @class */ (function () {
        function ResourcePlanner(node, dateFrom, dateTo, title, description) {
            this._resourceColumnName = 'Row title';
            this._resourceColumnPercent = 0.3;
            // Relationships
            this._resources = new Array;
            this._previousGroups = new Array;
            // Initialise the variables
            this._title = title;
            this._description = description;
            this._node = document.createElement('div');
            this._node.classList.add('rp-main');
            this._controlNode = document.createElement('div');
            this._controlNode.classList.add('rp-main-control');
            this._parentNode = node;
            this._parentNode.appendChild(this._node);
            this._parentNode.appendChild(this._controlNode);
            this._parentNode.classList.add('rp-main-wrapper');
            this.setDates(dateFrom, dateTo);
            this.render();
        }
        ResourcePlanner.prototype._generateDateLabels = function (wText) {
            if (wText === void 0) { wText = true; }
            var render = '';
            var loopDate = new Date(this._dateFrom.getTime());
            var today = new Date().flatten();
            for (var i = 0; i < this.daysBetween; i++) {
                var dayClass = loopDate.valueOf() == today.valueOf() ? 'rp-label-today' : loopDate.getDay() == 6 || loopDate.getDay() == 0 ? 'rp-label-weekend' : '';
                render += "\n      <div class='rp-label rp-label-subtitle rp-date " + dayClass + "' \n        style='width: " + this.datePercent * 100 + "%; text-align: center;'\n        title='" + loopDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + "'\n      >\n        " + (wText ? loopDate.getDate() : '') + "\n      </div>\n      ";
                loopDate = loopDate.addDays(1);
            }
            return render;
        };
        ResourcePlanner.prototype._generateMonthLabels = function () {
            var render = '';
            var loopDate = new Date(this._dateFrom.getTime());
            loopDate.setDate(1);
            var monthPercentage = 0;
            for (var i = 0; i < this.monthsBetween; i++) {
                var monthEnd = new Date(loopDate.getFullYear(), loopDate.getMonth() + 1, 0);
                if (this._dateFrom.getMonth() == loopDate.getMonth() && this._dateFrom.getFullYear() == loopDate.getFullYear())
                    monthPercentage = (this._dateFrom.daysBetween(monthEnd) + 1) / this.daysBetween;
                else if (this._dateTo.getMonth() == loopDate.getMonth() && this._dateTo.getFullYear() == loopDate.getFullYear())
                    monthPercentage = (loopDate.daysBetween(this._dateTo) + 1) / this.daysBetween;
                else
                    monthPercentage = (loopDate.daysBetween(monthEnd) + 1) / this.daysBetween;
                render += "\n      <div class='rp-heading rp-month' style='width: " + monthPercentage * 100 + "%;' title='" + months[loopDate.getMonth()] + " " + loopDate.getFullYear() + "'>\n        <h3 class='rp-label rp-label-heading'>" + months[loopDate.getMonth()] + "</h3>\n        <div class='rp-label rp-label-small'>" + loopDate.getFullYear() + "</div>\n      </div>\n      ";
                loopDate = loopDate.addMonths(1);
            }
            return render;
        };
        ResourcePlanner.prototype.resources = function () { return this._resources.filter(function (obj) { return obj instanceof PlannerResource; }); };
        ResourcePlanner.prototype.searchResource = function (id) { return this.resources().filter(function (obj) { return obj.id === id; })[0]; };
        ResourcePlanner.prototype.addResource = function (id, name, description) {
            var exists = this.searchResource(id);
            if (!exists) {
                exists = new PlannerResource(id, name, this, description);
                this._resourceColumn.appendChild(exists.resourceRow);
                this._eventColumn.appendChild(exists.eventRow);
                this._resources.push(exists);
            }
            exists.name = name ? name : exists.name;
            exists.description = description ? description : exists.description;
            return exists;
        };
        ResourcePlanner.prototype.removeResource = function (id) {
            var resource = this.searchResource(id);
            if (resource) {
                resource.eventRow.remove();
                resource.resourceRow.remove();
                this._resources = this._resources.filter(function (obj) { return obj.id != id && obj instanceof PlannerResource; });
            }
        };
        ResourcePlanner.prototype.allResources = function () {
            var list = this.resources();
            var groups = ResourcePlanner.allGroups(this);
            for (var _i = 0, groups_2 = groups; _i < groups_2.length; _i++) {
                var group = groups_2[_i];
                var children = group.resources();
                list = list.concat(children);
            }
            return list;
        };
        ResourcePlanner.prototype.groups = function () { return this._resources.filter(function (obj) { return obj instanceof PlannerGroup; }); };
        ResourcePlanner.prototype.searchGroup = function (id) { return this.groups().filter(function (obj) { return obj.id === id; })[0]; };
        ResourcePlanner.prototype.addGroup = function (id, name, description, type, colour) {
            var exists = this.searchGroup(id);
            if (!exists) {
                exists = new PlannerGroup(id, name, this, description, type, colour);
                var previousGroup = this._previousGroups.filter(function (group) { return group.id == exists.id; })[0];
                if (previousGroup) {
                    exists.previousGroups = previousGroup.groups();
                    exists.toggle(previousGroup.toggled);
                }
                this._resourceColumn.appendChild(exists.resourceRow);
                this._eventColumn.appendChild(exists.eventRow);
                this._resources.push(exists);
            }
            exists.name = name ? name : exists.name;
            exists.description = description ? description : exists.description;
            exists.groupEvent.type = type ? type : exists.groupEvent.type;
            exists.groupEvent.colour = colour ? colour : exists.groupEvent.colour;
            return exists;
        };
        ResourcePlanner.prototype.removeGroup = function (id) {
            var group = this.searchGroup(id);
            if (group) {
                group.eventRow.remove();
                group.resourceRow.remove();
                this._resources = this._resources.filter(function (obj) { return obj.id != id && obj instanceof PlannerGroup; });
            }
        };
        ResourcePlanner.allGroups = function (planner) {
            var list = planner.groups();
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var group = list_1[_i];
                var children = ResourcePlanner.allGroups(group);
                list = list.concat(children);
            }
            return list;
        };
        ResourcePlanner.prototype.reorder = function () {
            this._resources = this._resources.sort(function (a, b) { return a.order - b.order; });
        };
        ResourcePlanner.prototype.render = function () {
            var _this = this;
            this.dispose();
            // Render initial table
            this._node.insertAdjacentHTML('afterbegin', "\n    <div class='rp-col rp-resources' style='width: " + this.resourceColumnPercent * 100 + "%;'>\n      <div class='rp-wrapper'>\n        <div class='rp-sticky'>\n          <div class='rp-row rp-row-spaced'>\n            <div class='rp-heading'>\n              <h3 class='rp-label rp-label-heading' title='" + this._title + "'>" + this._title + "</h3>\n              <div class='rp-label rp-label-small' title='" + this._description + "'>" + this._description + "</div>\n            </div>\n          </div>\n          <div class='rp-row rp-row-spaced'>\n            <div class='rp-label rp-label-subtitle' title='" + this._resourceColumnName + "'>" + (this._resourceColumnHTML ? this._resourceColumnHTML : this._resourceColumnName) + ":</div>\n            <div class='rp-btn-group'>\n              <button id='rp-hideAll' class='btn rp-btn' title='Hide all'>Hide all</button>\n              <button id='rp-showAll' class='btn rp-btn' title='Show all'>Show all</button>\n            </div>\n          </div>\n        </div>\n        <div class='rp-content-resource'>\n\n        </div>\n      </div>\n    </div>\n    <div class='rp-col rp-events' style='width: " + this.eventColumnPercent * 100 + "%'>\n      <div class='rp-wrapper' style='width: " + this.zoomPercent * 100 + "%'>\n        <div class='rp-sticky'>\n          <div class='rp-row rp-row-spaced rp-row-label'>\n            " + this._generateMonthLabels() + "\n          </div>\n          <div class='rp-row rp-row-center rp-row-label'>\n            " + this._generateDateLabels() + "\n          </div>\n        </div>\n        <div class='rp-content-event'>\n          <div class='rp-row'>\n            " + this._generateDateLabels(false) + "\n          </div>\n        </div>\n      </div>\n    </div>\n    ");
            this._controlNode.insertAdjacentHTML('beforeend', "\n    <div class='rp-btn-group'>\n      <button id='rp-zoomout' class='btn rp-btn' title='Zoom out'>-</button>\n      <button id='rp-reset' class='btn rp-btn' title='Reset'>" + this.zoomPercent * 100 + "%</button>\n      <button id='rp-zoomin' class='btn rp-btn' title='Zoom in'>+</button>\n    </div>\n    ");
            // Set properties
            this._eventColumn = this._node.querySelector('.rp-content-event');
            this._resourceColumn = this._node.querySelector('.rp-content-resource');
            // Event zooming
            var zoomin = this._controlNode.querySelector('#rp-zoomin');
            var zoomout = this._controlNode.querySelector('#rp-zoomout');
            zoomin.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                _this.zoomPercent = _this.zoomPercent + 0.5;
            });
            zoomout.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                _this.zoomPercent = _this.zoomPercent - 0.5;
            });
            // Event zoom reset 
            var zoomreset = this._controlNode.querySelector('#rp-reset');
            zoomreset.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                _this.zoomPercent = 0;
            });
            // Hide all
            var hideAll = this._node.querySelector('#rp-hideAll');
            hideAll.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                PlannerGroup.toggleAll(ResourcePlanner.allGroups(_this), false);
            });
            // Show all
            var showAll = this._node.querySelector('#rp-showAll');
            showAll.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                PlannerGroup.toggleAll(ResourcePlanner.allGroups(_this), true);
            });
            // Render column resizer
            this._resizerNode = document.createElement('div');
            this._resizerNode.classList.add('rp-resizer');
            this._node.querySelector('div.rp-resources > .rp-wrapper').appendChild(this._resizerNode);
            // Define events
            var downEvent = function (e) {
                _this._node.style['cursor'] = 'col-resize';
                window.addEventListener('mouseup', upEvent);
                window.addEventListener('mousemove', dragEvent);
            };
            var dragEvent = function (e) {
                // Calculate mouse percentage
                var mouseLeft = e.clientX - _this._node.getBoundingClientRect().left;
                var percentage = mouseLeft / _this._node.clientWidth;
                _this.resourceColumnPercent = percentage;
            };
            var upEvent = function (e) {
                _this._node.style['cursor'] = null;
                // Remove event
                window.removeEventListener('mousemove', dragEvent);
                // Change sticky points
                var resourcesCol = _this._node.querySelector('.rp-resources');
                _this._node.querySelectorAll('.rp-datebar-label').forEach(function (ele) {
                    ele.style['left'] = "calc(" + _this.resourceColumnPercent * 100 + "% + 5px)";
                });
            };
            // Add event
            this._resizerNode.addEventListener('mousedown', downEvent);
        };
        ResourcePlanner.prototype.dispose = function () {
            this._node.innerHTML = '';
            this._controlNode.innerHTML = '';
            this._previousGroups = this._resources.filter(function (obj) { return obj instanceof PlannerGroup; });
            delete this._resources;
            this._resources = new Array;
        };
        Object.defineProperty(ResourcePlanner.prototype, "dateFrom", {
            get: function () { return new Date(this._dateFrom.valueOf()); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ResourcePlanner.prototype, "dateTo", {
            get: function () { return new Date(this._dateTo.valueOf()); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ResourcePlanner.prototype, "daysBetween", {
            get: function () { return this._dateFrom.daysBetween(this._dateTo) + 1; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ResourcePlanner.prototype, "monthsBetween", {
            get: function () { return this._dateFrom.monthsBetween(this._dateTo) + 1; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ResourcePlanner.prototype, "resourceColumnName", {
            get: function () { return this._resourceColumnName; },
            set: function (name) { this._resourceColumnName = name ? name : this._resourceColumnName; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ResourcePlanner.prototype, "resourceColumnHTML", {
            get: function () { return this._resourceColumnHTML; },
            set: function (HTML) { this._resourceColumnHTML = HTML ? HTML : this._resourceColumnHTML; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ResourcePlanner.prototype, "resourceColumnPercent", {
            get: function () { return this._resourceColumnPercent; },
            set: function (percentage) {
                // Drag limit
                var threshold = 0.15;
                var hideThreshold = 0.1;
                // Nodes effected
                var leftNode = this._node.querySelector('div.rp-col.rp-resources');
                var rightNode = this._node.querySelector('div.rp-col.rp-events');
                // Drag limit logic
                if (percentage > threshold && percentage < (1 - threshold)) {
                    this._resourceColumnPercent = percentage;
                    var percentageLeft = (percentage) * 100;
                    var percentageRight = 100 - percentageLeft;
                    this._resizerNode.style['right'] = null;
                    if (leftNode && rightNode) {
                        leftNode.style['width'] = percentageLeft + "%";
                        rightNode.style['width'] = percentageRight + "%";
                    }
                }
                // Drag collapse logic
                else if (percentage < hideThreshold) {
                    this._resourceColumnPercent = 0;
                    this._resizerNode.style['right'] = '-10px';
                    if (leftNode && rightNode) {
                        leftNode.style['width'] = '0%';
                        rightNode.style['width'] = '100%';
                    }
                }
                // Drag open logic
                else if (percentage > hideThreshold) {
                    this._resourceColumnPercent = threshold;
                    var percentageLeft = (threshold) * 100;
                    var percentageRight = 100 - percentageLeft;
                    this._resizerNode.style['right'] = null;
                    if (leftNode && rightNode) {
                        leftNode.style['width'] = percentageLeft + "%";
                        rightNode.style['width'] = percentageRight + "%";
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ResourcePlanner.prototype, "eventColumnPercent", {
            get: function () { return 1 - this._resourceColumnPercent; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ResourcePlanner.prototype, "datePercent", {
            get: function () { return 1 / this.daysBetween; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ResourcePlanner.prototype, "zoomPercent", {
            get: function () { return this._zoomPercent; },
            set: function (percentage) {
                // Default
                if (percentage == 0)
                    percentage = Math.floor(this.daysBetween / 30) + 1;
                // Above 100%
                if (percentage >= 1) {
                    this._zoomPercent = percentage;
                    var eventsWrapper = this._node.querySelector('div.rp-col.rp-events > div.rp-wrapper');
                    var resetBtn = this._controlNode.querySelector('#rp-reset');
                    if (eventsWrapper && resetBtn) {
                        eventsWrapper.style['width'] = this._zoomPercent * 100 + "%";
                        resetBtn.innerText = this._zoomPercent * 100 + "%";
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        ResourcePlanner.prototype.setDates = function (startDate, endDate) {
            var newStartDate = startDate.flatten();
            var newEndDate = endDate.flatten();
            if (!this._dateFrom || !this._dateTo || newStartDate.valueOf() !== this._dateFrom.valueOf() || newEndDate.valueOf() !== this._dateTo.valueOf()) {
                this._dateFrom = newStartDate;
                this._dateTo = newEndDate;
                this.zoomPercent = 0;
                return true;
            }
            else
                return false;
        };
        return ResourcePlanner;
    }());
    exports.ResourcePlanner = ResourcePlanner;
});
//# sourceMappingURL=Planner.js.map