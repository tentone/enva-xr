import {ShaderMaterial, Matrix4, Texture, DataTexture, Vector2} from "three";
import AugmentedBasicMaterialFragment from "./AugmentedBasicMaterialFragment.glsl";
import AugmentedBasicMaterialVertex from "./AugmentedBasicMaterialVertex.glsl";
import { ARRenderer } from "../ARRenderer";
import { DepthDataTexture } from "../texture/DepthDataTexture";

/**
 * Shader material used to combine virtual and real scene with depth blending.
 *
 * Uses raw packed data from the WebXR API.
 */
export class AugmentedBasicMaterial extends ShaderMaterial
{
	/**
	 * Color texture mapped over the geometry.
	 */
	public texture: Texture = null;

	public constructor(texture: Texture, depthData: XRDepthInformation)
	{
		super({
			uniforms: {
				uRawValueToMeters: {value: 0.001},
				uTexture: {value: texture},
				uDepthTexture: {value: new DepthDataTexture(depthData)},
				uResolution: {value: new Vector2(100, 100)},
				uUvTransform: {value: new Matrix4()}
			},
			vertexShader: AugmentedBasicMaterialVertex,
			fragmentShader: AugmentedBasicMaterialFragment,
			depthTest: true,
	    	depthWrite: true
		});

		this.texture = texture;
	}

	/**
	 * Update the uniform values of the material, from AR renderer information.
	 * 
	 * Must be called every frame before rending the scene.
	 */
	public updateMaterial(renderer: ARRenderer): void {
		if (renderer.xrDepth.length > 0) {
			const depthData = renderer.xrDepth[0];
			const size = renderer.renderer.getSize(new Vector2());
			
			this.uniforms.uDepthTexture.value.updateDepth(depthData);
			this.uniforms.uRawValueToMeters.value = depthData.rawValueToMeters;
			this.uniforms.uUvTransform.value.fromArray(depthData.normDepthBufferFromNormView.matrix);
			this.uniforms.uResolution.value.set(size.x, size.y);
			this.uniformsNeedUpdate = true;

			// console.log('enva-xr: Update uniforms material.', size, depthData);
		}

	}

}
