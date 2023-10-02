import { five, Circle } from "./Shapes/shapes";
import express, { Request, RequestHandler, Response } from "express";
import NodeCache from "node-cache"; 

import { testFile } from "./scripts/files";
//import { testInsert, testGet, testDelete, testSelect} from "./db/test";
import { time } from "console";
import mysql from 'mysql2';
import { connection, deleteGuests } from "./db/database";
import {sendJson, updateDefFields} from './scripts/Response';

import {connectCache, connectRoutes } from "./scripts/connect";
import { sims } from "./Shapes/routes";

import path from "path";
import { shapeLandRoutes } from "./ShapeLand/routes";

console.log('starting...');


const cache = new NodeCache();

const serverStartTime = Date.now();

cache.set('circle', new Circle(5,5,5));



connectCache(cache);
cache.set<number>('num_users', 0);
cache.set<number>('nsecs', 0); // nsecs
cache.set<number>('ncalls', 0);

/*const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test',
});*/

//https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server
//use mysql2 instead of mysql

/*
connection.connect(function(err){
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
      }
     
      console.log('connected as id ' + connection.threadId);
});*/



const app = express();

const server = app.listen(3001);

app.use(express.static('app'));

app.get('/app', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'app', 'index.html'));
});

app.set('view engine', 'pug');

type Params = {};
type ResBody = {};
type ReqBody = {};
type ReqQuery = {
    query: string;
}

setInterval(() => {
    const ns:number = cache.get('nsecs');
    cache.set('nsecs', ns+1);
}, 1000);

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    //console.log('setting headers');
    next();
});

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

//server times
app.use(function(req:Request, res:Response, next){
    updateDefFields(req);
    next();
});

app.use(function(req:Request, res:Response, next){
    const ncalls:number = cache.get('ncalls');
    //console.log('calls:', ncalls);
    cache.set('ncalls', ncalls+1);
    next();
});

let user = null;
//user verification
app.use(function (req, res, next) {
    if('user' in req.params){
        console.log('has user: '+req.params.user);
        user = req.params.user;
    }
    next();
});

app.get('/', (req: Request, res:Response) => {
    const circle:Circle = cache.get('circle');
    //for(let i = 0; i<100000000; ++i){

    //}
    sendJson(res, {five: five, circle: circle.toJson()});
    circle.next();
    cache.set('circle', circle);
});

app.post('/test', (req, res) => {
    console.log('testing');
    res.json({});
})
/*
app.post('/connect', (req: Request, res:Response) => {
    //console.log('body:'+req.body);
    //console.log('params:'+req.params);
    connect(req, res, connection, cache);
    //res.json({});
});

app.post('/disconnect', (req: Request, res:Response) => {
    disconnect(req, res, connection, cache);
});

app.post('/check', (req: Request, res:Response) => {
    serverCheck(req, res, connection, cache);
});

app.post('/renameuser', (req: Request, res:Response) => {
    renameUser(req, res, connection, cache);
});

app.get('/index', (req: Request, res:Response) => {
    res.render('index.pug', {n: 'hi'})   
});*/

connectRoutes(app, cache);

sims(app, cache);

shapeLandRoutes(app, cache);


class ZeroToFour{
    val: number;
    dir: boolean;
    constructor(){
        this.val = 0;
        this.dir = true;
    }
    next(){
        if(this.dir){
            if(this.val > 3){
                this.dir = false;
                this.val = 3;
            }else{
                this.val++;
            }
        }else{
            if(this.val < 1){
                this.dir = true;
                this.val = 1;
            }else{
                this.val--;
            }
        }
    }
}
cache.set<ZeroToFour>('0t4', new ZeroToFour());

app.get('/oneToFive', (req: Request, res:Response) => {
    const ot5:ZeroToFour = cache.get('0t4');
    res.json({value: ot5.val});
    ot5.next();
    cache.set('0t4', ot5);
});
/*
connection.end(function(err){
    console.log('connection end');
});*/