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

		void main()
		{
            vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}`;

		var fragmentShader = `
		varying vec2 vUv;

		uniform float uWidth;
		uniform float uHeight;

		uniform sampler2D colorMap;
		uniform sampler2D depthMap;

		void main() {
			vec4 pixel = texture2D(colorMap, vUv);
			if (pixel.a < 0.3) {
				discard;
			}

			// convert x,y to range [0, 1]
			float x = gl_FragCoord.x / 1080.0;
			float y = gl_FragCoord.y / 2160.0;

			float z = gl_FragCoord.z / gl_FragCoord.w;

			vec4 depthPixel = texture2D(depthMap, vec2(x, y));
			if (depthPixel.x < z) {
				gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
				return;
				// discard;
			}

			gl_FragColor = vec4(z, z, z, 1.0);
		}`;

		super({
			uniforms: {
				colorMap: {value: colorMap},
                depthMap: {value: depthMap},
                uWidth: {value: 1},
                uHeight: {value: 1}
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		});

        this.extensions.fragDepth = true;

		this.depthWrite = true;
		this.alphaTest = 0.3;
	}
}
