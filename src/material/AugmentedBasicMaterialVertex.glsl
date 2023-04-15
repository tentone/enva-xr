varying vec2 vUv;
varying float vDepth;

void main()
{
	vUv = uv;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	vDepth = gl_Position.z;
}
