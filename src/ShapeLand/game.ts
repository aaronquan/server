import { Point, Vector2D } from "../Base/Math";
import {connection} from '../db/database';
import { Guest } from "../scripts/connect";
import { Enemy } from "./Enemy/Enemy";

export class Player{
    name: string;
    position: Point;
    constructor(name:string){
        this.name = name
        this.position = new Point(0, 0);
    }
    getData(){

    }
    saveData(){
        connection.simpleUpdate('shapelanduser', 
        {x: this.position.x, y: this.position.y}, 
        {name: this.name});
    }
    init(){

    }
    obj(){
        return {
            name: this.name,
            position: this.position.arr()
        }
    }
}

type ShapeLandClientUpdateSend = {
    user: Guest | null;
    updates: ShapeLandClientUpdate;
}

export type ShapeLandClientUpdate = {
    player: {
        name:string;
        position:number[];
    },
    projectiles?:ClientProjectile[];
}

export type InitShapeLandData = {
    player:PlayerDetails;
}

export type PlayerDetails = {
    position: number[];
}

type ClientProjectile = {
    id: number;
    owner:string;
    position:number[];
    velocity:number[];
    size:number;
    type:string;
    time:number;
}

type ShapeLandDatabaseUser = {
    name: string;
    x: number;
    y:number;
}

export class ShapeLandServer{
    onlinePlayers: Map<string, Player>; // players in server
    //slmap: SLMap;
    //updater:ShapeLandUpdater;

    allPlayers: Map<string, Player>; // loaded players from database on startup
    
    lastStepTime: number
    steps: number;

    enemies: Enemy[];
    
    //clientSender:ShapeLandClientSender;
    playerProjectiles: ClientProjectile[];
    constructor(){
        this.onlinePlayers = new Map<string, Player>();
        this.allPlayers = new Map<string, Player>();

        this.lastStepTime = Date.now();
        this.steps = 0;

        //this.clientSender = new ShapeLandClientSender();
        this.playerProjectiles = [];
        this.enemies = [];
    }
    init(save:() => void){
        //load saved users into game
        const slUsers = connection.selectAll('shapelanduser', (results) => {
            //can define database user type
            results.forEach((user:ShapeLandDatabaseUser) => {
                const pl = new Player(user.name);
                pl.position = new Point(user.x, user.y);
                this.allPlayers.set(user.name, pl);
            });
            const e1:Enemy = new Enemy(new Point(4, 4));
            this.enemies.push(e1);
            save();
        });
    }
    getPlayerDetails(name:string):PlayerDetails | undefined{
        if(!this.allPlayers.has(name)){
            return {
                position: [0, 0]
            }
        }
        const player = this.allPlayers.get(name);
        if(player) return {
            position: player.position.arr()
        }
        return undefined;
    }
    connectPlayer(name:string){
        if(!this.allPlayers.has(name)){
            connection.simpleInsert('shapelanduser', {name: name, x: 0, y: 0});
            this.allPlayers.set(name, new Player(name));
            //this.onlinePlayers.set(name, this.allPlayers.get(name));
        }
        const player = this.allPlayers.get(name);
        if(player) this.onlinePlayers.set(name, player);
    }
    disconnectPlayer(name:string){
        const player = this.allPlayers.get(name);
        if(player) player.saveData();
        this.onlinePlayers.delete(name);
    }
    //server step
    step(){
        const now = Date.now();
        const updateSecs = (now - this.lastStepTime)/1000;
        this.lastStepTime = now;
        this.steps++;
        if(this.steps % 200 === 99){
            this.save();
        }
        this.enemies.forEach(e => e.update(updateSecs));
    }
    //update positions of players
    update(updater:ShapeLandUpdater){
        updater.playersConnecting.forEach((playerName:string) => {
            this.connectPlayer(playerName);
        });
        updater.playersDisconnecting.forEach((playerName:string) => {
            this.disconnectPlayer(playerName);
        });
        updater.playerUpdates.forEach((upd:PlayerUpdate) => {
            const player = this.onlinePlayers.get(upd.name);
            if(player) player.position = new Point(upd.position[0], upd.position[1]);
        });
        
        //this.clientSender.expireObjects();

        updater.projectiles.forEach((proj:ClientProjectile) => {
            //update projectiles from client into this server
            //this.clientSender.addProjectile(proj);
            if(!this.playerProjectiles.some(p => {
                return p.id === proj.id && p.owner === proj.owner;
            })){
                //console.log(proj.id);
                this.playerProjectiles.push(proj);
            }
        });
    }
    save(){
        Array.from(this.onlinePlayers.values()).forEach(player => player.saveData());
    }
    servePlayers(){
        const onlinePlayers = Array.from(this.onlinePlayers.values()).map((player) => player.obj());
        const allPlayers = Array.from(this.allPlayers.values()).map((player) => player.obj());
        return {
            onlinePlayers: onlinePlayers,
            allPlayers: allPlayers
        }
    }
    serveGameData(upd:ShapeLandClientUpdateSend){        
        const otherPlayers = new Map(this.onlinePlayers);
        if(upd.user?.name){
            //const deleteString:string = upd.user.name;
            otherPlayers.delete(upd.user.name);
        }
        const players = Array.from(otherPlayers.values()).map((player) => player.obj());
        const enemies = this.enemies.map((e) => e.obj());
        //const sendObjects = this.clientSender.sendObjects(upd.user.name);
        return {
            players: players,
            enemies: enemies
            //...sendObjects // objects sent in gameUpdates
        }
    }
    requestMap(range:GridRange){

    }
}



