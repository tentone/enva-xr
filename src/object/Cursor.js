import {Mesh, RingBufferGeometry, CircleBufferGeometry, MeshBasicMaterial} from "three";
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
	constructor(geometry, material)
	{
		if (!geometry)
		{
			var ring = new RingBufferGeometry(0.045, 0.05, 32).rotateX(-Math.PI / 2);
			var dot = new CircleBufferGeometry(0.005, 32).rotateX(-Math.PI / 2);
			geometry = mergeBufferGeometries([ring, dot]);
		}
		
		if (!material)
		{
			material = new MeshBasicMaterial({opacity: 0.4, depthTest: false, transparent: true});
		}

		super(geometry, material);

		this.matrixAutoUpdate = false;
		this.visible = false;

		/**
		 * Callback method to execute when the cursor is pressed.
		 * 
		 * Receives the pose of the cursor in world coordinates.
		 */
		this.onaction = null;
	}
}
