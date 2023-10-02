
export const five = 5;

export class Point{
    x: number;
    y: number;
    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
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
}

export class Circle{
    point:Point;
    radius:number;
    constructor(x:number, y:number, r:number){
        this.point = new Point(x, y);
        this.radius = r;
    }
    toJson(){
        return {
            point: this.point.toJson(),
            radius: this.radius
        };
    }
    next(){
        if(this.point.x > 100){
            this.point.x = 5;
        }else{
            this.point.x++;
        }
    }
}
