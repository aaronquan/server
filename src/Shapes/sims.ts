
class Position2D{
    x:number;
    y:number;
    constructor(x?:number, y?:number){
        this.x = x ? x : 0;
        this.y = y ? y : 0;
    }
    static copy(p:Position2D){
        return new Position2D(p.x, p.y);
    }
    obj(){
        return {x: this.x, y: this.y};
    }
    arr(){
        return [this.x, this.y];
    }
    equals(p:Position2D){
        return this.x === p.x && this.y === p.y;
    }
}

class Velocity2D{
    x:number;
    y:number;
    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }
}

export class Emmiter{
    freq:number; // number of steps to emit
    current:number
    position:Position2D
    constructor(f:number){
        this.position = new Position2D(0, 0);
        this.freq = f;
        this.current = 0;
    }
    setPosition(x:number, y:number){
        this.position.x = x; this.position.y = y;
    }
    setPositionPos(p:Position2D){
        this.position = p;
    }
    step(){
        this.current++;
        if(this.current >= this.freq){
            this.current = 0;
            return true;
        }
        return false;
    }
}

class Grid2D{
    grid:any[][];
    width:number;
    height:number;
    constructor(width:number, height:number, initVal?:any){
        this.width = width;
        this.height = height;
        const val = initVal ? initVal : 0;
        this.grid = Array.from(Array(this.height), () => Array(this.width).fill(val));
    }
    setAll(val:any){
        this.grid = Array.from(Array(this.height), () => Array(this.width).fill(val));
    }
    swap(x1:number, y1:number, x2:number, y2:number){
        const v = this.grid[y1][x1];
        this.grid[y1][x1] = this.grid[y2][x2];
        this.grid[y2][x2] = v;
    }
    swapPos(p1:Position2D, p2:Position2D){
        const v = this.grid[p1.y][p1.x];
        this.grid[p1.y][p1.x] = this.grid[p2.y][p2.x];
        this.grid[p2.y][p2.x] = v;
    }
    
    get(x:number, y:number){
        return this.grid[y][x];
    }
    set(x:number, y:number, value:any){
        this.grid[y][x] = value;
    }
    getPos(p:Position2D){
        return this.grid[p.y][p.x];
    }
    setPos(p:Position2D, value:any){
        this.grid[p.y][p.x] = value;
    }
}

class SolidWall{
    position:Position2D
    constructor(){

    }
}

const simMaxVelocity = 3;

class Sand{
    position:Position2D;
    velocity:Velocity2D;
    constructor(x?:number, y?:number){
        this.position = new Position2D(x, y);
    }
    setPosition(p:Position2D){
        this.position = p;
    }
    getPosition(){
        return this.position.arr();
    }
    step(grid:Grid2D, width:number){
        const pos = this.position;
        const y1 = pos.y+1;
        //to update for velocity
        if(y1 < width){
            const bot = new Position2D(pos.x, y1); 
            const bg:GridBlocks = grid.getPos(bot);
            if(bg === GridBlocks.empty){
                grid.swapPos(pos, bot);
                this.setPosition(bot);
                //return sand;
            }else{
                const lb = new Position2D(pos.x-1, y1);
                const rb = new Position2D(pos.x+1, y1);
                const r = Math.random();
                if(r > 0.5){
                    this.shiftLeft(grid, lb, rb);
                }else{
                    this.shiftRight(grid, lb, rb);
                }
            }
        }
    }
    shiftLeft(grid:Grid2D, lb:Position2D, rb:Position2D){
        if(grid.getPos(lb) === GridBlocks.empty){
            grid.swapPos(this.position, lb);
            this.setPosition(lb);
        }else if(grid.getPos(rb) === GridBlocks.empty){
            grid.swapPos(this.position, rb);
            this.setPosition(rb);
        }
    }
    shiftRight(grid:Grid2D, lb:Position2D, rb:Position2D){
        if(grid.getPos(rb) === GridBlocks.empty){
            grid.swapPos(this.position, rb);
            this.setPosition(rb);
        }else if(grid.getPos(lb) === GridBlocks.empty){
            grid.swapPos(this.position, lb);
            this.setPosition(lb);
        }
    }
}

enum GridBlocks {
    empty, sand, wall
}

/*
const GridBlocks = {
    empty: Symbol('empty'),
    wall: Symbol('wall'),
    sand: Symbol('sand'),
}*/


