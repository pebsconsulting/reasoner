/**
 * Created by fabrizio.invernizzi@telecomitalia.it on 21/10/14.
 */

var NETWORK_DEFINITION = "./demoNet.json";
var RTT_CAPABILITY = "mean.rtt";

var network=require("./network.js")
    ,_ = require("lodash")
    ,graphLib = require("graphlib")
    ,ip = require("ip");

motd();
// Process name for ps
process.title = "mPlane reasoner";

// Maps a subnet to network name(that is the label/id of nodes in netGraph)
var __subnetIndex = {};
// Index of usefull probes known from supervisor, indexed by subnet
// TODO: populate it from supervisor
// TODO: constraints!
var __probes ={
    "192.168.123.0/26":{
        "pinger TI":[RTT_CAPABILITY]
    }
}

var netDef = network.importFromJson(NETWORK_DEFINITION);
if (!netDef){
    console.error("Error reading from network definition file");
    process.exit();
}

// Import networks/gateways to generate a graph representation
var netGraph = new graphLib.Graph({ directed: false});
// Graph label
netGraph.setGraph("mPlane DEMO NET");
// Graph nodes
_.each(netDef.networks , function(net , netName){
    netGraph.setNode(netName , net.description);
    if (net.subnet == network.UNSPECIFIED_NET)
        __subnetIndex[network.UNSPECIFIED_NET] = netName; //INDEXED
    else
        __subnetIndex[ip.cidr(net.subnet)] = netName; //INDEXED
});
// add edges for /32 subnets. These nets should have only 1 gw
_.each(netDef.networks , function(net , netName){
    var netInfo = ip.cidrSubnet(net.subnet)
    if (netInfo.subnetMaskLength == 32){
        console.log("--------------------");
        console.log(net);
        var gw = netDef.gateways[net.gateways[0]]; // Default gw of the host
        console.log(gw);
        for (var i=0; i<gw.IPs.length;i++) {
            if (netInfo.networkAddress != ip.cidr(gw.IPs[i])){
                console.log(__subnetIndex[ip.cidr(gw.IPs[i])] + " <-> " + net.gateways[0])
                netGraph.setEdge(netName, __subnetIndex[ip.cidr(gw.IPs[i])] , net.gateways[0]);
            }
        }
    }
});

// Graph edges from gateways
// Edges are identified using subnets
_.each(netDef.gateways , function(gw , gwName){
    for (var i=0; i<gw.IPs.length ; i++){
        for (var j=i+1; j<gw.IPs.length;j++){
            // Subnet is the id of the node
            // We use the GW name as label of the edge
            netGraph.setEdge(__subnetIndex[ip.cidr(gw.IPs[i])] , __subnetIndex[ip.cidr(gw.IPs[j])] , gwName );
        }
    }
});

// Spanning tree , Dijstra tree from internet. All edge has the same weigth
// TODO: use measure to change node weihtght?
var spanTree = graphLib.alg.prim(netGraph, function(){return 1;});
var dijkstraTree = graphLib.alg.dijkstra(netGraph, "internet" , function(){return 1;});


console.log(dijkstraTree)
/*
{ serviceNet: { distance: 2, predecessor: 'internetUplink' },
    internetUplink: { distance: 1, predecessor: 'internet' },
    internet: { distance: 0 },
    userAccess: { distance: 2, predecessor: 'internetUplink' } }
*/

function motd(){
    console.log();
    console.log();
    console.log("    ###########################################");
    console.log("    ###$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$##");
    console.log("    ##$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$##");
    console.log("    ##$$$$$$$$$$$$$      $$$$$$$$$$$$$$$$$$$$##");
    console.log("    ##$$$$$$$$$$   ;$$$$   $$$$$$       $$$$$##");
    console.log("    ##$$$$$$$$   $$$$$$$$  $$$$   $$$$$  $$$$##");
    console.log("    ##$$$$$$   $$$$$$$$$$!      $$$$$$$   $$$##");
    console.log("    ##$$$$   $$$$$$$$$$$$$$  $$$$$$$$$$$  $$$##");
    console.log("    ##$$$  $$$$$$$$$$$$$$$$$$$$$$$$$$$$$  $$$##");
    console.log("    ##$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$##");
    console.log("    ###$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$##");
    console.log("    ###########################################");

    console.log();
    console.log("               mPlane REASONER ");
    console.log();
    console.log("    An Intelligent Measurement Plane for Future \n         Network and Application Management");
    console.log();
    console.log();
}