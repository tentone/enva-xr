import {ShaderMaterial, Matrix4, Texture} from "three";
import AugmentedBasicMaterialFragment from "./AugmentedBasicMaterialFragment.glsl";
import AugmentedBasicMaterialVertex from "./AugmentedBasicMaterialVertex.glsl";

/**
 * Shader material used to combine virtual and real scene with depth blending.
 *
 * Uses raw packed data from the WebXR API.
 */
export class AugmentedMaterial extends ShaderMaterial
{
	public constructor(colorMap: Texture, depthMap: Texture)
	{
		super({
			uniforms: {
				uColorTexture: {value: colorMap},
				uDepthTexture: {value: depthMap},
				uWidth: {value: 1.0},
				uHeight: {value: 1.0},
				uUvTransform: {value: new Matrix4()}
			},
			vertexShader: AugmentedBasicMaterialVertex,
			fragmentShader: AugmentedBasicMaterialFragment
		});

		this.depthWrite = true;
	}
}
