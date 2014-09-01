/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

// If you use this as a template, replace IBM Corp. with your own name.

// Sample Node-RED node file

// Require main module

module.exports = function(RED) {
    "use strict";

    var util = require("util");
    var fs =  require('fs');

    if (!fs.existsSync("/dev/spidev0.0")) { // unlikely if not on a Pi
        throw "Info : pilote spi non activé.";
    }
// implémentation de mcp3008.js
    var device = '/dev/spidev0.0';
    var SPI = require ('spi');
    var spi;
    var channels = [];
// lit l'interface spi
    function read(mode,callback) {
      if (spi === undefined) {return;};
      var txBuf = new Buffer([1,mode,0]);
      var rxBuf = new Buffer([0,0,0]);
      
      spi.transfer(txBuf,rxBuf,function(dev,buffer) {
        var value = ((buffer[1] & 3)<< 8) + buffer[2];
        callback(value);
      });
    };
    
// démarre un poller
    function startPoll (mode,callback) {
      var channel = ( mode >>4) & 7;
      channels[channel].poller = setInterval(function () {read(mode,callback)},
        channels[channel].timeout);
    };
    
// arrête un poller
    function stopInstance(instance) {
      if (instance != undefined ) {
        clearInterval(instance.poller);
      }
    };
    
    var mcp3008so = function(dev) {
      device = dev || device;
      console.log(device,'dev');
      spi = new SPI.Spi(device,[],function (s){s.open();});
      console.log('peche');
      this.read = read;
      this.poll = function (mode,duration,callback){
        var channel = ( mode >>4 ) & 7;
        channels[channel] = {'timeout': duration};
        startPoll(mode,callback);
      };
      this.stop = function (mode) {
        var channel = ( mode >> 4 ) & 7;
        var instance = channels [channel];
        stopInstance(instance);
        channels[channel] = undefined;
      };
      this.close = function () {
        for (var i in channels) {
          var instance = channels[i];
          stopInstance(instance);
          channels[i] = undefined;
        };
        spi.close();
      };
      
    };
    
    function Mcp3008Node(n) {
      RED.nodes.createNode(this,n);
      this.device = n.device; // du champ device du html
      this.mode = n.mode; // du champ mode
      this.interval = n.interval; // du champ interval, si interval=0 alors pas de répétition
      
      // 
      var node = this;
      
      var mcp = new mcp3008so(node.device);
      console.log(util.inspect(node),util.inspect(mcp));
      node.status({fill:"red",shape : "ring",text : "pollstop"})
      node.on("close",function(){
        mcp.close();
      });
      node.on("input",function(msgfrom) {
        if (msgfrom.payload=="start") {
          if (node.interval==0) {
            mcp.read(node.mode,function(value){
              msg.payload = value;
              node.send(msg);
            });
          } else {
            mcp.poll(node.mode,node.interval,function(value){
              msgfrom.payload = value;
              node.send(msgfrom);
            });
            node.status({fill:"green",shape : "dot",text : "pollstart"});
          };
        }
        else
        {
          if (msgfrom.payload=="stop") {
            mcp.stop(node.mode);
            node.status({fill:"red",shape : "ring",text : "pollstop"})
          }
        }
      });
    } // fin function MCP3008
    console.log('tete');
    RED.nodes.registerType("mcp3008",Mcp3008Node);
}
