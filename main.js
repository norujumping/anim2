// setup canvas

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
ctx.filter = 'blur(4px)';

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

function initWindow() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
function canvas_arrow(context, fromx, fromy, dx, dy) {
  var headlen = 10; // length of head in pixels
  var tox = dx + fromx;
  var toy = dy + fromy;
  var angle = Math.atan2(dy, dx);
  context.beginPath();
  context.strokeStyle = 'black';
  context.lineWidth = 2;
  context.moveTo(fromx, fromy);
  context.lineTo(tox, toy);
  context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
  context.moveTo(tox, toy);
  context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
  context.stroke(); 
}

// Parse and define vector field
const parser = math.parser()
class VectorField {
  constructor(Vx_eq, Vy_eq) {
    this.Vx_eq = Vx_eq;
    this.Vy_eq = Vy_eq;

    [this.Vx, this.Vy] = this.parseEquation();
  }

  parseEquation(){
    parser.evaluate('V1(x,y)='+this.Vx_eq);
    parser.evaluate('V2(x,y)='+this.Vy_eq);
    // use mathjax for enterpreting latex equation
    let Vx = (x,y) => parser.evaluate(`V1(${x},${y})`);
    let Vy = (x,y) => parser.evaluate(`V2(${x},${y})`);
    return [Vx, Vy];
  }

  update_Vx(Vx_eq) {
    this.Vx_eq = Vx_eq;
    // this.Vy_eq = Vy_eq;
    [this.Vx, this.Vy] = this.parseEquation();
  }
  update_Vy(Vy_eq) {
    // this.Vx_eq = Vx_eq;
    this.Vy_eq = Vy_eq;
    [this.Vx, this.Vy] = this.parseEquation();

  }
}

// Drawing Here
class Grid {
  min_grid_size = 45;
  grid_levels = [0.1, 0.125, 0.2, 1/35, 0.5, 1, 2, 3, 5, 8, 10];

  constructor(xmin, xmax, ymin, ymax, xn, yn, v) {
    this.xmin = xmin;
    this.xmax = xmax;
    this.ymin = ymin;
    this.ymax = ymax;
    this.adjust_minmax();
    this.xn = 2 * xn;
    this.yn = 2 * yn;
    this.v = v;

    this.origin_x = width/2;
    this.origin_y = height *2 /3;
    this.ratio_c2g = null;
  }
  adjust_minmax(){
    let adjust_ratio = ((this.xmax - this.xmin) / (this.ymax - this.ymin)) / (width/height)
    if(adjust_ratio > 1){  // our height can contain more coordinate
      this.ymax *= adjust_ratio;
      this.ymin *= adjust_ratio;
    } else {
      this.xmax *= 1/adjust_ratio;
      this.xmin *= 1/adjust_ratio;
    }
  }
  draw(vectorField) {
    // this.draw_axis();
    this.draw_grid();
    this.draw_vf(vectorField);
  }

  draw_vf(vectorField){
    let grid_size = this.grid_size;
    let x, y, x_canv, y_canv;
    let vx, vy;
    
    let vf_list = [];
    for(let i=0; this.origin_x + grid_size*i < width; i++){
      for(let j=0; this.origin_y + grid_size*j < height; j++) {
        x_canv = this.origin_x + grid_size * i;
        y_canv = this.origin_y + grid_size * j;
        [x,y] = this.getGridCoord(x_canv, y_canv);
        vx = vectorField.Vx(x,y);
        vy = vectorField.Vy(x,y);
        vf_list.push([x_canv, y_canv, vx, vy]);
      }
      for(let j=1; this.origin_y - grid_size*j > 0; j++) {
        x_canv = this.origin_x + grid_size * i;
        y_canv = this.origin_y - grid_size * j;
        [x,y] = this.getGridCoord(x_canv, y_canv);
        vx = vectorField.Vx(x,y);
        vy = vectorField.Vy(x,y);
        vf_list.push([x_canv, y_canv, vx, vy]);
      }
    }
    for(let i=1; this.origin_x - grid_size*i > 0; i++){
      for(let j=0; this.origin_y + grid_size*j < height; j++) {
        x_canv = this.origin_x - grid_size * i;
        y_canv = this.origin_y + grid_size * j;
        [x,y] = this.getGridCoord(x_canv, y_canv);
        vx = vectorField.Vx(x,y);
        vy = vectorField.Vy(x,y);
        vf_list.push([x_canv, y_canv, vx, vy]);
      }
      for(let j=1; this.origin_y - grid_size*j > 0; j++) {
        x_canv = this.origin_x - grid_size * i;
        y_canv = this.origin_y - grid_size * j;
        [x,y] = this.getGridCoord(x_canv, y_canv);
        vx = vectorField.Vx(x,y);
        vy = vectorField.Vy(x,y);
        vf_list.push([x_canv, y_canv, vx, vy]);
      }
    }
    let v_max = 0;
    let v, d;
    for(let i=0; i < vf_list.length; i++) {
      v = vf_list[i];
      d = v[2]**2 + v[3]**2;
      if(v_max < d) v_max = d;
    }
    let v_normalizer = 200 / Math.sqrt(v_max);
    // let v_normalizer = 0.10;
    for(let i=0; i < vf_list.length; i++) {
      v = vf_list[i]
      canvas_arrow(ctx, v[0], v[1], v[2] * v_normalizer, - v[3] * v_normalizer);
      // canvas_arrow(ctx, v[0], v[1], v[2], v[3]);
    }
  }
  
