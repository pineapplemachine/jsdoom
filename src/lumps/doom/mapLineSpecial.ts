// Represents a linedef special.
// TODO: Also programmatically describe linedef behavior
export interface WADMapLineSpecial {
    // The numeric identifier for the special
    id: number;
    // A human-readable name for this linedef special
    name: string;
}

// Represents a generalized linedef special. (Boom)
export interface WADMapLineSpecialGeneralized {
    // Linedef specials equal to or greater than low and less than high
    // are of this linedef type.
    low: number;
    high: number;
    // A human-readable name for this linedef special
    name: string;
}

// A list of recognized generalized linedef specials.
export const WADMapLineSpecialGeneralizedList: WADMapLineSpecialGeneralized[] = [
    {low: 0x2F80, high: 0x3000, name: "Crusher (Generalized)"},
    {low: 0x3000, high: 0x3400, name: "Stairs (Generalized)"},
    {low: 0x3400, high: 0x3800, name: "Lift (Generalized)"},
    {low: 0x3800, high: 0x3C00, name: "Locked Door (Generalized)"},
    {low: 0x3C00, high: 0x4000, name: "Door (Generalized)"},
    {low: 0x4000, high: 0x6000, name: "Ceiling (Generalized)"},
    {low: 0x6000, high: 0x8000, name: "Floor (Generalized)"},
];

