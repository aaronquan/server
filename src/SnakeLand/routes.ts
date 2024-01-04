import {sendJson} from '../scripts/Response';
import NodeCache from "node-cache"; 
import { SnakeLandServer, SnakeLandServerManager } from './server';

const tickTime = 32;
const snakeLandServerManager = new SnakeLandServerManager();

setInterval(() => {
    snakeLandServerManager.updateServers();
}, tickTime);

function initTestServer(){
    snakeLandServerManager.startServer('test');
}

function initSnakeLand(cache:NodeCache){
    const game = new SnakeLandServer();
    //const gameUpdates = new ShapeLandUpdater();
    /*const save = () => {
        cache.set<SnakeLandServer>('snakeland', game);
    }
    game.init(save);*/

    //cache.set<ShapeLandServer>('shapeland', game);
    //cache.set<ShapeLandUpdater>('shapelandupdates', gameUpdates);
}

export function snakeLandRoutes(app:any, cache:NodeCache){
    //if(!cache.has('shapeland')){
    //    initSnakeLand(cache);
    //}
    initTestServer();


    // expects {serverName: 'servername', playerName?: 'playername'}
    app.post('/startSnakeLandServer', (req:any, res:any) => {
        let success = false;
        if(req.body.serverName){
            snakeLandServerManager.startServer(req.body.serverName, req.body.playerName);
            success = true;
        }
        const serversInfo = snakeLandServerManager.getServersInfo();
        sendJson(res, {servers: serversInfo});
    });

    app.post('/closeSnakeLandServer', (req:any, res:any) => {
        if(req.body.serverName){
            snakeLandServerManager.closeServer(req.body.serverName);
        }
        const serversInfo = snakeLandServerManager.getServersInfo();
        sendJson(res, {servers: serversInfo});
    });

    app.get('/getSnakeLandServers', (req:any, res:any) => {
        const serversInfo = snakeLandServerManager.getServersInfo();
        sendJson(res, {servers: serversInfo});
    });

    // expects {serverName: 'servername', playerName: 'playername'}
    //TODO send init player data
    app.post('/connectSnakeLandServer', (req:any, res:any) => {
        let success = false;
        if(req.body.serverName && req.body.playerName){
            success = snakeLandServerManager.connectPlayerServer(req.body.serverName, req.body.playerName);

        }
        sendJson(res, {success: success});
    });

    // expects {serverName: 'servername', playerName: 'playername'}
    app.post('/disconnectSnakeLandServer', (req:any, res:any) => {
        let success = false;
        if(req.body.serverName && req.body.playerName){
            success = snakeLandServerManager.disconnectPlayerServer(req.body.serverName, req.body.playerName);
        }
        sendJson(res, {success: success});
    });

    //  {servername: 'sn', playerName?: }
    app.get('/getSnakeLandServer', (req:any, res:any) => {
        if(req.query.serverName){
            const serverInfo = snakeLandServerManager.getServerInfo(req.query.serverName);
            sendJson(res, {serverInfo: serverInfo});
        }
        sendJson(res, {});
    });

    //  {servername: 'sn', playerName: , playerdata:}
    app.post('/updateGetSnakeLandServer', (req:any, res:any) => {
        const serverName = req.body.serverName;
        const playerName = req.body.playerName;
        //let sendData = [];
        if(serverName && playerName && req.body.playerData){
            snakeLandServerManager.updatePlayer(serverName, playerName, req.body.playerData);
            const sendData = snakeLandServerManager.getSendSnakeData(serverName, playerName);
            sendJson(res, {success: true, ...sendData});
        }else{
            sendJson(res, {success: false});
        }
        /*
        let serverInfo = {};
        if(serverName){
            serverInfo = snakeLandServerManager.getServerInfo(serverName);
        }*/
        //sendJson(res, {...sendData});
    });
}