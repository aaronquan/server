import { Point } from "../ShapeLand/Base/Math";
export const five = 5;

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
