define([
  'ResourcePlanner/lib/Planner',
  'dojo/_base/declare',
  'mxui/widget/_WidgetBase',
  'mendix/lib/MxContext',
  'dojo/_base/lang',
], function (planner, declare, _WidgetBase, MxContext, lang) {
  'use strict';

  var ResourcePlanner = planner.ResourcePlanner;

  return declare('ResourcePlanner.widget.ResourcePlanner', [_WidgetBase], {
    // Internal variables
    _handles: null,
    _contextObj: null,
    obj_dateFrom: null,
    obj_dateTo: null,

    // Search source
    search_dateFrom: null,
    search_dateTo: null,
    search_dateFilter: null,
    search_dynXpath: null,
    search_statXpath: null,

    // Date bar source
    event: null,
    event_startDate: null,
    event_endDate: null,
    event_type: null,
    event_colour: null,
    event_form: null,
    event_form_location: null,

    // Person source
    resource_column_title: null,
    resource_name: null,
    resource_description: null,
    resource_sortBy: null,
    resource_form: null,
    resource_form_location: null,
    resource_icon: null,
    resource_uniqueName: null,
    resource_startButton: null,
    resource_buttons: null,

    // Group
    groups: null,

    // Planner
    plannerTitle: null,
    plannerDescription: null,

    // Global variables
    planner: null,
    subscribed: new Array(),

    _dataGet: function (guid) {
      return new Promise(function (resolve, reject) {
        mx.data.get({
          guid: guid,
          callback: function (data) {
            resolve(data);
          }
        });
      })
    },

    _getString: function (mxObject, attribute) {
      var string = null;
      if (mxObject instanceof Object) {
        string = mxObject.get(attribute);
        string = mxObject.isEnum(attribute)
          ? mxObject.getEnumCaption(attribute, string)
          : string;
      }
      return string;
    },

    _fetchString: function (mxObject, attribute) {
      var context = this;
      return new Promise((resolve, reject) => {
        context._fetch(mxObject, attribute).then((returnObj) => {
          var path = context._splitPath(attribute);
          var obj = new Object();
          obj.string = context._getString(returnObj, path.attribute);
          obj.object = returnObj;
          resolve(obj);
        });
      });
    },

    _fetch: function (mxObject, attribute) {
      var context = this;
      return new Promise((resolve, reject) => {
        var path = context._splitPath(attribute);
        if (path.attribute == null || path.attribute == '')
          resolve(null);
        else {
          if (path.path == null || path.path == '') resolve(mxObject);
          else
            mxObject.fetch(path.path, (result) => {
              resolve(result);
            });
        }
      });
    },

    _splitPath: function (string_path) {
      if (string_path == '' || string_path == null)
        return { path: null, attribute: null };
      var obj = new Object();
      obj.path = string_path.split('/');
      obj.attribute = obj.path.pop();
      obj.path = obj.path.join('/');
      return obj;
    },

    _showPage: function (entity, guid, page, pageLocation) {
      var entityContext = new MxContext();
      entityContext.setContext(entity, guid);
      mx.ui.openForm(page, {
        location: pageLocation,
        context: entityContext,
      });
    },

    _addOpenPage: function (node, entity, guid, page, pageLocation) {
      var context = this;
      var showPage = function (e) {
        e.preventDefault();
        e.stopPropagation();
        context._showPage(entity, guid, page, pageLocation);
      }
      node.addEventListener('click', showPage);
      node.style['cursor'] = 'pointer';
    },

    _displayTemplate: function (node, entity, guid, page) {
      var entityContext = new MxContext();
      entityContext.setContext(entity, guid);
      mx.ui.openForm(page, {
        location: 'content',
        context: entityContext,
        domNode: node,
      });
    },

    fetchData: async function (mxObject_event) {
      var context = this;
      var event = new Object();
      var resource = new Object();
      var groups = new Array();

      if (mxObject_event != null && mxObject_event instanceof Object) {
        event.object = mxObject_event;
        // Resource name
        var fetchResoure_name = await context._fetchString(mxObject_event, context.resource_name);
        resource.object = fetchResoure_name.object;
        resource.name = fetchResoure_name.string;
        resource.id = context.resource_uniqueName ? resource.object.getGuid() : resource.name
        // Resource description
        var fetchResoure_description = await context._fetchString(
          mxObject_event,
          context.resource_description
        );
        resource.description = fetchResoure_description.string ? fetchResoure_description.string : context.resource_description_default;
        // Resource colour
        var fetchResource_colour = await context._fetchString(mxObject_event, context.resource_colour);
        resource.rowColour = fetchResource_colour.string;

        // Subscribe resource changes
        if (resource.object && !context.subscribed.find((obj) => obj.id == resource.object.getGuid())) {
          var subscription = {
            id: resource.object.getGuid(),
            subscription: mx.data.subscribe({
              guid: resource.object.getGuid(),
              callback: async function (guid) {
                var resourceExists = await context._dataGet(guid);
                var resourceRow = context.planner.allResources().filter(row => row.id == resource.object.getGuid())[0];
                // Resource exists, keep it
                if (resourceExists) {
                  var eventExists = await context._dataGet(event.object.getGuid());
                  var data = await context.fetchData(eventExists);
                  if (data) context.renderData(data);
                }
                // Resource doesn't exist, remove it
                else {
                  resourceRow.parent.removeResource(resource.object.getGuid());
                  var subedResource = context.subscribed.filter(sub => sub.id == resource.object.getGuid())[0];
                  mx.data.unsubscribe(subedResource.subscription);
                }
              }
            })
          }
          context.subscribed.push(subscription);
        }

        for (var index = 0; index < context.groups.length; index++) {
          var group = context.groups[index];
          var grouping = new Object();
          // Group name
          var fetch_groupName = await context._fetchString(mxObject_event, group.group_name);
          grouping.object = fetch_groupName.object;
          grouping.name = fetch_groupName.string;
          // Group description
          var fetch_groupDescription = await context._fetchString(mxObject_event, group.group_description);
          grouping.description = fetch_groupDescription.string ? fetch_groupDescription.string : group.group_description_default;
          // Resource colour
          var fetch_groupRowColour = await context._fetchString(mxObject_event, group.group_resource_colour);
          grouping.rowColour = fetch_groupRowColour.string;
          // Group type
          var fetch_groupType = await context._fetchString(mxObject_event, group.group_type);
          grouping.type = fetch_groupType.string && fetch_groupType.string != '' ? fetch_groupType.string : group.group_type_default;
          // Group colour
          var fetch_groupColour = await context._fetchString(mxObject_event, group.group_colour);
          grouping.colour = fetch_groupColour.string;
          // Event start date
          var fetch_groupStartDate = await context._fetchString(mxObject_event, group.group_startDate);
          grouping.startDate = fetch_groupStartDate.string != '' && fetch_groupStartDate.string != null ? new Date(fetch_groupStartDate.string) : null;
          // Event end date
          var fetch_groupEndDate = await context._fetchString(mxObject_event, group.group_endDate);
          grouping.endDate = fetch_groupEndDate.string != '' && fetch_groupEndDate.string != null ? new Date(fetch_groupEndDate.string) : null;
          // Group form
          grouping.resource_form = group.group_resource_form;
          grouping.resource_form_location = group.group_resource_form_location;
          grouping.event_form = group.group_event_form;
          grouping.event_form_location = group.group_event_form_location;
          grouping.icon = group.group_icon;
          grouping.generateDate = group.group_generateDate;
          grouping.uniqueName = group.group_uniqueName;
          grouping.startButton = group.group_startButton;
          grouping.id = grouping.uniqueName ? grouping.object.getGuid() : grouping.name;
          groups[index] = grouping;

          // Subscribe group changes
          if (grouping.object && !context.subscribed.find((obj) => obj.id == grouping.object.getGuid())) {
            var subscription = {
              id: grouping.object.getGuid(),
              subscription: mx.data.subscribe({
                guid: grouping.object.getGuid(),
                callback: async function (guid) {
                  var groupExists = await context._dataGet(guid);
                  var groupRow = ResourcePlanner.allGroups(context.planner).filter(row => row.id == grouping.object.getGuid())[0];
                  // Group exists, keep it
                  if (groupExists) {
                    var eventExists = await context._dataGet(event.object.getGuid());
                    var data = await context.fetchData(eventExists);
                    if (data) context.renderData(data);
                  }
                  // Group doesn't exist, remove it
                  else {
                    groupRow.parent.removeGroup(grouping.object.getGuid());
                    var subedGroup = context.subscribed.filter(sub => sub.id == grouping.object.getGuid())[0];
                    mx.data.unsubscribe(subedGroup.subscription);
                  }
                }
              })
            }
            context.subscribed.push(subscription);
          }
        }
        // Event start date
        var fetch_eventStartDate = await context._fetchString(mxObject_event, context.event_startDate);
        event.startDate = fetch_eventStartDate.string != '' && fetch_eventStartDate != null ? new Date(fetch_eventStartDate.string) : null;
        // Event end date
        var fetch_eventEndDate = await context._fetchString(mxObject_event, context.event_endDate);
        event.endDate = fetch_eventEndDate.string != '' && fetch_eventEndDate != null ? new Date(fetch_eventEndDate.string) : null;
        // Event colour
        var fetchEvent_colour = await context._fetchString(mxObject_event, context.event_colour);
        event.colour = fetchEvent_colour.string;
        // Event type
        var fetchEvent_type = await context._fetchString(mxObject_event, context.event_type);
        event.type = fetchEvent_type.string;
        // Subscribe event changes
        if (event.object && !context.subscribed.find((obj) => obj.id == event.object.getGuid())) {
          var subscription = {
            id: event.object.getGuid(),
            subscription: mx.data.subscribe({
              guid: event.object.getGuid(),
              callback: async function (guid) {
                var eventExists = await context._dataGet(guid);
                // Data exists, re-render event
                if (eventExists) {
                  var data = await context.fetchData(eventExists);
                  if (data) context.renderData(data);
                }
                // Data doesn't exists, remove event
                else {
                  var resourceExists = await context._dataGet(resource.object.getGuid());
                  var resourceRow = context.planner.allResources().filter(row => row.id == resource.object.getGuid())[0];
                  var subedEvent = context.subscribed.filter(sub => sub.id == event.object.getGuid())[0];
                  mx.data.unsubscribe(subedEvent.subscription);
                  // Resource exists, keep it
                  if (resourceExists) {
                    resourceRow.removeEvent(event.object.getGuid());
                  }
                  // Resource doesn't exist, remove it
                  else {
                    resourceRow.parent.removeResource(resource.object.getGuid());
                    var subedResource = context.subscribed.filter(sub => sub.id == resource.object.getGuid())[0];
                    mx.data.unsubscribe(subedResource.subscription);
                  }
                }
              }
            })
          }
          context.subscribed.push(subscription);
        }
        // Create data object
        var data = {
          event: event,
          resource: resource,
          groups: groups,
        };
        return data;
      }
      return null;
    },
    
    renderData: function (data, resetOrder = false) {
      var context = this;

      if (data && data instanceof Object) {
        var groups = data.groups;
        var resource = data.resource;
        var event = data.event;

        var objContext = context.planner;

        for (var index = 0; index < groups.length; index++) {
          var group = groups[index];
          // Decide whether to use group or planner
          if (group.name) {
            objContext = objContext.addGroup(
              group.id,
              group.name,
              group.description,
              group.type,
              group.colour
            );
            if (resetOrder) objContext.order = 10000;
            objContext.colour = group.rowColour;
            if (!group.generateDate) {
              objContext.groupEvent.setDates(group.startDate, group.endDate);
              objContext.generatedEvent = false;
            }
            // Add group buttons
            if (context.group_buttons) {
              for (var btn of objContext.buttons) {
                objContext.removeButton(btn.id);
              }
              let btnIndex = 0;
              let action = null;
              for (var conf of context.group_buttons) {
                (function (config) {
                  // Check button is for the group (by index)
                  if (config.action_index == index) {
                    // Setup microflow action
                    if (config.action_type === 'microflow') action = function (button) {
                      context._execMf(config.action_microflow, group.object.getGuid(), async function (mfObjects) {
                        if (mfObjects) {
                          var data = await context.fetchData(mfObjects[0]);
                          context.renderData(data);
                        }
                      })
                    }
                    // Setup page action
                    else if (config.action_type === 'page') action = function (button) {
                      context._showPage(context._splitPath(group.name).path.split('/').pop(), group.object.getGuid(), config.action_form, config.action_form_location);
                    }
                    // Add button
                    objContext.addButton({
                      id: btnIndex,
                      name: config.action_name,
                      class: config.action_classes ? config.action_classes.split(' ') : null,
                      iconClass: config.icon_classes ? config.icon_classes.split(' ') : null,
                      onClick: action,
                      hideText: config.text_visibility
                    });
                    // Decide if to remove button
                    if ((config.visibility === 'empty' && (objContext.groupEvent.startDate || objContext.groupEvent.endDate)) || (config.visibility === 'one' && !(objContext.groupEvent.startDate || objContext.groupEvent.endDate))) {
                      objContext.removeButton(btnIndex);
                    }
                    else if (config.visibility === 'attribute') {
                      if (config.visibility_bool) {
                        let tempBtnIndex = btnIndex;
                        context._fetchString(event.object, config.visibility_bool)
                          .then(data => {
                            if (!data.string) objContext.removeButton(tempBtnIndex);
                          });
                      }
                    }
                    btnIndex++;
                  }
                })(conf);
              }
            }
          }

          // Set glyphicon group
          if (group.name != '' && group.name != null && group.icon && !objContext.resourceRow.getAttribute('data-icon')) {
            let node = objContext.resourceRow.firstElementChild.querySelector('#name');
            let iconNode = document.createElement('span');
            let nameNode = document.createElement('span');
            nameNode.setAttribute('id', 'name');
            nameNode.innerText = node.innerText;
            node.innerText = null;
            node.removeAttribute('id');
            iconNode.classList.add('glyphicon', 'spacing-outer-right', 'glyphicon-' + group.icon);
            node.insertAdjacentElement('afterbegin', iconNode);
            node.insertAdjacentElement('beforeend', nameNode);
            objContext.resourceRow.setAttribute('data-icon', 'true');
          }

          // Add edit page listener group resource
          if (group.name != '' && group.name != null && group.resource_form && !objContext.resourceRow.getAttribute('data-event')) {
            let node = objContext.resourceRow.firstElementChild.querySelector('div.rp-label.rp-label-subtitle');
            context._addOpenPage(
              node,
              context._splitPath(group.name).path.split('/').pop(),
              group.object.getGuid(),
              group.resource_form,
              group.resource_form_location
            );
            node.classList.add('btn-link', 'text-primary');
            objContext.resourceRow.setAttribute('data-event', 'true');
          }

          // Add edit page listener group event
          if (group.name != '' && group.name != null && group.event_form && !objContext.groupEvent.node.getAttribute('data-event')) {
            let node = objContext.groupEvent.node;
            context._addOpenPage(
              node,
              context._splitPath(group.name).path.split('/').pop(),
              group.object.getGuid(),
              group.event_form,
              group.event_form_location
            );
            node.classList.add('rp-eventListener');
            objContext.groupEvent.node.setAttribute('data-event', 'true');
          }
        }

        // Add resource and event to planner/group
        var resourceObj = objContext.addResource(
          resource.id,
          resource.name,
          resource.description
        );
        if (resetOrder) resourceObj.order = 10000;
        resourceObj.colour = resource.rowColour;
        var eventObj = resourceObj.addEvent(
          event.object.getGuid(),
          event.startDate,
          event.endDate,
          event.type,
          event.colour
        );

        // Add resource buttons
        if (context.resource_buttons) {
          for (var btn of resourceObj.buttons) {
            resourceObj.removeButton(btn.id);
          }
          let btnIndex = 0;
          let action = null;
          for (var conf of context.resource_buttons) {
            (function (config) {
              // Setup microflow action
              if (config.action_type === 'microflow') action = function (button) {
                context._execMf(config.action_microflow, resource.object.getGuid(), async function (mfObjects) {
                  if (mfObjects) {
                    var data = await context.fetchData(mfObjects[0]);
                    context.renderData(data);
                  }
                })
              }
              // Setup page action
              else if (config.action_type === 'page') action = function (button) {
                context._showPage(context._splitPath(context.resource_name).path.split('/').pop(), resource.object.getGuid(), config.action_form, config.action_form_location);
              }
              // Add button
              resourceObj.addButton({
                id: btnIndex,
                name: config.action_name,
                class: config.action_classes ? config.action_classes.split(' ') : null,
                iconClass: config.icon_classes ? config.icon_classes.split(' ') : null,
                onClick: action,
                hideText: config.text_visibility
              });
              if ((config.visibility === 'empty' && resourceObj.events.filter(event => event.startDate || event.endDate).length != 0) || (config.visibility === 'one' && resourceObj.events.filter(event => event.startDate || event.endDate).length == 0)) {
                resourceObj.removeButton(btnIndex);
              }
              else if (config.visibility === 'attribute') {
                if (config.visibility_bool) {
                  let tempBtnIndex = btnIndex;
                  context._fetchString(event.object, config.visibility_bool)
                    .then(data => {
                      if (!data.string) resourceObj.removeButton(tempBtnIndex);
                    });
                }
              }
              btnIndex++;
            })(conf);
          }
        }

        // Set glyphicon resource
        if (context.resource_icon && !resourceObj.resourceRow.getAttribute('data-icon')) {
          let node = resourceObj.resourceRow.firstElementChild.querySelector('#name');
          let iconNode = document.createElement('span');
          let nameNode = document.createElement('span');
          nameNode.setAttribute('id', 'name');
          nameNode.innerText = node.innerText;
          node.innerText = null;
          node.removeAttribute('id');
          iconNode.classList.add('glyphicon', 'spacing-outer-right', 'glyphicon-' + context.resource_icon);
          node.insertAdjacentElement('afterbegin', iconNode);
          node.insertAdjacentElement('beforeend', nameNode);
          resourceObj.resourceRow.setAttribute('data-icon', 'true');
        }

        // Add edit page listener resource
        if (context.resource_form && !resourceObj.resourceRow.getAttribute('data-event')) {
          let node = resourceObj.resourceRow.firstElementChild.querySelector('div.rp-label.rp-label-subtitle');
          context._addOpenPage(
            node,
            context._splitPath(context.resource_name).path.split('/').pop(),
            resource.object.getGuid(),
            context.resource_form,
            context.resource_form_location
          );
          node.classList.add('btn-link', 'text-primary');
          resourceObj.resourceRow.setAttribute('data-event', 'true');
        }

        // Add edit page listener event
        if (context.event_form && !eventObj.node.getAttribute('data-event')) {
          let node = eventObj.node;
          context._addOpenPage(
            node,
            context._splitPath(context.event).path.split('/').pop(),
            event.object.getGuid(),
            context.event_form,
            context.event_form_location
          );
          eventObj.node.setAttribute('data-event', 'true');
        }
      }
    },

    generateXPath: function () {
      var context = this;
      var xpathStart = '[' + context.event_startDate + ' >= ' + context.planner.dateFrom.valueOf() + ' or ' + context.event_endDate + ' >= ' + context.planner.dateFrom.valueOf() + ']';
      var xpathEnd = '[' + context.event_startDate + ' <= ' + (context.planner.dateTo.valueOf() + 1000 * 60 * 60 * 23) + ' or ' + context.event_endDate + ' <= ' + (context.planner.dateTo.valueOf() + 1000 * 60 * 60 * 23) + ']';
      var xpath = '//' + context.event + (context.search_dateFilter ? xpathStart + xpathEnd : '') + context.search_statXpath + (context.search_dynXpath ? context._contextObj.get(context.search_dynXpath) : '');
      xpath = xpath.replace(/(\'\[\%CurrentObject\%\]\')/gi, context._contextObj.getGuid());
      return xpath;
    },

    generateSortOrder: function () {
      var context = this;
      var sortOrder = new Array();
      for (var x = 0; x < context.resource_sortBy.length; x++) {
        sortOrder.push(Object.values(context.resource_sortBy[x]));
      }
      return sortOrder;
    },

    fetchAllData: function () {
      var context = this;
      // Mendix data
      var xpath = context.generateXPath();
      var sortOrder = context.generateSortOrder();
      // Async (because of callback)
      return new Promise((resolve, reject) => {
        try {
          // Get mendix data
          mx.data.get({
            xpath: xpath,
            filter: { sort: sortOrder },
            callback: function(events) {
              // Make sure there are results
              if (events instanceof Array && events.length) {
                var currentData = new Array();
                var itemNum = events.length;
                // Loop through the results
                events.forEach(function(event, index) {
                  // Fetch finer detail
                  context.fetchData(event)
                    .then(function(data) {
                      currentData[index] = data;
                      // List has finished
                      if (--itemNum <= 0) {
                        resolve(currentData);
                      }
                    })
                    .catch(function(reason) {
                      reject(reason);
                    });
                });
              } else {
                resolve();
              }
            },
          });
        } catch (error) {
          reject('Error: Could not fetch data');
        }
      });
    },

    render: function () {
      var context = this;
      // Instantiate dates
      var rawFromDate = this._contextObj.get(this.search_dateFrom);
      var rawToDate = this._contextObj.get(this.search_dateTo);
      var fromDate = rawFromDate != '' && rawFromDate != null ? new Date(rawFromDate) : null;
      var toDate = rawToDate != '' && rawToDate != null ? new Date(rawToDate) : null;
      // Remove existing subscriptions
      this.subscribed.forEach(function(subscription) {
        mx.data.unsubscribe(subscription.subscription)
      });
      this.subscribed = new Array();
      // Setup planner
      if (fromDate && toDate && fromDate.valueOf() < toDate.valueOf()) {
        // Remove any errors
        this._hideErrorMessage();
        // Ensure the planner exists
        if (this.planner) {
          this.planner.setDates(fromDate, toDate);
        } else {
          this.plannerNode = document.createElement('div');
          this.plannerNode.style['height'] = '100%';
          this.domNode.insertAdjacentElement('afterBegin', this.plannerNode);
          this.planner = new ResourcePlanner(
            this.plannerNode,
            fromDate,
            toDate,
            this.plannerTitle,
            this.plannerDescription
          );
          // Set view options
          this.planner.showEmptyResources = !this.search_dateFilter;
        }
        // Update additional properties
        this.planner.resourceColumnName = this.resource_column_title ? this.resource_column_title : 'Data';
        this.planner.resourceColumnHTML = this.resource_column_HTML ? this.resource_column_HTML : this.planner.resourceColumnName;
        this.planner.render();
        // Render inital table
        var pid = mx.ui.showProgress();
        context.fetchAllData()
          .then(function(dataList) {
            // If data is returned as a list...
            if (dataList instanceof Array) {
              // Loop through returned data
              dataList.forEach(function(data, index) {
                // Render new data
                // TODO: CREATE SORT ORDER METHOD 'GROUP > GROUP > ... > RESOURCE'
                context.renderData(data, true);
              });
            }
            mx.ui.hideProgress(pid);
          }).catch(function(reason) {
            console.error(reason);
            this._showErrorMessage(reason);
          });
      } else {
        this._showErrorMessage('Error: Invalid date range');
      }
    },

    // Step 1
    constructor: function () {
      this._handles = [];
    },

    // Step 2
    postCreate: function () {
      logger.debug(this.id + '.postCreate');
    },

    // Step 3
    update: function (obj, callback) {
      var context = this;

      logger.debug(this.id + '.update');

      this._contextObj = obj;
      this._updateRendering(callback);

      this.render();

      this.subscribe({
        guid: context._contextObj.getGuid(),
        callback: context.render,
      });
    },

    resize: function (box) {
      logger.debug(this.id + '.resize');
    },

    uninitialize: function () {
      logger.debug(this.id + '.uninitialize');
      if (this.subscribed instanceof Array) {
        // Remove existing subscriptions
        this.subscribed.forEach((sub) =>
          mx.data.unsubscribe(sub.subscription)
        );
      }
    },

    _showErrorMessage: function (message) {
      if (this.domNode instanceof HTMLElement) {
        var element = this.domNode.querySelector('div#error');
        if (element instanceof HTMLElement) {
          element.innerText = message;
        } else {
          element = document.createElement('div');
          element.innerText = message;
          element.classList.add(
            'alert',
            'alert-danger',
            'text-center'
          );
          element.setAttribute('id', 'error');
          this.domNode.insertAdjacentElement('afterBegin', element);
        }
      }
      if (this.plannerNode instanceof HTMLElement) {
        // Hide the planner
        this.plannerNode.style['display'] = 'none';
      }
    },

    _hideErrorMessage: function () {
      if (this.domNode instanceof HTMLElement) {
        var element = this.domNode.querySelector('div#error');
        if (element instanceof HTMLElement)
          this.domNode.removeChild(element);
      }
      if (this.plannerNode instanceof HTMLElement) {
        // Show the planner
        this.plannerNode.style['display'] = null;
      }
    },

    // Step 4: Update rendering
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
        mx.ui.action(
          mf,
          {
            params: {
              applyto: 'selection',
              guids: [guid],
            },
            callback: lang.hitch(this, function (objs) {
              if (cb && typeof cb === 'function') {
                cb(objs);
              }
            }),
            error: function (error) {
              console.debug(error.description);
            },
          },
          this
        );
      }
    },

    // Shorthand for executing a callback, adds logging to your inspector
    _executeCallback: function (cb, from) {
      logger.debug(
        this.id + '._executeCallback' + (from ? ' from ' + from : '')
      );
      if (cb && typeof cb === 'function') {
        cb();
      }
    },
  });
});

require(['ResourcePlanner/widget/ResourcePlanner']);
