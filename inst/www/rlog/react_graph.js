
// TODO-barret
// √ add buttons for moving around
// √ clean up how active states are done
// √ pulse on active enter change
// √ pulse on valueChange
// add edge styles
//   distinguish active vs running edges
// set up cloning of graph after every 250 steps
// filtering
// update legend


colors = {
  // regular colors
  regular: {
    white: "#ffffff",
    black: "#000000",

    // http://colorbrewer2.org/#type=sequential&scheme=YlGn&n=4
    // #2-4
    green1: "#f7fcb9", // ready
    green2: "#78c679", // enter
    green3: "#238443", // active enter

    greenLite: "#b2df8a", // green from http://colorbrewer2.org/#type=qualitative&scheme=Paired&n=8

    // http://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
    red: "#e41a1c", // valueChange
    blue: "#377eb8", // frozen
    green: "#4daf4a", // enter
    purple: "#984ea3", //
    orange: "#ff7f00", //
    yellow: "#ffff33", //
    brown: "#a65628", //
    pink: "#f781bf", //
    grey: "#999999", // invalidate

    // http://colorbrewer2.org/#type=sequential&scheme=Greys&n=9
    grey1: "#d9d9d9", // invalidate
    grey2: "#969696", // active invalidate
    grey3: "#737373" // active invalidate
  },
  edges: {
    running: "#676767",
    isolate: "#818181",
    active: "#818181",
    inactive: "#ececec"
  },
  // filtered colors
  lite: {
    white: "#ffffff",
    black: "#b2b2b2", // personal attempt

    // http://colorbrewer2.org/#type=sequential&scheme=YlGn&n=9
    // #1-3
    green1: "#ffffe5",
    green2: "#f7fcb9",
    green3: "#d9f0a3",

    greenLite: "#d6eec0", // personal attempt
    // http://colorbrewer2.org/#type=qualitative&scheme=Pastel1&n=9
    red: "#fbb4ae",
    blue: "#b3cde3",
    green: "#ccebc5",
    purple: "#decbe4",
    orange: "#fed9a6",
    yellow: "#ffffcc",
    brown: "#e5d8bd",
    pink: "#fddaec",
    grey: "#f2f2f2"
  }
}

// pulse on being active at step k; isAtStep(k)
// display engaged; isOn
// display active engaged; isOn and isActive
// display finished; isFinished
// display none; isOff
class ActiveStateStatus {
  constructor() {
    this.state = "off"; // "on", "finished", "off"
    this.activeStep = -1;
    // this.active = false; // currently engaged in activity
    // this.step = false; // -1 for finished, false for not engaged, positive for engaged at step k
  }
  setState(state) { this.state = state; }
  setActiveAtStep(step) { this.toOn(); this.activeStep = step; }
  reset() {
    this.toOff();
    this.resetActive();
  }
  resetActive() {
    this.activeStep = -1;
  }
  get isOn() { return this.state == "on" }
  get isOff() { return this.state == "off" }
  get isFinished() { return this.state == "finished" }
  get isActive() { return this.isOn && this.activeStep > 0 }
  isActiveAtStep(k) { return this.isActive && this.activeStep == k}

  toOn() {
    this.state = "on";
  }
  toFinished() {
    this.state = "finished";
    // this.activeStep = false;
  }
  toOff() {
    this.state = "off";
  }

  // finished() {
  //   this.setStep(-1);
  // }
  // get isFinished() {
  //   return (this.step !== false) && (this.step == -1)
  // }
  // get isActive() {
  //   return this.active === true;
  // }
  // isActiveAtStep(step) {
  //   return (this.step !== false) && (this.step == step) &&
  // }
}
class StatusArr {
  constructor() {
    this.statusArr = [];
  }
  add(obj) {
    return this.statusArr.push(obj);
  }
  remove() {
    return this.statusArr.pop()
  }
  last() {
    return _.last(this.statusArr)
  }
  containsStatus(status) {
    var arr = this.statusArr, n = arr.length;
    for (var i = 0; i < n; i++) {
      if (arr[i].action == status) {
        return true;
      }
    }
    return false;
  }

