precision mediump float;

uniform sampler2D uColorTexture;
uniform sampler2D uDepthTexture;

uniform float uWidth;
uniform float uHeight;

uniform mat4 uUvTransform;

varying vec2 vUv;
varying float vDepth;

// Depth is packed into the luminance and alpha components of its texture.
// The texture is a normalized format, storing millimeters.
float getDepthInMillimeters(in sampler2D depthText, in vec2 uv)
{
	vec2 packedDepth = texture2D(depthText, uv).ra;
	return dot(packedDepth, vec2(255.0, 256.0 * 255.0));
}

void main(void)
{
	// Normalize x, y to range [0, 1]
	float x = gl_FragCoord.x / uWidth;
	float y = gl_FragCoord.y / uHeight;
	vec2 depthUV = vec2(x, y);

	// vec4 depthPixel = texture2D(uDepthTexture, depthUV);
	vec4 pixel = texture2D(uColorTexture, vUv);

	// Alpha test
	if (pixel.a < 0.3) {
		discard;
	}

	float depth = getDepthInMillimeters(uDepthTexture, depthUV) / 1000.0;
	if (depth < vDepth) {
		gl_FragColor = vec4(1.0, pixel.gb, 1.0);
		return;
		// discard;
	}

	// gl_FragColor = vec4(depthPixel.rgb, 1.0);
	float n = min(depth / 5.0, 1.0);
	gl_FragColor = vec4(n, n, n, 1.0);
	// gl_FragColor = vec4(pixel.rgb, 1.0);
}
