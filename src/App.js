import React,{Component} from 'react';
import './App.css';
import io from "socket.io-client";
// import Peer from 'peer';
var Peer = require('peerjs');
var socket;
class App extends Component {
  
  state = {
    register : false,
    whcode:"",
    placeholder:"Enter wormhole"
  }

  componentDidMount(){
        var mypeers = [];
        var room;
        var myid;
        socket = io.connect("https://pure-thicket-48071.herokuapp.com/");
        let urlParams1 = new URLSearchParams(window.location.search);
        let myParam1 = urlParams1.get('roomid');
        socket.on("left",(id)=>{
            console.log("bropooooooo dead b rrrroooooooo")
            var deadpeer=mypeers.find(x=>x.peer=id);
            console.log(deadpeer);
            deadpeer.close();
            if(deadpeer.rendered){
                document.getElementById(id).remove();
            }
        });
        socket.on('connect', () => {
          console.log("Connected");
          // socket.emit("joinroom",myParam1);
          this.autoadd();
          socket.on("wherror1",(val) => {
            console.log("error")
            this.setState({placeholder:"Try again",whcode:""})
          })

          socket.on("whredirect",(val) => {
            let obj={
              whcode: val.whcode,
              timestamp : +new Date()
            };
            localStorage.setItem(val.url,JSON.stringify(obj));
            console.log("redirect","?roomid="+val.url);
            window.top.location.href= val.url;
            // window.location.href = "?roomid="+val.url;
          })
          
          socket.on('userstat',(val)=>{
              room=val;
              console.log(room);
              const peer = new Peer.peerjs.Peer({
                  path: "/peer",
                  host:"pure-thicket-48071.herokuapp.com",
                  port:443,
                  config: {
                      'iceServers': [{
                          url: 'stun:stun.l.google.com:19302'
                      }]
                  }
              }, {
                  debug: 2
              });
              peer.on("connection", (c) => {
                  mypeers.push(c);
                  console.log(c);
                  console.log("pushed");
                  c.on('data', function (data) {
                      console.log("hit");
                      console.log(data);
                  });

                  console.log("gonnna call ==============")
                  callPeer(c.peer);
              });
              peer.on('open', (id) => {
                  console.log("id generated");
                  peer.ids = id;
                  myid = id;
                  // sel(".head").innerHTML = id;
                  console.log(id)
                  socket.emit("signal", {
                      room,
                      id
                  });
              });

              function callPeer(id) {
                  console.log(id + "call");
                  var call;
                  navigator.mediaDevices.getUserMedia({
                      audio: true,
                      video:true
                  }).then((stream) => {
                      call = peer.call(id, stream);
                      call.on('stream', (stream) => {
                          console.log("========")
                          console.log(mypeers);
                          console.log(id);
                          console.log("========")
                          let selectpeer=mypeers.find(x=>x.peer==id);
                          if("rendered" in selectpeer){
                              return;
                          }
                          selectpeer.rendered=true;
                          console.log("received stream answered");
                          var video = document.createElement("video");
                          video.id=id;
                          video.srcObject = stream;
                          let di = document.createElement("div");
                          di.classList.add("cover");
                          di.appendChild(video);
                          sel("#wrapper").appendChild(di);
                          video.play();
                      });

                  }).catch((e)=>{
                    console.log(e);
                  })
              }
              peer.on('call', function (call) {
                  console.log("&&&&&&&&&&&&&&");
                  navigator.mediaDevices.getUserMedia({
                      audio: true,
                      video:true
                  }).then((stream) => {
                      call.answer(stream);
                      call.on('stream', function (stream) {
                          let selectpeer=mypeers.find(x=>x.peer==call.peer);
                          if("rendered" in selectpeer){
                              return;
                          }
                          selectpeer.rendered=true;
                          console.log("+++++++++++++++++++=");
                          console.log(stream,call);
                          console.log("received stream");
                          var video = document.createElement(
                              "video");
                              video.id=call.peer;
                          video.srcObject = stream;
                          console.log("appended");
                          let di = document.createElement("div");
                          di.classList.add("cover");
                          di.appendChild(video);
                          sel("#wrapper").appendChild(di);
                          video.play();
                      });
                      call.on('close',()=>{
                          console.log("************");
                          console.log(arguments);
                      });
                  }).catch((e)=>{
                    console.log(e);
                  })
              });
              peer.on('data', function (data) {
                  console.log("hittedma"+data);
              });


              socket.on("signalnewclient", (d) => {
                  console.log(d + "signalled");
                  if (d == peer.ids) {
                      console.log("hit oops");
                      return;
                  }
                  var conn = peer.connect(d, {
                      reliable: true
                  });
                  console.log("peer added");
                  conn.on('open', function () {
                      console.log("connectedtopeer");
                      console.log(conn);
                      mypeers.push(conn);
                      console.log("pushed to no of peers");
                      conn.on('data', function (data) {
                          console.log("hittedma"+data);
                      });
                      console.log("destory set")

                  });
              });             
          });           
        });
  function sel(d){
    return document.querySelector(d);
   }      
}

  autoadd = () => {
    let urlParams1 = new URLSearchParams(window.location.search);
    let myParam1 = urlParams1.get('roomid');
    let obj =localStorage.getItem(myParam1);
    if(obj){
      obj = JSON.parse(obj);
      if(obj.timestamp + 60000 >= +new Date()){
        socket.emit("joinproom",{url:myParam1,whcode:obj.whcode});
      }
    }
  }
  handleCreate = () => {
    console.log("create")
    let urlParams1 = new URLSearchParams(window.location.search);
    let myParam1 = urlParams1.get('roomid');
    let obj = {
      url: myParam1,
      whcode: this.state.whcode
    };
    socket.emit("createproom",obj);
  }

  handleJoin = () => {
    console.log("join")
    let urlParams1 = new URLSearchParams(window.location.search);
    let myParam1 = urlParams1.get('roomid');
    let obj = {
      url: myParam1,
      whcode: this.state.whcode
    };
    console.log(socket);
    socket.emit("joinproom",obj);
  }
  handlePub = () =>{
    console.log("public")
    let urlParams1 = new URLSearchParams(window.location.search);
    let myParam1 = urlParams1.get('roomid');
    socket.emit("joinroom",myParam1);
  }
  renderRegister = () => {
    return(
      <div style={styles.main}>
        <h2 className="bold" style={{fontSize:"2em"}}>Findr</h2>
        <input className="form-control" type="text" placeholder={this.state.placeholder} style={{margin:"20px"}} onChange={(e) => this.setState({whcode: e.target.value})} value={this.state.whcode} />
        <div style={styles.sub}>
          <button className="btn btn-default bold custom" onClick={this.handleCreate}> Create </button>
          <button className="btn btn-default bold custom" onClick={this.handleJoin}> Join </button>
        </div>
        <div style={styles.public}>
          <button className="btn btn-default bold custom" onClick={this.handlePub}>Public</button>
        </div>
        <div>
        <div id="wrapper" >
        
        </div>
  
        <div id="wrapper1">
  
        </div>
      </div>

      </div>
    )
  }

  renderJoin = () => {
    return(
        <div></div>
    )

  }
  render(){

    return (
      <div > 
        {this.renderRegister()}
      </div>
  
    );

  }
  
}

export default App;

const styles = {
  main:{
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"center",
    // width:"70%",
    // margin:"0, auto"
  },
  sub:{
    display:"flex",
    flexDirection:"row",
    width:"50%",
    alignItems:"center",
    justifyContent:"space-around"
  },
  public:{
    margin: "20px"
  }
}
