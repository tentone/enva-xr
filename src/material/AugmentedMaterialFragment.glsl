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

	// Alpha test
	if (pixel.a < 0.3) {
		discard;
	}

	// Normalize x, y to range [0, 1]
	float x = gl_FragCoord.x / uWidth;
	float y = gl_FragCoord.y / uHeight;

	// Calculate depth [0, 1]
	float z = (vDepth - uNear) / (uFar - uNear);
	z = max(z, 0.0);
	z = min(z, 1.0);

	vec4 depthPixel = texture2D(depthMap, vec2(x, y));
	if (depthPixel.x < z) {
		gl_FragColor = vec4(1.0, pixel.gb, 1.0);
		return;
		// discard;
	}

	gl_FragColor = vec4(z, z, z, 1.0);
}
