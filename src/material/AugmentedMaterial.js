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

		uniform sampler2D colorMap;

		void main() {
			vec4 pixel = texture2D(colorMap, vUv);
			if (pixel.a < 0.3) {
				discard;
			}

			gl_FragColor = vec4(pixel.rgb, 1.0);
		}`;

		super({
			uniforms: {
				colorMap: {value: colorMap ? colorMap : new Texture()},
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		});

		this.depthWrite = true;
		this.alphaTest = 0.3;
	}
}
