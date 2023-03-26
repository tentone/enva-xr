import {Mesh, BufferGeometry, MeshBasicMaterial, Quaternion, WebGLRenderer, Scene, Camera, Group, Material} from "three";

/**
 * Billboard group is a group of objetcts that is automatically rotated to always face the camera.
 * 
 * @extends {Mesh}
 */
export class BillboardGroup extends Mesh
{
	public constructor()
	{
		super(new BufferGeometry(), new MeshBasicMaterial());

		this.frustumCulled = false;
	}

	// @ts-ignore
	public onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group)
	{
		super.onBeforeRender(renderer, scene, camera, geometry, material, group);

		let quaternion = new Quaternion();
		camera.getWorldQuaternion(quaternion);
		this.quaternion.copy(quaternion);
	}
}
