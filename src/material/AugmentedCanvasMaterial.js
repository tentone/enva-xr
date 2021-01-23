import {ShaderMaterial} from "three"
import AugmentedCanvasMaterialFragment from "./AugmentedCanvasMaterialFragment.glsl";
import AugmentedMaterialVertex from "./AugmentedMaterialVertex.glsl";

/**
 * Shader material used to combine virtual and real scene with depth blending.
 */
export class AugmentedCanvasMaterial extends ShaderMaterial
{
	constructor(colorMap, depthMap)
	{
		super({
			uniforms: {
				uColorTexture: {value: colorMap},
				uDepthTexture: {value: depthMap},
				uWidth: {value: 1.0},
				uHeight: {value: 1.0},
				uNear: {value: 1.0},
				uFar: {value: 1.0}
			},
			vertexShader: AugmentedMaterialVertex,
			fragmentShader: AugmentedCanvasMaterialFragment
		});

		this.depthWrite = true;
	}
}