  static expect_prev_status(curStatus, prevStatus, expectedAction) {
    var on_error = function(msg) {
      console.error("curStatus: ", curStatus)
      console.error("prevStatus: ", prevStatus)
      throw msg
    }
    if (prevStatus.action != expectedAction) {
      on_error(`prior node status does not have "${expectedAction}" status`)
    }
    if (prevStatus.ctxId != curStatus.ctxId) {
      on_error(`prior node "ctxId" status does not have the same "ctxId" status`)
    }

  }
}
class Node {
  constructor(data) {
    if (typeof data.reactId === "undefined") throw "data.reactId not provided in new Node";
    if (typeof data.label === "undefined") throw "data.label not provided in new Node";
    if (typeof data.type === "undefined") throw "data.type not provided in new Node";
    if (typeof data.session === "undefined") throw "data.session not provided in new Node";
    if (typeof data.time === "undefined") throw "data.time not provided in new Node";
    this.reactId = data.reactId;
    this.label = data.label;
    this.type = data.type;
    this.session = data.session;
    this.time = data.time;
    this.statusArr = new StatusArr(data.statusArr || []);
    this.value = data.value || null;

    this.valueChangedStatus = data.valueChangedStatus || new ActiveStateStatus();

    // this.inInvalidate = data.inInvalidate || false;
    // this.activeInvalidate = data.activeInvalidate || false;

    this.enterStatus = data.enterStatus || new ActiveStateStatus();

    this.invalidateStatus = data.invalidateStatus || new ActiveStateStatus();
  }
  get id() {return this.reactId.replace(/\$/g, "_")}
  get key() {return this.reactId}
  statusAdd(obj) {
    this.statusArr.add(obj);
    return this.statusArr;
  }
  statusRemove() {return this.statusArr.remove();}
  statusLast() {return this.statusArr.last();}
  get inEnter() {return this.statusArr.containsStatus("enter");}
  get inIsolate() {return this.statusArr.containsStatus("isolateEnter");}
  // get inInvalidate() {return this.statusArr.containsStatus("invalidateStart");}
  get inIsolateInvalidate() {return this.statusArr.containsStatus("isolateInvalidateStart");}
  get cytoStyle() {
    var ret = {}
    // if (this.id == "r9") {
    //   ret["background-blacken"] = -0.75;
    // }
    // switch(this.type) {
    //   case "observer": ret = _.assign(ret, graphStyles.node.end); break;
    //   case "observable": ret = _.assign(ret, graphStyles.node.middle); break;
    //   default: ret = _.assign(ret, graphStyles.node.start)
    // }
    // if (this.hasInvalidated) ret = _.assign(ret, graphStyles.node.invalidate);
    // if (this.inEnter) ret = _.assign(ret, graphStyles.node.enter);
    // if (this.activeEnter) ret = _.assign(ret, graphStyles.node.enterActive);
    // // if (this.inInvalidate) classes.push("nodeInvalidate");
    // // if (this.inIsolate) classes.push("nodeIsolate");
    // // if (this.inIsolateInvalidate) classes.push("nodeIsolateInvalidate");
    // if (this.inValueChanged) ret = _.assign(ret, graphStyles.node.valueChanged);
    return ret
  }
  get cytoLabel() {
    // if (this.label.length > 30) {
    //   return (this.label.substring(0, 27) + "aasdf")
    // }
    return this.label
  }
  get cytoClasses() {
    var classes = []
    switch(this.type) {
      case "observer": classes.push("nodeEnd"); break;
      case "observable": classes.push("nodeMiddle"); break;
      default: classes.push("nodeStart")
    }

    if (this.inEnter) classes.push("nodeEnter");
    if (this.enterStatus.isActive) classes.push("nodeEnterActive");

    if (this.type == "observer" || this.type == "observable") {
      if (this.invalidateStatus.isActive) classes.push("nodeInvalidateActive")
      else if (this.invalidateStatus.isOn) classes.push("nodeInvalidate")
      else if (this.invalidateStatus.isFinished) classes.push("nodeInvalidateDone")
    }
    // if (this.inInvalidate) classes.push("nodeInvalidate");
    if (this.inIsolate) classes.push("nodeIsolate");
    // if (this.inIsolateInvalidate) classes.push("nodeIsolateInvalidate");
    if (this.valueChangedStatus.isOn) classes.push("nodeValueChanged");
    return classes.join(" ")
  }
  get cytoData() {
    var retData = this;
    return {
      group: "nodes",
      data: retData
    }
  }
}
class Edge {
  constructor(data) {
    if (typeof data.reactId === "undefined") throw "data.reactId not provided to new Edge()";
    if (typeof data.depOnReactId === "undefined") throw "data.depOnReactId not provided to new Edge()";
    if (typeof data.ctxId === "undefined") throw "data.ctxId not provided to new Edge()";
    if (typeof data.time === "undefined") throw "data.time not provided to new Edge()";
    this.reactId = data.reactId;
    this.depOnReactId = data.depOnReactId;
    this.ctxId = data.ctxId;
    this.session = data.session || "Global";
    this.time = data.time;
    this.status = "normal";
    this.isGhost = false;
  }
  get id() {
    return `${ this.reactId }_${ this.depOnReactId }_${this.ctxId}`.replace(/\$/g, "_");
  }
  get source() {
    return this.depOnReactId.replace(/\$/g, "_");
  }
  get target() {
    return this.reactId.replace(/\$/g, "_");
  }
  get key() {
    return `${ this.reactId } depends on ${ this.depOnReactId } in ${this.ctxId}`;
  }
  get depKey() {
    return `${ this.reactId } depends on ${ this.depOnReactId }`;
  }
  get inIsolate() {
    return this.status == "isolate";
  }
  get cytoClasses() {
    if (this.inIsolate) return "edgeIsolate"
    return ""
  }
  get cytoData() {
    var retData = this;
    return {
      group: "edges",
      data: retData
    }
  }
}
class GhostEdge {
  constructor(data) {
    if (typeof data.reactId === "undefined") throw "data.reactId not provided to new GhostEdge()";
    if (typeof data.depOnReactId === "undefined") throw "data.depOnReactId not provided to new GhostEdge()";
    if (typeof data.time === "undefined") throw "data.time not provided to new GhostEdge()";
    this.reactId = data.reactId;
    this.depOnReactId = data.depOnReactId;
    this.session = data.session || "Global";
    this.time = data.time;
    this.isGhost = true;
  }
  get id() {
    return `${ this.reactId }_${ this.depOnReactId }`.replace(/\$/g, "_");
  }
  get source() {
    return this.depOnReactId.replace(/\$/g, "_");
  }
  get target() {
    return this.reactId.replace(/\$/g, "_");
  }
  get key() {
    return `${ this.reactId } depends on ${ this.depOnReactId }`;
  }
  get cytoStyle() {
    return {};
    // return graphStyles.ghostEdge.default
  }
  get cytoClasses() {
    return "edgeGhost"
  }
  get cytoData() {
    var retData = this;
    return {
      group: "edges",
      data: retData
    }
  }
}

