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

uniform float AddonF0;
uniform float AddonF1;

out vec4 OutColor;

void main( void )
{       
  float x = gl_FragCoord.x - FrameW / 2.0, y = gl_FragCoord.y - FrameH / 2.0, r = x * x + y * y;
  if (gl_FragCoord.x >= 10.0 && gl_FragCoord.x  <= 300.0 &&
      gl_FragCoord.y <= 50.0 && gl_FragCoord.y  >= 10.0)
  {
    if ((gl_FragCoord.x - 10.0) / 290.0 < AddonF1)
      OutColor = vec4(0, 1, 0, 1);
    else
      OutColor = vec4(1, 0, 0, 1);
  } 
  else if (r <= 12.0 * 12.0 * FrameH / 1080.0 && r >= 8.0 * 8.0 * FrameH / 1080.0)
  {
    float angle = acos(max(min(y / sqrt(r), 1.0), -1.0)), pi = acos(-1.0);

    if (x < 0.0)             
      angle = 2.0 * pi - angle;

    if (angle <= AddonF0 * pi * 2.0)
      OutColor = vec4(0.0, 1.0, 0.0, 1.0);
    else
      OutColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
  else
    discard;
  /*
  return;          
  if (gl_FragCoord.x >= FrameW * 0.95) 
    if (gl_FragCoord.y <= AddonF0 * FrameH)           
      OutColor = vec4(0.0, 1.0, 0.0, 1.0);
    else 
      OutColor = vec4(1.0, 0.0, 0.0, 1.0);
  else    
    discard;
  */ 
}

                            