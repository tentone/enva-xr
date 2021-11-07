import {Vector3, Mesh, Scene} from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {Body} from "cannon-es";
import {threeToCannon} from 'three-to-cannon';
import {ObjectUtils} from "./ObjectUtils";
import {AugmentedMaterial} from "../material/AugmentedMaterial";

/**
 * Loader utils contain auxiliary methods to load objects from file.
 */
export class LoaderUtils {
    /**
     * Load GLTF file and place in scene.
     * 
     * @param {Scene} scene - Scene to place the model at.
     * 
     * @param {*} url 
     * @param {*} rotation 
     * @param {*} scale 
     */
	static loadGLTF(scene, world, matrix, url, rotation, scale)
	{
        var position = new Vector3();
        position.setFromMatrixPosition(matrix);

        const loader = new GLTFLoader();
        loader.loadAsync(url).then((gltf) =>
        {
            var object = gltf.scene;
            scene.add(object);

            object.traverse((child) =>
            {
                if (child instanceof Mesh)
                {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material = AugmentedMaterial.transform(child.material, this.depthDataTexture);
                }
            });

            object.scale.set(scale, scale, scale);
            object.rotation.copy(rotation);
            object.updateMatrix();
            object.updateMatrixWorld(true);

            var box = ObjectUtils.calculateBoundingBox(object);
            var center = new Vector3();
            box.getCenter(center);

            var size = new Vector3();
            box.getSize(size);

            object.position.set(-center.x, -center.y / 2, -center.z);
            object.position.add(position);
            object.updateMatrix();
            object.updateMatrixWorld(true);

            const shape = threeToCannon(object, {type: threeToCannon.Type.BOX});
            const body = new Body();
            body.type = Body.STATIC;
            body.position.set(object.position.x, object.position.y + size.y / 2, object.position.z);
            body.velocity.set(0, 0, 0);
            body.addShape(shape);
            world.addBody(body);
        });
	}
}