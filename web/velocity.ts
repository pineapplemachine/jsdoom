import {Vector3} from "three";

// Manages a velocity vector
export class Velocity {
    // The velocity vector
    protected _vector: Vector3;
    public get vector(){
        return this._vector.clone();
    }
    // Maximum magnitude
    maxSpeed: number;

    constructor(maxSpeed: number = 7){
        this._vector = new Vector3();
        this.maxSpeed = maxSpeed;
    }

    // Accelerate in a given direction by the given rate
    // Modifies this._vector
    move(by: number, destination: Vector3 = new Vector3(0, 0, 0)): void {
        if(destination.toArray().every((component) => component === 0)){
            // Move towards center
            const direction = this.vector.negate().normalize();
            // Ensure we stop rather than jittering
            const distance = Math.min(by, this._vector.length());
            direction.multiplyScalar(distance);
            this._vector.add(direction);
            return;
        }
        destination.normalize().multiplyScalar(by);
        this._vector.add(destination).clampLength(0, this.maxSpeed);
    }
}
