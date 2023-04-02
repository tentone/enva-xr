import {Material, Scene, Texture, Matrix4, ShadowMaterial} from "three";

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
	static transform(material, depthMap)
	{
		material.userData = {
			uDepthTexture: {value: depthMap},
			uWidth: {value: 1.0},
			uHeight: {value: 1.0},
			uUvTransform: {value: new Matrix4()},
			uOcclusionEnabled: {value: true},
			uRawValueToMeters: {value: 0.0}
		};

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
			uniform float uWidth;
			uniform float uHeight;
			uniform mat4 uUvTransform;

			uniform bool uOcclusionEnabled;
			uniform float uRawValueToMeters;

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
                vec2 packedDepth = texture2D(depthText, uv).rg;
                return dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters;
            }
            void main`);

			shader.fragmentShader = shader.fragmentShader.replace(fragmentEntryPoint, `
            ${fragmentEntryPoint}
            if(uOcclusionEnabled)
            {
                // Normalize x, y to range [0, 1]
                float x = gl_FragCoord.x / uWidth;
                float y = gl_FragCoord.y / uHeight;
                vec2 uv = gl_FragCoord.xy / uResolution.xy;
                
                vec2 depthUV = (uUvTransform * vec4(uv, 0, 1)).xy;
                float depth = getDepthInMeters(uDepthTexture, depthUV);
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
	 * @param depthInfo - Matrix obtained from AR depth from frame.getDepthInformation(view).
	 */
	static updateUniforms(scene, depthInfo)
	{
		const normTextureFromNormViewMatrix = depthInfo.normDepthBufferFromNormView.matrix;
		const rawValueToMeters = depthInfo.rawValueToMeters;
		
		scene.traverse(function(child)
		{
			if ( child.material && child.material.isAgumentedMaterial)
			{
				child.material.userData.uWidth.value = Math.floor(window.devicePixelRatio * window.innerWidth);
				child.material.userData.uHeight.value = Math.floor(window.devicePixelRatio * window.innerHeight);
				child.material.userData.uUvTransform.value.fromArray(normTextureFromNormViewMatrix);
				child.material.userData.uRawValueToMeters.value = rawValueToMeters;
				child.material.uniformsNeedUpdate = true;
			}
		});
	}
	
}