type ServerUpdates = {

}

class GridRange{

}

type PlayerUpdate ={
    name:string;
    position:number[];
}
/*
class PlayerUpdate{
    name:string;
    position:Point;
    constructor(name:string){
        this.name = name;
        this.position = position;
    }

}
*/

/*
type ClientProjectile = {
    type:string;

}*/
class ClientSenderObject{
    obj: any;
    expire: number | undefined;
    players: Set<string>;
    constructor(obj:any, expire?:number){
        this.obj = obj;
        this.expire = expire;
        this.players = new Set();
    }
    sendObject(name:string): any | undefined{
        if(this.players.has(name)){
            return undefined;
        }
        this.players.add(name);
        return this.obj;
    }
    isExpired(currentTime:number){
        if(this.expire && this.expire < currentTime){
            return true;
        }
        return false;
    }
}

//adds client sender object and organises to send to other clients
//tracks clients by name, if name found adds to the players set
export class ShapeLandClientSender{
    projectiles: ClientSenderObject[]
    constructor(){
        this.projectiles = [];
    }
    addProjectiles(projs:ClientProjectile[], owner:string){
        projs.forEach((proj) => {
            const cso = new ClientSenderObject(proj, Date.now()+1000);
            cso.players.add(owner);
            this.projectiles.push(cso);
        });
    }
    addProjectile(proj:ClientProjectile){
        const cso = new ClientSenderObject(proj, Date.now()+1000);
        cso.players.add(proj.owner);
        this.projectiles.push(cso);
    }
    sendObjects(name:string){
        const projs:any[] = this.projectiles.reduce((arr:any[], cso:ClientSenderObject) => {
            const obj = cso.sendObject(name);
            if(obj){
                arr.push(obj);
            }
            return arr;
        }, []);
        if(projs.length > 0){
            console.log(projs);
        }
        const objects = {
            projectiles: projs
        };
        return objects;
    }
    expireObjects(){
        const now = Date.now();
        this.projectiles = this.projectiles.reduce((arr:any[], proj) => {
            if(!proj.isExpired(now)){
                arr.push(proj);
            }
            return arr;
        }, []);
    }
}

export class ShapeLandUpdater{
    playerUpdates:PlayerUpdate[];
    playersConnecting: string[];
    playersDisconnecting: string[];
    projectiles: ClientProjectile[];

    clientSender: ShapeLandClientSender;
    constructor(){
        this.playerUpdates = [];
        this.playersConnecting = [];
        this.playersDisconnecting = [];

        this.projectiles = [];
        this.clientSender = new ShapeLandClientSender();
    }
    updates(updates:ShapeLandClientUpdate, username:string){
        this.playerUpdates.push(updates.player);
        if(updates.projectiles){
            this.projectiles = this.projectiles.concat(updates.projectiles);
            this.clientSender.addProjectiles(updates.projectiles, username);
        }
    }
    connectPlayer(name:string){
        this.playersConnecting.push(name);
    }
    disconnectPlayer(name:string){
        this.playersDisconnecting.push(name);
    }

    sendObjects(name:string){
        return this.clientSender.sendObjects(name);
    }

    clear(){
        this.playerUpdates = [];
        this.playersConnecting = [];
        this.playersDisconnecting = [];
        this.projectiles = [];

        this.clientSender.expireObjects();
    }
}

class SLMap{
    constructor(){

    }
}