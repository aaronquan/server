import { Point, Vector2D } from "../Base/Math";
import { Player } from "../game";

export type ServerEnemyObj = {
    id:number;
    position: number[];
}

export class Enemy{
    static currentId = 0;
    id:number;
    position: Point;
    velocity: Vector2D;

    movementChangePeriod: number;
    movementTime: number;
    constructor(pos?: Point){
        this.position = pos ? pos : new Point();
        this.velocity = new Vector2D(0, 0);

        this.movementChangePeriod = 1;
        this.movementTime = 0;

        this.id = Enemy.currentId;
        Enemy.currentId++;
    }
    update(secs:number){
        if(this.movementTime > this.movementChangePeriod){
            this.velocity.x = Math.random() - 0.5;
            this.velocity.y = Math.random() - 0.5;
            this.movementTime -= this.movementChangePeriod;
        }
        const movement = this.velocity.copy();
        movement.multi(secs);
        this.position.addVector(movement);
        this.movementTime += secs;
    }
    obj():ServerEnemyObj{
        return {
            id: this.id,
            position: this.position.arr(),
        }
    }

}

export type EnemyCommand = {
    start:number;
    command: string;
    finish:number;
}

export type ServerTurretObj = {
    id: number;
    position:number[];
    direction:number[];
    detectRadius:number;
}

export class Turret{
    static currentId = 0;
    id:number;
    position: Point;
    direction: Vector2D;
    detectRadius: number;
    turnSpeed: number;

    trackPlayer: Player | null;
    constructor(pos?:Point){
        this.position = pos ? pos : new Point();
        this.direction = new Vector2D(0, -1);
        this.turnSpeed = 0.1;
        this.detectRadius = 5;
        this.id = Turret.currentId;
        this.trackPlayer = null;
        Turret.currentId++;
    }
    update(secs:number, time:number){
        if(this.trackPlayer){
            const distVec = new Vector2D(this.trackPlayer.position.x-this.position.x, 
                this.trackPlayer.position.y-this.position.y);
            distVec.norm();
            //implement in the client to test first
        }else{
            //this.detectPlayers()
        }
    }
    getCommand(){

    }
    detectPlayers(players: Player[]){
        const detectRadiusSquared = this.detectRadius*this.detectRadius;
        const closestPlayer = {player: null, distance: detectRadiusSquared};
        players.forEach((player) => {
            const distVec = new Vector2D(player.position.x-this.position.x, 
                player.position.y-this.position.y);
            const distance = distVec.distFast();
            if(distance < closestPlayer.distance){
                closestPlayer.player = player;
                closestPlayer.distance = distance;
            }
        });
        this.trackPlayer = closestPlayer.player;
    }
    obj():ServerTurretObj{
        return {
            id: this.id,
            position: this.position.arr(),
            direction: this.direction.arr(),
            detectRadius: this.detectRadius
        }
    }
}