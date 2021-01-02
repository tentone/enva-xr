precision mediump float;

uniform sampler2D u_DepthTexture;
uniform mat4 u_UVTransform;

varying vec2 vUv;  // Computed in vertex shader, based on vertex attributes.

// Depth is packed into the luminance and alpha components of its texture.
//
// The texture is a normalized format, storing millimeters.
float getDepthInMillimeters(in sampler2D depth_texture, in vec2 uv_coord)
{
  vec2 packedDepth = texture2D(depth_texture, uv_coord).ra;
  return dot(packedDepth, vec2(255.0, 256.0 * 255.0));
}

void main(void)
{
	vec2 texCoord = (u_UVTransform * vec4(vUv.xy, 0, 1)).xy;
	float depth = getDepthInMillimeters(u_DepthTexture, texCoord);

	vec4 pixel = texture2D(colorMap, vUv);

	// Alpha test
	if (pixel.a < 0.3) {
		discard;
	}

	if (depth < vDepth) {
		discard;
	}

	gl_FragColor = vec4(pixel.rgb, 1.0);

  gl_FragColor = ...;
}
