#version 300 es

precision highp float;

uniform sampler2D Texture0;

uniform float Time;

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

out vec4 OutColor;

void main( void )
{       
  float Wp, Hp, xp, yp;

  Wp = Hp = ProjSize;
  if (FrameW > FrameH)
    Wp *= FrameW / FrameH;
  else
    Hp *= FrameH / FrameW;

  xp = gl_FragCoord.x * Wp / FrameW - Wp / 2.0;
  yp = gl_FragCoord.y * Hp / FrameH - Hp / 2.0;

  vec3 D = normalize(CamDir * ProjDist + CamRight * xp + CamUp * yp);
  vec2 uv = vec2(atan(D.x, D.z) / (2.0 * acos(-1.0)), acos(-D.y) / acos(-1.0));

  vec4 tc = texture(Texture0, uv); // + vec2(Time / 100000000.0, 0.0) 
            
  OutColor = vec4(tc.rgb, 1.0);
  // OutColor = vec4(sin(Time), sin(Time), sin(Time), 1.0);
  // OutColor = vec4(1.0, 0.0, 0.0, 1.0);
}
                            