//Good Work Aaron :D
export class SandSim{
    grid:Grid2D;
    grains: Sand[];
    walls: Position2D[];
    emmiters: Emmiter[];
    nsteps: number;
    width:number;
    height:number;
    constructor(w:number, h:number){
        this.width = w;
        this.height = h;
        this.grid = new Grid2D(w, h);
        this.clearGrid();
        this.grains = [];
        this.walls = [];
        this.emmiters = [];
        this.nsteps = 0;
    }
    clearGrid(){
        this.grid.setAll(GridBlocks.empty);
    }
    setEmmiter(e:Emmiter, i?:number){
        if(i && this.emmiters.length < i){
            this.emmiters[i] = e;
        }else{
            this.emmiters.push(e);
        }
    }
    addWall(x:number, y:number){
        this.grid.set(x, y, GridBlocks.wall);
        this.walls.push(new Position2D(x, y));
    }
    update(upd:SandSimUpdates){
        upd.removes.forEach((remPos) => {
            this.grid.set(remPos.x, remPos.y, GridBlocks.empty);
            const index = this.walls.findIndex((val) => {
                return remPos.equals(val);
            });
            this.walls.splice(index, 1);
            //this.walls.push(new Position2D(wallPos.x, wallPos.y));
        });
        upd.wallAdds.forEach((wallPos) => {
            if(this.grid.getPos(wallPos) !== GridBlocks.wall){
                const index = this.grains.findIndex((sand) => sand.position.equals(wallPos));
                if(index !== -1) this.grains.splice(index, 1);
                this.grid.set(wallPos.x, wallPos.y, GridBlocks.wall);
                this.walls.push(new Position2D(wallPos.x, wallPos.y));
            }
        });
        
        upd.clear();
    }
    step(){
        //move sand
        this.grains.forEach((sand) => {
            sand.step(this.grid, this.width);
        });
        /*
        for(let j = this.grid.height-1; j >= 0; ++j){
            for(let i = 0; i < this.grid.width; ++i){
                this.grid.
            }
        }*/

        /*
        this.grains = this.grains.map((sand) => {
            const pos = sand.position;
            const y1 = pos.y+1;
            //to update for velocity
            if(y1 < this.width){
                const bot = new Position2D(pos.x, y1); 
                const bg = this.grid.getPos(bot);
                if(bg === 0){
                    this.grid.swapPos(pos, bot);
                    sand.setPosition(bg);
                    //return sand;
                }else{
                    const lb = new Position2D(pos.x-1, y1);
                    const rb = new Position2D(pos.x+1, y1);
                    if(this.grid.getPos(lb) === 0){
                        this.grid.swapPos(pos, lb);
                        sand.setPosition(lb);
                        //return lb;
                    }else if(this.grid.getPos(rb) === 0){
                        this.grid.swapPos(pos, rb);
                        sand.setPosition(rb);
                        //return rb;
                    }
                }
            }
            return sand;
        });
        */

        //spawn sand from emmiters
        this.emmiters.forEach((em) => {
            if(em.step()){
                if(this.grid.getPos(em.position) === GridBlocks.empty){
                    const ns = new Sand();
                    ns.setPosition(em.position);
                    this.grains.push(ns);
                    this.grid.setPos(em.position, GridBlocks.sand);
                }
            }
        });
    }
    colours(){
        return {[GridBlocks.sand]: [200, 205, 10]};
    }
    getGrains(){
        return this.grains.map((sand) => sand.getPosition());
    }
    getWalls(){
        return this.walls.map((wall) => wall.arr());
    }
    getObjects(){
        return {
            sand: this.getGrains(),
            walls: this.getWalls()
        }
    }
}

export class SandSimUpdates{
    wallAdds: Position2D[];
    removes: Position2D[];
    constructor(){
        this.wallAdds = [];
        this.removes = [];
    }
    addWallAdds(x:number, y:number){
        this.wallAdds.push(new Position2D(x, y));
    }
    addRemoves(x:number, y:number){
        this.removes.push(new Position2D(x, y));
    }
    updates(updates:any){
        if('wallAdds' in updates){
            updates.wallAdds.forEach((wall) => {
                this.addWallAdds(wall[0], wall[1]);
            });
        }
        if('removes' in updates){
            updates.wallRemoves.forEach((wall) => {
                this.addWallAdds(wall[0], wall[1]);
            });
        }
    }
    clear(){
        this.wallAdds = [];
        this.removes = [];
    }
}