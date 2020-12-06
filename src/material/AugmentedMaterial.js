import {ShaderMaterial} from "three"

var vertexShader = `
varying vec2 vUv;
varying float vDepth;

void main()
{
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

	vUv = uv;
	vDepth = gl_Position.z;
}`;

var fragmentShaderDepth = `
float near = 0.1;
float far = 20.0;
float ndcDepth = (2.0 * gl_FragCoord.z - near - far) / (far - near);
float clipDepth = ndcDepth / gl_FragCoord.w;
float z = clipDepth / 4.0;`;

var fragmentShader = `
varying vec2 vUv;
varying float vDepth;

uniform float uWidth;
uniform float uHeight;

uniform float uNear;
uniform float uFar;

uniform sampler2D colorMap;
uniform sampler2D depthMap;

void main() {
	vec4 pixel = texture2D(colorMap, vUv);
	if (pixel.a < 0.3) {
		discard;
	}

	// Convert x,y to range [0, 1]
	float x = gl_FragCoord.x / uWidth;
	float y = gl_FragCoord.y / uHeight;

	float z = (gl_FragCoord.z / gl_FragCoord.w) / 4.0;

	vec4 depthPixel = texture2D(depthMap, vec2(x, y));
	if (depthPixel.x < z) {
		// gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
		// return;
		discard;
	}

	gl_FragColor = vec4(pixel.rgb, 1.0);
}`;

/**
 * Shader material used to combine virtual and real scene with depth blending.
 *
 */
export class AugmentedMaterial extends ShaderMaterial
{
	constructor(colorMap, depthMap)
	{
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