class Graph {
  constructor(log) {
    this.log = log;
    this.nodes = {};
    this.edges = {};
    this.edgesUnique = {};
    this.asyncStart = -1;
    this.asyncStop = -1;
    this.queueEmpty = -1;
    this.activeNodeEnter = [];
    this.activeInvalidateEnter = [];
  }

  // get nodeIds() {
  //   return _.values(this.nodes).map(function(node) {
  //     return "#" + node.id
  //   }).join(", ")
  // }
  get cytoGraph() {
    var cyto = cytoscape();
    var nodes = _.values(this.nodes).map(function(node) {
      return node.cytoData;
    });
    cyto.add(nodes);
    var ghostEdgeMap = _.assign({}, this.edgesUnique);
    var edges = _.values(this.edges).map(function(edge) {
      // remove matching unique/ghost edges
      if (_.has(ghostEdgeMap, edge.depKey)) {
        delete ghostEdgeMap[edge.depKey];
      }
      return edge.cytoData;
    });
    cyto.add(edges);
    var ghostEdges = _.values(ghostEdgeMap).map(function(edge) {
      return edge.cytoData;
    });
    cyto.add(ghostEdges);
    return cyto;
  }

  addEntry(data) {

    if (data.reactId == "rNoCtx") {
      return;
    }

    switch (data.action) {
      // {"action": "define", "reactId": "r3", "label": "plotObj", "type": "observable", "session": "fa3c747a6121aec5baa682cc3970b811", "time": 1524581676.5841},
      case "define":
        this.nodes[data.reactId] = new Node(data);
        break;

      // {"action": "updateNodeLabel", "nodeId": "1", "label": "input", "session": null, "time": 1522955046.5537},
      case "updateNodeLabel":
        this.nodes[data.reactId].label = data.label;
        break;

      case "valueChange":
        var node = this.nodes[data.reactId];
        node.value = data.value;
        node.valueChangedStatus.setActiveAtStep(data.step);
        break;

      case "invalidateStart":
        var node = this.nodes[data.reactId];
        var lastNodeId = _.last(this.activeInvalidateEnter)
        if (lastNodeId) {
          this.nodes[lastNodeId].invalidateStatus.resetActive()
        }
        this.activeInvalidateEnter.push(data.reactId)
        switch (node.type) {
          case "observable":
          case "observer":
            node.invalidateStatus.setActiveAtStep(data.step);
            break;
        }
        node.statusAdd(data)
        break;
      case "enter":
        var lastNodeId = _.last(this.activeNodeEnter);
        if (lastNodeId) {
          this.nodes[lastNodeId].enterStatus.resetActive()
        }
        this.activeNodeEnter.push(data.reactId);
        var node = this.nodes[data.reactId]
        node.enterStatus.setActiveAtStep(data.step);
        switch (node.type) {
          case "observer":
          case "observable":
            node.invalidateStatus.reset()
        }
        node.statusAdd(data)
        break;

      case "isolateInvalidateStart":
      case "isolateEnter":
        this.nodes[data.reactId].statusAdd(data)
        break;

      case "invalidateEnd":
      case "exit":
      case "isolateExit":
      case "isolateInvalidateEnd":
        var node = this.nodes[data.reactId];
        switch (data.action) {
          case "exit":
            this.nodes[_.last(this.activeNodeEnter)].enterStatus.reset();
            this.activeNodeEnter.pop();
            var lastNodeId = _.last(this.activeNodeEnter);
            if (lastNodeId) {
              this.nodes[lastNodeId].enterStatus.setActiveAtStep(data.step);
            }
            break;
          case "invalidateEnd":
            // turn off the previously active node
            this.nodes[_.last(this.activeInvalidateEnter)].invalidateStatus.resetActive();
            this.activeInvalidateEnter.pop();
            // if another invalidateStart node exists...
            //   set the previous invalidateStart node to active
            var lastNodeId = _.last(this.activeInvalidateEnter)
            if (lastNodeId) {
              this.nodes[lastNodeId].invalidateStatus.setActiveAtStep(data.step);
            }
            node.invalidateStatus.toFinished()
            if (node.valueChangedStatus.isOn) {
              node.valueChangedStatus.reset();
            }
            break;
          case "isolateInvalidateEnd":
            if (node.valueChangedStatus.isOn) {
              node.valueChangedStatus.reset();
            }
            break;
        }
        var prevData = node.statusLast()
        var expectedAction = {
          "exit": "enter",
          "isolateExit": "isolateEnter",
          "invalidateEnd": "invalidateStart",
          "isolateInvalidateEnd": "isolateInvalidateStart"
        }[data.action]
        StatusArr.expect_prev_status(data, prevData, expectedAction)
        node.statusRemove()
        break;

      case "dependsOn":
        var edge = new Edge(data);
        var edgeKey = edge.key;

        // store unique edges to always display a transparent dependency
        if (!_.has(this.edgesUnique, edge.depKey)) {
          this.edgesUnique[edge.depKey] = new GhostEdge(data);
        }

        if (!_.has(this.edges, edgeKey)) {
          this.edges[edgeKey] = edge;
        } else {
          edge = this.edges[edgeKey];
        }

        if (this.nodes[edge.reactId].statusLast().action == "isolateEnter") {
          edge.status = "isolate";
        } else {
          edge.status = "normal"
        }
        break;

      case "dependsOnRemove":
        var edge = new Edge(data);
        // remove the edge
        delete this.edges[edge.key];
        break;

      case "queueEmpty":
      case "asyncStart":
      case "asyncStop":
        this[data.action] = data.step
        break;

      default:
        console.error("data.action: ", data.action, data)
        throw data;
    }
  }
}