  setGridSize(){ // remove xmin, xmax
    this.grid_level = null;
    this.grid_size = null;
    for(let i=this.grid_levels.length-1; i>=0; i--){
      let level = this.grid_levels[i];
      let gs_x = width / ((this.xmax-this.xmin)/level);
      let gs_y = height / ((this.ymax-this.ymin)/level);
      let gs = Math.min(gs_x, gs_y);
      if(gs >= this.min_grid_size){
        this.grid_level = level;
        this.grid_size = gs;
      }
    }
    this.ratio_c2g = this.grid_level/this.grid_size;
    this.ratio_g2c = 1/this.ratio_c2g;
    // console.log(this.grid_level, this.grid_size)
  }

  draw_axis() {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    // x-axis
    ctx.moveTo(0, this.origin_y);
    ctx.lineTo(width, this.origin_y);
    // y-axis
    ctx.moveTo(this.origin_x, 0);
    ctx.lineTo(this.origin_x, height);
    ctx.stroke();
  }
  draw_grid() {
    this.draw_axis();
    this.setGridSize();
    let grid_size = this.grid_size; // 25 pixel fixed size grid;
    let grid_level = this.grid_level;
    if(grid_size == null) {
      return;
    }

    // draw grid parallel to x-axis
    for(let i=1; this.origin_y + grid_size*i < height; i++){
      // draw line above x-axis
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#a9a9a9";
      ctx.moveTo(0, this.origin_y + grid_size*i);
      ctx.lineTo(width, this.origin_y + grid_size*i);
      ctx.stroke();
    }
    for(let i=1; this.origin_y - grid_size*i > 0; i++){
      // draw line above x-axis
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#a9a9a9";
      ctx.moveTo(0, this.origin_y - grid_size*i);
      ctx.lineTo(width, this.origin_y - grid_size*i);
      ctx.stroke();
    }

    // draw grid parallel to y-axis
    for(let i=1; this.origin_x + grid_size*i < width; i++){
      // draw line above x-axis
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#a9a9a9";
      ctx.moveTo(this.origin_x + grid_size*i, 0);
      ctx.lineTo(this.origin_x + grid_size*i, height);
      ctx.stroke();
    }
    for(let i=1; this.origin_x - grid_size*i > 0; i++){
      // draw line above x-axis
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#a9a9a9";
      ctx.moveTo(this.origin_x - grid_size*i, 0);
      ctx.lineTo(this.origin_x - grid_size*i, height);
      ctx.stroke();
    }

    // draw ticks along x-axis
    let text;
    for(let i=0; this.origin_x + grid_size*i < width; i++){
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000000";

      // Draw a tick mark 6px long (-3 to 3)
      ctx.moveTo(this.origin_x + grid_size*i, this.origin_y-6);
      ctx.lineTo(this.origin_x + grid_size*i, this.origin_y+6);
      ctx.stroke();

      // Text value at that point
      ctx.font = '15px Arial';
      ctx.textAlign = 'start';
      ctx.fillStyle = "#696969";
      text = (grid_level*i)
      if(grid_level < 1) text = text.toPrecision(2);
      ctx.fillText(text, this.origin_x + grid_size*i+2, this.origin_y+20);
    } 
    for(let i=1; this.origin_x - grid_size*i > 0; i++){
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000000";

      // Draw a tick mark 6px long (-3 to 3)
      ctx.moveTo(this.origin_x - grid_size*i, this.origin_y-6);
      ctx.lineTo(this.origin_x - grid_size*i, this.origin_y+6);
      ctx.stroke();

      // Text value at that point
      ctx.font = '15px Arial';
      ctx.textAlign = 'start';
      ctx.fillStyle = "#696969";
      text = (-grid_level*i)
      if(grid_level < 1) text = text.toPrecision(2);
      ctx.fillText(text, this.origin_x - grid_size*i+2, this.origin_y+20);
    } 
    // draw ticks along y-axis
    for(let i=1; this.origin_y + grid_size*i < height; i++){
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000000";

      // Draw a tick mark 6px long (-3 to 3)
      ctx.moveTo(this.origin_x-6, this.origin_y + grid_size*i);
      ctx.lineTo(this.origin_x+6, this.origin_y + grid_size*i);
      ctx.stroke();

      // Text value at that point
      ctx.font = '15px Arial';
      ctx.textAlign = 'end';
      ctx.fillStyle = "#696969";
      text = (-grid_level*i)
      if(grid_level < 1) text = text.toPrecision(2);
      ctx.fillText(text, this.origin_x-10, this.origin_y + grid_size*i+15);
    } 
    for(let i=1; this.origin_y - grid_size*i > 0; i++){
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000000";

      // Draw a tick mark 6px long (-3 to 3)
      ctx.moveTo(this.origin_x-6, this.origin_y- grid_size*i);
      ctx.lineTo(this.origin_x+6, this.origin_y- grid_size*i);
      ctx.stroke();

      // Text value at that point
      ctx.font = '15px Arial';
      ctx.textAlign = 'end';
      ctx.fillStyle = "#696969";
      text = (grid_level*i)
      if(grid_level < 1) text = text.toPrecision(2);
      ctx.fillText(text , this.origin_x-10, this.origin_y - grid_size*i+15);
    } 
    ctx.lineWidth=1;
  }
  getCanvasCoord(x, y) {
    let x_canv = x * this.ratio_g2c + this.origin_x;
    let y_canv = -y * this.ratio_g2c + this.origin_y;
    return [x_canv, y_canv];
  }

