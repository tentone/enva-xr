import {ShaderMaterial} from "three"
import AugmentedMaterialFragment from "./AugmentedMaterialFragment.glsl";
import AugmentedMaterialVertex from "./AugmentedMaterialVertex.glsl";

/**
 * Shader material used to combine virtual and real scene with depth blending.
 *
 */
export class AugmentedMaterial extends ShaderMaterial
{
	constructor(colorMap, depthMap)
	{
		super({
			uniforms: {
				colorMap: {value: colorMap},
                depthMap: {value: depthMap},
                uWidth: {value: 1.0},
				uHeight: {value: 1.0},
				uNear: {value: 1.0},
				uFar: {value: 1.0}
			},
			vertexShader: AugmentedMaterialVertex,
			fragmentShader: AugmentedMaterialFragment
		});

		this.depthWrite = true;
	}
}
