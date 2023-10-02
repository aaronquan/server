import { Point } from "../Shapes/shapes";
import {connection} from '../db/database';
import { Guest } from "../scripts/connect";

class Player{
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
    owner:string;
    position:number[];
    velocity:number[];
    size:number;
    type:string;
    time:number;
}

export class ShapeLandServer{
    onlinePlayers: Map<string, Player>; // players in server
    slmap: SLMap;
    updater:ShapeLandUpdater;

    allPlayers: Map<string, Player>; // loaded players from database on startup
    
    steps: number;
    
    clientSender:ShapeLandClientSender;
    constructor(){
        this.onlinePlayers = new Map<string, Player>();
        this.allPlayers = new Map<string, Player>();
        this.steps = 0;

        this.clientSender = new ShapeLandClientSender();
    }
    init(save:() => void){
        //load saved users into game
        const slUsers = connection.selectAll('shapelanduser', (results) => {
            results.forEach((user) => {
                const pl = new Player(user.name);
                pl.position = new Point(user.x, user.y);
                this.allPlayers.set(user.name, pl);
            });
            save();
        });
    }
    getPlayerDetails(name:string):PlayerDetails{
        if(!this.allPlayers.has(name)){
            return {
                position: [0, 0]
            }
        }
        const player = this.allPlayers.get(name);
        return {
            position: player.position.arr()
        }
    }
    connectPlayer(name:string){
        if(!this.allPlayers.has(name)){
            connection.simpleInsert('shapelanduser', {name: name, x: 0, y: 0});
            this.allPlayers.set(name, new Player(name));
            //this.onlinePlayers.set(name, this.allPlayers.get(name));
        }
        const player = this.allPlayers.get(name);
        this.onlinePlayers.set(name, player);
    }
    disconnectPlayer(name:string){
        const player = this.allPlayers.get(name);
        player.saveData();
        this.onlinePlayers.delete(name);
    }
    //server step
    step(){
        this.steps++;
        if(this.steps % 200 === 99){
            this.save();
        }
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
        this.clientSender.addProjectiles(updater.projectiles);
        /*updater.projectiles.forEach((proj:ClientProjectile) => {
            //update projectiles from client into this server
            this.clientSender.addProjectile(proj);
        });*/
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
        otherPlayers.delete(upd.user.name);
        const players = Array.from(otherPlayers.values()).map((player) => player.obj());
        const sendObjects = this.clientSender.sendObjects(upd.user.name);
        return {
            players: players,
            ...sendObjects
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
}

//adds client sender object and organises to send to other clients
//tracks clients by name, if name found adds to the players set
export class ShapeLandClientSender{
    projectiles: ClientSenderObject[]
    constructor(){
        this.projectiles = [];
    }
    addProjectile(proj:ClientProjectile){
        const cso = new ClientSenderObject(proj)
        cso.players.add(proj.owner);
        this.projectiles.push(cso);
    }
    sendObjects(name:string){
        const projs = this.projectiles.reduce((arr, cso:ClientSenderObject) => {
            if(cso.players.has(name)){
                arr.push(cso.obj);
            }
            return arr;
        }, []);
        const objects = {
            projectiles: projs
        };
        return objects;
    }
}

export class ShapeLandUpdater{
    playerUpdates:PlayerUpdate[];
    playersConnecting: string[];
    playersDisconnecting: string[];
    projectiles: ClientProjectile[];
    constructor(){
        this.playerUpdates = [];
        this.playersConnecting = [];
        this.playersDisconnecting = [];

        this.projectiles = [];
    }
    updates(updates:ShapeLandClientUpdate){
        if('player' in updates){
            this.playerUpdates.push(updates.player);
        }
        if('projectiles' in updates){
            this.projectiles = this.projectiles.concat(updates.projectiles);
        }
    }
    connectPlayer(name:string){
        this.playersConnecting.push(name);
    }
    disconnectPlayer(name:string){
        this.playersDisconnecting.push(name);
    }

    clear(){
        this.playerUpdates = [];
        this.playersConnecting = [];
        this.playersDisconnecting = [];
        this.projectiles = [];
    }
}

class SLMap{
    constructor(){

    }
}