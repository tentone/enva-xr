import {ARRenderer} from "ARRenderer";
import {DataTexture, Material, Matrix4, Shader, ShadowMaterial, Vector2, WebGLRenderer} from "three";

/**
 * Augmented Material has static tools to transform regular three.js materials into AR materials.
 * 
 * The required code is injected into existing shader code.
 */
export class AugmentedMaterial
{
	/**
	 * Create a augmented reality occlusion enabled material from a standard three.js material.
	 *
	 * Can be used to test multiple material this.models with the AR functionality.
	 *
	 * @param material - Material to be transformed into an augmented material.
	 * @param depthMap - Depth map bound to the material. A single depth map should be used for all AR materials.
	 */
	public static transform(material: Material): Material
	{
		material.userData = {
			uDepthTexture: {value: new DataTexture()},
			uResolution: {value: new Vector2(1, 1)},
			uUvTransform: {value: new Matrix4()},
			uOcclusionEnabled: {value: true},
			uRawValueToMeters: {value: 0.0}
		};

		// @ts-ignore
		material.isAgumentedMaterial = true;

		material.onBeforeCompile = (shader: Shader, renderer: WebGLRenderer) =>
		{
			// @ts-ignore
			material.shader = shader;

			// Pass uniforms from userData to the
			for (let i in material.userData)
			{
				shader.uniforms[i] = material.userData[i];
			}

			// Fragment variables
			shader.fragmentShader = `
			uniform sampler2D uDepthTexture;

			uniform float uRawValueToMeters;
			uniform mat4 uUvTransform;
			uniform vec2 uResolution;
			
			uniform bool uOcclusionEnabled;

			varying float vDepth;
			` + shader.fragmentShader;


			let fragmentEntryPoint = "#include <clipping_planes_fragment>";
			if (material instanceof ShadowMaterial)
			{
				fragmentEntryPoint = "#include <fog_fragment>";
			}

			// Fragment depth logic

			shader.fragmentShader = shader.fragmentShader.replace("void main",
				`
			const highp float kMaxDepthInMeters = 8.0;
			const float kInvalidDepthThreshold = 0.01;
			
			float getDepthInMeters(in sampler2D depthTexture, in vec2 depthUv)
			{
				vec2 packedDepth = texture2D(depthTexture, depthUv).ra;
				return dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters;
			}

			// Turbo color map visualization of depth information.
			//
			// Input value range from 0.0 to 1.0.
			//
			// More information at https://ai.googleblog.com/2019/08/turbo-improved-rainbow-colormap-for.html
			vec3 turboColormap(in float x) {
				const vec4 kRedVec4 = vec4(0.55305649, 3.00913185, -5.46192616, -11.11819092);
				const vec4 kGreenVec4 = vec4(0.16207513, 0.17712472, 15.24091500, -36.50657960);
				const vec4 kBlueVec4 = vec4(-0.05195877, 5.18000081, -30.94853351, 81.96403246);
				const vec2 kRedVec2 = vec2(27.81927491, -14.87899417);
				const vec2 kGreenVec2 = vec2(25.95549545, -5.02738237);
				const vec2 kBlueVec2 = vec2(-86.53476570, 30.23299484);

				// Adjusts color space via 6 degree poly interpolation to avoid pure red.
				x = clamp(x * 0.9 + 0.03, 0.0, 1.0);
				vec4 v4 = vec4( 1.0, x, x * x, x * x * x);
				vec2 v2 = v4.zw * v4.z;

				return vec3(
					dot(v4, kRedVec4)   + dot(v2, kRedVec2),
					dot(v4, kGreenVec4) + dot(v2, kGreenVec2),
					dot(v4, kBlueVec4)  + dot(v2, kBlueVec2)
				);
			}

			// Nomalize depth and trunk value to min invalid depth
			//
			// Use turbo color map to get depth color.
			vec3 depthGetColorVisualization(in float depth) {
				float normalized = clamp(depth / kMaxDepthInMeters, 0.0, 1.0);
				return step(kInvalidDepthThreshold, normalized) * turboColormap(normalized);
			}

			void main`);

			shader.fragmentShader = shader.fragmentShader.replace(fragmentEntryPoint, `
			${fragmentEntryPoint}
			if(uOcclusionEnabled)
			{
				// Normalize screen coordinates
				vec2 screenUv = vec2(1.0 - (-gl_FragCoord.x / uResolution.x + 1.0), -gl_FragCoord.y / uResolution.y + 1.0);
				vec4 depthUv = uUvTransform * vec4(screenUv, 0.0, 1.0);
				
				// Calculate depth in meters
				float depth = getDepthInMeters(uDepthTexture, depthUv.xy);
			
				// Debug visualization
				// gl_FragColor = vec4(depthGetColorVisualization(depth), 1.0);
				// return;

				// Depth test
				if (depth < vDepth)
				{
					discard;
				}
			}
			`);

			// Vertex variables
			shader.vertexShader = `
			varying float vDepth;
			` + shader.vertexShader;

			// Vertex depth logic
			shader.vertexShader = shader.vertexShader.replace("#include <fog_vertex>", `
			#include <fog_vertex>

			vDepth = gl_Position.z;
			`);
		};

		return material;
	}

	/**
	 * Update uniforms of materials to match the screen size and camera configuration.
	 * 
	 * https://immersive-web.github.io/depth-sensing/
	 * 
	 * @param scene - Scene to be updated, tarverses all objects and updates materials found.
	 * @param depthData - Matrix obtained from AR depth from frame.getDepthInformation(view).
	 */
	public static updateUniforms(renderer: ARRenderer): void
	{
		if (renderer.xrViews.length > 0 && renderer.xrDepth.length > 0) 
		{
			const depthData = renderer.xrDepth[0];
			const view = renderer.xrViews[0];

			const baseLayer = renderer.xrSession.renderState.baseLayer;
			const viewport = baseLayer.getViewport(view);

			// console.log('enva-xr: Renderer size.', size);

			renderer.scene.traverse(function(child: any)
			{
				if (child.material && child.material.isAgumentedMaterial && child.material.shader)
				{
					console.log('enva-xr: Material to be updated', child.material);

					const uniforms = child.material.shader.uniforms;

					if (renderer.depthTexture && renderer.depthTexture !== uniforms.uDepthTexture.value) 
					{
						uniforms.uDepthTexture.value = renderer.depthTexture;
					}

					uniforms.uRawValueToMeters.value = depthData.rawValueToMeters;
					uniforms.uResolution.value.set(viewport.width, viewport.height);
					uniforms.uUvTransform.value.fromArray(depthData.normDepthBufferFromNormView.matrix);
					child.material.needsUpdate = true;
				}
			});
		}
	}
	
}
