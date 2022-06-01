import os 
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
os.system('pip install opencv-python-headless')
import cv2

### Preprocessing of TRAIN Images ###
n_samples_train = 65000
i = 0
train = []
for i in range(n_samples_train-2):
    # Change name of file to read.
    img_number = str(i+1)
    img_path = "/netscratch/fosca/Autoencoder/Image_FacePoints_Train/Img_Train" + img_number + ".png"
    a = cv2.resize(cv2.imread(img_path, cv2.IMREAD_GRAYSCALE), (256, 256), interpolation = cv2.INTER_CUBIC)
    
    a = a[..., np.newaxis]
    train.append(a)

train = np.asarray(train)
train = train/255.

print("-------------------- Total Images --------------------")
np.random.shuffle(train)
print("Total size TRAIN Set:", train.shape)

### Preprocessing of TEST Images ###
n_samples_test = 1380
i = 0
test = []
for i in range(n_samples_test-2):
    # Change name of file to read.
    img_number = str(i+1)
    img_path = "/netscratch/fosca/Autoencoder/Image_FacePoints_Test/Img_Test" + img_number + ".png"
    a = cv2.resize(cv2.imread(img_path, cv2.IMREAD_GRAYSCALE), (256, 256), interpolation = cv2.INTER_CUBIC)
    a = a[..., np.newaxis]
    test.append(a)

test = np.asarray(test)
test = test/255.

#Saving np array of train/test images.
outfile_train = "/netscratch/fosca/Autoencoder/Numpy_Images/Train/np_img_train.npy"
outfile_test = "/netscratch/fosca/Autoencoder/Numpy_Images/Test/np_img_test.npy"
np.save(outfile_train, train)
np.save(outfile_test, test)