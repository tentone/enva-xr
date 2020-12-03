import {ShaderMaterial} from "three"

/**
 * Shader material used to combine virtual and real scene with depth blending.
 *
 */
export class AugmentedMaterial extends ShaderMaterial
{
	constructor(colorMap, depthMap)
	{
		var vertexShader = `
		varying vec2 vUv;
		varying float vDepth;

		void main()
		{
			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

			vDepth = gl_Position.z;
		}`;

		var fragmentShader = `
		varying vec2 vUv;
		varying float vDepth;

		uniform float uWidth;
		uniform float uHeight;

		uniform sampler2D colorMap;
		uniform sampler2D depthMap;

		void main() {
			vec4 pixel = texture2D(colorMap, vUv);
			if (pixel.a < 0.3) {
				discard;
			}

			// Convert x,y to range [0, 1]
			// float x = gl_FragCoord.x / uWidth;
			// float y = gl_FragCoord.y / uHeight;

			float x = gl_FragCoord.x / 1080.0;
			float y = gl_FragCoord.y / 2100.0;

			float near = 0.1;
			float far = 20.0;
			float ndcDepth = (2.0 * gl_FragCoord.z - near - far) / (far - near);
			float clipDepth = ndcDepth / gl_FragCoord.w;

			float z = (gl_FragCoord.z / gl_FragCoord.w) / 4.0;
			// float z = ndcDepth / 4.0;

			vec4 depthPixel = texture2D(depthMap, vec2(x, y));
			if (depthPixel.x < z) {
				// gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
				// return;
				discard;
			}

			gl_FragColor = vec4(pixel.rgb, 1.0);
			// gl_FragColor = vec4(z, z, z, 1.0);
		}`;

		super({
			uniforms: {
				colorMap: {value: colorMap},
                depthMap: {value: depthMap},
                uWidth: {value: 1.0},
                uHeight: {value: 1.0}
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		});

		this.depthWrite = true;
		this.alphaTest = 0.3;
	}
}
