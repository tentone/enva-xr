import {Group} from "three";
import {ARRenderer} from "ARRenderer";
import {ARObject} from "./ARObject";

/**
 * Archor groups can be used to attach (anchor) object to the real-world environment.
 * 
 * Uses the "anchor" feature when available to track environment features an ensure accurate positioning.
 * 
 * Check https://immersive-web.github.io/anchors/ for more details.
 */
export class AnchorGroup extends Group implements ARObject 
{
	public isARObject = true;

	/**
	 * XR anchor associated with this object.
	 */
	public anchor: XRAnchor = null;

	public constructor(anchor: XRAnchor) 
	{
		super();

		this.anchor = anchor;
		this.matrixAutoUpdate = false;
	}

	/**
	 * Create a new group from hit test result.
	 * 
	 * @param hit - Hit test result. 
	 * @returns Anchor object created.
	 */
	public static async createGroup(hit: XRHitResult): Promise<AnchorGroup> 
	{
		// @ts-ignore
		const anchor = hit.createAnchor();
		const group = new AnchorGroup(anchor);
		
		return group;
	}

	public beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame) 
	{
		// Check if the anchor is visible in frame
		if (!frame.trackedAnchors.has(this.anchor)) 
		{
			return;
		}

		// Update group pose
		const anchorPose = frame.getPose(this.anchor.anchorSpace, renderer.xrReferenceSpace);
		this.matrix.fromArray(anchorPose.transform.matrix);
	}
}