  getGridCoord(x_canv, y_canv) {
    let x = (x_canv - this.origin_x) * this.ratio_c2g;
    let y = -(y_canv - this.origin_y) * this.ratio_c2g;
    return [x,y];
  }
}

// Dynamic System
class DynamicSystem {
  constructor(x, y, vectorField, grid, dt=0.01, nIter=500) {
    this.x0 = x;
    this.y0 = y;
    this.vf = vectorField;
    this.grid = grid;
    this.dt = dt;
    this.trajs = {};
    this.nIter = nIter;
    
    this.selected = false;
    this.compute();
  }
  compute() {
    this.compute_euler();
    this.compute_midpoint();
    this.compute_rk4();
  }
  draw() {
    this.drawStartingPoint();
    this.drawTrajectory(this.trajs['euler'], 4, 'orange')
    this.drawTrajectory(this.trajs['midpoint'], 4, 'green');
    this.drawTrajectory(this.trajs['rk4'], 2, 'purple');
  }
  compute_euler() {
    let traj = [];
    let [x,y] = [this.x0, this.y0];
    traj.push([x,y])
    for(let i=0; i < this.nIter; i++) {
      let [dfx, dfy] = this.deriv(x,y);
      x += dfx * this.dt;
      y += dfy * this.dt;
      traj.push([x, y]);
    }
    this.trajs['euler'] = traj;
  }
  compute_midpoint(){
    let traj = [];
    let [x,y] = [this.x0, this.y0];
    traj.push([x,y]);
    for(let i=0; i < this.nIter; i++) {
      let [dfx, dfy] = this.deriv(x,y);
      let xmid = x + 1/2 * dfx * this.dt;
      let ymid = y + 1/2 * dfy * this.dt;
      let [dfx_mid, dfy_mid] = this.deriv(xmid, ymid);
      x += dfx_mid * this.dt;
      y += dfy_mid * this.dt;
      traj.push([x,y]);
    }
    this.trajs['midpoint'] = traj;
  }
  compute_rk4(){
    let traj = [];
    let [x,y] = [this.x0, this.y0];
    traj.push([x,y]);
    for(let i=0; i < this.nIter; i++) {
      let [dfx1, dfy1] = this.deriv(x,y);
      let x1 = x + 1/2 * dfx1 * this.dt;
      let y1 = y + 1/2 * dfy1 * this.dt;
      let [dfx2, dfy2] = this.deriv(x1,y1);
      let x2 = x + 1/2 * dfx2 * this.dt;
      let y2 = y + 1/2 * dfy2 * this.dt;
      let [dfx3, dfy3] = this.deriv(x2,y2);
      let x3 = x + dfx3 * this.dt;
      let y3 = y + dfy3 * this.dt;
      let [dfx4, dfy4] = this.deriv(x3,y3);
      x = x + 1/6 * (dfx1 + 2*dfx2 + 2*dfx3 + dfx4) * this.dt;
      y = y + 1/6 * (dfy1 + 2*dfy2 + 2*dfy3 + dfy4) * this.dt;
      traj.push([x,y]);
    }
    this.trajs['rk4'] = traj;
  }

