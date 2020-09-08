define([
  "ResourcePlanner/lib/Planner",
  "dojo/_base/declare",
  "mxui/widget/_WidgetBase",
  "mendix/lib/MxContext",
  "dojo/_base/lang",
], function (planner, declare, _WidgetBase, MxContext, lang) {
  "use strict";

  var ResourcePlanner = planner.ResourcePlanner;

  return declare("ResourcePlanner.widget.ResourcePlanner", [_WidgetBase], {
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

    // Group
    groups: null,

    // Planner
    planner_name: null,
    planner_description: null,

    // Global variables
    planner: null,
    subscribed: new Array(),

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
        if (path.attribute == null || path.attribute == "")
          resolve(null);
        else {
          if (path.path == null || path.path == "") resolve(mxObject);
          else
            mxObject.fetch(path.path, (result) => {
              resolve(result);
            });
        }
      });
    },

    _splitPath: function (string_path) {
      if (string_path == "" || string_path == null)
        return { path: null, attribute: null };
      var obj = new Object();
      obj.path = string_path.split("/");
      obj.attribute = obj.path.pop();
      obj.path = obj.path.join("/");
      return obj;
    },

    _addOpenPage: function (node, entity, guid, page, pageLocation) {
      var entityContext = new MxContext();
      entityContext.setContext(entity, guid);

      var showPage = function (e) {
        e.preventDefault();
        e.stopPropagation();
        mx.ui.openForm(page, {
          location: pageLocation,
          context: entityContext,
        });
      };

      node.addEventListener("click", showPage);
      node.style["cursor"] = "pointer";
    },

    _displayTemplate: function (node, entity, guid, page) {
      var entityContext = new MxContext();
      entityContext.setContext(entity, guid);
      mx.ui.openForm(page, {
        location: "content",
        context: entityContext,
        domNode: node,
      });
    },

    fetchData: async function (mxObject_event) {
      var context = this;
      var event = new Object();
      var resource = new Object();
      var groups = new Array();

      event.object = mxObject_event;
      // Resource name
      var fetchResoure_name = await context._fetchString(
        mxObject_event,
        context.resource_name
      );
      resource.object = fetchResoure_name.object;
      resource.name = fetchResoure_name.string;
      // Resource description
      var fetchResoure_description = await context._fetchString(
        mxObject_event,
        context.resource_description
      );
      resource.description = fetchResoure_description.string;

      for (var index = 0; index < context.groups.length; index++) {
        var group = context.groups[index];
        var grouping = new Object();
        // Group name
        var fetch_groupName = await context._fetchString(
          mxObject_event,
          group.group_name
        );
        grouping.object = fetch_groupName.object;
        grouping.name = fetch_groupName.string;
        // Group description
        var fetch_groupDescription = await context._fetchString(
          mxObject_event,
          group.group_description
        );
        grouping.description = fetch_groupDescription.string;
        // Group type
        var fetch_groupType = await context._fetchString(
          mxObject_event,
          group.group_type
        );
        grouping.type =
          fetch_groupType.string && fetch_groupType.string != ""
            ? fetch_groupType.string
            : group.group_type_default;
        // Group colour
        var fetch_groupColour = await context._fetchString(
          mxObject_event,
          group.group_colour
        );
        grouping.colour = fetch_groupColour.string;
        // Event start date
        var fetch_groupStartDate = await context._fetchString(
          mxObject_event,
          group.group_startDate
        );
        grouping.startDate =
          fetch_groupStartDate.string != "" &&
            fetch_groupStartDate.string != null
            ? new Date(fetch_groupStartDate.string)
            : null;
        // Event end date
        var fetch_groupEndDate = await context._fetchString(
          mxObject_event,
          group.group_endDate
        );
        grouping.endDate =
          fetch_groupEndDate.string != "" &&
            fetch_groupEndDate.string != null
            ? new Date(fetch_groupEndDate.string)
            : null;
        // Group form
        grouping.resource_form = group.group_resource_form;
        grouping.resource_form_location =
          group.group_resource_form_location;
        grouping.event_form = group.group_event_form;
        grouping.event_form_location = group.group_event_form_location;
        grouping.icon = group.group_icon;
        grouping.generateDate = group.group_generateDate;
        grouping.uniqueName = group.group_uniqueName;
        grouping.startButton = group.group_startButton;
        groups[index] = grouping;

        // Subscribe event changes
        if (
          grouping.object &&
          !context.subscribed.find(
            (obj) => obj.id == grouping.object.getGuid()
          )
        ) {
          context.subscribed.push({
            id: grouping.object.getGuid(),
            subscription: mx.data.subscribe({
              guid: grouping.object.getGuid(),
              callback: (guid) =>
                mx.data.get({
                  guid: event.object.getGuid(),
                  callback: (obj) =>
                    context
                      .fetchData(obj)
                      .then((data) =>
                        context.renderData(data)
                      ),
                }),
            }),
          });
        }
      }
      // Event start date
      var fetch_eventStartDate = await context._fetchString(
        mxObject_event,
        context.event_startDate
      );
      event.startDate =
        fetch_eventStartDate.string != "" &&
          fetch_eventStartDate != null
          ? new Date(fetch_eventStartDate.string)
          : null;
      // Event end date
      var fetch_eventEndDate = await context._fetchString(
        mxObject_event,
        context.event_endDate
      );
      event.endDate =
        fetch_eventEndDate.string != "" && fetch_eventEndDate != null
          ? new Date(fetch_eventEndDate.string)
          : null;
      // Event colour
      var fetchEvent_colour = await context._fetchString(
        mxObject_event,
        context.event_colour
      );
      event.colour = fetchEvent_colour.string;
      // Event type
      var fetchEvent_type = await context._fetchString(
        mxObject_event,
        context.event_type
      );
      event.type = fetchEvent_type.string;
      // Subscribe event changes
      if (
        event.object &&
        !context.subscribed.find(
          (obj) => obj.id == event.object.getGuid()
        )
      ) {
        context.subscribed.push({
          id: event.object.getGuid(),
          subscription: mx.data.subscribe({
            guid: event.object.getGuid(),
            callback: (guid) =>
              mx.data.get({
                guid: guid,
                callback: (obj) =>
                  context
                    .fetchData(obj)
                    .then((data) =>
                      context.renderData(data)
                    ),
              }),
          }),
        });
      }

      // Create data object
      var data = {
        event: event,
        resource: resource,
        groups: groups,
      };
      return data;
    },

    renderData: function (data) {
      var context = this;

      var groups = data.groups;
      var resource = data.resource;
      var event = data.event;

      var objContext = context.planner;

      for (var index = 0; index < groups.length; index++) {
        var group = groups[index];
        // Decide whether to use group or planner
        if (group.name) {
          var groupIdentifier = group.uniqueName
            ? group.object.getGuid()
            : group.name;
          objContext = objContext.addGroup(
            groupIdentifier,
            group.name,
            group.description,
            group.type,
            group.colour
          );
          if (!group.generateDate) {
            objContext.groupEvent.setDates(
              group.startDate,
              group.endDate
            );
            objContext.generatedEvent = false;
          }
        }

        // Set glyphicon group
        if (
          group.name != "" &&
          group.name != null &&
          group.icon &&
          !objContext.resourceRow.getAttribute("data-icon")
        ) {
          let node = objContext.resourceRow.firstElementChild.querySelector(
            "#name"
          );
          let iconNode = document.createElement("span");
          let nameNode = document.createElement("span");
          nameNode.setAttribute("id", "name");
          nameNode.innerText = node.innerText;
          node.innerText = null;
          node.removeAttribute("id");
          iconNode.classList.add(
            "glyphicon",
            "spacing-outer-right",
            "glyphicon-" + group.icon
          );
          node.insertAdjacentElement("afterbegin", iconNode);
          node.insertAdjacentElement("beforeend", nameNode);
          objContext.resourceRow.setAttribute("data-icon", "true");
        }

        // Add edit page listener group resource
        if (
          group.name != "" &&
          group.name != null &&
          group.resource_form &&
          !objContext.resourceRow.getAttribute("data-event")
        ) {
          let node = objContext.resourceRow.firstElementChild.querySelector(
            "div.rp-label.rp-label-subtitle"
          );
          context._addOpenPage(
            node,
            context._splitPath(group.name).path.split("/").pop(),
            group.object.getGuid(),
            group.resource_form,
            group.resource_form_location
          );
          node.classList.add("btn-link", "text-primary");
          objContext.resourceRow.setAttribute("data-event", "true");
        }

        // Add edit page listener group event
        if (
          group.name != "" &&
          group.name != null &&
          group.event_form &&
          !objContext.groupEvent.node.getAttribute("data-event")
        ) {
          let node = objContext.groupEvent.node;
          context._addOpenPage(
            node,
            context._splitPath(group.name).path.split("/").pop(),
            group.object.getGuid(),
            group.event_form,
            group.event_form_location
          );
          node.classList.add("rp-eventListener");
          objContext.groupEvent.node.setAttribute(
            "data-event",
            "true"
          );
        }

        // Add start task button
        if (
          group.name != "" &&
          group.name != null &&
          !group.generateDate &&
          !group.startDate &&
          !group.endDate &&
          !objContext.resourceRow.getAttribute("data-new-button")
        ) {
          let node = document.createElement("button");
          node.innerText = group.startButton;
          node.setAttribute("title", group.startButton);
          node.classList.add("btn", "btn-primary");
          node.style["float"] = "right";
          node.style["height"] = "100%";
          node.style["marginRight"] = "10px";
          objContext.resourceRow.firstElementChild
            .querySelector("div.rp-group-icon")
            .insertAdjacentElement("afterend", node);
          context._addOpenPage(
            node,
            context._splitPath(group.name).path.split("/").pop(),
            group.object.getGuid(),
            group.event_form,
            group.event_form_location
          );
          objContext.resourceRow.setAttribute(
            "data-new-button",
            "true"
          );
        } else if (
          !group.generateDate &&
          (group.startDate || group.endDate) &&
          objContext.resourceRow.getAttribute("data-new-button")
        ) {
          let newButton = objContext.resourceRow.firstElementChild.querySelector(
            "button"
          );
          if (newButton) newButton.remove();
          objContext.resourceRow.removeAttribute("data-new-button");
        }
      }

      // Add resource and event to planner/group
      var resourceIdentifier = context.resource_uniqueName
        ? resource.object.getGuid()
        : resource.name;
      var resourceObj = objContext.addResource(
        resourceIdentifier,
        resource.name,
        resource.description
      );
      var eventObj = resourceObj.addEvent(
        event.object.getGuid(),
        event.startDate,
        event.endDate,
        event.type,
        event.colour
      );

      // Display resource template
      // if (context.resource_template && !resourceObj.resourceRow.getAttribute('data-template')) {
      //     context._displayTemplate(resourceObj.resourceRow.firstElementChild, context._splitPath(context.resource_name).path.split('/').pop(), resource.object.getGuid(), context.resource_template);
      //     resourceObj.resourceRow.setAttribute('data-template', 'true');
      // }

      // Set glyphicon resource
      if (
        context.resource_icon &&
        !resourceObj.resourceRow.getAttribute("data-icon")
      ) {
        let node = resourceObj.resourceRow.firstElementChild.querySelector(
          "#name"
        );
        let iconNode = document.createElement("span");
        let nameNode = document.createElement("span");
        nameNode.setAttribute("id", "name");
        nameNode.innerText = node.innerText;
        node.innerText = null;
        node.removeAttribute("id");
        iconNode.classList.add(
          "glyphicon",
          "spacing-outer-right",
          "glyphicon-" + context.resource_icon
        );
        node.insertAdjacentElement("afterbegin", iconNode);
        node.insertAdjacentElement("beforeend", nameNode);
        resourceObj.resourceRow.setAttribute("data-icon", "true");
      }

      // Add edit page listener resource
      if (
        context.resource_form &&
        !resourceObj.resourceRow.getAttribute("data-event")
      ) {
        let node = resourceObj.resourceRow.firstElementChild.querySelector(
          "div.rp-label.rp-label-subtitle"
        );
        context._addOpenPage(
          node,
          context
            ._splitPath(context.resource_name)
            .path.split("/")
            .pop(),
          resource.object.getGuid(),
          context.resource_form,
          context.resource_form_location
        );
        node.classList.add("btn-link", "text-primary");
        resourceObj.resourceRow.setAttribute("data-event", "true");
      }

      // Add edit page listener event
      if (
        context.event_form &&
        !eventObj.node.getAttribute("data-event")
      ) {
        let node = eventObj.node;
        context._addOpenPage(
          node,
          context._splitPath(context.event).path.split("/").pop(),
          event.object.getGuid(),
          context.event_form,
          context.event_form_location
        );
        eventObj.node.setAttribute("data-event", "true");
      }

      // Add start task button
      if (
        !event.startDate &&
        !event.endDate &&
        !resourceObj.resourceRow.getAttribute("data-new-button")
      ) {
        let node = document.createElement("button");
        node.innerText = context.resource_startButton;
        node.setAttribute("title", context.resource_startButton);
        node.classList.add("btn", "btn-primary");
        node.style["float"] = "right";
        node.style["height"] = "100%";
        resourceObj.resourceRow.firstElementChild.insertAdjacentElement(
          "afterbegin",
          node
        );
        context._addOpenPage(
          node,
          context._splitPath(context.event).path.split("/").pop(),
          event.object.getGuid(),
          context.event_form,
          context.event_form_location
        );
        resourceObj.resourceRow.setAttribute("data-new-button", "true");
      } else if (
        !event.generateDate &&
        (event.startDate || event.endDate) &&
        resourceObj.resourceRow.getAttribute("data-new-button")
      ) {
        let newButton = resourceObj.resourceRow.firstElementChild.querySelector(
          "button"
        );
        if (newButton) newButton.remove();
        resourceObj.resourceRow.removeAttribute("data-new-button");
      }
    },

    generateXPath: function () {
      var context = this;
      var xpathStart =
        "[" +
        context.event_startDate +
        " >= " +
        context.planner.dateFrom.valueOf() +
        " or " +
        context.event_endDate +
        " >= " +
        context.planner.dateFrom.valueOf() +
        "]";
      var xpathEnd =
        "[" +
        context.event_startDate +
        " <= " +
        (context.planner.dateTo.valueOf() + 1000 * 60 * 60 * 23) +
        " or " +
        context.event_endDate +
        " <= " +
        (context.planner.dateTo.valueOf() + 1000 * 60 * 60 * 23) +
        "]";
      var xpath =
        "//" +
        context.event +
        (context.search_dateFilter ? xpathStart + xpathEnd : "") +
        context.search_statXpath +
        (context.search_dynXpath
          ? context._contextObj.get(context.search_dynXpath)
          : "");
      xpath = xpath.replace(
        /(\'\[\%CurrentObject\%\]\')/gi,
        context._contextObj.getGuid()
      );
      return xpath;
    },

    generateSortOrder: function () {
      var context = this;
      var sortOrder = new Array();
      for (var x = 0; x < context.resource_sortBy.length; x++) {
        sortOrder.push(Object.values(context.resource_sortBy[x]));
      }
      // sortOrder.push([context.event_startDate, 'asc']);
      return sortOrder;
    },

    fetchAllData: function () {
      var context = this;
      var xpath = context.generateXPath();
      var sortOrder = context.generateSortOrder();
      return new Promise((resolve, reject) => {
        try {
          mx.data.get({
            xpath: xpath,
            filter: { sort: sortOrder },
            callback: (events) => {
              var dataList = new Array();
              var itemNum = events.length;
              if (events instanceof Array && events.length)
                events.forEach((event, index) => {
                  context
                    .fetchData(event)
                    .then((data) => {
                      dataList[index] = data;
                      if (--itemNum <= 0) {
                        dataList.forEach((data) =>
                          context.renderData(data)
                        );
                        resolve(dataList);
                      }
                    })
                    .catch((reason) => reject(reason));
                });
              else resolve();
            },
          });
        } catch (e) {
          reject("Error: Could not fetch data");
        }
      });
    },

    render: function () {
      var context = this;
      // Instantiate dates
      var fromDate = this._contextObj.get(this.search_dateFrom);
      var toDate = this._contextObj.get(this.search_dateTo);
      this.obj_dateFrom =
        fromDate != "" && fromDate != null ? new Date(fromDate) : null;
      this.obj_dateTo =
        toDate != "" && toDate != null ? new Date(toDate) : null;
      // Remove existing subscriptions
      this.subscribed.forEach((subscription) =>
        mx.data.unsubscribe(subscription.subscription)
      );
      this.subscribed = new Array();
      // Setup planner
      var plannerTitle = this.planner_name
        ? this.planner_name
        : "Planner";
      var plannerDescription = this.planner_description
        ? this.planner_description
        : "Plan events";
      if (
        this.obj_dateFrom &&
        this.obj_dateTo &&
        this.obj_dateFrom.valueOf() < this.obj_dateTo.valueOf()
      ) {
        this._hideErrorMessage();
        if (this.planner)
          this.planner.setDates(this.obj_dateFrom, this.obj_dateTo);
        else
          this.planner = new ResourcePlanner(
            this.domNode,
            this.obj_dateFrom,
            this.obj_dateTo,
            plannerTitle,
            plannerDescription
          );
        this.planner.resourceColumnName = this.resource_column_title
          ? this.resource_column_title
          : "Data";
        this.planner.render();
        // Render inital table
        var pid = mx.ui.showProgress();
        context
          .fetchAllData()
          .then((dataList) => mx.ui.hideProgress(pid))
          .catch((reason) => {
            console.error(reason);
            this._showErrorMessage(reason);
          });
      } else {
        this._showErrorMessage("Error: Invalid date range");
      }
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
        callback: context.render,
      });
    },

    resize: function (box) {
      logger.debug(this.id + ".resize");
    },

    uninitialize: function () {
      logger.debug(this.id + ".uninitialize");
    },

    _showErrorMessage: function (message) {
      if (this.domNode instanceof HTMLElement) {
        var element = this.domNode.querySelector("div#error");
        if (element instanceof HTMLElement) {
          element.innerText = message;
        } else {
          element = document.createElement("div");
          element.innerText = message;
          element.classList.add(
            "alert",
            "alert-danger",
            "text-center"
          );
          element.setAttribute("id", "error");
          this.domNode.appendChild(element);
        }
      }
    },

    _hideErrorMessage: function () {
      if (this.domNode instanceof HTMLElement) {
        var element = this.domNode.querySelector("div#error");
        if (element instanceof HTMLElement)
          this.domNode.removeChild(element);
      }
    },

    _updateRendering: function (callback) {
      logger.debug(this.id + "._updateRendering");

      // if (this._contextObj !== null) {
      //     dojoStyle.set(this.domNode, 'display', 'block');
      // } else {
      //     dojoStyle.set(this.domNode, 'display', 'none');
      // }

      this._executeCallback(callback, "_updateRendering");
    },

    // Shorthand for running a microflow
    _execMf: function (mf, guid, cb) {
      logger.debug(this.id + "._execMf");
      if (mf && guid) {
        mx.ui.action(
          mf,
          {
            params: {
              applyto: "selection",
              guids: [guid],
            },
            callback: lang.hitch(this, function (objs) {
              if (cb && typeof cb === "function") {
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
        this.id + "._executeCallback" + (from ? " from " + from : "")
      );
      if (cb && typeof cb === "function") {
        cb();
      }
    },
  });
});

require(["ResourcePlanner/widget/ResourcePlanner"]);
