import {Group, Matrix4, Mesh, PlaneGeometry, ShadowMaterial, MeshBasicMaterial, Material, Vector3} from "three";
import {ARRenderer} from "ARRenderer";
import {ARObject} from "./ARObject";

/**
 * Floor plane can be used for AR objects to cast shadows on.
 * 
 * The plane can be calibrated using hit test results.
 */
export class FloorPlane extends Group implements ARObject
{
	/**
	 * Mesh used to cast shadows into the floor.
	 */
	public floorMesh: Mesh = null;
	
	/**
	 * Shadow material, only renders shadow map.
	 */
	public material: Material = null;

	public isARObject = true;

	public constructor() 
	{
		super();

		this.material = new MeshBasicMaterial({opacity: 0.1, transparent: true, color: 0x00FF00});
		// this.material = new ShadowMaterial({opacity: 0.5});
		// this.material = AugmentedMaterial.transform(this.material, this.depthDataTexture);

		this.floorMesh = new Mesh(new PlaneGeometry(100, 100, 1, 1), this.material);
		this.floorMesh.rotation.set(-Math.PI / 2, 0, 0);
		this.floorMesh.castShadow = false;
		this.floorMesh.receiveShadow = true;
		this.add(this.floorMesh);
	}

	public beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame): void 
	{
		if (renderer.xrHitTestSource)
		{
			let hitResults = frame.getHitTestResults(renderer.xrHitTestSource);
			if (hitResults.length)
			{
				const hit = hitResults[0];
				
				const matrix: Matrix4 = new Matrix4();
				matrix.fromArray(hit.getPose(renderer.xrReferenceSpace).transform.matrix);

				const position = new Vector3();
				position.setFromMatrixPosition(matrix);
				if (position.y < this.floorMesh.position.y)
				{
					this.floorMesh.position.y = position.y;
				}
			}
		}

	}	
}
