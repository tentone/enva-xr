import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {Mesh} from "three";

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

					child.material.depthWrite = true;
					child.material.alphaTest = 0.3;

					child.scale.set(scale, scale, scale);
					child.position.copy(position);
					child.rotation.copy(rotation);
					scene.add(child);
				}
			});
		});
	}
}
