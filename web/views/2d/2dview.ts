import * as lumps from "@src/lumps/index";
import {MapGeometryOptions} from "@web/views/2d/options";

const ThingClassColors = {
    [lumps.WADMapThingClass.Monster]: "#FF0000",
    [lumps.WADMapThingClass.Weapon]: "#FFFF00",
    [lumps.WADMapThingClass.Ammo]: "#FF8800",
    [lumps.WADMapThingClass.Artifact]: "#00AAFF",
    [lumps.WADMapThingClass.Powerup]: "#22BBBB",
    [lumps.WADMapThingClass.Key]: "#FF00FF",
    [lumps.WADMapThingClass.Obstacle]: "#888888",
    [lumps.WADMapThingClass.Decoration]: "#666666",
    [lumps.WADMapThingClass.Romero]: "#AA22FF",
    [lumps.WADMapThingClass.PlayerStart]: "#00FF00",
    [lumps.WADMapThingClass.Spawner]: "#AA7722",
    [lumps.WADMapThingClass.Teleport]: "#55FF22",
};

export function drawMapGeometry(
    map: lumps.WADMap, canvas: any, options: MapGeometryOptions
): void {
    const context = canvas.getContext("2d");
    const mapBox = map.getBoundingBox();
    const mapWidth = mapBox.width;
    const mapHeight = mapBox.height;
    const margin: number = options.margin || 50;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const maxDrawWidth = canvas.width - (2 * margin);
    const maxDrawHeight = canvas.height - (2 * margin);
    const mapRatio = mapWidth / mapHeight;
    const widthRatio = canvas.width / mapWidth;
    const heightRatio = canvas.height / mapHeight;
    let drawWidth: number = 0;
    let drawHeight: number = 0;
    if(widthRatio < heightRatio){
        drawWidth = maxDrawWidth;
        drawHeight = drawWidth / mapRatio;
    }else{
        drawHeight = maxDrawHeight;
        drawWidth = drawHeight * mapRatio;
    }
    function xTransform(x: number): number {
        return margin + ((x - mapBox.left) * drawWidth / mapWidth);
    }
    function yTransform(y: number): number {
        return margin + ((y - mapBox.top) * drawHeight / mapHeight);
    }
    function widthTransform(width: number) : number {
        return width * drawWidth / mapWidth;
    }
    function heightTransform(height: number) : number {
        return height * drawHeight / mapHeight;
    }
    const vertexList = Array.from(map.enumerateVertexes());
    if(options.drawLines){
        // TODO: Automap colors
        const PassableColor: string = "#888888";
        const ImpassableColor: string = "#FFFFFF";
        const PassableActionColor: string = "#2288FF";
        const ImpassableActionColor: string = "#88AAFF";
        for(const line of map.enumerateLines()){
            const special: boolean = line.special !== 0;
            const passable: boolean = !line.impassableFlag;
            if(special && passable){
                context.strokeStyle = PassableActionColor;
            }else if(special && !passable){
                context.strokeStyle = ImpassableActionColor;
            }else if(!special && passable){
                context.strokeStyle = PassableColor;
            }else{ // if(!special && !passable){
                context.strokeStyle = ImpassableColor;
            }
            context.beginPath();
            const start = vertexList[line.startVertex];
            const end = vertexList[line.endVertex];
            if(start && end){
                context.moveTo(xTransform(start.x), yTransform(start.y));
                context.lineTo(xTransform(end.x), yTransform(end.y));
            }
            context.stroke();
            context.closePath();
        }
    }
    if(options.drawVertexes){
        context.fillStyle = "#FFFFFF";
        for(const vertex of vertexList){
            const drawX = xTransform(vertex.x);
            const drawY = yTransform(vertex.y);
            context.fillRect(drawX - 1, drawY - 1, 2, 2);
        }
    }
    if(options.drawThings){
        for(const thing of map.enumerateThings()){
            const type = thing.getTypeObject();
            const radius = type ? type.radius : 16;
            const drawX = xTransform(thing.x);
            const drawY = yTransform(thing.y);
            const drawRadius = Math.max(1, widthTransform(radius));
            context.fillStyle = (
                (type && ThingClassColors[type.class]) || "#FFFFFF"
            );
            context.fillRect(
                drawX - drawRadius, drawY - drawRadius,
                2 * drawRadius, 2 * drawRadius
            );
        }
    }
}
