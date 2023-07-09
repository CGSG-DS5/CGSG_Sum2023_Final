#version 300 es
precision highp float;

in vec3 InPos;
in vec2 InTexCoord;
in vec3 InNormal;

uniform MatrixUBO // 0
{
  mat4 W;
  mat4 WInv;
  mat4 WVP;
  mat4 VP;
};

out vec3 DrawPos; 
out vec2 DrawTexCoord;
out vec3 DrawNormal;
out vec3 DrawInPos;
flat out int WallNum;

void main( void )
{
  WallNum = int(InPos.x) / 2;
  vec3 InRealPos = InPos - vec3(float(WallNum) * 2.0);
  DrawNormal = mat3(WInv) * normalize(InNormal);
  DrawPos = (W * vec4(InRealPos, 1.0)).xyz;
  DrawTexCoord = InTexCoord;
  DrawInPos = InRealPos;
  gl_Position = WVP * vec4(InRealPos, 1.0);
}