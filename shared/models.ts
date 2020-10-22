export class MapLocation {
    x:number
    y:number

    constructor(x:number,y:number) {
        this.x = x
        this.y = y
    }
}

// Represents each obstacle/polygon in the game room
export class Obstacle {

    id: string
    points : MapLocation[]
    color: number
    constructor(points:MapLocation[], color:number) {
        this.id = Math.floor(Math.random() * Math.floor(10000)).toString()
        this.points = points
        this.color = color
    }
}

// Used for calculating vision polygons
export class Line {
    readonly x1:number
    readonly y1:number
    readonly x2:number
    readonly y2:number
    readonly maxX:number
    readonly minX:number
    readonly maxY:number
    readonly minY:number
    public slope:number
    public b:number

    constructor(x1:number, y1:number, x2:number, y2:number) {
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.maxX = Math.max(x1, x2)
        this.minX = Math.min(x1, x2)
        this.maxY = Math.max(y1, y2)
        this.minY = Math.min(y1, y2)
        this.slope = (y2-y1)/(x2-x1)
        this.b = (-this.slope*x1 + y1)
    }
}