// initialize all log entries to have a step value
(function(){
  for (var i = 0; i < log.length; i++) {
    log[i].step = i;
  }
})()

class GraphAtStep {
  constructor(log) {
    this.log = log;
    this.asyncStarts = [];
    this.asyncStops = [];
    this.queueEmpties = [];
    this.enterExitEmpties = [];
    this.steps = [];
    this.minStep = log[0].step;
    this.maxStep = log[log.length - 1].step;

    var data, i;
    var enterExitQueue = [];
    for (i = 0; i < log.length; i++) {
      data = log[i];
      switch (data.action) {
        case "enter": enterExitQueue.push(i); break;
        case "exit":
          enterExitQueue.pop();
          if (enterExitQueue.length == 0) {
            this.enterExitEmpties.push(data.step + 1);
          }
          break;
        case "asyncStart": this.asyncStarts.push(data.step); break;
        case "asyncStop": this.asyncStops.push(data.step); break;
        case "queueEmpty": this.queueEmpties.push(data.step); break;
      }

      switch(data.action) {
        case "invalidateStart":
          if (log[i].ctxId == "other") {
            break;
          }
          this.steps.push(data.step);
          break;
        case "invalidateEnd":
        case "isolateInvalidateStart":
        case "isolateInvalidateEnd":
        // case "isolateEnter":
        // case "isolateExit":
        case "asyncStart":
        case "asyncStop":
        case "queueEmpty":
          break;
        default:
          this.steps.push(data.step);
          break;
      }
    }

    // this.graphCache = {};
    // this.cacheStep = 250;
    // var tmpGraph = new Graph(log);
    // for (i = 0; i < log.length; i++) {
    //   tmpGraph.addEntry(log[i])
    //   if ((i % this.cacheStep) == 0) {
    //     this.graphCache[i] = _.cloneDeep(tmpGraph)
    //   }
    // }
  }

