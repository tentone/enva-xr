varying vec2 vUv;
varying float vDepth;

uniform float uWidth;
uniform float uHeight;

uniform float uNear;
uniform float uFar;

uniform sampler2D uColorTexture;
uniform sampler2D uDepthTexture;

void main() {
	vec4 pixel = texture2D(uColorTexture, vUv);

	// Alpha test
	if (pixel.a < 0.3) {
		discard;
	}

	// Normalize x, y to range [0, 1]
	float x = gl_FragCoord.x / uWidth;
	float y = gl_FragCoord.y / uHeight;
	vec2 depthUV = vec2(x, y);

	// Calculate depth [0, 1]
	float z = (vDepth - uNear) / (uFar - uNear);
	z = max(z, 0.0);
	z = min(z, 1.0);

	vec4 depthPixel = texture2D(uDepthTexture, depthUV);
	if (depthPixel.x < z) {
		discard;
	}

	gl_FragColor = vec4(pixel.rgb, 1.0);
}
