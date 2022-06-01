import os 
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
os.system('pip install opencv-python-headless')
import cv2
import tensorflow as tf
from tensorflow.keras.layers import BatchNormalization
from tensorflow.keras.layers import Conv2D
from tensorflow.keras.layers import Conv2DTranspose
from tensorflow.keras.layers import LeakyReLU
from tensorflow.keras.layers import Activation
from tensorflow.keras.layers import Flatten
from tensorflow.keras.layers import Dense
from tensorflow.keras.layers import Reshape
from tensorflow.keras.layers import Input
from tensorflow.keras.layers import MaxPooling2D
from tensorflow.keras.layers import UpSampling2D
from tensorflow.keras.layers import Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import Nadam 
from tensorflow.keras import layers

train= np.load("/netscratch/fosca/Autoencoder/Numpy_Images/Train/np_img_train.npy")
test = np.load("/netscratch/fosca/Autoencoder/Numpy_Images/Test/np_img_test.npy")

print("-------------------- Total Images --------------------")
np.random.shuffle(train)
print("Total size TRAIN Set:", train.shape)
print("-------------------- Total Images --------------------")
np.random.shuffle(test)
print("Total size TEST Set:", test.shape)

#2D-CNN Autoencoder (Latent Space = Flaten Vector):
# Parameters:
dropoutrate = 0.2
kernel_size_dec = (3,3)
kernel_size_enc = (5,5)
encoded_dim = 30

#Build Encoder.
encoder_CNN = Sequential([
Conv2D(filters = 8, kernel_size = kernel_size_enc, activation='relu', padding='same', kernel_initializer = "he_uniform", input_shape= (256, 256, 1)),
MaxPooling2D(2),
BatchNormalization(),
Dropout(dropoutrate),
Conv2D(filters = 16, kernel_size = kernel_size_enc, activation='relu', padding='same', kernel_initializer = "he_uniform"),
MaxPooling2D(2),
BatchNormalization(),
Dropout(dropoutrate),
Conv2D(filters = 32, kernel_size = kernel_size_enc, activation='relu', padding='same', kernel_initializer = "he_uniform"),
MaxPooling2D(2),
BatchNormalization(),
Dropout(dropoutrate),
Flatten(),
Dense(encoded_dim, activation='relu', kernel_initializer = "he_uniform"),
])

#Build Decoder.
decoder_CNN = Sequential ([
Dense(32768, activation='relu', kernel_initializer = "he_uniform", input_shape=(encoded_dim,)),
Reshape((32,32,32)),
Conv2DTranspose(filters = 64, kernel_size = kernel_size_dec, padding='same', activation='relu', kernel_initializer = "he_uniform"),
UpSampling2D(2),
BatchNormalization(),
Conv2DTranspose(filters = 32, kernel_size = kernel_size_dec, padding='same', activation='relu', kernel_initializer = "he_uniform"),
UpSampling2D(2),
BatchNormalization(),
Conv2DTranspose(filters = 16, kernel_size = kernel_size_dec, padding='same', activation='relu', kernel_initializer = "he_uniform"),
UpSampling2D(2),
BatchNormalization(),
Conv2DTranspose(filters=1, kernel_size = kernel_size_dec, padding="same", activation = "sigmoid", kernel_initializer = "he_uniform")
])

#Merge models to Autoencoder.
input = Input(shape=(train.shape[1], train.shape[2], train.shape[3]))
output = encoder_CNN(input)
output = decoder_CNN(output)
conv_autoencoder_CNN = Model(inputs = input, outputs = output)
nadam = Nadam(learning_rate=0.0001, beta_1=0.9, beta_2=0.999, epsilon=1e-07)
conv_autoencoder_CNN.compile(optimizer=nadam, loss='mse', metrics=["mse"])
conv_autoencoder_CNN.summary()
conv_autoencoder_CNN.layers[1].summary()
conv_autoencoder_CNN.layers[2].summary()

modelsavefile = "/netscratch/fosca/Autoencoder/Model_Checkpoints/CNN_autoencoder_checkpoint.h5"
cb_checkpoint = tf.keras.callbacks.ModelCheckpoint(modelsavefile, monitor='val_mse', mode='min', verbose=1,save_weights_only=False,save_best_only=True)
cb_earlystop = tf.keras.callbacks.EarlyStopping(patience=100,monitor='val_mse',mode='min',verbose=1,restore_best_weights=True)
history = conv_autoencoder_CNN.fit(train, train, batch_size=256, epochs=3500, validation_split=0.2, callbacks=[cb_checkpoint, cb_earlystop])

conv_autoencoder_CNN.save('/home/fosca/Models/autoencoder_CNN_v2.h5')
decoder_CNN.save('/home/fosca/Models/decoder_CNN_v2.h5')
encoder_CNN.save('/home/fosca/Models/encoder_CNN_v2.h5')

#Calculate Test dataset RMSE - Conv Autoencoder (Latent Space = Vector)
test_pred = conv_autoencoder_CNN.predict(test)
#test_pred = test_pred.transpose(0,2,1)
#test = test.transpose(0,2,1)
print("-------------------- Test Evaluation Results--------------------")
test_mae_loss = np.sqrt(np.mean(((test_pred - test)*(test_pred - test)), axis=0)).mean()
print("Test MAE: ", test_mae_loss)
