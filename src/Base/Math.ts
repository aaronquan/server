

export class Point{
    x: number;
    y: number;
    constructor(x?:number, y?:number){
        this.x = x ? x : 0;
        this.y = y ? y : 0;
    }
    addVector(vec:Vector2D){
        this.x += vec.x;
        this.y += vec.y;
    }
    toJson(){
        return {
            x: this.x,
            y: this.y
        };
    }
    arr(){
        return [this.x, this.y];
    }
    static randomIntegerPoint(xMin:number=0, xMax:number=10, 
        yMin:number=0, yMax:number=10):Point{
        return new Point(randomRange(xMin, xMax), randomRange(yMin, yMax));
    }
}

export function randomRange(min:number, max:number){
    const range = max - min;
    const number = Math.floor(Math.random()*range)+min;
    return number;
}

export class Vector2D{
    x:number;
    y:number;
    constructor(x?:number, y?:number){
        this.x = x ? x : 0;
        this.y = y ? y : 0;
    }
    div(d:number){
        if(d !== 0){
            this.x /= d; 
            this.y /= d;
        }
    }
    mag(){
        return Math.sqrt(this.distFast());
    }
    distFast(){
        return this.x*this.x + this.y*this.y;
    }
    norm(){
        this.div(this.mag());
    }
    copy(){
        return new Vector2D(this.x, this.y);
    }
    multi(m: number){
        this.x *= m;
        this.y *= m;
    }
    rotate(rad:number){
        const co = Math.cos(rad);
        const si = Math.sin(rad);
        const vx = this.x; const vy = this.y;
        this.x = vx * co - vy * si;
        this.y = vx * si + vy * co;
    }
    dotProduct(v:Vector2D){
        return this.x*v.x + this.y*v.y;
    }
    arr(){
        return [this.x, this.y];
    }
}