  nextStep(k) {
    var nextStepPos = Math.min(this.steps.length - 1, _.sortedIndex(this.steps, k) + 1);
    return this.steps[nextStepPos]
  }
  prevStep(k) {
    var prevStepPos = Math.max(_.sortedIndex(this.steps, k) - 1, 1);
    return this.steps[prevStepPos]
  }

  atStep(k) {
    var kVal = Math.max(1, Math.min(k, this.log.length))
    var i, iStart, graph;
    // if (kVal >= this.cacheStep) {
    //   iStart = Math.floor((kVal - 1) / this.cacheStep) * this.cacheStep;
    //   graph = _.cloneDeep(this.graphCache[iStart])
    //   console.log(iStart, graph)
    //
    // } else {
    iStart = 0
    graph = new Graph(log);
    // }
    for (i = iStart; i < kVal; i++) {
      graph.addEntry(log[i]);
    }
    return graph;
  }

  displayAtStep(k, cy) {
    var graph = this.atStep(k);

    cy.startBatch();

    var i;
    var cytoDur = 400;
    var cyNodes = cy.nodes();
    var graphCyto = graph.cytoGraph;
    var graphNodes = graphCyto.nodes();
    var nodesLRB = cyNodes.diff(graphNodes);
    // .removeStyle()

    var onLayoutReady = [];

    // enter
    nodesLRB.right.map(function(graphNode) {
      var graphNodeData = graphNode.data()
      cy
        .add(graphNode)
        .classes(graphNodeData.cytoClasses)
        .style(graphNodeData.cytoStyle)
        // .animate({
        //   // style: ,
        //   duration: cytoDur
        // });
      window.barret = cy.$id(graphNode.id());
    });
    // update
    nodesLRB.both.map(function(cytoNode) {
      var cyNode = cy.$id(cytoNode.id())

      var graphNode = graphNodes.$id(cytoNode.id());
      var graphNodeData = graphNode.data();
      var graphClasses = graphNodeData.cytoClasses;

      cyNode
        // update to latest data
        .data(graphNodeData)
        .classes(graphClasses)
        .removeStyle()
        .style(graphNodeData.cytoStyle)
        // .animate({
        //   // style: graphNodeData.cytoStyle,
        //   duration: cytoDur
        // });

      // pulse value change
      if (graphNodeData.valueChangedStatus.isActiveAtStep(k - 1)) {
        onLayoutReady.push(function() {
          // console.log("pulse red!")
          cyNode
            .flashClass("nodeStartBig", 125)
        })
      }
      // pulse value enter or invalidate change
      if (
        graphNodeData.invalidateStatus.isActiveAtStep(k - 1) ||
        graphNodeData.enterStatus.isActiveAtStep(k - 1)
      ) {
        onLayoutReady.push(function() {
          switch(graphNodeData.type) {
            case "observable": cyNode.flashClass("nodeMiddleBig", 125); break;
            case "observer": cyNode.flashClass("nodeEndBig", 125); break;
          }
        })
      }
    });
    // exit
    nodesLRB.left.map(function(cytoNode) {
      cy
        .remove(cytoNode)
        // .animate({duration: cytoDur});
    });

    var cyEdges = cy.edges()
    var graphEdges = graphCyto.edges();
    var edgesLRB = cyEdges.diff(graphEdges);
    // enter
    edgesLRB.right.map(function(graphEdge) {
      var graphEdgeData = graphEdge.data()
      cy
        .add(graphEdge)
        .classes(graphEdgeData.cytoClasses)
        .removeStyle()
        .style(graphEdgeData.cytoStyle)
        // .animate({
        //   style: graphEdgeData.cytoStyle,
        //   duration: cytoDur
        // });
    });
    // update
    edgesLRB.both.map(function(cytoEdge) {
      var graphEdgeData = graphEdges.$id(cytoEdge.id()).data()
      cy
        .$id(cytoEdge.id())
        // .classes()
        .classes(graphEdgeData.cytoClasses)
        .data(graphEdgeData)
        .removeStyle()
        .style(graphEdgeData.cytoStyle)
        // .animate({
        //   style: graphEdgeData.cytoStyle,
        //   duration: cytoDur
        // });
    });
    // exit
    edgesLRB.left.map(function(cytoEdge) {
      var graphEdge = cytoEdge.data()
      // remove the original edge
      cy
        .remove(cytoEdge)
        .animate({duration: cytoDur});
    })

    cy.endBatch();

    // send in sorted elements according to the key.
    // If provided in a consistent order, layouts are consistent.
    // `eles` default to `options.eles != null ? options.eles : cy.$();`
    var sortedElements = cy.$().sort(function(a, b) {
      return a.data().key > b.data().key ? 1 : -1;
    });
    cy
      .layout(_.assign({
        // provide elements in sorted order to make determanistic layouts
        eles: sortedElements,
        // run on layout ready
        ready: function() {
          onLayoutReady.map(function(fn) {
            fn();
          })
        }
      }, layoutOptions))
      .run();
  }
}

