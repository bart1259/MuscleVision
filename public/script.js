const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const canvasCtx3d = canvasElement.getContext('webgl');
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
let lastFrame = Date.now();
let loadingModel = true;

const WIDTH = 1280
const HEIGHT = 720;
canvasElement.width = WIDTH;
canvasElement.height = HEIGHT;

function render(frame, landmarks, ctx, flip_x) {

    // Draw Frame
    if(flip_x) {
        canvasCtx.save();
        canvasCtx.scale(-1, 1);
        canvasCtx.drawImage(frame, 0, 0, -WIDTH, HEIGHT)
        canvasCtx.restore();
    } else {
        canvasCtx.drawImage(frame, 0, 0, WIDTH, HEIGHT);
    }

    // If there are no landmarks don't render points
    if(!landmarks){
        return;
    }

    // Draw points
    ctx.lineWidth = 5;
    landmarks.forEach(e => {
        ctx.beginPath();
        ctx.strokeStyle = `rgb(255, ${Math.round(255 * e.visibility)}, ${Math.round(255 * e.visibility)})`;
        ctx.arc(WIDTH * e.x, HEIGHT * e.y, 5, 0, 2 * Math.PI);
        ctx.stroke();
    })

    // Draw connections
    ctx.lineWidth = 2
    POSE_CONNECTIONS.forEach(line => {
      // Gradient calculations
      let gradient = ctx.createLinearGradient(WIDTH * landmarks[line[0]].x, HEIGHT * landmarks[line[0]].y, WIDTH * landmarks[line[1]].x, HEIGHT * landmarks[line[1]].y);
      ctx.strokeStyle = gradient;
      let col1 = `rgb(255, ${Math.round(255 * landmarks[line[0]].visibility)}, ${Math.round(255 * landmarks[line[0]].visibility)})`;
      let col2 = `rgb(255, ${Math.round(255 * landmarks[line[1]].visibility)}, ${Math.round(255 * landmarks[line[1]].visibility)})`;
      gradient.addColorStop("0", col1);
      gradient.addColorStop("1.0", col2);

      // Draw line
      ctx.beginPath();
      ctx.moveTo(WIDTH * landmarks[line[0]].x, HEIGHT * landmarks[line[0]].y);
      ctx.lineTo(WIDTH * landmarks[line[1]].x, HEIGHT * landmarks[line[1]].y);
      ctx.stroke();
    })
}

function drawFPS(ctx){
    // FPS calculations
    let dt = (Date.now() - lastFrame) / 1000.0;
    lastFrame = Date.now()
    let fps = 1 / dt;
    ctx.font = '25px consolas'
    ctx.fillStyle = 'rgb(0, 255, 0)'
    ctx.fillText(`FPS: ${fps.toFixed(1)}`, 10, 26);
}

function onResults(results) {
    if(loadingModel) {
      loadingModel = false;
    }

    let flip_x = true;
    //TODO: Fixme
    //let flip_x = $('.mirrorXCheckbox').is(":checked");

    //Draw frame
    if(flip_x && results.poseLandmarks) {
        results.poseLandmarks.forEach(e => {
            e.x = 1- e.x;
            return e;
        })
    }

    render(results.image, results.poseLandmarks, canvasCtx, flip_x);
    drawFPS(canvasCtx);
}

async function loadModel(params) {
  const pose = new Pose({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  }});
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  pose.onResults(onResults);

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      console.log("Found frame")
      await pose.send({image: videoElement});
    },
    width: WIDTH,
    height: HEIGHT
  });
  console.log("Starting camera...");
  camera.start();
  console.log("Camera started!")
}
loadModel()

/////////////////// LOADING SCREEN ////////////////////

const SPHERE_CENTER = math.matrix([0,0,-8])
let tick = 0;
loadingInterval = setInterval(() => {
  if(loadingModel == false) {
    clearInterval(loadingInterval)
  }

  // Motion blur
  canvasCtx.fillStyle = 'rgba(26, 26, 26, 0.7)';
  canvasCtx.fillRect(0,0,WIDTH,HEIGHT)

  canvasCtx.fillStyle = `red`;

  for (let i = 0; i < dots.length; i++) {

    dots[i] = math.rotate(dots[i], 0.01, [0,-1,0])
    const dot = math.add(dots[i], SPHERE_CENTER)._data

    let loc;
    if(loc = doProjection(dot)){
      canvasCtx.beginPath();
      canvasCtx.arc(loc._data[0], loc._data[1], 50 / math.norm(dot), 0, 2.0 * Math.PI);
      canvasCtx.fill();
    }
  }

  tick++;

}, 1000 / 60)

const POINT_COUNT = 200
let dots = dumbellPoints
while (dots.length >= POINT_COUNT) {
  dots.splice(Math.round(dots.length * Math.random()) ,1)
}

// SPHERE GENERATION
// let dots = []
// for (let i = 0; i < 200; i++) {
//   dots[i] = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
//   dots[i] = math.multiply(dots[i], 1.0 / math.norm(dots[i]))
// }

function doProjection(pt) {
  npt = math.clone(pt)
  npt.push(1)
  let ret = math.multiply(projMatrix, math.clone(npt))
  if(ret._data[2] < 0) {
    return false;
  }
  ret = math.multiply(ret, 1/ret._data[3])
  ret._data[0] = (ret._data[0] * WIDTH / 2) + (WIDTH / 2)
  ret._data[1] = (ret._data[1] * HEIGHT / 2) + (HEIGHT / 2)

  return ret
}

function createProjectionMatrix() {
  let fov = 45;
  let sx = 1/Math.tan((fov / 2) * (Math.PI / 180))
  let sy = 1/Math.tan((fov * HEIGHT / WIDTH / 2) * (Math.PI / 180))
  return math.matrix([
    [sx,0,0,0],
    [0,sy,0,0],
    [0,0,-(FAR+NEAR)/(FAR-NEAR),-2*(FAR*NEAR)/(FAR-NEAR)],
    [0,0,-1,0]
  ])
}

const FAR = 1.0;
const NEAR = 0.01;
projMatrix = createProjectionMatrix()