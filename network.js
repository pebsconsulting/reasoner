/**
 * Created by invernizzi on 21/10/14.
 *
 * Network object representation and utility functions
 */



/**
 *
 * @param config
 *      subnet a string representation of the subnet associated to the network (a.b.c.d/x)
 *      description Text descripbing the net
 *      name net name
 *      gateways: array of gateways communicate con external nets.
 *          Each gateway is a json with
 *          {gwIP, extIP}, where gwIP of the router( should belong to subnet), extIP is the external IP directly connected
 *
 * @constructor
 */

var ip = require('ip'),
    fs = require('fs');

exports.Network = function(config){
    this.subnet = config.subnet || null;
    this.name = config.name || null;
    var self = this;
    // For each gws check that at least an IP is onNet
    if (config.gateways){
        config.gateways.forEach(function(gw , index){
            if (!(gw.ipOnSubnet(self.subnet))){
                throw new Error("Error adding routers "+gw.hostName+" to network "+self.subnet+": no interfaces on net");
            }
        });
    }
    this.gws = config.gateways || null;
    this.links = config.links || null;
}
/**
 * A gateway is a router with 2 IPs able to interconnect at IP level the 2 IP.
 * @param config
 *  IPs: array of IPs assigned to the gateway
 *  hostName: the name of the host
 */
exports.Gateway = function(config){
    if (Array.isArray(config.IPs))
        this.IPs = config.IPs;
    else
        this.IPs = [];

    this.hostName = config.hostName || "";
    // Utility function for checking which, if any, of my IPs is on subnet
    this.ipOnSubnet = function(subnet){
        for (var i=0 ; i<IPs.length; i++){
            if (ip.cidr(this.IPs[i]) === ip.cidr(subnet))
                return this.IPs[i];
        }
        return null;
    }
}

/**
 * * A Link between 2 routers
 * The routers should have one of the IPs on the same subnet or the IPa and IPb will be null
 * @param gatewayA
 * @param gatewayB
 */
exports.Link = function(gatewayA , gatewayB , label){
    this.IPa = null;
    this.IPb = null;
    this.label = label || "";
    // Looks for a couple of IP in the same subnet
    if (ip.cidr(gatewayA.IPa) === ip.cidr(gatewayB.IPa)){
        this.IPa = gatewayA.IPa;
        this.IPb = gatewayB.IPa;
    }
    if (ip.cidr(gatewayA.IPa) === ip.cidr(gatewayB.IPb)){
        this.IPa = gatewayA.IPa;
        this.IPb = gatewayB.IPb;
    }
    if (ip.cidr(gatewayA.IPb) === ip.cidr(gatewayB.IPa)){
        this.IPa = gatewayA.IPb;
        this.IPb = gatewayB.IPa;
    }
    if (ip.cidr(gatewayA.IPb) === ip.cidr(gatewayB.IPb)){
        this.IPa = gatewayA.IPb;
        this.IPb = gatewayB.IPb;
    }
    if (this.IPa === null || this.IPb === null)
        throw new Error("Error creating a link between router "+gatewayA.hostName + " and " + gatewayB.hostName);
}

exports.importFromJson = function(fileName){
    var definitions;
    try {
        definitions = JSON.parse(fs.readFileSync(fileName));
    }
    catch (err) {
        console.log('There has been an error parsing the fileName file '+fileName)
        console.log(err);
        process.exit();
    }
    console.log(definitions);
}