var layoutOptions = {
  name: "dagre",
  rankDir: "LR", // 'TB' for top to bottom flow, 'LR' for left to right,
  rankSep: 150, // the separation between node columns
  nodeSep: 10, // the separation within a node column
  edgeSep: 50, // the separation between adjacent edges in the same rank
  ranker: "longest-path", // Type of algorithm to assign a rank to each node in the input graph. Possible values: "network-simplex", "tight-tree" or "longest-path"
  nodeDimensionsIncludeLabels: true, // whether labels should be included in determining the space used by a node
  animate: true, // whether to transition the node positions
  animateFilter: function( node, i ){ return true; }, // whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
  animationDuration: 1000, // duration of animation in ms if enabled
  animationEasing: "ease-in-out-quad", // easing of animation if enabled

};

var nodeShapes = {
  start: "-1 1 0.33333333333 1 1 0 0.33333333333 -1 -1 -1",
  middle: "-1 1 0.5 1 1 0 0.5 -1 -1 -1 -0.5 0",
  end: "-1 1 1 1 1 -1 -1 -1 -0.33333333333 0"
}
var pulseScale = 1 + 1/16
var graphStyles = {
  node: {
    default: {
      "label": "data(cytoLabel)",
      "text-opacity": 0.5,
      "text-valign": "bottom",
      "text-margin-x": "-5",
      "text-halign": "right",
      "border-color": colors.regular.black,
      "border-style": "solid",
      "border-width": 1,
      "background-color": colors.regular.green1,
      "text-wrap": "ellipsis",
      "text-max-width": "200px"
    },
    start: {
      "shape": "polygon",
      "shape-polygon-points": nodeShapes.start,
      width: 50 * 0.75,
      height: 30
    },
    startBig: {
      "border-width": 2,
      width: 50 * 0.75 * pulseScale,
      height: 30 * pulseScale
    },
    middle: {
      "shape": "polygon",
      "shape-polygon-points": nodeShapes.middle,
      width: 50,
      height: 30
    },
    middleBig: {
      "border-width": 2,
      width: 50 * pulseScale,
      height: 30 * pulseScale
    },
    end: {
      "shape": "polygon",
      "shape-polygon-points": nodeShapes.end,
      width: 50 * 0.75,
      height: 30
    },
    endBig: {
      "border-width": 2,
      width: 50 * 0.75 * pulseScale,
      height: 30 * pulseScale
    },
    enter: {
      // "border-width": 2,
      "background-color": colors.regular.green2
    },
    enterActive: {
      "background-color": colors.regular.green3
    },
    invalidate: {
      // "border-width": 2,
      "background-color": colors.regular.grey2
    },
    invalidateActive: {
      "background-color": colors.regular.grey3
    },
    invalidateDone: {
      "background-color": colors.regular.grey1
    },
    isolate: {
      "border-style": "dashed",
      // "border-width": 3,
      // "border-opacity"
    },
    isolateInvalidate: {
      "border-style": "dashed",
      "border-color": "darkgrey",
      "border-width": 3,
      // "border-opacity"
    },
    valueChanged: {
      "background-color": colors.regular.red // blood red
      // "border-style": "dashed",
      // "border-color": "darkgrey",
      // "border-width": 3,
      // "border-opacity"
    }
  },
  edge: {
    default: {
      "curve-style": "bezier",
      "width": 4,
      "target-arrow-shape": "triangle",
      "mid-target-arrow-shape": "triangle",
      "line-color": colors.edges.running, //"#9dbaea",
      "mid-target-arrow-color": colors.edges.running,
      "target-arrow-color": colors.edges.running
    },
    isolate: {
      "width": 4,
      "line-color": colors.edges.isolate,
      "mid-target-arrow-color": colors.edges.isolate,
      "target-arrow-color": colors.edges.isolate,
      "line-style": "dashed"
    }
  },
  ghostEdge: {
    default: {
      "width": 0.5,
      "mid-target-arrow-shape": "triangle",
      "mid-target-arrow-color": "#d0cfbc",
      "arrow-scale": 0.25,
      "curve-style": "haystack",
      "line-color": "#d0cfbc",
      "line-style": "dotted"
    }
  }
}

