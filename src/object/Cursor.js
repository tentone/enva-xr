import {Mesh, RingBufferGeometry, CircleBufferGeometry, MeshBasicMaterial} from "three";
import {BufferGeometryUtils} from "three/examples/jsm/utils/BufferGeometryUtils.js";

export class Cursor extends Mesh
{
	constructor()
	{
		var ring = new RingBufferGeometry(0.045, 0.05, 32).rotateX(-Math.PI / 2);
		var dot = new CircleBufferGeometry(0.005, 32).rotateX(-Math.PI / 2);

		super(BufferGeometryUtils.mergeBufferGeometries([ring, dot]), new MeshBasicMaterial({opacity: 0.4, depthTest: false, transparent: true}));

		this.matrixAutoUpdate = false;
		this.visible = false;
	}
}
