import {Group, Matrix4, Mesh, PlaneGeometry, ShadowMaterial, MeshBasicMaterial, Material, Vector3} from "three";
import {ARRenderer} from "ARRenderer";
import {AugmentedMaterial} from "material/AugmentedMaterial";
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
	public mesh: Mesh = null;
	
	/**
	 * Shadow material, only renders shadow map.
	 */
	public material: Material = null;

	public isARObject = true;

	public constructor() 
	{
		super();

		this.material = new ShadowMaterial({opacity: 0.5});
		this.material = AugmentedMaterial.transform(this.material);

		this.mesh = new Mesh(new PlaneGeometry(100, 100, 1, 1), this.material);
		this.mesh.rotation.set(-Math.PI / 2, 0, 0);
		this.mesh.castShadow = false;
		this.mesh.receiveShadow = true;
		this.add(this.mesh);
	}

	public beforeARUpdate(renderer: ARRenderer, time: number, frame: XRFrame): void 
	{
		if (!renderer.config.hitTest) 
		{
			// console.warn('XR hit test source must be available for FloorPlane object. Check renderer configuration.');
		}

		if (renderer.xrHitTestSource)
		{
			let hitResults = frame.getHitTestResults(renderer.xrHitTestSource);
			if (hitResults.length > 0)
			{
				const hit = hitResults[0];
				
				const matrix: Matrix4 = new Matrix4();
				matrix.fromArray(hit.getPose(renderer.xrReferenceSpace).transform.matrix);

				const position = new Vector3();
				position.setFromMatrixPosition(matrix);
				if (position.y < this.mesh.position.y)
				{
					this.mesh.position.y = position.y;
				}
			}
		}

	}	
}
