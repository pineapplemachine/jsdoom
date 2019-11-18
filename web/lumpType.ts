import {WADFile} from "@src/wad/file";
import {WADFileList} from "@src/wad/fileList";
import {WADLump} from "@src/wad/lump";

import * as lumps from "@src/lumps/index";

import * as view from "@web/lumpTypeView";
import * as util from "@web/util";

type LumpTypeView = view.LumpTypeView;

export type LumpTypeFilter = (lump: WADLump) => boolean;

export class LumpType {
    // Human-readable name.
    name: string;
    // Icon URL, e.g. "/assets/icons/lump-generic.png".
    icon: string;
    // Predicate function - determine whether a lump can be this type or not.
    filter: LumpTypeFilter;
    // A list of special ways to view this lump
    views: LumpTypeView[];
    // Lower-priority ways to view the lump
    otherViews: LumpTypeView[];
    
    constructor(options: {
        name: string,
        icon: string,
        filter: LumpTypeFilter,
        views?: LumpTypeView[],
        otherViews?: LumpTypeView[],
    }){
        this.name = options.name;
        this.icon = options.icon;
        this.filter = options.filter;
        this.views = options.views || [];
        this.otherViews = options.otherViews || [];
    }
    
    match(lump: WADLump): boolean {
        return this.filter(lump);
    }
    
    getViews(lump: WADLump): LumpTypeView[] {
        const views = [];
        views.push(...this.otherViews);
        if(lump.data){
            views.push(view.LumpTypeViewHex);
        }
        views.push(...this.views);
        return views;
    }
}

export function getLumpType(lump: WADLump): LumpType {
    for(const lumpType of LumpTypeList){
        if(lumpType.match(lump)){
            return lumpType;
        }
    }
    return LumpTypeGeneric;
}

export const LumpTypeGeneric = new LumpType({
    name: "Other",
    icon: "assets/icons/lump-generic.png",
    otherViews: [view.LumpTypeViewText],
    filter: (lump: WADLump) => {
        return true; // Match everything
    }
});

