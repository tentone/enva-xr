import {Mesh, MeshBasicMaterial, RingGeometry, CircleGeometry, BufferGeometry, Material, Matrix4} from "three";
import {mergeBufferGeometries} from "three/examples/jsm/utils/BufferGeometryUtils";
import {ARRenderer} from "ARRenderer";
import {ARObject} from "./ARObject";

/**
 * Cursor is used to interfact with the environment.
 * 
 * The cursor moves around with the device.
 * 
 * The position of the cursor can be used to place object or interact with other objects in the scene.
 */
export class Cursor extends Mesh implements ARObject
{
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
		if (!renderer.config.hitTest) 
		{
			// console.warn('XR hit test source must be available for Cursor object. Check renderer configuration.');
		}

		if (renderer.xrHitTestSource)
		{
			const hitResults: XRHitTestResult[] = frame.getHitTestResults(renderer.xrHitTestSource);
			if (hitResults.length > 0)
			{
				const hit = hitResults[0];
				const pose = hit.getPose(renderer.xrReferenceSpace);

				const matrix = new Matrix4();
				matrix.fromArray(pose.transform.matrix);

				this.position.setFromMatrixPosition(matrix);

				this.visible = true;
			}
			else
			{
				this.visible = false;
			}
		}
	}	
}
