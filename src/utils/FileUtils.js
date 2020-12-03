import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {Mesh} from "three";
import {ARMaterial} from "../material/ARMaterial.js";

export class FileUtils {
	static loadGLTFMesh(url, scene, position, rotation, scale) {

		const loader = new GLTFLoader();
		loader.load(url, function(gltf)
		{
			var object = gltf.scene;
			object.traverse(function(child)
			{
				if (child instanceof Mesh)
				{
					console.log(child);

					child.material = new ARMaterial(child.material.map);

					child.scale.set(scale, scale, scale);
					child.position.copy(position);
					child.rotation.copy(rotation);
					scene.add(child);
				}
			});
		});
	}
}
