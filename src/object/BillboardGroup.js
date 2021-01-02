import {Mesh, BufferGeometry, MeshBasicMaterial, Quaternion} from "three";

export class BillboardGroup extends Mesh
{
	constructor()
	{
		super(new BufferGeometry(), new MeshBasicMaterial());

		this.frustumCulled = false;
	}

	onBeforeRender(renderer, scene, camera, geometry, material, group)
	{
		super.onBeforeRender(renderer, scene, camera, geometry, material, group);

		var quaternion = new Quaternion();
		camera.getWorldQuaternion(quaternion);
		this.quaternion.copy(quaternion);
	}
}
