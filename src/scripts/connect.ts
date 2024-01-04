import update from 'immutability-helper';
import {sendJson} from './Response';
import NodeCache from "node-cache"; 
import { connection } from '../db/database';

const expireTime = 24*60*60*1000;

function getExpiry(){
    return Date.now()+expireTime;
}

export type Guest = {
    type:string;
    id:number;
    name:string|undefined; 
    active: boolean;
    expires: number;
}
type Guests = {
    nextId:number;//the next id
    guests:Array<Guest>;
}

type UserProps = {
    //type:string;
    id:number;
    name: string;
}

function flushGuests(cache:NodeCache){
    const now = Date.now();
    const guests:Guests | undefined = cache.get('guests');
    if(guests){
        const newGuests = [...guests.guests].map((guest) => {
            if(guest.expires < now){
                guest.active = false;
            }
            return guest;
        });
        cache.set<Guests>('guests', update(guests, {
            guests: {$set: newGuests}
        }));
    }
}
export function connectCache(cache:NodeCache){
    cache.set<Guests>('guests', {nextId: 0, guests: []});
    setInterval(() => {
        flushGuests(cache);
    }, 2000);
}

//add guests to the cache
//can also fill old disconnected guests
export function connectNewGuest(params:any, res:any, cache:NodeCache){
    const guests:Guests | undefined = cache.get('guests'); // set inside server start
    if(guests){
        const id = guests.nextId;
        const newGuest = {type: 'guest', id: id, name: 'guest'+id.toString(), active: true, expires:getExpiry()};
        const newGuests = guests.guests.concat(newGuest);
        cache.set('guests', {nextId: id+1, guests: newGuests});
        sendJson(res, {guests: getGuests(cache), user: newGuest});
        console.log('connecting guest'+(id).toString());
    }else{
        sendJson(res, {guests: getGuests(cache)});
    }
}

function connectGuest(id:number, res:any, cache:NodeCache){
    sendJson(res, {guests: getGuests(cache), user: {type: 'guest', id: id, name: 'guest'+id.toString()}});
}

//unused - add function to update
export function getGuests(cache:NodeCache){
    const guests:Guests | undefined = cache.get('guests');
    let activeGuests:Guest[] = [];
    if(guests){
        activeGuests = guests.guests.reduce((arr:Guest[], guest:Guest) => {
            if(guest.active){
                arr.push(guest);
            }
            return arr;
        }, []);
    }
    return activeGuests;
}

export function connectUser(res:any){
    console.log('connecting user');
    sendJson(res, {});
}

export function connect(req:any, res:any, cache:NodeCache){
    const params = req.POST ? req.body : req.params; // should use only post
    if('user' in params){
        if(params.user.type == 'guest'){
            connectGuest(params.user.id, res, cache);
            //console.log('connecting guest');
        }else if(params.user.type == 'user'){
            connectUser(res);
            //console.log('connecting user');
        }
    }else{
        connectNewGuest(params, res, cache);
        //console.log('connecting guest');
    }
}


//other way of disconnect - delete guest
export function disconnect(req:any, res:any, cache:NodeCache){
    const guests:Guests | undefined = cache.get('guests');
    const params = req.body;
    console.log('disconnecting guest?');
    if(params.user && guests){
        if(params.user.type === 'guest'){
            //const newGuests = [...guests.guests];
            //newGuests.splice(params.id, 1);
            if(params.user.id < guests.guests.length){
                cache.set('guests', update(guests, {
                    guests: {
                        [params.user.id]: {
                            active: {$set: false}
                        }
                    }
                }));
                console.log('disconnected guest'+params.user.id);
            }
        }
    }

    sendJson(res, {disconnect: true, guests: getGuests(cache)});
}

export function connectRoutes(app:any, cache:NodeCache){
    app.post('/connect', (req: Request, res:Response) => {
        //console.log('body:'+req.body);
        //console.log('params:'+req.params);
        connect(req, res,cache);
        //res.json({});
    });
    
    app.post('/disconnect', (req: Request, res:Response) => {
        disconnect(req, res, cache);
    });
    
    app.post('/check', (req: Request, res:Response) => {
        serverCheck(req, res, cache);
    });
    
    app.post('/renameuser', (req: Request, res:Response) => {
        renameUser(req, res, cache);
    });
}

export function renameUser(req:any, res:any, cache:NodeCache){
    const guests:Guests | undefined = cache.get('guests');
    const params = req.body;
    if(params.user){
        if(params.user.type === 'guest'){
            const newGuests: Guests | undefined  = update(guests, {
                guests: {
                    [params.user.id]: {
                        name: {$set: params.user.name}
                    }
                }
            });
            cache.set('guests', newGuests);
            if(newGuests) sendJson(res, {user: newGuests.guests[params.user.id]});
            else sendJson(res);
        }else{
            sendJson(res);
        }
    }else{
        sendJson(res);
    }
}


//client is only using serverCheck atm
//handles all connections
export function serverCheck(req:any, res:any, cache:NodeCache){
    const guests:Guests | undefined = cache.get('guests');
    const params = req.body;
    if(params.user && guests){
        if(params.user.id >= guests.guests.length) return connect(req, res, cache);
        const newGuests = update(guests, {
            guests: {
                [params.user.id]: {
                    expires: {$set: getExpiry()}
                }
            }
        })
        cache.set('guests', newGuests);
        //console.log(newGuests);
        sendJson(res, {guests: getGuests(cache), user: newGuests.guests[params.user.id]});
    }
    else{
        return connect(req, res, cache);
    }
}