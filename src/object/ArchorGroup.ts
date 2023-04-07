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

	/**
	 * How many objects can be anchored simultaneously to the environment.
	 */
	public static maxAnchoredObjects: number = 30;

	/**
	 * List of existing anchored objects.
	 */
	public anchoredObjects: any[] = [];

	public constructor() {
		super();

		// TODO
	}

	public beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame) {
		throw new Error("Method not implemented.");
	}
}