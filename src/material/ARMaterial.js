import {ShaderMaterial} from "three"

export class BasicMaterialDepth extends ShaderMaterial
{
	constructor(colorMap)
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
			gl_FragColor = vec4(texture2D(colorMap, vUv).rgb, 1.0);
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