  deriv(x, y) {
    return [this.vf.Vx(x,y), this.vf.Vy(x,y)];
  }
  
  drawTrajectory(traj, width, color){
    // let x0, y0, x1, y1;
    for(let i=0; i < traj.length-1; i++) {
      ctx.beginPath();
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      let [x0,y0] = traj[i];
      let [x1,y1] = traj[i+1];
      let [x_c0, y_c0] = this.grid.getCanvasCoord(x0,y0);
      let [x_c1, y_c1] = this.grid.getCanvasCoord(x1,y1);

      ctx.moveTo(x_c0, y_c0);
      ctx.lineTo(x_c1, y_c1);
      // ctx.lineTo(x1, y1);
      ctx.stroke();
      // [x0,y0] = [x1,y1];
    }
  }
  drawStartingPoint() {
    if(this.selected) {
      ctx.beginPath();  // state that we want to draw
      ctx.fillStyle = 'red';
      let [x0, y0] = this.grid.getCanvasCoord(this.x0, this.y0);
      ctx.arc(x0, y0, 15, 0, 2 * Math.PI);
      ctx.fill();    
    } else {
      ctx.beginPath();  // state that we want to draw
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 4;
      let [x0, y0] = this.grid.getCanvasCoord(this.x0, this.y0);
      ctx.arc(x0, y0, 10, 0, 2 * Math.PI);
      ctx.stroke();    
    }
  }
}


// User Interface
function init() {
  initWindow();
  // ctx.fillStyle = 'rgba(0,0,0.25)';
  ctx.fillStyle = '#f0f9f9';
  // ctx.fillStyle = 'white';
  ctx.fillRect(0,0,width, height);
}
function updateScreen() {
  init();
  grid.draw(vf);
  ds.draw();
}


document.getElementsByTagName('body')[0].onresize = function() {
  updateScreen();
}
let grid = new Grid(-7, 7, -7, 7, 8, 8, 10);
let vf = new VectorField("x^2 - y^2 - 4", "2*x*y");
// let vf = new VectorField("2*y", "-2*x");
let ds = new DynamicSystem(3, 1, vf, grid);

// grid.setControl();
init();
grid.draw(vf);

ds.draw();

const EMPTY = 0;
const NEW_CLICK = 1;
const SEL_CLICK = 2;
const SEL_THRESHOLD = 20;

