import {Mesh, MeshBasicMaterial, RingGeometry, CircleGeometry, BufferGeometry, Material} from "three";
import {mergeBufferGeometries} from "three/examples/jsm/utils/BufferGeometryUtils";

/**
 * Cursor is used to interfact with the environment.
 * 
 * The cursor moves around with the device.
 * 
 * @extends {Mesh}
 */
export class Cursor extends Mesh
{
	/**
	 * Callback method to execute when the cursor is pressed.
	 * 
	 * Receives the pose of the cursor in world coordinates.
	 */
	public onAction: Function = null; 

	public constructor(geometry: BufferGeometry, material: Material)
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

		this.matrixAutoUpdate = false;
		this.visible = false;
	}

	
}
