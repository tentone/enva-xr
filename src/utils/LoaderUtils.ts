import {Vector3, Mesh, Scene, Matrix4, Euler} from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {Body, World} from "cannon-es";
import {threeToCannon} from 'three-to-cannon';
import {AugmentedMaterial} from "../material/AugmentedMaterial";
import {ObjectUtils} from "./ObjectUtils";

/**
 * Loader utils contain auxiliary methods to load objects from file.
 */
export class LoaderUtils 
{
	/**
     * Load GLTF file and place in scene.
     * 
     * @param scene - Scene to place the model at.
	 * @param world - Phyiscs world.
     * @param url - URL of the file.
     * @param rotation - Euler rotation.
     * @param scale - Scale to apply in all axis.
     */
	static loadGLTF(scene: Scene, world: World, matrix: Matrix4, url: string, rotation: Euler, scale: number, depthDataTexture: any)
	{
		let position = new Vector3();
		position.setFromMatrixPosition(matrix);

		const loader = new GLTFLoader();
		loader.loadAsync(url).then((gltf) =>
		{
			let object = gltf.scene;
			scene.add(object);

			object.traverse((child) =>
			{
				if (child instanceof Mesh)
				{
					child.castShadow = true;
					child.receiveShadow = true;
					child.material = AugmentedMaterial.transform(child.material);
				}
			});

			object.scale.set(scale, scale, scale);
			object.rotation.copy(rotation);
			object.updateMatrix();
			object.updateMatrixWorld(true);

			let box = ObjectUtils.calculateBoundingBox(object);
			let center = new Vector3();
			box.getCenter(center);

			let size = new Vector3();
			box.getSize(size);

			object.position.set(-center.x, -center.y / 2, -center.z);
			object.position.add(position);
			object.updateMatrix();
			object.updateMatrixWorld(true);

			// @ts-ignore
			const shape = threeToCannon(object, {type: threeToCannon.Type.BOX});
			const body = new Body();
			body.type = Body.STATIC;
			body.position.set(object.position.x, object.position.y + size.y / 2, object.position.z);
			body.velocity.set(0, 0, 0);
			// @ts-ignore
			body.addShape(shape);
			world.addBody(body);
		});
	}
}
