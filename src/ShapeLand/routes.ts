import {sendJson} from '../scripts/Response';
import NodeCache from "node-cache"; 
import { ShapeLandServer, ShapeLandUpdater } from './game';
import {connection} from '../db/database';

const tickTime = 16;
const gameUpdates = new ShapeLandUpdater();

function initShapeLand(cache:NodeCache){
    const game = new ShapeLandServer();
    //const gameUpdates = new ShapeLandUpdater();
    const save = () => {
        cache.set<ShapeLandServer>('shapeland', game);
    }
    game.init(save);

    //cache.set<ShapeLandServer>('shapeland', game);
    //cache.set<ShapeLandUpdater>('shapelandupdates', gameUpdates);
}


export function shapeLandRoutes(app:any, cache:NodeCache){
    if(!cache.has('shapeland')){
        initShapeLand(cache);
    }
    setInterval(() => {
        if(cache.has('shapeland')){
            const game:ShapeLandServer | undefined = cache.get('shapeland');
            if(game){
                game.update(gameUpdates);
                game.step();
                gameUpdates.clear();
                cache.set('shapeland', game);
                cache.set('shapelandupdates', gameUpdates);
            }
        }
    }, tickTime);
    app.post('/startShapeLandServer', (req:any, res:any) => {
        //todo
        sendJson(res, {});
    });
    app.post('/closeShapeLandServer', (req:any, res:any) => {
        //todo
        sendJson(res, {});
    });

    app.post('/connectShapeLand', (req:any, res:any) => {
        //const gameUpdates:ShapeLandUpdater = cache.get('shapelandupdates');
        const game:ShapeLandServer | undefined = cache.get('shapeland');
        if(req.body.user && game){
            //console.log(req.body.user);
            //works
            const name = req.body.user.name ? req.body.user.name 
            : req.body.user.type+req.body.user.id.toString();
            console.log('connecting to shapeland '+name);
            const initialData = gameUpdates.connectPlayer(name);

            const initGame = {
                player: game.getPlayerDetails(name)
            }
            sendJson(res, {user: name, game: initGame});
        }else{
            sendJson(res, {user: 'test'});
        }
        //cache.set('shapelandupdates', gameUpdates);
    });

    app.post('/shapeLandServer', (req:any, res:any) => {
        //const gameUpdates:ShapeLandUpdater = cache.get('shapelandupdates');
        const game:ShapeLandServer | undefined = cache.get('shapeland');
        //console.log(req.body);
        if(game){
            if('updates' in req.body){
                //if(req.body.updates.projectiles){
                //    if(req.body.updates.projectiles.length > 0) console.log(req.body.updates);
                //}
                gameUpdates.updates(req.body.updates, req.body.user.name);
            }
            //game.serveGameData();
            sendJson(res, {game: 
                {
                    ...game.serveGameData(req.body), 
                    ...gameUpdates.sendObjects(req.body.user.name),
                    added: {projectiles: req.body.updates.projectiles}
                } 
            });
        }else{
            sendJson(res, {success: false, reason: 'Game not ready'})
        }
        //cache.set('shapelandupdates', gameUpdates);
    });

    app.post('/disconnectShapeLand', (req:any, res:any) => {
        //const gameUpdates:ShapeLandUpdater = cache.get('shapelandupdates');
        if(req.body.user){
            console.log('disconnecting from shapeland '+req.body.user.name);
            gameUpdates.disconnectPlayer(req.body.user.name);
        }
        sendJson(res, {});
    });

    app.get('/shapeLandServer', (req:any, res:any) => {
        const game:ShapeLandServer | undefined = cache.get('shapeland');
        //game.init();
        if(game){
            sendJson(res, {game: {...game.servePlayers()}, objects: gameUpdates.sendObjects('1')});
        }else{
            sendJson(res);
        }
    });

    app.get('testShapeLandConnection', (req:any, res:any) => {
        if(req.query.user){
            //connectShapeLandUser(req.query.user);
        }
        sendJson(res, {});
    })
}