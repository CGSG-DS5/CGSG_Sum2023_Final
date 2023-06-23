#version 300 es

precision highp float;

in vec3 InPos;

uniform MatrixUBO // 0
{
  mat4 W;
  mat4 WInv;
  mat4 WVP;
  mat4 VP;
};

uniform CamUBO // 2
{
  vec4 CamLoc4;
  vec4 CamUp4;
  vec4 CamRight4;
  vec4 CamAt4;
  vec4 FrameW_FrameH_ProjDist_ProjSize;
};

#define CamDir vec3(CamLoc4.w, CamUp4.w, CamRight4.w)
#define CamLoc (CamLoc4.xyz)
#define CamUp (CamUp4.xyz)
#define CamRight (CamRight4.xyz)
#define CamAt (CamAt4.xyz)
#define FrameW FrameW_FrameH_ProjDist_ProjSize.x
#define FrameH FrameW_FrameH_ProjDist_ProjSize.y
#define ProjDist FrameW_FrameH_ProjDist_ProjSize.z
#define ProjSize FrameW_FrameH_ProjDist_ProjSize.w

vec3 Rot( vec2 v )
{
  return v.x * CamRight + v.y * CamUp;
}

out vec3 DrawPos;

void main( void )
{
  DrawPos = InPos;
  gl_Position = WVP * vec4(Rot(InPos.xy), 1.0);
}