export const LumpTypeList: LumpType[] = [
    new LumpType({
        name: "Map Marker",
        icon: "assets/icons/lump-marker.png",
        views: [view.LumpTypeViewMapGeometry({
            drawLines: true,
            drawThings: true,
        }),
        view.LumpTypeViewMapTextured3D(),
        // view.LumpTypeViewMapUntextured3D(),
        view.LumpTypeViewMapOBJ(),
        ],
        filter: (lump: WADLump) => {
            return lumps.WADMap.match(lump);
        }
    }),
    new LumpType({
        name: "Marker",
        icon: "assets/icons/lump-marker.png",
        filter: (lump: WADLump) => {return lump.length === 0; },
    }),
    new LumpType({
        name: "Palette",
        icon: "assets/icons/lump-playpal.png",
        views: [view.LumpTypeViewPlaypal()],
        filter: lumps.WADPalette.match,
    }),
    new LumpType({
        name: "Colormap",
        icon: "assets/icons/lump-colormap.png",
        views: [
            view.LumpTypeViewColormapAll(),
            view.LumpTypeViewColormapByMap(),
        ],
        filter: lumps.WADColorMap.match,
    }),
    new LumpType({
        name: "Textures",
        icon: "assets/icons/lump-textures.png",
        views: [view.LumpTypeViewTextures],
        filter: lumps.WADTextures.match,
    }),
    new LumpType({
        name: "Patch Table",
        icon: "assets/icons/lump-patches.png",
        views: [view.LumpTypeViewPatches],
        filter: lumps.WADPatches.match,
    }),
    new LumpType({
        name: "ANSI Text",
        icon: "assets/icons/lump-ansi.png",
        filter: (lump: WADLump) => {
            const names = ["ENDOOM", "ENDBOOM", "ENDTEXT", "ENDSTRF"];
            return names.indexOf(lump.name) >= 0;
        }
    }),
    new LumpType({
        name: "Demo",
        icon: "assets/icons/lump-demo.png",
        filter: (lump: WADLump) => {
            const names = ["DEMO1", "DEMO2", "DEMO3"];
            return names.indexOf(lump.name) >= 0;
        }
    }),
    new LumpType({
        name: "DeHackEd",
        icon: "assets/icons/lump-script.png",
        views: [view.LumpTypeViewText],
        filter: (lump: WADLump) => {
            return lump.name === "DEHACKED";
        }
    }),
    new LumpType({
        name: "Map Info",
        icon: "assets/icons/lump-script.png",
        views: [view.LumpTypeViewText],
        filter: (lump: WADLump) => {
            return lump.name === "MAPINFO";
        }
    }),
    new LumpType({
        name: "Boom Animations",
        icon: "assets/icons/lump-script.png",
        filter: (lump: WADLump) => {
            return lump.name === "ANIMATED";
        }
    }),
    new LumpType({
        name: "Boom Switches",
        icon: "assets/icons/lump-script.png",
        filter: (lump: WADLump) => {
            return lump.name === "SWITCHES";
        }
    }),
    new LumpType({
        name: "Music (MUS)",
        icon: "assets/icons/lump-music.png",
        filter: lumps.WADMusic.match,
    }),
    new LumpType({
        name: "Music (MIDI)",
        icon: "assets/icons/lump-music.png",
        filter: lumps.WADMidi.match,
    }),
    new LumpType({
        name: "Sound (DMX)",
        icon: "assets/icons/lump-audio.png",
        filter: lumps.WADSound.match,
    }),
    new LumpType({
        name: "Sound (PC Speaker)",
        icon: "assets/icons/lump-audio.png",
        filter: lumps.WADSpeakerEffect.match,
    }),
    new LumpType({
        name: "Audio (WAV)",
        icon: "assets/icons/lump-audio.png",
        views: [view.LumpTypeViewRawAudio("wav")],
        filter: lumps.WADWave.match,
    }),
    new LumpType({
        name: "Audio (OGG)",
        icon: "assets/icons/lump-audio.png",
        views: [view.LumpTypeViewRawAudio("ogg")],
        filter: lumps.WADVorbis.match,
    }),
    new LumpType({
        name: "Audio (MP3)",
        icon: "assets/icons/lump-audio.png",
        views: [view.LumpTypeViewRawAudio("mpeg")],
        filter: (lump: WADLump) => {
            return lumps.WADMp3.match(lump);
        }
    }),
    new LumpType({
        name: "Graphic (BMP)",
        icon: "assets/icons/lump-image.png",
        views: [view.LumpTypeViewRawImage("bmp")],
        filter: lumps.WADBitmap.match,
    }),
    new LumpType({
        name: "Graphic (GIF)",
        icon: "assets/icons/lump-image.png",
        views: [view.LumpTypeViewRawImage("gif")],
        filter: lumps.WADGif.match,
    }),
    new LumpType({
        name: "Graphic (JPG)",
        icon: "assets/icons/lump-image.png",
        views: [view.LumpTypeViewRawImage("jpeg")],
        filter: lumps.WADJpeg.match,
    }),
    new LumpType({
        name: "Graphic (PNG)",
        icon: "assets/icons/lump-image.png",
        views: [view.LumpTypeViewRawImage("png")],
        filter: lumps.WADPng.match,
    }),
    new LumpType({
        name: "Graphic (TGA)",
        icon: "assets/icons/lump-image.png",
        // Not supported by browsers
        // views: [view.LumpTypeViewRawImage("targa")],
        filter: lumps.WADTarga.match,
    }),
    new LumpType({
        name: "Graphic (TIFF)",
        icon: "assets/icons/lump-image.png",
        // Not supported by browsers
        // views: [view.LumpTypeViewRawImage("tiff")],
        filter: lumps.WADTiff.match,
    }),
    new LumpType({
        name: "Graphic (Flat)",
        icon: "assets/icons/lump-image.png",
        views: [view.LumpTypeViewFlatImage],
        filter: (lump: WADLump) => {
            return lumps.WADFlat.match(lump) && lump.isBetweenMulti(
                [lumps.WADFlat.IWADMarkerStart, lumps.WADFlat.PWADMarkerStart],
                [lumps.WADFlat.IWADMarkerEnd, lumps.WADFlat.PWADMarkerEnd]
            );
        },
    }),
    new LumpType({
        name: "Graphic (Doom)",
        icon: "assets/icons/lump-image.png",
        views: [view.LumpTypeViewPictureImage],
        filter: lumps.WADPicture.match,
    }),
    new LumpType({
        name: "Map Things",
        icon: "assets/icons/lump-map.png",
        views: [
            view.LumpTypeViewMapGeometry({drawThings: true}),
            view.LumpTypeViewMapThings
        ],
        filter: (lump: WADLump) => {
            return lumps.WADMapThings.match(lump);
        }
    }),
    new LumpType({
        name: "Map Lines",
        icon: "assets/icons/lump-map.png",
        views: [view.LumpTypeViewMapGeometry({drawLines: true})],
        filter: (lump: WADLump) => {
            return lumps.WADMapLines.match(lump);
        }
    }),
    new LumpType({
        name: "Map Sides",
        icon: "assets/icons/lump-map.png",
        filter: (lump: WADLump) => {
            return lumps.WADMapSides.match(lump);
        }
    }),
    new LumpType({
        name: "Map Vertexes",
        icon: "assets/icons/lump-map.png",
        views: [view.LumpTypeViewMapGeometry({drawVertexes: true})],
        filter: (lump: WADLump) => {
            return lumps.WADMapVertexes.match(lump);
        }
    }),
    new LumpType({
        name: "Map Segments",
        icon: "assets/icons/lump-map.png",
        filter: (lump: WADLump) => {
            return lump.name === "SEGS";
        }
    }),
    new LumpType({
        name: "Map Subsectors",
        icon: "assets/icons/lump-map.png",
        filter: (lump: WADLump) => {
            return lump.name === "SSECTORS";
        }
    }),
    new LumpType({
        name: "Map Nodes",
        icon: "assets/icons/lump-map.png",
        filter: (lump: WADLump) => {
            return lump.name === "NODES";
        }
    }),
    new LumpType({
        name: "Map Sectors",
        icon: "assets/icons/lump-map.png",
        filter: (lump: WADLump) => {
            return lumps.WADMapSectors.match(lump);
        }
    }),
    new LumpType({
        name: "Map Reject Table",
        icon: "assets/icons/lump-map.png",
        filter: (lump: WADLump) => {
            return lump.name === "REJECT";
        }
    }),
    new LumpType({
        name: "Map Blockmap",
        icon: "assets/icons/lump-map.png",
        filter: (lump: WADLump) => {
            return lump.name === "BLOCKMAP";
        }
    }),
    new LumpType({
        name: "ACS Bytecode",
        icon: "assets/icons/lump-script.png",
        filter: (lump: WADLump) => {
            // NOTE: Starts with a 0x41 0x53 0x53 0x00 ("ACS") header.
            return lump.name === "BEHAVIOR";
        }
    }),
    new LumpType({
        name: "ACS Source Code",
        icon: "assets/icons/lump-script.png",
        views: [view.LumpTypeViewText],
        filter: (lump: WADLump) => {
            return lump.name === "SCRIPTS";
        }
    }),
];
