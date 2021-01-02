import {ShaderMaterial} from "three"
import AugmentedMaterialFragment from "./AugmentedMaterialFragment.glsl";
import AugmentedMaterialVertex from "./AugmentedMaterialVertex.glsl";

/**
 * Shader material used to combine virtual and real scene with depth blending.
 *
 * Uses raw packed data from the WebXR API.
 */
export class AugmentedMaterial extends ShaderMaterial
{
	constructor(colorMap, depthMap)
	{
		super({
			uniforms: {
				colorMap: {value: colorMap},
				depthMap: {value: depthMap},
			},
			vertexShader: AugmentedMaterialVertex,
			fragmentShader: AugmentedMaterialFragment
		});

		this.depthWrite = true;
	}
}
