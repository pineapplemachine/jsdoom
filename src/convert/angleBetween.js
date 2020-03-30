{
function angleBetween(p1, p2, p3){
    // http://stackoverflow.com/questions/3486172/angle-between-3-points
    // modified not to bother converting to degrees
    const ab = {x: p2.x - p1.x, y: p2.y - p1.y};
    const cb = {x: p2.x - p3.x, y: p2.y - p3.y};
    // dot product
    const dot = ab.x * cb.x + ab.y * cb.y;
    // length square of both vectors
    const abSqr = ab.x * ab.x + ab.y * ab.y;
    const cbSqr = cb.x * cb.x + cb.y * cb.y;
    // square of cosine of the needed angle
    const cosSqr = dot * dot / abSqr / cbSqr;
    // this is a known trigonometric equality:
    // cos(alpha * 2) = [ cos(alpha) ]^2 * 2 - 1
    const cos2 = 2.0 * cosSqr - 1.0;
    // Here's the only invocation of the heavy function.
    // It's a good idea to check explicitly if cos2 is within [-1 .. 1] range
    let alpha2 = Math.acos(cos2);
    if(cos2 <= -1){
        alpha2 = Math.PI;
    }else if(cos2 >= 1){
        alpha2 = 0.0;
    }
    let rs = alpha2 * 0.5;
    // Now revolve the ambiguities.
    // 1. If dot product of two vectors is negative - the angle is
    // definitely above 90 degrees. Still we have no information regarding
    // the sign of the angle.
    // NOTE: This ambiguity is the consequence of our method: calculating the
    // cosine of the double angle. This allows us to get rid of calling sqrt.
    if(dot < 0){
        rs = Math.PI - rs;
    }
    // 2. Determine the sign. For this we'll use the Determinant of two
    // vectors.
    const det = (ab.x * cb.y - ab.y * cb.x);
    if(det < 0){
        rs = (2.0 * Math.PI) - rs;
    }
    return rs;
}

function angleBetween2(p1, p2, p3, clockwise = false){
    // http://stackoverflow.com/questions/3486172/angle-between-3-points
    // modified not to bother converting to degrees
    const ab = {x: p1.x - p2.x, y: p1.y - p2.y};
    const cb = {x: p3.x - p2.x, y: p3.y - p2.y};

    const dot = (ab.x * cb.x + ab.y * cb.y); // dot product
    const cross = (ab.x * cb.y - ab.y * cb.x); // cross product
    // NOTE: Although the cross product for 2 2D vectors is not officially
    // defined, an unofficial definition can be found here:
    // http://allenchou.net/2013/07/cross-product-of-2d-vectors/

    return Math.atan2(clockwise ? cross : -cross, -dot) + Math.PI;
}

function angleBetween3(p1, p2, p3, clockwise = false){
    // http://stackoverflow.com/questions/3486172/angle-between-3-points
    // modified not to bother converting to degrees
    const ab = {x: p1.x - p2.x, y: p1.y - p2.y};
    const cb = {x: p3.x - p2.x, y: p3.y - p2.y};
    // Normalize
    const ablen = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
    const cblen = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
    ab.x /= ablen;
    ab.y /= ablen;
    cb.x /= cblen;
    cb.y /= cblen;

    const dot = (ab.x * cb.x + ab.y * cb.y); // dot product
    const cross = (ab.x * cb.y - ab.y * cb.x); // cross product

    return Math.atan2(clockwise ? cross : -cross, -dot) + Math.PI;
}

function angleBetween4(p1, p2, p3){
    // http://stackoverflow.com/questions/3486172/angle-between-3-points
    // modified not to bother converting to degrees
    const ab = {x: p1.x - p2.x, y: p1.y - p2.y};
    const cb = {x: p3.x - p2.x, y: p3.y - p2.y};

    const dot = (ab.x * cb.x + ab.y * cb.y); // dot product
    const cross = (ab.x * cb.y - ab.y * cb.x); // cross product

    // Assume counterclockwise
    return Math.atan2(-cross, -dot) + Math.PI;
}

const vectorTests = [
    [ // Test 1
        {x: 2, y: -3},
        {x: 0, y: 0},
        {x: 2, y: 3}
    ],
    [ // Test 2
        {x: 5, y: -2},
        {x: 0, y: 0},
        {x: -5, y: -2}
    ],
    [ // Test 3
        {x: -7, y: 7},
        {x: 0, y: 0},
        {x: 2, y: -2}
    ],
    [ // Test 4
        {x: -2, y: -2},
        {x: 0, y: 0},
        {x: 2, y: -2}
    ],
    [ // Test 5
        {x: -1, y: -2},
        {x: 0, y: 0},
        {x: 2, y: -2}
    ],
    [ // Test 6
        {x: 2, y: 4},
        {x: 0, y: 0},
        {x: 2, y: -2}
    ],
    [ // Test 7
        {x: 2, y: -4},
        {x: 0, y: 0},
        {x: -2, y: -4}
    ],
    [ // Test 8 - Counterclockwise
        {x: 2, y: 4},
        {x: 0, y: 0},
        {x: -1, y: 4}
    ],
    [ // Test 9 - Clockwise
        {x: -1, y: 4},
        {x: 0, y: 0},
        {x: 2, y: 4}
    ]
];

for(const vectors of vectorTests){
    console.log("========== Vectors ==========");
    for(const vector of vectors){
        console.log("(x: %d, y: %d)", vector.x, vector.y);
    }
    // Using JS port of original SLADE implementation
    const angle1 = angleBetween.apply(null, vectors);
    console.log("angleBetween", angle1 * (180 / Math.PI));
    // Performance test
    let timer = performance.now();
    for(let i = 0; i < 1000000; i++){
        angleBetween.apply(null, vectors);
    }
    console.log("angleBetween took", performance.now() - timer, "milliseconds for 1 million iterations");
    // Using my version
    const angle2 = angleBetween2.apply(null, vectors);
    console.log("angleBetween2", angle2 * (180 / Math.PI));
    timer = performance.now();
    for(let i = 0; i < 1000000; i++){
        angleBetween2.apply(null, vectors);
    }
    console.log("angleBetween2 took", performance.now() - timer, "milliseconds for 1 million iterations");
    // Using my version, but normalizing the ab/cb vectors in the process
    const angle3 = angleBetween3.apply(null, vectors);
    console.log("angleBetween3", angle3 * (180 / Math.PI));
    timer = performance.now();
    for(let i = 0; i < 1000000; i++){
        angleBetween3.apply(null, vectors);
    }
    console.log("angleBetween3 took", performance.now() - timer, "milliseconds for 1 million iterations");
    // Using my version, but without a "clockwise" argument
    const angle4 = angleBetween4.apply(null, vectors);
    console.log("angleBetween4", angle4 * (180 / Math.PI));
    timer = performance.now();
    for(let i = 0; i < 1000000; i++){
        angleBetween4.apply(null, vectors);
    }
    console.log("angleBetween4 took", performance.now() - timer, "milliseconds for 1 million iterations");
    // Make sure everything is good
    console.log("angle1 and angle2 are equal:", angle1 === angle2);
    console.log("angle1 and angle3 are equal:", angle1 === angle3);
}
}