var styleHelper = function(selector, style) {
  return {
    selector: selector,
    style: style
  }
}

$(function() {

  window.cyto = cytoscape({
    container: $("#cyto"),
    boxSelectionEnabled: false,
    autounselectify: true,
    layout: layoutOptions,
    style: [
      // order of the style definitions are how styles are applied
      styleHelper("node", graphStyles.node.default),
      styleHelper("edge", graphStyles.edge.default),
      styleHelper(".edgeGhost", graphStyles.ghostEdge.default),
      styleHelper(".edgeIsolate", graphStyles.edge.isolate),
      styleHelper(".nodeStart", graphStyles.node.start),
      styleHelper(".nodeMiddle", graphStyles.node.middle),
      styleHelper(".nodeEnd", graphStyles.node.end),
      styleHelper(".nodeStartBig", graphStyles.node.startBig),
      styleHelper(".nodeMiddleBig", graphStyles.node.middleBig),
      styleHelper(".nodeEndBig", graphStyles.node.endBig),
      styleHelper(".nodeEnter", graphStyles.node.enter),
      styleHelper(".nodeEnterActive", graphStyles.node.enterActive),
      styleHelper(".nodeInvalidate", graphStyles.node.invalidate),
      styleHelper(".nodeInvalidateActive", graphStyles.node.invalidateActive),
      styleHelper(".nodeInvalidateDone", graphStyles.node.invalidateDone),
      styleHelper(".nodeIsolate", graphStyles.node.isolate),
      styleHelper(".nodeIsolateInvalidate", graphStyles.node.isolateInvalidate),
      styleHelper(".nodeValueChanged", graphStyles.node.valueChanged)
    ]
  });
  window.getGraph = new GraphAtStep(log);
  window.graph = getGraph.atStep(getGraph.maxStep);
  console.log(graph);

  getGraph.enterExitEmpties.map(function(i) {
    $("#timeline-bg").append(`<div class=\"timeline-enterexit\" style=\"left: ${100 * i / log.length}%;\"></div>`)
  })
  getGraph.queueEmpties.map(function(i) {
    $("#timeline-bg").append(`<div class=\"timeline-cycle\" style=\"left: ${100 * i / log.length}%;\"></div>`)
  })

  function updateProgressBar() {
    $("#timeline-fill").width((curTick / log.length * 100) + "%");
  }
  function updateLogItem() {
    $("#instructions").text(JSON.stringify(log[curTick], null, "  "));
  }
  $('#timeline').on('mousedown mousemove', function(e) {
    // Make sure left mouse button is down.
    // Firefox is stupid; e.which is always 1 on mousemove events,
    // even when button is not down!! So read e.originalEvent.buttons.
    if (typeof(e.originalEvent.buttons) !== 'undefined') {
      if (e.originalEvent.buttons !== 1)
        return;
    } else if (e.which !== 1) {
      return;
    }

    var timeline = e.currentTarget;
    var pos = e.pageX || e.originalEvent.pageX; // pageX in pixels
    var width = timeline.offsetWidth; // width in pixels
    var targetStep = Math.max(Math.round((pos/width) * log.length), 1);
    if (targetStep != curTick) {
      window.curTick = targetStep;
      updateGraph()
    }
    return;
  });


  updateGraph = function() {
    getGraph.displayAtStep(curTick, cyto);
    updateProgressBar()
    updateLogItem()
  }

  updateGraph.nextTick = function() {
    window.curTick += 1
    updateGraph()
  }
  updateGraph.prevTick = function() {
    window.curTick -= 1
    updateGraph()
  }
  updateGraph.nextStep = function() {
    // Move one step ahead (skipping unneccessary steps)
    window.curTick = getGraph.nextStep(curTick)
    updateGraph()
  }
  updateGraph.prevStep = function() {
    // Move one step back
    window.curTick = getGraph.prevStep(curTick)
    updateGraph()
  }

  updateGraph.nextEnterExitEmpty = function() {
    // move to queue empty
    for (var i = 0; i < getGraph.enterExitEmpties.length; i++) {
      val = getGraph.enterExitEmpties[i] - 1;
      if (curTick < val) {
        window.curTick = val;
        updateGraph();
        return true;
      }
    }
    return false;
  }
  updateGraph.prevEnterExitEmpty = function() {
    // move to queue empty
    for (var i = getGraph.enterExitEmpties.length - 1; i >= 0; i--) {
      val = getGraph.enterExitEmpties[i];
      if (curTick > val) {
        window.curTick = val;
        updateGraph();
        return true;
      }
    }
    return false;
  }
  updateGraph.lastEnterExitEmpty = function() {
    window.curTick = getGraph.enterExitEmpties[getGraph.enterExitEmpties.length - 1] || 0;
    updateGraph()
  }
  updateGraph.firstEnterExitEmpty = function() {
    window.curTick = getGraph.enterExitEmpties[0] || 0;
    updateGraph()
  }



  updateGraph.nextQueueEmpty = function() {
    // move to queue empty
    for (var i = 0; i < getGraph.enterExitEmpties.length; i++) {
      val = getGraph.queueEmpties[i];
      if (curTick < val) {
        window.curTick = val;
        updateGraph();
        return true;
      }
    }
    return false;
  }
  updateGraph.prevQueueEmpty = function() {
    // move to queue empty
    for (var i = getGraph.queueEmpties.length - 1; i >= 0; i--) {
      val = getGraph.queueEmpties[i];
      if (curTick > val) {
        window.curTick = val;
        updateGraph();
        return true;
      }
    }
    return false;
  }
  updateGraph.lastQueueEmpty = function() {
    window.curTick = getGraph.queueEmpties[getGraph.queueEmpties.length - 1] || 0;
    updateGraph()
  }
  updateGraph.firstQueueEmpty = function() {
    window.curTick = getGraph.queueEmpties[0] || 0;
    updateGraph()
  }

  window.curTick = 1
  updateGraph.nextEnterExitEmpty()

  $("#startStepButton").click(updateGraph.firstEnterExitEmpty)
  $("#endStepButton").click(updateGraph.lastEnterExitEmpty)
  $("#prevCycleButton").click(updateGraph.prevEnterExitEmpty)
  $("#nextCycleButton").click(updateGraph.nextEnterExitEmpty)
  $("#prevStepButton").click(updateGraph.prevStep)
  $("#nextStepButton").click(updateGraph.nextStep)
  $(document.body).on("keydown", function(e) {
    if (e.which === 39 || e.which === 32) { // space, right
      if (e.altKey) {
        if (e.shiftKey) {
          // option + shift + right
          if (updateGraph.nextQueueEmpty()) {
            return;
          }
          // if it can't go right, try a cycle
        }
        // option + right
        // return false if there is no more enter/exit empty marks
        if (updateGraph.nextEnterExitEmpty()) {
          return;
        }
        // if it cant go right, try a step
      } else if (e.shiftKey) {
        // shift + right
        updateGraph.nextTick();
        return;
      }
      if (curTick < getGraph.maxStep) {
        // right
        updateGraph.nextStep();
        return;
      }
    }
    if (e.which === 37) { // left
      if (e.altKey) {
        if (e.shiftKey) {
          // option + shift + left
          if (updateGraph.prevQueueEmpty()) {
            return;
          }
          // if can't go left, try cycle
        }
        // option + left
        if (updateGraph.prevEnterExitEmpty()) {
          return;
        }
        // if can't go left, try step
      } else if (e.shiftKey) {
        // shift + left
        updateGraph.prevTick()
        return;
      }
      if (curTick > 1) {
        // left
        updateGraph.prevStep()
        return;
      }
    }
    if (e.which === 35) { // end
      // Seek to end
      updateGraph.lastEnterExitEmpty()
      return;
    }
    if (e.which === 36) { // home
      // Seek to beginning
      updateGraph.firstEnterExitEmpty();
      return;
    }
  });


});
