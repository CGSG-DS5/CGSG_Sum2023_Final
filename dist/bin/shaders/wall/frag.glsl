#version 300 es

precision highp float;

uniform MtlUBO // 1
{
  vec4 KaPh;
  vec4 KdTrans;
  vec4 Ks4;
};

#define Ka (KaPh.xyz)
#define Ph (KaPh.a)
#define Trans (KdTrans.w)
#define Kd (KdTrans.xyz)
#define Ks (Ks4.xyz)

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

precision highp float;

out vec4 OutColor;

uniform float Time;
uniform sampler2D Texture0;
uniform int IsTexture0;

uniform float AddonF0;
uniform float AddonF1;
uniform float AddonF2;

in vec3 DrawPos;
in vec2 DrawTexCoord;
in vec3 DrawNormal;                                         
in vec3 DrawInPos;
flat in int WallNum;

vec3 gamma( vec3 V, float X )
{
  return vec3(pow(V.x, X), pow(V.y, X), pow(V.z, X));
}

void shade( void )
{
  vec3 N = normalize(DrawNormal);
  // vec3 L = normalize(vec3(cos(Time), 1, sin(Time)));
  vec3 L = normalize(vec3(1.0, 0.65, 0.7));
  // L = normalize(vec3(cos(Time), 1, sin(Time)));
  vec3 LC = vec3(1.0);
  vec3 V = normalize(DrawPos - CamLoc);
  N = faceforward(N, V, N);

  vec2 t = DrawTexCoord / 15.0;
  if (WallNum == 0)
  {
    t.x *= AddonF2;
    t.y *= AddonF1;
  }
  else if (WallNum == 1)
  {
    t.x *= AddonF0;
    t.y *= AddonF1;
  }
  else if (WallNum == 2)
  {
    t.x *= AddonF2;
    t.y *= AddonF1;
  }
  else if (WallNum == 3)
  {
    t.x *= AddonF0;
    t.y *= AddonF1;
  }
  else
  {
    t.x *= AddonF2;
    t.y *= AddonF0;
  }

  vec3 diff = Kd;
  if (IsTexture0 != 0)
    diff *= texture(Texture0, t).rgb;
  vec3 color =
    vec3(min(vec3(0.1), Ka) +
         max(0.0, dot(N, L)) * diff * LC +
         pow(max(0.0, dot(reflect(V, N), L)), Ph) * Ks * LC);

  OutColor = vec4(color, 1.0);
  
  // vec3 color =
  //   vec3(min(vec3(0.1), Ka) +
  //        gamma(max(0.0, dot(N, L)) * gamma(diff, 2.2) * LC, 1.0 / 2.2) +
  //        pow(max(0.0, dot(reflect(V, N), L)), Ph) * Ks * LC);

  // OutColor = vec4(color, 1.0);
}

void main( void )
{ 
  // OutColor = vec4(DrawPos, 1);
  shade();
}