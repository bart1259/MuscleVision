const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];

function drawPoints(frame, landmarks, ctx) {
    //Draw frame
    ctx.drawImage(frame, 0, 0, 1280, 720)
    
    //Loop over every point
    landmarks.forEach(e => {
        ctx.beginPath();
        ctx.arc(1280 * e.x, 720 * e.y, 5, 0, 2 * Math.PI);
        ctx.stroke();
    })
}

function onResults(results) {
    console.log(results);
    if(results.poseLandmarks){
        drawPoints(results.image, results.poseLandmarks, canvasCtx);
    }
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
  width: 1280,
  height: 720
});
camera.start();