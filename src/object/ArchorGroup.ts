import { Group } from "three";
import { ARObject } from "./ARObject";
import { ARRenderer } from "ARRenderer";

/**
 * Archor groups can be used to attach (anchor) object to the real-world environment.
 * 
 * Uses the "anchor" feature when available to track environment features an ensure accurate positioning.
 */
export class ArchorGroup extends Group implements ARObject {
	public isARObject: boolean = true;

	public static maxAnchoredObjects: number = 30;

	public anchoredObjects: any[] = [];

	public constructor() {
		super();
		
	}

	public beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame) {
		throw new Error("Method not implemented.");
	}
}