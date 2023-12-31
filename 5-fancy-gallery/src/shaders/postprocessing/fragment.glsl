uniform sampler2D tDiffuse; //전체화면 텍스처의 정보
uniform float uTime;
uniform float uScrolling;

varying vec2 vUv;

// 1. ripple
// void main() {
//   vec2 toCenter = vUv - 0.5; // -0.5 ~ 0.5
//   float dist = length(toCenter); // 0 ~ 0.5;
 
//   float dir = dot(toCenter, vec2(1.0, 1.0));
//   float strength = 0.05; 


//   vec2 wave = vec2(sin(dist* 20.0 - uTime * 5.0), cos(dist* 20.0 - uTime * 5.0));
//   vec2 newUv = vUv +  wave * strength * dir * dist;
  
//   vec4 tex = texture2D(tDiffuse, newUv);

//   gl_FragColor = tex;
// }

// 2.side 
// void main() {
//   vec2 newUv = vUv;
//   // float side = smoothstep(0.2, 0.0, newUv.x) + smoothstep(0.8, 1.0, newUv.x);
//   // newUv.y -= (newUv.y - 0.5) * side * 0.1;
//   // 0 ~ 0.4 사이에는 색상이 보이고 0.4 ~ 1 사이에는 검은색
//   float side = smoothstep(0.4, 0.0, newUv.y);
//   newUv.x -= (newUv.x - 0.5) * side * 0.1;
  
//   vec4 tex = texture2D(tDiffuse, newUv);
   
//   gl_FragColor = tex ;
// }

// Simplex 2D noise
//
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 3. noise 
// void main () {
//   vec2 newUv = vUv;
//   float side = smoothstep(0.2, 0.0, newUv.x) + smoothstep(0.8, 1.0, newUv.x);
// uTime 값을 줘서 애니메이션처럼 움직이도록
//    float noise = snoise(newUv * 500. + uTime * 2.0);
//    newUv.x -=  side * 0.1 * noise;
//   // newUv.x *= snoise(newUv * 10.0);
  
//   vec4 tex = texture2D(tDiffuse, newUv);
//   tex += noise;

//   gl_FragColor = tex;
// }

// 4. ghost  => 실제로 이런 효과 이름 없음 검색해도 안나옴, 고스트한 느낌의 효과라서 강의에서 그렇게 불렀음 
void main () {
  vec2 newUv = vUv;
  float side = smoothstep(0.2, 0.0, newUv.x) + smoothstep(0.8, 1.0, newUv.x);
  float noise = snoise(newUv + uTime * 2.0);
  float strength = 0.1;
  newUv += noise * strength;
  
  //원본 텍스처 
  vec4 tex =  texture2D(tDiffuse, vUv);
  //노이즈 효과를 입힌 텍스처 
  vec4 blending = texture2D(tDiffuse, newUv);
  //원본  텍스처와 블랜딩 텍스처 합한다
  tex += blending * uScrolling;

  gl_FragColor = tex;
}