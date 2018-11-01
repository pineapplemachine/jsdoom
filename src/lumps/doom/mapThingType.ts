export enum WADMapThingClass {
    // Monsters/enemies
    Monster = 0,
    // Weapon item pickups
    Weapon = 1,
    // Ammunition item pickups
    Ammo = 2,
    // Item pickups that DO count against the intermission screen percentage
    Artifact = 3,
    // Item pickups that do NOT count against the intermission screen percentage
    Powerup = 4,
    // Key pickup; allows opening of some locked doors
    Key = 5,
    // Decorative things (collides with monsters and players)
    Obstacle = 6,
    // Decorative things (no collision)
    Decoration = 7,
    // Romero head thing
    Romero = 8,
    // Player and deathmath starts
    PlayerStart = 9,
    // Monster spawner and destination things
    Spawner = 10,
    // Teleport destination
    Teleport = 11,
}

// Represents a thing type.
export interface WADMapThingType {
    // Numeric identifier for this thing type.
    // Map things with a "type" value matching this number are of the type.
    id: number;
    // A human-readable name for this thing type.
    name: string;
    // Sprite lump prefix, e.g. "PSTR" for Berserk.
    sprite: string;
    // The "radius" of the thing. Not really a radius; really treated as the
    // distance from the center to the midpoint on the line of a bounding box.
    radius: number;
    // What category/class of thing is this?
    class: WADMapThingClass;
}

