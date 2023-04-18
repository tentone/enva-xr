precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uDepthTexture;

uniform float uRawValueToMeters;
uniform mat4 uUvTransform;
uniform vec2 uResolution;

varying vec2 vUv;
varying float vDepth;

const highp float kMaxDepthInMeters = 8.0;
const float kInvalidDepthThreshold = 0.01;

// Depth is packed into the luminance and alpha components of its texture.
//
// The texture is in a normalized format, storing raw values that need to be converted to meters.
float getDepthInMeters(in sampler2D depthTexture, in vec2 depthUv)
{
	vec2 packedDepth = texture2D(depthTexture, depthUv).ra;
	return dot(packedDepth, vec2(255.0, 256.0 * 255.0)) * uRawValueToMeters;
}

// Turbo color map visualization of depth information.
//
// Input value range from 0.0 to 1.0.
//
// More information at https://ai.googleblog.com/2019/08/turbo-improved-rainbow-colormap-for.html
vec3 turboColormap(in float x) {
	const vec4 kRedVec4 = vec4(0.55305649, 3.00913185, -5.46192616, -11.11819092);
	const vec4 kGreenVec4 = vec4(0.16207513, 0.17712472, 15.24091500, -36.50657960);
	const vec4 kBlueVec4 = vec4(-0.05195877, 5.18000081, -30.94853351, 81.96403246);
	const vec2 kRedVec2 = vec2(27.81927491, -14.87899417);
	const vec2 kGreenVec2 = vec2(25.95549545, -5.02738237);
	const vec2 kBlueVec2 = vec2(-86.53476570, 30.23299484);

	// Adjusts color space via 6 degree poly interpolation to avoid pure red.
	x = clamp(x * 0.9 + 0.03, 0.0, 1.0);
	vec4 v4 = vec4(1.0, x, x * x, x * x * x);
	vec2 v2 = v4.zw * v4.z;

	return vec3(
		dot(v4, kRedVec4)   + dot(v2, kRedVec2),
		dot(v4, kGreenVec4) + dot(v2, kGreenVec2),
		dot(v4, kBlueVec4)  + dot(v2, kBlueVec2)
	);
}

// Nomalize depth and trunk value to min invalid depth
//
// Use turbo color map to get depth color.
vec3 depthGetColorVisualization(in float depth) {
	float normalized = clamp(depth / kMaxDepthInMeters, 0.0, 1.0);
	return step(kInvalidDepthThreshold, normalized) * turboColormap(normalized);
}

void main(void)
{
	// Calculate depth Uv coordinates
	vec2 screenUv = vec2(1.0 - (-gl_FragCoord.x / uResolution.x + 1.0), -gl_FragCoord.y / uResolution.y + 1.0);
	vec4 depthUv = uUvTransform * vec4(screenUv, 0.0, 1.0);

	// Calculate depth in meters
	float depth = getDepthInMeters(uDepthTexture, depthUv.xy);

	// Debug visualization
	// gl_FragColor = vec4(depthGetColorVisualization(depth), 1.0);

	// Depth test
	if (depth < vDepth) {
		discard;
	}

	vec4 pixel = texture2D(uTexture, vUv);

	// Alpha test
	if (pixel.a < 0.3) {
		discard;
	}

	gl_FragColor = vec4(pixel.rgb, 1.0);
}
