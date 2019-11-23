import * as lumps from "@src/lumps/index";
import {WADLump} from "@src/wad/lump";
import {LumpTypeView} from "@web/lumpTypeView";
import * as util from "@web/util";
import {drawMapGeometry} from "@web/views/2d/2dview";
import {MapGeometryOptions} from "@web/views/2d/options";

export const LumpTypeViewMapGeometry = function(
    drawOptions: MapGeometryOptions
): LumpTypeView {
    let resizeHandler: () => void = () => {};
    return new LumpTypeView({
        name: "Map",
        icon: "assets/icons/lump-map.png",
        view: (lump: WADLump, root: HTMLElement) => {
            const mapLump: (WADLump | null) = lumps.WADMap.findMarker(lump);
            if(!mapLump){
                return;
            }
            const map = lumps.WADMap.from(mapLump);
            const canvas = util.createElement({
                tag: "canvas",
                class: "lump-view-map-geometry",
                appendTo: root,
            });
            resizeHandler = () => {
                drawMapGeometry(map, canvas, drawOptions);
            };
            window.addEventListener("resize", resizeHandler);
            drawMapGeometry(map, canvas, drawOptions);
        },
        clear: (lump: WADLump, root: HTMLElement) => {
            window.removeEventListener("resize", resizeHandler);
        },
    });
};
