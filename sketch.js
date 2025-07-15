let shaderMain;

function preload() {
  shaderMain = new p5.Shader(this._renderer, vertShader, fragShader);
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  shader(shaderMain);
}

function draw() {
  shaderMain.setUniform("u_resolution", [width, height]);
  shaderMain.setUniform("u_time", millis() * 0.001);
  shader(shaderMain);

  beginShape(TRIANGLE_STRIP);
  vertex(-1, -1, 0, 0);
  vertex(1, -1, 1, 0);
  vertex(-1, 1, 0, 1);
  vertex(1, 1, 1, 1);
  endShape();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// VERTEX SHADER
const vertShader = `
precision mediump float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = vec4(aPosition, 1.0);
}
`;

// FRAGMENT SHADER
const fragShader = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
varying vec2 vTexCoord;

#define TAU 6.28318530718
#define MAX_ITER 6

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 uv = vTexCoord;
  vec2 p = mod(uv * TAU, TAU) - 250.0;
  vec2 i = vec2(p);

  float c = 1.0;
  float inten = 0.006;
  float time = u_time * 0.125 + 20.0;

  for (int n = 0; n < MAX_ITER; n++) {
    float t = time * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(
      cos(t - i.x) + sin(t + i.y),
      sin(t - i.y) + cos(t + i.x)
    );
    c += 1.0 / length(vec2(
      p.x / (sin(i.x + t) / inten),
      p.y / (cos(i.y + t) / inten)
    ));
  }

  c /= float(MAX_ITER);
  c = 1.1 - pow(c, 1.4);

  // Ethereal Sunset Palette
  vec3 baseBlue   = vec3(0.01, 0.29, 0.38); // Twilight base
  vec3 midRose    = vec3(0.62, 0.28, 0.31); // Sunset red
  vec3 pinkGlow = vec3(0.9, 0.3, 0.5); // Warmer, redder pink
  vec3 softPeach  = vec3(0.99, 0.70, 0.50); // Peach highlight

  float depth = uv.y;

  // Gradient from peach to rose to blue (bottom to top)
  vec3 baseBlend = mix(softPeach, midRose, depth);     // peach → rose
  baseBlend = mix(baseBlend, baseBlue, pow(depth, 1.3)); // rose → twilight

  // Swirls from base to pinkGlow
  vec3 swirlLayer = mix(baseBlend, pinkGlow, pow(c, 2.5));

  // Final peach glow added only at low swirl strength (near horizon)
  vec3 color = mix(swirlLayer, softPeach, pow(1.0 - depth, 2.0) * pow(c, 4.0));

  // Subtle shimmer
  float n = noise(uv * 5.0 + u_time * 0.1);
  color += 0.02 * (1.0 - color) * n * c;

  gl_FragColor = vec4(color, 1.0);
}
`;