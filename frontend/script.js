const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
let lastFrame = Date.now();

const WIDTH = 1280;
const HEIGHT = 720;

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
      // Gradient code
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

    let flip_x = $('.mirrorXCheckbox').is(":checked");

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
    await pose.send({image: videoElement});
  },
  width: WIDTH,
  height: HEIGHT
});
camera.start();