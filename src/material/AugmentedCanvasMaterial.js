import {ShaderMaterial} from "three"
import AugmentedCanvasMaterialFragment from "./AugmentedCanvasMaterialFragment.glsl";
import AugmentedCanvasMaterialVertex from "./AugmentedCanvasMaterialVertex.glsl";

/**
 * Shader material used to combine virtual and real scene with depth blending.
 *
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
			vertexShader: AugmentedCanvasMaterialVertex,
			fragmentShader: AugmentedCanvasMaterialFragment
		});

		this.depthWrite = true;
	}
}
