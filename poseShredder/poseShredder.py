

import re
import cv2
import mediapipe as mp
from pathlib import Path
from os import listdir
from os.path import isfile, join
import glob
import csv

mp_pose = mp.solutions.pose

# Folder to store temp frames
TEMP_FOLDER = "./temp"
# Output
OUTPUT_FOLDER = "./output"
# Video directory to search for video input recursivley
VIDEO_DIRECTORY = "./videos/"
# Extension to look for
VIDEO_EXTENSION = "avi"

# Get landmark info
landmarks = []
for lmk in mp_pose.PoseLandmark:
    landmarks.append(str(lmk).split('.')[1])

# Get all video files
video_files = glob.glob(VIDEO_DIRECTORY + '/**/*.' + VIDEO_EXTENSION, recursive=True)
# video_files = ["./videos/PushUps/v_PushUps_g17_c02.avi"]

# Make temp and output folder
Path(TEMP_FOLDER).mkdir(parents=True, exist_ok=True)
Path(OUTPUT_FOLDER).mkdir(parents=True, exist_ok=True)

# Loop over every video
for idx, video_file in enumerate(video_files):

    print("Processing " + video_file + "...")

    csv_file_name = OUTPUT_FOLDER + "/" + video_file.split("/")[-1].split("\\")[-1].split(".")[0] + '.csv'

    # Open CSV File
    with open(csv_file_name, 'w', newline="") as csv_file:

        writer = csv.writer(csv_file)

        # Write header
        header = ["frame"]
        for lmk in landmarks:
            header.append(lmk + ".x")
            header.append(lmk + ".y")
            header.append(lmk + ".z")
            header.append(lmk + ".v")
        writer.writerow(header)

        # Break up video into frames
        frames = []
        vidcap = cv2.VideoCapture(video_file)
        success,image = vidcap.read()
        count = 0
        while success:
            frame_name = "%s/frame%d.jpg" % (TEMP_FOLDER, count)
            frames.append(frame_name)
            cv2.imwrite(frame_name, image)     # save frame as JPEG file      
            success,image = vidcap.read()
            count += 1

        # Get all points from frame
        with mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5) as pose:

            for idx, file in enumerate(frames):
                image = cv2.imread(file)
                image_height, image_width, _ = image.shape
                results = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

                if results.pose_landmarks == None:
                    writer.writerow([idx])
                    continue

                row = [idx]
                for i in range(len(landmarks)):
                    row.append(results.pose_landmarks.landmark[i].x)
                    row.append(results.pose_landmarks.landmark[i].y)
                    row.append(results.pose_landmarks.landmark[i].z)
                    row.append(results.pose_landmarks.landmark[i].visibility)

                writer.writerow(row)

    print("Wrote " + csv_file_name)

print("Done.")