// A list of known thing types.
// TODO: Needs more detail.
// TODO: Account for e.g. DeHackEd patches.
export const WADMapThingTypeList: WADMapThingType[] = [
    // Artifact items
    {id: 0x7E7, sprite: "PSTR", radius: 20, name: "Berserk", class: WADMapThingClass.Artifact},
    {id: 0x7EA, sprite: "PMAP", radius: 20, name: "Computer map", class: WADMapThingClass.Artifact},
    {id: 0x7DE, sprite: "BON1", radius: 20, name: "Health bonus", class: WADMapThingClass.Artifact},
    {id: 0x7E8, sprite: "PINS", radius: 20, name: "Invisibility", class: WADMapThingClass.Artifact},
    {id: 0x7E6, sprite: "PINV", radius: 20, name: "Invulnerability", class: WADMapThingClass.Artifact},
    {id: 0x7FD, sprite: "PVIS", radius: 20, name: "Light amplification visor", class: WADMapThingClass.Artifact},
    {id: 0x053, sprite: "MEGA", radius: 20, name: "Megasphere", class: WADMapThingClass.Artifact},
    {id: 0x7DD, sprite: "SOUL", radius: 20, name: "Soulsphere", class: WADMapThingClass.Artifact},
    {id: 0x7DF, sprite: "BON2", radius: 20, name: "Armor bonus", class: WADMapThingClass.Artifact},
    // Powerup items
    {id: 0x008, sprite: "BPAK", radius: 20, name: "Backpack", class: WADMapThingClass.Powerup},
    {id: 0x7E3, sprite: "ARM2", radius: 20, name: "Blue armor", class: WADMapThingClass.Powerup},
    {id: 0x7E2, sprite: "ARM1", radius: 20, name: "Green armor", class: WADMapThingClass.Powerup},
    {id: 0x7DC, sprite: "MEDI", radius: 20, name: "Medikit", class: WADMapThingClass.Powerup},
    {id: 0x7E9, sprite: "SUIT", radius: 20, name: "Radiation suit", class: WADMapThingClass.Powerup},
    {id: 0x7DB, sprite: "STIM", radius: 20, name: "Stimpack", class: WADMapThingClass.Powerup},
    // Weapons
    {id: 0x7D6, sprite: "BFUG", radius: 20, name: "BFG 9000", class: WADMapThingClass.Weapon},
    {id: 0x7D2, sprite: "MGUN", radius: 20, name: "Chaingun", class: WADMapThingClass.Weapon},
    {id: 0x7D5, sprite: "CSAW", radius: 20, name: "Chainsaw", class: WADMapThingClass.Weapon},
    {id: 0x7D4, sprite: "PLAS", radius: 20, name: "Plasma rifle", class: WADMapThingClass.Weapon},
    {id: 0x7D3, sprite: "LAUN", radius: 20, name: "Rocket launcher", class: WADMapThingClass.Weapon},
    {id: 0x7D1, sprite: "SHOT", radius: 20, name: "Shotgun", class: WADMapThingClass.Weapon},
    // Ammunition
    {id: 0x7D7, sprite: "CLIP", radius: 20, name: "Ammo clip", class: WADMapThingClass.Ammo},
    {id: 0x800, sprite: "AMMO", radius: 20, name: "Box of ammo", class: WADMapThingClass.Ammo},
    {id: 0x7FE, sprite: "BROK", radius: 20, name: "Box of rockets", class: WADMapThingClass.Ammo},
    {id: 0x801, sprite: "SBOX", radius: 20, name: "Box of shells", class: WADMapThingClass.Ammo},
    {id: 0x7FF, sprite: "CELL", radius: 20, name: "Cell charge", class: WADMapThingClass.Ammo},
    {id: 0x011, sprite: "CELP", radius: 20, name: "Cell charge pack", class: WADMapThingClass.Ammo},
    {id: 0x7DA, sprite: "ROCK", radius: 20, name: "Rocket", class: WADMapThingClass.Ammo},
    {id: 0x7D8, sprite: "SHEL", radius: 20, name: "Shotgun shells", class: WADMapThingClass.Ammo},
    // Keys
    {id: 0x005, sprite: "BKEY", radius: 20, name: "Blue keycard", class: WADMapThingClass.Key},
    {id: 0x028, sprite: "BSKU", radius: 20, name: "Blue skull key", class: WADMapThingClass.Key},
    {id: 0x00D, sprite: "RKEY", radius: 20, name: "Red keycard", class: WADMapThingClass.Key},
    {id: 0x026, sprite: "RSKU", radius: 20, name: "Red skull key", class: WADMapThingClass.Key},
    {id: 0x006, sprite: "YKEY", radius: 20, name: "Yellow keycard", class: WADMapThingClass.Key},
    {id: 0x027, sprite: "YSKU", radius: 20, name: "Yellow skull key", class: WADMapThingClass.Key},
    // Monsters
    {id: 0x044, sprite: "BSPI", radius: 64, name: "Arachnotron", class: WADMapThingClass.Monster},
    {id: 0x040, sprite: "VILE", radius: 20, name: "Arch-Vile", class: WADMapThingClass.Monster},
    {id: 0xBBB, sprite: "BOSS", radius: 24, name: "Baron of Hell", class: WADMapThingClass.Monster},
    {id: 0xBBD, sprite: "HEAD", radius: 31, name: "Cacodemon", class: WADMapThingClass.Monster},
    {id: 0x041, sprite: "CPOS", radius: 20, name: "Chaingunner", class: WADMapThingClass.Monster},
    {id: 0x048, sprite: "KEEN", radius: 16, name: "Commander Keen", class: WADMapThingClass.Monster},
    {id: 0x010, sprite: "CYBR", radius: 40, name: "Cyberdemon", class: WADMapThingClass.Monster},
    {id: 0xBBA, sprite: "SARG", radius: 30, name: "Demon", class: WADMapThingClass.Monster},
    {id: 0xBBC, sprite: "POSS", radius: 20, name: "Former Human", class: WADMapThingClass.Monster},
    {id: 0x009, sprite: "SPOS", radius: 20, name: "Former Sergeant", class: WADMapThingClass.Monster},
    {id: 0x045, sprite: "BOS2", radius: 24, name: "Hell Knight", class: WADMapThingClass.Monster},
    {id: 0xBB9, sprite: "TROO", radius: 20, name: "Imp", class: WADMapThingClass.Monster},
    {id: 0xBBE, sprite: "SKUL", radius: 16, name: "Lost Soul", class: WADMapThingClass.Monster},
    {id: 0x043, sprite: "FATT", radius: 48, name: "Mancubus", class: WADMapThingClass.Monster},
    {id: 0x047, sprite: "PAIN", radius: 31, name: "Pain Elemental", class: WADMapThingClass.Monster},
    {id: 0x042, sprite: "SKEL", radius: 20, name: "Revenant", class: WADMapThingClass.Monster},
    {id: 0x03A, sprite: "SARG", radius: 30, name: "Spectre", class: WADMapThingClass.Monster},
    {id: 0x007, sprite: "SPID", radius: 128, name: "Spider Mastermind", class: WADMapThingClass.Monster},
    {id: 0x054, sprite: "SSWV", radius: 20, name: "Wolfenstein SS", class: WADMapThingClass.Monster},
    // Obstacles
    {id: 0x7F3, sprite: "BAR1", radius: 10, name: "Barrel", class: WADMapThingClass.Obstacle},
    {id: 0x046, sprite: "FCAN", radius: 10, name: "Burning barrel", class: WADMapThingClass.Obstacle},
    {id: 0x02B, sprite: "TRE1", radius: 16, name: "Burnt tree", class: WADMapThingClass.Obstacle},
    {id: 0x023, sprite: "CBRA", radius: 16, name: "Candelabra", class: WADMapThingClass.Obstacle},
    {id: 0x029, sprite: "CEYE", radius: 16, name: "Evil eye", class: WADMapThingClass.Obstacle},
    {id: 0x01C, sprite: "POL2", radius: 16, name: "Five-skull shish kebab", class: WADMapThingClass.Obstacle},
    {id: 0x02A, sprite: "FSKU", radius: 16, name: "Floating skull", class: WADMapThingClass.Obstacle},
    {id: 0x7EC, sprite: "COLU", radius: 16, name: "Floor lamp", class: WADMapThingClass.Obstacle},
    {id: 0x035, sprite: "GOR5", radius: 16, name: "Hanging leg", class: WADMapThingClass.Obstacle},
    {id: 0x034, sprite: "GOR4", radius: 16, name: "Hanging pair of legs", class: WADMapThingClass.Obstacle},
    {id: 0x04E, sprite: "HDB6", radius: 16, name: "Hanging torso, brain removed", class: WADMapThingClass.Obstacle},
    {id: 0x04B, sprite: "HDB3", radius: 16, name: "Hanging torso, looking down", class: WADMapThingClass.Obstacle},
    {id: 0x04D, sprite: "HDB5", radius: 16, name: "Hanging torso, looking up", class: WADMapThingClass.Obstacle},
    {id: 0x04C, sprite: "HDB4", radius: 16, name: "Hanging torso, open skull", class: WADMapThingClass.Obstacle},
    {id: 0x032, sprite: "GOR2", radius: 16, name: "Hanging victim, arms out", class: WADMapThingClass.Obstacle},
    {id: 0x04A, sprite: "HDB2", radius: 16, name: "Hanging victim, guts and brain removed", class: WADMapThingClass.Obstacle},
    {id: 0x049, sprite: "HDB1", radius: 16, name: "Hanging victim, guts removed", class: WADMapThingClass.Obstacle},
    {id: 0x033, sprite: "GOR3", radius: 16, name: "Hanging victim, one-legged", class: WADMapThingClass.Obstacle},
    {id: 0x031, sprite: "GOR1", radius: 16, name: "Hanging victim, twitching", class: WADMapThingClass.Obstacle},
    {id: 0x019, sprite: "POL1", radius: 16, name: "Impaled human", class: WADMapThingClass.Obstacle},
    {id: 0x036, sprite: "TRE2", radius: 32, name: "Large brown tree", class: WADMapThingClass.Obstacle},
    {id: 0x01D, sprite: "POL3", radius: 16, name: "Pile of skulls and candles", class: WADMapThingClass.Obstacle},
    {id: 0x037, sprite: "SMBT", radius: 16, name: "Short blue firestick", class: WADMapThingClass.Obstacle},
    {id: 0x038, sprite: "SMGT", radius: 16, name: "Short green firestick", class: WADMapThingClass.Obstacle},
    {id: 0x01F, sprite: "COL2", radius: 16, name: "Short green pillar", class: WADMapThingClass.Obstacle},
    {id: 0x024, sprite: "COL5", radius: 16, name: "Short green pillar with beating heart", class: WADMapThingClass.Obstacle},
    {id: 0x039, sprite: "SMRT", radius: 16, name: "Short red firestick", class: WADMapThingClass.Obstacle},
    {id: 0x021, sprite: "COL4", radius: 16, name: "Short red pillar", class: WADMapThingClass.Obstacle},
    {id: 0x025, sprite: "COL6", radius: 16, name: "Short red pillar with skull", class: WADMapThingClass.Obstacle},
    {id: 0x056, sprite: "TLP2", radius: 16, name: "Short techno floor lamp", class: WADMapThingClass.Obstacle},
    {id: 0x01B, sprite: "POL4", radius: 16, name: "Skull on a pole", class: WADMapThingClass.Obstacle},
    {id: 0x02F, sprite: "SMIT", radius: 16, name: "Stalagmite", class: WADMapThingClass.Obstacle},
    {id: 0x02C, sprite: "TBLU", radius: 16, name: "Tall blue firestick", class: WADMapThingClass.Obstacle},
    {id: 0x02D, sprite: "TGRN", radius: 16, name: "Tall green firestick", class: WADMapThingClass.Obstacle},
    {id: 0x01E, sprite: "COL1", radius: 16, name: "Tall green pillar", class: WADMapThingClass.Obstacle},
    {id: 0x02E, sprite: "TRED", radius: 16, name: "Tall red firestick", class: WADMapThingClass.Obstacle},
    {id: 0x020, sprite: "COL3", radius: 16, name: "Tall red pillar", class: WADMapThingClass.Obstacle},
    {id: 0x055, sprite: "TLMP", radius: 16, name: "Tall techno floor lamp", class: WADMapThingClass.Obstacle},
    {id: 0x030, sprite: "ELEC", radius: 16, name: "Tall techno pillar", class: WADMapThingClass.Obstacle},
    {id: 0x01A, sprite: "POL6", radius: 16, name: "Twitching impaled human", class: WADMapThingClass.Obstacle},
    // Decorations
    {id: 0x00A, sprite: "PLAY", radius: 16, name: "Bloody mess", class: WADMapThingClass.Decoration},
    {id: 0x00C, sprite: "PLAY", radius: 16, name: "Bloody mess", class: WADMapThingClass.Decoration},
    {id: 0x022, sprite: "CAND", radius: 16, name: "Candle", class: WADMapThingClass.Decoration},
    {id: 0x016, sprite: "HEAD", radius: 31, name: "Dead cacodemon", class: WADMapThingClass.Decoration},
    {id: 0x015, sprite: "SARG", radius: 30, name: "Dead demon", class: WADMapThingClass.Decoration},
    {id: 0x012, sprite: "POSS", radius: 20, name: "Dead former human", class: WADMapThingClass.Decoration},
    {id: 0x013, sprite: "SPOS", radius: 20, name: "Dead former sergeant", class: WADMapThingClass.Decoration},
    {id: 0x014, sprite: "TROO", radius: 20, name: "Dead imp", class: WADMapThingClass.Decoration},
    {id: 0x017, sprite: "SKUL", radius: 16, name: "Dead lost soul (invisible)", class: WADMapThingClass.Decoration},
    {id: 0x00F, sprite: "PLAY", radius: 16, name: "Dead player", class: WADMapThingClass.Decoration},
    {id: 0x03E, sprite: "GOR5", radius: 16, name: "Hanging leg", class: WADMapThingClass.Decoration},
    {id: 0x03C, sprite: "GOR4", radius: 16, name: "Hanging pair of legs", class: WADMapThingClass.Decoration},
    {id: 0x03B, sprite: "GOR2", radius: 16, name: "Hanging victim, arms out", class: WADMapThingClass.Decoration},
    {id: 0x03D, sprite: "GOR3", radius: 16, name: "Hanging victim, one-legged", class: WADMapThingClass.Decoration},
    {id: 0x03F, sprite: "GOR1", radius: 16, name: "Hanging victim, twitching", class: WADMapThingClass.Decoration},
    {id: 0x04F, sprite: "POB1", radius: 16, name: "Pool of blood", class: WADMapThingClass.Decoration},
    {id: 0x050, sprite: "POB2", radius: 16, name: "Pool of blood", class: WADMapThingClass.Decoration},
    {id: 0x018, sprite: "POL5", radius: 16, name: "Pool of blood and flesh", class: WADMapThingClass.Decoration},
    {id: 0x051, sprite: "BRS1", radius: 16, name: "Pool of brains", class: WADMapThingClass.Decoration},
    // Player starts
    {id: 0x00B, sprite: "", radius: 20, name: "Deathmatch start", class: WADMapThingClass.PlayerStart},
    {id: 0x001, sprite: "PLAY", radius: 16, name: "Player 1 start", class: WADMapThingClass.PlayerStart},
    {id: 0x002, sprite: "PLAY", radius: 16, name: "Player 2 start", class: WADMapThingClass.PlayerStart},
    {id: 0x003, sprite: "PLAY", radius: 16, name: "Player 3 start", class: WADMapThingClass.PlayerStart},
    {id: 0x004, sprite: "PLAY", radius: 16, name: "Player 4 start", class: WADMapThingClass.PlayerStart},
    // Others
    {id: 0x058, sprite: "BBRN", radius: 16, name: "Boss Brain", class: WADMapThingClass.Romero},
    {id: 0x059, sprite: "", radius: 20, name: "Spawn shooter", class: WADMapThingClass.Spawner},
    {id: 0x057, sprite: "", radius: 0, name: "Spawn spot", class: WADMapThingClass.Spawner},
    {id: 0x00E, sprite: "", radius: 20, name: "Teleport landing", class: WADMapThingClass.Teleport},
];
