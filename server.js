//Server for API call to Db2 database
//@author Andrew Laidlaw
//@version 1.0

var express=require('express');
var app=express();
var path=require('path');
var bodyParser=require('body-parser');
const ibmdb = require('ibm_db');
const async = require('async');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Pull in environment variables
const DB_DATABASE = process.env.db_database;
const DB_HOSTNAME = process.env.db_hostname;
const DB_PORT = process.env.db_port;
const DB_UID = process.env.db_uid;
const DB_PWD = process.env.db_pwd;
const DB_SCHEMA = process.env.db_schema;

// Setup the endpoint for the Db2 database we are connecting to
let connStr = "DATABASE="+process.env.DB_DATABASE+";HOSTNAME="+process.env.DB_HOSTNAME+";PORT="+process.env.DB_PORT+";PROTOCOL=TCPIP;UID="+process.env.DB_UID+";PWD="+process.env.DB_PWD+";";


// Basic healthcheck endpoint
app.get('/healthz', function(request, response) {
  console.log('Healthcheck');
  response.send('ok');
})

// Simple JSON response for base service
app.get('/', function(request, response) {
  console.log('Request for /');
  response.json({success:1, message:'service running'});
})

// Get all the productions with the requested character
// Request should be of form <hostname>:8080/getFilmsWithChar?id=<character name>
app.get('/getFilmsWithChar', function(request, response) {
  console.log("Request for /getFilmsWithChar with character name "+request.query.id);

  ibmdb.open(connStr, function (err,conn) {
    if (err){
      console.log(err);
      return response.json({success:-1, message:err});
    }
    //conn.query("SELECT PRIMARY_TITLE FROM "+process.env.DB_SCHEMA+".TITLES A, "+process.env.DB_SCHEMA+".PRINCIPALS B WHERE A.TCONST = B.TCONST and CHARACTERS LIKE '%"+request.query.id+"%';", function (err,data) {
    conn.query("SELECT t.PRIMARY_TITLE,t.TITLE_TYPE FROM "+process.env.DB_SCHEMA+".TITLES t LEFT JOIN "+process.env.DB_SCHEMA+".PRINCIPALS p ON t.TCONST = p.TCONST WHERE p.CHARACTERS LIKE INITCAP('%"+request.query.id+"%');", function (err,data) {
        
    if (err){
        console.log(err);
        return response.json({success:-2,message:err});
      }
      conn.close(function () {
        //console.log(data);
          var result=data.filter( element => element.TITLE_TYPE =="movie");
          if (result.length == 0)
              result=data.filter( element => element.TITLE_TYPE =="video");
          if (result.length == 0)
              result={success:-2,message:"No data foundd for this search"};
        console.log("query complete");
        console.log (result);
        return response.json({data:result});
      });
    })
  })
})

// Get principal actors in given film
// Request should be of form <hostname>:8080/getActorsInFilm?id=<film name>
app.get('/getActorsInFilm', function(request, response) {
  console.log("Request for /getActorsInFilm for film called "+request.query.id);
  ibmdb.open(connStr, function (err,conn) {
    if (err){
      console.log(err);
      return response.json({success:-1, message:err});
    }
    //conn.query("SELECT A.PRIMARY_NAME, B.CHARACTERS FROM "+process.env.DB_SCHEMA+".NAME A, PRINCIPALS B, TITLES C WHERE B.TCONST = C.TCONST AND A.NCONST = B.NCONST AND C.TITLE_TYPE='movie' AND B.CHARACTERS!=' ' AND C.PRIMARY_TITLE LIKE '%"+request.query.id+"%';", function (err,data) {
    conn.query("SELECT A.PRIMARY_NAME, B.CHARACTERS FROM "+process.env.DB_SCHEMA+".NAME A, PRINCIPALS B, TITLES C WHERE B.TCONST = C.TCONST AND A.NCONST = B.NCONST AND C.TITLE_TYPE='movie' AND B.CHARACTERS!=' ' AND C.PRIMARY_TITLE LIKE '%"+request.query.id+"%';", function (err,data) {
      if (err){
        console.log(err);
        return response.json({success:-2,message:err});
      }
      conn.close(function () {
        console.log("Response provided");
        return response.json({data:data});
      });
    })
  })
})

// Get career history for given actor
// Request should be of form <hostname>:8080/getCareerHistory?id=<actor>
app.get('/getCareerHistory', function(request, response) {
  console.log("Request for /getCareerHistory for actor called "+request.query.id);
  ibmdb.open(connStr, function (err,conn) {
    if (err){
      console.log(err);
      return response.json({success:-1, message:err});
    }
    //conn.query("SELECT PRIMARY_TITLE, CHARACTERS, TITLE_TYPE, START_YEAR, AVERAGE_RATING, NUM_VOTES FROM "+process.env.DB_SCHEMA+".NAME A, PRINCIPALS B, TITLES C, RATINGS D WHERE B.TCONST = C.TCONST AND C.TCONST = D.TCONST AND A.NCONST = B.NCONST AND CHARACTERS!=' ' AND PRIMARY_NAME LIKE '%"+request.query.id+"%';", function (err,data) {
    var ident;
    ident=conn.querySync("SELECT n.NCONST FROM NAME n WHERE n.BIRTH_YEAR IS NOT NULL AND n.PRIMARY_NAME LIKE INITCAP ('"+request.query.id+"')");

    console.log ("stringify:"+JSON.stringify(ident));
    var realident=ident[0].NCONST;
    console.log (realident);
      
    conn.query("SELECT t.PRIMARY_TITLE, p.CHARACTERS, t.TITLE_TYPE, t.START_YEAR, r.AVERAGE_RATING, r.NUM_VOTES FROM PRINCIPALS p JOIN RATINGS r ON p.TCONST = r.tconst JOIN titles t ON p.TCONST = t.tconst WHERE p.NCONST = '"+realident+"';", function (err,data) {
      if (err){
        console.log(err);
        return response.json({success:-2,message:err});
      }

//      console.log(data);
      
      conn.close(function () {
          console.log("query complete");
          var result=data.filter( element => element.TITLE_TYPE =="movie");
          if (result.length == 0)
              result=data.filter( element => element.TITLE_TYPE =="video");
          if (result.length == 0)
              result={success:-2,message:"No data foundd for this search"};
  //        if (result.length > 2) {
  //            result=result.splice(2,2);
  //        }
          result=data.filter( element => element.START_YEAR ==1983 && element.NUM_VOTES==40);
          var text=JSON.stringify(result);
          text=text.replace(/!/g,"");
          result=JSON.parse(text);
          console.log(result);
          return response.json({data:result});
 //         return response.json({data:data});
      });     //conn.close
    })        // conn.query    
  })          // ibmdb.open
})            // app.get

// Start the server listening for clients
app.listen(8080, function(){
    console.log("Server is listening on port 8080");
    console.log('Connection string is: '+connStr)
})
