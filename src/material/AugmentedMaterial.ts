import { ARRenderer } from "ARRenderer";
import {Material, Matrix4, ShadowMaterial, Vector2} from "three";

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
			uDepthTexture: {value: null},
			uWidth: {value: 1.0},
			uHeight: {value: 1.0},
			uUvTransform: {value: new Matrix4()},
			uOcclusionEnabled: {value: true},
			uRawValueToMeters: {value: 0.0}
		};

		// @ts-ignore
		material.isAgumentedMaterial = true;

		material.onBeforeCompile = (shader) =>
		{
			// Pass uniforms from userData to the
			for (let i in material.userData)
			{
				shader.uniforms[i] = material.userData[i];
			}

			// Fragment variables
			shader.fragmentShader = `
			uniform sampler2D uDepthTexture;

			uniform mat4 uUvTransform;
			uniform float uRawValueToMeters;

			uniform float uWidth;
			uniform float uHeight;
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
				`float getDepthInMeters(in sampler2D depthText, in vec2 uv)
			{
				vec2 packedDepth = texture2D(depthText, uv).ra;
				return dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters;
			}

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

			void main`);

			shader.fragmentShader = shader.fragmentShader.replace(fragmentEntryPoint, `
			${fragmentEntryPoint}
			if(uOcclusionEnabled)
			{
				// Normalize x, y to range [0, 1]
				vec4 depthUv = vec4(gl_FragCoord.x / uWidth, gl_FragCoord.y / uHeight, 0.0, 1.0);

				vec2 depthUV = (uUvTransform * depthUv).xy;
				float depth = getDepthInMeters(uDepthTexture, depthUV);

				gl_FragColor = vec4(turboColormap(depth), 1.0);
				return;

				if (depth < vDepth)
				{
					// discard;
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
	 * @param depthInfo - Matrix obtained from AR depth from frame.getDepthInformation(view).
	 */
	public static updateUniforms(renderer: ARRenderer, depthInfo: XRDepthInformation): void
	{
		const size = renderer.renderer.getSize(new Vector2());

		renderer.scene.traverse(function(child: any)
		{
			if (child.material && child.material.isAgumentedMaterial)
			{
				child.material.userData.uDepthTexture.value = renderer.depthTexture;
				child.material.userData.uWidth.value = Math.floor(size.x);
				child.material.userData.uHeight.value = Math.floor(size.y);
				child.material.userData.uUvTransform.value.fromArray(depthInfo.normDepthBufferFromNormView.matrix);
				child.material.userData.uRawValueToMeters.value = depthInfo.rawValueToMeters;
				child.material.uniformsNeedUpdate = true;
			}
		});
	}
	
}
