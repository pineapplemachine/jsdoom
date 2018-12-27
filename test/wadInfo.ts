// Type used to tell the downloader where to find a given WAD.
export interface WADInfo {
    // The name of the WAD, e.g. "doom1.wad".
    name: string;
    // If the url refers to an archive file, then this should be the name
    // of the WAD file inside the archive.
    archivedWad: (string | null);
    // A url to download the WAD or an archive containing the WAD.
    // Only HTTP supported. TODO: Support FTP and HTTPS urls.
    url: string;
}

// A list of WAD urls with metadata needed by the downloader.
export const WADInfoList: WADInfo[] = [
    // Doom: Knee-Deep in the Dead shareware by Id Software (1993)
    {
        name: "doom1.wad",
        archivedWad: null,
        url: "http://distro.ibiblio.org/slitaz/sources/packages/d/doom1.wad",
    },
    // Chronicle of Doomguy by Sophie Kirschner (2015)
    {
        name: "chrodoom.wad",
        archivedWad: "chrndoom.wad",
        url: "http://www.pineapplemachine.com/files/doomwads/chrodoom.1.0.zip",
    },
];