// A list of recognized linedef specials.
export const WADMapLineSpecialList: WADMapLineSpecial[] = [
    {id: 0x0001, name: "DR Door"}, // Doom
    {id: 0x0002, name: "W1 Door Stay Open"}, // Doom
    {id: 0x0003, name: "W1 Door Close"}, // Doom
    {id: 0x0004, name: "W1 Door"}, // Doom
    {id: 0x0005, name: "W1 Floor To Lowest Adjacent Ceiling"}, // Doom
    {id: 0x0006, name: "W1 Start Crusher, Fast Damage"}, // Doom
    {id: 0x0007, name: "S1 Build Stairs 8 Up"}, // Doom
    {id: 0x0008, name: "W1 Build Stairs 8 Up"}, // Doom
    {id: 0x0009, name: "S1 Floor Donut"}, // Doom
    {id: 0x000A, name: "W1 Lift Also Monsters"}, // Doom
    {id: 0x000B, name: "S1 Exit (Normal)"}, // Doom
    {id: 0x000C, name: "W1 Light To Highest Adjacent Level"}, // Doom
    {id: 0x000D, name: "W1 Light To 255"}, // Doom
    {id: 0x000E, name: "S1 Floor Up 32 Change Texture"}, // Doom
    {id: 0x000F, name: "S1 Floor Up 24 Change Texture"}, // Doom
    {id: 0x0010, name: "W1 Door Close and Open"}, // Doom
    {id: 0x0011, name: "W1 Light Blink 1.0 Sec"}, // Doom
    {id: 0x0012, name: "S1 Floor To Higher Adjacent Floor"}, // Doom
    {id: 0x0013, name: "W1 Floor To Highest Adjacent Floor"}, // Doom
    {id: 0x0014, name: "S1 Floor To Higher Floor Change Texture"}, // Doom
    {id: 0x0015, name: "S1 Lift"}, // Doom
    {id: 0x0016, name: "W1 Floor To Higher Floor Change Texture"}, // Doom
    {id: 0x0017, name: "S1 Floor To Lowest Adjacent Floor"}, // Doom
    {id: 0x0018, name: "G1 Floor To Lowest Adjacent Ceiling"}, // Doom
    {id: 0x0019, name: "W1 Start Crusher, Slow Damage"}, // Doom
    {id: 0x001A, name: "DR Door Blue Key"}, // Doom
    {id: 0x001B, name: "DR Door Yellow Key"}, // Doom
    {id: 0x001C, name: "DR Door Red Key"}, // Doom
    {id: 0x001D, name: "S1 Door"}, // Doom
    {id: 0x001E, name: "W1 Floor Up Shortest Lower Texture"}, // Doom
    {id: 0x001F, name: "D1 Door Stay Open"}, // Doom
    {id: 0x0020, name: "D1 Door Blue Key"}, // Doom
    {id: 0x0021, name: "D1 Door Red Key"}, // Doom
    {id: 0x0022, name: "D1 Door Yellow Key"}, // Doom
    {id: 0x0023, name: "W1 Light To 35"}, // Doom
    {id: 0x0024, name: "W1 Floor To 8 Above Highest Adjacent Floor Fast"}, // Doom
    {id: 0x0025, name: "W1 Floor To Lowest Adjacent Floor Change Texture and Type"}, // Doom
    {id: 0x0026, name: "W1 Floor To Lowest Adjacent Floor"}, // Doom
    {id: 0x0027, name: "W1 Teleport"}, // Doom
    {id: 0x0028, name: "W1 Ceiling To Highest Ceiling"}, // Doom
    {id: 0x0029, name: "S1 Ceiling To Floor"}, // Doom
    {id: 0x002A, name: "SR Door Close"}, // Doom
    {id: 0x002B, name: "SR Ceiling To Floor"}, // Doom
    {id: 0x002C, name: "W1 Ceiling To 8 Above Floor"}, // Doom
    {id: 0x002D, name: "SR Floor To Highest Adjacent Floor"}, // Doom
    {id: 0x002E, name: "GR Door Also Monsters"}, // Doom
    {id: 0x002F, name: "G1 Floor To Higher Floor Change Texture"}, // Doom
    {id: 0x0030, name: "Scrolling Wall Left"}, // Doom
    {id: 0x0031, name: "S1 Start Crusher, Slow Damage"}, // Doom
    {id: 0x0032, name: "S1 Door Close"}, // Doom
    {id: 0x0033, name: "S1 Exit (Secret)"}, // Doom
    {id: 0x0034, name: "W1 Exit (Normal)"}, // Doom
    {id: 0x0035, name: "W1 Start Moving Floor"}, // Doom
    {id: 0x0036, name: "W1 Stop Moving Floor"}, // Doom
    {id: 0x0037, name: "S1 Floor To 8 Below Lowest Adjacent Ceiling and Crush"}, // Doom
    {id: 0x0038, name: "W1 Floor To 8 Below Lowest Adjacent Ceiling and Crush"}, // Doom
    {id: 0x0039, name: "W1 Stop Crusher"}, // Doom
    {id: 0x003A, name: "W1 Floor Up 24"}, // Doom
    {id: 0x003B, name: "W1 Floor Up 24 Change Texture and Type"}, // Doom
    {id: 0x003C, name: "SR Floor To Lowest Adjacent Floor"}, // Doom
    {id: 0x003D, name: "SR Door Stay Open"}, // Doom
    {id: 0x003E, name: "SR Lift"}, // Doom
    {id: 0x003F, name: "SR Door"}, // Doom
    {id: 0x0040, name: "SR Floor To Lowest Adjacent Ceiling"}, // Doom
    {id: 0x0041, name: "SR Floor To 8 Below Lowest Adjacent Ceiling and Crush"}, // Doom
    {id: 0x0042, name: "SR Floor Up 24 Change Texture"}, // Doom
    {id: 0x0043, name: "SR Floor Up 32 Change Texture"}, // Doom
    {id: 0x0044, name: "SR Floor To Higher Floor Change Texture"}, // Doom
    {id: 0x0045, name: "SR Floor To Higher Adjacent Floor"}, // Doom
    {id: 0x0046, name: "SR Floor To 8 Above Higher Adjacent Floor Fast"}, // Doom
    {id: 0x0047, name: "S1 Floor To 8 Above Higher Adjacent Floor Fast"}, // Doom
    {id: 0x0048, name: "WR Ceiling To 8 Above Floor"}, // Doom
    {id: 0x0049, name: "WR Start Crusher, Slow Damage"}, // Doom
    {id: 0x004A, name: "WR Stop Crusher"}, // Doom
    {id: 0x004B, name: "WR Door Close"}, // Doom
    {id: 0x004C, name: "WR Door Close and Open"}, // Doom
    {id: 0x004D, name: "WR Start Crusher, Fast Damage"}, // Doom
    {id: 0x004E, name: "SR Change Floor Texture and Type (Numeric Model)"}, // Boom
    {id: 0x004F, name: "WR Light To 35"}, // Doom
    {id: 0x0050, name: "WR Light To Highest Adjacent Level"}, // Doom
    {id: 0x0051, name: "WR Light To 255"}, // Doom
    {id: 0x0052, name: "WR Floor To Lowest Adjacent Floor"}, // Doom
    {id: 0x0053, name: "WR Floor To Highest Adjacent Floor"}, // Doom
    {id: 0x0054, name: "WR Floor To Lowest Adjacent Floor Change Texture and Type"}, // Doom
    {id: 0x0055, name: "-- Scrolling Wall (Right)"}, // Boom
    {id: 0x0056, name: "WR Door Stay Open"}, // Doom
    {id: 0x0057, name: "WR Start Moving Floor"}, // Doom
    {id: 0x0058, name: "WR Lift Also Monsters"}, // Doom
    {id: 0x0059, name: "WR Stop Moving Floor"}, // Doom
    {id: 0x005A, name: "WR Door"}, // Doom
    {id: 0x005B, name: "WR Floor To Lowest Adjacent Ceiling"}, // Doom
    {id: 0x005C, name: "WR Floor Up 24"}, // Doom
    {id: 0x005D, name: "WR Floor Up 24 Change Texture and Type"}, // Doom
    {id: 0x005E, name: "WR Floor To 8 Below Lowest Adjacent Ceiling and Crush"}, // Doom
    {id: 0x005F, name: "WR Floor To Higher Floor Change Texture"}, // Doom
    {id: 0x0060, name: "WR Floor Up Shortest Lower Texture"}, // Doom
    {id: 0x0061, name: "WR Teleport"}, // Doom
    {id: 0x0062, name: "WR Floor To 8 Above Highest Adjacent Floor Fast"}, // Doom
    {id: 0x0063, name: "SR Door Blue Key Fast"}, // Doom II
    {id: 0x0064, name: "W1 Build Stairs 16 and Crush"}, // Doom II
    {id: 0x0065, name: "S1 Floor To Lowest Adjacent Ceiling"}, // Doom
    {id: 0x0066, name: "S1 Floor To Highest Adjacent Floor"}, // Doom
    {id: 0x0067, name: "S1 Door Stay Open"}, // Doom
    {id: 0x0068, name: "W1 Light To Lowest Adjacent Level"}, // Doom
    {id: 0x0069, name: "WR Door Fast"}, // Doom II
    {id: 0x006A, name: "WR Door Stay Open Fast"}, // Doom II
    {id: 0x006B, name: "WR Door Close Fast"}, // Doom II
    {id: 0x006C, name: "W1 Door Fast"}, // Doom II
    {id: 0x006D, name: "W1 Door Stay Open Fast"}, // Doom II
    {id: 0x006E, name: "W1 Door Close Fast"}, // Doom II
    {id: 0x006F, name: "S1 Door Fast"}, // Doom II
    {id: 0x0070, name: "S1 Door Stay Open Fast"}, // Doom II
    {id: 0x0071, name: "S1 Door Close Fast"}, // Doom II
    {id: 0x0072, name: "SR Door Fast"}, // Doom II
    {id: 0x0073, name: "SR Door Stay Open Fast"}, // Doom II
    {id: 0x0074, name: "SR Door Close Fast"}, // Doom II
    {id: 0x0075, name: "DR Door Fast"}, // Doom II
    {id: 0x0076, name: "D1 Door Fast"}, // Doom II
    {id: 0x0077, name: "W1 Floor To Higher Adjacent Floor"}, // Doom II
    {id: 0x0078, name: "WR Lift Fast"}, // Doom II
    {id: 0x0079, name: "W1 Lift Fast"}, // Doom II
    {id: 0x007A, name: "S1 Lift Fast"}, // Doom II
    {id: 0x007B, name: "SR Lift Fast"}, // Doom II
    {id: 0x007C, name: "W1 Exit (Secret)"}, // Doom II
    {id: 0x007D, name: "W1 Teleport Monsters Only"}, // Doom II
    {id: 0x007E, name: "WR Teleport Monsters Only"}, // Doom II
    {id: 0x007F, name: "S1 Build Stairs 16 + Crush"}, // Doom II
    {id: 0x0080, name: "WR Floor To Higher Adjacent Floor"}, // Doom II
    {id: 0x0081, name: "WR Floor To Higher Floor Fast"}, // Doom II
    {id: 0x0082, name: "W1 Floor To Higher Floor Fast"}, // Doom II
    {id: 0x0083, name: "S1 Floor To Higher Floor Fast"}, // Doom II
    {id: 0x0084, name: "SR Floor To Higher Floor Fast"}, // Doom II
    {id: 0x0085, name: "S1 Door Blue Key Fast"}, // Doom II
    {id: 0x0086, name: "SR Door Red Key Fast"}, // Doom II
    {id: 0x0087, name: "S1 Door Red Key Fast"}, // Doom II
    {id: 0x0088, name: "SR Door Yellow Key Fast"}, // Doom II
    {id: 0x0089, name: "S1 Door Yellow Key Fast"}, // Doom II
    {id: 0x008A, name: "SR Light To 255"}, // Doom II
    {id: 0x008B, name: "SR Light To 35"}, // Doom II
    {id: 0x008C, name: "S1 Floor Up 512"}, // Doom II
    {id: 0x008D, name: "W1 Start Crusher, Silent"}, // Doom II
    {id: 0x008E, name: "W1 Floor Up 512"}, // Boom
    {id: 0x008F, name: "W1 Lift Up 24 Change Texture"}, // Boom
    {id: 0x0090, name: "W1 Lift Up 24 Remove Type"}, // Boom
    {id: 0x0091, name: "W1 Ceiling Down To Floor Fast"}, // Boom
    {id: 0x0092, name: "W1 Floor Donut Raise"}, // Boom
    {id: 0x0093, name: "WR Floor Up 512"}, // Boom
    {id: 0x0094, name: "WR Lift Up 24 Change Texture"}, // Boom
    {id: 0x0095, name: "WR Lift Up 24 Remove Type"}, // Boom
    {id: 0x0096, name: "WR Start Crusher Silent"}, // Boom
    {id: 0x0097, name: "WR Ceiling Up To Highest Ceiling"}, // Boom
    {id: 0x0098, name: "WR Ceiling Down To Floor Fast"}, // Boom
    {id: 0x0099, name: "W1 Change Floor Texture and Type (Trigger Model)"}, // Boom
    {id: 0x009A, name: "WR Change Floor Texture and Type (Trigger Model)"}, // Boom
    {id: 0x009B, name: "WR Floor Donut Raise"}, // Boom
    {id: 0x009C, name: "WR Light Start Blinking"}, // Boom
    {id: 0x009D, name: "WR Light To Lowest Adjacent Level"}, // Boom
    {id: 0x009E, name: "S1 Floor Up By Shortest Lower Tex"}, // Boom
    {id: 0x009F, name: "S1 Floor To Lowest Adjacent Floor"}, // Boom
    {id: 0x00A0, name: "S1 Floor Up 24 Change Texture and Type"}, // Boom
    {id: 0x00A1, name: "S1 Floor Up 24"}, // Boom
    {id: 0x00A2, name: "S1 Lift Perpetual"}, // Boom
    {id: 0x00A3, name: "S1 Lift Stop"}, // Boom
    {id: 0x00A4, name: "S1 Start Crusher, Fast Damage"}, // Boom
    {id: 0x00A5, name: "S1 Start Crusher Silent"}, // Boom
    {id: 0x00A6, name: "S1 Ceiling Up To Highest Ceiling"}, // Boom
    {id: 0x00A7, name: "S1 Ceiling Down To 8 Above Floor"}, // Boom
    {id: 0x00A8, name: "S1 Stop Crusher"}, // Boom
    {id: 0x00A9, name: "S1 Light To Highest Adjacent Level"}, // Boom
    {id: 0x00AA, name: "S1 Light To 35"}, // Boom
    {id: 0x00AB, name: "S1 Light To 255"}, // Boom
    {id: 0x00AC, name: "S1 Light Start Blinking"}, // Boom
    {id: 0x00AD, name: "S1 Light To Lowest Adjacent Level"}, // Boom
    {id: 0x00AE, name: "S1 Teleport"}, // Boom
    {id: 0x00AF, name: "S1 Door Close and Open"}, // Boom
    {id: 0x00B0, name: "SR Floor Up By Shortest Lower Texture"}, // Boom
    {id: 0x00B1, name: "SR Floor To Lowest Adjacent Floor"}, // Boom
    {id: 0x00B2, name: "SR Floor Up 512"}, // Boom
    {id: 0x00B3, name: "SR Floor Up 24 Change Texture and Type"}, // Boom
    {id: 0x00B4, name: "SR Floor Up 24"}, // Boom
    {id: 0x00B5, name: "SR Lift Perpetual"}, // Boom
    {id: 0x00B6, name: "SR Lift Stop"}, // Boom
    {id: 0x00B7, name: "SR Start Crusher, Fast Damage"}, // Boom
    {id: 0x00B8, name: "SR Start Crusher"}, // Boom
    {id: 0x00B9, name: "SR Start Crusher Silent"}, // Boom
    {id: 0x00BA, name: "SR Ceiling Up To Highest Ceiling"}, // Boom
    {id: 0x00BB, name: "SR Ceiling Down To 8 Above Floor"}, // Boom
    {id: 0x00BC, name: "SR Stop Crusher"}, // Boom
    {id: 0x00BD, name: "S1 Change Floor Texture and Type (Trigger Model)"}, // Boom
    {id: 0x00BE, name: "SR Change Floor Texture and Type (Trigger Model)"}, // Boom
    {id: 0x00BF, name: "SR Floor Donut Raise"}, // Boom
    {id: 0x00C0, name: "SR Light To Highest Adjacent Level"}, // Boom
    {id: 0x00C1, name: "SR Light Start Blinking"}, // Boom
    {id: 0x00C2, name: "SR Light To Lowest Adjacent Level"}, // Boom
    {id: 0x00C3, name: "SR Teleport"}, // Boom
    {id: 0x00C4, name: "SR Door Close then Open"}, // Boom
    {id: 0x00C5, name: "G1 Exit (Normal)"}, // Boom
    {id: 0x00C6, name: "G1 Exit (Secret)"}, // Boom
    {id: 0x00C7, name: "W1 Ceiling Down To Lowest Ceiling"}, // Boom
    {id: 0x00C8, name: "W1 Ceiling Down To Highest Floor"}, // Boom
    {id: 0x00C9, name: "WR Ceiling Down To Lowest Ceiling"}, // Boom
    {id: 0x00CA, name: "WR Ceiling Down To Highest Floor"}, // Boom
    {id: 0x00CB, name: "S1 Ceiling Down To Lowest Ceiling"}, // Boom
    {id: 0x00CC, name: "S1 Ceiling Down To Highest Floor"}, // Boom
    {id: 0x00CD, name: "SR Ceiling Down To Lowest Ceiling"}, // Boom
    {id: 0x00CE, name: "SR Ceiling Down To Highest Floor"}, // Boom
    {id: 0x00CF, name: "W1 Teleport Preserve Direction (Silent)"}, // Boom
    {id: 0x00D0, name: "WR Teleport Preserve Direction (Silent)"}, // Boom
    {id: 0x00D1, name: "S1 Teleport Preserve Direction (Silent)"}, // Boom
    {id: 0x00D2, name: "SR Teleport Preserve Direction (Silent)"}, // Boom
    {id: 0x00D3, name: "SR Toggle Floor To Ceiling (Instant)"}, // Boom
    {id: 0x00D4, name: "WR Toggle Floor To Ceiling (Instant)"}, // Boom
    {id: 0x00D5, name: "-- Transfer Floor Light"}, // Boom
    {id: 0x00D6, name: "-- Accelerate Tagged Ceiling w.r.t. 1st Side's Sector"}, // Boom
    {id: 0x00D7, name: "-- Accelerate Tagged Floor w.r.t. 1st Side's Sector"}, // Boom
    {id: 0x00D8, name: "-- Accelerate Objects on Tagged Floor wrt 1st Side's Sector"}, // Boom
    {id: 0x00D9, name: "-- Accelerate Objects and Tagged Floor wrt 1st Side's Sector"}, // Boom
    {id: 0x00DA, name: "-- Accelerate Tagged Wall w.r.t 1st Side's Sector"}, // Boom
    {id: 0x00DB, name: "W1 Floor Down To Adjacent Floor"}, // Boom
    {id: 0x00DC, name: "WR Floor Down To Adjacent Floor"}, // Boom
    {id: 0x00DD, name: "S1 Floor Down To Adjacent Floor"}, // Boom
    {id: 0x00DE, name: "SR Floor Down To Adjacent Floor"}, // Boom
    {id: 0x00DF, name: "-- Set Friction To Length"}, // Boom
    {id: 0x00E0, name: "-- Set Wind"}, // Boom
    {id: 0x00E1, name: "-- Set Current"}, // Boom
    {id: 0x00E2, name: "-- Point Pusher"}, // Boom
    {id: 0x00E3, name: "W1 Elevator To Higher Floor"}, // Boom
    {id: 0x00E4, name: "WR Elevator To Higher Floor"}, // Boom
    {id: 0x00E5, name: "S1 Elevator To Higher Floor"}, // Boom
    {id: 0x00E6, name: "SR Elevator To Higher Floor"}, // Boom
    {id: 0x00E7, name: "W1 Elevator To Lower Floor"}, // Boom
    {id: 0x00E8, name: "WR Elevator To Lower Floor"}, // Boom
    {id: 0x00E9, name: "S1 Elevator To Lower Floor"}, // Boom
    {id: 0x00EA, name: "SR Elevator To Lower Floor"}, // Boom
    {id: 0x00EB, name: "W1 Elevator To Current Floor"}, // Boom
    {id: 0x00EC, name: "WR Elevator To Current Floor"}, // Boom
    {id: 0x00ED, name: "S1 Elevator To Current Floor"}, // Boom
    {id: 0x00EE, name: "SR Elevator To Current Floor"}, // Boom
    {id: 0x00EF, name: "W1 Change Floor Texture and Type (Numeric Model)"}, // Boom
    {id: 0x00F0, name: "WR Change Floor Texture and Type (Numeric Model)"}, // Boom
    {id: 0x00F1, name: "S1 Change Floor Texture and Type (Numeric Model)"}, // Boom
    {id: 0x00F2, name: "-- Transfer Heights"}, // Boom
    {id: 0x00F3, name: "W1 Teleport Line"}, // Boom
    {id: 0x00F4, name: "WR Teleport Line"}, // Boom
    {id: 0x00F5, name: "-- Scroll Tagged Ceiling w.r.t. 1st Side's Sector"}, // Boom
    {id: 0x00F6, name: "-- Scroll Tagged Floor w.r.t. 1st Side's Sector"}, // Boom
    {id: 0x00F7, name: "-- Push Objects on Tagged Floor wrt 1st Side's Sector"}, // Boom
    {id: 0x00F8, name: "-- Push Objects & Tagged Floor wrt 1st Side's Sector"}, // Boom
    {id: 0x00F9, name: "-- Scroll Tagged Wall w.r.t 1st Side's Sector"}, // Boom
    {id: 0x00FA, name: "-- Scroll Tagged Ceiling"}, // Boom
    {id: 0x00FB, name: "-- Scroll Tagged Floor"}, // Boom
    {id: 0x00FC, name: "-- Carry Objects on Tagged Floor"}, // Boom
    {id: 0x00FD, name: "-- Scroll Tagged Floor, Carry Objects"}, // Boom
    {id: 0x00FE, name: "-- Scroll Tagged Wall, Same as Floor/Ceiling"}, // Boom
    {id: 0x00FF, name: "-- Scroll Wall Using Sidedef Offsets"}, // Boom
    {id: 0x0100, name: "WR Build Stairs 8"}, // Boom
    {id: 0x0101, name: "WR Build Stairs 16 + Crush"}, // Boom
    {id: 0x0102, name: "SR Build Stairs 8"}, // Boom
    {id: 0x0103, name: "SR Build Stairs 16 + Crush"}, // Boom
    {id: 0x0104, name: "-- Translucent Line"}, // Boom
    {id: 0x0105, name: "-- Transfer Ceiling Light"}, // Boom
    {id: 0x0106, name: "W1 Teleport Line (Reversed)"}, // Boom
    {id: 0x0107, name: "WR Teleport Line (Reversed)"}, // Boom
    {id: 0x0108, name: "W1 Teleport Line Monsters Only (Reversed)"}, // Boom
    {id: 0x0109, name: "WR Teleport Line Monsters Only (Reversed)"}, // Boom
    {id: 0x010A, name: "W1 Teleport Line Monsters Only"}, // Boom
    {id: 0x010B, name: "WR Teleport Line Monsters Only"}, // Boom
    {id: 0x010C, name: "W1 Teleport Monsters Only (Silent)"}, // Boom
    {id: 0x010D, name: "WR Teleport Monsters Only (Silent)"}, // Boom
];
