import { Point } from "../Base/Math";
import { SnakeUpdaterPlayerData, SnakePlayerUpdater } from "./updater";

type SnakeLandServerInfo = {
    name: string;
    details: SnakeLandServerDetails;
}

type SnakeLandServerDetails = {
    players: string[];
    startTime: number;
    owner: string | undefined;
}

export class SnakeLandServerManager{
    servers: Map<string, SnakeLandServer>;
    constructor(){
        this.servers = new Map<string, SnakeLandServer>();
    }
    startServer(name:string, player?:string){
        const newServer = new SnakeLandServer(player);
        this.servers.set(name, newServer);
    }
    closeServer(name:string){
        this.servers.delete(name);
    }
    findServer(name:string):SnakeLandServer | undefined {
        if(!this.servers.has(name)) return undefined;
        return this.servers.get(name);
    }
    getServersInfo() : SnakeLandServerInfo[]{
        const data = [];
        for(let [key, value] of this.servers.entries()){
            data.push({
                name: key,
                details: value.getServerDetails()
            })
        }
        return data;
    }
    getServerInfo(serverName:string): SnakeLandServerDetails | null{
        const server = this.findServer(serverName);
        if(server){
            return server.getServerDetails();
        }
        return null;
    }
    connectPlayerServer(serverName:string, playerName:string):boolean{
        const server = this.findServer(serverName);
        if(server){
            server.connectPlayer(playerName);
            return true;
        }
        return false;
    }
    disconnectPlayerServer(serverName:string, playerName:string){
        const server = this.findServer(serverName);
        if(server){
            server.disconnectPlayer(playerName);
            return true;
        }
        return false;
    }
    updatePlayer(serverName:string, playerName:string, data: SnakeUpdaterPlayerData){
        const server = this.findServer(serverName);
        if(server){
            server.updatePlayer(playerName, data)
        }
    }
    updateServers(){
        for(let server of this.servers.values()){
            server.update();
        }
    }
    getSendSnakeData(serverName:string, playerName:string): SendSnakeData | undefined{
        const server = this.findServer(serverName);
        if(server) return server.getSnakeServerSendData(playerName);
        return undefined;
    }
}

enum ServerState{
    Lobby, Game
}

export type SendSnakeData = {
    lastUpdated: number;
    snakePlayerData: SnakeSendPlayerData[];
    serverInfo: SnakeLandServerDetails; // SnakeServerInfo on client
}

export class SnakeLandServer{
    state: ServerState;
    owner: string | undefined;
    snakes: Map<string, SnakePlayer>;
    startTime: number;

    details: SnakeLandServerDetails;

    lastUpdated: number;

    foodSpawner: FoodSpawner; // to implement
    food: Food[];

    constructor(owner?:string){
        //can remove? 
        this.snakes = new Map<string, SnakePlayer>();
        this.owner = owner;
        this.startTime = Date.now();

        this.state = ServerState.Lobby;

        this.lastUpdated = Date.now();
        this.details = {
            players: [...this.snakes.keys()],
            startTime: this.startTime,
            owner: this.owner
        }

        this.food = [];
        this.foodSpawner = new FoodSpawner();
    }
    getPlayer(name:string){
        return this.snakes.get(name);
    }

    connectPlayer(playerName:string):boolean{
        if(!this.snakes.has(playerName)){
            const newSnake = {player: new SnakePlayerData(), 
                updater: null};
            this.snakes.set(playerName, newSnake);
            return true;
        }
        return false;
    }
    disconnectPlayer(playerName:string):boolean{
        return this.snakes.delete(playerName);
    }
    getServerDetails(): SnakeLandServerDetails{
        return this.details;
    }
    getSnakeServerSendData(playerName:string): SendSnakeData{
        const serverInfo = this.getServerDetails();
        const snakePlayerData:SnakeSendPlayerData[] = [...this.snakes.entries()].reduce(
        (arr:SnakeSendPlayerData[], [name, snake]) => {
            const snakeData = snake.player;
            if(name !== playerName) arr.push({...snakeData.obj(), playerName: name});
            return arr;
        }, []);
        return {
            lastUpdated: this.lastUpdated,
            snakePlayerData: snakePlayerData,
            serverInfo: serverInfo
        }
    }
    /*
    getSnakeData(player?:string){
        const snakeData = [];
        if(player){

        }else{
            for(let [key, value] of this.snakes.entries()){
                snakeData.push({
                    name: key,
                    snake: value.player.obj()
                });
            }
        }
        return snakeData;
    }*/
    updatePlayer(playerName:string, data: SnakeUpdaterPlayerData){
        const player = this.getPlayer(playerName);
        if(player){
            player.updater = {
                updateTime: Date.now(),
                position: new Point(data.position[0], data.position[1]),
                rotation: data.rotation,
                bodyHistory: data.bodyHistory
            }
        }
    }
    update(){
        for(let snake of this.snakes.values()){
            if(snake.updater){
                snake.player.update(snake.updater);
            }
        }
        this.foodSpawner.update(); // todo
    }
    init(f:()=>void){

    }
}

type SnakePlayer = {
    player: SnakePlayerData;
    updater: SnakePlayerUpdater | null; // is null when no new update data
}

//data to send to client
type SnakeSendPlayerData = SnakeUpdaterPlayerData & {
    //position: number[];
    //rotation: number;
    playerName: string;
    disconnected?: boolean;
}

export type SnakeBodyData = {
    position: number[];
    rotation: number;
}
// for space optimisation later
type SnakeBodyUpdater = {

}

export class SnakePlayerData{
    lastUpdated: number;
    position: Point;
    rotation: number;
    bodyHistory: SnakeBodyData[];
    constructor(x:number=0, y:number=0){
        this.position = new Point(x, y);
        this.rotation = 0;
        this.lastUpdated = Date.now();
        this.bodyHistory = [];
    }
    init(){
        
    }
    update(updater:SnakePlayerUpdater){
        this.position = updater.position;
        this.rotation = updater.rotation;
        this.lastUpdated = Date.now();
        this.bodyHistory = updater.bodyHistory;
    }
    obj():SnakeUpdaterPlayerData{
        return {
            position: this.position.arr(),
            rotation:this.rotation,
            lastUpdated: this.lastUpdated,
            bodyHistory: this.bodyHistory
        }
    }
}

type SnakeUpdaterFoodData = {
    position: number[];
}

export class Food{
    position: Point;
    constructor(){
        this.position = new Point();
    }
    obj():SnakeUpdaterFoodData{
        return {
            position: this.position.arr(),
        }
    }
}
export class FoodSpawner{
    update(){

    }
}