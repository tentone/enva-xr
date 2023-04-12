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
            void main`);

			shader.fragmentShader = shader.fragmentShader.replace(fragmentEntryPoint, `
            ${fragmentEntryPoint}
            if(uOcclusionEnabled)
            {
                // Normalize x, y to range [0, 1]
                vec4 depthUv = vec4(gl_FragCoord.x / uWidth, gl_FragCoord.y / uHeight, 0.0, 1.0);

   				vec2 depthUV = (uUvTransform * depthUv).xy;
                float depth = getDepthInMeters(uDepthTexture, depthUV);

                if (depth < vDepth)
                {
					gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                    return;
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