let setControl= function (grid, ds, ui){
  let _this = grid;
  let click_state = EMPTY;
  canvas.onwheel = function(e) {
    // console.log(e.x, e.y, e.deltaY > 0 ? 'scroll out' : 'scroll in');
    let scale = 1;
    if(e.deltaY > 0) scale = 1.1;
    if(e.deltaY < 0) scale = 1/1.1;

    _this.xmax = e.x + (_this.xmax - e.x) * scale;
    _this.xmin = e.x + (_this.xmin - e.x) * scale;
    _this.ymax = e.y + (_this.ymax - e.y) * scale;
    _this.ymin = e.y + (_this.ymin - e.y) * scale;
    _this.origin_x = e.x + (_this.origin_x - e.x) * scale;
    _this.origin_y = e.y + (_this.origin_y - e.y) * scale;
    updateScreen();
  }

  
  canvas.onmousedown = function(e) {
    _this.clicked = true;
    _this.lastPoint = [e.x, e.y]
    let [x0, y0] = grid.getCanvasCoord(ds.x0, ds.y0);
    if ((e.offsetX - x0)**2 + (e.offsetY - y0)**2 <= SEL_THRESHOLD**2) {
      click_state = SEL_CLICK;
      ds.selected = true;
      updateScreen();
    } else click_state = NEW_CLICK;
  }
  canvas.onmouseup = function(e) {
    _this.clicked=false;
    click_state = EMPTY;
    ds.selected = false;
    updateScreen();
    // console.log(_this.xmax, _this.xmin, _this.ymax, _this.ymin)
  }
  canvas.onmousemove = function(e) {
    if(click_state == EMPTY) {
      return;
    } else if (click_state == SEL_CLICK) {
      // let [x0, y0] = grid.getCanvasCoord(ds.x0, ds.y0)
      // let [c_x0, c_y0] = [x0 +e.x-_this.lastPoint[0], y0 + e.y-_this.lastPoint[1]];
      ds.x0 += grid.ratio_c2g * (e.x - _this.lastPoint[0]);
      ds.y0 -= grid.ratio_c2g * (e.y - _this.lastPoint[1]);
      
      ds.compute();
      initX.value = ds.x0;
      initY.value = ds.y0;

    } else if(click_state == NEW_CLICK) {
      // drag
      let dx = e.x - _this.lastPoint[0];
      let dy = e.y - _this.lastPoint[1];

      _this.origin_x += dx;
      _this.origin_y += dy;

      dx *= _this.ratio_c2g;
      dy *= _this.ratio_c2g;
      
      _this.xmax -= dx;
      _this.xmin -= dx;
      _this.ymax += dy;
      _this.ymin += dy;
    }
    _this.lastPoint = [e.x, e.y];
    updateScreen();
  }
}

setControl(grid, ds);

// keyboard UI
let Vx_input = document.getElementById("Vx_expr");
let Vy_input = document.getElementById("Vy_expr");
Vx_input.value = vf.Vx_eq;
Vy_input.value = vf.Vy_eq;
Vx_input.onkeyup = (e) => {
  vf.update_Vx(Vx_input.value)
  ds.compute();
  updateScreen();
}
Vy_input.onkeyup = (e) => {
  vf.update_Vy(Vy_input.value)
  ds.compute();
  updateScreen();
}

let initX = document.getElementById("initX");
let initY = document.getElementById("initY");
initX.value = ds.x0;
initY.value = ds.y0;
initX.onkeyup = (e) => {
  ds.x0 = parseFloat(initX.value)
  ds.compute();
  updateScreen();
}
initY.onkeyup = (e) => {
  ds.y0 = parseFloat(initY.value)
  ds.compute();
  updateScreen();
}

let example = function(i) {
  let Vx_eq, Vy_eq, dt;
  if (i==1) {
    Vx_eq = "-2*y"
    Vy_eq = "2*x"
    dt = 0.4
  } else if (i==2) {
    Vx_eq = "-2*y^2"
    Vy_eq = "2*x"
    dt = 0.1
  } else if (i==3) {
    Vx_eq = "x+y"
    Vy_eq = "x-y"
    dt = 0.1
  }
  vf.update_Vx(Vx_eq)
  vf.update_Vy(Vy_eq)
  ds.dt = dt;
  ds.compute();
  updateScreen();
  Vx_input.value = vf.Vx_eq;
  Vy_input.value = vf.Vy_eq;
  UIstepSize.innerText = dt;
  UIstepSizeSlider.value = 100 + Math.log10(dt) * 100 / 3
}

UIstepSizeSlider = document.getElementById('stepSizeSlider');
UIstepSize = document.getElementById('stepSize');

UIstepSizeSlider.oninput = ()=>{
  stepSize = 10 ** (UIstepSizeSlider.value * 3 / 100 -3);
  UIstepSize.innerText = stepSize.toFixed(4);
  ds.dt = stepSize;
  ds.compute();
  updateScreen();
}

UInIterSlider = document.getElementById('nIterSlider');
UInIter = document.getElementById('nIter');

UInIterSlider.oninput = ()=>{
  nIter = UInIterSlider.value;
  UInIter.innerText = nIter;
  ds.nIter = nIter;
  ds.compute();
  updateScreen();
}