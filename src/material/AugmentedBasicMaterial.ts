import {ShaderMaterial, Matrix4, Texture, DataTexture, Vector2} from "three";
import {ARRenderer} from "../ARRenderer";
import AugmentedBasicMaterialFragment from "./AugmentedBasicMaterialFragment.glsl";
import AugmentedBasicMaterialVertex from "./AugmentedBasicMaterialVertex.glsl";

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

	
	public constructor(texture: Texture)
	{
		super({
			uniforms: {
				uRawValueToMeters: {value: 0.001},
				uTexture: {value: texture},
				uDepthTexture: {value: new DataTexture()},
				uResolution: {value: new Vector2(1, 1)},
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
	public updateMaterial(renderer: ARRenderer): void 
	{
		if (renderer.xrViews.length > 0 && renderer.xrDepth.length > 0) 
		{
			const depthData = renderer.xrDepth[0];
			const view = renderer.xrViews[0];

			const baseLayer = renderer.xrSession.renderState.baseLayer;
			const viewport = baseLayer.getViewport(view);

			if (renderer.depthTexture && renderer.depthTexture !== this.uniforms.uDepthTexture.value) 
			{
				this.uniforms.uDepthTexture.value = renderer.depthTexture;
			}
			
			this.uniforms.uRawValueToMeters.value = depthData.rawValueToMeters;
			this.uniforms.uUvTransform.value.fromArray(depthData.normDepthBufferFromNormView.matrix);
			this.uniforms.uResolution.value.set(viewport.width, viewport.height);
			this.uniformsNeedUpdate = true;

			// console.log('enva-xr: Update uniforms material.', renderer.resolution, viewport, depthData);
		}

	}
}
