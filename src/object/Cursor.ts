import {Mesh, MeshBasicMaterial, RingGeometry, CircleGeometry, BufferGeometry, Material} from "three";
import {mergeBufferGeometries} from "three/examples/jsm/utils/BufferGeometryUtils";
import {ARRenderer} from "ARRenderer";
import {ARObject} from "./ARObject";

/**
 * Cursor is used to interfact with the environment.
 * 
 * The cursor moves around with the device.
 */
export class Cursor extends Mesh implements ARObject
{
	/**
	 * Callback method to execute when the cursor is pressed.
	 * 
	 * Receives the pose of the cursor in world coordinates.
	 */
	public onAction: ()=> void = null; 

	public isARObject = true;

	public constructor(geometry?: BufferGeometry, material?: Material)
	{
		if (!geometry)
		{
			let ring = new RingGeometry(0.045, 0.05, 32).rotateX(-Math.PI / 2);
			let dot = new CircleGeometry(0.005, 32).rotateX(-Math.PI / 2);
			geometry = mergeBufferGeometries([ring, dot]);
		}
		
		if (!material)
		{
			material = new MeshBasicMaterial({opacity: 0.4, depthTest: false, transparent: true});
		}

		super(geometry, material);

		this.visible = false;
	}
	
	public beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame): void 
	{
		const hitResults: XRHitTestResult[] = frame.getHitTestResults(renderer.xrHitTestSource);
		console.log('enva-xr: Hit test result', hitResults);
		if (hitResults.length)
		{
			const hit = hitResults[0];
			const pose = hit.getPose(renderer.xrReferenceSpace);
			this.matrix.fromArray(pose.transform.matrix);
			this.visible = true;
		}
		else
		{
			this.visible = false;
		}
	}	
}
