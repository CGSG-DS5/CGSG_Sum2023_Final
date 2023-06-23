#version 300 es

precision highp float;

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

uniform float AddonF0; // Hp
uniform float AddonF1; // Max hp

in vec3 DrawPos;

out vec4 OutColor;

void main( void )
{       
  if ((DrawPos.x + 1.5) * AddonF1 < 3.0 * AddonF0)
    OutColor = vec4(0.0, 1.0, 0.0, 1.0);
  else 
    OutColor = vec4(1.0, 0.0, 0.0, 1.0);
}

                            