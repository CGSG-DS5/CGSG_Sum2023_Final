#version 300 es

precision highp float;

in vec3 InPos;

void main( void )
{
  gl_Position = vec4(InPos, 1);  
}
